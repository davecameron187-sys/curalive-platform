import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { complianceViolations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { detectViolation, createViolationAlert } from "../_core/compliance";
import { publishAlertToAbly } from "../_core/aiAmAblyChannels";
import { isDuplicate, cacheViolation } from "../_core/aiAmDeduplication";

const router = Router();

/**
 * Recall.ai Webhook Handler for AI-AM
 * Processes transcript segments in real-time and detects compliance violations
 */

interface RecallTranscriptSegment {
  id: string;
  speaker_name?: string;
  speaker_role?: string;
  text: string;
  start_time_ms?: number;
  end_time_ms?: number;
  confidence?: number;
  language?: string;
}

interface RecallWebhookPayload {
  event_type: "transcript_segment" | "transcript_complete" | "bot_status_update";
  bot_id: string;
  meeting_id: string;
  meeting_url?: string;
  timestamp: string;
  data: {
    segment?: RecallTranscriptSegment;
    segments?: RecallTranscriptSegment[];
    status?: string;
    error?: string;
  };
}

/**
 * POST /api/webhooks/recall/ai-am
 * Receive transcript segments from Recall.ai and process for compliance violations
 */
router.post("/api/webhooks/recall/ai-am", async (req: Request, res: Response) => {
  try {
    const payload: RecallWebhookPayload = req.body;

    console.log("[AI-AM Recall Webhook] Received event:", {
      eventType: payload.event_type,
      botId: payload.bot_id,
      meetingId: payload.meeting_id,
      timestamp: payload.timestamp,
    });

    const isValid = verifyRecallWebhookSignature(req);
    if (!isValid) {
      console.warn("[AI-AM Recall Webhook] Invalid signature — rejecting request");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Get event ID from Recall bot ID
    const eventId = await getEventIdFromRecallBot(payload.bot_id);
    if (!eventId) {
      console.warn("[AI-AM Recall Webhook] No event found for bot:", payload.bot_id);
      return res.status(404).json({ error: "Event not found" });
    }

    // Handle different event types
    switch (payload.event_type) {
      case "transcript_segment":
        await handleTranscriptSegment(payload, eventId);
        break;

      case "transcript_complete":
        await handleTranscriptComplete(payload, eventId);
        break;

      case "bot_status_update":
        await handleBotStatusUpdate(payload, eventId);
        break;

      default:
        console.warn("[AI-AM Recall Webhook] Unknown event type:", payload.event_type);
    }

    // Return 200 OK to acknowledge receipt
    res.json({ success: true, processed: true });
  } catch (error) {
    console.error("[AI-AM Recall Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle individual transcript segment
 */
async function handleTranscriptSegment(payload: RecallWebhookPayload, eventId: string) {
  const segment = payload.data.segment;
  if (!segment) return;

  console.log("[AI-AM] Processing transcript segment:", {
    speaker: segment.speaker_name,
    textLength: segment.text.length,
  });

  try {
    // Detect violations in the segment
    const violation = await detectViolation(
      segment.text,
      segment.speaker_name,
      segment.speaker_role
    );

    if (!violation) {
      console.log("[AI-AM] No violations detected in segment");
      return;
    }

    // Check for duplicates
    if (isDuplicate(eventId, segment.speaker_name || "Unknown", violation.violationType, segment.text)) {
      console.log("[AI-AM] Duplicate violation detected, skipping");
      return;
    }

    // Create violation record
    const violationRecord = await createViolationAlert(
      eventId,
      undefined, // conferenceId not available from Recall webhook
      violation,
      segment.speaker_name,
      segment.speaker_role,
      segment.text,
      segment.start_time_ms,
      segment.end_time_ms
    );

    // Cache for deduplication
    cacheViolation(
      eventId,
      violationRecord.id,
      segment.speaker_name || "Unknown",
      violation.violationType,
      segment.text
    );

    // Publish to Ably for real-time updates
    await publishAlertToAbly({
      violationId: violationRecord.id,
      eventId,
      conferenceId: payload.meeting_id,
      violationType: violation.violationType,
      severity: violation.severity,
      confidenceScore: violation.confidenceScore,
      speakerName: segment.speaker_name,
      speakerRole: segment.speaker_role,
      transcriptExcerpt: segment.text,
      startTimeMs: segment.start_time_ms,
      endTimeMs: segment.end_time_ms,
      detectedAt: new Date().toISOString(),
    });

    console.log("[AI-AM] Violation detected and published:", {
      violationId: violationRecord.id,
      type: violation.violationType,
      severity: violation.severity,
    });
  } catch (error) {
    console.error("[AI-AM] Error processing transcript segment:", error);
  }
}

/**
 * Handle transcript completion
 */
async function handleTranscriptComplete(payload: RecallWebhookPayload, eventId: string) {
  console.log("[AI-AM] Transcript complete for event:", eventId);

  try {
    const db = await getDb();
    if (!db) {
      console.error("[AI-AM] Database unavailable for transcript complete");
      return;
    }
    // Get all violations for this event
    const violations = await db.select().from(complianceViolations).where(eq(complianceViolations.eventId, eventId));

    // Generate summary
    const summary = {
      totalViolations: violations.length,
      unreviewed: violations.filter((v: any) => !v.reviewedAt).length,
      bySeverity: {
        high: violations.filter((v: any) => v.severity === "high").length,
        medium: violations.filter((v: any) => v.severity === "medium").length,
        low: violations.filter((v: any) => v.severity === "low").length,
      },
    };

    console.log("[AI-AM] Transcript summary:", summary);

    // Publish summary to Ably
    await publishAlertToAbly({
      violationId: 0,
      eventId,
      violationType: "system",
      severity: "low",
      confidenceScore: 1.0,
      transcriptExcerpt: JSON.stringify(summary),
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI-AM] Error handling transcript complete:", error);
  }
}

/**
 * Handle bot status updates
 */
async function handleBotStatusUpdate(payload: RecallWebhookPayload, eventId: string) {
  console.log("[AI-AM] Bot status update:", {
    status: payload.data.status,
    error: payload.data.error,
  });

  if (payload.data.error) {
    console.error("[AI-AM] Bot error:", payload.data.error);
    // Publish error to Ably
    await publishAlertToAbly({
      violationId: 0,
      eventId,
      violationType: "system_error",
      severity: "high",
      confidenceScore: 1.0,
      transcriptExcerpt: payload.data.error,
      detectedAt: new Date().toISOString(),
    });
  }
}

async function getEventIdFromRecallBot(botId: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const { recallBots, shadowSessions } = await import("../../drizzle/schema");
    const [bot] = await db.select({ id: recallBots.id }).from(recallBots).where(eq(recallBots.recallBotId, botId)).limit(1);
    if (!bot) return null;
    const { sql: sqlHelper } = await import("drizzle-orm");
    const conn = (db as any).session?.client ?? (db as any).$client;
    const [rows] = await conn.execute(
      `SELECT id FROM shadow_sessions WHERE recall_bot_id = ? LIMIT 1`,
      [botId]
    );
    const row = (rows as any[])?.[0];
    return row ? `shadow-${row.id}` : null;
  } catch (error) {
    console.error("[AI-AM] Error getting event ID from bot:", error);
    return null;
  }
}

function verifyRecallWebhookSignature(req: Request): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[AI-AM Recall Webhook] No webhook secret configured — allowing request in dev mode");
    return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  }

  const signature = req.headers["x-recall-signature"] || req.headers["x-webhook-signature"];
  if (!signature) {
    console.warn("[AI-AM Recall Webhook] No signature header present");
    return false;
  }

  try {
    const crypto = require("crypto");
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const provided = Array.isArray(signature) ? signature[0] : signature;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch (err) {
    console.error("[AI-AM Recall Webhook] Signature verification error:", err);
    return false;
  }
}

export default router;
