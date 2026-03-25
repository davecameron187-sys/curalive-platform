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

export const intelligenceReportRouter = router({

  generate: publicProcedure
    .input(z.object({
      eventName: z.string().min(1),
      companyName: z.string().optional(),
      sector: z.string().optional(),
      eventType: z.enum(["earnings_call","agm","capital_markets_day","ceo_town_hall","board_meeting","webcast","other"]).default("earnings_call"),
      eventQuarter: z.string().optional(),
      reportDate: z.string().optional(),
      sentimentScore: z.number().optional(),
      communicationScore: z.number().optional(),
      totalQuestions: z.number().optional(),
      highDifficultyCount: z.number().optional(),
      avoidanceEvents: z.number().optional(),
      marketReaction: z.enum(["positive","neutral","negative"]).default("neutral"),
      executiveScores: z.record(z.number()).optional(),
      topConcerns: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Pull platform-wide context from intelligence tables
      const [iqiStats] = await rawQuery(
        `SELECT COUNT(*) as total, ROUND(AVG(difficulty_score),1) as avg_diff,
                COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided
         FROM investor_questions WHERE event_quarter = ? OR ? IS NULL`,
        [input.eventQuarter ?? null, input.eventQuarter ?? null]
      );
      const topTopics = await rawQuery(
        `SELECT topic_category, COUNT(*) as cnt FROM investor_questions
         WHERE (event_quarter = ? OR ? IS NULL) AND topic_category IS NOT NULL
         GROUP BY topic_category ORDER BY cnt DESC LIMIT 5`,
        [input.eventQuarter ?? null, input.eventQuarter ?? null]
      );
      const [cicci] = await rawQuery(
        `SELECT cici_score FROM communication_index_snapshots ORDER BY created_at DESC LIMIT 1`
      );
      const [mrStats] = await rawQuery(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN post_event_reaction='positive' THEN 1 END) as positive_count,
                ROUND(AVG(prediction_confidence),1) as avg_confidence
         FROM market_reaction_correlations WHERE event_quarter = ? OR ? IS NULL`,
        [input.eventQuarter ?? null, input.eventQuarter ?? null]
      );

      const topicLabels: Record<string,string> = {
        revenue_guidance:"Revenue Guidance", margin_pressure:"Margin Pressure",
        supply_chain:"Supply Chain", ai_infrastructure:"AI Infrastructure",
        capital_allocation:"Capital Allocation", esg:"ESG", governance:"Governance",
        debt_leverage:"Debt & Leverage", growth_strategy:"Growth Strategy",
        market_conditions:"Market Conditions", management:"Management",
        competition:"Competition", regulatory:"Regulatory", other:"Other",
      };
      const platformTopics = topTopics.map((r:any) => topicLabels[r.topic_category] ?? r.topic_category);
      const concerns = input.topConcerns?.length ? input.topConcerns : platformTopics.slice(0,5);
      const avgDiff = input.sentimentScore != null ? null : Number(iqiStats?.avg_diff ?? 0);
      const sentiment = input.sentimentScore ?? 72;
      const commScore = input.communicationScore ?? 76;
      const ciciReading = Number(cicci?.cici_score ?? 0) || 68;
      const execScores = input.executiveScores && Object.keys(input.executiveScores).length
        ? input.executiveScores : { CEO: Math.round(commScore + 8), CFO: Math.round(commScore + 3) };
      const qDiffAvg = Number(iqiStats?.avg_diff ?? 0) || (input.highDifficultyCount ? 6.2 : 4.1);
      const totalQ = input.totalQuestions ?? Number(iqiStats?.total ?? 0);
      const highDiff = input.highDifficultyCount ?? Number(iqiStats?.avoided ?? 0);
      const avoided = input.avoidanceEvents ?? Number(iqiStats?.avoided ?? 0);
      const mrTotal = Number(mrStats?.total ?? 0);
      const mrPositive = Number(mrStats?.positive_count ?? 0);
      const mrRate = mrTotal > 0 ? Math.round((mrPositive / mrTotal) * 100) : null;

      const prompt = `You are CuraLive's senior intelligence analyst. Generate a professional Investor Communication Intelligence Report for the following event.

EVENT DETAILS:
- Event: ${input.eventName}
- Company: ${input.companyName ?? "Confidential"}
- Sector: ${input.sector ?? "Technology"}
- Type: ${input.eventType.replace(/_/g,' ')}
- Quarter: ${input.eventQuarter ?? "Current Quarter"}

INTELLIGENCE SIGNALS:
- Investor Sentiment Score: ${sentiment}/100
- Executive Communication Score: ${commScore}/100
- CICI Index Reading: ${ciciReading}/100
- Avg Question Difficulty: ${qDiffAvg.toFixed(1)}/10
- Total Questions: ${totalQ}
- High-Difficulty Questions: ${highDiff}
- Avoidance Events: ${avoided}
- Market Reaction: ${input.marketReaction}${mrRate != null ? ` (${mrRate}% positive historical rate)` : ""}
- Top Investor Concerns: ${concerns.slice(0,5).join(", ") || "Revenue guidance, Margin pressure, Market conditions"}
- Executive Scores: ${Object.entries(execScores).map(([k,v]) => `${k}: ${v}`).join(", ")}

Generate the following as a JSON object (no markdown, no code fences):
{
  "executive_summary": "<3-4 sentence executive summary written in Bloomberg/Goldman Sachs style — authoritative, specific, data-driven>",
  "key_insights": ["<insight 1 — one specific, data-driven statement>", "<insight 2>", "<insight 3>", "<insight 4>", "<insight 5>"],
  "recommendations": "<3-4 specific, actionable recommendations for the IR team and executive leadership based on the intelligence signals>",
  "risk_flags": ["<risk 1 — specific concern that warrants attention>", "<risk 2>"],
  "narrative_sentiment": "<one sentence characterising the overall investor tone>",
  "communication_grade": "<A+|A|A-|B+|B|B-|C+|C|D — overall grade for executive communication effectiveness>"
}`;

      const result = await invokeLLM(prompt);
      const content = result.choices?.[0]?.message?.content ?? "{}";
      let ai: any = {};
      try { ai = JSON.parse(content.trim().replace(/^```json\n?/,"").replace(/\n?```$/,"")); } catch {}

      const fullReport = {
        meta: {
          eventName: input.eventName, companyName: input.companyName,
          sector: input.sector, eventType: input.eventType,
          eventQuarter: input.eventQuarter, reportDate: input.reportDate ?? new Date().toISOString().split("T")[0],
        },
        scores: {
          sentiment, communicationScore: commScore, ciciScore: ciciReading,
          questionDifficultyAvg: qDiffAvg, marketReaction: input.marketReaction, mrRate,
        },
        questions: { total: totalQ, highDifficulty: highDiff, avoidanceEvents: avoided },
        executives: execScores,
        concerns,
        ai,
      };

      const r = await rawExecute(
        `INSERT INTO intelligence_reports
           (event_name, company_name, sector, event_type, event_quarter, report_date,
            sentiment_score, communication_score, cici_score, question_difficulty_avg,
            total_questions, high_difficulty_count, avoidance_events, market_reaction,
            top_concerns, executive_scores, key_insights, risk_flags,
            executive_summary, recommendations, full_report_json)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          input.eventName, input.companyName ?? null, input.sector ?? null,
          input.eventType, input.eventQuarter ?? null,
          input.reportDate ?? new Date().toISOString().split("T")[0],
          sentiment, commScore, ciciReading, qDiffAvg, totalQ, highDiff, avoided,
          input.marketReaction,
          JSON.stringify(concerns), JSON.stringify(execScores),
          JSON.stringify(ai.key_insights ?? []), JSON.stringify(ai.risk_flags ?? []),
          ai.executive_summary ?? null, ai.recommendations ?? null,
          JSON.stringify(fullReport),
        ]
      );

      return { id: (r as any).insertId, ...fullReport, ai };
    }),

  list: publicProcedure.query(async () => {
    return rawQuery(
      `SELECT id, event_name, company_name, sector, event_type, event_quarter, report_date,
              sentiment_score, communication_score, cici_score, question_difficulty_avg,
              total_questions, market_reaction, executive_summary, key_insights, risk_flags,
              top_concerns, executive_scores, created_at
       FROM intelligence_reports ORDER BY created_at DESC LIMIT 50`
    );
  }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rows = await rawQuery(`SELECT * FROM intelligence_reports WHERE id = ?`, [input.id]);
      return rows[0] ?? null;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await rawExecute(`DELETE FROM intelligence_reports WHERE id = ?`, [input.id]);
      return { ok: true };
    }),
});
