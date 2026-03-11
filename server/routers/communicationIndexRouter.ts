// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { z } from "zod";

async function rawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(query, params);
  return rows as T[];
}

async function rawExecute(query: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(query, params);
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

async function computeCICI() {
  const [aggStats] = await rawQuery<any>(`
    SELECT
      COUNT(*) AS total,
      AVG(sentiment_score) AS avg_sentiment,
      SUM(engagement_level = 'high') AS high_eng,
      SUM(engagement_level = 'medium') AS med_eng,
      SUM(compliance_risk = 'low') AS low_risk,
      SUM(compliance_risk = 'medium') AS med_risk,
      SUM(source_type = 'live_session') AS live_count,
      SUM(source_type = 'archive_upload') AS archive_count
    FROM aggregate_intelligence
  `);

  const [mrStats] = await rawQuery<any>(`
    SELECT
      COUNT(*) AS total,
      AVG(sentiment_score) AS avg_sentiment,
      AVG(executive_confidence_score) AS avg_confidence,
      SUM(market_reaction IN ('positive','strongly_positive')) AS positive_count,
      SUM(market_reaction IS NOT NULL) AS classified_count
    FROM market_reaction_correlations
  `);

  const [shadowStats] = await rawQuery<any>(`
    SELECT AVG(sentiment_avg) AS avg_sentiment, COUNT(*) AS total
    FROM shadow_sessions WHERE status = 'completed' AND sentiment_avg IS NOT NULL
  `);

  const totalEvents = Number(aggStats?.total ?? 0);
  const mrTotal = Number(mrStats?.total ?? 0);

  const rawSentiment = Number(aggStats?.avg_sentiment ?? shadowStats?.avg_sentiment ?? 65);
  const avgSentiment = Math.min(100, Math.max(0, rawSentiment));
  const avgConfidence = Number(mrStats?.avg_confidence ?? 65);

  const communicationQuality = Math.min(100, Math.round(
    (avgSentiment * 0.6) + (avgConfidence * 0.4)
  ));

  const highEngCount = Number(aggStats?.high_eng ?? 0);
  const medEngCount = Number(aggStats?.med_eng ?? 0);
  const engagementScore = totalEvents > 0
    ? Math.round(((highEngCount * 1.0 + medEngCount * 0.6) / totalEvents) * 100)
    : 65;
  const investorEngagement = Math.min(100, engagementScore);

  const lowRiskCount = Number(aggStats?.low_risk ?? 0);
  const medRiskCount = Number(aggStats?.med_risk ?? 0);
  const complianceScore = totalEvents > 0
    ? Math.round(((lowRiskCount * 1.0 + medRiskCount * 0.6) / totalEvents) * 100)
    : 70;
  const complianceQuality = Math.min(100, complianceScore);

  const classifiedCount = Number(mrStats?.classified_count ?? 0);
  const positiveCount = Number(mrStats?.positive_count ?? 0);
  const marketConfidence = classifiedCount > 0
    ? Math.round((positiveCount / classifiedCount) * 100)
    : 58;

  const ciciScore = Math.round(
    (communicationQuality * 0.35) +
    (investorEngagement * 0.25) +
    (complianceQuality * 0.20) +
    (marketConfidence * 0.20)
  );

  const highEngPct = totalEvents > 0 ? Math.round((highEngCount / totalEvents) * 100) : 0;
  const lowRiskPct = totalEvents > 0 ? Math.round((lowRiskCount / totalEvents) * 100) : 0;
  const positiveMktPct = classifiedCount > 0 ? Math.round((positiveCount / classifiedCount) * 100) : 0;

  const byEventType = await rawQuery<any>(`
    SELECT event_type, COUNT(*) AS count, AVG(sentiment_score) AS avg_sentiment,
      SUM(engagement_level = 'high') AS high_eng
    FROM aggregate_intelligence
    GROUP BY event_type ORDER BY count DESC
  `);

  const mrByEventType = await rawQuery<any>(`
    SELECT event_type, COUNT(*) AS count,
      AVG(executive_confidence_score) AS avg_confidence,
      SUM(market_reaction IN ('positive','strongly_positive')) AS positive_count
    FROM market_reaction_correlations
    GROUP BY event_type ORDER BY count DESC
  `);

  const quarterly = await rawQuery<any>(`
    SELECT event_quarter, COUNT(*) AS count, AVG(sentiment_score) AS avg_sentiment,
      SUM(engagement_level = 'high') AS high_eng
    FROM aggregate_intelligence
    WHERE event_quarter IS NOT NULL
    GROUP BY event_quarter ORDER BY event_quarter ASC LIMIT 8
  `);

  return {
    ciciScore,
    communicationQuality,
    investorEngagement,
    complianceQuality,
    marketConfidence,
    totalEvents,
    liveEvents: Number(aggStats?.live_count ?? 0),
    archiveEvents: Number(aggStats?.archive_count ?? 0),
    mrTotal,
    avgSentiment: Math.round(avgSentiment),
    highEngPct,
    lowRiskPct,
    positiveMktPct,
    byEventType,
    mrByEventType,
    quarterly,
  };
}

export const communicationIndexRouter = router({

  getCurrent: publicProcedure.query(async () => {
    return computeCICI();
  }),

  getHistory: publicProcedure.query(async () => {
    const snapshots = await rawQuery<any>(`
      SELECT * FROM communication_index_snapshots
      ORDER BY quarter ASC LIMIT 20
    `);
    return snapshots;
  }),

  publishSnapshot: publicProcedure.mutation(async () => {
    const data = await computeCICI();
    const quarter = getCurrentQuarter();

    let commentary = '';
    try {
      const prompt = `You are the CuraLive Chief Intelligence Officer publishing the quarterly Investor Communication Index (CICI).

Current CICI Reading: ${data.ciciScore}/100
- Communication Quality: ${data.communicationQuality}/100
- Investor Engagement: ${data.investorEngagement}/100
- Compliance Quality: ${data.complianceQuality}/100
- Market Confidence: ${data.marketConfidence}/100
- Total Events Analysed: ${data.totalEvents}
- High Engagement Rate: ${data.highEngPct}%
- Low Compliance Risk Rate: ${data.lowRiskPct}%
- Positive Market Outcome Rate: ${data.positiveMktPct}%

Write a professional 3-sentence quarterly index commentary in the style of a Bloomberg or S&P Global index publication. Be specific, data-driven, and forward-looking. Reference the CICI score prominently.`;

      const result = await invokeLLM(prompt, { maxTokens: 250 });
      commentary = result.choices?.[0]?.message?.content ?? '';
    } catch {}

    const topSignal = data.ciciScore >= 70
      ? 'Communication quality and investor engagement remain elevated — positive conditions for market confidence.'
      : data.ciciScore >= 55
      ? 'Mixed signals across the communication spectrum — compliance performance supports overall index stability.'
      : 'Elevated compliance risk and subdued sentiment are weighing on the index — IR teams should review communication strategies.';

    await rawExecute(`
      INSERT INTO communication_index_snapshots
        (quarter, cici_score, communication_quality_score, investor_engagement_score,
         compliance_quality_score, market_confidence_score, total_events, live_events,
         archive_events, avg_sentiment, high_engagement_pct, low_compliance_risk_pct,
         positive_market_pct, event_type_breakdown, top_signal, ai_commentary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cici_score = VALUES(cici_score),
        communication_quality_score = VALUES(communication_quality_score),
        investor_engagement_score = VALUES(investor_engagement_score),
        compliance_quality_score = VALUES(compliance_quality_score),
        market_confidence_score = VALUES(market_confidence_score),
        total_events = VALUES(total_events),
        avg_sentiment = VALUES(avg_sentiment),
        ai_commentary = VALUES(ai_commentary),
        top_signal = VALUES(top_signal)
    `, [
      quarter,
      data.ciciScore,
      data.communicationQuality,
      data.investorEngagement,
      data.complianceQuality,
      data.marketConfidence,
      data.totalEvents,
      data.liveEvents,
      data.archiveEvents,
      data.avgSentiment,
      data.highEngPct,
      data.lowRiskPct,
      data.positiveMktPct,
      JSON.stringify(data.byEventType),
      topSignal,
      commentary,
    ]);

    return { success: true, quarter, score: data.ciciScore, commentary };
  }),

});
