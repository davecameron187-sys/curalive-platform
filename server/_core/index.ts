import "dotenv/config";

process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection (non-fatal):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception (non-fatal):", err.message);
});

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
import { registerBridgeWebhooks } from "../webhooks/bridgeWebhooks";
import { buildTwiMLVoiceResponse } from "../webphone/twilio";
import { parseTelnyxWebhook } from "../webphone/telnyx";
import twilio_twiml from "twilio";
import { MetricsWebSocketServer } from "./metricsWebsocket";
import { enforceEnvOrExit } from "./config/env";
import { systemStatusRouter } from "../routes/systemStatus";

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

async function ensureArchiveEventsColumns() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`ALTER TABLE archive_events ADD COLUMN IF NOT EXISTS transcript_fingerprint VARCHAR(64)`);
    await rawSql(`ALTER TABLE archive_events ADD COLUMN IF NOT EXISTS transcription_status text DEFAULT 'pending'`);
    await rawSql(`ALTER TABLE archive_events ADD COLUMN IF NOT EXISTS transcription_provider text`);
    await rawSql(`ALTER TABLE archive_events ADD COLUMN IF NOT EXISTS transcription_error_code text`);
    await rawSql(`ALTER TABLE archive_events ADD COLUMN IF NOT EXISTS transcription_error_message text`);
    console.log("[Migration] ✓ archive_events columns ensured (fingerprint + transcription status)");
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.message?.includes("does not exist")) {
      return;
    }
    console.warn("[Migration] archive_events column check skipped:", err?.message);
  }
}

async function ensureOperatorActionsTable() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS operator_actions (
      id SERIAL PRIMARY KEY,
      session_id INTEGER,
      archive_id INTEGER,
      action_type VARCHAR(64) NOT NULL,
      detail TEXT,
      operator_id INTEGER,
      operator_name VARCHAR(255),
      metadata TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    console.log("[Migration] ✓ operator_actions table ensured");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) return;
    console.warn("[Migration] operator_actions check skipped:", err?.message);
  }
}

async function ensureLiveQaP1Columns() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`ALTER TABLE live_qa_questions ADD COLUMN IF NOT EXISTS duplicate_of_id INTEGER`);
    await rawSql(`ALTER TABLE live_qa_questions ADD COLUMN IF NOT EXISTS legal_review_reason TEXT`);
    await rawSql(`ALTER TABLE live_qa_questions ADD COLUMN IF NOT EXISTS ai_draft_text TEXT`);
    await rawSql(`ALTER TABLE live_qa_questions ADD COLUMN IF NOT EXISTS ai_draft_reasoning TEXT`);
    console.log("[Migration] ✓ P1 Q&A columns ensured (duplicate_of_id, legal_review_reason, ai_draft_text, ai_draft_reasoning)");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) return;
    console.warn("[Migration] P1 Q&A columns check skipped:", err?.message);
  }
}

