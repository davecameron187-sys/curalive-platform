import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSlideDeckUploadRoute } from "../slideDeckUpload";
// import { registerAudioUploadRoute } from "../audioUpload"; // TODO: audioUpload module not found
import { registerRecallWebhookRoute } from "../recallWebhook";
import { startReminderScheduler } from "../reminderScheduler";
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

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

  app.post("/api/voice/inbound", express.urlencoded({ extended: false }), (req, res) => {
    const callSid = req.body?.CallSid ?? "";
    const to = req.body?.To ?? "";
    console.log(`[CuraLive Direct IVR] Inbound call: callSid=${callSid} to=${to}`);

    const twiml = new twilio_twiml.twiml.VoiceResponse();
    const gather = twiml.gather({
      numDigits: 5,
      action: "/api/voice/pin",
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
  });

  app.post("/api/voice/pin", express.urlencoded({ extended: false }), async (req, res) => {
    const digits = (req.body?.Digits ?? "").trim();
    const callSid = req.body?.CallSid ?? "";
    const from = req.body?.From ?? "";
    const to = req.body?.To ?? "";
    console.log(`[CuraLive Direct IVR] PIN attempt: digits=${digits} callSid=${callSid} from=${from} to=${to}`);

    const twiml = new twilio_twiml.twiml.VoiceResponse();

    try {
      const { findRunningConferenceByDialIn, lookupPinForEvent, markPinUsed, logDirectAccessAttempt } = await import("../directAccess");

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

      // Validate PIN against registrations for this event
      const registration = await lookupPinForEvent(conference.eventId, digits);

      if (registration && conference.autoAdmitEnabled) {
        // Valid PIN + auto-admit enabled → connect directly to conference
        console.log(`[CuraLive Direct IVR] Auto-admitting: ${registration.name} (${registration.email}) to conference ${conference.callId}`);
        await markPinUsed(registration.id);
        await logDirectAccessAttempt({ conferenceId: conference.id, registrationId: registration.id, enteredPin: digits, callerNumber: from, outcome: "admitted", callSid, dialInNumber: to });

        twiml.say({ voice: "Polly.Joanna" }, `Welcome, ${registration.name.split(" ")[0]}. Connecting you to the conference now.`);
        const dial = twiml.dial();
        (dial as any).conference(conference.callId, {
          startConferenceOnEnter: false,
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
          action: "/api/voice/pin",
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
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Slide deck file upload
  registerSlideDeckUploadRoute(app);
  // OCC audio library upload
  // registerAudioUploadRoute(app); // TODO: audioUpload module not found
  // Recall.ai webhook (raw body, HMAC-verified)
  registerRecallWebhookRoute(app);
  registerBillingPdfRoutes(app);

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

  // Initialize WebSocket server for real-time metrics
  new MetricsWebSocketServer(server);
  console.log("[Metrics WebSocket] Server initialized");

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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the pre-event reminder email scheduler
    // In production the origin is derived from the VITE_APP_ID-based domain;
    // in development we fall back to localhost so reminders still log without sending.
    const origin = process.env.APP_ORIGIN ?? `http://localhost:${port}`;
    startReminderScheduler(origin);
  });
}

startServer().catch(console.error);
