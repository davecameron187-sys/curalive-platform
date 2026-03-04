import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSlideDeckUploadRoute } from "../slideDeckUpload";
import { registerRecallWebhookRoute } from "../recallWebhook";
import { startReminderScheduler } from "../reminderScheduler";
import { handleStripeWebhook } from "../stripeWebhook";
import { buildTwiMLVoiceResponse } from "../webphone/twilio";
import { parseTelnyxWebhook } from "../webphone/telnyx";
import twilio_twiml from "twilio";

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
  // ⚠️ Stripe webhook MUST be registered BEFORE express.json() so the raw body
  // is available for signature verification.
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

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

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Slide deck file upload
  registerSlideDeckUploadRoute(app);
  // Recall.ai webhook (raw body, HMAC-verified)
  registerRecallWebhookRoute(app);
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
