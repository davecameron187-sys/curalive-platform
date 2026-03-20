/**
 * Main tRPC App Router
 * Aggregates all feature routers (auth, system, liveQa, etc.)
 */

import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { liveQaRouter } from "./routers/liveQa";

export const appRouter = router({
  system: systemRouter,
  liveQa: liveQaRouter,
});

export type AppRouter = typeof appRouter;
