// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { MaterialityRiskOracleService } from "../services/MaterialityRiskOracleService";

export const materialityRiskRouter = router({
  scoreStatement: protectedProcedure
    .input(z.object({
      statementText: z.string().max(10000),
      speakerRole: z.string().max(100).optional(),
      companyTicker: z.string().max(20).optional(),
      jurisdiction: z.string().max(50).optional(),
      eventType: z.string().max(50).optional(),
      priorFilings: z.string().max(15000).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await MaterialityRiskOracleService.scoreStatement(input);
      if (input.eventId && input.sessionId && result.materialityScore > 0.5) {
        await MaterialityRiskOracleService.logRisk(input.eventId, input.sessionId, input.statementText, result);
      }
      return result;
    }),
});
