// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

async function rawQuery(sql: string, params: any[] = []) {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(sql, params);
  return rows;
}

const TOPIC_LABELS: Record<string, string> = {
  revenue_guidance: "Revenue Guidance", margin_pressure: "Margin Pressure",
  supply_chain: "Supply Chain", ai_infrastructure: "AI Infrastructure",
  capital_allocation: "Capital Allocation", esg: "ESG", governance: "Governance",
  debt_leverage: "Debt & Leverage", growth_strategy: "Growth Strategy",
  market_conditions: "Market Conditions", management: "Management",
  competition: "Competition", regulatory: "Regulatory", other: "Other",
};

export const intelligenceTerminalRouter = router({

  getOverview: publicProcedure.query(async () => {
    // Platform scale stats
    const [scale] = await rawQuery(`
      SELECT
        (SELECT COUNT(*) FROM investor_questions) as total_questions,
        (SELECT COUNT(DISTINCT sector) FROM investor_questions WHERE sector IS NOT NULL) as sectors,
        (SELECT COUNT(DISTINCT company_name) FROM investor_questions WHERE company_name IS NOT NULL) as companies,
        (SELECT COUNT(*) FROM market_reaction_correlations) as mr_events,
        (SELECT COUNT(*) FROM communication_index_snapshots) as cici_snapshots,
        (SELECT COUNT(*) FROM intelligence_reports) as reports_generated,
        (SELECT COUNT(*) FROM call_preparations) as briefings_generated
    `);
    return scale;
  }),

  getGlobalConcerns: publicProcedure
    .input(z.object({ quarter: z.string().optional(), sector: z.string().optional() }))
    .query(async ({ input }) => {
      // Top concerns globally + by sector
      const global = await rawQuery(`
        SELECT topic_category,
               COUNT(*) as frequency,
               ROUND(AVG(difficulty_score), 1) as avg_difficulty,
               COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoidance_count,
               ROUND(COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) / COUNT(*) * 100, 1) as avoidance_rate,
               ROUND(AVG(CASE WHEN question_sentiment='negative' THEN 1 WHEN question_sentiment='neutral' THEN 0.5 ELSE 0 END) * 100, 1) as negative_sentiment_pct
        FROM investor_questions
        WHERE topic_category IS NOT NULL
          AND (? IS NULL OR event_quarter = ?)
          AND (? IS NULL OR sector = ?)
        GROUP BY topic_category
        ORDER BY frequency DESC
      `, [input.quarter ?? null, input.quarter ?? null, input.sector ?? null, input.sector ?? null]);

      // Quarter-over-quarter trend for top topics
      const trend = await rawQuery(`
        SELECT event_quarter, topic_category, COUNT(*) as count
        FROM investor_questions
        WHERE event_quarter IS NOT NULL AND topic_category IS NOT NULL
        GROUP BY event_quarter, topic_category
        ORDER BY event_quarter ASC, count DESC
      `);

      // Sector breakdown
      const bySector = await rawQuery(`
        SELECT sector, topic_category, COUNT(*) as count,
               ROUND(AVG(difficulty_score), 1) as avg_diff
        FROM investor_questions
        WHERE sector IS NOT NULL AND topic_category IS NOT NULL
        GROUP BY sector, topic_category
        ORDER BY count DESC
        LIMIT 40
      `);

      return {
        global: global.map((r: any) => ({ ...r, label: TOPIC_LABELS[r.topic_category] ?? r.topic_category })),
        trend,
        bySector,
      };
    }),

  getMarketSignals: publicProcedure.query(async () => {
    // Correlation of communication topics → market reactions
    const byTopic = await rawQuery(`
      SELECT topic_tag,
             COUNT(*) as events,
             COUNT(CASE WHEN post_event_reaction='positive' THEN 1 END) as positive,
             COUNT(CASE WHEN post_event_reaction='negative' THEN 1 END) as negative,
             COUNT(CASE WHEN post_event_reaction='neutral' THEN 1 END) as neutral,
             ROUND(COUNT(CASE WHEN post_event_reaction='positive' THEN 1 END) / COUNT(*) * 100, 1) as positive_rate,
             ROUND(AVG(prediction_confidence), 1) as avg_confidence,
             ROUND(AVG(sentiment_score), 1) as avg_sentiment
      FROM market_reaction_correlations
      WHERE topic_tag IS NOT NULL
      GROUP BY topic_tag
      ORDER BY events DESC
      LIMIT 12
    `);

    // Avoidance → negative outcome correlation
    const avoidanceSignal = await rawQuery(`
      SELECT
        ROUND(
          SUM(CASE WHEN mr.post_event_reaction='negative' AND iq.avoidance_detected=1 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN iq.avoidance_detected=1 THEN 1 ELSE 0 END), 0) * 100
        , 1) as avoidance_negative_rate,
        COUNT(CASE WHEN iq.avoidance_detected=1 THEN 1 END) as total_avoidance_events
      FROM investor_questions iq
      LEFT JOIN market_reaction_correlations mr ON mr.sector = iq.sector AND mr.event_quarter = iq.event_quarter
    `);

    // Sector-level market signal
    const bySector = await rawQuery(`
      SELECT sector,
             COUNT(*) as events,
             ROUND(COUNT(CASE WHEN post_event_reaction='positive' THEN 1 END) / COUNT(*) * 100, 1) as positive_rate,
             ROUND(AVG(prediction_confidence), 1) as avg_confidence,
             ROUND(AVG(sentiment_score), 1) as avg_sentiment
      FROM market_reaction_correlations
      WHERE sector IS NOT NULL
      GROUP BY sector
      ORDER BY events DESC
      LIMIT 10
    `);

    // Recent high-signal events
    const recent = await rawQuery(`
      SELECT event_name, sector, event_type, event_quarter,
             post_event_reaction, prediction_confidence, sentiment_score,
             executive_confidence, topic_tag, created_at
      FROM market_reaction_correlations
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return { byTopic, avoidanceSignal: avoidanceSignal[0], bySector, recent };
  }),

  getExecBenchmarks: publicProcedure.query(async () => {
    // Communication quality by sector from aggregate_intelligence
    const bySector = await rawQuery(`
      SELECT sector,
             COUNT(*) as events,
             ROUND(AVG(sentiment_score), 1) as avg_sentiment,
             ROUND(AVG(CASE WHEN compliance_risk='low' THEN 100 WHEN compliance_risk='medium' THEN 60 ELSE 20 END), 1) as avg_compliance_score,
             COUNT(CASE WHEN engagement_level='high' THEN 1 END) as high_engagement,
             ROUND(COUNT(CASE WHEN engagement_level='high' THEN 1 END)/COUNT(*)*100, 1) as high_engagement_rate
      FROM aggregate_intelligence
      WHERE sector IS NOT NULL
      GROUP BY sector
      ORDER BY events DESC
      LIMIT 12
    `).catch(() => []);

    // CICI history
    const ciciHistory = await rawQuery(`
      SELECT quarter, cici_score, communication_quality_score, investor_engagement_score,
             compliance_quality_score, market_confidence_score, total_events, created_at
      FROM communication_index_snapshots
      ORDER BY created_at ASC
    `);

    // Q&A difficulty by sector
    const diffBySector = await rawQuery(`
      SELECT sector,
             ROUND(AVG(difficulty_score), 1) as avg_difficulty,
             COUNT(*) as questions,
             COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided,
             ROUND(COUNT(CASE WHEN avoidance_detected=1 THEN 1 END)/COUNT(*)*100, 1) as avoidance_rate
      FROM investor_questions
      WHERE sector IS NOT NULL AND difficulty_score IS NOT NULL
      GROUP BY sector
      ORDER BY avg_difficulty DESC
    `);

    return { bySector, ciciHistory, diffBySector };
  }),

  getSectors: publicProcedure.query(async () => {
    const rows = await rawQuery(`
      SELECT DISTINCT sector FROM investor_questions WHERE sector IS NOT NULL
      UNION
      SELECT DISTINCT sector FROM market_reaction_correlations WHERE sector IS NOT NULL
      ORDER BY sector ASC
    `);
    return rows.map((r: any) => r.sector);
  }),

  getQuarters: publicProcedure.query(async () => {
    const rows = await rawQuery(`
      SELECT DISTINCT event_quarter FROM investor_questions WHERE event_quarter IS NOT NULL
      UNION
      SELECT DISTINCT event_quarter FROM market_reaction_correlations WHERE event_quarter IS NOT NULL
      ORDER BY event_quarter DESC
      LIMIT 12
    `);
    return rows.map((r: any) => r.event_quarter);
  }),
});
