// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { EvasiveAnswerDetectionService } from "../services/EvasiveAnswerDetectionService";

export const evasiveAnswerRouter = router({
  detectEvasiveness: protectedProcedure
    .input(z.object({
      responseText: z.string().max(10000),
      questionText: z.string().max(5000),
      speakerRole: z.string().max(100).optional(),
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

  batchAnalyze: protectedProcedure
    .input(z.object({
      qaExchanges: z.array(z.object({
        questionText: z.string().max(5000),
        responseText: z.string().max(10000),
        speakerRole: z.string().max(100).optional(),
        questionId: z.number().optional(),
      })).max(20),
    }))
    .mutation(async ({ input }) => {
      return EvasiveAnswerDetectionService.batchAnalyzeQA(input.qaExchanges);
    }),

  getEventEvasiveness: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return EvasiveAnswerDetectionService.getEventEvasiveness(input.eventId);
    }),

  getAggregateStats: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return EvasiveAnswerDetectionService.getAggregateStats(input.eventId);
    }),
});
