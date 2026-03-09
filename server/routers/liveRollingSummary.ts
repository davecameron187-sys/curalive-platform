import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { liveRollingSummaryService } from "../services/LiveRollingSummaryService";

export const liveRollingSummaryRouter = router({
  /**
   * Start live rolling summary generation for a conference
   */
  start: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      await liveRollingSummaryService.startLiveRollingSummary(input.conferenceId);
      return { success: true, message: `Live rolling summary started for conference ${input.conferenceId}` };
    }),

  /**
   * Stop live rolling summary generation
   */
  stop: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      liveRollingSummaryService.stopLiveRollingSummary(input.conferenceId);
      return { success: true, message: `Live rolling summary stopped for conference ${input.conferenceId}` };
    }),

  /**
   * Get the latest rolling summary
   */
  getLatest: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      const summary = await liveRollingSummaryService.getLatestRollingSummary(input.conferenceId);
      return summary;
    }),

  /**
   * Get rolling summary history
   */
  getHistory: protectedProcedure
    .input(z.object({ conferenceId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const history = await liveRollingSummaryService.getRollingSummaryHistory(input.conferenceId, input.limit);
      return history;
    }),

  /**
   * Manually generate a summary for a specific time window
   */
  regenerate: protectedProcedure
    .input(
      z.object({
        conferenceId: z.number(),
        windowStartTime: z.number(),
        windowEndTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const summary = await liveRollingSummaryService.regenerateSummary(
        input.conferenceId,
        input.windowStartTime,
        input.windowEndTime
      );
      return summary;
    }),

  /**
   * Generate a summary immediately (for testing/manual trigger)
   */
  generateNow: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const summary = await liveRollingSummaryService.generateRollingSummary(input.conferenceId);
      return summary;
    }),
});
