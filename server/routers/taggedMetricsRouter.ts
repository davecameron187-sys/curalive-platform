// @ts-nocheck
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { taggedMetrics } from "../../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export const taggedMetricsRouter = router({

  store: publicProcedure
    .input(z.object({
      eventId: z.string(),
      eventTitle: z.string().optional(),
      tagType: z.enum(["sentiment", "compliance", "scaling", "engagement", "qa", "intervention"]),
      metricValue: z.number(),
      label: z.string().optional(),
      detail: z.string().optional(),
      bundle: z.string().optional(),
      severity: z.enum(["positive", "neutral", "negative", "critical"]).optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        await db.insert(taggedMetrics).values({
          eventId: input.eventId,
          eventTitle: input.eventTitle ?? null,
          tagType: input.tagType,
          metricValue: input.metricValue,
          label: input.label ?? null,
          detail: input.detail ?? null,
          bundle: input.bundle ?? null,
          severity: input.severity ?? "neutral",
          source: input.source ?? "system",
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  getByEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        return db
          .select()
          .from(taggedMetrics)
          .where(eq(taggedMetrics.eventId, input.eventId))
          .orderBy(desc(taggedMetrics.createdAt));
      } catch { return []; }
    }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        return db
          .select()
          .from(taggedMetrics)
          .orderBy(desc(taggedMetrics.createdAt))
          .limit(input.limit);
      } catch { return []; }
    }),

  getStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const all = await db.select().from(taggedMetrics);
      const total = all.length;
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byEvent: Record<string, { title: string; count: number }> = {};
      let positiveCount = 0;
      let criticalCount = 0;
      let totalSentiment = 0;
      let sentimentCount = 0;

      for (const row of all) {
        byType[row.tagType] = (byType[row.tagType] ?? 0) + 1;
        bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;
        if (!byEvent[row.eventId]) byEvent[row.eventId] = { title: row.eventTitle ?? row.eventId, count: 0 };
        byEvent[row.eventId].count++;
        if (row.severity === "positive") positiveCount++;
        if (row.severity === "critical") criticalCount++;
        if (row.tagType === "sentiment") { totalSentiment += row.metricValue; sentimentCount++; }
      }

      const avgSentiment = sentimentCount > 0 ? Math.round(totalSentiment / sentimentCount) : null;
      const uniqueEvents = Object.keys(byEvent).length;

      return { total, byType, bySeverity, byEvent, positiveCount, criticalCount, avgSentiment, uniqueEvents };
    } catch {
      return { total: 0, byType: {}, bySeverity: {}, byEvent: {}, positiveCount: 0, criticalCount: 0, avgSentiment: null, uniqueEvents: 0 };
    }
  }),

  getEvents: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const rows = await db
        .selectDistinct({ eventId: taggedMetrics.eventId, eventTitle: taggedMetrics.eventTitle })
        .from(taggedMetrics)
        .orderBy(desc(taggedMetrics.createdAt));
      return rows;
    } catch { return []; }
  }),
});
