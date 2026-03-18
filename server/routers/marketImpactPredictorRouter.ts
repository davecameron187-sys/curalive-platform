// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { MarketImpactPredictorService } from "../services/MarketImpactPredictorService";

export const marketImpactPredictorRouter = router({
  predictImpact: publicProcedure
    .input(z.object({
      sentimentScore: z.number(),
      topicKeywords: z.array(z.string()),
      evasivenessScore: z.number().optional(),
      companyTicker: z.string().optional(),
      eventType: z.string().optional(),
      transcriptExcerpt: z.string().optional(),
      historicalContext: z.string().optional(),
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

  getEventPredictions: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MarketImpactPredictorService.getEventPredictions(input.eventId);
    }),

  getLatestPrediction: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MarketImpactPredictorService.getLatestPrediction(input.eventId);
    }),
});
