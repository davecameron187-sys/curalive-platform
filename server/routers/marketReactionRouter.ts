// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { z } from "zod";
import { sql } from "drizzle-orm";

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

export const marketReactionRouter = router({

  listRecords: publicProcedure.query(async () => {
    const records = await rawQuery<any>(`
      SELECT * FROM market_reaction_correlations
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return records;
  }),

  getStats: publicProcedure.query(async () => {
    const [totals] = await rawQuery<any>(`
      SELECT
        COUNT(*) AS total_events,
        AVG(sentiment_score) AS avg_sentiment,
        AVG(executive_confidence_score) AS avg_exec_confidence,
        SUM(compliance_flags) AS total_compliance_flags,
        AVG(reaction_magnitude) AS avg_magnitude,
        SUM(market_reaction IN ('positive','strongly_positive')) AS positive_outcomes,
        SUM(market_reaction IN ('negative','strongly_negative')) AS negative_outcomes,
        SUM(market_reaction = 'neutral') AS neutral_outcomes
      FROM market_reaction_correlations
    `);

    const byReaction = await rawQuery<any>(`
      SELECT market_reaction, COUNT(*) AS count
      FROM market_reaction_correlations
      WHERE market_reaction IS NOT NULL
      GROUP BY market_reaction
    `);

    const byEventType = await rawQuery<any>(`
      SELECT event_type, COUNT(*) AS count,
        AVG(sentiment_score) AS avg_sentiment,
        SUM(market_reaction IN ('positive','strongly_positive')) AS positive_count
      FROM market_reaction_correlations
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const correlations = await rawQuery<any>(`
      SELECT
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN sentiment_score ELSE NULL END) AS positive_avg_sentiment,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN sentiment_score ELSE NULL END) AS negative_avg_sentiment,
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN compliance_flags ELSE NULL END) AS positive_avg_flags,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN compliance_flags ELSE NULL END) AS negative_avg_flags,
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN executive_confidence_score ELSE NULL END) AS positive_avg_confidence,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN executive_confidence_score ELSE NULL END) AS negative_avg_confidence
      FROM market_reaction_correlations
      WHERE market_reaction IS NOT NULL
    `);

    return {
      totals: totals ?? {},
      byReaction,
      byEventType,
      correlations: correlations[0] ?? {},
    };
  }),

  addRecord: publicProcedure.input(z.object({
    sessionId: z.number().optional(),
    companyName: z.string().min(1),
    ticker: z.string().optional(),
    eventType: z.enum(['earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other']).default('earnings_call'),
    eventDate: z.string().optional(),
    sentimentScore: z.number().min(0).max(100).optional(),
    complianceFlags: z.number().default(0),
    executiveConfidenceScore: z.number().min(0).max(100).optional(),
    qaDifficultyScore: z.number().min(0).max(100).optional(),
    transcriptSegments: z.number().default(0),
    keyTopics: z.string().optional(),
    guidanceDiscussed: z.boolean().default(false),
    revenueDiscussed: z.boolean().default(false),
    marginDiscussed: z.boolean().default(false),
    pricePreEvent: z.number().optional(),
    pricePost24h: z.number().optional(),
    pricePost48h: z.number().optional(),
    pricePost7d: z.number().optional(),
    marketReaction: z.enum(['strongly_positive','positive','neutral','negative','strongly_negative']).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    let reactionMagnitude: number | null = null;
    if (input.pricePreEvent && input.pricePost24h) {
      reactionMagnitude = Math.abs(((input.pricePost24h - input.pricePreEvent) / input.pricePreEvent) * 100);
    }

    let aiInsight: string | null = null;
    try {
      const prompt = `You are a financial intelligence analyst specializing in investor communications.

Analyze this investor event and its market outcome:
- Company: ${input.companyName} (${input.ticker ?? 'unlisted'})
- Event Type: ${input.eventType}
- Sentiment Score: ${input.sentimentScore ?? 'N/A'}/100
- Compliance Flags: ${input.complianceFlags}
- Executive Confidence Score: ${input.executiveConfidenceScore ?? 'N/A'}/100
- Q&A Difficulty: ${input.qaDifficultyScore ?? 'N/A'}/100
- Topics: Revenue guidance discussed: ${input.revenueDiscussed}, Margin discussed: ${input.marginDiscussed}
- Market Reaction: ${input.marketReaction ?? 'Not yet recorded'}
- Price movement (24h): ${input.pricePreEvent && input.pricePost24h ? `${(((input.pricePost24h - input.pricePreEvent) / input.pricePreEvent) * 100).toFixed(2)}%` : 'N/A'}

Write a 2-3 sentence intelligence brief explaining the key communication signals and their likely contribution to the market outcome. Be specific and data-driven.`;

      const result = await invokeLLM(prompt, { maxTokens: 200 });
      aiInsight = result.choices?.[0]?.message?.content ?? null;
    } catch {}

    await rawExecute(`
      INSERT INTO market_reaction_correlations
        (session_id, company_name, ticker, event_type, event_date, sentiment_score,
         compliance_flags, executive_confidence_score, qa_difficulty_score,
         transcript_segments, key_topics, guidance_discussed, revenue_discussed,
         margin_discussed, price_pre_event, price_post_24h, price_post_48h,
         price_post_7d, market_reaction, reaction_magnitude, ai_insight, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      input.sessionId ?? null,
      input.companyName,
      input.ticker ?? null,
      input.eventType,
      input.eventDate ?? null,
      input.sentimentScore ?? null,
      input.complianceFlags,
      input.executiveConfidenceScore ?? null,
      input.qaDifficultyScore ?? null,
      input.transcriptSegments,
      input.keyTopics ?? null,
      input.guidanceDiscussed ? 1 : 0,
      input.revenueDiscussed ? 1 : 0,
      input.marginDiscussed ? 1 : 0,
      input.pricePreEvent ?? null,
      input.pricePost24h ?? null,
      input.pricePost48h ?? null,
      input.pricePost7d ?? null,
      input.marketReaction ?? null,
      reactionMagnitude,
      aiInsight,
      input.notes ?? null,
    ]);

    return { success: true };
  }),

  generatePrediction: publicProcedure.input(z.object({
    sentimentScore: z.number().optional(),
    complianceFlags: z.number().default(0),
    executiveConfidenceScore: z.number().optional(),
    qaDifficultyScore: z.number().optional(),
    guidanceDiscussed: z.boolean().default(false),
    revenueDiscussed: z.boolean().default(false),
    marginDiscussed: z.boolean().default(false),
    eventType: z.string().default('earnings_call'),
    companyName: z.string().optional(),
  })).mutation(async ({ input }) => {
    const historicalAvgs = await rawQuery<any>(`
      SELECT
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN sentiment_score ELSE NULL END) AS pos_sentiment,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN sentiment_score ELSE NULL END) AS neg_sentiment,
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN executive_confidence_score ELSE NULL END) AS pos_confidence,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN executive_confidence_score ELSE NULL END) AS neg_confidence,
        AVG(CASE WHEN market_reaction IN ('positive','strongly_positive') THEN compliance_flags ELSE NULL END) AS pos_flags,
        AVG(CASE WHEN market_reaction IN ('negative','strongly_negative') THEN compliance_flags ELSE NULL END) AS neg_flags
      FROM market_reaction_correlations
      WHERE market_reaction IS NOT NULL
    `);

    const avgs = historicalAvgs[0] ?? {};
    const totalRecords = (await rawQuery<any>(`SELECT COUNT(*) AS c FROM market_reaction_correlations WHERE market_reaction IS NOT NULL`))[0]?.c ?? 0;

    let predictedDirection: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 50;
    let aiPrediction = '';

    try {
      const prompt = `You are a market reaction prediction model for investor communications.

Historical dataset summary (${totalRecords} events):
- Events with positive reaction: avg sentiment ${avgs.pos_sentiment?.toFixed(1) ?? 'N/A'}, avg exec confidence ${avgs.pos_confidence?.toFixed(1) ?? 'N/A'}, avg compliance flags ${avgs.pos_flags?.toFixed(1) ?? 'N/A'}
- Events with negative reaction: avg sentiment ${avgs.neg_sentiment?.toFixed(1) ?? 'N/A'}, avg exec confidence ${avgs.neg_confidence?.toFixed(1) ?? 'N/A'}, avg compliance flags ${avgs.neg_flags?.toFixed(1) ?? 'N/A'}

Current event signals:
- Event Type: ${input.eventType}
- Sentiment Score: ${input.sentimentScore ?? 'N/A'}/100
- Executive Confidence: ${input.executiveConfidenceScore ?? 'N/A'}/100
- Compliance Flags: ${input.complianceFlags}
- Q&A Difficulty: ${input.qaDifficultyScore ?? 'N/A'}/100
- Revenue guidance discussed: ${input.revenueDiscussed}
- Margin discussed: ${input.marginDiscussed}

Respond in JSON only: {"direction": "positive"|"neutral"|"negative", "confidence": 0-100, "insight": "2 sentence explanation"}`;

      const result = await invokeLLM(prompt, { maxTokens: 200 });
      const content = result.choices?.[0]?.message?.content ?? '';
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      predictedDirection = parsed.direction ?? 'neutral';
      confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 50));
      aiPrediction = parsed.insight ?? '';
    } catch {
      const s = input.sentimentScore ?? 65;
      const c = input.complianceFlags;
      const e = input.executiveConfidenceScore ?? 65;
      const score = (s * 0.4) + (e * 0.35) - (c * 5) - (input.revenueDiscussed ? 3 : 0);
      predictedDirection = score > 60 ? 'positive' : score < 45 ? 'negative' : 'neutral';
      confidence = Math.min(80, Math.abs(score - 52) + 40);
      aiPrediction = 'Prediction based on weighted communication signal scoring.';
    }

    return {
      direction: predictedDirection,
      confidence,
      insight: aiPrediction,
      dataPoints: Number(totalRecords),
    };
  }),

  deleteRecord: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await rawExecute(`DELETE FROM market_reaction_correlations WHERE id = ?`, [input.id]);
    return { success: true };
  }),

});
