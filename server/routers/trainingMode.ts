import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createTrainingSession,
  getOperatorTrainingSessions,
  getTrainingSessionDetails,
  createTrainingConference,
  getTrainingConferencesBySession,
  addTrainingParticipant,
  logTrainingCall,
  getTrainingCallLogs,
  upsertTrainingPerformanceMetrics,
  getTrainingPerformanceMetrics,
  completeTrainingSession,
  getDb,
} from "../db";
import { trainingModeSessions, trainingPerformanceMetrics } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const trainingModeRouter = router({
  /**
   * Create a new training session for an operator.
   */
  createSession: protectedProcedure
    .input(
      z.object({
        sessionName: z.string().min(1, "Session name is required"),
        trainingScenario: z.enum(["earnings-call", "webcast", "roadshow", "hybrid", "other"]),
        mentorId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const operatorName = ctx.user?.name || "Unknown Operator";

      return await createTrainingSession(
        userId,
        operatorName,
        input.sessionName,
        input.trainingScenario,
        input.mentorId
      );
    }),

  /**
   * Get all training sessions for the current operator.
   */
  getMyTrainingSessions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    return await getOperatorTrainingSessions(userId);
  }),

  /**
   * Get detailed information about a specific training session.
   */
  getSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return await getTrainingSessionDetails(input.sessionId);
    }),

  /**
   * Get all training conferences for a session.
   */
  getSessionConferences: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return await getTrainingConferencesBySession(input.sessionId);
    }),

  /**
   * Create a training conference within a session.
   */
  createConference: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.number(),
        eventId: z.string(),
        subject: z.string(),
        product: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const callId = `TC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      return await createTrainingConference({
        trainingSessionId: input.trainingSessionId,
        eventId: input.eventId,
        callId,
        subject: input.subject,
        product: input.product || "Training Conference",
        status: "pending",
      });
    }),

  /**
   * Add a participant to a training conference.
   */
  addParticipant: protectedProcedure
    .input(
      z.object({
        trainingConferenceId: z.number(),
        lineNumber: z.number(),
        role: z.enum(["moderator", "participant", "operator", "host"]),
        name: z.string().optional(),
        company: z.string().optional(),
        phoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await addTrainingParticipant({
        trainingConferenceId: input.trainingConferenceId,
        lineNumber: input.lineNumber,
        role: input.role,
        name: input.name,
        company: input.company,
        phoneNumber: input.phoneNumber,
        state: "incoming",
      });
    }),

  /**
   * Log a training call for review and coaching.
   */
  logCall: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.number(),
        trainingConferenceId: z.number(),
        participantName: z.string().optional(),
        callDuration: z.number(), // in seconds
        callQuality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        operatorPerformance: z.record(z.any()).optional(),
        participantFeedback: z.record(z.any()).optional(),
        recordingUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const operatorId = ctx.user?.id;
      if (!operatorId) throw new Error("User not authenticated");

      return await logTrainingCall({
        trainingSessionId: input.trainingSessionId,
        trainingConferenceId: input.trainingConferenceId,
        operatorId,
        participantName: input.participantName,
        callDuration: input.callDuration,
        callQuality: input.callQuality,
        operatorPerformance: input.operatorPerformance ? JSON.stringify(input.operatorPerformance) : null,
        participantFeedback: input.participantFeedback ? JSON.stringify(input.participantFeedback) : null,
        recordingUrl: input.recordingUrl,
        startedAt: new Date(),
        endedAt: new Date(),
      });
    }),

  /**
   * Get all training call logs for a session.
   */
  getCallLogs: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return await getTrainingCallLogs(input.sessionId);
    }),

  /**
   * Update training performance metrics for an operator.
   */
  updatePerformanceMetrics: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.number(),
        totalCallsHandled: z.number().optional(),
        averageCallDuration: z.number().optional(),
        callQualityScore: z.number().optional(),
        averageParticipantSatisfaction: z.number().optional(),
        communicationScore: z.number().optional(),
        problemSolvingScore: z.number().optional(),
        professionalism: z.number().optional(),
        overallScore: z.number().optional(),
        readyForProduction: z.boolean().optional(),
        mentorNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const operatorId = ctx.user?.id;
      if (!operatorId) throw new Error("User not authenticated");

      return await upsertTrainingPerformanceMetrics({
        trainingSessionId: input.trainingSessionId,
        operatorId,
        totalCallsHandled: input.totalCallsHandled || 0,
        averageCallDuration: input.averageCallDuration || 0,
        callQualityScore: input.callQualityScore ? (input.callQualityScore as any) : undefined,
        averageParticipantSatisfaction: input.averageParticipantSatisfaction ? (input.averageParticipantSatisfaction as any) : undefined,
        communicationScore: input.communicationScore ? (input.communicationScore as any) : undefined,
        problemSolvingScore: input.problemSolvingScore ? (input.problemSolvingScore as any) : undefined,
        professionalism: input.professionalism ? (input.professionalism as any) : undefined,
        overallScore: input.overallScore ? (input.overallScore as any) : undefined,
        readyForProduction: input.readyForProduction || false,
        mentorNotes: input.mentorNotes,
      });
    }),

  /**
   * Get performance metrics for an operator in a training session.
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const operatorId = ctx.user?.id;
      if (!operatorId) throw new Error("User not authenticated");

      return await getTrainingPerformanceMetrics(input.sessionId, operatorId);
    }),

  /**
   * Complete a training session and evaluate readiness for production.
   */
  completeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        finalOverallScore: z.number(),
        readyForProduction: z.boolean(),
        mentorNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const operatorId = ctx.user?.id;
      if (!operatorId) throw new Error("User not authenticated");

      return await completeTrainingSession(input.sessionId, {
        trainingSessionId: input.sessionId,
        operatorId,
        overallScore: (input.finalOverallScore as any),
        readyForProduction: input.readyForProduction,
        mentorNotes: input.mentorNotes,
        evaluatedAt: new Date(),
      });
    }),

  /**
   * Get all active training sessions (admin/mentor view).
   */
  getAllActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    // Only admins and mentors can view all sessions
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "operator") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(trainingModeSessions)
      .where(eq(trainingModeSessions.status, "active"))
      .orderBy(desc(trainingModeSessions.createdAt));
  }),

  /**
   * Get performance summary for all operators in training.
   */
  getTrainingPerformanceSummary: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view performance summary
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(trainingPerformanceMetrics)
      .orderBy(desc(trainingPerformanceMetrics.overallScore));
  }),
});
