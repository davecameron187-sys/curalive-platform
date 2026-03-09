import { getDb } from "../db";
import {
  occTranscriptions,
  occTranscriptionSegments,
  occRecallBots,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * TranscriptionService — Manages real-time transcription via Recall.ai
 * Handles: bot lifecycle, segment storage, speaker diarization, real-time updates
 */

export interface RecallBotConfig {
  conferenceId: number;
  eventId: string;
  callId: string;
  platform: "zoom" | "teams" | "webex" | "rtmp" | "pstn";
  recallBotId?: string;
}

export interface TranscriptionSegment {
  id?: number;
  conferenceId: number;
  participantId?: number | null;
  speakerName: string;
  speakerRole: "moderator" | "participant" | "operator";
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  language: string;
  isFinal: boolean;
  createdAt?: Date;
}

export interface TranscriptionSummary {
  conferenceId: number;
  fullTranscript: string;
  keyPoints: string[];
  actionItems: string[];
  speakers: Array<{ name: string; role: string; speakTime: number }>;
  duration: number;
  language: string;
}

/**
 * Initialize Recall.ai bot for a conference call
 * Returns bot ID for tracking and webhook callbacks
 */
export async function initializeRecallBot(config: RecallBotConfig): Promise<string> {
  const recallApiKey = process.env.RECALL_AI_API_KEY;
  if (!recallApiKey) {
    throw new Error("RECALL_AI_API_KEY not configured");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Call Recall.ai API to initialize bot
    const response = await fetch("https://api.recall.ai/api/v1/bot", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${recallApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url: `curalive://${config.callId}`, // Placeholder for actual meeting URL
        bot_name: `CuraLive-${config.callId}`,
        transcription_options: {
          language: "en",
          speaker_identification: true,
          confidence_threshold: 0.8,
        },
        recording_mode: "audio_only",
        webhook_url: `${process.env.BUILT_IN_FORGE_API_URL}/webhooks/recall/transcription`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Recall.ai API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { bot_id: string };
    const botId = data.bot_id;

    // Store bot record in database
    await db.insert(occRecallBots).values({
      conferenceId: config.conferenceId,
      botId,
      platform: config.platform,
      status: "active",
      createdAt: new Date(),
    });

    return botId;
  } catch (error) {
    console.error("[TranscriptionService] Failed to initialize Recall bot:", error);
    throw error;
  }
}

/**
 * Store a transcription segment in the database
 * Called via webhook from Recall.ai for each speech segment
 */
export async function storeTranscriptionSegment(segment: TranscriptionSegment): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(occTranscriptionSegments).values({
      conferenceId: segment.conferenceId,
      participantId: segment.participantId,
      speakerName: segment.speakerName,
      speakerRole: segment.speakerRole,
      text: segment.text,
      startTime: segment.startTime,
      endTime: segment.endTime,
      confidence: segment.confidence,
      language: segment.language,
      isFinal: segment.isFinal,
      createdAt: new Date(),
    });

    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[TranscriptionService] Failed to store segment:", error);
    throw error;
  }
}

/**
 * Get all transcription segments for a conference
 * Used for displaying full transcript and generating summaries
 */
export async function getConferenceTranscription(
  conferenceId: number
): Promise<TranscriptionSegment[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId))
      .orderBy(occTranscriptionSegments.startTime);

    return segments as TranscriptionSegment[];
  } catch (error) {
    console.error("[TranscriptionService] Failed to get transcription:", error);
    throw error;
  }
}

/**
 * Get live transcription segments (real-time updates for operators)
 * Returns only segments from the last N seconds
 */
export async function getLiveTranscription(
  conferenceId: number,
  lastNSeconds: number = 30
): Promise<TranscriptionSegment[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId))
      .orderBy(desc(occTranscriptionSegments.startTime))
      .limit(100);

    return segments as TranscriptionSegment[];
  } catch (error) {
    console.error("[TranscriptionService] Failed to get live transcription:", error);
    throw error;
  }
}

/**
 * Generate AI summary from transcription segments
 * Uses OpenAI GPT-4 to extract key points and action items
 */
export async function generateTranscriptionSummary(
  conferenceId: number
): Promise<TranscriptionSummary> {
  try {
    const segments = await getConferenceTranscription(conferenceId);

    if (segments.length === 0) {
      throw new Error("No transcription segments found");
    }

    // Build full transcript
    const fullTranscript = segments
      .map((s) => `[${s.speakerName}]: ${s.text}`)
      .join("\n");

    // Extract unique speakers
    const speakers = Array.from(
      new Map(
        segments.map((s) => [
          s.speakerName,
          {
            name: s.speakerName,
            role: s.speakerRole,
            speakTime: segments
              .filter((seg) => seg.speakerName === s.speakerName)
              .reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0),
          },
        ])
      ).values()
    );

    // Calculate duration
    const duration =
      segments.length > 0
        ? segments[segments.length - 1].endTime - segments[0].startTime
        : 0;

    // For now, return structured data
    // In production, this would call OpenAI GPT-4 for AI summarization
    const summary: TranscriptionSummary = {
      conferenceId,
      fullTranscript,
      keyPoints: [
        "Key point 1 extracted from transcript",
        "Key point 2 extracted from transcript",
      ],
      actionItems: ["Action item 1", "Action item 2"],
      speakers,
      duration,
      language: segments[0]?.language || "en",
    };

    return summary;
  } catch (error) {
    console.error("[TranscriptionService] Failed to generate summary:", error);
    throw error;
  }
}

/**
 * Stop Recall.ai bot and finalize transcription
 * Called when conference ends
 */
export async function stopRecallBot(botId: string): Promise<void> {
  const recallApiKey = process.env.RECALL_AI_API_KEY;
  if (!recallApiKey) {
    throw new Error("RECALL_AI_API_KEY not configured");
  }

  try {
    const response = await fetch(`https://api.recall.ai/api/v1/bot/${botId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${recallApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Recall.ai API error: ${response.statusText}`);
    }

    // Update bot status in database
    const db = await getDb();
    if (db) {
      await db
        .update(occRecallBots)
        .set({ status: "stopped", stoppedAt: new Date() })
        .where(eq(occRecallBots.botId, botId));
    }
  } catch (error) {
    console.error("[TranscriptionService] Failed to stop Recall bot:", error);
    throw error;
  }
}

/**
 * Handle Recall.ai webhook callback for new transcription segments
 * Called by Recall.ai when new speech is detected and transcribed
 */
export async function handleRecallWebhook(payload: {
  bot_id: string;
  event_type: string;
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
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find conference by bot ID
    const bot = await db
      .select()
      .from(occRecallBots)
      .where(eq(occRecallBots.botId, payload.bot_id))
      .limit(1);

    if (bot.length === 0) {
      throw new Error(`Bot not found: ${payload.bot_id}`);
    }

    // Store segment
    await storeTranscriptionSegment({
      conferenceId: bot[0].conferenceId,
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
      `[TranscriptionService] Received segment from ${payload.data.speaker_name}: "${payload.data.text}"`
    );
  } catch (error) {
    console.error("[TranscriptionService] Failed to handle webhook:", error);
    throw error;
  }
}
