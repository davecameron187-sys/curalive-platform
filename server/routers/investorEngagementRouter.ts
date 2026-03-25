// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { InvestorEngagementScoringService } from "../services/InvestorEngagementScoringService";

export const investorEngagementRouter = router({
  recordInteraction: protectedProcedure
    .input(z.object({
      name: z.string().max(255),
      email: z.string().max(320).optional(),
      company: z.string().max(255).optional(),
      investorType: z.enum(["institutional", "retail", "analyst", "activist", "insider", "unknown"]).optional(),
      eventId: z.string().max(128),
      eventTitle: z.string().max(255),
      eventDate: z.string(),
      eventType: z.string().max(64),
      questionsAsked: z.number().int().min(0).default(0),
      questionTopics: z.array(z.string().max(100)).max(20).default([]),
      sentimentScore: z.number().min(0).max(100).default(50),
      upvotesGiven: z.number().int().min(0).default(0),
      sessionDuration: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return InvestorEngagementScoringService.recordInteraction(input);
    }),

  getProfile: protectedProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ input }) => {
      return InvestorEngagementScoringService.getProfile(input.investorId);
    }),

  getProfileByEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      return InvestorEngagementScoringService.getProfileByEmail(input.email);
    }),

  listProfiles: protectedProcedure
    .input(z.object({
      lifecycle: z.enum(["new", "engaged", "loyal", "at_risk", "churned", "reactivated"]).optional(),
      minScore: z.number().optional(),
      maxScore: z.number().optional(),
      investorType: z.enum(["institutional", "retail", "analyst", "activist", "insider", "unknown"]).optional(),
      sortBy: z.enum(["engagementScore", "churnProbability", "totalEvents", "lastSeen"]).optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }).optional())
    .query(async ({ input }) => {
      return InvestorEngagementScoringService.listProfiles(input || undefined);
    }),

  getEngagementBreakdown: protectedProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ input }) => {
      return InvestorEngagementScoringService.getEngagementBreakdown(input.investorId);
    }),

  getDashboardStats: protectedProcedure
    .query(async () => {
      return InvestorEngagementScoringService.getDashboardStats();
    }),

  generateInsight: protectedProcedure
    .input(z.object({ investorId: z.string() }))
    .mutation(async ({ input }) => {
      return InvestorEngagementScoringService.generateRelationshipInsight(input.investorId);
    }),

  getCohortAnalysis: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return InvestorEngagementScoringService.generateCohortAnalysis(input.eventId);
    }),
});
