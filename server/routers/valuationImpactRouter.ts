// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { valuationImpacts } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export async function analyzeValuationImpact(
  transcript: string,
  clientName: string,
  eventName: string,
  eventType: string,
  sentimentAvg: number,
  eventId: string
) {
  const db = await getDb();

  const resp = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are CuraLive's Valuation Impact Oracle (Module 24). Analyse corporate communications to predict their effect on company valuation.

Model these dimensions:
1. Material disclosures — revenue surprises, guidance changes, M&A announcements, write-downs
2. Forward-looking statements — guidance raised/lowered/maintained, new targets
3. Risk factor changes — new risks disclosed, existing risks escalated/de-escalated
4. Market sentiment signals — analyst tone, Q&A hostility, management confidence
5. Peer comparison — relative positioning vs competitors
6. Regulatory impact — compliance changes that could affect operations/costs

Return ONLY valid JSON:
{
  "priorSentiment": <estimated pre-event sentiment 0-100>,
  "postSentiment": <post-event sentiment based on communication 0-100>,
  "sentimentDelta": <change>,
  "predictedShareImpact": "+X.X%|-X.X%|neutral",
  "fairValueGap": "undervalued|fairly_valued|overvalued|insufficient_data",
  "materialDisclosures": [{"disclosure": "description", "impact": "positive|negative|neutral", "magnitude": "minor|moderate|significant|material"}],
  "riskFactors": [{"factor": "name", "direction": "increased|decreased|new|unchanged", "valuation_effect": "description"}],
  "analystConsensusImpact": "beat|meet|miss|insufficient_data",
  "marketReactionPrediction": "2-3 sentence prediction of likely market reaction"
}`
      },
      {
        role: "user",
        content: `Event: "${eventName}" by ${clientName} (${eventType})
Current sentiment score: ${sentimentAvg}/100

Transcript (first 6000 chars):
${transcript.slice(0, 6000)}`
      },
    ],
    model: "gpt-4o",
  });

  const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const analysis = JSON.parse(cleaned);

  await db.insert(valuationImpacts).values({
    eventId,
    clientName,
    eventName,
    priorSentiment: analysis.priorSentiment ?? null,
    postSentiment: analysis.postSentiment ?? null,
    sentimentDelta: analysis.sentimentDelta ?? null,
    predictedShareImpact: analysis.predictedShareImpact ?? "neutral",
    fairValueGap: analysis.fairValueGap ?? "insufficient_data",
    materialDisclosures: analysis.materialDisclosures ?? [],
    riskFactors: analysis.riskFactors ?? [],
    analystConsensusImpact: analysis.analystConsensusImpact ?? "insufficient_data",
    marketReactionPrediction: analysis.marketReactionPrediction ?? null,
  });

  return analysis;
}

export const valuationImpactRouter = router({
  analyze: publicProcedure
    .input(z.object({
      transcript: z.string(),
      clientName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      sentimentAvg: z.number(),
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return analyzeValuationImpact(
        input.transcript, input.clientName, input.eventName,
        input.eventType, input.sentimentAvg, input.eventId
      );
    }),

  list: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(valuationImpacts).orderBy(desc(valuationImpacts.createdAt)).limit(50);
  }),

  getByEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [impact] = await db.select().from(valuationImpacts)
        .where(eq(valuationImpacts.eventId, input.eventId)).limit(1);
      return impact ?? null;
    }),
});
