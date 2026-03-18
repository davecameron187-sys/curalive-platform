// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createAgmSession, addResolution, getSessionDashboard, listAgmSessions,
  predictResolutionApproval, recordActualResult,
  analyzeDissentPatterns, triageGovernanceQuestions,
  analyzeQuorumAndParticipation, scanRegulatoryCompliance,
  generateGovernanceReport,
} from "../services/AgmGovernanceAiService";

export const agmGovernanceRouter = router({
  createSession: protectedProcedure
    .input(z.object({
      clientName: z.string().min(1),
      agmTitle: z.string().min(1),
      agmDate: z.string().optional(),
      jurisdiction: z.enum(["south_africa", "united_kingdom", "united_states", "australia", "other"]).optional(),
      shadowSessionId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => createAgmSession(ctx.user.id, input)),

  addResolution: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      resolutionNumber: z.number(),
      title: z.string().min(1),
      category: z.enum([
        "ordinary", "special", "advisory", "remuneration", "board_election",
        "auditor_appointment", "share_repurchase", "dividend", "esg", "other",
      ]).optional(),
      proposedBy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => addResolution(ctx.user.id, input.sessionId, input)),

  predictApproval: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      resolutionId: z.number(),
      transcriptSegments: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
        timestamp: z.number(),
      })).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) =>
      predictResolutionApproval(ctx.user.id, input.sessionId, input.resolutionId, input.transcriptSegments)),

  recordResult: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      resolutionId: z.number(),
      actualApprovalPct: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => recordActualResult(ctx.user.id, input.sessionId, input.resolutionId, input.actualApprovalPct)),

  analyzeDissentPatterns: protectedProcedure
    .input(z.object({ sessionId: z.number(), clientName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => analyzeDissentPatterns(ctx.user.id, input.sessionId, input.clientName)),

  triageQuestions: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      questions: z.array(z.object({
        speaker: z.string(),
        question: z.string(),
        timestamp: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => triageGovernanceQuestions(ctx.user.id, input.sessionId, input.questions)),

  analyzeQuorum: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      attendanceCount: z.number(),
      proxyCount: z.number(),
      totalEligibleShares: z.number(),
      sharesRepresented: z.number(),
      jurisdiction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      analyzeQuorumAndParticipation(ctx.user.id, input.sessionId, input.attendanceCount, input.proxyCount, input.totalEligibleShares, input.sharesRepresented, input.jurisdiction)),

  scanCompliance: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      transcriptSegments: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
        timestamp: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => scanRegulatoryCompliance(ctx.user.id, input.sessionId, input.transcriptSegments)),

  generateReport: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => generateGovernanceReport(ctx.user.id, input.sessionId)),

  dashboard: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => getSessionDashboard(ctx.user.id, input.sessionId)),

  listSessions: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => listAgmSessions(ctx.user.id, input.limit)),
});
