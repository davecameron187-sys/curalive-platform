import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";

async function rawQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(sql, params);
  return rows as T[];
}

export const benchmarksRouter = router({

  getStats: publicProcedure.query(async () => {
    const [totals] = await rawQuery<{
      total: number;
      avg_sentiment: number | null;
      live_count: number;
      archive_count: number;
    }>(`
      SELECT
        COUNT(*) AS total,
        ROUND(AVG(sentiment_score), 1) AS avg_sentiment,
        SUM(source_type = 'live_session') AS live_count,
        SUM(source_type = 'archive_upload') AS archive_count
      FROM aggregate_intelligence
    `);

    const byEventType = await rawQuery<{
      event_type: string;
      count: number;
      avg_sentiment: number | null;
      high_compliance: number;
    }>(`
      SELECT
        event_type,
        COUNT(*) AS count,
        ROUND(AVG(sentiment_score), 1) AS avg_sentiment,
        SUM(compliance_risk IN ('high','critical')) AS high_compliance
      FROM aggregate_intelligence
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const byEngagement = await rawQuery<{ engagement_level: string; count: number }>(`
      SELECT engagement_level, COUNT(*) AS count
      FROM aggregate_intelligence
      GROUP BY engagement_level
      ORDER BY FIELD(engagement_level,'low','medium','high')
    `);

    const byCompliance = await rawQuery<{ compliance_risk: string; count: number }>(`
      SELECT compliance_risk, COUNT(*) AS count
      FROM aggregate_intelligence
      GROUP BY compliance_risk
      ORDER BY FIELD(compliance_risk,'low','medium','high','critical')
    `);

    const bySentimentBand = await rawQuery<{ band: string; count: number }>(`
      SELECT
        CASE
          WHEN sentiment_score IS NULL THEN 'Unknown'
          WHEN sentiment_score >= 70 THEN 'Positive (70–100)'
          WHEN sentiment_score >= 50 THEN 'Neutral (50–69)'
          ELSE 'Negative (0–49)'
        END AS band,
        COUNT(*) AS count
      FROM aggregate_intelligence
      GROUP BY band
    `);

    const byQuarter = await rawQuery<{ event_quarter: string | null; count: number }>(`
      SELECT event_quarter, COUNT(*) AS count
      FROM aggregate_intelligence
      WHERE event_quarter IS NOT NULL
      GROUP BY event_quarter
      ORDER BY event_quarter DESC
      LIMIT 8
    `);

    return {
      totals: {
        total: Number(totals?.total ?? 0),
        avgSentiment: totals?.avg_sentiment != null ? Number(totals.avg_sentiment) : null,
        liveCount: Number(totals?.live_count ?? 0),
        archiveCount: Number(totals?.archive_count ?? 0),
      },
      byEventType: byEventType.map(r => ({
        eventType: r.event_type,
        count: Number(r.count),
        avgSentiment: r.avg_sentiment != null ? Number(r.avg_sentiment) : null,
        highCompliance: Number(r.high_compliance),
      })),
      byEngagement: byEngagement.map(r => ({ level: r.engagement_level, count: Number(r.count) })),
      byCompliance: byCompliance.map(r => ({ risk: r.compliance_risk, count: Number(r.count) })),
      bySentimentBand: bySentimentBand.map(r => ({ band: r.band, count: Number(r.count) })),
      byQuarter: byQuarter.map(r => ({ quarter: r.event_quarter, count: Number(r.count) })),
    };
  }),
});
