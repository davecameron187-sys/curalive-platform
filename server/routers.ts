/**
 * Main tRPC App Router
 * Aggregates all feature routers (auth, system, liveQa, etc.)
 */

import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./_core/authRouter";
import { liveQaRouter } from "./routers/liveQa";
import { agiToolGeneratorRouter } from "./routers/agiToolGenerator";
import { operatorConsoleRouter } from "./routers/operatorConsole";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  liveQa: liveQaRouter,
  agiToolGenerator: agiToolGeneratorRouter,
  operatorConsole: operatorConsoleRouter,
});

export type AppRouter = typeof appRouter;
