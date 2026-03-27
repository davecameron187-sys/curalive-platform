/**
 * Recall.ai Webhook Handler — Session Recording Completion
 * 
 * Handles webhooks from Recall.ai when session recordings complete
 * - Verifies webhook signature
 * - Triggers analytics generation
 * - Stores webhook events in database
 * - Implements retry logic for failed processing
 */

import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { webhookEvents } from "../../drizzle/schema";
import { invokeLLM } from "./llm";

interface RecallWebhookPayload {
  id: string;
  event_type: string;
  recording_id: string;
  session_id: string;
  status: "completed" | "failed" | "processing";
  recording_url?: string;
  transcript_url?: string;
  summary?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Verify Recall.ai webhook signature
 * Uses HMAC-SHA256 to verify authenticity
 */
function verifyRecallSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Trigger analytics generation on recording completion
 */
async function triggerAnalyticsGeneration(
  sessionId: string,
  recordingUrl: string,
  transcriptUrl?: string
): Promise<void> {
  try {
    console.log(`[Recall Webhook] Triggering analytics for session ${sessionId}`);

    // Generate AI summary from transcript
    let summary = "";
    if (transcriptUrl) {
      const summaryResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert at summarizing meeting transcripts. Generate a concise executive summary highlighting key decisions, action items, and important points.",
          },
          {
            role: "user",
            content: `Please summarize this meeting transcript: ${transcriptUrl}`,
          },
        ],
      });

      summary =
        summaryResponse.choices[0]?.message?.content || "Summary generation failed";
    }

    // Store analytics generation job
    const db = getDb();
    await db.insert(webhookEvents).values({
      source: "recall_ai",
      eventType: "recording.completed",
      externalId: `recall_${sessionId}`,
      payload: {
        sessionId,
        recordingUrl,
        transcriptUrl,
        summary,
        generatedAt: new Date().toISOString(),
      },
      status: "processed",
      processedAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`[Recall Webhook] Analytics generation triggered for session ${sessionId}`);
  } catch (error) {
    console.error("[Recall Webhook] Error triggering analytics:", error);
    throw error;
  }
}

/**
 * Handle Recall.ai webhook events
 */
export async function handleRecallWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const signature = req.headers["x-recall-signature"] as string;
    const payload = JSON.stringify(req.body);
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET || "";

    // Verify webhook signature
    if (!signature || !verifyRecallSignature(payload, signature, secret)) {
      console.warn("[Recall Webhook] Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event: RecallWebhookPayload = req.body;

    console.log(`[Recall Webhook] Received event: ${event.event_type} (${event.id})`);

    // Store webhook event
    const db = getDb();
    await db.insert(webhookEvents).values({
      source: "recall_ai",
      eventType: event.event_type,
      externalId: event.id,
      payload: event,
      status: "received",
      createdAt: new Date(),
    });

    // Handle recording completion
    if (event.event_type === "recording.completed" && event.status === "completed") {
      try {
        await triggerAnalyticsGeneration(
          event.session_id,
          event.recording_url || "",
          event.transcript_url
        );

        // Update webhook event status
        await db
          .update(webhookEvents)
          .set({ status: "processed", processedAt: new Date() })
          .where((t) => t.externalId === event.id);

        res.json({ success: true, message: "Analytics generation triggered" });
      } catch (error) {
        console.error("[Recall Webhook] Error processing recording completion:", error);

        // Update webhook event status to failed
        await db
          .update(webhookEvents)
          .set({
            status: "failed",
            failureReason: error instanceof Error ? error.message : "Unknown error",
            processedAt: new Date(),
          })
          .where((t) => t.externalId === event.id);

        res.status(500).json({ error: "Failed to process recording" });
      }
    } else if (event.event_type === "recording.failed") {
      console.error(`[Recall Webhook] Recording failed for session ${event.session_id}`);

      // Update webhook event status
      await db
        .update(webhookEvents)
        .set({
          status: "failed",
          failureReason: "Recording failed at source",
          processedAt: new Date(),
        })
        .where((t) => t.externalId === event.id);

      res.json({ success: false, message: "Recording failed" });
    } else {
      // Update webhook event status
      await db
        .update(webhookEvents)
        .set({ status: "processed", processedAt: new Date() })
        .where((t) => t.externalId === event.id);

      res.json({ success: true, message: "Event processed" });
    }
  } catch (error) {
    console.error("[Recall Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Retry failed webhook processing
 */
export async function retryFailedWebhooks(): Promise<void> {
  try {
    const db = getDb();

    // Get failed webhook events from last 24 hours
    const failedEvents = await db
      .select()
      .from(webhookEvents)
      .where((t) => t.status === "failed");

    console.log(`[Recall Webhook] Retrying ${failedEvents.length} failed events`);

    for (const event of failedEvents) {
      try {
        const payload = event.payload as RecallWebhookPayload;

        if (payload.event_type === "recording.completed" && payload.status === "completed") {
          await triggerAnalyticsGeneration(
            payload.session_id,
            payload.recording_url || "",
            payload.transcript_url
          );

          // Update status to processed
          await db
            .update(webhookEvents)
            .set({ status: "processed", processedAt: new Date() })
            .where((t) => t.id === event.id);

          console.log(`[Recall Webhook] Successfully retried event ${event.externalId}`);
        }
      } catch (error) {
        console.error(
          `[Recall Webhook] Retry failed for event ${event.externalId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[Recall Webhook] Error retrying failed webhooks:", error);
  }
}
