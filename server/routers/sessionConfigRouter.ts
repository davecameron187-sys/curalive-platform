import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql } from "../db";

export const sessionConfigRouter = router({
  getSessionConfig: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT id, tier, partner_id, recipients, scheduled_at, company, event_name, event_type,
                pre_brief_sent_at, live_links_sent_at, report_links_sent_at
         FROM shadow_sessions WHERE id = $1`,
        [input.sessionId]
      );
      if (rows.length === 0) return null;
      const s = rows[0];
      return {
        ...s,
        recipients: s.recipients ? (typeof s.recipients === "string" ? JSON.parse(s.recipients) : s.recipients) : [],
      };
    }),

  updateSessionConfig: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      tier: z.enum(["essential", "intelligence", "enterprise", "agm"]).optional(),
      partnerId: z.number().int().nullable().optional(),
      recipients: z.array(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.string().optional(),
        sendLive: z.boolean().optional().default(true),
        sendReport: z.boolean().optional().default(true),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.tier !== undefined) {
        updates.push(`tier = $${idx++}`);
        params.push(input.tier);
      }
      if (input.partnerId !== undefined) {
        updates.push(`partner_id = $${idx++}`);
        params.push(input.partnerId);
      }
      if (input.recipients !== undefined) {
        updates.push(`recipients = $${idx++}`);
        params.push(JSON.stringify(input.recipients));
      }

      if (updates.length === 0) return { success: true };
      params.push(input.sessionId);

      await rawSql(
        `UPDATE shadow_sessions SET ${updates.join(", ")} WHERE id = $${idx}`,
        params
      );
      return { success: true };
    }),

  runReadinessCheck: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input }) => {
      const checks = [];

      const [session] = await rawSql(`SELECT * FROM shadow_sessions WHERE id = $1`, [input.sessionId]);
      const s = session[0];

      checks.push({
        name: "Database Connection",
        passed: !!s,
        detail: s ? "Connected" : "Session not found",
      });

      checks.push({
        name: "Recall.ai API Key",
        passed: !!process.env.RECALL_AI_API_KEY,
        detail: process.env.RECALL_AI_API_KEY ? "Configured" : "Not set",
      });

      checks.push({
        name: "Ably Real-time",
        passed: !!process.env.ABLY_API_KEY,
        detail: process.env.ABLY_API_KEY ? "Configured" : "Not set",
      });

      checks.push({
        name: "OpenAI API Key",
        passed: !!process.env.OPENAI_API_KEY,
        detail: process.env.OPENAI_API_KEY ? "Configured" : "Not set",
      });

      const recipients = s?.recipients
        ? (typeof s.recipients === "string" ? JSON.parse(s.recipients) : s.recipients)
        : [];
      checks.push({
        name: "Recipients Configured",
        passed: recipients.length > 0,
        detail: recipients.length > 0 ? `${recipients.length} recipients` : "No recipients configured",
      });

      checks.push({
        name: "Intelligence Tier",
        passed: !!s?.tier,
        detail: s?.tier ? `Tier: ${s.tier}` : "No tier selected",
      });

      for (const check of checks) {
        await rawSql(
          `INSERT INTO session_readiness_checks (session_id, check_name, passed, detail)
           VALUES ($1, $2, $3, $4)`,
          [input.sessionId, check.name, check.passed, check.detail]
        );
      }

      return { checks, allPassed: checks.every(c => c.passed) };
    }),

  scheduleSession: operatorProcedure
    .input(z.object({
      eventName: z.string(),
      company: z.string().optional(),
      eventType: z.string().optional(),
      scheduledAt: z.string(),
      tier: z.string().optional(),
      partnerId: z.number().int().optional(),
      recipients: z.array(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.string().optional(),
      })).optional(),
      meetingUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [rows] = await rawSql(
        `INSERT INTO scheduled_sessions (event_name, company, event_type, scheduled_at, tier, partner_id, recipients, meeting_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          input.eventName,
          input.company || null,
          input.eventType || "earnings_call",
          input.scheduledAt,
          input.tier || "essential",
          input.partnerId || null,
          JSON.stringify(input.recipients || []),
          input.meetingUrl || null,
          ctx.user?.id || null,
        ]
      );
      return { success: true, id: (rows as any)?.insertId || rows[0]?.id };
    }),

  getScheduledSessions: operatorProcedure.query(async () => {
    const [rows] = await rawSql(
      `SELECT * FROM scheduled_sessions WHERE scheduled_at > NOW() ORDER BY scheduled_at ASC LIMIT 50`,
      []
    );
    return rows;
  }),
});
