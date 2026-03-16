/**
 * tRPC procedures for network analytics
 * Round 61 Features
 */
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import * as analyticsDb from "@/server/db.analytics";

export const networkAnalyticsRouter = router({
  /**
   * Get network metrics for a kiosk
   */
  getKioskMetrics: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await analyticsDb.getKioskMetrics(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return metrics;
    }),

  /**
   * Get average metrics for a kiosk
   */
  getAverageMetrics: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await analyticsDb.getAverageMetrics(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return metrics;
    }),

  /**
   * Get failover events for a kiosk
   */
  getFailoverEvents: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const events = await analyticsDb.getFailoverEvents(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return events;
    }),

  /**
   * Get failover statistics
   */
  getFailoverStats: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const stats = await analyticsDb.getFailoverStats(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return stats;
    }),

  /**
   * Get stability metrics
   */
  getStabilityMetrics: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        period: z.enum(["hourly", "daily", "weekly"]),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await analyticsDb.getStabilityMetrics(
        input.kioskId,
        input.eventId,
        input.period,
        input.startTime,
        input.endTime
      );
      return metrics;
    }),

  /**
   * Get active anomalies
   */
  getActiveAnomalies: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const anomalies = await analyticsDb.getActiveAnomalies(
        input.kioskId,
        input.eventId
      );
      return anomalies;
    }),

  /**
   * Get all anomalies within time range
   */
  getAnomalies: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const anomalies = await analyticsDb.getAnomalies(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return anomalies;
    }),

  /**
   * Resolve anomaly
   */
  resolveAnomaly: protectedProcedure
    .input(z.object({ anomalyId: z.number() }))
    .mutation(async ({ input }) => {
      await analyticsDb.resolveAnomaly(input.anomalyId);
      return { success: true };
    }),

  /**
   * Get metrics for all kiosks in an event
   */
  getEventMetrics: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await analyticsDb.getEventMetrics(
        input.eventId,
        input.startTime,
        input.endTime
      );
      return metrics;
    }),

  /**
   * Get network type distribution
   */
  getNetworkTypeDistribution: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const distribution = await analyticsDb.getNetworkTypeDistribution(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return distribution;
    }),

  /**
   * Get connection quality distribution
   */
  getConnectionQualityDistribution: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const distribution = await analyticsDb.getConnectionQualityDistribution(
        input.kioskId,
        input.eventId,
        input.startTime,
        input.endTime
      );
      return distribution;
    }),
});
