// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { operatorLinkAnalytics, operatorLinksMetadata } from "../../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const operatorLinksRouter = router({
  trackClick: publicProcedure
    .input(z.object({
      linkPath: z.string().min(1),
      linkTitle: z.string().optional(),
      category: z.string().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.insert(operatorLinkAnalytics).values({
        operatorId: (ctx as any).user?.id ?? null,
        linkPath: input.linkPath,
        linkTitle: input.linkTitle ?? null,
        category: input.category ?? null,
        sessionId: input.sessionId ?? null,
        accessedAt: new Date(),
      });
      await db.execute(
        sql`UPDATE operator_links_metadata SET click_count = click_count + 1 WHERE link_path = ${input.linkPath}`
      );
      return { success: true };
    }),

  getPopularLinks: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select({
          linkPath: operatorLinkAnalytics.linkPath,
          linkTitle: operatorLinkAnalytics.linkTitle,
          category: operatorLinkAnalytics.category,
          clicks: sql<number>`COUNT(*)`,
        })
        .from(operatorLinkAnalytics)
        .groupBy(operatorLinkAnalytics.linkPath, operatorLinkAnalytics.linkTitle, operatorLinkAnalytics.category)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(input.limit);
      return rows;
    }),

  getMyHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const userId = (ctx as any).user?.id;
      const rows = await db
        .select()
        .from(operatorLinkAnalytics)
        .where(userId ? eq(operatorLinkAnalytics.operatorId, userId) : sql`1=1`)
        .orderBy(desc(operatorLinkAnalytics.accessedAt))
        .limit(input.limit);
      return rows;
    }),

  getAllMetadata: publicProcedure
    .query(async () => {
      const db = await getDb();
      return db
        .select()
        .from(operatorLinksMetadata)
        .orderBy(operatorLinksMetadata.sortOrder);
    }),

  getMetadataByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(operatorLinksMetadata)
        .where(eq(operatorLinksMetadata.category, input.category))
        .orderBy(operatorLinksMetadata.sortOrder);
    }),

  getAnalyticsSummary: publicProcedure
    .query(async () => {
      const db = await getDb();
      const [totalClicks] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(operatorLinkAnalytics);
      const [uniquePaths] = await db
        .select({ count: sql<number>`COUNT(DISTINCT link_path)` })
        .from(operatorLinkAnalytics);
      const [today] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(operatorLinkAnalytics)
        .where(gte(operatorLinkAnalytics.accessedAt, sql`DATE(NOW())`));
      const topLinks = await db
        .select({
          linkPath: operatorLinksMetadata.linkPath,
          title: operatorLinksMetadata.title,
          category: operatorLinksMetadata.category,
          clickCount: operatorLinksMetadata.clickCount,
        })
        .from(operatorLinksMetadata)
        .orderBy(desc(operatorLinksMetadata.clickCount))
        .limit(5);
      return {
        totalClicks: totalClicks?.count ?? 0,
        uniquePaths: uniquePaths?.count ?? 0,
        todayClicks: today?.count ?? 0,
        topLinks,
      };
    }),
});

export type OperatorLinksRouter = typeof operatorLinksRouter;
