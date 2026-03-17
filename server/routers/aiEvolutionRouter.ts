// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getEvolutionDashboard, runAccumulationEngine } from "../services/AiEvolutionService";
import { getDb } from "../db";
import { aiToolProposals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const VALID_TRANSITIONS: Record<string, string[]> = {
  emerging: ["proposed", "rejected"],
  proposed: ["approved", "rejected"],
  approved: ["building", "rejected"],
  building: ["live", "rejected"],
  live: [],
  rejected: ["emerging"],
};

export const aiEvolutionRouter = router({
  getDashboard: protectedProcedure.query(async () => {
    return getEvolutionDashboard();
  }),

  runAccumulation: protectedProcedure.mutation(async () => {
    return runAccumulationEngine();
  }),

  updateProposalStatus: protectedProcedure
    .input(z.object({
      proposalId: z.number(),
      status: z.enum(["emerging", "proposed", "approved", "building", "live", "rejected"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [existing] = await db.select().from(aiToolProposals).where(eq(aiToolProposals.id, input.proposalId)).limit(1);
      if (!existing) throw new Error("Proposal not found");

      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new Error(`Cannot transition from "${existing.status}" to "${input.status}"`);
      }

      await db.update(aiToolProposals)
        .set({ status: input.status })
        .where(eq(aiToolProposals.id, input.proposalId));
      return { success: true };
    }),
});
