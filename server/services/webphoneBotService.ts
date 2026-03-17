/**
 * Webphone Bot Service
 * 
 * Handles Webphone call integration for Shadow Mode
 * Provides audio capture, transcription, and sentiment analysis for Webphone calls
 */

import { getDb } from "../db";
import { shadowSessions, recallBots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface WebphoneCallConfig {
  webphoneId: string;
  sessionId: number;
  clientName: string;
  eventName: string;
  webhookUrl: string;
  ablyChannel: string;
}

export interface WebphoneTranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
  confidence?: number;
  sentiment?: "positive" | "neutral" | "negative";
}

/**
 * Initialize Webphone bot for a Shadow Mode session
 * This creates a virtual bot that will listen to the Webphone call
 */
export async function initializeWebphoneBot(config: WebphoneCallConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    // Create a virtual bot record for Webphone
    const botId = `webphone-${config.sessionId}-${Date.now()}`;
    
    await db.insert(recallBots).values({
      recallBotId: botId,
      meetingUrl: config.webphoneId,
      botName: "CuraLive Webphone Intelligence",
      eventId: null,
      meetingId: null,
      status: "webphone_listening",
      ablyChannel: config.ablyChannel,
      transcriptJson: JSON.stringify([]),
    });

    // Update session status
    await db.update(shadowSessions)
      .set({
        recallBotId: botId,
        ablyChannel: config.ablyChannel,
        status: "bot_joining",
        startedAt: Date.now(),
      })
      .where(eq(shadowSessions.id, config.sessionId));

    return {
      botId,
      status: "webphone_listening",
      message: `CuraLive Webphone Intelligence is now listening to ${config.webphoneId}. Real-time transcription will begin immediately.`,
    };
  } catch (error) {
    console.error("Failed to initialize Webphone bot:", error);
    throw new Error(`Webphone bot initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process incoming Webphone transcript data
 * Called when Webphone sends transcript updates via webhook
 */
export async function processWebphoneTranscript(
  botId: string,
  segments: WebphoneTranscriptSegment[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    const [botRecord] = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.recallBotId, botId))
      .limit(1);

    if (!botRecord) {
      throw new Error(`Webphone bot ${botId} not found`);
    }

    // Parse existing transcript
    const existingTranscript: WebphoneTranscriptSegment[] = botRecord.transcriptJson
      ? JSON.parse(botRecord.transcriptJson)
      : [];

    // Merge new segments
    const updatedTranscript = [...existingTranscript, ...segments];

    // Update bot record with new transcript
    await db.update(recallBots)
      .set({
        transcriptJson: JSON.stringify(updatedTranscript),
        status: "webphone_active",
      })
      .where(eq(recallBots.recallBotId, botId));

    return {
      success: true,
      segmentsProcessed: segments.length,
      totalSegments: updatedTranscript.length,
    };
  } catch (error) {
    console.error("Failed to process Webphone transcript:", error);
    throw new Error(`Transcript processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate sentiment for Webphone transcript
 * Analyzes the overall sentiment of the call
 */
export async function calculateWebphoneSentiment(
  botId: string
): Promise<{ average: number; positive: number; neutral: number; negative: number }> {
  const db = await getDb();
  if (!db) return { average: 0, positive: 0, neutral: 0, negative: 0 };

  try {
    const [botRecord] = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.recallBotId, botId))
      .limit(1);

    if (!botRecord) {
      throw new Error(`Webphone bot ${botId} not found`);
    }

    const transcript: WebphoneTranscriptSegment[] = botRecord.transcriptJson
      ? JSON.parse(botRecord.transcriptJson)
      : [];

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    transcript.forEach((segment) => {
      if (segment.sentiment === "positive") positiveCount++;
      else if (segment.sentiment === "neutral") neutralCount++;
      else if (segment.sentiment === "negative") negativeCount++;
    });

    const total = transcript.length || 1;
    const average = (positiveCount * 100 + neutralCount * 50) / total;

    return {
      average: Math.round(average),
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };
  } catch (error) {
    console.error("Failed to calculate Webphone sentiment:", error);
    return { average: 0, positive: 0, neutral: 0, negative: 0 };
  }
}

/**
 * End Webphone bot session
 * Finalizes the call and prepares data for analysis
 */
export async function endWebphoneSession(botId: string, sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    // Get sentiment data
    const sentiment = await calculateWebphoneSentiment(botId);

    // Update bot status
    await db.update(recallBots)
      .set({ status: "webphone_completed" })
      .where(eq(recallBots.recallBotId, botId));

    // Update session status
    await db.update(shadowSessions)
      .set({
        status: "processing",
        endedAt: Date.now(),
        sentimentAvg: sentiment.average,
      })
      .where(eq(shadowSessions.id, sessionId));

    return {
      success: true,
      botId,
      sessionId,
      sentiment,
      message: "Webphone session completed and data processed.",
    };
  } catch (error) {
    console.error("Failed to end Webphone session:", error);
    throw new Error(`Session termination failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Webphone session transcript
 * Returns the full transcript for a completed Webphone session
 */
export async function getWebphoneTranscript(botId: string): Promise<WebphoneTranscriptSegment[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const [botRecord] = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.recallBotId, botId))
      .limit(1);

    if (!botRecord) {
      throw new Error(`Webphone bot ${botId} not found`);
    }

    return botRecord.transcriptJson ? JSON.parse(botRecord.transcriptJson) : [];
  } catch (error) {
    console.error("Failed to get Webphone transcript:", error);
    return [];
  }
}
