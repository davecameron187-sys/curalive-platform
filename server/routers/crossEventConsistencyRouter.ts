// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { CrossEventConsistencyService } from "../services/CrossEventConsistencyService";

export const crossEventConsistencyRouter = router({
  checkConsistency: protectedProcedure
    .input(z.object({
      currentStatement: z.string().max(10000),
      speakerRole: z.string().max(100).optional(),
      companyName: z.string().max(200).optional(),
      historicalStatements: z.array(z.string().max(5000)).max(20).optional(),
      peerStatements: z.array(z.string().max(5000)).max(10).optional(),
      eventType: z.string().max(50).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await CrossEventConsistencyService.checkConsistency(input);
      if (input.eventId && input.sessionId) {
        await CrossEventConsistencyService.logCheck(input.eventId, input.sessionId, input.currentStatement, result);
      }
      return result;
    }),
});
