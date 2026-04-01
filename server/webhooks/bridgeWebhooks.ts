import { Express, Request, Response } from "express";
import express from "express";
import twilio from "twilio";
import { getDb } from "../db";
import {
  bridgeEvents,
  bridgeConferences,
  bridgeGreeterQueue,
  bridgeParticipants,
  bridgeCallRecordings,
  bridgeOperatorActions,
  bridgeQaQuestions,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const ABLY_API_KEY = process.env.ABLY_API_KEY ?? "";
const ABLY_REST_URL = "https://rest.ably.io";

function resolveBaseUrl(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:3000";
}

async function ablyPublish(channel: string, name: string, data: unknown) {
  if (!ABLY_API_KEY) return;
  const url = `${ABLY_REST_URL}/channels/${encodeURIComponent(channel)}/messages`;
  const body = JSON.stringify({ name, data: JSON.stringify(data) });
  const auth = Buffer.from(ABLY_API_KEY).toString("base64");
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    console.log("[Bridge Webhook] Ably publish failed:", (e as Error).message);
  }
}

async function publishToBridge(conferenceId: number, eventType: string, data: any) {
  await ablyPublish(`bridge-${conferenceId}`, eventType, data);
}

async function findBridgeEventByAccessCode(accessCode: string) {
  const db = await getDb();
  const [event] = await db.select().from(bridgeEvents)
    .where(and(
      eq(bridgeEvents.accessCode, accessCode),
      sql`${bridgeEvents.status} NOT IN ('completed', 'cancelled')`,
    ));
  return event ?? null;
}

async function findMainConference(bridgeEventId: number) {
  const db = await getDb();
  const [conf] = await db.select().from(bridgeConferences)
    .where(and(
      eq(bridgeConferences.bridgeEventId, bridgeEventId),
      eq(bridgeConferences.type, "main"),
    ));
  return conf ?? null;
}

async function findGreenRoom(bridgeEventId: number) {
  const db = await getDb();
  const [conf] = await db.select().from(bridgeConferences)
    .where(and(
      eq(bridgeConferences.bridgeEventId, bridgeEventId),
      eq(bridgeConferences.type, "green_room"),
    ));
  return conf ?? null;
}

function validateTwilioSignature(req: Request): boolean {
  if (!TWILIO_AUTH_TOKEN) return true;
  const sig = req.headers["x-twilio-signature"] as string | undefined;
  if (!sig) return false;
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return twilio.validateRequest(TWILIO_AUTH_TOKEN, sig, fullUrl, req.body ?? {});
}

function twilioAuthMiddleware(req: Request, res: Response, next: Function) {
  if (!TWILIO_AUTH_TOKEN) {
    next();
    return;
  }
  if (!validateTwilioSignature(req)) {
    console.warn(`[Bridge Webhooks] Invalid Twilio signature on ${req.path} — rejecting`);
    res.sendStatus(403);
    return;
  }
  next();
}

