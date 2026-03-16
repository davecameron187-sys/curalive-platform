/**
 * Report Scheduling tRPC Router
 * Procedures for managing scheduled report generation
 */
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  startReportScheduler,
  stopReportScheduler,
  getActiveSchedulers,
  triggerReportGeneration,
  initializeReportSchedulers,
} from "../services/reportScheduler";
import { z } from "zod";
import { getDb } from "../db";
import { reportConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const reportSchedulingRouter = router({
  /**
   * Start scheduler for a report config
   */
  startScheduler: adminProcedure
    .input(z.object({ configId: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await startReportScheduler(input.configId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Stop scheduler for a report config
   */
  stopScheduler: adminProcedure
    .input(z.object({ configId: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await stopReportScheduler(input.configId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get all active schedulers
   */
  getActiveSchedulers: adminProcedure.query(async () => {
    const schedulers = getActiveSchedulers();
    return schedulers.map((s) => ({
      configId: s.configId,
      cronExpression: s.cronExpression,
    }));
  }),

  /**
   * Manually trigger report generation
   */
  triggerReport: adminProcedure
    .input(z.object({ configId: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await triggerReportGeneration(input.configId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Initialize all schedulers on startup
   */
  initializeSchedulers: adminProcedure.mutation(async () => {
    try {
      await initializeReportSchedulers();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get report config with scheduler status
   */
  getConfigWithStatus: protectedProcedure
    .input(z.object({ configId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const config = await db
        .select()
        .from(reportConfigs)
        .where(eq(reportConfigs.id, input.configId));

      if (config.length === 0) return null;

      const schedulers = getActiveSchedulers();
      const isScheduled = schedulers.some((s) => s.configId === input.configId);

      return {
        ...config[0],
        isScheduled,
      };
    }),

  /**
   * List all report configs with scheduler status
   */
  listConfigsWithStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const configs = await db
      .select()
      .from(reportConfigs)
      .where(eq(reportConfigs.createdBy, ctx.user.id));

    const schedulers = getActiveSchedulers();

    return configs.map((config) => ({
      ...config,
      isScheduled: schedulers.some((s) => s.configId === config.id),
    }));
  }),
});
