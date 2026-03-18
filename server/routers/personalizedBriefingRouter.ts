// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { PersonalizedBriefingService } from "../services/PersonalizedBriefingService";

export const personalizedBriefingRouter = router({
  generateBriefing: protectedProcedure
    .input(z.object({
      stakeholderType: z.enum(["ceo", "cfo", "ir_head", "board_member", "analyst", "compliance_officer", "investor"]),
      companyName: z.string().max(200),
      eventName: z.string().max(500),
      eventType: z.string().max(50),
      transcriptExcerpt: z.string().max(20000),
      sentimentScore: z.number().min(-1).max(1).optional(),
      evasivenessData: z.object({
        avgScore: z.number().min(0).max(1),
        highEvasionCount: z.number().min(0),
      }).optional(),
      marketImpactData: z.object({
        volatility: z.number().min(0).max(10),
        direction: z.string().max(20),
      }).optional(),
      complianceData: z.object({
        overallRisk: z.number().min(0).max(1),
        violationCount: z.number().min(0),
      }).optional(),
      previousBriefings: z.string().max(10000).optional(),
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

  getEventBriefings: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      stakeholderType: z.string().max(50).optional(),
    }))
    .query(async ({ input }) => {
      return PersonalizedBriefingService.getEventBriefings(input.eventId, input.stakeholderType);
    }),
});
