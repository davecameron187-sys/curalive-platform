// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {getDb, rawSql } from "../db";
import { invokeLLM } from "../_core/llm";

async function rawQuery(sql: string, params: any[] = []) {
  const db = await getDb();
    const [rows] = await rawSql(sql, params);
  return rows;
}

async function rawExecute(sql: string, params: any[] = []) {
  const db = await getDb();
    const [result] = await rawSql(sql, params);
  return result;
}

const TOPIC_LABELS: Record<string, string> = {
  revenue_guidance: "Revenue Guidance",
  margin_pressure: "Margin Pressure",
  supply_chain: "Supply Chain",
  ai_infrastructure: "AI Infrastructure",
  capital_allocation: "Capital Allocation",
  esg: "ESG",
  governance: "Governance",
  debt_leverage: "Debt & Leverage",
  growth_strategy: "Growth Strategy",
  market_conditions: "Market Conditions",
  management: "Management",
  competition: "Competition",
  regulatory: "Regulatory",
  other: "Other",
};

export const investorQuestionsRouter = router({

  analyzeQuestion: publicProcedure
    .input(z.object({ questionText: z.string(), responseText: z.string().optional() }))
    .mutation(async ({ input }) => {
      const prompt = `You are an expert investor relations analyst. Analyze the following investor question and executive response from an earnings call.

QUESTION: ${input.questionText}
${input.responseText ? `EXECUTIVE RESPONSE: ${input.responseText}` : "NO RESPONSE PROVIDED"}

Return ONLY a JSON object with these fields (no markdown, no code blocks):
{
  "question_topic": "<one-line topic label, 3-6 words>",
  "topic_category": "<one of: revenue_guidance, margin_pressure, supply_chain, ai_infrastructure, capital_allocation, esg, governance, debt_leverage, growth_strategy, market_conditions, management, competition, regulatory, other>",
  "question_sentiment": "<positive|neutral|negative>",
  "difficulty_score": <float 0-10>,
  "response_sentiment": "<strong|adequate|weak|deflected>",
  "avoidance_detected": <true|false>,
  "avoidance_score": <float 0-10>,
  "avoidance_reason": "<one sentence explanation if avoidance detected, else empty string>",
  "follow_up_likelihood": <float 0-10>,
  "analysis_summary": "<2-3 sentence expert commentary on this Q&A exchange>"
}`;
      const result = await invokeLLM(prompt);
      const content = result.choices?.[0]?.message?.content ?? "{}";
      try {
        return JSON.parse(content.trim().replace(/^```json\n?/, "").replace(/\n?```$/, ""));
      } catch {
        return {};
      }
    }),

  addQuestion: publicProcedure
    .input(z.object({
      companyName: z.string().optional(),
      sector: z.string().optional(),
      eventType: z.enum(["earnings_call","agm","capital_markets_day","ceo_town_hall","board_meeting","webcast","other"]).default("earnings_call"),
      eventQuarter: z.string().optional(),
      investorName: z.string().optional(),
      investorFirm: z.string().optional(),
      questionText: z.string().min(1),
      responseText: z.string().optional(),
      questionTopic: z.string().optional(),
      topicCategory: z.string().optional(),
      questionSentiment: z.string().optional(),
      difficultySCore: z.number().optional(),
      responseSentiment: z.string().optional(),
      responseLengthWords: z.number().optional(),
      avoidanceDetected: z.boolean().optional(),
      avoidanceScore: z.number().optional(),
      avoidanceReason: z.string().optional(),
      followUpCount: z.number().optional(),
      aiAnalysis: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const wordCount = input.responseText ? input.responseText.split(/\s+/).filter(Boolean).length : 0;
      await rawExecute(
        `INSERT INTO investor_questions
          (company_name, sector, event_type, event_quarter, investor_name, investor_firm,
           question_text, response_text, question_topic, topic_category, question_sentiment,
           difficulty_score, response_sentiment, response_length_words, avoidance_detected,
           avoidance_score, avoidance_reason, follow_up_count, ai_analysis)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          input.companyName ?? null,
          input.sector ?? null,
          input.eventType,
          input.eventQuarter ?? null,
          input.investorName ?? null,
          input.investorFirm ?? null,
          input.questionText,
          input.responseText ?? null,
          input.questionTopic ?? null,
          input.topicCategory ?? "other",
          input.questionSentiment ?? "neutral",
          input.difficultySCore ?? null,
          input.responseSentiment ?? "adequate",
          input.responseLengthWords ?? wordCount,
          input.avoidanceDetected ? 1 : 0,
          input.avoidanceScore ?? 0,
          input.avoidanceReason ?? null,
          input.followUpCount ?? 0,
          input.aiAnalysis ?? null,
        ]
      );
      return { ok: true };
    }),

  listQuestions: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
      sector: z.string().optional(),
      topicCategory: z.string().optional(),
      avoidanceOnly: z.boolean().optional(),
      minDifficulty: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let where = "WHERE 1=1";
      const params: any[] = [];
      if (input.sector) { where += " AND sector = ?"; params.push(input.sector); }
      if (input.topicCategory) { where += " AND topic_category = ?"; params.push(input.topicCategory); }
      if (input.avoidanceOnly) { where += " AND avoidance_detected = 1"; }
      if (input.minDifficulty != null) { where += " AND difficulty_score >= ?"; params.push(input.minDifficulty); }
      params.push(input.limit);
      return rawQuery(`SELECT * FROM investor_questions ${where} ORDER BY created_at DESC LIMIT ?`, params);
    }),

  getGlobalConcerns: publicProcedure.query(async () => {
    const bySector = await rawQuery(
      `SELECT sector, topic_category, COUNT(*) as count, ROUND(AVG(difficulty_score),1) as avg_difficulty
       FROM investor_questions WHERE sector IS NOT NULL AND topic_category IS NOT NULL
       GROUP BY sector, topic_category ORDER BY count DESC LIMIT 30`
    );
    const byTopic = await rawQuery(
      `SELECT topic_category, COUNT(*) as count, ROUND(AVG(difficulty_score),1) as avg_difficulty,
              ROUND(AVG(avoidance_score),1) as avg_avoidance, COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided_count
       FROM investor_questions WHERE topic_category IS NOT NULL
       GROUP BY topic_category ORDER BY count DESC`
    );
    const byQuarter = await rawQuery(
      `SELECT event_quarter, topic_category, COUNT(*) as count
       FROM investor_questions WHERE event_quarter IS NOT NULL AND topic_category IS NOT NULL
       GROUP BY event_quarter, topic_category ORDER BY event_quarter DESC, count DESC LIMIT 40`
    );
    const topQuestions = await rawQuery(
      `SELECT question_text, question_topic, topic_category, difficulty_score, company_name, sector, event_quarter, investor_firm
       FROM investor_questions WHERE difficulty_score IS NOT NULL ORDER BY difficulty_score DESC LIMIT 10`
    );
    return { bySector, byTopic, byQuarter, topQuestions };
  }),

  getAvoidanceInsights: publicProcedure.query(async () => {
    const flagged = await rawQuery(
      `SELECT question_text, response_text, question_topic, topic_category, avoidance_score, avoidance_reason,
              difficulty_score, company_name, sector, event_quarter, investor_firm, created_at
       FROM investor_questions WHERE avoidance_detected = 1 ORDER BY avoidance_score DESC LIMIT 20`
    );
    const byTopic = await rawQuery(
      `SELECT topic_category, COUNT(*) as total, COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided,
              ROUND(AVG(avoidance_score),1) as avg_avoidance_score
       FROM investor_questions GROUP BY topic_category ORDER BY avoided DESC`
    );
    const bySector = await rawQuery(
      `SELECT sector, COUNT(*) as total, COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided,
              ROUND(COUNT(CASE WHEN avoidance_detected=1 THEN 1 END)/COUNT(*)*100,1) as avoidance_rate
       FROM investor_questions WHERE sector IS NOT NULL GROUP BY sector ORDER BY avoidance_rate DESC LIMIT 10`
    );
    return { flagged, byTopic, bySector };
  }),

  getStats: publicProcedure.query(async () => {
    const [totals] = await rawQuery(
      `SELECT COUNT(*) as total, ROUND(AVG(difficulty_score),1) as avg_difficulty,
              COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as total_avoided,
              COUNT(DISTINCT company_name) as companies, COUNT(DISTINCT sector) as sectors,
              COUNT(DISTINCT investor_firm) as investor_firms
       FROM investor_questions`
    );
    return totals;
  }),

});
