/**
 * Root Cause Analysis Router
 * Round 63 Features
 */
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import * as alertDb from "@/server/db.alerts";

export const rootCauseAnalysisRouter = router({
  /**
   * Create root cause analysis for an anomaly
   */
  createAnalysis: protectedProcedure
    .input(
      z.object({
        anomalyId: z.number(),
        kioskId: z.string(),
        eventId: z.string(),
        rootCause: z.string(),
        confidence: z.number().min(0).max(1),
        relatedEvents: z.array(z.string()).optional(),
        remediation: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return alertDb.createRootCauseAnalysis(
        input.anomalyId,
        input.kioskId,
        input.eventId,
        input.rootCause,
        input.confidence,
        input.relatedEvents,
        input.remediation
      );
    }),

  /**
   * Get root cause analysis for an anomaly
   */
  getAnalysis: protectedProcedure
    .input(z.object({ anomalyId: z.number() }))
    .query(async ({ input }) => {
      return alertDb.getRootCauseAnalysis(input.anomalyId);
    }),

  /**
   * Get recent root cause analyses
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getRecentRootCauseAnalyses(
        input.kioskId,
        input.eventId,
        input.limit
      );
    }),

  /**
   * Verify a root cause analysis
   */
  verifyAnalysis: protectedProcedure
    .input(z.object({ analysisId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return alertDb.verifyRootCauseAnalysis(input.analysisId, ctx.user.id);
    }),

  /**
   * Get verified root causes
   */
  getVerified: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getVerifiedRootCauses(input.kioskId, input.eventId);
    }),

  /**
   * Get alert statistics
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getAlertStatistics(input.kioskId, input.eventId, {
        startTime: input.startTime,
        endTime: input.endTime,
      });
    }),
});
