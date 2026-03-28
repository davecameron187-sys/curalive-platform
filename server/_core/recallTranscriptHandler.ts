/**
 * Recall.ai Transcript Streaming Handler
 * 
 * Processes real-time transcript segment events from Recall.ai webhook
 * Stores segments and broadcasts to console via Ably
 */

import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
// import { operatorSessions, sessionStateTransitions } from "../../drizzle/schema";
// import { eq } from "drizzle-orm";
// TODO: Implement Ably publishing

interface RecallTranscriptSegment {
  id: string;
  event_type: "transcript.segment";
  session_id: string;
  recording_id: string;
  speaker: string;
  text: string;
  timestamp: number; // milliseconds since epoch
  duration?: number;
  confidence?: number;
  language?: string;
}

/**
 * Verify Recall.ai webhook signature
 */
function verifyRecallSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("[Recall Transcript] Signature verification error:", error);
    return false;
  }
}

/**
 * Store transcript segment in memory cache (for now)
 * In production, would store in transcriptSegments table
 */
const transcriptCache = new Map<string, RecallTranscriptSegment[]>();

export function getTranscriptSegments(sessionId: string): RecallTranscriptSegment[] {
  return transcriptCache.get(sessionId) || [];
}

/**
 * Handle Recall.ai transcript segment events
 */
export async function handleRecallTranscriptSegment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const signature = req.headers["x-recall-signature"] as string;
    const payload = JSON.stringify(req.body);
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET || "";

    // Verify webhook signature
    if (!signature) {
      console.warn("[Recall Transcript] Missing signature header");
      res.status(400).json({ error: "Missing signature" });
      return;
    }

    if (!verifyRecallSignature(payload, signature, secret)) {
      console.warn("[Recall Transcript] Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event: RecallTranscriptSegment = req.body;

    // Validate required fields
    if (!event.id || !event.session_id || !event.speaker || !event.text) {
      console.warn("[Recall Transcript] Missing required fields");
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    console.log(`[Recall Transcript] Received segment: ${event.id} (session: ${event.session_id})`);

    // Store segment in cache
    if (!transcriptCache.has(event.session_id)) {
      transcriptCache.set(event.session_id, []);
    }
    transcriptCache.get(event.session_id)!.push(event);

    // TODO: Broadcast to Ably channel for real-time console updates
    console.log(`[Recall Transcript] Segment stored for session ${event.session_id}`);

    // Return 202 Accepted for async processing
    res.status(202).json({ success: true, message: "Segment received and queued for processing" });
  } catch (error) {
    console.error("[Recall Transcript] Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle Recall.ai recording completion event
 */
export async function handleRecallRecordingCompleted(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const signature = req.headers["x-recall-signature"] as string;
    const payload = JSON.stringify(req.body);
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET || "";

    if (!verifyRecallSignature(payload, signature, secret)) {
      console.warn("[Recall Recording] Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event = req.body;
    const { session_id, recording_url, status } = event;

    console.log(`[Recall Recording] Recording completed for session ${session_id}`);

    // TODO: Store recording URL in database
    console.log(`[Recall Recording] Recording completed for session ${session_id}`);
    if (session_id && recording_url && status === "completed") {
      try {
        console.log(`[Recall Recording] Recording URL: ${recording_url}`);
      } catch (dbError) {
        console.error("[Recall Recording] Error:", dbError);
      }
    }

    res.status(200).json({ success: true, message: "Recording completion processed" });
  } catch (error) {
    console.error("[Recall Recording] Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
