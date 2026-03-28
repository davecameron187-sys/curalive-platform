/**
 * GROK2 Live Q&A Router
 * tRPC procedures for Module 31 Live Q&A Intelligence Engine
 * Phase 1-2: Foundation & Intelligence Layer
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  liveQaQuestions,
  liveQaAnswers,
  complianceFlags,
  privateAiBotConversations,
  liveQaSessionMetadata,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import * as dbGrok2 from "../db.grok2";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ─────────────────────────────────────────────────────────────────────────────

const CreateSessionInput = z.object({
  eventId: z.string().min(1),
  sessionName: z.string().min(1),
  moderatorId: z.number().int().positive(),
  operatorId: z.number().int().positive().optional(),
});

const CreateQuestionInput = z.object({
  sessionId: z.string().min(1),
  questionText: z.string().min(10),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email().optional(),
  submitterCompany: z.string().optional(),
  questionCategory: z.string().optional(),
});

const AnswerQuestionInput = z.object({
  questionId: z.number().int().positive(),
  answerText: z.string().min(10),
  isAutoDraft: z.boolean().default(false),
  autoDraftReasoning: z.string().optional(),
});

const ApproveQuestionInput = z.object({
  questionId: z.number().int().positive(),
  triageScore: z.number().min(0).max(1),
  complianceRiskScore: z.number().min(0).max(1),
  complianceRiskType: z.string().optional(),
});

const FlagComplianceInput = z.object({
  questionId: z.number().int().positive(),
  jurisdiction: z.string().min(1),
  riskScore: z.number().min(0).max(1),
  riskType: z.string().min(1),
  riskDescription: z.string().min(10),
  autoRemediationSuggestion: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LIVE Q&A ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const liveQaRouter = router({
  // ───────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  createSession: protectedProcedure
    .input(CreateSessionInput)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await database.insert(liveQaSessionMetadata).values({
        eventId: input.eventId,
        sessionId,
        sessionName: input.sessionName,
        moderatorId: input.moderatorId,
        operatorId: input.operatorId,
        isLive: true,
      });

      return {
        success: true,
        message: "Session created successfully",
        sessionId,
      };
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getSessionMetadata(input.sessionId);
    }),

  getSessionStats: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getSessionStats(input.sessionId);
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaSessionMetadata)
        .set({
          isLive: false,
          endedAt: new Date(),
        })
        .where(eq(liveQaSessionMetadata.sessionId, input.sessionId));

      return { success: true, message: "Session ended" };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // QUESTION SUBMISSION & MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  submitQuestion: publicProcedure
    .input(CreateQuestionInput)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(liveQaQuestions).values({
        eventId: input.sessionId.split("-")[0] || "unknown",
        sessionId: input.sessionId,
        questionText: input.questionText,
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail,
        submitterCompany: input.submitterCompany,
        questionCategory: input.questionCategory,
        status: "submitted",
        triageScore: 0,
        complianceRiskScore: 0,
        priorityScore: 0,
        upvotes: 0,
        downvotes: 0,
      });

      return {
        success: true,
        message: "Question submitted successfully",
      };
    }),

  getQuestions: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getQuestionsBySession(input.sessionId);
    }),

  getUnansweredQuestions: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getUnansweredQuestions(input.sessionId);
    }),

  getHighRiskQuestions: publicProcedure
    .input(z.object({ sessionId: z.string().min(1), threshold: z.number().min(0).max(1).default(0.7) }))
    .query(async ({ input }) => {
      return dbGrok2.getHighRiskQuestions(input.sessionId, input.threshold);
    }),

  upvoteQuestion: publicProcedure
    .input(z.object({ questionId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const question = await dbGrok2.getQuestionById(input.questionId);
      if (!question) throw new Error("Question not found");

      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaQuestions)
        .set({
          upvotes: (question.upvotes || 0) + 1,
          priorityScore: ((question.priorityScore || 0) + 0.05) as any,
        })
        .where(eq(liveQaQuestions.id, input.questionId));

      return { success: true, message: "Question upvoted" };
    }),

  approveQuestion: protectedProcedure
    .input(ApproveQuestionInput)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaQuestions)
        .set({
          status: "approved",
          triageScore: input.triageScore,
          complianceRiskScore: input.complianceRiskScore,
          complianceRiskType: input.complianceRiskType,
          priorityScore: (input.triageScore * 0.6 + input.complianceRiskScore * 0.4) as any,
        })
        .where(eq(liveQaQuestions.id, input.questionId));

      return { success: true, message: "Question approved" };
    }),

  rejectQuestion: protectedProcedure
    .input(z.object({ questionId: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaQuestions)
        .set({ status: "rejected" })
        .where(eq(liveQaQuestions.id, input.questionId));

      return { success: true, message: "Question rejected" };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // ANSWERS
  // ───────────────────────────────────────────────────────────────────────────

  answerQuestion: protectedProcedure
    .input(AnswerQuestionInput)
    .mutation(async ({ input, ctx }) => {
      const question = await dbGrok2.getQuestionById(input.questionId);
      if (!question) throw new Error("Question not found");

      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(liveQaAnswers).values({
        questionId: input.questionId,
        eventId: question.eventId,
        sessionId: question.sessionId,
        answeredBy: ctx.user.id,
        answerText: input.answerText,
        isAutoDraft: input.isAutoDraft,
        autoDraftReasoning: input.autoDraftReasoning,
        isApproved: false,
        isComplianceApproved: false,
      });

      await database
        .update(liveQaQuestions)
        .set({ isAnswered: true, status: "answered" })
        .where(eq(liveQaQuestions.id, input.questionId));

      return { success: true, message: "Answer submitted" };
    }),

  getAnswers: publicProcedure
    .input(z.object({ questionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return dbGrok2.getAnswersByQuestion(input.questionId);
    }),

  approveAnswer: protectedProcedure
    .input(z.object({ answerId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaAnswers)
        .set({ isApproved: true })
        .where(eq(liveQaAnswers.id, input.answerId));

      return { success: true, message: "Answer approved" };
    }),

  approveAnswerCompliance: protectedProcedure
    .input(z.object({ answerId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(liveQaAnswers)
        .set({
          isComplianceApproved: true,
          complianceApprovedBy: ctx.user.id,
          complianceApprovedAt: new Date(),
        })
        .where(eq(liveQaAnswers.id, input.answerId));

      return { success: true, message: "Answer compliance approved" };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // COMPLIANCE FLAGS
  // ───────────────────────────────────────────────────────────────────────────

  flagCompliance: protectedProcedure
    .input(FlagComplianceInput)
    .mutation(async ({ input }) => {
      const question = await dbGrok2.getQuestionById(input.questionId);
      if (!question) throw new Error("Question not found");

      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(complianceFlags).values({
        questionId: input.questionId,
        eventId: question.eventId,
        sessionId: question.sessionId,
        jurisdiction: input.jurisdiction,
        riskScore: input.riskScore,
        riskType: input.riskType,
        riskDescription: input.riskDescription,
        autoRemediationSuggestion: input.autoRemediationSuggestion,
        requiresLegalReview: input.riskScore > 0.8,
        isResolved: false,
      });

      return { success: true, message: "Compliance flag created" };
    }),

  getComplianceFlags: publicProcedure
    .input(z.object({ questionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return dbGrok2.getComplianceFlagsForQuestion(input.questionId);
    }),

  getUnresolvedComplianceFlags: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getUnresolvedComplianceFlags(input.sessionId);
    }),

  resolveComplianceFlag: protectedProcedure
    .input(z.object({ flagId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(complianceFlags)
        .set({
          isResolved: true,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(complianceFlags.id, input.flagId));

      return { success: true, message: "Compliance flag resolved" };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // PRIVATE Q&A BOT
  // ───────────────────────────────────────────────────────────────────────────

  submitPrivateQuestion: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        questionText: z.string().min(10),
        submitterName: z.string().optional(),
        submitterEmail: z.string().email().optional(),
        confidentialityLevel: z.enum(["public", "internal", "confidential", "legal_privilege"]).default("confidential"),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database.insert(privateAiBotConversations).values({
        eventId: input.sessionId.split("-")[0] || "unknown",
        sessionId: input.sessionId,
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail,
        confidentialityLevel: input.confidentialityLevel,
        conversationHistory: JSON.stringify([
          {
            role: "user",
            content: input.questionText,
            timestamp: new Date().toISOString(),
          },
        ]),
        aiResponses: JSON.stringify([]),
        routedToLegal: false,
        isResolved: false,
      });

      return { success: true, message: "Private question submitted" };
    }),

  getPrivateConversations: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      return dbGrok2.getPrivateConversations(input.sessionId);
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // OPERATOR CONSOLE: TRANSCRIPT & AI INSIGHTS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get Transcript Segments from Recall.ai Webhook
   * Real-time transcript data populated by Recall.ai webhook events
   */
  getTranscriptSegments: publicProcedure
    .input(z.object({ 
      sessionId: z.string().min(1),
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: Implement when transcript_segments table is added to schema
      // For now, return empty array
      return [];
    }),

  /**
   * Get Session AI Insights (Sentiment, Compliance, Topics)
   * Calculated from questions and transcript data in real-time
   */
  getSessionInsights: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        return {
          sentimentScore: 0.5,
          sentimentTrend: "neutral" as const,
          complianceRiskLevel: "low" as const,
          complianceFlags: 0,
          keyTopics: [],
          lastUpdated: Date.now(),
        };
      }

      try {
        // Fetch all questions for this session
        const questions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId));

        if (!questions.length) {
          return {
            sentimentScore: 0.5,
            sentimentTrend: "neutral" as const,
            complianceRiskLevel: "low" as const,
            complianceFlags: 0,
            keyTopics: [],
            lastUpdated: Date.now(),
          };
        }

        // Calculate sentiment score from compliance risk scores
        const complianceScores = questions
          .map((q: any) => q.complianceRiskScore || 0)
          .filter((score: number) => score !== null);

        const avgComplianceScore = complianceScores.length > 0
          ? complianceScores.reduce((a: number, b: number) => a + b, 0) / complianceScores.length
          : 0.5;

        // Sentiment is inverse of compliance risk
        const sentimentScore = 1 - avgComplianceScore;

        // Determine sentiment trend
        const sentimentTrend = sentimentScore > 0.6 ? "positive" : sentimentScore < 0.4 ? "negative" : "neutral";

        // Get max compliance risk level
        const maxComplianceScore = Math.max(...complianceScores, 0);
        const complianceRiskLevel = maxComplianceScore > 0.7 ? "high" : maxComplianceScore > 0.4 ? "medium" : "low";

        // Count compliance flags
        const complianceFlags = questions.filter((q: any) => (q.complianceRiskScore || 0) > 0.5).length;

        // Extract key topics from high-priority questions
        const keyTopics = questions
          .filter((q: any) => (q.priorityScore || 0) > 0.6)
          .map((q: any) => q.questionCategory || "General")
          .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          .slice(0, 5);

        return {
          sentimentScore,
          sentimentTrend,
          complianceRiskLevel,
          complianceFlags,
          keyTopics,
          lastUpdated: Date.now(),
        };
      } catch (error) {
        console.error("[getSessionInsights] Error:", error);
        return {
          sentimentScore: 0.5,
          sentimentTrend: "neutral" as const,
          complianceRiskLevel: "low" as const,
          complianceFlags: 0,
          keyTopics: [],
          lastUpdated: Date.now(),
        };
      }
    }),
});
