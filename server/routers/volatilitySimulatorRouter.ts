// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { VolatilitySimulatorService } from "../services/VolatilitySimulatorService";

export const volatilitySimulatorRouter = router({
  runSimulation: protectedProcedure
    .input(z.object({
      transcriptExcerpt: z.string().max(20000),
      currentSentiment: z.number().min(-1).max(1),
      guidanceTone: z.string().max(200).optional(),
      companyTicker: z.string().max(20).optional(),
      eventType: z.string().max(50).optional(),
      sectorContext: z.string().max(200).optional(),
      priorVolatility: z.number().min(0).max(100).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await VolatilitySimulatorService.runSimulation(input);
      if (input.eventId && input.sessionId) {
        await VolatilitySimulatorService.logSimulation(input.eventId, input.sessionId, result);
      }
      return result;
    }),
});
