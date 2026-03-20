/**
 * AGI Tool Generator Router
 * GROK2 Phase 4 — tRPC procedures for autonomous tool generation
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { agiGeneratedTools } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import * as agiService from "../services/agiToolGenerator";

export const agiToolGeneratorRouter = router({
  /**
   * Trigger AGI tool generation cycle for a session
   */
  generateToolsForSession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const result = await agiService.runAgiToolGenerationCycle(input.sessionId);
        return {
          success: result.success,
          toolsGenerated: result.toolsGenerated,
          message: `Generated ${result.toolsGenerated} new tools`,
        };
      } catch (error) {
        console.error("[AGI Tool Generator] Error:", error);
        return {
          success: false,
          toolsGenerated: 0,
          message: "Failed to generate tools",
        };
      }
    }),

  /**
   * Get all generated tools
   */
  getGeneratedTools: publicProcedure
    .input(
      z.object({
        status: z
          .enum(["draft", "testing", "staging", "production", "deprecated"])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let tools = await db
        .select()
        .from(agiGeneratedTools)
        .orderBy(desc(agiGeneratedTools.createdAt));

      if (input.status) {
        tools = tools.filter((t) => t.status === input.status);
      }

      tools = tools.slice(0, input.limit);

      return tools;
    }),

  /**
   * Get tools by domain
   */
  getToolsByDomain: publicProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tools = await db
        .select()
        .from(agiGeneratedTools)
        .where(eq(agiGeneratedTools.domain, input.domain))
        .orderBy(desc(agiGeneratedTools.readinessScore));

      return tools;
    }),

  /**
   * Get tool details
   */
  getTool: publicProcedure
    .input(z.object({ toolId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tool = await db
        .select()
        .from(agiGeneratedTools)
        .where(eq(agiGeneratedTools.id, input.toolId))
        .then((rows) => rows[0] || null);

      return tool;
    }),

  /**
   * Get production-ready tools
   */
  getProductionTools: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tools = await db
      .select()
      .from(agiGeneratedTools)
      .where(eq(agiGeneratedTools.status, "production"))
      .orderBy(desc(agiGeneratedTools.readinessScore));

    return tools;
  }),

  /**
   * Get tools by readiness score
   */
  getToolsByReadiness: publicProcedure
    .input(
      z.object({
        minScore: z.number().min(0).max(1).default(0.7),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all tools and filter in memory (since Drizzle doesn't support decimal comparisons easily)
      const allTools = await db.select().from(agiGeneratedTools);

      const filtered = allTools
        .filter((tool) => {
          const score = parseFloat(tool.readinessScore as any);
          return score >= input.minScore;
        })
        .sort((a, b) => {
          const scoreA = parseFloat(a.readinessScore as any);
          const scoreB = parseFloat(b.readinessScore as any);
          return scoreB - scoreA;
        })
        .slice(0, input.limit);

      return filtered;
    }),

  /**
   * Get tool generation statistics
   */
  getToolStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tools = await db.select().from(agiGeneratedTools);

    const stats = {
      totalTools: tools.length,
      byStatus: {
        draft: tools.filter((t) => t.status === "draft").length,
        testing: tools.filter((t) => t.status === "testing").length,
        staging: tools.filter((t) => t.status === "staging").length,
        production: tools.filter((t) => t.status === "production").length,
        deprecated: tools.filter((t) => t.status === "deprecated").length,
      },
      byDomain: {} as Record<string, number>,
      averageReadiness: 0,
      averageAccuracy: 0,
    };

    // Calculate by domain
    for (const tool of tools) {
      stats.byDomain[tool.domain] = (stats.byDomain[tool.domain] || 0) + 1;
    }

    // Calculate averages
    if (tools.length > 0) {
      stats.averageReadiness =
        tools.reduce((sum, t) => sum + parseFloat(t.readinessScore as any), 0) /
        tools.length;
      stats.averageAccuracy =
        tools.reduce((sum, t) => sum + parseFloat(t.accuracy as any), 0) /
        tools.length;
    }

    return stats;
  }),

  /**
   * Promote tool to next lifecycle stage (admin only)
   */
  promoteTool: protectedProcedure
    .input(
      z.object({
        toolId: z.string().min(1),
        newStatus: z.enum(["draft", "testing", "staging", "production", "deprecated"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin, legal, or moderator
      const allowedRoles = ["admin", "legal", "moderator"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new Error("Only admins, legal, or moderators can promote tools");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(agiGeneratedTools)
        .set({
          status: input.newStatus,
          promotedAt: input.newStatus === "production" ? new Date() : undefined,
        })
        .where(eq(agiGeneratedTools.id, input.toolId));

      return { success: true, message: `Tool promoted to ${input.newStatus}` };
    }),

  /**
   * Record tool performance metrics
   */
  recordToolPerformance: protectedProcedure
    .input(
      z.object({
        toolId: z.string().min(1),
        questionsProcessed: z.number().int().min(0),
        accuracyScore: z.number().min(0).max(1),
        userSatisfaction: z.number().min(0).max(1),
        improvementSuggestions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await agiService.recordToolPerformance(input.toolId, {
          questionsProcessed: input.questionsProcessed,
          accuracyScore: input.accuracyScore,
          userSatisfaction: input.userSatisfaction,
          improvementSuggestions: input.improvementSuggestions || [],
        });

        return {
          success,
          message: "Performance metrics recorded",
        };
      } catch (error) {
        console.error("[AGI Tool Generator] Error recording performance:", error);
        return {
          success: false,
          message: "Failed to record performance",
        };
      }
    }),
});
