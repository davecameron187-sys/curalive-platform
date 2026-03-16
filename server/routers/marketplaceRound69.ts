import { protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { marketplaceTemplates, templateReviews, auditLogs } from "../../drizzle/schema";
import { eq, like, and, desc } from "drizzle-orm";
import {
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getSimilarTemplates,
  getCollaborativeRecommendations,
  trackRecommendationImpression,
} from "../services/recommendationEngine";

export const marketplaceRound69Router = {
  // ===== RECOMMENDATIONS API =====

  /**
   * Get personalized recommendations for current user
   */
  getPersonalizedRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const recommendations = await getPersonalizedRecommendations(ctx.user.id, input.limit);
      return recommendations;
    }),

  /**
   * Get trending templates
   */
  getTrendingTemplates: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      const recommendations = await getTrendingRecommendations(input.limit);
      return recommendations;
    }),

  /**
   * Get similar templates
   */
  getSimilarTemplates: protectedProcedure
    .input(z.object({ templateId: z.number(), limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      const recommendations = await getSimilarTemplates(input.templateId, input.limit);
      return recommendations;
    }),

  /**
   * Get collaborative recommendations
   */
  getCollaborativeRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const recommendations = await getCollaborativeRecommendations(ctx.user.id, input.limit);
      return recommendations;
    }),

  /**
   * Track recommendation impression
   */
  trackRecommendationImpression: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        type: z.enum(["personalized", "trending", "similar", "collaborative"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackRecommendationImpression(ctx.user.id, input.templateId, input.type);
      return { success: true };
    }),

  // ===== MODERATION API =====

  /**
   * Get flagged templates for moderation
   */
  getFlaggedTemplates: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const templates = await db
        .select()
        .from(marketplaceTemplates)
        .where(
          and(
            eq(marketplaceTemplates.isFlagged, true),
            input.search ? like(marketplaceTemplates.name, `%${input.search}%`) : undefined
          )
        )
        .orderBy(desc(marketplaceTemplates.flagCount))
        .limit(input.limit);

      return templates || [];
    }),

  /**
   * Get user reports
   */
  getUserReports: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      // Mock data for now - would query from templateReports table
      return [
        {
          id: 1,
          templateId: 1,
          templateName: "Network Failover Alert",
          reporterName: "User123",
          reason: "Inappropriate content",
          status: "open",
          createdAt: new Date(),
        },
      ];
    }),

  /**
   * Approve a flagged template
   */
  approveTemplate: adminProcedure
    .input(z.object({ templateId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(marketplaceTemplates)
        .set({
          isFlagged: false,
          flagCount: 0,
          flagReasons: [],
          status: "published",
          updatedAt: new Date(),
        })
        .where(eq(marketplaceTemplates.id, input.templateId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "TEMPLATE_APPROVED",
        resourceId: input.templateId.toString(),
        resourceType: "template",
        details: input.reason || "Template approved by moderator",
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Reject a flagged template
   */
  rejectTemplate: adminProcedure
    .input(z.object({ templateId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(marketplaceTemplates)
        .set({
          status: "rejected",
          isFlagged: true,
          updatedAt: new Date(),
        })
        .where(eq(marketplaceTemplates.id, input.templateId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "TEMPLATE_REJECTED",
        resourceId: input.templateId.toString(),
        resourceType: "template",
        details: input.reason,
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Remove a template from marketplace
   */
  removeTemplate: adminProcedure
    .input(z.object({ templateId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(marketplaceTemplates)
        .set({
          status: "removed",
          isFlagged: true,
          updatedAt: new Date(),
        })
        .where(eq(marketplaceTemplates.id, input.templateId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "TEMPLATE_REMOVED",
        resourceId: input.templateId.toString(),
        resourceType: "template",
        details: input.reason,
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Flag a template for review
   */
  flagTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await db
        .select()
        .from(marketplaceTemplates)
        .where(eq(marketplaceTemplates.id, input.templateId))
        .then((r) => r[0]);

      if (!template) {
        throw new Error("Template not found");
      }

      const currentReasons = template.flagReasons || [];
      const newReasons = [...new Set([...currentReasons, input.reason])];

      await db
        .update(marketplaceTemplates)
        .set({
          isFlagged: true,
          flagCount: (template.flagCount || 0) + 1,
          flagReasons: newReasons,
          updatedAt: new Date(),
        })
        .where(eq(marketplaceTemplates.id, input.templateId));

      return { success: true };
    }),

  /**
   * Get moderation statistics
   */
  getModerationStats: adminProcedure.query(async () => {
    const flaggedCount = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.isFlagged, true))
      .then((r) => r.length);

    const rejectedCount = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.status, "rejected"))
      .then((r) => r.length);

    const removedCount = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.status, "removed"))
      .then((r) => r.length);

    const publishedCount = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.status, "published"))
      .then((r) => r.length);

    return {
      flagged: flaggedCount,
      rejected: rejectedCount,
      removed: removedCount,
      published: publishedCount,
      pendingReview: flaggedCount,
    };
  }),
};
