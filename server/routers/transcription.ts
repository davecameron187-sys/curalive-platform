import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { transcriptionJobs, occTranscriptionSegments, transcriptEdits } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const transcriptionRouter = router({
  startWhisperJob: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      audioUrl: z.string().optional(),
      language: z.string().default("en"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        const [result] = await db.insert(transcriptionJobs).values({
          eventId: input.eventId,
          source: "whisper",
          status: "failed",
          errorMessage: "OpenAI API key not configured. Set OPENAI_API_KEY to enable Whisper transcription.",
          languagesRequested: JSON.stringify([input.language]),
          audioUrl: input.audioUrl ?? null,
        });
        return { jobId: (result as any).insertId, status: "failed", error: "OpenAI API key not configured" };
      }
      const [result] = await db.insert(transcriptionJobs).values({
        eventId: input.eventId,
        source: "whisper",
        status: "queued",
        languagesRequested: JSON.stringify([input.language]),
        audioUrl: input.audioUrl ?? null,
      });
      return { jobId: (result as any).insertId, status: "queued" };
    }),

  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { status: "unknown" };
      const rows = await db.select().from(transcriptionJobs)
        .where(eq(transcriptionJobs.id, input.jobId))
        .limit(1);
      const job = rows[0];
      if (!job) return { status: "not_found" };
      return {
        status: job.status,
        source: job.source,
        languageDetected: job.languageDetected,
        wordCount: job.wordCount,
        durationSeconds: job.durationSeconds,
        confidenceScore: job.confidenceScore,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };
    }),

  getTranscript: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { segments: [], metadata: null };
      const jobs = await db.select().from(transcriptionJobs)
        .where(eq(transcriptionJobs.eventId, input.eventId))
        .orderBy(desc(transcriptionJobs.createdAt));
      
      const segments = await db.select().from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.conferenceId, input.eventId))
        .orderBy(occTranscriptionSegments.startTimeMs);

      const completed = jobs.find(j => j.status === "completed");
      return {
        segments: segments.map(s => ({
          id: s.id,
          speaker: s.speakerName,
          text: s.content,
          startTime: s.startTimeMs ? s.startTimeMs / 1000 : 0,
          endTime: s.endTimeMs ? s.endTimeMs / 1000 : 0,
          confidence: s.confidence,
        })),
        metadata: completed ? {
          source: completed.source,
          language: completed.languageDetected,
          wordCount: completed.wordCount,
          duration: completed.durationSeconds,
          confidence: completed.confidenceScore,
          completedAt: completed.completedAt,
        } : null,
        latestJob: jobs[0] ?? null,
      };
    }),

  updateSegment: protectedProcedure
    .input(z.object({
      segmentId: z.number(),
      text: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [segment] = await db.select().from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.id, input.segmentId))
        .limit(1);

      if (!segment) throw new Error("Segment not found");

      // Audit trail
      await db.insert(transcriptEdits).values({
        conferenceId: parseInt(segment.conferenceId), // Assuming numeric conferenceId in edits table, adjust if needed
        segmentId: input.segmentId,
        operatorId: ctx.user?.id ?? 0,
        originalText: segment.content,
        correctedText: input.text,
        editType: "manual_correction",
        reason: input.reason ?? "Manual correction",
        status: "completed"
      });

      await db.update(occTranscriptionSegments)
        .set({ content: input.text })
        .where(eq(occTranscriptionSegments.id, input.segmentId));

      return { success: true };
    }),

  exportTranscript: protectedProcedure
    .input(z.object({ 
      eventId: z.string(),
      format: z.enum(["txt", "srt", "vtt", "json"])
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const segments = await db.select().from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.conferenceId, input.eventId))
        .orderBy(occTranscriptionSegments.startTimeMs);

      if (input.format === "json") {
        return { content: JSON.stringify(segments, null, 2), contentType: "application/json" };
      }

      let content = "";
      if (input.format === "txt") {
        content = segments.map(s => `[${s.speakerName ?? "Speaker"}] ${s.content}`).join("\n\n");
        return { content, contentType: "text/plain" };
      }

      // Basic SRT/VTT formatting (simplified)
      const formatTime = (ms: number, isVtt: boolean) => {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const remainingMs = ms % 1000;
        const separator = isVtt ? "." : ",";
        return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}${separator}${String(remainingMs).padStart(3, '0')}`;
      };

      if (input.format === "vtt") {
        content = "WEBVTT\n\n" + segments.map((s, i) => 
          `${formatTime(s.startTimeMs ?? 0, true)} --> ${formatTime(s.endTimeMs ?? 0, true)}\n${s.speakerName ? `<v ${s.speakerName}>` : ""}${s.content}\n`
        ).join("\n");
        return { content, contentType: "text/vtt" };
      }

      if (input.format === "srt") {
        content = segments.map((s, i) => 
          `${i + 1}\n${formatTime(s.startTimeMs ?? 0, false)} --> ${formatTime(s.endTimeMs ?? 0, false)}\n${s.content}\n`
        ).join("\n");
        return { content, contentType: "text/plain" };
      }

      return { content: "", contentType: "text/plain" };
    }),

  listJobs: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(transcriptionJobs)
        .where(eq(transcriptionJobs.eventId, input.eventId))
        .orderBy(desc(transcriptionJobs.createdAt));
    }),

  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(transcriptionJobs).set({ status: "failed", errorMessage: "Cancelled by operator" })
        .where(eq(transcriptionJobs.id, input.jobId));
      return { cancelled: true };
    }),
});
