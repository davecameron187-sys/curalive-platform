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
  getActionResolution: customerProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;
        const [rows] = await rawSql(
          `SELECT
            COUNT(*) FILTER (WHERE f.severity IN ('high', 'critical')) AS required_attention,
            COUNT(DISTINCT ca.target_id) FILTER (WHERE f.severity IN ('high', 'critical') AND ca.target_id IS NOT NULL) AS actioned
           FROM intelligence_feed f
           LEFT JOIN customer_actions ca ON ca.target_id = f.id
             AND ca.session_id = replace(f.session_id, 'shadow-', '')::integer
           JOIN shadow_sessions s ON s.id = CAST(replace(f.session_id, 'shadow-', '') AS integer)
           WHERE f.session_id = $1
           AND s.org_id = $2`,
          [input.sessionId, orgId]
        );
        const row = rows?.[0];
        const requiredAttention = parseInt(row?.required_attention ?? '0', 10);
        const actioned = parseInt(row?.actioned ?? '0', 10);
        return {
          requiredAttention,
          actioned,
          unresolved: requiredAttention - actioned,
        };
      } catch {
        return { requiredAttention: 0, actioned: 0, unresolved: 0 };
      }
    }),
  getDailyConfidence: customerProcedure
    .query(async ({ ctx }) => {
      try {
        const orgId = ctx.user?.orgId ?? 1;

        const [sessionRows] = await rawSql(
          `SELECT id, session_id, event_name, client_name, created_at
           FROM shadow_sessions
           WHERE org_id = $1 AND status = 'completed'
           ORDER BY created_at DESC
           LIMIT 1`,
          [orgId]
        );
        const session = sessionRows?.[0];
        if (!session) {
          return { state: 'confident', sessionId: null, sessionName: null, latestSessionAt: null, items: [] };
        }

        const feedSessionId = `shadow-${session.id}`;

        const [resRows] = await rawSql(
          `SELECT
            COUNT(*) FILTER (WHERE f.severity IN ('high', 'critical')) AS required_attention,
            COUNT(DISTINCT ca.target_id) FILTER (WHERE f.severity IN ('high', 'critical') AND ca.target_id IS NOT NULL) AS actioned,
            COUNT(*) FILTER (WHERE f.severity = 'critical') AS critical_count,
            COUNT(DISTINCT ca.target_id) FILTER (WHERE f.severity = 'critical' AND ca.target_id IS NOT NULL) AS critical_actioned
           FROM intelligence_feed f
           LEFT JOIN customer_actions ca ON ca.target_id = f.id AND ca.session_id = $2
           WHERE f.session_id = $1`,
          [feedSessionId, session.id]
        );
        const res = resRows?.[0];
        const requiredAttention = parseInt(res?.required_attention ?? '0', 10);
        const actioned = parseInt(res?.actioned ?? '0', 10);
        const criticalCount = parseInt(res?.critical_count ?? '0', 10);
        const criticalActioned = parseInt(res?.critical_actioned ?? '0', 10);
        const unresolved = requiredAttention - actioned;
        const unresolvedCritical = criticalCount - criticalActioned;

        const [itemRows] = await rawSql(
          `SELECT f.id, f.title, f.severity
           FROM intelligence_feed f
           LEFT JOIN customer_actions ca ON ca.target_id = f.id AND ca.session_id = $2
           WHERE f.session_id = $1
           AND f.severity IN ('high', 'critical')
           AND ca.target_id IS NULL
           ORDER BY CASE f.severity WHEN 'critical' THEN 0 ELSE 1 END, f.created_at DESC
           LIMIT 3`,
          [feedSessionId, session.id]
        );
        const items = (itemRows ?? []).map((r: any) => ({ id: r.id, title: r.title, severity: r.severity }));

        let state: 'confident' | 'caution' | 'not_ready' = 'confident';
        if (unresolvedCritical > 0 || unresolved >= 3) {
          state = 'not_ready';
        } else if (unresolved >= 1) {
          state = 'caution';
        }

        return {
          state,
          sessionId: session.id,
          sessionName: session.event_name,
          latestSessionAt: session.created_at,
          items,
        };
      } catch {
        return { state: 'confident', sessionId: null, sessionName: null, latestSessionAt: null, items: [] };
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
           JOIN shadow_sessions s ON s.id = CAST(replace(f.session_id, 'shadow-', '') AS integer)
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
           JOIN shadow_sessions s ON s.id = CAST(replace(f.session_id, 'shadow-', '') AS integer)
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
           JOIN shadow_sessions s ON s.id = CAST(g.session_id AS integer)
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
