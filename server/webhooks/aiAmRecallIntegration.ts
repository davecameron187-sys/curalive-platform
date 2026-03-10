import { Router } from "express";
import { db } from "../db";
import { complianceViolations } from "../../drizzle/schema";
import { detectViolation } from "../_core/compliance";
import { broadcastViolationAlert } from "../_core/aiAmAblyChannels";

/**
 * AI-AM Recall.ai Webhook Integration
 * Processes real-time transcript segments from Recall.ai and triggers compliance detection
 */

export const aiAmRecallRouter = Router();

/**
 * POST /api/webhooks/recall/ai-am
 * Receive transcript segments from Recall.ai and run compliance detection
 */
aiAmRecallRouter.post("/ai-am", async (req, res) => {
  try {
    const { bot_id, meeting_id, data } = req.body;

    if (!bot_id || !meeting_id || !data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("[AI-AM Recall] Processing transcript segment:", {
      bot_id,
      meeting_id,
      speaker: data.speaker_name,
      text: data.text?.substring(0, 100),
    });

    // Find event by meeting ID
    const event = await db.query.webcastEvents.findFirst({
      where: (events, { eq }) => eq(events.id, parseInt(meeting_id)),
    });

    if (!event) {
      console.warn(`[AI-AM Recall] Event not found for meeting ${meeting_id}`);
      return res.status(404).json({ error: "Event not found" });
    }

    const eventId = event.slug || event.id.toString();

    // Run compliance detection on transcript segment
    const violations = await detectViolation(
      data.text,
      data.speaker_name || "Unknown",
      data.speaker_role || "participant"
    );

    if (violations.length > 0) {
      console.log(`[AI-AM Recall] Detected ${violations.length} violations`);

      for (const violation of violations) {
        // Create violation record
        const violationRecord = await db.insert(complianceViolations).values({
          eventId: event.id,
          violationType: violation.violationType,
          severity: violation.severity,
          confidenceScore: violation.confidenceScore,
          speakerName: data.speaker_name,
          speakerRole: data.speaker_role,
          transcriptExcerpt: data.text,
          startTimeMs: data.start_time_ms,
          endTimeMs: data.end_time_ms,
          acknowledged: false,
          createdAt: Date.now(),
        });

        // Broadcast to operators via Ably
        await broadcastViolationAlert({
          violationId: violationRecord[0].insertId as number,
          eventId,
          violationType: violation.violationType,
          severity: violation.severity,
          confidenceScore: violation.confidenceScore,
          speakerName: data.speaker_name,
          speakerRole: data.speaker_role,
          transcriptExcerpt: data.text,
          startTimeMs: data.start_time_ms,
          endTimeMs: data.end_time_ms,
          detectedAt: new Date().toISOString(),
        });

        console.log("[AI-AM Recall] Violation published to operators:", {
          type: violation.violationType,
          severity: violation.severity,
          speaker: data.speaker_name,
        });
      }
    }

    res.json({
      success: true,
      violations_detected: violations.length,
      event_id: eventId,
    });
  } catch (error) {
    console.error("[AI-AM Recall] Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/webhooks/recall/ai-am/status
 * Receive bot status updates from Recall.ai
 */
aiAmRecallRouter.post("/ai-am/status", async (req, res) => {
  try {
    const { bot_id, meeting_id, data } = req.body;

    console.log("[AI-AM Recall] Bot status update:", {
      bot_id,
      status: data?.status,
      error: data?.error,
    });

    if (data?.error) {
      console.error("[AI-AM Recall] Bot error:", data.error);
      // Could trigger alert or notification here
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[AI-AM Recall] Status webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/webhooks/recall/ai-am/transcript
 * Receive complete transcript from Recall.ai after event ends
 */
aiAmRecallRouter.post("/ai-am/transcript", async (req, res) => {
  try {
    const { bot_id, meeting_id, data } = req.body;

    console.log("[AI-AM Recall] Transcript complete:", {
      bot_id,
      meeting_id,
      segments: data?.segments?.length || 0,
    });

    // Find event
    const event = await db.query.webcastEvents.findFirst({
      where: (events, { eq }) => eq(events.id, parseInt(meeting_id)),
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Generate compliance report
    const violations = await db.query.complianceViolations.findMany({
      where: (v, { eq }) => eq(v.eventId, event.id),
    });

    const report = {
      event_id: event.id,
      event_name: event.title,
      total_violations: violations.length,
      by_severity: {
        critical: violations.filter((v) => v.severity === "critical").length,
        high: violations.filter((v) => v.severity === "high").length,
        medium: violations.filter((v) => v.severity === "medium").length,
        low: violations.filter((v) => v.severity === "low").length,
      },
      by_type: violations.reduce(
        (acc, v) => {
          acc[v.violationType] = (acc[v.violationType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      unacknowledged: violations.filter((v) => !v.acknowledged).length,
    };

    console.log("[AI-AM Recall] Compliance report:", report);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("[AI-AM Recall] Transcript webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default aiAmRecallRouter;
