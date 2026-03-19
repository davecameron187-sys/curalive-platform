// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { crisisPredictions } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export async function analyzeCrisisRisk(
  transcript: string,
  clientName: string,
  eventName: string,
  eventType: string,
  sentimentTrajectory: number[],
  sessionId?: number
) {
  const db = await getDb();

  const trendDirection = sentimentTrajectory.length >= 3
    ? sentimentTrajectory[sentimentTrajectory.length - 1] - sentimentTrajectory[0]
    : 0;

  const resp = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are CuraLive's Crisis Prediction Engine. Analyse communication signals to predict emerging crises BEFORE they manifest publicly.

Evaluate these risk dimensions:
1. Sentiment trajectory — declining sentiment across multiple speakers indicates building tension
2. Compliance language — increased use of hedging, forward-looking disclaimers, or evasive answers
3. Financial stress indicators — references to liquidity, covenant breaches, write-downs, going concern
4. Stakeholder conflict signals — disagreement between management/board, analyst hostility
5. Regulatory exposure — mentions of investigations, fines, regulatory actions
6. Reputational risk — social media backlash, media scrutiny, whistleblower references

Return ONLY valid JSON:
{
  "riskLevel": "low|moderate|elevated|high|critical",
  "riskScore": <0-100>,
  "predictedCrisisType": "financial|operational|reputational|regulatory|environmental|none",
  "indicators": [{"signal": "description", "severity": "low|medium|high", "source": "quote or reference"}],
  "holdingStatement": "Draft holding statement if risk is elevated or above, null otherwise",
  "regulatoryChecklist": ["Action item 1", "Action item 2"],
  "earlyWarnings": ["Warning 1", "Warning 2"],
  "recommendedActions": ["Action 1", "Action 2"]
}`
      },
      {
        role: "user",
        content: `Event: "${eventName}" by ${clientName} (${eventType})
Sentiment trajectory: [${sentimentTrajectory.join(", ")}] (delta: ${trendDirection > 0 ? "+" : ""}${trendDirection.toFixed(1)})

Transcript excerpt (last 4000 chars):
${transcript.slice(-4000)}`
      },
    ],
    model: "gpt-4o",
  });

  const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const analysis = JSON.parse(cleaned);

  const eventId = sessionId ? `shadow-${sessionId}` : `analysis-${Date.now()}`;

  await db.insert(crisisPredictions).values({
    sessionId: sessionId ?? null,
    eventId,
    clientName,
    eventName,
    riskLevel: analysis.riskLevel ?? "low",
    riskScore: analysis.riskScore ?? 0,
    predictedCrisisType: analysis.predictedCrisisType ?? "none",
    indicators: analysis.indicators ?? [],
    sentimentTrajectory,
    holdingStatement: analysis.holdingStatement ?? null,
    regulatoryChecklist: analysis.regulatoryChecklist ?? [],
    alertSent: (analysis.riskScore ?? 0) >= 60,
  });

  return analysis;
}

export const crisisPredictionRouter = router({
  analyze: publicProcedure
    .input(z.object({
      transcript: z.string(),
      clientName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      sentimentTrajectory: z.array(z.number()),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return analyzeCrisisRisk(
        input.transcript, input.clientName, input.eventName,
        input.eventType, input.sentimentTrajectory, input.sessionId
      );
    }),

  list: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(crisisPredictions).orderBy(desc(crisisPredictions.createdAt)).limit(50);
  }),

  getBySession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [prediction] = await db.select().from(crisisPredictions)
        .where(eq(crisisPredictions.sessionId, input.sessionId)).limit(1);
      return prediction ?? null;
    }),
});
