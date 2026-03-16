/**
 * Alert Suppression Rules Router
 * Round 63 Features
 */
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import * as alertDb from "@/server/db.alerts";

export const alertSuppressionRouter = router({
  /**
   * Create a new suppression rule
   */
  createRule: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        ruleName: z.string(),
        anomalyType: z.string(),
        suppressionType: z.enum(["time_based", "condition_based", "threshold_based"]),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        conditions: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return alertDb.createSuppressionRule(
        input.kioskId,
        input.eventId,
        input.ruleName,
        input.anomalyType,
        input.suppressionType,
        ctx.user.id,
        {
          startTime: input.startTime,
          endTime: input.endTime,
          conditions: input.conditions,
        }
      );
    }),

  /**
   * Get suppression rules for a kiosk
   */
  getRules: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.getSuppressionRules(input.kioskId, input.eventId);
    }),

  /**
   * Update a suppression rule
   */
  updateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        ruleName: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        conditions: z.record(z.any()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { ruleId, ...updates } = input;
      return alertDb.updateSuppressionRule(ruleId, updates);
    }),

  /**
   * Delete a suppression rule
   */
  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ input }) => {
      return alertDb.deleteSuppressionRule(input.ruleId);
    }),

  /**
   * Check if an alert should be suppressed
   */
  shouldSuppress: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        anomalyType: z.string(),
        metricValue: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return alertDb.shouldSuppressAlert(
        input.kioskId,
        input.eventId,
        input.anomalyType,
        input.metricValue
      );
    }),
});
