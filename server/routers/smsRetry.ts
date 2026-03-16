/**
 * SMS Retry tRPC Router
 * Procedures for managing SMS retry queue
 */
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  addToRetryQueue,
  getPendingRetries,
  processSMSRetry,
  processAllPendingRetries,
  getRetryQueueStats,
  clearOldRetries,
  manualRetryTrigger,
} from "../services/smsRetryService";
import { z } from "zod";
import { getDb } from "../db";
import { smsRetryQueue } from "../../drizzle/schema";

export const smsRetryRouter = router({
  /**
   * Add SMS to retry queue
   */
  addToQueue: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        message: z.string().min(1),
        eventId: z.string(),
        maxAttempts: z.number().int().min(1).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const retryId = await addToRetryQueue(
        input.phoneNumber,
        input.message,
        input.eventId,
        input.maxAttempts || 3
      );

      return {
        success: retryId !== null,
        retryId,
      };
    }),

  /**
   * Get pending retries
   */
  getPending: adminProcedure.query(async () => {
    const retries = await getPendingRetries();
    return retries;
  }),

  /**
   * Get full retry queue
   */
  getQueue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const queue = await db.select().from(smsRetryQueue);
    return queue;
  }),

  /**
   * Get retry queue statistics
   */
  getStats: adminProcedure.query(async () => {
    return await getRetryQueueStats();
  }),

  /**
   * Process a single retry
   */
  processRetry: adminProcedure
    .input(z.object({ retryId: z.number().int() }))
    .mutation(async ({ input }) => {
      const success = await processSMSRetry(input.retryId);
      return { success };
    }),

  /**
   * Process all pending retries
   */
  processAllPending: adminProcedure.mutation(async () => {
    const processed = await processAllPendingRetries();
    return { processed };
  }),

  /**
   * Manually retry a specific SMS
   */
  manualRetry: adminProcedure
    .input(z.object({ retryId: z.number().int() }))
    .mutation(async ({ input }) => {
      const success = await manualRetryTrigger(input.retryId);
      return { success };
    }),

  /**
   * Clear old retries (older than 30 days)
   */
  clearOldRetries: adminProcedure.mutation(async () => {
    const cleared = await clearOldRetries();
    return { cleared };
  }),

  /**
   * Get retry details by ID
   */
  getRetryDetails: adminProcedure
    .input(z.object({ retryId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(smsRetryQueue)
        .where((table) => table.id.eq(input.retryId));

      return result[0] || null;
    }),
});
