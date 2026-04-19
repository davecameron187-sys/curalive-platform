import { router, operatorProcedure } from "../trpc";

export const liveQaRouter = router({
  _placeholder: operatorProcedure.query(() => ({ status: "stub — restore liveQaRouter" })),
});
