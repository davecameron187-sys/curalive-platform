import { Request, Response } from "express";
import { handleRecallWebhook, storeTranscriptionSegment } from "../services/TranscriptionService";
import { getDb } from "../db";
import { occTranscriptionSegments } from "../../drizzle/schema";

/**
 * Recall.ai Webhook Handler
 * Receives real-time transcription updates from Recall.ai bots
 * Endpoint: POST /api/recall/webhook
 */

export interface RecallWebhookPayload {
  bot_id: string;
  event_type: "transcription_started" | "transcription_segment" | "transcription_complete";
  timestamp: number;
  data: {
    speaker_name: string;
    speaker_id?: string;
    text: string;
    start_time: number;
    end_time: number;
    confidence: number;
    language: string;
    is_final: boolean;
  };
}

/**
 * Verify webhook signature from Recall.ai
 * Uses HMAC-SHA256 to validate webhook authenticity
 */
function verifyRecallWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return hash === signature;
}

/**
 * Main webhook handler
 */
export async function handleRecallWebhookRequest(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-recall-signature"] as string;
    const recallSecret = process.env.RECALL_AI_WEBHOOK_SECRET;

    if (!recallSecret) {
      console.warn("[Recall Webhook] RECALL_AI_WEBHOOK_SECRET not configured — accepting webhook without signature verification");
    } else {
      // Verify webhook signature
      const payload = JSON.stringify(req.body);
      if (!verifyRecallWebhookSignature(payload, signature, recallSecret)) {
        console.warn("[Recall Webhook] Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const webhookData = req.body as RecallWebhookPayload;

    console.log(`[Recall Webhook] Received ${webhookData.event_type} event from bot ${webhookData.bot_id}`);

    // Handle different event types
    switch (webhookData.event_type) {
      case "transcription_started":
        await handleTranscriptionStarted(webhookData);
        break;

      case "transcription_segment":
        await handleTranscriptionSegment(webhookData);
        break;

      case "transcription_complete":
        await handleTranscriptionComplete(webhookData);
        break;

      default:
        console.warn(`[Recall Webhook] Unknown event type: ${webhookData.event_type}`);
    }

    // Return success response
    res.json({ success: true, bot_id: webhookData.bot_id });
  } catch (error) {
    console.error("[Recall Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

/**
 * Handle transcription started event
 */
async function handleTranscriptionStarted(payload: RecallWebhookPayload): Promise<void> {
  try {
    console.log(`[Recall Webhook] Transcription started for bot ${payload.bot_id}`);
    // Could trigger UI updates or logging here
  } catch (error) {
    console.error("[Recall Webhook] Error in handleTranscriptionStarted:", error);
  }
}

/**
 * Handle transcription segment event
 * This is the main event that stores transcription data
 */
async function handleTranscriptionSegment(payload: RecallWebhookPayload): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Find conference by bot ID
    const { recallBots } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const bot = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.recallBotId, payload.bot_id))
      .limit(1);

    if (bot.length === 0) {
      console.warn(`[Recall Webhook] Bot not found: ${payload.bot_id}`);
      return;
    }

    const conferenceId = (bot[0] as any).conferenceId ?? bot[0].meetingId;

    // Store segment
    await storeTranscriptionSegment({
      conferenceId,
      speakerName: payload.data.speaker_name,
      speakerRole: "participant",
      text: payload.data.text,
      startTime: payload.data.start_time,
      endTime: payload.data.end_time,
      confidence: Math.round(payload.data.confidence * 100),
      language: payload.data.language,
      isFinal: payload.data.is_final,
    });

    console.log(
      `[Recall Webhook] Stored segment from ${payload.data.speaker_name}: "${payload.data.text.substring(0, 50)}..."`
    );
  } catch (error) {
    console.error("[Recall Webhook] Error in handleTranscriptionSegment:", error);
    throw error;
  }
}

/**
 * Handle transcription complete event
 */
async function handleTranscriptionComplete(payload: RecallWebhookPayload): Promise<void> {
  try {
    console.log(`[Recall Webhook] Transcription completed for bot ${payload.bot_id}`);
    // Could trigger summary generation or post-event report here
  } catch (error) {
    console.error("[Recall Webhook] Error in handleTranscriptionComplete:", error);
  }
}

/**
 * Batch webhook handler for multiple segments
 * Useful for high-volume transcription scenarios
 */
export async function handleRecallWebhookBatch(req: Request, res: Response): Promise<void> {
  try {
    const segments = req.body as RecallWebhookPayload[];

    if (!Array.isArray(segments)) {
      res.status(400).json({ error: "Expected array of segments" });
      return;
    }

    console.log(`[Recall Webhook] Processing batch of ${segments.length} segments`);

    // Process segments in parallel
    const results = await Promise.allSettled(
      segments.map((segment) => handleTranscriptionSegment(segment))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Recall Webhook] Batch processing complete: ${successful} successful, ${failed} failed`
    );

    res.json({
      success: true,
      processed: successful,
      failed,
    });
  } catch (error) {
    console.error("[Recall Webhook] Error processing batch webhook:", error);
    res.status(500).json({ error: "Failed to process batch webhook" });
  }
}

/**
 * Health check endpoint for webhook
 */
export async function handleRecallWebhookHealth(req: Request, res: Response): Promise<void> {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoint: "/api/recall/webhook",
  });
}
