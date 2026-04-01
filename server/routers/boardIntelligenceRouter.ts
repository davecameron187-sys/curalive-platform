import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { boardIntelligenceCompass, priorCommitmentAudits, directorLiabilityMaps, analystExpectationAudits, governanceCommunicationScores, boardResolutions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export const boardIntelligenceRouter = router({
  getOrCreateCompass: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const existing = await db.select().from(boardIntelligenceCompass).where(eq(boardIntelligenceCompass.sessionId, input.sessionId)).limit(1);
      if (existing.length > 0) return existing[0];

      const [created] = await db.insert(boardIntelligenceCompass).values({
        sessionId: input.sessionId,
        eventId: 0,
      }).returning();
      return created;
    }),

  getPriorCommitmentAudit: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(priorCommitmentAudits).where(eq(priorCommitmentAudits.compassId, input.compassId));
    }),

  getDirectorLiabilityMap: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(directorLiabilityMaps).where(eq(directorLiabilityMaps.compassId, input.compassId));
    }),

  getAnalystExpectationAudit: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(analystExpectationAudits).where(eq(analystExpectationAudits.compassId, input.compassId));
    }),

  getGovernanceCommunicationScore: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const results = await db.select().from(governanceCommunicationScores).where(eq(governanceCommunicationScores.compassId, input.compassId)).limit(1);
      return results[0] ?? null;
    }),

  getBoardResolutions: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return await db.select().from(boardResolutions).where(eq(boardResolutions.compassId, input.compassId));
    }),

  createBoardResolution: protectedProcedure
    .input(z.object({
      compassId: z.number(),
      actionType: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      owner: z.string(),
      dueDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [created] = await db.insert(boardResolutions).values({
        compassId: input.compassId,
        actionType: input.actionType,
        description: input.description,
        priority: input.priority,
        owner: input.owner,
        dueDate: new Date(input.dueDate),
        status: 'pending',
      }).returning();
      return created;
    }),

  updateResolutionStatus: protectedProcedure
    .input(z.object({
      resolutionId: z.number(),
      status: z.enum(['pending', 'in_progress', 'completed']),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [updated] = await db.update(boardResolutions)
        .set({ status: input.status })
        .where(eq(boardResolutions.id, input.resolutionId))
        .returning();
      return updated;
    }),

  generateBoardBriefing: protectedProcedure
    .input(z.object({ compassId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const compass = await db.select().from(boardIntelligenceCompass).where(eq(boardIntelligenceCompass.id, input.compassId)).limit(1);
      const commitments = await db.select().from(priorCommitmentAudits).where(eq(priorCommitmentAudits.compassId, input.compassId));
      const liabilities = await db.select().from(directorLiabilityMaps).where(eq(directorLiabilityMaps.compassId, input.compassId));
      const expectations = await db.select().from(analystExpectationAudits).where(eq(analystExpectationAudits.compassId, input.compassId));
      const governance = await db.select().from(governanceCommunicationScores).where(eq(governanceCommunicationScores.compassId, input.compassId)).limit(1);
      const resolutions = await db.select().from(boardResolutions).where(eq(boardResolutions.compassId, input.compassId));

      return {
        compass: compass[0] ?? null,
        priorCommitments: commitments,
        directorLiabilities: liabilities,
        analystExpectations: expectations,
        governanceScore: governance[0] ?? null,
        actionItems: resolutions,
      };
    }),
});
