import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { transcriptionJobs } from "../../drizzle/schema";
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
      const completed = jobs.find(j => j.status === "completed");
      return {
        segments: [],
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
