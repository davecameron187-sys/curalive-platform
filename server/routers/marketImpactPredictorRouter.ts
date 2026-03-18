// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { MarketImpactPredictorService } from "../services/MarketImpactPredictorService";

export const marketImpactPredictorRouter = router({
  predictImpact: protectedProcedure
    .input(z.object({
      sentimentScore: z.number().min(-1).max(1),
      topicKeywords: z.array(z.string().max(200)).max(20),
      evasivenessScore: z.number().min(0).max(1).optional(),
      companyTicker: z.string().max(20).optional(),
      eventType: z.string().max(50).optional(),
      transcriptExcerpt: z.string().max(15000).optional(),
      historicalContext: z.string().max(5000).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const prediction = await MarketImpactPredictorService.predictImpact({
        sentimentScore: input.sentimentScore,
        topicKeywords: input.topicKeywords,
        evasivenessScore: input.evasivenessScore,
        companyTicker: input.companyTicker,
        eventType: input.eventType,
        transcriptExcerpt: input.transcriptExcerpt,
        historicalContext: input.historicalContext,
      });

      if (input.eventId && input.sessionId) {
        await MarketImpactPredictorService.logPrediction(
          input.eventId,
          input.sessionId,
          prediction,
          input.sentimentScore,
          input.topicKeywords
        );
      }

      return prediction;
    }),

  getEventPredictions: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MarketImpactPredictorService.getEventPredictions(input.eventId);
    }),

  getLatestPrediction: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MarketImpactPredictorService.getLatestPrediction(input.eventId);
    }),
});
