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
  revenue_guidance: "Revenue Guidance", margin_pressure: "Margin Pressure",
  supply_chain: "Supply Chain", ai_infrastructure: "AI Infrastructure",
  capital_allocation: "Capital Allocation", esg: "ESG", governance: "Governance",
  debt_leverage: "Debt & Leverage", growth_strategy: "Growth Strategy",
  market_conditions: "Market Conditions", management: "Management",
  competition: "Competition", regulatory: "Regulatory", other: "Other",
};

export const callPrepRouter = router({

  generate: publicProcedure
    .input(z.object({
      eventName: z.string().min(1),
      companyName: z.string().optional(),
      sector: z.string().optional(),
      eventType: z.enum(["earnings_call","agm","capital_markets_day","ceo_town_hall","board_meeting","webcast","other"]).default("earnings_call"),
      eventQuarter: z.string().optional(),
      keyAnnouncements: z.string().optional(),
      financialPerformance: z.enum(["strong","positive","mixed","challenging","difficult"]).default("mixed"),
      knownSensitivities: z.string().optional(),
    }))
    .mutation(async ({ input }) => {

      // Pull sector-specific IQI intelligence
      const sectorTopics = await rawQuery(
        `SELECT topic_category, COUNT(*) as cnt,
                ROUND(AVG(difficulty_score),1) as avg_diff,
                COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided
         FROM investor_questions
         WHERE (sector = ? OR ? IS NULL) AND topic_category IS NOT NULL
         GROUP BY topic_category ORDER BY cnt DESC LIMIT 8`,
        [input.sector ?? null, input.sector ?? null]
      );

      // Hardest questions in this sector
      const hardestQs = await rawQuery(
        `SELECT question_text, topic_category, difficulty_score, avoidance_detected, avoidance_reason
         FROM investor_questions
         WHERE (sector = ? OR ? IS NULL) AND difficulty_score IS NOT NULL
         ORDER BY difficulty_score DESC LIMIT 5`,
        [input.sector ?? null, input.sector ?? null]
      );

      // Market reaction data for sector
      const mrContext = await rawQuery(
        `SELECT event_type, post_event_reaction,
                ROUND(AVG(prediction_confidence),1) as avg_confidence,
                COUNT(*) as cnt
         FROM market_reaction_correlations
         WHERE (sector = ? OR ? IS NULL)
         GROUP BY event_type, post_event_reaction ORDER BY cnt DESC LIMIT 6`,
        [input.sector ?? null, input.sector ?? null]
      );

      // Avoidance-prone topics in sector
      const avoidanceTopics = await rawQuery(
        `SELECT topic_category,
                COUNT(CASE WHEN avoidance_detected=1 THEN 1 END) as avoided,
                COUNT(*) as total,
                ROUND(AVG(avoidance_score),1) as avg_score
         FROM investor_questions
         WHERE (sector = ? OR ? IS NULL) AND topic_category IS NOT NULL
         GROUP BY topic_category
         HAVING avoided > 0
         ORDER BY avg_score DESC LIMIT 5`,
        [input.sector ?? null, input.sector ?? null]
      );

      // CICI latest reading
      const [latestCici] = await rawQuery(
        `SELECT cici_score FROM communication_index_snapshots ORDER BY created_at DESC LIMIT 1`
      );

      // Build context strings
      const topicContext = sectorTopics.map((r: any) =>
        `${TOPIC_LABELS[r.topic_category] ?? r.topic_category}: ${r.cnt} questions, avg difficulty ${r.avg_diff}/10, ${r.avoided} avoidance events`
      ).join("\n");

      const hardQContext = hardestQs.map((r: any) =>
        `[Difficulty ${r.difficulty_score}/10] "${r.question_text}"${r.avoidance_detected ? ` (avoidance: ${r.avoidance_reason})` : ""}`
      ).join("\n");

      const avoidContext = avoidanceTopics.map((r: any) =>
        `${TOPIC_LABELS[r.topic_category] ?? r.topic_category}: ${r.avoided}/${r.total} questions avoided, avg avoidance score ${r.avg_score}/10`
      ).join("\n");

      const mrContextStr = mrContext.map((r: any) =>
        `${r.event_type?.replace(/_/g," ")}: ${r.post_event_reaction} reaction (${r.cnt} events, ${r.avg_confidence}% confidence)`
      ).join("\n");

      const prompt = `You are CuraLive's senior pre-event intelligence analyst. Generate a comprehensive earnings call preparation briefing for an IR team and executive leadership.

EVENT:
- Name: ${input.eventName}
- Company: ${input.companyName ?? "Confidential"}
- Sector: ${input.sector ?? "Technology"}
- Type: ${input.eventType.replace(/_/g," ")}
- Quarter: ${input.eventQuarter ?? "Upcoming"}
- Financial Performance: ${input.financialPerformance}
${input.keyAnnouncements ? `- Key Announcements: ${input.keyAnnouncements}` : ""}
${input.knownSensitivities ? `- Known Sensitivities: ${input.knownSensitivities}` : ""}

PLATFORM INTELLIGENCE (from CuraLive dataset):
Top Investor Topics in ${input.sector ?? "this sector"}:
${topicContext || "Insufficient data — general forecast applied"}

Hardest Questions from Similar Events:
${hardQContext || "No comparable events in dataset yet"}

High-Avoidance Risk Topics:
${avoidContext || "No avoidance patterns detected"}

Market Reaction Context:
${mrContextStr || "No market data available"}

CICI Index: ${latestCici?.cici_score ? Math.round(Number(latestCici.cici_score)) : "N/A"}/100

Generate the following JSON (no markdown, no code fences):
{
  "executive_briefing": "<3-4 sentence pre-event intelligence summary — written for a CEO and CFO, not an analyst. Authoritative tone.>",
  "difficulty_forecast": <float 1-10 — predicted average Q&A difficulty for this event based on sector and financial context>,
  "predicted_questions": [
    {
      "question": "<realistic investor question, written exactly as an analyst would ask it>",
      "topic": "<topic label>",
      "topic_category": "<one of the 14 categories>",
      "difficulty": <float 1-10>,
      "rationale": "<one sentence: why this question is likely>",
      "suggested_response_approach": "<one sentence: how executives should approach answering>"
    }
  ],
  "top_concerns": ["<concern 1>", "<concern 2>", "<concern 3>", "<concern 4>", "<concern 5>"],
  "risk_areas": [
    {
      "topic": "<topic name>",
      "risk_level": "<high|medium|low>",
      "description": "<one sentence describing why this is a risk>",
      "talking_points": ["<talking point 1>", "<talking point 2>", "<talking point 3>"]
    }
  ],
  "communication_tips": [
    "<specific, actionable communication tip for the executive team — not generic>",
    "<tip 2>",
    "<tip 3>",
    "<tip 4>"
  ]
}

Generate exactly 6 predicted questions and 3 risk areas. Make the questions realistic, specific, and pressure-appropriate for the financial context provided.`;

      const result = await invokeLLM(prompt);
      const content = result.choices?.[0]?.message?.content ?? "{}";
      let ai: any = {};
      try {
        ai = JSON.parse(content.trim().replace(/^```json\n?/, "").replace(/\n?```$/, ""));
      } catch {}

      const fullBriefing = {
        meta: {
          eventName: input.eventName, companyName: input.companyName,
          sector: input.sector, eventType: input.eventType,
          eventQuarter: input.eventQuarter, financialPerformance: input.financialPerformance,
          keyAnnouncements: input.keyAnnouncements, knownSensitivities: input.knownSensitivities,
          generatedAt: new Date().toISOString(),
        },
        ai,
        platformContext: {
          sectorTopics: sectorTopics.length,
          hardestQsCount: hardestQs.length,
          avoidanceTopicsCount: avoidanceTopics.length,
        },
      };

      const r = await rawExecute(
        `INSERT INTO call_preparations
           (event_name, company_name, sector, event_type, event_quarter,
            key_announcements, financial_performance, known_sensitivities,
            difficulty_forecast, predicted_questions, top_concerns, risk_areas,
            communication_tips, executive_briefing, full_briefing_json)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          input.eventName, input.companyName ?? null, input.sector ?? null,
          input.eventType, input.eventQuarter ?? null,
          input.keyAnnouncements ?? null, input.financialPerformance,
          input.knownSensitivities ?? null,
          ai.difficulty_forecast ?? null,
          JSON.stringify(ai.predicted_questions ?? []),
          JSON.stringify(ai.top_concerns ?? []),
          JSON.stringify(ai.risk_areas ?? []),
          JSON.stringify(ai.communication_tips ?? []),
          ai.executive_briefing ?? null,
          JSON.stringify(fullBriefing),
        ]
      );

      return { id: (r as any).insertId, ...fullBriefing };
    }),

  list: publicProcedure.query(async () => {
    return rawQuery(
      `SELECT id, event_name, company_name, sector, event_type, event_quarter,
              financial_performance, difficulty_forecast, top_concerns,
              executive_briefing, risk_areas, created_at
       FROM call_preparations ORDER BY created_at DESC LIMIT 50`
    );
  }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rows = await rawQuery(`SELECT * FROM call_preparations WHERE id = ?`, [input.id]);
      return rows[0] ?? null;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await rawExecute(`DELETE FROM call_preparations WHERE id = ?`, [input.id]);
      return { ok: true };
    }),
});