export function registerBridgeWebhooks(app: Express) {
  const urlencoded = express.urlencoded({ extended: false });
  const BASE = "/api/bridge";
  console.log("[Bridge Webhooks] Registering at", BASE);

  app.post(`${BASE}/inbound`, urlencoded, async (req: Request, res: Response) => {
    const from = req.body?.From ?? "";
    const to = req.body?.To ?? "";
    const callSid = req.body?.CallSid ?? "";
    console.log(`[Bridge IVR] Inbound call from=${from} to=${to} callSid=${callSid}`);

    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      { voice: "Polly.Joanna" },
      "Welcome to the CuraLive Conference Bridge. Please enter your conference access code, followed by the hash key."
    );

    const gather = twiml.gather({
      numDigits: 8,
      action: `${BASE}/access-code`,
      method: "POST",
      timeout: 15,
      finishOnKey: "#",
    });
    gather.say(
      { voice: "Polly.Joanna" },
      "Please enter your eight-digit access code now."
    );

    twiml.say({ voice: "Polly.Joanna" }, "We did not receive an access code. Goodbye.");
    twiml.hangup();

    res.type("text/xml").send(twiml.toString());
  });

  app.post(`${BASE}/access-code`, urlencoded, async (req: Request, res: Response) => {
    const digits = (req.body?.Digits ?? "").trim();
    const callSid = req.body?.CallSid ?? "";
    const from = req.body?.From ?? "";
    console.log(`[Bridge IVR] Access code attempt: digits=${digits} callSid=${callSid} from=${from}`);

    const twiml = new twilio.twiml.VoiceResponse();

    try {
      const event = await findBridgeEventByAccessCode(digits);

      if (!event) {
        console.log(`[Bridge IVR] Invalid access code: ${digits}`);
        const gather = twiml.gather({
          numDigits: 8,
          action: `${BASE}/access-code`,
          method: "POST",
          timeout: 10,
          finishOnKey: "#",
        });
        gather.say(
          { voice: "Polly.Joanna" },
          "That access code was not recognised. Please try again."
        );
        twiml.say({ voice: "Polly.Joanna" }, "Goodbye.");
        twiml.hangup();
        res.type("text/xml").send(twiml.toString());
        return;
      }

      const baseUrl = resolveBaseUrl();

      twiml.say(
        { voice: "Polly.Joanna" },
        `Thank you. Connecting you to ${event.name}. Please state your name after the tone.`
      );
      twiml.record({
        maxLength: 5,
        playBeep: true,
        action: `${BASE}/name-captured?eventId=${event.id}&callSid=${callSid}&from=${encodeURIComponent(from)}`,
        method: "POST",
        recordingStatusCallback: `${baseUrl}${BASE}/name-transcribed`,
        recordingStatusCallbackMethod: "POST",
      } as any);

      twiml.say({ voice: "Polly.Joanna" }, "We did not hear a response. Please hold.");
      const mainConf = await findMainConference(event.id);
      if (mainConf) {
        await addToGreeterQueue(event.id, mainConf.id, callSid, from, null, null);
        await publishToBridge(mainConf.id, "greeter:new", { callSid, from });
      }
      twiml.play({ loop: 10 }, "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical");
    } catch (err) {
      console.error("[Bridge IVR] Error in access-code handler:", err);
      twiml.say({ voice: "Polly.Joanna" }, "We encountered a technical issue. Please try again later. Goodbye.");
      twiml.hangup();
    }

    res.type("text/xml").send(twiml.toString());
  });

  app.post(`${BASE}/name-captured`, urlencoded, async (req: Request, res: Response) => {
    const eventId = parseInt(req.query.eventId as string) || 0;
    const callSid = req.query.callSid as string ?? req.body?.CallSid ?? "";
    const from = decodeURIComponent(req.query.from as string ?? req.body?.From ?? "");
    const recordingUrl = req.body?.RecordingUrl ?? null;
    console.log(`[Bridge IVR] Name captured: eventId=${eventId} callSid=${callSid} recordingUrl=${recordingUrl}`);

    const twiml = new twilio.twiml.VoiceResponse();
    const baseUrl = resolveBaseUrl();

    try {
      twiml.say(
        { voice: "Polly.Joanna" },
        "Thank you. Now please state your organisation name after the tone."
      );
      twiml.record({
        maxLength: 5,
        playBeep: true,
        action: `${BASE}/org-captured?eventId=${eventId}&callSid=${callSid}&from=${encodeURIComponent(from)}&nameUrl=${encodeURIComponent(recordingUrl ?? "")}`,
        method: "POST",
        recordingStatusCallback: `${baseUrl}${BASE}/org-transcribed`,
        recordingStatusCallbackMethod: "POST",
      } as any);

      twiml.say({ voice: "Polly.Joanna" }, "We did not hear a response. Placing you in the queue now.");
      const mainConf = await findMainConference(eventId);
      if (mainConf) {
        await addToGreeterQueue(eventId, mainConf.id, callSid, from, recordingUrl, null);
        await publishToBridge(mainConf.id, "greeter:new", { callSid, from, voiceNameUrl: recordingUrl });
      }
      twiml.play({ loop: 10 }, "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical");
    } catch (err) {
      console.error("[Bridge IVR] Error in name-captured:", err);
      twiml.say({ voice: "Polly.Joanna" }, "Please hold while we connect you.");
      twiml.play({ loop: 10 }, "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical");
    }

    res.type("text/xml").send(twiml.toString());
  });

  app.post(`${BASE}/org-captured`, urlencoded, async (req: Request, res: Response) => {
    const eventId = parseInt(req.query.eventId as string) || 0;
    const callSid = req.query.callSid as string ?? req.body?.CallSid ?? "";
    const from = decodeURIComponent(req.query.from as string ?? "");
    const nameUrl = decodeURIComponent(req.query.nameUrl as string ?? "");
    const orgUrl = req.body?.RecordingUrl ?? null;
    console.log(`[Bridge IVR] Org captured: eventId=${eventId} callSid=${callSid} orgUrl=${orgUrl}`);

    const twiml = new twilio.twiml.VoiceResponse();

    try {
      const mainConf = await findMainConference(eventId);
      if (mainConf) {
        await addToGreeterQueue(eventId, mainConf.id, callSid, from, nameUrl || null, orgUrl);
        await publishToBridge(mainConf.id, "greeter:new", {
          callSid, from, voiceNameUrl: nameUrl, voiceOrgUrl: orgUrl,
        });
      }

      twiml.say(
        { voice: "Polly.Joanna" },
        "Thank you. Please hold while the operator connects you to the conference."
      );
      twiml.play({ loop: 30 }, "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical");
    } catch (err) {
      console.error("[Bridge IVR] Error in org-captured:", err);
      twiml.say({ voice: "Polly.Joanna" }, "Please hold.");
      twiml.play({ loop: 30 }, "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical");
    }

    res.type("text/xml").send(twiml.toString());
  });

  app.post(`${BASE}/name-transcribed`, urlencoded, async (req: Request, res: Response) => {
    const recordingSid = req.body?.RecordingSid ?? "";
    const recordingUrl = req.body?.RecordingUrl ?? "";
    const transcriptionText = req.body?.TranscriptionText ?? "";
    console.log(`[Bridge IVR] Name transcription: sid=${recordingSid} text="${transcriptionText}"`);

    if (transcriptionText && recordingUrl) {
      try {
        const db = await getDb();
        await db.update(bridgeGreeterQueue)
          .set({ transcribedName: transcriptionText.trim() })
          .where(eq(bridgeGreeterQueue.voiceNameUrl, recordingUrl));

        const [greeter] = await db.select().from(bridgeGreeterQueue)
          .where(eq(bridgeGreeterQueue.voiceNameUrl, recordingUrl));
        if (greeter?.conferenceId) {
          await publishToBridge(greeter.conferenceId, "greeter:transcribed", {
            greeterId: greeter.id, field: "name", value: transcriptionText.trim(),
          });
        }
      } catch (err) {
        console.error("[Bridge IVR] Transcription update error:", err);
      }
    }
    res.sendStatus(200);
  });

  app.post(`${BASE}/org-transcribed`, urlencoded, async (req: Request, res: Response) => {
    const recordingUrl = req.body?.RecordingUrl ?? "";
    const transcriptionText = req.body?.TranscriptionText ?? "";
    console.log(`[Bridge IVR] Org transcription: text="${transcriptionText}"`);

    if (transcriptionText && recordingUrl) {
      try {
        const db = await getDb();
        await db.update(bridgeGreeterQueue)
          .set({ transcribedOrg: transcriptionText.trim() })
          .where(eq(bridgeGreeterQueue.voiceOrgUrl, recordingUrl));

        const [greeter] = await db.select().from(bridgeGreeterQueue)
          .where(eq(bridgeGreeterQueue.voiceOrgUrl, recordingUrl));
        if (greeter?.conferenceId) {
          await publishToBridge(greeter.conferenceId, "greeter:transcribed", {
            greeterId: greeter.id, field: "org", value: transcriptionText.trim(),
          });
        }
      } catch (err) {
        console.error("[Bridge IVR] Org transcription update error:", err);
      }
    }
    res.sendStatus(200);
  });

  app.post(`${BASE}/participant-dtmf`, urlencoded, async (req: Request, res: Response) => {
    const digits = req.body?.Digits ?? "";
    const callSid = req.body?.CallSid ?? "";
    console.log(`[Bridge DTMF] callSid=${callSid} digits=${digits}`);

    const twiml = new twilio.twiml.VoiceResponse();

    if (digits === "*2" || digits === "**") {
      try {
        const db = await getDb();
        const [participant] = await db.select().from(bridgeParticipants)
          .where(eq(bridgeParticipants.twilioCallSid, callSid));

        if (participant && participant.conferenceId) {
          await db.update(bridgeParticipants)
            .set({ handRaised: true, handRaisedAt: new Date() })
            .where(eq(bridgeParticipants.id, participant.id));

          const maxPos = await db.select({
            max: sql<number>`COALESCE(MAX(${bridgeQaQuestions.queuePosition}), 0)`,
          }).from(bridgeQaQuestions)
            .where(eq(bridgeQaQuestions.conferenceId, participant.conferenceId));

          const nextPos = (maxPos[0]?.max ?? 0) + 1;

          const [question] = await db.insert(bridgeQaQuestions).values({
            conferenceId: participant.conferenceId,
            participantId: participant.id,
            method: "phone_keypress",
            queuePosition: nextPos,
            status: "pending",
          }).returning();

          await publishToBridge(participant.conferenceId, "qa:raised", {
            question, participant: { id: participant.id, name: participant.name },
          });

          console.log(`[Bridge DTMF] Hand raised: participant=${participant.id} question=${question.id}`);
        }
      } catch (err) {
        console.error("[Bridge DTMF] Hand raise error:", err);
      }
    }

    res.type("text/xml").send(twiml.toString());
  });

  app.post(`${BASE}/conference-status`, urlencoded, twilioAuthMiddleware as any, async (req: Request, res: Response) => {
    const conferenceSid = req.body?.ConferenceSid ?? "";
    const friendlyName = req.body?.FriendlyName ?? "";
    const statusEvent = req.body?.StatusCallbackEvent ?? "";
    const callSid = req.body?.CallSid ?? "";
    const muted = req.body?.Muted === "true";
    const hold = req.body?.Hold === "true";
    console.log(`[Bridge Conference] event=${statusEvent} conf=${friendlyName} callSid=${callSid} muted=${muted} hold=${hold}`);

    try {
      const db = await getDb();

      if (statusEvent === "conference-start") {
        await db.update(bridgeConferences)
          .set({ twilioConfSid: conferenceSid })
          .where(eq(bridgeConferences.twilioConfName, friendlyName));
      }

      if (statusEvent === "participant-join" && callSid) {
        const [participant] = await db.select().from(bridgeParticipants)
          .where(eq(bridgeParticipants.twilioCallSid, callSid));
        if (participant) {
          await db.update(bridgeParticipants)
            .set({ status: muted ? "muted" : "live", joinTime: new Date() })
            .where(eq(bridgeParticipants.id, participant.id));

          if (participant.conferenceId) {
            await publishToBridge(participant.conferenceId, "participant:joined", {
              participantId: participant.id, name: participant.name,
            });
          }
        }
      }

      if (statusEvent === "participant-leave" && callSid) {
        const [participant] = await db.select().from(bridgeParticipants)
          .where(eq(bridgeParticipants.twilioCallSid, callSid));
        if (participant) {
          const joinTime = participant.joinTime?.getTime() ?? Date.now();
          const durationSeconds = Math.round((Date.now() - joinTime) / 1000);
          await db.update(bridgeParticipants)
            .set({ status: "left", leaveTime: new Date(), durationSeconds })
            .where(eq(bridgeParticipants.id, participant.id));

          if (participant.conferenceId) {
            await publishToBridge(participant.conferenceId, "participant:left", {
              participantId: participant.id, name: participant.name, durationSeconds,
            });
          }
        }
      }

      if (statusEvent === "conference-end") {
        await db.update(bridgeConferences)
          .set({ phase: "ended", endedAt: new Date() })
          .where(eq(bridgeConferences.twilioConfName, friendlyName));
      }

      if (statusEvent === "participant-mute" && callSid) {
        await db.update(bridgeParticipants)
          .set({ isMuted: muted })
          .where(eq(bridgeParticipants.twilioCallSid, callSid));
      }

      if (statusEvent === "participant-hold" && callSid) {
        await db.update(bridgeParticipants)
          .set({ isOnHold: hold })
          .where(eq(bridgeParticipants.twilioCallSid, callSid));
      }

      if ((statusEvent === "recording-started" || statusEvent === "recording-completed") && conferenceSid) {
        const recordingSid = req.body?.RecordingSid ?? "";
        const recordingUrl = req.body?.RecordingUrl ?? "";
        const recordingDuration = parseInt(req.body?.RecordingDuration ?? "0", 10);

        if (statusEvent === "recording-started") {
          const [conf] = await db.select().from(bridgeConferences)
            .where(eq(bridgeConferences.twilioConfSid, conferenceSid));
          if (conf) {
            await db.insert(bridgeCallRecordings).values({
              conferenceId: conf.id,
              twilioRecSid: recordingSid,
              status: "recording",
            });
            await db.update(bridgeConferences)
              .set({ isRecording: true, recordingSid })
              .where(eq(bridgeConferences.id, conf.id));
          }
        }

        if (statusEvent === "recording-completed") {
          await db.update(bridgeCallRecordings)
            .set({
              status: "completed",
              storageUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
              durationSec: recordingDuration,
            })
            .where(eq(bridgeCallRecordings.twilioRecSid, recordingSid));

          const [conf] = await db.select().from(bridgeConferences)
            .where(eq(bridgeConferences.twilioConfSid, conferenceSid));
          if (conf) {
            await db.update(bridgeConferences)
              .set({ isRecording: false, recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null })
              .where(eq(bridgeConferences.id, conf.id));
          }
        }
      }
    } catch (err) {
      console.error("[Bridge Conference] Status callback error:", err);
    }

    res.sendStatus(200);
  });

  app.post(`${BASE}/call-status`, urlencoded, twilioAuthMiddleware as any, async (req: Request, res: Response) => {
    const callSid = req.body?.CallSid ?? "";
    const callStatus = req.body?.CallStatus ?? "";
    const callDuration = parseInt(req.body?.CallDuration ?? "0", 10);
    console.log(`[Bridge Call] callSid=${callSid} status=${callStatus} duration=${callDuration}s`);

    try {
      const db = await getDb();
      const [participant] = await db.select().from(bridgeParticipants)
        .where(eq(bridgeParticipants.twilioCallSid, callSid));

      if (participant) {
        const statusMap: Record<string, string> = {
          "ringing": "dialing",
          "in-progress": "live",
          "completed": "left",
          "busy": "failed",
          "no-answer": "failed",
          "failed": "failed",
          "canceled": "failed",
        };
        const newStatus = statusMap[callStatus] ?? participant.status;
        const updates: any = { status: newStatus };

        if (callStatus === "completed" || callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed" || callStatus === "canceled") {
          updates.leaveTime = new Date();
          updates.durationSeconds = callDuration;
        }

        await db.update(bridgeParticipants)
          .set(updates)
          .where(eq(bridgeParticipants.id, participant.id));

        if (participant.conferenceId) {
          await publishToBridge(participant.conferenceId, "participant:status", {
            participantId: participant.id, status: newStatus, callStatus,
          });
        }
      }
    } catch (err) {
      console.error("[Bridge Call] Status update error:", err);
    }

    res.sendStatus(200);
  });

  app.post(`${BASE}/admit-to-conference`, urlencoded, async (req: Request, res: Response) => {
    const callSid = req.body?.CallSid ?? "";
    const conferenceName = (req.query.conferenceName as string) ?? req.body?.conferenceName ?? "";
    console.log(`[Bridge Admit] Admitting callSid=${callSid} to conf=${conferenceName}`);

    const twiml = new twilio.twiml.VoiceResponse();
    const baseUrl = resolveBaseUrl();

    twiml.say({ voice: "Polly.Joanna" }, "You are now being connected to the conference.");
    const dial = twiml.dial();
    (dial as any).conference(conferenceName, {
      startConferenceOnEnter: false,
      endConferenceOnExit: false,
      muted: true,
      waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
      statusCallback: `${baseUrl}${BASE}/conference-status`,
      statusCallbackEvent: "start end join leave mute hold speaker",
      statusCallbackMethod: "POST",
      dtmfInput: `${baseUrl}${BASE}/participant-dtmf`,
    });

    res.type("text/xml").send(twiml.toString());
  });

  console.log("[Bridge Webhooks] ✓ All bridge webhook endpoints registered");
}

async function addToGreeterQueue(
  bridgeEventId: number,
  conferenceId: number,
  callSid: string,
  from: string,
  voiceNameUrl: string | null,
  voiceOrgUrl: string | null,
) {
  const db = await getDb();
  const existing = await db.select().from(bridgeGreeterQueue)
    .where(and(
      eq(bridgeGreeterQueue.twilioCallSid, callSid),
      eq(bridgeGreeterQueue.bridgeEventId, bridgeEventId),
    ));

  if (existing.length > 0) {
    const updates: any = {};
    if (voiceNameUrl) updates.voiceNameUrl = voiceNameUrl;
    if (voiceOrgUrl) updates.voiceOrgUrl = voiceOrgUrl;
    if (Object.keys(updates).length > 0) {
      await db.update(bridgeGreeterQueue).set(updates)
        .where(eq(bridgeGreeterQueue.id, existing[0].id));
    }
    return existing[0];
  }

  const [greeter] = await db.insert(bridgeGreeterQueue).values({
    bridgeEventId,
    conferenceId,
    twilioCallSid: callSid,
    phoneNumber: from,
    voiceNameUrl,
    voiceOrgUrl,
    status: "waiting",
  }).returning();

  return greeter;
}
