// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { EvasiveAnswerDetectionService } from "../services/EvasiveAnswerDetectionService";

export const evasiveAnswerRouter = router({
  detectEvasiveness: publicProcedure
    .input(z.object({
      responseText: z.string(),
      questionText: z.string(),
      speakerRole: z.string().optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await EvasiveAnswerDetectionService.scoreResponse(
        input.responseText,
        input.questionText,
        input.speakerRole
      );

      if (input.eventId && input.sessionId && result.score > 0.5) {
        await EvasiveAnswerDetectionService.logEvasiveness(
          input.eventId,
          input.sessionId,
          input.questionText,
          input.responseText,
          result
        );
      }

      return result;
    }),

  batchAnalyze: publicProcedure
    .input(z.object({
      qaExchanges: z.array(z.object({
        questionText: z.string(),
        responseText: z.string(),
        speakerRole: z.string().optional(),
        questionId: z.number().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      return EvasiveAnswerDetectionService.batchAnalyzeQA(input.qaExchanges);
    }),

  getEventEvasiveness: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return EvasiveAnswerDetectionService.getEventEvasiveness(input.eventId);
    }),

  getAggregateStats: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return EvasiveAnswerDetectionService.getAggregateStats(input.eventId);
    }),
});
