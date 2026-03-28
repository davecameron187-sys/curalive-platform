/**
 * Recall.ai Webhook Route Registration
 * Registers POST /api/webhooks/recall endpoint
 */

import { Express, Request, Response } from "express";
import { handleRecallWebhook } from "./recallWebhook";

export function registerRecallWebhookRoute(app: Express): void {
  /**
   * POST /api/webhooks/recall
   * Receives webhooks from Recall.ai when session recordings complete
   * 
   * Expected headers:
   * - x-recall-signature: HMAC-SHA256 signature for verification
   * 
   * Expected body:
   * {
   *   id: string,
   *   event_type: "recording.completed" | "recording.failed" | etc,
   *   recording_id: string,
   *   session_id: string,
   *   status: "completed" | "failed" | "processing",
   *   recording_url?: string,
   *   transcript_url?: string,
   *   summary?: string,
   *   timestamp: string,
   *   metadata?: Record<string, any>
   * }
   * 
   * Response codes:
   * - 200: Event processed successfully
   * - 202: Event accepted for async processing
   * - 400: Malformed payload or missing required fields
   * - 401: Invalid signature
   * - 500: Server error during processing
   */
  app.post("/api/webhooks/recall", async (req: Request, res: Response) => {
    try {
      // Validate content type
      const contentType = req.headers["content-type"];
      if (!contentType?.includes("application/json")) {
        console.warn("[Recall Webhook Route] Invalid content-type:", contentType);
        res.status(400).json({ error: "Content-Type must be application/json" });
        return;
      }

      // Delegate to webhook handler
      await handleRecallWebhook(req, res);
    } catch (error) {
      console.error("[Recall Webhook Route] Unhandled error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  console.log("[Recall Webhook Route] Registered POST /api/webhooks/recall");
}