async function ensureShadowSessionsColumns() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS shadow_sessions (
      id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL DEFAULT '',
      event_name VARCHAR(255) NOT NULL DEFAULT '',
      event_type VARCHAR(64) NOT NULL DEFAULT '',
      platform VARCHAR(64) NOT NULL DEFAULT 'zoom',
      meeting_url VARCHAR(1000) NOT NULL DEFAULT '',
      status VARCHAR(64) NOT NULL DEFAULT 'pending',
      recall_bot_id VARCHAR(255),
      ably_channel VARCHAR(255),
      local_transcript_json TEXT,
      local_recording_path VARCHAR(1000),
      transcript_segments INTEGER DEFAULT 0,
      sentiment_avg REAL,
      compliance_flags INTEGER DEFAULT 0,
      tagged_metrics_generated INTEGER DEFAULT 0,
      notes TEXT,
      started_at BIGINT,
      ended_at BIGINT,
      org_id INTEGER,
      company VARCHAR(255),
      ai_core_results TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS event_name VARCHAR(255)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS event_type VARCHAR(64)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS platform VARCHAR(64) DEFAULT 'zoom'`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(1000)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS recall_bot_id VARCHAR(255)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS ably_channel VARCHAR(255)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS local_transcript_json TEXT`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS local_recording_path VARCHAR(1000)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS transcript_segments INTEGER DEFAULT 0`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS sentiment_avg REAL`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS compliance_flags INTEGER DEFAULT 0`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS tagged_metrics_generated INTEGER DEFAULT 0`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS notes TEXT`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS started_at BIGINT`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS ended_at BIGINT`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS org_id INTEGER`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS company VARCHAR(255)`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS ai_core_results TEXT`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(64) NOT NULL DEFAULT 'pending'`);
    await rawSql(`ALTER TABLE shadow_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`);
    await rawSql(`ALTER TABLE shadow_sessions ALTER COLUMN session_id DROP NOT NULL`);
    await rawSql(`ALTER TABLE shadow_sessions ALTER COLUMN operator_id DROP NOT NULL`);
    console.log("[Migration] ✓ shadow_sessions columns ensured");
  } catch (err: any) {
    console.warn("[Migration] shadow_sessions column check skipped:", err?.message);
  }
}

async function ensureOrganisationsTable() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS organisations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'demo',
      billing_type VARCHAR(20) NOT NULL DEFAULT 'demo',
      subscription_amount INTEGER,
      per_event_price INTEGER,
      billing_contact_email VARCHAR(255),
      ir_contact_email VARCHAR(255),
      pilot_events_total INTEGER DEFAULT 3,
      pilot_events_used INTEGER DEFAULT 0,
      pilot_notes TEXT,
      followup_date DATE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    const [existing] = await rawSql(`SELECT COUNT(*)::int AS cnt FROM organisations`);
    if ((existing[0]?.cnt ?? 0) === 0) {
      await rawSql(`INSERT INTO organisations (name, status, billing_type, subscription_amount, ir_contact_email, billing_contact_email) VALUES
        ('Meridian Resources', 'active', 'subscription', 25000, 'ir@meridianresources.co.za', 'finance@meridianresources.co.za'),
        ('Acacia Capital', 'pilot', 'adhoc', NULL, 'investor.relations@acaciacapital.co.za', NULL),
        ('Stellarway Holdings', 'demo', 'demo', NULL, NULL, NULL)`);
      console.log("[Migration] ✓ organisations seeded with 3 demo records");
    }
    console.log("[Migration] ✓ organisations table ensured");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) return;
    console.warn("[Migration] organisations table check skipped:", err?.message);
  }
}

async function ensureScheduledSessionsTable() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS scheduled_sessions (
      id SERIAL PRIMARY KEY,
      org_id INTEGER,
      event_name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      event_type VARCHAR(64) DEFAULT 'earnings_call',
      platform VARCHAR(64) DEFAULT 'zoom',
      meeting_url TEXT,
      scheduled_at TIMESTAMP NOT NULL,
      tier VARCHAR(32) DEFAULT 'essential',
      partner_id INTEGER,
      recipients JSON DEFAULT '[]',
      pre_brief_sent_at TIMESTAMP,
      session_created_id INTEGER,
      created_by INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await rawSql(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS org_id INTEGER`);
    await rawSql(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS notes TEXT`);
    await rawSql(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS platform VARCHAR(64) DEFAULT 'zoom'`);
    console.log("[Migration] ✓ scheduled_sessions table ensured");
  } catch (err: any) {
    console.warn("[Migration] scheduled_sessions table check skipped:", err?.message);
  }
}

async function ensureBillingInvoicesTable() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS billing_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(32) NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      quote_id INTEGER,
      title VARCHAR(255) NOT NULL,
      subtotal_cents BIGINT NOT NULL DEFAULT 0,
      discount_cents BIGINT NOT NULL DEFAULT 0,
      tax_percent INTEGER NOT NULL DEFAULT 15,
      tax_cents BIGINT NOT NULL DEFAULT 0,
      total_cents BIGINT NOT NULL DEFAULT 0,
      paid_cents BIGINT NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'ZAR',
      status VARCHAR(64) NOT NULL DEFAULT 'draft',
      issued_at TIMESTAMP,
      due_at TIMESTAMP,
      paid_at TIMESTAMP,
      access_token VARCHAR(64) UNIQUE,
      payment_terms TEXT,
      internal_notes TEXT,
      client_notes TEXT,
      bank_details TEXT,
      created_by_user_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    console.log("[Migration] ✓ billing_invoices table ensured");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) return;
    console.warn("[Migration] billing_invoices table check skipped:", err?.message);
  }
}

