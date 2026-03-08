/**
 * Training Mode tRPC Router
 * Manages training sessions, conferences, participants, call logs, and performance metrics.
 * All data is isolated to training tables — no production data is touched.
 */
import { z } from "zod";
import { router, protectedProcedure, operatorProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  trainingModeSessions,
  trainingConferences,
  trainingParticipants,
  trainingLounge,
  trainingCallLogs,
  trainingPerformanceMetrics,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── createSession ────────────────────────────────────────────────────────────
const createSession = protectedProcedure
  .input(z.object({
    sessionName: z.string().min(1).max(255),
    scenario: z.enum(["earnings-call", "roadshow", "webcast", "audio-bridge", "board-meeting", "general"]),
    mentorId: z.number().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [result] = await db.insert(trainingModeSessions).values({
      operatorId: ctx.user.id,
      operatorName: ctx.user.name ?? "Operator",
      sessionName: input.sessionName,
      scenario: input.scenario,
      mentorId: input.mentorId ?? null,
      status: "active",
    });
    return { sessionId: (result as any).insertId, createdAt: new Date() };
  });

// ─── startConference ──────────────────────────────────────────────────────────
const startConference = protectedProcedure
  .input(z.object({
    sessionId: z.number(),
    eventId: z.string(),
    callId: z.string(),
    subject: z.string(),
    product: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [result] = await db.insert(trainingConferences).values({
      trainingSessionId: input.sessionId,
      eventId: input.eventId,
      callId: input.callId,
      subject: input.subject,
      product: input.product ?? null,
      status: "active",
    });
    return { conferenceId: (result as any).insertId, status: "active" };
  });

// ─── logCall ──────────────────────────────────────────────────────────────────
const logCall = protectedProcedure
  .input(z.object({
    sessionId: z.number(),
    conferenceId: z.number(),
    participantName: z.string(),
    duration: z.number().int().min(0),
    quality: z.enum(["poor", "fair", "good", "excellent"]),
    operatorPerformance: z.record(z.unknown()).optional(),
    participantFeedback: z.record(z.unknown()).optional(),
    recordingUrl: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [result] = await db.insert(trainingCallLogs).values({
      trainingSessionId: input.sessionId,
      trainingConferenceId: input.conferenceId,
      operatorId: ctx.user.id,
      participantName: input.participantName,
      callDuration: input.duration,
      callQuality: input.quality,
      operatorPerformance: input.operatorPerformance ? JSON.stringify(input.operatorPerformance) : null,
      participantFeedback: input.participantFeedback ? JSON.stringify(input.participantFeedback) : null,
      recordingUrl: input.recordingUrl ?? null,
      endedAt: new Date(),
    });
    return { callId: (result as any).insertId, logged: true };
  });

// ─── recordMetrics ────────────────────────────────────────────────────────────
const recordMetrics = protectedProcedure
  .input(z.object({
    sessionId: z.number(),
    communicationScore: z.number().min(0).max(5),
    problemSolvingScore: z.number().min(0).max(5),
    professionalism: z.number().min(0).max(5),
    callQualityScore: z.number().min(0).max(5).optional(),
    participantSatisfaction: z.number().min(0).max(5).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const overall = (
      (input.communicationScore + input.problemSolvingScore + input.professionalism) / 3
    ).toFixed(2);
    const existing = await db.select().from(trainingPerformanceMetrics)
      .where(and(
        eq(trainingPerformanceMetrics.trainingSessionId, input.sessionId),
        eq(trainingPerformanceMetrics.operatorId, ctx.user.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(trainingPerformanceMetrics).set({
        communicationScore: String(input.communicationScore),
        problemSolvingScore: String(input.problemSolvingScore),
        professionalism: String(input.professionalism),
        callQualityScore: String(input.callQualityScore ?? 0),
        averageParticipantSatisfaction: String(input.participantSatisfaction ?? 0),
        overallScore: overall,
        evaluatedAt: new Date(),
      }).where(eq(trainingPerformanceMetrics.id, existing[0].id));
      return { metricsId: existing[0].id, overallScore: parseFloat(overall) };
    }

    const [result] = await db.insert(trainingPerformanceMetrics).values({
      trainingSessionId: input.sessionId,
      operatorId: ctx.user.id,
      communicationScore: String(input.communicationScore),
      problemSolvingScore: String(input.problemSolvingScore),
      professionalism: String(input.professionalism),
      callQualityScore: String(input.callQualityScore ?? 0),
      averageParticipantSatisfaction: String(input.participantSatisfaction ?? 0),
      overallScore: overall,
      evaluatedAt: new Date(),
    });
    return { metricsId: (result as any).insertId, overallScore: parseFloat(overall) };
  });

// ─── completeSession ──────────────────────────────────────────────────────────
const completeSession = protectedProcedure
  .input(z.object({
    sessionId: z.number(),
    finalOverallScore: z.number().min(0).max(5),
    readyForProduction: z.boolean(),
    mentorNotes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(trainingModeSessions).set({
      status: "completed",
      completedAt: new Date(),
    }).where(eq(trainingModeSessions.id, input.sessionId));

    await db.update(trainingPerformanceMetrics).set({
      overallScore: String(input.finalOverallScore),
      readyForProduction: input.readyForProduction,
      mentorNotes: input.mentorNotes ?? null,
      evaluatedAt: new Date(),
    }).where(and(
      eq(trainingPerformanceMetrics.trainingSessionId, input.sessionId),
      eq(trainingPerformanceMetrics.operatorId, ctx.user.id)
    ));

    return { sessionId: input.sessionId, status: "completed" };
  });

// ─── getSessionMetrics ────────────────────────────────────────────────────────
const getSessionMetrics = protectedProcedure
  .input(z.object({ sessionId: z.number() }))
  .query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { metrics: null, callLogs: [], overallScore: 0 };

    const [metrics] = await db.select().from(trainingPerformanceMetrics)
      .where(eq(trainingPerformanceMetrics.trainingSessionId, input.sessionId))
      .limit(1);

    const callLogs = await db.select().from(trainingCallLogs)
      .where(eq(trainingCallLogs.trainingSessionId, input.sessionId))
      .orderBy(desc(trainingCallLogs.createdAt));

    return {
      metrics: metrics ?? null,
      callLogs,
      overallScore: metrics ? parseFloat(metrics.overallScore) : 0,
    };
  });

// ─── getOperatorSessions ──────────────────────────────────────────────────────
const getOperatorSessions = protectedProcedure
  .input(z.object({ operatorId: z.number().optional() }))
  .query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { sessions: [] };
    const targetId = input.operatorId ?? ctx.user.id;
    const sessions = await db.select().from(trainingModeSessions)
      .where(eq(trainingModeSessions.operatorId, targetId))
      .orderBy(desc(trainingModeSessions.createdAt));
    return { sessions };
  });

// ─── getActiveSessions ────────────────────────────────────────────────────────
const getActiveSessions = adminProcedure
  .query(async () => {
    const db = await getDb();
    if (!db) return { sessions: [] };
    const sessions = await db.select().from(trainingModeSessions)
      .where(eq(trainingModeSessions.status, "active"))
      .orderBy(desc(trainingModeSessions.createdAt));
    return { sessions };
  });

// ─── Export router ────────────────────────────────────────────────────────────
export const trainingModeRouter = router({
  createSession,
  startConference,
  logCall,
  recordMetrics,
  completeSession,
  getSessionMetrics,
  getOperatorSessions,
  getActiveSessions,
});
