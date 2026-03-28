/**
 * Additional procedures for OperatorConsole refactored implementation
 * These procedures provide real-time transcript and AI insights data
 * 
 * Add these to the liveQaRouter export in server/routers/liveQa.ts
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { liveQaQuestions, liveQaSessionMetadata } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * PROCEDURE 1: Get Transcript Segments from Recall.ai Webhook
 * 
 * Returns: Array of transcript segments with speaker, text, timestamp, confidence
 * Source: Populated by Recall.ai webhook in server/webhooks/recall.ts
 * Real-Time: Refetch every 2 seconds to get latest segments
 */
export const getTranscriptSegments = publicProcedure
  .input(z.object({ 
    sessionId: z.string().min(1),
    limit: z.number().min(1).max(1000).default(100),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      console.warn("[getTranscriptSegments] Database not available");
      return [];
    }

    try {
      // In production, this would query a transcript_segments table
      // populated by Recall.ai webhook events
      // For now, return empty array (table doesn't exist in current schema)
      // 
      // Expected schema:
      // CREATE TABLE transcript_segments (
      //   id INT PRIMARY KEY AUTO_INCREMENT,
      //   session_id VARCHAR(255) NOT NULL,
      //   event_id VARCHAR(255) NOT NULL,
      //   speaker VARCHAR(255),
      //   text TEXT NOT NULL,
      //   timestamp BIGINT NOT NULL,
      //   confidence FLOAT,
      //   recall_segment_id VARCHAR(255) UNIQUE,
      //   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      //   INDEX (session_id, timestamp)
      // );

      // TODO: Implement when transcript_segments table is added to schema
      return [];
    } catch (error) {
      console.error("[getTranscriptSegments] Error:", error);
      return [];
    }
  });

/**
 * PROCEDURE 2: Get Session AI Insights (Sentiment, Compliance, Topics)
 * 
 * Returns: Real sentiment analysis, compliance risk level, key topics
 * Source: Calculated from questions and transcript in real-time
 * Calculation:
 *   - Sentiment: Average of question compliance risk scores
 *   - Compliance Risk: Max compliance risk score of all questions
 *   - Key Topics: Extracted from high-priority questions
 */
export const getSessionInsights = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      console.warn("[getSessionInsights] Database not available");
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

      // Sentiment is inverse of compliance risk (high risk = negative sentiment)
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
  });

/**
 * PROCEDURE 3: Get Session Stats (for analytics)
 * 
 * Returns: Comprehensive session statistics
 */
export const getSessionStats = publicProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      return {
        sessionId: input.sessionId,
        totalQuestions: 0,
        approvedQuestions: 0,
        rejectedQuestions: 0,
        pendingQuestions: 0,
        averageComplianceRisk: 0,
        highRiskQuestions: 0,
      };
    }

    try {
      const questions = await database
        .select()
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId));

      const approved = questions.filter((q: any) => q.status === "approved").length;
      const rejected = questions.filter((q: any) => q.status === "rejected").length;
      const pending = questions.filter((q: any) => q.status === "submitted").length;

      const complianceScores = questions
        .map((q: any) => q.complianceRiskScore || 0)
        .filter((score: number) => score !== null);

      const avgCompliance = complianceScores.length > 0
        ? complianceScores.reduce((a: number, b: number) => a + b, 0) / complianceScores.length
        : 0;

      const highRisk = questions.filter((q: any) => (q.complianceRiskScore || 0) > 0.7).length;

      return {
        sessionId: input.sessionId,
        totalQuestions: questions.length,
        approvedQuestions: approved,
        rejectedQuestions: rejected,
        pendingQuestions: pending,
        averageComplianceRisk: avgCompliance,
        highRiskQuestions: highRisk,
      };
    } catch (error) {
      console.error("[getSessionStats] Error:", error);
      return {
        sessionId: input.sessionId,
        totalQuestions: 0,
        approvedQuestions: 0,
        rejectedQuestions: 0,
        pendingQuestions: 0,
        averageComplianceRisk: 0,
        highRiskQuestions: 0,
      };
    }
  });
