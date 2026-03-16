/**
 * Recording Transcription Service — Transcribe green room recordings using Whisper API
 * Automatically triggered when recording is completed.
 */

import { transcribeAudio, type TranscriptionResponse } from "./voiceTranscription";
import { db } from "../db";
import { occGreenRoomTranscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type RecordingTranscriptionOptions = {
  recordingId: number;
  conferenceId: number;
  recordingUrl: string;
  language?: string;
};

export type RecordingTranscriptionResult = {
  success: boolean;
  transcriptionId?: number;
  transcriptText?: string;
  error?: string;
  details?: string;
};

/**
 * Transcribe a green room recording and save results to database
 * @param options Recording metadata and URL
 * @returns Transcription result with ID and status
 */
export async function transcribeRecording(
  options: RecordingTranscriptionOptions
): Promise<RecordingTranscriptionResult> {
  try {
    // Step 1: Create pending transcription record
    const [pendingRecord] = await db
      .insert(occGreenRoomTranscriptions)
      .values({
        recordingId: options.recordingId,
        conferenceId: options.conferenceId,
        status: "processing",
        startedAt: new Date(),
      });

    const transcriptionId = (pendingRecord as any).insertId || 0;

    // Step 2: Call Whisper API
    const transcriptionResult = await transcribeAudio({
      audioUrl: options.recordingUrl,
      language: options.language || "en",
      prompt: "Transcribe this green room speaker recording. Include all speaker names and timestamps.",
    });

    // Step 3: Handle transcription error
    if ("error" in transcriptionResult) {
      await db
        .update(occGreenRoomTranscriptions)
        .set({
          status: "failed",
          errorMessage: `${transcriptionResult.error}: ${transcriptionResult.details || ""}`,
          completedAt: new Date(),
        })
        .where(eq(occGreenRoomTranscriptions.id, transcriptionId));

      return {
        success: false,
        transcriptionId,
        error: transcriptionResult.error,
        details: transcriptionResult.details,
      };
    }

    // Step 4: Save successful transcription
    const whisperResponse = transcriptionResult as TranscriptionResponse;

    await db
      .update(occGreenRoomTranscriptions)
      .set({
        transcriptText: whisperResponse.text,
        language: whisperResponse.language,
        duration: whisperResponse.duration,
        segments: whisperResponse.segments as any,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(occGreenRoomTranscriptions.id, transcriptionId));

    return {
      success: true,
      transcriptionId,
      transcriptText: whisperResponse.text,
    };
  } catch (error) {
    console.error("[RecordingTranscription] Error:", error);
    return {
      success: false,
      error: "Transcription service error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get transcription by recording ID
 */
export async function getRecordingTranscription(recordingId: number) {
  const result = await db
    .select()
    .from(occGreenRoomTranscriptions)
    .where(eq(occGreenRoomTranscriptions.recordingId, recordingId));

  return result[0] || null;
}

/**
 * Get all transcriptions for a conference
 */
export async function getConferenceTranscriptions(conferenceId: number) {
  return await db
    .select()
    .from(occGreenRoomTranscriptions)
    .where(eq(occGreenRoomTranscriptions.conferenceId, conferenceId));
}
