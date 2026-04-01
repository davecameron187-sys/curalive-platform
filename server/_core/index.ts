import "dotenv/config";
import express from "express";
import http from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers.eager";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSlideDeckUploadRoute } from "../slideDeckUpload";
import { registerAudioTranscribeRoute } from "../audioTranscribe";
import { registerRecallWebhookRoute } from "../recallWebhook";
import { registerRecordingUploadRoute } from "../recordingUpload";
import { startReminderScheduler } from "../reminderScheduler";
import { startComplianceDigestScheduler } from "../complianceDigestScheduler";
import { registerBillingPdfRoutes } from "../billingPdf";
import { buildTwiMLVoiceResponse } from "../webphone/twilio";
import { parseTelnyxWebhook } from "../webphone/telnyx";
import twilio_twiml from "twilio";
import { MetricsWebSocketServer } from "./metricsWebsocket";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function publishAblyMessage(channel: string, event: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const auth = Buffer.from(apiKey).toString("base64");
    await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: event,
        data: JSON.stringify(data),
      }),
    });
  } catch (error) {
    console.warn(`[Ably] Failed to publish ${event} on ${channel}:`, error);
  }
}

function validateShadowModeEnv() {
  const checks = [
    { key: "RECALL_AI_API_KEY", label: "Recall.ai bot deployment", critical: true },
    { key: "RECALL_AI_WEBHOOK_SECRET", label: "Webhook signature verification", critical: false },
    { key: "ABLY_API_KEY", label: "Real-time transcript streaming to UI", critical: false },
  ];
  const missing: string[] = [];
  for (const c of checks) {
    if (!process.env[c.key]) {
      const level = c.critical ? "CRITICAL" : "WARNING";
      console.warn(`[Shadow Mode] ${level}: ${c.key} not set — ${c.label} will not work`);
      if (c.critical) missing.push(c.key);
    }
  }
  if (missing.length === 0) {
    console.log("[Shadow Mode] ✓ All critical environment variables configured");
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

  const validateTwilioWebhook = async (req: express.Request, res: express.Response): Promise<boolean> => {
    const signature = req.headers["x-twilio-signature"] as string | undefined;
    if (!signature) {
      if (isProd) {
        res.sendStatus(403);
        return false;
      }
      return true;
    }
    try {
      const { validateTwilioSignature } = await import("../services/ConferenceDialoutService");
      const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const valid = validateTwilioSignature(fullUrl, (req.body ?? {}) as Record<string, string>, signature);
      if (!valid) {
        res.sendStatus(403);
        return false;
      }
      return true;
    } catch (error) {
      console.warn("[Twilio] Signature validation failed:", error);
      res.sendStatus(403);
      return false;
    }
  };

  validateShadowModeEnv();

  if (!isProd) {
    app.use("/__mockup", (req, res) => {
      const proxyReq = http.request(
        {
          hostname: "127.0.0.1",
          port: 23636,
          path: "/__mockup" + req.url,
          method: req.method,
          headers: req.headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        },
      );
      proxyReq.on("error", () => {
        res.status(502).send("Mockup sandbox not available");
      });
      req.pipe(proxyReq, { end: true });
    });
  }

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isProd ? 120 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
    skip: (req) => req.path.startsWith("/api/ably-token"),
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 20 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again later." },
  });

  app.use("/api/trpc", apiLimiter);
  app.use("/api/oauth", authLimiter);
  app.use("/api/auth", authLimiter);

  // ─── Conference Dial-Out TwiML + Status Endpoints ─────────────────────────
  app.post("/api/conference-dialout/twiml", express.urlencoded({ extended: false }), async (req, res) => {
    const conferenceName = (req.query.conferenceName as string) ?? "";
    if (!conferenceName) {
      res.type("text/xml").send("<Response><Say>Conference not found.</Say></Response>");
      return;
    }
    const { buildConferenceTwiml } = await import("../services/ConferenceDialoutService");
    res.type("text/xml").send(buildConferenceTwiml(conferenceName));
  });

  app.post("/api/conference-dialout/status", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const { handleCallStatusUpdate, validateTwilioSignature } = await import("../services/ConferenceDialoutService");
      const twilioSig = req.headers["x-twilio-signature"] as string | undefined;
      if (twilioSig) {
        const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        if (!validateTwilioSignature(fullUrl, req.body ?? {}, twilioSig)) {
          console.warn("[ConferenceDialout] Invalid Twilio signature — rejecting");
          res.sendStatus(403);
          return;
        }
      }
      await handleCallStatusUpdate({
        callSid: req.body?.CallSid ?? "",
        callStatus: req.body?.CallStatus ?? "",
        callDuration: req.body?.CallDuration,
      });
    } catch (err) {
      console.error("[ConferenceDialout] Status callback error:", err);
    }
    res.sendStatus(200);
  });

  // Twilio TwiML voice endpoint — Twilio calls this URL when a WebRTC call is placed.
  // Must use urlencoded body (Twilio sends application/x-www-form-urlencoded).
  app.post("/api/webphone/twiml", express.urlencoded({ extended: false }), (req, res) => {
    const to = req.body?.To ?? "";
    // The client can pass a CallerId param (from the caller ID selector dropdown).
    // If provided and it looks like a valid E.164 number, use it; otherwise fall back to env var.
    const clientCallerId = req.body?.CallerId ?? "";
    const envCallerId = process.env.TWILIO_CALLER_ID ?? "";
    const callerId = (clientCallerId && clientCallerId.startsWith("+")) ? clientCallerId : envCallerId;
    console.log(`[TwiML] to=${to} callerId=${callerId} clientCallerId=${clientCallerId} envCallerId=${envCallerId} clientIdentity=${req.body?.From}`);
    if (!to) {
      res.type("text/xml").send("<Response><Say>Missing destination number.</Say></Response>");
      return;
    }
    if (!callerId) {
      console.error("[TwiML] No caller ID available!");
      res.type("text/xml").send("<Response><Say>Caller ID not configured.</Say></Response>");
      return;
    }
    // Build recording callback URL based on the app domain
    const appId = process.env.VITE_APP_ID ?? "";
    const recordingCallbackUrl = appId
      ? `https://${appId}.manus.space/api/webphone/recording-status`
      : undefined;
    const twiml = buildTwiMLVoiceResponse(to, callerId, {
      record: true,
      recordingCallbackUrl,
    });
    res.type("text/xml").send(twiml);
  });

  // Twilio inbound call endpoint — routes incoming calls to the browser client.
  // Configure the Twilio phone number's Voice URL to point to this endpoint.
  app.post("/api/webphone/inbound", express.urlencoded({ extended: false }), async (req, res) => {
    const from = req.body?.From ?? "Unknown";
    const to = req.body?.To ?? "";
    const callSid = req.body?.CallSid ?? "";
    console.log(`[TwiML Inbound] from=${from} to=${to} callSid=${callSid}`);
    const twiml = new twilio_twiml.twiml.VoiceResponse();

    // Enable recording on inbound calls
    const appId = process.env.VITE_APP_ID ?? "";
    const recordingCallbackUrl = appId
      ? `https://${appId}.manus.space/api/webphone/recording-status`
      : undefined;

    const dialOptions: Record<string, string> = {
      record: "record-from-answer-dual",
    };
    if (recordingCallbackUrl) {
      dialOptions.recordingStatusCallback = recordingCallbackUrl;
      dialOptions.recordingStatusCallbackMethod = "POST";
      dialOptions.recordingStatusCallbackEvent = "completed";
    }

    // Smart routing: find the next available operator from DB
    let targetIdentity: string | null = null;
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (db) {
        const { occOperatorSessions } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const available = await db
          .select()
          .from(occOperatorSessions)
          .where(eq(occOperatorSessions.state, "present"))
          .limit(5);

        if (available.length > 0) {
          // Round-robin: pick the operator with the oldest heartbeat (least recently active)
          available.sort((a, b) => {
            const aTime = a.lastHeartbeat?.getTime() ?? 0;
            const bTime = b.lastHeartbeat?.getTime() ?? 0;
            return aTime - bTime;
          });
          targetIdentity = `operator-${available[0].userId}`;
          console.log(`[TwiML Inbound] Routing to available operator: ${targetIdentity} (${available.length} available)`);
        } else {
          console.log(`[TwiML Inbound] No available operators — routing to voicemail`);
        }
      }
    } catch (err) {
      console.warn("[TwiML Inbound] Failed to query operator presence:", err);
    }

    if (targetIdentity) {
      // Route to an available operator with a 30-second timeout
      const appIdForFallback = process.env.VITE_APP_ID ?? "";
      const fallbackUrl = appIdForFallback
        ? `https://${appIdForFallback}.manus.space/api/webphone/voicemail-fallback`
        : "/api/webphone/voicemail-fallback";
      const dial = twiml.dial({ ...dialOptions, timeout: 30, action: fallbackUrl } as Record<string, unknown>);
      dial.client(targetIdentity);
    } else {
      // No operators available — go straight to voicemail
      twiml.say({ voice: "Polly.Joanna" }, "Thank you for calling. All operators are currently unavailable. Please leave a message after the tone and we will return your call as soon as possible.");
      const voicemailCallbackUrl = appId
        ? `https://${appId}.manus.space/api/webphone/voicemail-status`
        : "/api/webphone/voicemail-status";
      twiml.record({
        maxLength: 120,
        playBeep: true,
        transcribe: false,
        recordingStatusCallback: voicemailCallbackUrl,
        recordingStatusCallbackMethod: "POST",
      } as Record<string, unknown>);
      twiml.say({ voice: "Polly.Joanna" }, "We did not receive a recording. Goodbye.");
    }
    res.type("text/xml").send(twiml.toString());
  });

  // Telnyx webhook endpoint — receives call events from Telnyx.
  app.post("/api/webphone/telnyx", express.raw({ type: "application/json" }), (req, res) => {
    try {
      const body = JSON.parse(req.body.toString());
      const event = parseTelnyxWebhook(body);
      if (event) {
        console.log(`[Telnyx Webhook] event=${event.event} callId=${event.callControlId ?? "n/a"} from=${event.from} to=${event.to}`);
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error("[Telnyx Webhook] Parse error:", err.message);
      res.status(400).json({ error: "Invalid webhook body" });
    }
  });

  // Twilio recording status callback — captures recording URL when recording completes.
  app.post("/api/webphone/recording-status", express.urlencoded({ extended: false }), async (req, res) => {
    const callSid = req.body?.CallSid ?? "";
    const recordingSid = req.body?.RecordingSid ?? "";
    const recordingUrl = req.body?.RecordingUrl ?? "";
    const recordingStatus = req.body?.RecordingStatus ?? "";
    const recordingDuration = parseInt(req.body?.RecordingDuration ?? "0", 10);

    console.log(`[Recording Callback] callSid=${callSid} recordingSid=${recordingSid} status=${recordingStatus} duration=${recordingDuration}s url=${recordingUrl}`);

    if (callSid && recordingSid) {
      try {
        const { getDb } = await import("../db");
        const db = await getDb();
        if (db) {
          const { webphoneSessions } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          // Update the session that matches this CallSid
          await db
            .update(webphoneSessions)
            .set({
              recordingSid,
              recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
              recordingStatus: recordingStatus === "completed" ? "completed" : "failed",
            })
            .where(eq(webphoneSessions.callSid, callSid));
          console.log(`[Recording Callback] Updated session for callSid=${callSid}`);
        }
      } catch (err) {
        console.error("[Recording Callback] DB update error:", err);
      }
    }

    res.sendStatus(204);
  });

  // Voicemail fallback — Twilio calls this when the <Dial> times out or the operator doesn't answer.
  // Plays a voicemail greeting and records the caller's message.
  app.post("/api/webphone/voicemail-fallback", express.urlencoded({ extended: false }), (req, res) => {
    const dialCallStatus = req.body?.DialCallStatus ?? "";
    const callSid = req.body?.CallSid ?? "";
    console.log(`[Voicemail Fallback] callSid=${callSid} dialCallStatus=${dialCallStatus}`);

    const twimlVm = new twilio_twiml.twiml.VoiceResponse();

    // If the operator answered, no voicemail needed
    if (dialCallStatus === "completed" || dialCallStatus === "answered") {
      twimlVm.hangup();
      res.type("text/xml").send(twimlVm.toString());
      return;
    }

    // Operator didn't answer — record voicemail
    twimlVm.say({ voice: "Polly.Joanna" as any }, "The operator is not available right now. Please leave a message after the tone and we will return your call.");
    const vmAppId = process.env.VITE_APP_ID ?? "";
    const vmCallbackUrl = vmAppId
      ? `https://${vmAppId}.manus.space/api/webphone/voicemail-status`
      : "/api/webphone/voicemail-status";
    twimlVm.record({
      maxLength: 120,
      playBeep: true,
      transcribe: false,
      recordingStatusCallback: vmCallbackUrl,
      recordingStatusCallbackMethod: "POST",
    } as Record<string, unknown>);
    twimlVm.say({ voice: "Polly.Joanna" as any }, "We did not receive a recording. Goodbye.");
    res.type("text/xml").send(twimlVm.toString());
  });

  // Voicemail status callback — captures voicemail recording URL and notifies the owner.
  app.post("/api/webphone/voicemail-status", express.urlencoded({ extended: false }), async (req, res) => {
    const callSid = req.body?.CallSid ?? "";
    const recordingSid = req.body?.RecordingSid ?? "";
    const recordingUrl = req.body?.RecordingUrl ?? "";
    const recordingStatus = req.body?.RecordingStatus ?? "";
    const recordingDuration = parseInt(req.body?.RecordingDuration ?? "0", 10);
    const from = req.body?.From ?? "Unknown";

    console.log(`[Voicemail Callback] callSid=${callSid} from=${from} recordingSid=${recordingSid} status=${recordingStatus} duration=${recordingDuration}s`);

    if (callSid && recordingSid && recordingStatus === "completed") {
      try {
        const { getDb } = await import("../db");
        const db = await getDb();
        if (db) {
          const { webphoneSessions } = await import("../../drizzle/schema");
          // Create a voicemail session record
          await db.insert(webphoneSessions).values({
            userId: 0, // system/voicemail
            carrier: "twilio",
            direction: "inbound",
            remoteNumber: from,
            callSid,
            status: "completed",
            isVoicemail: true,
            voicemailUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
            voicemailDuration: recordingDuration,
            recordingSid,
            recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
            recordingStatus: "completed",
            durationSecs: recordingDuration,
            startedAt: Date.now(),
            endedAt: Date.now(),
          });
          console.log(`[Voicemail Callback] Saved voicemail from ${from}`);
        }

        // Notify owner via Ably
        const { publishWebphoneEvent } = await import("../webphone/ablyPublish");
        publishWebphoneEvent("voicemail:received", {
          remoteNumber: from,
          durationSecs: recordingDuration,
          timestamp: Date.now(),
        }).catch(() => {});

        // Notify owner via notification system
        try {
          const { notifyOwner } = await import("./notification");
          await notifyOwner({
            title: `New voicemail from ${from}`,
            content: `Duration: ${recordingDuration}s. Listen at: ${recordingUrl}.mp3`,
          });
        } catch (notifyErr) {
          console.warn("[Voicemail] Owner notification failed:", notifyErr);
        }

        // Auto-transcribe the voicemail
        try {
          const { transcribeAudio } = await import("./voiceTranscription");
          const transcriptionResult = await transcribeAudio({
            audioUrl: `${recordingUrl}.mp3`,
            prompt: "Transcribe this voicemail message",
          });
          if ("text" in transcriptionResult && transcriptionResult.text) {
            const { eq } = await import("drizzle-orm");
            const dbForTranscript = await getDb();
            if (dbForTranscript) {
              const { webphoneSessions: ws } = await import("../../drizzle/schema");
              await dbForTranscript
                .update(ws)
                .set({
                  transcription: transcriptionResult.text,
                  transcriptionLanguage: transcriptionResult.language ?? "en",
                  transcriptionStatus: "completed",
                })
                .where(eq(ws.callSid, callSid));
              console.log(`[Voicemail] Auto-transcribed: "${transcriptionResult.text.substring(0, 80)}..."`);
            }
          }
        } catch (transcribeErr) {
          console.warn("[Voicemail] Auto-transcription failed:", transcribeErr);
        }
      } catch (err) {
        console.error("[Voicemail Callback] DB error:", err);
      }
    }

    res.sendStatus(204);
  });


  // ─── CuraLive Direct IVR ─────────────────────────────────────────────────────
  // /api/voice/inbound  — Twilio calls this when a participant dials in.
  //   Greets the caller and collects a 5-digit PIN via <Gather>.
  // /api/voice/pin      — Twilio calls this with the gathered digits.
  //   Validates the PIN, auto-admits the caller, or falls through to operator queue.

  const handleInboundCall = async (req: express.Request, res: express.Response) => {
    if (!(await validateTwilioWebhook(req, res))) {
      return;
    }
    const callSid = req.body?.CallSid ?? "";
    const to = req.body?.To ?? "";
    console.log(`[CuraLive Direct IVR] Inbound call: callSid=${callSid} to=${to}`);

    const twiml = new twilio_twiml.twiml.VoiceResponse();
    const gather = twiml.gather({
      numDigits: 5,
      action: "/webhooks/twilio/pin-entry",
      method: "POST",
      timeout: 15,
      finishOnKey: "#",
    });
    gather.say(
      { voice: "Polly.Joanna" },
      "Welcome to the CuraLive conference bridge. If you have a CuraLive Direct PIN, please enter your five-digit PIN now, followed by the hash key. Otherwise, please hold and an operator will assist you."
    );
    // If no input, fall through to operator queue
    twiml.say({ voice: "Polly.Joanna" }, "No PIN entered. Please hold while we connect you to an operator.");
    twiml.enqueue("operator-queue");
    res.type("text/xml").send(twiml.toString());
  };

  app.post("/api/voice/inbound", express.urlencoded({ extended: false }), handleInboundCall);
  app.post("/webhooks/twilio/inbound-call", express.urlencoded({ extended: false }), handleInboundCall);

  const handlePinEntry = async (req: express.Request, res: express.Response) => {
    if (!(await validateTwilioWebhook(req, res))) {
      return;
    }
    const digits = (req.body?.Digits ?? "").trim();
    const callSid = req.body?.CallSid ?? "";
    const from = req.body?.From ?? "";
    const to = req.body?.To ?? "";
    console.log(`[CuraLive Direct IVR] PIN attempt: digits=${digits} callSid=${callSid} from=${from} to=${to}`);

    const twiml = new twilio_twiml.twiml.VoiceResponse();

    try {
      const {
        findRunningConferenceByDialIn,
        lookupPinForEvent,
        lookupDiamondPassForEvent,
        markPinUsed,
        markDiamondPassJoined,
        logDirectAccessAttempt,
      } = await import("../directAccess");
      const { getDb } = await import("../db");
      const db = await getDb();
      const { occParticipants } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Find the conference this number belongs to
      const conference = await findRunningConferenceByDialIn(to);

      if (!conference) {
        console.log(`[CuraLive Direct IVR] No running conference for number: ${to}`);
        await logDirectAccessAttempt({ conferenceId: null, registrationId: null, enteredPin: digits, callerNumber: from, outcome: "no_conference", callSid, dialInNumber: to });
        twiml.say({ voice: "Polly.Joanna" }, "We could not find an active conference for this number. Please check your dial-in details and try again. Goodbye.");
        twiml.hangup();
        res.type("text/xml").send(twiml.toString());
        return;
      }

      // Diamond Pass first: bypass greeter queue and join directly as identified participant
      const diamondPass = await lookupDiamondPassForEvent(conference.eventId, digits);
      // Prevent ambiguous PIN routing if both pools accidentally share the same PIN.
      const attendeeRegistration = await lookupPinForEvent(conference.eventId, digits);
      if (diamondPass && attendeeRegistration) {
        await logDirectAccessAttempt({
          conferenceId: conference.id,
          registrationId: attendeeRegistration.id,
          enteredPin: digits,
          callerNumber: from,
          outcome: "operator_queue",
          callSid,
          dialInNumber: to,
        });
        twiml.say(
          { voice: "Polly.Joanna" },
          "That PIN is linked to multiple registrations. Please hold while we connect you to an operator."
        );
        twiml.enqueue("operator-queue");
        res.type("text/xml").send(twiml.toString());
        return;
      }

      if (diamondPass) {
        if (db) {
          const existing = await db
            .select()
            .from(occParticipants)
            .where(eq(occParticipants.twilioCallSid, callSid))
            .limit(1);
          if (existing.length === 0) {
            const confParticipants = await db
              .select({ lineNumber: occParticipants.lineNumber })
              .from(occParticipants)
              .where(eq(occParticipants.conferenceId, conference.id));
            const nextLine =
              confParticipants.length > 0
                ? Math.max(...confParticipants.map((p) => p.lineNumber)) + 1
                : 1;
            await db.insert(occParticipants).values({
              conferenceId: conference.id,
              lineNumber: nextLine,
              role: "participant",
              name: diamondPass.name,
              company: diamondPass.organisation,
              phoneNumber: from || null,
              twilioCallSid: callSid || null,
              state: "muted",
              isDiamondPass: true,
              connectedAt: new Date(),
            });
          }
        }

        await markDiamondPassJoined(diamondPass.id);
        await logDirectAccessAttempt({
          conferenceId: conference.id,
          registrationId: null,
          enteredPin: digits,
          callerNumber: from,
          outcome: "admitted",
          callSid,
          dialInNumber: to,
        });
        await publishAblyMessage(`occ:conference:${conference.id}`, "participant:added", {
          conferenceId: conference.id,
          name: diamondPass.name,
          company: diamondPass.organisation,
          phoneNumber: from,
          isDiamondPass: true,
        });

        twiml.say(
          { voice: "Polly.Joanna" },
          `Welcome ${diamondPass.name.split(" ")[0]}. Your Diamond Pass has been verified. Connecting you now.`
        );
        const dial = twiml.dial();
        (dial as any).conference(conference.callId, {
          startConferenceOnEnter: true,
          endConferenceOnExit: false,
          muted: true,
          waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
        });
        res.type("text/xml").send(twiml.toString());
        return;
      }

      // Validate PIN against registrations for this event
      const registration = attendeeRegistration;

      if (registration && conference.autoAdmitEnabled) {
        // Valid PIN + auto-admit enabled → connect directly to conference
        console.log(`[CuraLive Direct IVR] Auto-admitting: ${registration.name} (${registration.email}) to conference ${conference.callId}`);
        await markPinUsed(registration.id);
        await logDirectAccessAttempt({ conferenceId: conference.id, registrationId: registration.id, enteredPin: digits, callerNumber: from, outcome: "admitted", callSid, dialInNumber: to });

        twiml.say({ voice: "Polly.Joanna" }, `Welcome, ${registration.name.split(" ")[0]}. Connecting you to the conference now.`);
        const dial = twiml.dial();
        (dial as any).conference(conference.callId, {
          startConferenceOnEnter: true,
          endConferenceOnExit: false,
          muted: true, // Participants join muted; operator can unmute
          waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
        });
      } else if (registration && !conference.autoAdmitEnabled) {
        // Valid PIN but auto-admit disabled → log and send to operator queue
        console.log(`[CuraLive Direct IVR] Valid PIN but auto-admit disabled for conference ${conference.callId}`);
        await logDirectAccessAttempt({ conferenceId: conference.id, registrationId: registration.id, enteredPin: digits, callerNumber: from, outcome: "operator_queue", callSid, dialInNumber: to });
        twiml.say({ voice: "Polly.Joanna" }, "Your PIN has been verified. Please hold while an operator connects you.");
        twiml.enqueue("operator-queue");
      } else {
        // Invalid PIN → retry or fall to operator
        console.log(`[CuraLive Direct IVR] Invalid PIN: ${digits} for event ${conference.eventId}`);
        await logDirectAccessAttempt({ conferenceId: conference.id, registrationId: null, enteredPin: digits, callerNumber: from, outcome: "failed", callSid, dialInNumber: to });
        const gather = twiml.gather({
          numDigits: 5,
          action: "/webhooks/twilio/pin-entry",
          method: "POST",
          timeout: 10,
          finishOnKey: "#",
        });
        gather.say({ voice: "Polly.Joanna" }, "That PIN was not recognised. Please try again, or press star to speak with an operator.");
        twiml.say({ voice: "Polly.Joanna" }, "Connecting you to an operator.");
        twiml.enqueue("operator-queue");
      }
    } catch (err) {
      console.error("[CuraLive Direct IVR] Error processing PIN:", err);
      twiml.say({ voice: "Polly.Joanna" }, "We encountered a technical issue. Please hold while we connect you to an operator.");
      twiml.enqueue("operator-queue");
    }

    res.type("text/xml").send(twiml.toString());
  };

  app.post("/api/voice/pin", express.urlencoded({ extended: false }), handlePinEntry);
  app.post("/webhooks/twilio/pin-entry", express.urlencoded({ extended: false }), handlePinEntry);

  app.post("/webhooks/twilio/participant-dtmf", express.urlencoded({ extended: false }), async (req, res) => {
    if (!(await validateTwilioWebhook(req, res))) {
      return;
    }
    const callSid = req.body?.CallSid ?? "";
    const digitsRaw = String(req.body?.Digits ?? "").trim();
    const digits = digitsRaw.replace("*", "");
    const twiml = new twilio_twiml.twiml.VoiceResponse();

    if (!callSid || !digits) {
      res.type("text/xml").send(twiml.toString());
      return;
    }

    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        res.type("text/xml").send(twiml.toString());
        return;
      }
      const { occParticipants, occOperatorRequests, occConferences, occParticipantHistory } = await import("../../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");

      const participantRows = await db
        .select()
        .from(occParticipants)
        .where(eq(occParticipants.twilioCallSid, callSid))
        .limit(1);
      const participant = participantRows[0];
      if (!participant) {
        res.type("text/xml").send(twiml.toString());
        return;
      }

      if (digits === "2") {
        const queue = await db
          .select({ requestToSpeakPosition: occParticipants.requestToSpeakPosition })
          .from(occParticipants)
          .where(and(eq(occParticipants.conferenceId, participant.conferenceId), eq(occParticipants.requestToSpeak, true)));
        const nextPosition =
          queue.length > 0
            ? Math.max(...queue.map((q) => q.requestToSpeakPosition ?? 0)) + 1
            : 1;
        await db
          .update(occParticipants)
          .set({ requestToSpeak: true, requestToSpeakPosition: nextPosition })
          .where(eq(occParticipants.id, participant.id));
        await db.insert(occParticipantHistory).values({
          conferenceId: participant.conferenceId,
          participantId: participant.id,
          event: "request_to_speak",
          triggeredBy: "participant",
          occurredAt: new Date(),
        });
        await publishAblyMessage(`occ:conference:${participant.conferenceId}`, "participant:updated", {
          participantId: participant.id,
          requestToSpeak: true,
          requestToSpeakPosition: nextPosition,
        });
      }

      if (digits === "0") {
        const operatorRequestCallId = `OR-${Date.now()}`;
        await db
          .update(occParticipants)
          .set({ state: "waiting_operator" })
          .where(eq(occParticipants.id, participant.id));
        const confRows = await db
          .select()
          .from(occConferences)
          .where(eq(occConferences.id, participant.conferenceId))
          .limit(1);
        const conf = confRows[0];
        const [result] = await db.insert(occOperatorRequests).values({
          conferenceId: participant.conferenceId,
          participantId: participant.id,
          callId: operatorRequestCallId,
          subject: conf?.subject ?? "Operator Assistance",
          phoneNumber: participant.phoneNumber,
          dialInNumber: participant.dialInNumber,
          requestedAt: new Date(),
          status: "pending",
        });
        await publishAblyMessage(`occ:conference:${participant.conferenceId}`, "participant:updated", {
          participantId: participant.id,
          state: "waiting_operator",
        });
        await publishAblyMessage(`occ:requests:${participant.conferenceId}`, "request.new", {
          id: (result as any)?.insertId ?? undefined,
          conferenceId: participant.conferenceId,
          participantId: participant.id,
          callId: operatorRequestCallId,
          subject: conf?.subject ?? "Operator Assistance",
          phoneNumber: participant.phoneNumber,
          dialInNumber: participant.dialInNumber,
          requestedAt: new Date().toISOString(),
          status: "pending",
        });
        await publishAblyMessage(`occ:conference:${participant.conferenceId}`, "alert", {
          level: "danger",
          message: `${participant.name ?? "Participant"} (${participant.company ?? "Unknown"}) requested operator assistance`,
          participantId: participant.id,
        });
      }
    } catch (error) {
      console.error("[Twilio DTMF] Failed to process participant-dtmf webhook:", error);
    }

    res.type("text/xml").send(twiml.toString());
  });

  app.post("/api/diamond-pass/register", express.json(), async (req, res) => {
    try {
      const { event_id, participants } = req.body ?? {};
      if (!event_id || !Array.isArray(participants) || participants.length === 0) {
        res.status(400).json({ error: "event_id and participants are required" });
        return;
      }
      const { getDb } = await import("../db");
      const { diamondPassRegistrations } = await import("../../drizzle/schema");
      const { generateUniqueDiamondPassPin } = await import("../directAccess");
      const { nanoid } = await import("nanoid");
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      const registrations: Array<{ name: string; organisation: string; pin: string; secure_token: string }> = [];
      for (const p of participants) {
        if (!p?.name || !p?.organisation) continue;
        const pin = await generateUniqueDiamondPassPin(event_id);
        const secureToken = nanoid(36);
        await db.insert(diamondPassRegistrations).values({
          eventId: event_id,
          name: p.name,
          organisation: p.organisation,
          email: p.email ?? null,
          pin,
          secureToken,
          status: "registered",
        });
        registrations.push({
          name: p.name,
          organisation: p.organisation,
          pin,
          secure_token: secureToken,
        });
      }
      res.json({ registrations });
    } catch (error) {
      console.error("[DiamondPass] register error:", error);
      res.status(500).json({ error: "Could not register Diamond Pass participants" });
    }
  });

  app.get("/api/diamond-pass/:eventId", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { diamondPassRegistrations } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }
      const rows = await db
        .select()
        .from(diamondPassRegistrations)
        .where(eq(diamondPassRegistrations.eventId, req.params.eventId));
      res.json(rows);
    } catch (error) {
      console.error("[DiamondPass] list error:", error);
      res.status(500).json({ error: "Could not fetch Diamond Pass registrations" });
    }
  });

  app.delete("/api/diamond-pass/:id", async (req, res) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: "Invalid registration id" });
        return;
      }
      const { getDb } = await import("../db");
      const { diamondPassRegistrations } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }
      await db.delete(diamondPassRegistrations).where(eq(diamondPassRegistrations.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("[DiamondPass] delete error:", error);
      res.status(500).json({ error: "Could not delete Diamond Pass registration" });
    }
  });

  app.get("/api/conference/:id/report", async (req, res) => {
    try {
      const conferenceId = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(conferenceId)) {
        res.status(400).json({ error: "Invalid conference id" });
        return;
      }
      const { buildAttendanceReport } = await import("../services/bridgeConferenceService");
      const participants = await buildAttendanceReport(conferenceId);
      res.json({
        conference_id: conferenceId,
        generated_at: new Date().toISOString(),
        participants,
      });
    } catch (error) {
      console.error("[Conference Report] fetch error:", error);
      res.status(500).json({ error: "Could not generate conference report" });
    }
  });

  app.post("/api/conference/:id/quality-sync", async (req, res) => {
    try {
      const conferenceId = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(conferenceId)) {
        res.status(400).json({ error: "Invalid conference id" });
        return;
      }
      const { syncConferenceQuality } = await import("../services/bridgeConferenceService");
      const result = await syncConferenceQuality(conferenceId);
      res.json(result);
    } catch (error) {
      console.error("[Conference Quality] sync error:", error);
      res.status(500).json({ error: "Could not sync conference quality" });
    }
  });

  app.post("/api/conference/:id/report/export", async (req, res) => {
    const conferenceId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(conferenceId)) {
      res.status(400).json({ error: "Invalid conference id" });
      return;
    }
    res.json({ download_url: `/api/conference/${conferenceId}/report/export` });
  });

  app.get("/api/conference/:id/report/export", async (req, res) => {
    try {
      const conferenceId = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(conferenceId)) {
        res.status(400).json({ error: "Invalid conference id" });
        return;
      }
      const { buildAttendanceReport } = await import("../services/bridgeConferenceService");
      const rows = await buildAttendanceReport(conferenceId);
      const csvRows = [
        "name,organisation,role,phone_number,join_method,diamond_pass,status,join_time,leave_time,duration_sec,hand_raised,avg_jitter_ms,packet_loss_pct,mos_score",
        ...rows.map((r) =>
          [
            r.name,
            r.organisation ?? "",
            r.role,
            r.phone_number,
            r.join_method,
            r.diamond_pass ? "true" : "false",
            r.status,
            r.join_time ?? "",
            r.leave_time ?? "",
            String(r.duration_sec),
            r.hand_raised ? "true" : "false",
            r.connection_quality.avg_jitter_ms ?? "",
            r.connection_quality.packet_loss_pct ?? "",
            r.connection_quality.mos_score ?? "",
          ]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(",")
        ),
      ];
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="conference-${conferenceId}-attendance.csv"`);
      res.send(csvRows.join("\n"));
    } catch (error) {
      console.error("[Conference Report] export error:", error);
      res.status(500).json({ error: "Could not export conference report" });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Slide deck file upload
  registerSlideDeckUploadRoute(app);
  // Audio transcription (Whisper)
  registerAudioTranscribeRoute(app);
  // Recall.ai webhook (raw body, HMAC-verified)
  registerRecallWebhookRoute(app);
  registerRecordingUploadRoute(app);
  registerBillingPdfRoutes(app);

  // Architecture doc download — serves the generated Word document
  app.get("/download/architecture", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Platform_Architecture.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Platform_Architecture.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // Transition Strategy download
  app.get("/download/transition-strategy", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Transition_Strategy.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Transition_Strategy.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // CIPC Patent Submission download
  app.get("/download/patent", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Patent_CIPC_Submission.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Patent_CIPC_Submission.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // AI Reports brief download
  app.get("/download/ai-reports", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_AI_Reports.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_AI_Reports.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // Mirroring & Infrastructure brief download
  app.get("/download/mirroring", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Mirroring_Brief.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Mirroring_Brief.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  app.get("/download/mirroring-response", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Mirroring_Response.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Mirroring_Response_to_Steve.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // Resilience & BYOC doc download
  app.get("/download/resilience", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Resilience_BYOC.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Resilience_BYOC.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // Shadow Bridge doc download
  app.get("/download/shadowbridge", (_req, res) => {
    const filePath = `${process.cwd()}/public/CuraLive_Shadow_Bridge_Guide.docx`;
    res.setHeader("Content-Disposition", "attachment; filename=CuraLive_Shadow_Bridge_Guide.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Document not found.");
    });
  });

  // Checklist download — serves the project owner collaboration checklist as HTML
  app.get("/download/checklist", (_req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CuraLive — Project Owner Checklist</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f7fa; color: #1a1a2e; padding: 40px 20px; }
  .page { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); padding: 48px; }
  h1 { font-size: 26px; font-weight: 700; color: #1a1a2e; border-bottom: 3px solid #6c3fc5; padding-bottom: 12px; margin-bottom: 32px; }
  h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6c3fc5; margin: 32px 0 12px; }
  ul { list-style: none; padding: 0; }
  ul li { padding: 7px 0 7px 28px; position: relative; border-bottom: 1px solid #f0f0f5; font-size: 14px; line-height: 1.5; }
  ul li:last-child { border-bottom: none; }
  ul li::before { content: "☐"; position: absolute; left: 0; color: #6c3fc5; font-size: 16px; }
  .rule { background: #6c3fc5; color: #fff; padding: 16px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; margin: 32px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  th { background: #f0ebff; color: #6c3fc5; font-weight: 600; text-align: left; padding: 10px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f5; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .phrase-box { background: #f8f7ff; border-left: 3px solid #6c3fc5; padding: 10px 14px; margin: 6px 0; border-radius: 0 6px 6px 0; font-size: 13px; }
  .phrase-box strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6c3fc5; margin-bottom: 4px; }
  .print-btn { display: block; margin: 32px auto 0; padding: 12px 32px; background: #6c3fc5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
  @media print { .print-btn { display: none; } body { background: #fff; padding: 0; } .page { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="page">
  <h1>CuraLive — Project Owner Checklist</h1>

  <h2>Starting a Replit Session</h2>
  <ul>
    <li>Say: "Check GitHub for new Manus specs"</li>
    <li>Review what Replit Agent reports — note any spec-ready features</li>
    <li>If Manus has a new spec → open the file on GitHub, copy the REPLIT SUMMARY block, paste it into the Replit chat</li>
  </ul>

  <h2>Starting a Manus Session</h2>
  <ul>
    <li>Tell Manus which features to spec next</li>
    <li>Remind Manus: spec files only in docs/specs/ — no code files</li>
    <li>Remind Manus: every spec needs a REPLIT SUMMARY block at the top</li>
    <li>Ask Manus to update docs/specs/STATUS.md when done (mark as spec-ready)</li>
  </ul>

  <h2>Ending a Replit Session</h2>
  <ul>
    <li>Say: "Push to GitHub"</li>
    <li>Confirm the push succeeded (Replit Agent will confirm with a commit ID)</li>
    <li>Tell Manus which features are now implemented so they don't re-spec them</li>
  </ul>

  <h2>Ending a Manus Session</h2>
  <ul>
    <li>Check that Manus committed to docs/specs/ only (not client/ or server/)</li>
    <li>Check that docs/specs/STATUS.md is updated to spec-ready</li>
    <li>You are ready to start a Replit session</li>
  </ul>

  <div class="rule">The one-line rule: Manus writes → you copy the summary → Replit builds → you say push.</div>

  <h2>Warning Signs</h2>
  <table>
    <tr><th>What you see</th><th>What to do</th></tr>
    <tr><td>Manus says "I already built that"</td><td>Remind them: specs only, no code</td></tr>
    <tr><td>Sync check shows unexpected GitHub files</td><td>Tell Replit Agent — it will fix it</td></tr>
    <tr><td>Push fails</td><td>Tell Replit Agent — it will diagnose</td></tr>
    <tr><td>Unsure what's built</td><td>Ask Replit Agent: "What's currently implemented?"</td></tr>
    <tr><td>Unsure what Manus is working on</td><td>Ask Manus directly</td></tr>
  </table>

  <h2>Copy-Paste Phrases</h2>
  <div class="phrase-box"><strong>To Replit at session start</strong>Check GitHub for any new Manus specs or unimplemented work</div>
  <div class="phrase-box"><strong>To Replit at session end</strong>Push to GitHub</div>
  <div class="phrase-box"><strong>To Manus when requesting a spec</strong>Please write a spec for [feature name] and save it to docs/specs/ with a REPLIT SUMMARY block at the top. Mark it spec-ready in STATUS.md when done.</div>
  <div class="phrase-box"><strong>To Manus as a reminder</strong>Please do not push any code files — specs only in docs/specs/. Replit Agent handles all implementation.</div>

  <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
</div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "inline; filename=curalive-checklist.html");
    res.send(html);
  });

  // Ably token endpoint — uses Ably SDK to create a signed token request
  app.get("/api/ably-token", async (req, res) => {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) { res.status(503).json({ error: "Ably not configured" }); return; }
    try {
      const clientId = (req.query.clientId as string) || "occ-operator";
      const Ably = await import("ably");
      const client = new Ably.Rest(apiKey);
      const tokenRequest = await client.auth.createTokenRequest({
        clientId,
        capability: {
          "occ:*": ["subscribe", "publish", "presence", "history"],
          "curalive-event-*": ["subscribe", "publish", "presence", "history"],
          "*": ["subscribe", "publish", "presence", "history"],
        },
        ttl: 3600000,
      });
      res.json(tokenRequest);
    } catch (e) {
      console.error("[Ably token]", e);
      res.status(500).json({ error: "Token generation failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const deployPort = process.env.NODE_ENV === "production" ? 23636 : null;
  const preferredPort = deployPort ?? parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    const origin = process.env.APP_ORIGIN ?? `http://localhost:${port}`;
    startReminderScheduler(origin);

    import("../services/HealthGuardianService").then(({ startHealthGuardian }) => {
      startHealthGuardian();
    }).catch(e => console.warn("[HealthGuardian] Failed to start:", e.message));

    import("../services/ComplianceEngineService").then(({ startComplianceEngine, seedFrameworkControls }) => {
      startComplianceEngine();
      seedFrameworkControls().catch(e => console.warn("[ComplianceEngine] Seed failed:", e.message));
    }).catch(e => console.warn("[ComplianceEngine] Failed to start:", e.message));

    import("../services/ShadowModeGuardianService").then(({ reconcileShadowSessions, startShadowWatchdog }) => {
      reconcileShadowSessions().then(result => {
        if (result.total > 0) {
          console.log(`[ShadowGuardian] Startup reconciliation: ${result.recovered} recovered, ${result.failed} failed, ${result.active} active`);
        }
      });
      startShadowWatchdog();
    }).catch(e => console.warn("[ShadowGuardian] Failed to start:", e.message));
  });

  const shutdown = async (signal: string) => {
    try {
      const { gracefulShutdown } = await import("../services/ShadowModeGuardianService");
      await gracefulShutdown(signal);
    } catch {}
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(console.error);
