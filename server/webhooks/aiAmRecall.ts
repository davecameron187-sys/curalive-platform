import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { complianceFlags } from "../../drizzle/schema";
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

    // Verify webhook signature (implement in production)
    // const isValid = verifyRecallWebhookSignature(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

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
    const violations = await db.query.complianceFlags.findMany({
      where: (v: any) => v.eventId === eventId,
    });

    // Generate summary
    const summary = {
      totalViolations: violations.length,
      unacknowledged: violations.filter((v: any) => !v.acknowledged).length,
      bySeverity: {
        critical: violations.filter((v: any) => v.severity === "critical").length,
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

/**
 * Get event ID from Recall bot ID
 */
async function getEventIdFromRecallBot(botId: string): Promise<string | null> {
  try {
    // Query database for recall bot association
    // This assumes you have a table linking recall bots to events
    // For now, return null (implement based on your schema)
    return null;
  } catch (error) {
    console.error("[AI-AM] Error getting event ID from bot:", error);
    return null;
  }
}

/**
 * Verify Recall.ai webhook signature
 * Implement this with Recall.ai's provided verification method
 */
function verifyRecallWebhookSignature(req: Request): boolean {
  // TODO: Implement signature verification
  // See: https://docs.recall.ai/webhooks
  return true;
}

export default router;
