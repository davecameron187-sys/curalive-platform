// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { MultiModalComplianceService } from "../services/MultiModalComplianceService";

export const multiModalComplianceRouter = router({
  scoreComplianceRisk: protectedProcedure
    .input(z.object({
      transcriptText: z.string().max(20000),
      sentimentData: z.object({
        overallSentiment: z.string().max(50),
        confidence: z.number().min(0).max(1),
        emotionDistribution: z.record(z.number()),
      }).optional(),
      evasivenessScore: z.number().min(0).max(1).optional(),
      speakerRole: z.string().max(100).optional(),
      eventType: z.string().max(50).optional(),
      companyTicker: z.string().max(20).optional(),
      jurisdiction: z.string().max(50).optional(),
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

  getEventComplianceScores: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return MultiModalComplianceService.getEventComplianceScores(input.eventId);
    }),
});
