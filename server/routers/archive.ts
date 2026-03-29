import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const archiveRouter = router({
  getArchivedSessions: publicProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
      search: z.string().optional().default(""),
    }))
    .query(async ({ input }) => {
      return [];
    }),
});
