import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { preEventIntelligenceBriefings, analystConsensusData, predictedQaItems, complianceHotspots, readinessScores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export const preEventIntelligenceRouter = router({
  getOrCreateBriefing: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const existing = await db.select().from(preEventIntelligenceBriefings).where(eq(preEventIntelligenceBriefings.sessionId, input.sessionId)).limit(1);
      if (existing.length > 0) return existing[0];

      const [created] = await db.insert(preEventIntelligenceBriefings).values({
        sessionId: input.sessionId,
        eventId: 0,
      }).returning();
      return created;
    }),

  getAnalystConsensus: protectedProcedure
    .input(z.object({ briefingId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(analystConsensusData).where(eq(analystConsensusData.briefingId, input.briefingId));
    }),

  getPredictedQa: protectedProcedure
    .input(z.object({ briefingId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(predictedQaItems).where(eq(predictedQaItems.briefingId, input.briefingId));
    }),

  getComplianceHotspots: protectedProcedure
    .input(z.object({ briefingId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(complianceHotspots).where(eq(complianceHotspots.briefingId, input.briefingId));
    }),

  getReadinessScores: protectedProcedure
    .input(z.object({ briefingId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(readinessScores).where(eq(readinessScores.briefingId, input.briefingId));
    }),

  addPredictedQa: protectedProcedure
    .input(z.object({
      briefingId: z.number(),
      topic: z.string(),
      predictedQuestion: z.string(),
      suggestedAnswer: z.string(),
      probability: z.number(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [created] = await db.insert(predictedQaItems).values({
        briefingId: input.briefingId,
        topic: input.topic,
        predictedQuestion: input.predictedQuestion,
        suggestedAnswer: input.suggestedAnswer,
        probability: input.probability,
        riskLevel: input.riskLevel,
      }).returning();
      return created;
    }),

  generateFullBriefing: protectedProcedure
    .input(z.object({ briefingId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const briefing = await db.select().from(preEventIntelligenceBriefings).where(eq(preEventIntelligenceBriefings.id, input.briefingId)).limit(1);
      const consensus = await db.select().from(analystConsensusData).where(eq(analystConsensusData.briefingId, input.briefingId));
      const qa = await db.select().from(predictedQaItems).where(eq(predictedQaItems.briefingId, input.briefingId));
      const hotspotsList = await db.select().from(complianceHotspots).where(eq(complianceHotspots.briefingId, input.briefingId));
      const scoresList = await db.select().from(readinessScores).where(eq(readinessScores.briefingId, input.briefingId));

      return {
        briefing: briefing[0] ?? null,
        analystConsensus: consensus,
        predictedQa: qa,
        complianceHotspots: hotspotsList,
        readinessScores: scoresList,
      };
    }),
});
