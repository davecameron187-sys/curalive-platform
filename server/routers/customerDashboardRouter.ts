// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { rawSql } from "../db";

const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "customer") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Customer access required",
    });
  }
  return next({ ctx });
});

export const customerDashboardRouter = router({
  getSessions: customerProcedure
    .query(async ({ ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const [rows] = await rawSql(
          `SELECT id, session_id, client_name, event_name, event_type, status, created_at, ably_channel
           FROM shadow_sessions
           WHERE org_id = $1
           ORDER BY created_at DESC
           LIMIT 50`,
          [orgId]
        );
        return rows as any[];
      } catch {
        return [];
      }
    }),
  getSuppressionStats: customerProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const [rows] = await rawSql(
          `SELECT
            COUNT(*) AS total_assessed,
            COUNT(*) FILTER (WHERE gd.decision = 'authorised') AS total_surfaced
           FROM governance_decisions gd
           JOIN intelligence_feed f ON f.id = gd.intelligence_feed_id
           JOIN shadow_sessions s ON s.id = replace(f.session_id, 'shadow-', '')::integer
           WHERE f.session_id = $1
           AND s.org_id = $2`,
          [input.sessionId, orgId]
        );
        const row = rows?.[0];
        const totalAssessed = parseInt(row?.total_assessed ?? '0', 10);
        const totalSurfaced = parseInt(row?.total_surfaced ?? '0', 10);
        return { totalAssessed, totalSurfaced, totalSuppressed: totalAssessed - totalSurfaced };
      } catch {
        return { totalAssessed: 0, totalSurfaced: 0, totalSuppressed: 0 };
      }
    }),
  getFeed: customerProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const [rows] = await rawSql(
          `SELECT f.id, f.session_id, f.feed_type, f.severity, f.title, f.body, f.pipeline, f.created_at
           FROM intelligence_feed f
           JOIN shadow_sessions s ON s.id = replace(f.session_id, 'shadow-', '')::integer
           WHERE f.session_id = $1
           AND s.org_id = $2
           ORDER BY f.created_at ASC
           LIMIT 100`,
          [input.sessionId, orgId]
        );
        return rows as any[];
      } catch {
        return [];
      }
    }),
  getGovernance: customerProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const [rows] = await rawSql(
          `SELECT g.id, g.session_id, g.decision_type, g.decision, g.confidence_score, g.reasoning, g.decided_at
           FROM governance_decisions g
           JOIN shadow_sessions s ON s.session_id::text = g.session_id
           WHERE g.session_id = $1
           AND s.org_id = $2
           ORDER BY g.decided_at ASC
           LIMIT 100`,
          [input.sessionId, orgId]
        );
        return rows as any[];
      } catch {
        return [];
      }
    }),
  recordAction: customerProcedure
    .input(z.object({
      sessionId: z.number(),
      targetType: z.string(),
      targetId: z.number(),
      actionType: z.enum(["acknowledge", "follow_up"]),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const userId = ctx.user?.id ?? 0;
        await rawSql(
          `INSERT INTO customer_actions (org_id, user_id, session_id, action_type, target_type, target_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orgId, userId, input.sessionId, input.actionType, input.targetType, input.targetId]
        );
        return { success: true };
      } catch (err) {
        return { success: false };
      }
    }),
});
