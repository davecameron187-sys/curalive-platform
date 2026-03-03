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
import { getDb } from "./db";
import { recallBots } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

function verifyRecallSignature(rawBody: string, signature: string | undefined): boolean {
  if (!RECALL_WEBHOOK_SECRET || !signature) return true; // skip in dev if not configured
  try {
    const expected = crypto
      .createHmac("sha256", RECALL_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expected}`),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// ─── Webhook event processors ────────────────────────────────────────────────

async function handleBotStatusChange(payload: {
  bot: { id: string; status_code: string };
}) {
  const { id: recallBotId, status_code: status } = payload.bot;
  const db = await getDb();
  if (!db) return;

  const updates: Record<string, unknown> = { status };
  if (status === "in_call_recording" || status === "in_call_not_recording") {
    updates.joinedAt = Date.now();
  }
  if (status === "done" || status === "call_ended" || status === "fatal") {
    updates.leftAt = Date.now();
  }

  await db.update(recallBots).set(updates).where(eq(recallBots.recallBotId, recallBotId));

  // Fetch the bot to get the Ably channel
  const [bot] = await db
    .select({ ablyChannel: recallBots.ablyChannel, eventId: recallBots.eventId })
    .from(recallBots)
    .where(eq(recallBots.recallBotId, recallBotId))
    .limit(1);

  if (bot?.ablyChannel) {
    await ablyPublish(bot.ablyChannel, "chorus", JSON.stringify({
      type: "bot.status",
      data: { status, recallBotId },
    }));
  }

  console.log(`[Recall] Bot ${recallBotId} status → ${status}`);
}

async function handleTranscriptData(payload: {
  bot: { id: string };
  data: {
    transcript: Array<{
      speaker: string;
      words: Array<{ text: string; start_time: number; end_time: number }>;
      is_final: boolean;
    }>;
  };
}) {
  const recallBotId = payload.bot.id;
  const db = await getDb();
  if (!db) return;

  const [bot] = await db
    .select()
    .from(recallBots)
    .where(eq(recallBots.recallBotId, recallBotId))
    .limit(1);

  if (!bot) return;

  // Process each transcript segment
  for (const segment of payload.data.transcript) {
    if (!segment.is_final) continue; // only persist final segments

    const text = segment.words.map((w) => w.text).join(" ").trim();
    if (!text) continue;

    const startTime = segment.words[0]?.start_time ?? 0;
    const timeLabel = formatTime(startTime);

    const transcriptSegment = {
      id: `${recallBotId}-${startTime}`,
      speaker: segment.speaker || "Speaker",
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

    // Publish to Ably in real time
    if (bot.ablyChannel) {
      await ablyPublish(bot.ablyChannel, "chorus", JSON.stringify({
        type: "transcript.segment",
        data: transcriptSegment,
      }));
    }
  }
}

async function handleRecordingDone(payload: {
  bot: { id: string };
  data: { recording_url?: string };
}) {
  const { id: recallBotId } = payload.bot;
  const recordingUrl = payload.data.recording_url;
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
      const signature = req.headers["x-recall-signature"] as string | undefined;
      const rawBody = req.rawBody ?? "";

      // Verify signature
      if (!verifyRecallSignature(rawBody, signature)) {
        console.warn("[Recall] Invalid webhook signature — rejecting");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      let event: { event: string; [key: string]: unknown };
      try {
        event = JSON.parse(rawBody);
      } catch {
        res.status(400).json({ error: "Invalid JSON" });
        return;
      }

      // Acknowledge immediately — Recall.ai expects a 200 within 5 seconds
      res.status(200).json({ received: true });

      // Process asynchronously
      try {
        switch (event.event) {
          case "bot.status_change":
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
