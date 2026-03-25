// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { EventIntegrityTwinService } from "../services/EventIntegrityTwinService";

export const eventIntegrityRouter = router({
  buildDigitalTwin: protectedProcedure
    .input(z.object({
      eventId: z.string().max(100),
      eventName: z.string().max(500),
      companyName: z.string().max(200),
      segments: z.array(z.object({
        transcript: z.string().max(5000),
        sentiment: z.number().min(-1).max(1),
        compliance: z.number().min(0).max(1),
        timestamp: z.string().max(50),
      })).max(100),
      overallSentiment: z.number().min(-1).max(1).optional(),
      complianceScore: z.number().min(0).max(1).optional(),
      evasivenessAvg: z.number().min(0).max(1).optional(),
      attendeeCount: z.number().optional(),
      qaCount: z.number().optional(),
      dbEventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await EventIntegrityTwinService.buildDigitalTwin(input);
      if (input.dbEventId && input.sessionId) {
        await EventIntegrityTwinService.logTwin(input.dbEventId, input.sessionId, result);
      }
      return result;
    }),
});
