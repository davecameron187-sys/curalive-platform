/**
 * Main tRPC App Router
 * Aggregates all feature routers (auth, system, liveQa, etc.)
 */

import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./_core/authRouter";
import { liveQaRouter } from "./routers/liveQa";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  liveQa: liveQaRouter,
});

export type AppRouter = typeof appRouter;
