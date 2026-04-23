/**
 * Recall.ai Webhook Handler
 *
 * Registered at POST /api/recall/webhook
 *
 * Recall.ai sends events as the bot progresses through its lifecycle:
 *   - bot.status_change    → bot joined / left / failed
 *   - transcript.data      → real-time transcript chunk (word-level)
 *   - recording.done       → recording URL available
 *
 * On each transcript chunk we:
 *   1. Validate the HMAC signature from Recall.ai
 *   2. Append the segment to the DB transcript log
 *   3. Publish a `transcript.segment` message to the Ably channel
 *      so EventRoom / WebcastStudio receive it in <100ms
 *
 * Ably server-side publish uses the REST API (no SDK needed):
 *   POST https://rest.ably.io/channels/{channel}/messages
 *   Authorization: Basic base64(apiKey)
 */
import { Express, Request, Response } from "express";
import crypto from "crypto";
import { getDb, rawSql } from "./db";
import { recallBots, canonicalEventSegments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { scoreSentiment, generateRollingSummary } from "./aiAnalysis";
import { runSessionClosePipeline } from "./services/SessionClosePipeline";
import { processSegment } from "./services/SegmentOrchestrator";

const RECALL_WEBHOOK_SECRET = process.env.RECALL_AI_WEBHOOK_SECRET ?? "";
const ABLY_API_KEY = process.env.ABLY_API_KEY ?? "";
const ABLY_REST_URL = "https://rest.ably.io";

// ─── Ably REST publish (server-side, no SDK) ─────────────────────────────────

async function ablyPublish(channel: string, name: string, data: unknown) {
  if (!ABLY_API_KEY) return; // silently skip in demo mode

  const url = `${ABLY_REST_URL}/channels/${encodeURIComponent(channel)}/messages`;
  const body = JSON.stringify({ name, data: JSON.stringify(data) });
  const auth = Buffer.from(ABLY_API_KEY).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[Ably] Publish failed ${res.status}: ${text}`);
    }
  } catch (err) {
    console.warn("[Ably] Publish error:", err);
  }
}

// ─── HMAC signature verification ─────────────────────────────────────────────

function verifyRecallSignature(rawBody: string, signature: string | undefined, msgId: string, msgTimestamp: string): boolean {
  const isProd = process.env.NODE_ENV === "production";
  if (!RECALL_WEBHOOK_SECRET) {
    console.warn("[Recall] RECALL_AI_WEBHOOK_SECRET not set — accepting webhook without signature verification");
    return true;
  }
  if (!signature) return false;
  try {
    const parts = signature.split(" ");
    for (const part of parts) {
      const [version, sig] = part.split(",");
      if (version === "v1") {
        const prefix = "whsec_";
        const base64Part = RECALL_WEBHOOK_SECRET.startsWith(prefix)
          ? RECALL_WEBHOOK_SECRET.slice(prefix.length)
          : RECALL_WEBHOOK_SECRET;
        const key = Buffer.from(base64Part, "base64");
        const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;
        const expected = crypto
          .createHmac("sha256", key)
          .update(toSign)
          .digest("base64");
        if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Webhook event processors ────────────────────────────────────────────────

async function handleBotStatusChange(payload: {
  // Recall.ai wraps everything under data.data and data.bot
  data: {
    data: { code: string; sub_code: string | null; updated_at: string };
    bot: { id: string; metadata?: Record<string, string> };
  };
}) {
  const recallBotId = payload.data.bot.id;
  const status = payload.data.data.code;
  const db = await getDb();
  if (!db) return;

  const updates: Record<string, unknown> = { status };
  if (status === "in_call_recording" || status === "in_call_not_recording") {
    updates.joinedAt = Date.now();
  }
  if (status === "done" || status === "call_ended" || status === "fatal") {
    updates.leftAt = Date.now();
    const shadowSessionId = payload.data.bot.metadata?.shadowSessionId;
    if (shadowSessionId) {
      const sessionId = parseInt(shadowSessionId, 10);
      if (!isNaN(sessionId)) {
        const degraded = status === "fatal";
        console.log(`[Recall] Bot ${recallBotId} ${status} — firing pipeline for session ${sessionId}${degraded ? " (degraded)" : ""}`);
        runSessionClosePipeline(sessionId, { degraded }).catch(err =>
          console.error(`[Recall] SessionClosePipeline failed for session ${sessionId}:`, err)
        );
      }
    }
  }

  await db.update(recallBots).set(updates).where(eq(recallBots.recallBotId, recallBotId));

  // Fetch the bot to get the Ably channel
  const [bot] = await db
    .select({ ablyChannel: recallBots.ablyChannel, eventId: recallBots.eventId })
    .from(recallBots)
    .where(eq(recallBots.recallBotId, recallBotId))
    .limit(1);

  if (bot?.ablyChannel) {
    await ablyPublish(bot.ablyChannel, "curalive", JSON.stringify({
      type: "bot.status",
      data: { status, recallBotId },
    }));
  }

  console.log(`[Recall] Bot ${recallBotId} status → ${status}`);
}

async function handleTranscriptData(payload: {
  // Recall.ai transcript.data payload shape (recallai_streaming provider):
  // { event: "transcript.data", data: { data: { words: [...], participant: {...} }, bot: { id, metadata } } }
  data: {
    data: {
      words: Array<{
        text: string;
        start_timestamp: { relative: number };
        end_timestamp: { relative: number };
      }>;
      participant: {
        id: number;
        name: string;
        is_host: boolean;
        email: string | null;
      };
    };
    bot: { id: string; metadata?: Record<string, string> };
  };
}) {
  const recallBotId = payload.data.bot.id;
  const words = payload.data.data.words;
  const participant = payload.data.data.participant;

  if (!words || words.length === 0) return;

  const db = await getDb();
  if (!db) return;

  const [bot] = await db
    .select()
    .from(recallBots)
    .where(eq(recallBots.recallBotId, recallBotId))
    .limit(1);

  console.log(`[Recall] Looking up bot: ${recallBotId}`);
  if (!bot) {
    console.log(`[Recall] Bot not found in DB for recallBotId: ${recallBotId} — transcript not saved`);
    return;
  }

  // Build a single segment from the word batch
  const text = words.map((w) => w.text).join(" ").trim();
  if (!text) return;

  const startTime = words[0]?.start_timestamp?.relative ?? 0;
  const timeLabel = formatTime(startTime);
  const speaker = participant?.name || "Speaker";

  const transcriptSegment = {
    id: `${recallBotId}-${startTime}`,
    speaker,
    text,
    timestamp: Date.now(),
    timeLabel,
  };

  // Append to DB transcript log
  const existing = bot.transcriptJson ? JSON.parse(bot.transcriptJson) : [];
  existing.push(transcriptSegment);
  await db
    .update(recallBots)
    .set({ transcriptJson: JSON.stringify(existing) })
    .where(eq(recallBots.recallBotId, recallBotId));

  // Clear watchdog if running
  const [shadowRows] = await rawSql(
    `SELECT id FROM shadow_sessions WHERE recall_bot_id = $1 LIMIT 1`,
    [recallBotId]
  );
  const shadowSession = shadowRows?.[0] ?? null;
  if (shadowSession?.id) {
    const warningTimer = (global as any)[`watchdog-warning:${shadowSession.id}`];
    if (warningTimer) {
      clearTimeout(warningTimer);
      delete (global as any)[`watchdog-warning:${shadowSession.id}`];
    }
    const failoverTimer = (global as any)[`watchdog-failover:${shadowSession.id}`];
    if (failoverTimer) {
      clearTimeout(failoverTimer);
      delete (global as any)[`watchdog-failover:${shadowSession.id}`];
    }
    console.log(`[Watchdog] Cleared for session ${shadowSession.id} — transcript received`);
  }

  // Phase 1A — dual-write to canonical_event_segments
  try {
    const sessionRecord = shadowSession ?? await (async () => {
      const [rows] = await rawSql(
        `SELECT id FROM shadow_sessions WHERE recall_bot_id = $1 LIMIT 1`,
        [recallBotId]
      );
      return rows?.[0] ?? null;
    })();
    if (sessionRecord?.id) {
      await db.insert(canonicalEventSegments).values({
        sessionId: sessionRecord.id,
        sourceType: "recall",
        speakerName: speaker,
        text: text,
        startTimestamp: Math.round(startTime * 1000),
        endTimestamp: Math.round((words[words.length - 1]?.end_timestamp?.relative ?? startTime) * 1000),
        alignedTimestamp: Date.now(),
        wordCount: words.length,
        segmentIndex: existing.length,
        confidenceScore: 1.0,
        governanceStatus: "pending",
      });
      // Trigger orchestrator for real-time AI pipeline
      const insertedSegment = await rawSql(
        `SELECT id FROM canonical_event_segments WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [sessionRecord.id]
      );
      const canonicalSegmentId = insertedSegment?.[0]?.[0]?.id ?? 0;
      void processSegment({
        sessionId: sessionRecord.id,
        canonicalSegmentId,
        speaker,
        text,
        segmentIndex: existing.length,
        ablyChannel: bot.ablyChannel ?? undefined,
      }).catch(err => console.warn("[Orchestrator] processSegment failed:", err?.message));
    }
  } catch (err) {
    console.warn("[Canonical] Failed to write canonical segment:", err?.message ?? err);
  }

  // Publish transcript segment to Ably in real time
  if (bot.ablyChannel) {
    await ablyPublish(bot.ablyChannel, "curalive", JSON.stringify({
      type: "transcript.segment",
      data: transcriptSegment,
    }));
  }

  // ── AI analysis: every 5 segments, run sentiment + rolling summary ──────────
  const SENTIMENT_INTERVAL = 5;
  if (existing.length > 0 && existing.length % SENTIMENT_INTERVAL === 0) {
    // Run in background — don't await to keep webhook response fast
    void (async () => {
      try {
        const recentText = existing
          .slice(-SENTIMENT_INTERVAL)
          .map((s: { text: string }) => s.text)
          .join(" ");

        // 1. Sentiment scoring
        const sentiment = await scoreSentiment(recentText);
        if (bot.ablyChannel) {
          await ablyPublish(bot.ablyChannel, "curalive", JSON.stringify({
            type: "sentiment.update",
            data: sentiment,
          }));
        }

        // 2. Rolling summary every 10 segments
        if (existing.length % 10 === 0) {
          const eventTitle = bot.eventId ? `Event ${bot.eventId}` : "Live Event";
          const summary = await generateRollingSummary(
            existing.slice(-20) as Array<{ speaker: string; text: string }>,
            eventTitle
          );
          if (bot.ablyChannel) {
            await ablyPublish(bot.ablyChannel, "curalive", JSON.stringify({
              type: "rolling.summary",
              data: summary,
            }));
          }
        }
      } catch (err) {
        console.warn("[AI] Background analysis error:", err);
      }
    })();
  }
}

