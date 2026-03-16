/**
 * Alert Thresholds Router
 * Round 63 Features
 */
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import * as alertDb from "@/server/db.alerts";

export const alertThresholdsRouter = router({
  /**
   * Create a new alert threshold
   */
  createThreshold: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        metricType: z.string(),
        warningThreshold: z.number(),
        criticalThreshold: z.number(),
        unit: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return alertDb.createAlertThreshold(
        input.kioskId,
        input.eventId,
        input.metricType,
        input.warningThreshold,
        input.criticalThreshold,
        input.unit,
        ctx.user.id
      );
    }),

  /**
   * Get alert thresholds for a kiosk
   */
  getThresholds: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getAlertThresholds(input.kioskId, input.eventId);
    }),

  /**
   * Get threshold for a specific metric
   */
  getThresholdForMetric: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        metricType: z.string(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getThresholdForMetric(
        input.kioskId,
        input.eventId,
        input.metricType
      );
    }),

  /**
   * Update an alert threshold
   */
  updateThreshold: protectedProcedure
    .input(
      z.object({
        thresholdId: z.number(),
        warningThreshold: z.number().optional(),
        criticalThreshold: z.number().optional(),
        unit: z.string().optional(),
        isEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { thresholdId, ...updates } = input;
      return alertDb.updateAlertThreshold(thresholdId, updates);
    }),

  /**
   * Delete an alert threshold
   */
  deleteThreshold: protectedProcedure
    .input(z.object({ thresholdId: z.number() }))
    .mutation(async ({ input }) => {
      return alertDb.deleteAlertThreshold(input.thresholdId);
    }),

  /**
   * Assess alert severity based on thresholds
   */
  assessSeverity: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        metricType: z.string(),
        metricValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.assessAlertSeverity(
        input.kioskId,
        input.eventId,
        input.metricType,
        input.metricValue
      );
    }),
});
