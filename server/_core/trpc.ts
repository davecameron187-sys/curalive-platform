import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const env = (process.env.NODE_ENV || "").trim();
const bypassEnabled = (process.env.AUTH_BYPASS || "").trim() === "true";
const DEV_BYPASS = bypassEnabled && env !== "production";

const DEV_USER = {
  id: 1,
  name: "Dev Operator",
  email: "dev@curalive.local",
  role: "admin" as const
};

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    if (DEV_BYPASS) {
      return next({ ctx: { ...ctx, user: DEV_USER } });
    }
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      if (DEV_BYPASS) {
        return next({ ctx: { ...ctx, user: DEV_USER } });
      }
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * DEMO_ROADSHOW_ID — the publicly accessible demo roadshow. Procedures that accept a
 * `roadshowId` input use `demoAwarePublicProcedure` so the demo is always accessible
 * without login, while all other roadshows remain protected.
 */
export const DEMO_ROADSHOW_ID = "aggreko-series-b-2026";

/**
 * operatorProcedure — requires the caller to be logged in AND have role 'operator' or 'admin'.
 * Use this for all OCC mutations that modify conference or participant state.
 */
export const operatorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      if (DEV_BYPASS) {
        return next({ ctx: { ...ctx, user: DEV_USER } });
      }
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role !== 'operator' && ctx.user.role !== 'admin') {
      if (DEV_BYPASS) {
        return next({ ctx: { ...ctx, user: DEV_USER } });
      }
      throw new TRPCError({ code: "FORBIDDEN", message: 'Operator or admin role required (10003)' });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
