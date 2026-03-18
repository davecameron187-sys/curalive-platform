// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { RegulatoryInterventionService } from "../services/RegulatoryInterventionService";

export const regulatoryInterventionRouter = router({
  analyzeAndEvolve: protectedProcedure
    .input(z.object({
      eventTranscript: z.string().max(30000),
      regulatoryOutcomes: z.array(z.object({
        type: z.string().max(200),
        result: z.string().max(200),
        details: z.string().max(2000),
      })).max(20).optional(),
      currentThresholds: z.record(z.number()).optional(),
      jurisdiction: z.string().max(50).optional(),
      companyTicker: z.string().max(20).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await RegulatoryInterventionService.analyzeAndEvolve(input);
      if (input.eventId && input.sessionId) {
        await RegulatoryInterventionService.logEvolution(input.eventId, input.sessionId, result);
      }
      return result;
    }),
});
