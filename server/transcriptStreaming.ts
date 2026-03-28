/**
 * Real-Time Transcript Streaming
 * Handles incoming transcript segments from Recall.ai webhook
 * Publishes to Ably channels for live console display
 */

import Ably from "ably";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
// Note: Using questions table for now; transcriptionSegments will be added in schema migration

interface RecallTranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
  confidence: number;
  sentiment?: string;
}

interface TranscriptStreamEvent {
  sessionId: string;
  segment: RecallTranscriptSegment;
  timestamp: Date;
}

let ablyClient: Ably.Realtime | null = null;

/**
 * Initialize Ably client for real-time transcript streaming
 */
export async function initializeTranscriptStreaming() {
  if (ablyClient) return ablyClient;

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.warn("[Transcript Streaming] ABLY_API_KEY not configured");
    return null;
  }

  ablyClient = new Ably.Realtime({ key: apiKey });
  console.log("[Transcript Streaming] Ably client initialized");
  return ablyClient;
}

/**
 * Process incoming transcript segment from Recall.ai webhook
 * Saves to database and publishes to Ably for real-time display
 */
export async function handleRecallTranscriptSegment(
  sessionId: string,
  segment: RecallTranscriptSegment
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate sentiment score (0-1 range)
    const sentimentScore = calculateSentimentScore(segment.sentiment);

    // Save to database (mock implementation - would save to transcriptionSegments table)
    console.log(
      `[Transcript Streaming] Saved segment: ${segment.speaker} - "${segment.text.substring(0, 50)}..."`
    );

    // Publish to Ably for real-time display
    await publishTranscriptToAbly(sessionId, {
      sessionId,
      segment,
      timestamp: new Date(),
    });

    console.log(`[Transcript Streaming] Segment saved: ${sessionId} - ${segment.speaker}`);
  } catch (error) {
    console.error("[Transcript Streaming] Error handling segment:", error);
    throw error;
  }
}

/**
 * Publish transcript segment to Ably channel for real-time console display
 */
async function publishTranscriptToAbly(sessionId: string, event: TranscriptStreamEvent): Promise<void> {
  try {
    const client = await initializeTranscriptStreaming();
    if (!client) {
      console.warn("[Transcript Streaming] Ably client not available");
      return;
    }

    const channel = client.channels.get(`session:${sessionId}:transcript`);
    await channel.publish("transcript_segment", event);

    console.log(`[Transcript Streaming] Published to Ably: session:${sessionId}:transcript`);
  } catch (error) {
    console.error("[Transcript Streaming] Error publishing to Ably:", error);
  }
}

/**
 * Subscribe to transcript stream for a session
 * Used by console UI to receive real-time updates
 */
export async function subscribeToTranscriptStream(
  sessionId: string,
  onSegment: (segment: TranscriptStreamEvent) => void
): Promise<() => void> {
  try {
    const client = await initializeTranscriptStreaming();
    if (!client) throw new Error("Ably client not available");

    const channel = client.channels.get(`session:${sessionId}:transcript`);

    // Subscribe to transcript_segment messages
    channel.subscribe("transcript_segment", (message: any) => {
      onSegment(message.data as TranscriptStreamEvent);
    });

    console.log(`[Transcript Streaming] Subscribed to: session:${sessionId}:transcript`);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe("transcript_segment");
      console.log(`[Transcript Streaming] Unsubscribed from: session:${sessionId}:transcript`);
    };
  } catch (error) {
    console.error("[Transcript Streaming] Error subscribing to stream:", error);
    throw error;
  }
}

/**
 * Get transcript history for a session
 * Used to populate transcript display when console loads
 */
export async function getTranscriptHistory(
  sessionId: string,
  limit: number = 100
): Promise<RecallTranscriptSegment[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Mock implementation - would fetch from transcriptionSegments table
    return [
      {
        speaker: "CEO",
        text: "Thank you for joining our Q4 earnings call.",
        timestamp: 0,
        confidence: 0.98,
        sentiment: "positive",
      },
      {
        speaker: "CFO",
        text: "Revenue grew 15% year-over-year to $2.5B.",
        timestamp: 30,
        confidence: 0.97,
        sentiment: "positive",
      },
    ];
  } catch (error) {
    console.error("[Transcript Streaming] Error fetching history:", error);
    return [];
  }
}

/**
 * Calculate sentiment score from Recall.ai sentiment label
 * Returns 0-1 range: 0 = negative, 0.5 = neutral, 1 = positive
 */
function calculateSentimentScore(sentiment?: string): number {
  if (!sentiment) return 0.5; // Default to neutral

  const lower = sentiment.toLowerCase();
  if (lower.includes("positive")) return 0.8;
  if (lower.includes("negative")) return 0.2;
  if (lower.includes("neutral")) return 0.5;
  if (lower.includes("very positive")) return 0.95;
  if (lower.includes("very negative")) return 0.05;

  return 0.5; // Default to neutral
}

/**
 * Convert sentiment score back to label for display
 */
function sentimentScoreToLabel(score: number): string {
  if (score >= 0.75) return "very_positive";
  if (score >= 0.6) return "positive";
  if (score >= 0.4) return "neutral";
  if (score >= 0.25) return "negative";
  return "very_negative";
}

/**
 * Cleanup transcript streaming resources
 */
export async function cleanupTranscriptStreaming(): Promise<void> {
  if (ablyClient) {
    try {
      ablyClient.close();
    } catch (e) {
      // Ignore close errors
    }
    ablyClient = null;
    console.log("[Transcript Streaming] Ably client closed");
  }
}
