import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ContentPerformanceAnalyticsService } from "../services/ContentPerformanceAnalyticsService";

export const analyticsRouter = router({
  getSessionEventAnalytics: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return {
        eventId: `event_${input.sessionId}`,
        sessionId: input.sessionId,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        duration: 3600,
        totalAttendees: 250,
        totalQuestions: 45,
        approvedQuestions: 38,
        rejectedQuestions: 7,
        averageSentiment: 7.8,
        complianceFlags: 2,
        engagementRate: 0.82,
        engagementScore: 82,
        qaMetrics: { approvalRate: 84 },
      };
    }),

  /**
   * Get metrics for a specific content item
   */
  getContentMetrics: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return await ContentPerformanceAnalyticsService.getContentMetrics(
        input.contentId
      );
    }),

  /**
   * Get performance analytics for a content type
   */
  getContentTypePerformance: protectedProcedure
    .input(z.object({ contentType: z.string() }))
    .query(async ({ input }) => {
      return await ContentPerformanceAnalyticsService.getContentTypePerformance(
        input.contentType
      );
    }),

  /**
   * Get all content type performance rankings
   */
  getAllContentTypePerformance: protectedProcedure.query(async () => {
    return await ContentPerformanceAnalyticsService.getAllContentTypePerformance();
  }),

  /**
   * Get event performance summary
   */
  getEventAnalytics: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return await ContentPerformanceAnalyticsService.getEventAnalytics(
        input.eventId
      );
    }),

  /**
   * Generate comprehensive performance report for an event
   */
  generateEventReport: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return await ContentPerformanceAnalyticsService.generateEventReport(
        input.eventId
      );
    }),

  /**
   * Record engagement event (sent, opened, clicked, etc)
   */
  recordEngagementEvent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        recipientEmail: z.string().email(),
        eventType: z.enum(["sent", "opened", "clicked", "responded", "bounced", "unsubscribed"]),
        eventData: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        input.contentId,
        input.recipientEmail,
        input.eventType,
        input.eventData
      );
      return { success: true };
    }),

  /**
   * Manually trigger event summary calculation
   */
  calculateEventSummary: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input }) => {
      await ContentPerformanceAnalyticsService.calculateEventSummary(
        input.eventId
      );
      return { success: true };
    }),
});
