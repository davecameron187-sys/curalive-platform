// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { MultiModalComplianceService } from "../services/MultiModalComplianceService";

export const multiModalComplianceRouter = router({
  scoreComplianceRisk: publicProcedure
    .input(z.object({
      transcriptText: z.string(),
      sentimentData: z.object({
        overallSentiment: z.string(),
        confidence: z.number(),
        emotionDistribution: z.record(z.number()),
      }).optional(),
      evasivenessScore: z.number().optional(),
      speakerRole: z.string().optional(),
      eventType: z.string().optional(),
      companyTicker: z.string().optional(),
      jurisdiction: z.string().optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const score = await MultiModalComplianceService.scoreComplianceRisk({
        transcriptText: input.transcriptText,
        sentimentData: input.sentimentData,
        evasivenessScore: input.evasivenessScore,
        speakerRole: input.speakerRole,
        eventType: input.eventType,
        companyTicker: input.companyTicker,
        jurisdiction: input.jurisdiction,
      });

      if (input.eventId && input.sessionId) {
        await MultiModalComplianceService.logComplianceScore(
          input.eventId,
          input.sessionId,
          score
        );
      }

      return score;
    }),

  getEventComplianceScores: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MultiModalComplianceService.getEventComplianceScores(input.eventId);
    }),
});
