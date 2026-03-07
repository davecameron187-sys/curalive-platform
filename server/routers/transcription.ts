import { z } from "zod";
import { router, operatorProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  occTranscriptionSegments,
  occTranscriptions,
  occTranscriptEdits,
  occTranscriptAuditLog,
  occRecallBots,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  initializeRecallBot,
  storeTranscriptionSegment,
  getConferenceTranscription,
  generateTranscriptionSummary,
  stopRecallBot,
} from "../services/TranscriptionService";

/**
 * Transcription Router — tRPC procedures for AI transcription and editing
 */
export const transcriptionRouter = router({
  /**
   * Initialize Recall.ai bot for a conference
   * Called when conference starts
   */
  initializeBot: operatorProcedure
    .input(
      z.object({
        conferenceId: z.number(),
        eventId: z.string(),
        callId: z.string(),
        platform: z.enum(["zoom", "teams", "webex", "rtmp", "pstn"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const botId = await initializeRecallBot({
          conferenceId: input.conferenceId,
          eventId: input.eventId,
          callId: input.callId,
          platform: input.platform,
        });

        return {
          success: true,
          botId,
          message: `Recall.ai bot initialized for ${input.callId}`,
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to initialize bot:", error);
        throw error;
      }
    }),

  /**
   * Get live transcription for a conference (last 30 seconds)
   * Called by OCC to display real-time transcript
   */
  getLiveTranscription: operatorProcedure
    .input(
      z.object({
        conferenceId: z.number(),
        lastNSeconds: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const segments = await db
          .select()
          .from(occTranscriptionSegments)
          .where(eq(occTranscriptionSegments.conferenceId, input.conferenceId))
          .orderBy(desc(occTranscriptionSegments.startTime))
          .limit(100);

        return {
          conferenceId: input.conferenceId,
          segments: segments.reverse(), // Return in chronological order
          count: segments.length,
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to get live transcription:", error);
        throw error;
      }
    }),

  /**
   * Get full conference transcription
   * Called for post-event report or transcript editing
   */
  getFullTranscription: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const transcription = await db
          .select()
          .from(occTranscriptions)
          .where(eq(occTranscriptions.conferenceId, input.conferenceId))
          .limit(1);

        if (transcription.length === 0) {
          return null;
        }

        const segments = await db
          .select()
          .from(occTranscriptionSegments)
          .where(eq(occTranscriptionSegments.conferenceId, input.conferenceId))
          .orderBy(occTranscriptionSegments.startTime);

        return {
          ...transcription[0],
          segments,
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to get full transcription:", error);
        throw error;
      }
    }),

  /**
   * Generate AI summary from transcription
   * Called after conference ends
   */
  generateSummary: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const summary = await generateTranscriptionSummary(input.conferenceId);

        // Store summary in database
        await db
          .insert(occTranscriptions)
          .values({
            conferenceId: input.conferenceId,
            fullTranscript: summary.fullTranscript,
            summary: summary.keyPoints.join("\n"),
            keyPoints: summary.keyPoints,
            actionItems: summary.actionItems,
            speakers: summary.speakers,
            duration: summary.duration,
            language: summary.language,
            wordCount: summary.fullTranscript.split(/\s+/).length,
          })
          .onDuplicateKeyUpdate({
            set: {
              summary: summary.keyPoints.join("\n"),
              keyPoints: summary.keyPoints,
              actionItems: summary.actionItems,
              speakers: summary.speakers,
            },
          });

        return {
          success: true,
          summary,
          message: "Summary generated successfully",
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to generate summary:", error);
        throw error;
      }
    }),

  /**
   * Correct a transcription segment
   * Called by operator to fix transcription errors
   */
  correctSegment: operatorProcedure
    .input(
      z.object({
        segmentId: z.number(),
        conferenceId: z.number(),
        correctedText: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Get original segment
        const segment = await db
          .select()
          .from(occTranscriptionSegments)
          .where(eq(occTranscriptionSegments.id, input.segmentId))
          .limit(1);

        if (segment.length === 0) {
          throw new Error("Segment not found");
        }

        const original = segment[0];

        // Create edit record
        const editResult = await db.insert(occTranscriptEdits).values({
          transcriptionSegmentId: input.segmentId,
          conferenceId: input.conferenceId,
          operatorId: ctx.user.id,
          originalText: original.text,
          correctedText: input.correctedText,
          editType: "correction",
          reason: input.reason,
          approved: false,
        });

        // Update segment with corrected text
        await db
          .update(occTranscriptionSegments)
          .set({ text: input.correctedText })
          .where(eq(occTranscriptionSegments.id, input.segmentId));

        // Log audit event
        await db.insert(occTranscriptAuditLog).values({
          conferenceId: input.conferenceId,
          action: "segment_edited",
          userId: ctx.user.id,
          details: {
            segmentId: input.segmentId,
            originalText: original.text,
            correctedText: input.correctedText,
            reason: input.reason,
          },
        });

        return {
          success: true,
          editId: editResult[0],
          message: "Segment corrected successfully",
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to correct segment:", error);
        throw error;
      }
    }),

  /**
   * Get edit history for a segment
   * Shows all corrections made to a specific segment
   */
  getEditHistory: operatorProcedure
    .input(z.object({ segmentId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const edits = await db
          .select()
          .from(occTranscriptEdits)
          .where(eq(occTranscriptEdits.transcriptionSegmentId, input.segmentId))
          .orderBy(desc(occTranscriptEdits.createdAt));

        return edits;
      } catch (error) {
        console.error("[transcriptionRouter] Failed to get edit history:", error);
        throw error;
      }
    }),

  /**
   * Get audit log for a conference
   * Shows all transcription-related actions for compliance
   */
  getAuditLog: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const auditLog = await db
          .select()
          .from(occTranscriptAuditLog)
          .where(eq(occTranscriptAuditLog.conferenceId, input.conferenceId))
          .orderBy(desc(occTranscriptAuditLog.timestamp));

        return auditLog;
      } catch (error) {
        console.error("[transcriptionRouter] Failed to get audit log:", error);
        throw error;
      }
    }),

  /**
   * Stop Recall.ai bot and finalize transcription
   * Called when conference ends
   */
  stopBot: operatorProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await stopRecallBot(input.botId);

        return {
          success: true,
          message: `Recall.ai bot ${input.botId} stopped successfully`,
        };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to stop bot:", error);
        throw error;
      }
    }),

  /**
   * Webhook handler for Recall.ai transcription updates
   * Called by Recall.ai when new segments are transcribed
   */
  handleRecallWebhook: publicProcedure
    .input(
      z.object({
        bot_id: z.string(),
        event_type: z.string(),
        data: z.object({
          speaker_name: z.string(),
          speaker_id: z.string().optional(),
          text: z.string(),
          start_time: z.number(),
          end_time: z.number(),
          confidence: z.number(),
          language: z.string(),
          is_final: z.boolean(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Find conference by bot ID
        const bot = await db
          .select()
          .from(occRecallBots)
          .where(eq(occRecallBots.botId, input.bot_id))
          .limit(1);

        if (bot.length === 0) {
          throw new Error(`Bot not found: ${input.bot_id}`);
        }

        const conferenceId = bot[0].conferenceId;

        // Store segment
        await storeTranscriptionSegment({
          conferenceId,
          speakerName: input.data.speaker_name,
          speakerRole: "participant",
          text: input.data.text,
          startTime: input.data.start_time,
          endTime: input.data.end_time,
          confidence: Math.round(input.data.confidence * 100),
          language: input.data.language,
          isFinal: input.data.is_final,
        });

        console.log(
          `[transcriptionRouter] Stored segment from ${input.data.speaker_name}: "${input.data.text}"`
        );

        return { success: true, conferenceId };
      } catch (error) {
        console.error("[transcriptionRouter] Failed to handle webhook:", error);
        throw error;
      }
    }),
});
