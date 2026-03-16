import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { marketplaceTemplates, templateReviews } from "../../drizzle/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

export const marketplaceApiRouter = router({
  // Search marketplace templates with filtering
  searchTemplates: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["downloads", "rating", "recent"]).default("downloads"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      let queryBuilder = db
        .select()
        .from(marketplaceTemplates)
        .where(eq(marketplaceTemplates.published, true));

      if (input.query) {
        queryBuilder = queryBuilder.where(
          like(marketplaceTemplates.name, `%${input.query}%`)
        );
      }

      if (input.category) {
        queryBuilder = queryBuilder.where(
          eq(marketplaceTemplates.category, input.category)
        );
      }

      // Sort by specified criteria
      if (input.sortBy === "downloads") {
        queryBuilder = queryBuilder.orderBy(
          desc(marketplaceTemplates.downloadCount)
        );
      } else if (input.sortBy === "rating") {
        queryBuilder = queryBuilder.orderBy(
          desc(marketplaceTemplates.averageRating)
        );
      } else {
        queryBuilder = queryBuilder.orderBy(
          desc(marketplaceTemplates.createdAt)
        );
      }

      const templates = await queryBuilder
        .limit(input.limit)
        .offset(input.offset);

      return {
        templates,
        total: templates.length,
      };
    }),

  // Get template details with reviews
  getTemplateDetails: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const template = await db
        .select()
        .from(marketplaceTemplates)
        .where(eq(marketplaceTemplates.id, input.templateId));

      if (!template.length) {
        throw new Error("Template not found");
      }

      const reviews = await db
        .select()
        .from(templateReviews)
        .where(eq(templateReviews.templateId, input.templateId))
        .orderBy(desc(templateReviews.createdAt))
        .limit(10);

      return {
        template: template[0],
        reviews,
        reviewCount: reviews.length,
      };
    }),

  // Import template for current user
  importTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const template = await db
        .select()
        .from(marketplaceTemplates)
        .where(eq(marketplaceTemplates.id, input.templateId));

      if (!template.length) {
        throw new Error("Template not found");
      }

      // Create a copy of the template for the user
      const newTemplate = await db.insert(marketplaceTemplates).values({
        name: `${template[0].name} (Imported)`,
        description: template[0].description,
        content: template[0].content,
        category: template[0].category,
        userId: ctx.user.id,
        published: false,
        downloadCount: 0,
        averageRating: 0,
        reviewCount: 0,
      });

      // Increment download count on original template
      await db
        .update(marketplaceTemplates)
        .set({
          downloadCount: sql`${marketplaceTemplates.downloadCount} + 1`,
        })
        .where(eq(marketplaceTemplates.id, input.templateId));

      return newTemplate;
    }),

  // Submit review for template
  submitReview: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already reviewed this template
      const existingReview = await db
        .select()
        .from(templateReviews)
        .where(
          and(
            eq(templateReviews.templateId, input.templateId),
            eq(templateReviews.userId, ctx.user.id)
          )
        );

      if (existingReview.length > 0) {
        // Update existing review
        await db
          .update(templateReviews)
          .set({
            rating: input.rating,
            comment: input.comment,
            updatedAt: new Date(),
          })
          .where(eq(templateReviews.id, existingReview[0].id));
      } else {
        // Create new review
        await db.insert(templateReviews).values({
          templateId: input.templateId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        });
      }

      // Recalculate average rating
      const reviews = await db
        .select({
          avgRating: sql<number>`AVG(${templateReviews.rating})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(templateReviews)
        .where(eq(templateReviews.templateId, input.templateId));

      if (reviews.length > 0) {
        await db
          .update(marketplaceTemplates)
          .set({
            averageRating: reviews[0].avgRating || 0,
            reviewCount: reviews[0].count || 0,
          })
          .where(eq(marketplaceTemplates.id, input.templateId));
      }

      return { success: true };
    }),

  // Get user's imported templates
  getMyImportedTemplates: protectedProcedure.query(async ({ ctx }) => {
    const templates = await db
      .select()
      .from(marketplaceTemplates)
      .where(
        and(
          eq(marketplaceTemplates.userId, ctx.user.id),
          eq(marketplaceTemplates.published, false)
        )
      )
      .orderBy(desc(marketplaceTemplates.createdAt));

    return templates;
  }),

  // Get featured templates
  getFeaturedTemplates: publicProcedure.query(async () => {
    const templates = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.published, true))
      .orderBy(desc(marketplaceTemplates.downloadCount))
      .limit(5);

    return templates;
  }),

  // Get template categories
  getCategories: publicProcedure.query(async () => {
    const categories = await db
      .selectDistinct({ category: marketplaceTemplates.category })
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.published, true));

    return categories.map((c) => c.category).filter(Boolean);
  }),
});
