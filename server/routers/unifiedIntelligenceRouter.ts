import { z } from "zod";
import { router, operatorProcedure } from "../_core/trpc";
import { getSessionIntelligence, getOrgIntelligence } from "../services/UnifiedIntelligenceService";
import { seedDemoData } from "../scripts/seedDemoData";

export const unifiedIntelligenceRouter = router({
  getSessionIntelligence: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getSessionIntelligence(input.sessionId);
      } catch (e) {
        console.error("[UnifiedIntel Router] Session intel failed:", e);
        throw e;
      }
    }),

  getOrgIntelligence: operatorProcedure
    .input(z.object({ organisationId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getOrgIntelligence(input.organisationId);
      } catch (e) {
        console.error("[UnifiedIntel Router] Org intel failed:", e);
        throw e;
      }
    }),

  seedDemoData: operatorProcedure
    .mutation(async () => {
      return await seedDemoData();
    }),
});