async function ensureIntelligenceFeedTable() {
  try {
    const { rawSql } = await import("../db");
    await rawSql(`CREATE TABLE IF NOT EXISTS intelligence_feed (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      feed_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      metadata JSONB,
      pipeline TEXT NOT NULL,
      speaker TEXT NOT NULL,
      timestamp_in_event INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log("[Migration] ✓ intelligence_feed table ensured");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) return;
    console.warn("[Migration] intelligence_feed table check skipped:", err?.message);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

  app.use((req, res, next) => {
    res.setHeader("X-CuraLive-Build", "20260410-D");
    next();
  });

  app.get("/api/debug-static", (_req, res) => {
    const distPath = path.resolve(import.meta.dirname, "_app");
    const assetsDir = path.resolve(distPath, "assets");
    const indexHtmlExists = fs.existsSync(path.resolve(distPath, "index.html"));
    const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter(f => f.startsWith("index")) : [];
    const allHtmlFiles = fs.existsSync(distPath) ? fs.readdirSync(distPath).filter(f => f.endsWith(".html")) : [];
    res.json({
      version: "2026.04.10",
      distPath,
      indexHtmlExists,
      assetFiles,
      allHtmlFiles,
      dirname: import.meta.dirname,
      nodeEnv: process.env.NODE_ENV,
    });
  });

  app.get("/download/curalive_db_backup.sql", async (_req, res) => {
    const fsM = await import("fs");
    const pathM = await import("path");
    const filePath = pathM.resolve(process.cwd(), "curalive_db_backup.sql");
    if (!fsM.existsSync(filePath)) return res.status(404).send("Backup file not found");
    res.setHeader("Content-Disposition", "attachment; filename=curalive_db_backup.sql");
    res.setHeader("Content-Type", "application/sql");
    fsM.createReadStream(filePath).pipe(res);
  });

  app.get("/download/curalive_replit.dump", async (_req, res) => {
    const fsM = await import("fs");
    const pathM = await import("path");
    const filePath = pathM.resolve(process.cwd(), "curalive_replit.dump");
    if (!fsM.existsSync(filePath)) return res.status(404).send("Dump file not found");
    res.setHeader("Content-Disposition", "attachment; filename=curalive_replit.dump");
    res.setHeader("Content-Type", "application/octet-stream");
    fsM.createReadStream(filePath).pipe(res);
  });

  app.get("/health", async (_req, res) => {
    const { validateEnv } = await import("./config/env");
    const { getServiceStatus } = await import("./config/serviceStatus");
    const { getStorageHealth } = await import("../storageAdapter");
    const validation = validateEnv();
    const services = getServiceStatus();
    const storage = getStorageHealth();
    return res.json({
      ok: validation.isCoreValid,
      version: "2026.04.10-C",
      environment: process.env.NODE_ENV ?? "development",
      coreReady: validation.isCoreValid,
      missingCore: validation.missing.map((m: any) => m.key),
      missingOptional: validation.warnings.map((w: any) => ({ key: w.key, requiredFor: w.requiredFor })),
      services,
      storage,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(systemStatusRouter);

  validateShadowModeEnv();

  ensureArchiveEventsColumns().catch(err =>
    console.warn("[Migration] Non-blocking column migration failed:", err?.message)
  );
  ensureOperatorActionsTable().catch(err =>
    console.warn("[Migration] operator_actions migration failed:", err?.message)
  );
  ensureLiveQaP1Columns().catch(err =>
    console.warn("[Migration] P1 Q&A columns migration failed:", err?.message)
  );
  ensureShadowSessionsColumns().catch(err =>
    console.warn("[Migration] shadow_sessions column migration failed:", err?.message)
  );
  ensureOrganisationsTable().catch(err =>
    console.warn("[Migration] organisations table migration failed:", err?.message)
  );
  ensureScheduledSessionsTable().catch(err =>
    console.warn("[Migration] scheduled_sessions table migration failed:", err?.message)
  );
  ensureBillingInvoicesTable().catch(err =>
    console.warn("[Migration] billing_invoices table migration failed:", err?.message)
  );
  ensureIntelligenceFeedTable().catch(err =>
    console.warn("[Migration] intelligence_feed table migration failed:", err?.message)
  );

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
    const appOrigin = process.env.APP_ORIGIN ?? `https://curalive-platform.replit.app`;
    const recordingCallbackUrl = `${appOrigin}/api/webphone/recording-status`;
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

    const inboundOrigin = process.env.APP_ORIGIN ?? `https://curalive-platform.replit.app`;
    const inboundRecordingUrl = `${inboundOrigin}/api/webphone/recording-status`;

    const dialOptions: Record<string, string> = {
      record: "record-from-answer-dual",
      recordingStatusCallback: inboundRecordingUrl,
      recordingStatusCallbackMethod: "POST",
      recordingStatusCallbackEvent: "completed",
    };

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
      const fallbackOrigin = process.env.APP_ORIGIN ?? `https://curalive-platform.replit.app`;
      const fallbackUrl = `${fallbackOrigin}/api/webphone/voicemail-fallback`;
      const dial = twiml.dial({ ...dialOptions, timeout: 30, action: fallbackUrl } as Record<string, unknown>);
      dial.client(targetIdentity);
    } else {
      // No operators available — go straight to voicemail
      twiml.say({ voice: "Polly.Joanna" }, "Thank you for calling. All operators are currently unavailable. Please leave a message after the tone and we will return your call as soon as possible.");
      const vmOrigin = process.env.APP_ORIGIN ?? `https://curalive-platform.replit.app`;
      const voicemailCallbackUrl = `${vmOrigin}/api/webphone/voicemail-status`;
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
    const vmFallbackOrigin = process.env.APP_ORIGIN ?? `https://curalive-platform.replit.app`;
    const vmCallbackUrl = `${vmFallbackOrigin}/api/webphone/voicemail-status`;
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

  // Recall.ai webhook MUST be registered BEFORE express.json() because it
  // needs the raw request body stream for HMAC signature verification.
  registerRecallWebhookRoute(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const { brandConfigMiddleware } = await import("../middleware/brandConfig");
  app.use(brandConfigMiddleware);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Slide deck file upload
  registerSlideDeckUploadRoute(app);
  // Audio transcription (Whisper)
  registerAudioTranscribeRoute(app);
  registerRecordingUploadRoute(app);
  registerBillingPdfRoutes(app);
  registerBridgeWebhooks(app);

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

  app.get("/api/archives/:id/transcript", async (req, res) => {
    try {
      const archiveId = parseInt(req.params.id, 10);
      if (isNaN(archiveId)) return res.status(400).json({ ok: false, error: "Invalid archive ID" });
      const { rawSql } = await import("../db");
      const [rows] = await rawSql(
        `SELECT event_name, client_name, event_date, transcript_text, transcription_status, transcription_error_code FROM archive_events WHERE id = ? LIMIT 1`,
        [archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) return res.status(404).json({ ok: false, error: "Archive not found", archiveId });

      const transcript = (row.transcript_text ?? "").trim();
      const status = row.transcription_status ?? "unknown";

      if (!transcript) {
        if (status === "quota_exceeded") {
          return res.status(409).json({
            ok: false,
            error: "Transcript unavailable — transcription quota was exceeded when this archive was uploaded. You can retry transcription later.",
            transcription_status: "quota_exceeded",
            archiveId,
          });
        }
        if (status === "failed") {
          return res.status(409).json({
            ok: false,
            error: "Transcript unavailable — transcription failed during upload. You can retry transcription later.",
            transcription_status: "failed",
            archiveId,
          });
        }
        if (status === "pending") {
          return res.status(409).json({
            ok: false,
            error: "Transcript is still being processed. Please try again shortly.",
            transcription_status: "pending",
            archiveId,
          });
        }
        return res.status(404).json({ ok: false, error: "No transcript available for this event", archiveId });
      }

      const safeName = (row.event_name || "transcript").replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      const header = `CuraLive Intelligence Transcript\n${"=".repeat(40)}\nEvent: ${row.event_name}\nClient: ${row.client_name}\nDate: ${row.event_date || "N/A"}\n${"=".repeat(40)}\n\n`;
      const content = header + transcript;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Transcript.txt"`);
      res.send(content);
    } catch (err: any) {
      console.error("[Archive Transcript Download]", err.message);
      res.status(500).json({ ok: false, error: "Failed to download transcript" });
    }
  });

  app.get("/api/archives/:id/recording", async (req, res) => {
    try {
      const archiveId = parseInt(req.params.id, 10);
      if (isNaN(archiveId)) return res.status(400).json({ error: "Invalid archive ID" });
      const { rawSql } = await import("../db");
      const [rows] = await rawSql(
        `SELECT event_name, recording_path FROM archive_events WHERE id = ? LIMIT 1`,
        [archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) return res.status(404).json({ error: "Archive event not found", archiveId });
      if (!row.recording_path) return res.status(404).json({ error: "No recording associated with this event. The transcript can still be downloaded separately.", archiveId });

      const { resolveRecordingFile } = await import("../storageAdapter");
      const resolution = await resolveRecordingFile(row.recording_path);

      if (!resolution.found) {
        return res.status(404).json({
          error: "Recording file not found. It may have been lost during a server restart. The transcript is still available.",
          archiveId,
          source: resolution.source,
        });
      }

      const safeName = (row.event_name || "recording").replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");

      if (resolution.source === "object-storage" && resolution.url) {
        return res.redirect(302, resolution.url);
      }

      if (resolution.localPath) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Recording.mp3"`);
        res.sendFile(resolution.localPath, (err) => {
          if (err && !res.headersSent) res.status(500).json({ error: "Failed to send recording file" });
        });
      } else {
        res.status(404).json({ error: "Recording resolved but no path available" });
      }
    } catch (err: any) {
      console.error("[Archive Recording Download]", err.message);
      res.status(500).json({ error: "Failed to download recording" });
    }
  });

  app.get("/api/archives/downloads", async (_req, res) => {
    try {
      const { rawSql } = await import("../db");
      const [rows] = await rawSql(
        `SELECT id, event_name, client_name, event_type, event_date, status,
                length(transcript_text) as transcript_len,
                recording_path, transcription_status, transcription_error_code
         FROM archive_events ORDER BY id DESC`,
        []
      );
      const items = (rows as any[]).map(r => ({
        id: r.id,
        event_name: r.event_name,
        client_name: r.client_name,
        event_type: r.event_type,
        event_date: r.event_date,
        status: r.status,
        has_transcript: (r.transcript_len ?? 0) > 0,
        has_recording: !!(r.recording_path && r.recording_path.trim().length > 0),
        transcription_status: r.transcription_status ?? "unknown",
        transcription_error_code: r.transcription_error_code ?? null,
        transcript_url: (r.transcript_len ?? 0) > 0 ? `/api/archives/${r.id}/transcript` : null,
        recording_url: r.recording_path ? `/api/archives/${r.id}/recording` : null,
      }));
      res.json({ count: items.length, items });
    } catch (err: any) {
      console.error("[Archive Downloads List]", err.message);
      res.status(500).json({ error: "Failed to list downloads" });
    }
  });

  app.get("/api/archives/download-all", async (req, res) => {
    try {
      const { rawSql } = await import("../db");
      const archiver = (await import("archiver")).default;
      const { resolveRecordingFile } = await import("../storageAdapter");
      const fs = await import("fs");

      const idsParam = req.query.ids as string | undefined;
      let rows: any[];
      if (idsParam) {
        const ids = idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0);
        if (ids.length === 0) return res.status(400).json({ error: "No valid IDs provided" });
        const placeholders = ids.map(() => "?").join(",");
        const [result] = await rawSql(
          `SELECT id, event_name, client_name, event_date, transcript_text, recording_path
           FROM archive_events WHERE id IN (${placeholders}) AND length(transcript_text) > 0 ORDER BY id`,
          ids
        );
        rows = result as any[];
      } else {
        const [result] = await rawSql(
          `SELECT id, event_name, client_name, event_date, transcript_text, recording_path
           FROM archive_events WHERE length(transcript_text) > 0 ORDER BY id`,
          []
        );
        rows = result as any[];
      }
      const events = rows as any[];
      if (events.length === 0) return res.status(404).json({ error: "No archive events with transcripts found" });

      if (events.length > 500) return res.status(413).json({ error: "Too many events to zip at once (max 500)" });

      const datestamp = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="CuraLive_Archives_${datestamp}.zip"`);

      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("error", (err: any) => { if (!res.headersSent) res.status(500).json({ error: "Zip creation failed" }); });
      req.on("close", () => { archive.abort(); });
      archive.pipe(res);

      for (const ev of events) {
        const safeName = (ev.event_name || `event-${ev.id}`).replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
        const folder = `${safeName}_${ev.id}`;

        const header = `CuraLive Intelligence Transcript\n${"=".repeat(40)}\nEvent: ${ev.event_name}\nClient: ${ev.client_name}\nDate: ${ev.event_date || "N/A"}\n${"=".repeat(40)}\n\n`;
        archive.append(header + ev.transcript_text, { name: `${folder}/${safeName}_Transcript.txt` });

        if (ev.recording_path && ev.recording_path.trim()) {
          const resolution = await resolveRecordingFile(ev.recording_path);
          if (resolution.found && resolution.localPath && fs.existsSync(resolution.localPath)) {
            archive.file(resolution.localPath, { name: `${folder}/${safeName}_Recording.mp3` });
          }
        }
      }

      await archive.finalize();
    } catch (err: any) {
      console.error("[Archive Download All]", err.message);
      if (!res.headersSent) res.status(500).json({ error: "Failed to create archive zip" });
    }
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

  <h2>Starting a Session</h2>
  <ul>
    <li>Open Replit and review the current project state</li>
    <li>Check docs/specs/STATUS.md for any pending features</li>
    <li>Describe the feature or fix you want to the Replit Agent</li>
  </ul>

  <h2>During a Session</h2>
  <ul>
    <li>Review changes as the Agent builds them</li>
    <li>Test features in the preview pane</li>
    <li>Provide feedback or corrections as needed</li>
  </ul>

  <h2>Ending a Session</h2>
  <ul>
    <li>Verify all features work in the preview</li>
    <li>Publish when ready — the Agent will handle deployment</li>
  </ul>

  <div class="rule">All development happens on Replit. Describe what you want and the Agent builds it.</div>

  <h2>Warning Signs</h2>
  <table>
    <tr><th>What you see</th><th>What to do</th></tr>
    <tr><td>Preview not loading</td><td>Ask the Agent to restart the server</td></tr>
    <tr><td>Feature not working</td><td>Describe the issue to the Agent</td></tr>
    <tr><td>Unsure what's built</td><td>Ask the Agent: "What's currently implemented?"</td></tr>
  </table>

  <h2>Quick Actions</h2>
  <div class="phrase-box"><strong>To check status</strong>What features are currently implemented?</div>
  <div class="phrase-box"><strong>To request a feature</strong>Please build [feature name] following the spec in docs/specs/</div>
  <div class="phrase-box"><strong>To deploy</strong>Please publish the latest changes to production</div>

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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = isProd ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  app.use((err: any, req: any, res: any, _next: any) => {
    console.error(`[Express] Unhandled error on ${req.method} ${req.url}:`, err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[CuraLive v2025.04.10-B] Server running on http://0.0.0.0:${port}/`);
    const origin = process.env.APP_ORIGIN ?? `http://localhost:${port}`;
    startReminderScheduler(origin);

    import("../services/HealthGuardianService").then(({ startHealthGuardian }) => {
      startHealthGuardian();
    }).catch(e => console.warn("[HealthGuardian] Failed to start:", e.message));

    import("../services/ComplianceEngineService").then(({ startComplianceEngine, seedFrameworkControls }) => {
      startComplianceEngine();
      seedFrameworkControls().catch(e => console.warn("[ComplianceEngine] Seed failed:", e.message));
    }).catch(e => console.warn("[ComplianceEngine] Failed to start:", e.message));

    import("../services/ComplianceDeadlineService").then(({ startComplianceDeadlineMonitor }) => {
      startComplianceDeadlineMonitor();
    }).catch(e => console.warn("[ComplianceDeadline] Failed to start:", e.message));

    import("../services/PreEventBriefingService").then(({ startBriefingScheduler }) => {
      startBriefingScheduler();
    }).catch(e => console.warn("[PreEventBriefing] Failed to start:", e.message));

    import("../services/SubscriptionBillingService").then(({ startSubscriptionBillingScheduler }) => {
      startSubscriptionBillingScheduler();
    }).catch(e => console.warn("[SubscriptionBilling] Failed to start:", e.message));

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

enforceEnvOrExit();
startServer().catch(console.error);
