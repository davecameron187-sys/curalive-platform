// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ExternalSentimentService } from "../services/ExternalSentimentService";

export const externalSentimentRouter = router({
  aggregateExternalSentiment: publicProcedure
    .input(z.object({
      companyTicker: z.string(),
      companyName: z.string(),
      eventType: z.string(),
      callSentiment: z.number(),
      keyTopicsFromCall: z.array(z.string()),
      transcriptHighlights: z.string().optional(),
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

  getEventSnapshots: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return ExternalSentimentService.getEventSnapshots(input.eventId);
    }),
});
