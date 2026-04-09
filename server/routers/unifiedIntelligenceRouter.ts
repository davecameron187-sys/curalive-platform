import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getSessionIntelligence, getOrgIntelligence } from "../services/UnifiedIntelligenceService";

export const unifiedIntelligenceRouter = router({
  getSessionIntelligence: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getSessionIntelligence(input.sessionId);
      } catch (e) {
        console.error("[UnifiedIntel Router] Session intel failed:", e);
        throw e;
      }
    }),

  getOrgIntelligence: protectedProcedure
    .input(z.object({ organisationId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getOrgIntelligence(input.organisationId);
      } catch (e) {
        console.error("[UnifiedIntel Router] Org intel failed:", e);
        throw e;
      }
    }),
});
