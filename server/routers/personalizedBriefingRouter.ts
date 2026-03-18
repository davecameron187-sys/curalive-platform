// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { PersonalizedBriefingService } from "../services/PersonalizedBriefingService";

export const personalizedBriefingRouter = router({
  generateBriefing: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["ceo", "cfo", "ir_head", "board_member", "analyst", "compliance_officer", "investor"]),
      companyName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      transcriptExcerpt: z.string(),
      sentimentScore: z.number().optional(),
      evasivenessData: z.object({
        avgScore: z.number(),
        highEvasionCount: z.number(),
      }).optional(),
      marketImpactData: z.object({
        volatility: z.number(),
        direction: z.string(),
      }).optional(),
      complianceData: z.object({
        overallRisk: z.number(),
        violationCount: z.number(),
      }).optional(),
      previousBriefings: z.string().optional(),
      eventId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const briefing = await PersonalizedBriefingService.generateBriefing({
        stakeholderType: input.stakeholderType,
        companyName: input.companyName,
        eventName: input.eventName,
        eventType: input.eventType,
        transcriptExcerpt: input.transcriptExcerpt,
        sentimentScore: input.sentimentScore,
        evasivenessData: input.evasivenessData,
        marketImpactData: input.marketImpactData,
        complianceData: input.complianceData,
        previousBriefings: input.previousBriefings,
      });

      if (input.eventId && input.sessionId) {
        await PersonalizedBriefingService.logBriefing(
          input.eventId,
          input.sessionId,
          input.stakeholderType,
          briefing
        );
      }

      return briefing;
    }),

  getEventBriefings: publicProcedure
    .input(z.object({
      eventId: z.number(),
      stakeholderType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return PersonalizedBriefingService.getEventBriefings(input.eventId, input.stakeholderType);
    }),
});
