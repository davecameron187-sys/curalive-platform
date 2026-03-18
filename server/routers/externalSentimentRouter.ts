// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { ExternalSentimentService } from "../services/ExternalSentimentService";

export const externalSentimentRouter = router({
  aggregateExternalSentiment: protectedProcedure
    .input(z.object({
      companyTicker: z.string().max(20),
      companyName: z.string().max(200),
      eventType: z.string().max(50),
      callSentiment: z.number().min(-1).max(1),
      keyTopicsFromCall: z.array(z.string().max(200)).max(20),
      transcriptHighlights: z.string().max(15000).optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const snapshot = await ExternalSentimentService.aggregateExternalSentiment({
        companyTicker: input.companyTicker,
        companyName: input.companyName,
        eventType: input.eventType,
        callSentiment: input.callSentiment,
        keyTopicsFromCall: input.keyTopicsFromCall,
        transcriptHighlights: input.transcriptHighlights,
      });

      if (input.eventId && input.sessionId) {
        await ExternalSentimentService.logSnapshot(
          input.eventId,
          input.sessionId,
          snapshot
        );
      }

      return snapshot;
    }),

  getEventSnapshots: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return ExternalSentimentService.getEventSnapshots(input.eventId);
    }),
});
