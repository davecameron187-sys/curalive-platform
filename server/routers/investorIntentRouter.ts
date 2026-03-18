// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { InvestorIntentionDecoderService } from "../services/InvestorIntentionDecoderService";

export const investorIntentRouter = router({
  decodeIntent: protectedProcedure
    .input(z.object({
      questionText: z.string().max(5000),
      investorName: z.string().max(200).optional(),
      investorType: z.string().max(100).optional(),
      historicalQuestions: z.array(z.string().max(2000)).max(10).optional(),
      eventContext: z.string().max(2000).optional(),
      companyTicker: z.string().max(20).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await InvestorIntentionDecoderService.decodeIntent(input);
      if (input.eventId && input.sessionId) {
        await InvestorIntentionDecoderService.logIntent(input.eventId, input.sessionId, input.questionText, input.investorName || "Unknown", result);
      }
      return result;
    }),
});