async function handleRecordingDone(payload: {
  data: {
    bot: { id: string };
    data: { recording_url?: string };
  };
}) {
  const { id: recallBotId } = payload.data.bot;
  const recordingUrl = payload.data.data.recording_url;
  if (!recordingUrl) return;

  const db = await getDb();
  if (!db) return;

  await db
    .update(recallBots)
    .set({ recordingUrl })
    .where(eq(recallBots.recallBotId, recallBotId));

  console.log(`[Recall] Recording available for bot ${recallBotId}: ${recordingUrl}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Express route registration ──────────────────────────────────────────────

export function registerRecallWebhookRoute(app: Express) {
  // Use raw body for HMAC verification
  app.post(
    "/api/recall/webhook",
    // Express raw body middleware for this route only
    (req: Request, res: Response, next) => {
      let rawBody = "";
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => { rawBody += chunk; });
      req.on("end", () => {
        (req as Request & { rawBody: string }).rawBody = rawBody;
        next();
      });
    },
    async (req: Request & { rawBody?: string }, res: Response) => {
      const signature = req.headers["webhook-signature"] as string | undefined;
      const rawBody = req.rawBody ?? "";

      const msgId = req.headers["webhook-id"] as string ?? "";
      const msgTimestamp = req.headers["webhook-timestamp"] as string ?? "";
      // Verify signature
      if (!verifyRecallSignature(rawBody, signature, msgId, msgTimestamp)) {
        console.warn("[Recall] Invalid webhook signature — rejecting");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      let event: { event: string; [key: string]: unknown };
      try {
        event = JSON.parse(rawBody);
        console.log(`[Recall] Incoming event: ${JSON.stringify(event).slice(0, 500)}`);
      } catch {
        res.status(400).json({ error: "Invalid JSON" });
        return;
      }

      // Acknowledge immediately — Recall.ai expects a 200 within 5 seconds
      res.status(200).json({ received: true });

      // Process asynchronously
      try {
        switch (event.event) {
          case "bot.joining_call":
          case "bot.in_waiting_room":
          case "bot.in_call_not_recording":
          case "bot.in_call_recording":
          case "bot.call_ended":
          case "bot.done":
          case "bot.fatal":
            await handleBotStatusChange(event as unknown as Parameters<typeof handleBotStatusChange>[0]);
            break;
          case "transcript.data":
            await handleTranscriptData(event as unknown as Parameters<typeof handleTranscriptData>[0]);
            break;
          case "recording.done":
            await handleRecordingDone(event as unknown as Parameters<typeof handleRecordingDone>[0]);
            break;
          default:
            console.log(`[Recall] Unhandled event type: ${event.event}`);
        }
      } catch (err) {
        console.error("[Recall] Webhook processing error:", err);
      }
    }
  );

  console.log("[Recall] Webhook registered at POST /api/recall/webhook");
}
