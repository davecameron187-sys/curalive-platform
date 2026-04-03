import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql, getDb } from "../db";
import { sessionMarkers } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export const operationsRouter = router({
  initiateHandoff: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      toOperatorId: z.number().int().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [rows] = await rawSql(
        `INSERT INTO session_handoffs (session_id, from_operator_id, to_operator_id, reason)
         VALUES ($1, $2, $3, $4)`,
        [input.sessionId, ctx.user?.id || 0, input.toOperatorId || null, input.reason || null]
      );
      return { success: true, id: rows[0]?.id };
    }),

  acceptHandoff: operatorProcedure
    .input(z.object({ handoffId: z.number().int() }))
    .mutation(async ({ input }) => {
      await rawSql(
        `UPDATE session_handoffs SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
        [input.handoffId]
      );
      return { success: true };
    }),

  joinSessionAsOperator: operatorProcedure
    .input(z.object({ sessionId: z.number().int(), role: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await rawSql(
        `INSERT INTO session_operators (session_id, operator_id, role) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [input.sessionId, ctx.user?.id || 0, input.role || "secondary"]
      );
      return { success: true };
    }),

  leaveSession: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      await rawSql(
        `UPDATE session_operators SET left_at = NOW() WHERE session_id = $1 AND operator_id = $2 AND left_at IS NULL`,
        [input.sessionId, ctx.user?.id || 0]
      );
      return { success: true };
    }),

  getSessionOperators: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT so.*, u.name, u.email FROM session_operators so LEFT JOIN users u ON so.operator_id = u.id WHERE so.session_id = $1 AND so.left_at IS NULL`,
        [input.sessionId]
      );
      return rows;
    }),

  submitFeedback: publicProcedure
    .input(z.object({
      sessionId: z.number().int(),
      token: z.string().optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await rawSql(
        `INSERT INTO client_report_feedback (session_id, token, rating, comment) VALUES ($1, $2, $3, $4)`,
        [input.sessionId, input.token || null, input.rating, input.comment || null]
      );
      return { success: true };
    }),

  logClientView: publicProcedure
    .input(z.object({
      token: z.string(),
      tabViewed: z.string().optional(),
      timeSpentSecs: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      await rawSql(
        `INSERT INTO client_report_view_log (token, tab_viewed, time_spent_secs) VALUES ($1, $2, $3)`,
        [input.token, input.tabViewed || null, input.timeSpentSecs || 0]
      );
      return { success: true };
    }),

  getClientViewLog: operatorProcedure
    .input(z.object({ sessionId: z.number().int().optional(), token: z.string().optional() }))
    .query(async ({ input }) => {
      if (input.token) {
        const [rows] = await rawSql(
          `SELECT * FROM client_report_view_log WHERE token = $1 ORDER BY viewed_at DESC`,
          [input.token]
        );
        return rows;
      }
      if (input.sessionId) {
        const [rows] = await rawSql(
          `SELECT vl.* FROM client_report_view_log vl
           JOIN client_tokens ct ON vl.token = ct.token
           WHERE ct.session_id = $1 ORDER BY vl.viewed_at DESC`,
          [input.sessionId]
        );
        return rows;
      }
      return [];
    }),

  resendReportLink: operatorProcedure
    .input(z.object({ sessionId: z.number().int(), recipientEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const [tokens] = await rawSql(
        `SELECT token FROM client_tokens WHERE session_id = $1 AND recipient_email = $2 AND access_type = 'report'
         ORDER BY created_at DESC LIMIT 1`,
        [input.sessionId, input.recipientEmail]
      );
      if (tokens.length === 0) return { success: false, error: "No report token found" };
      return { success: true, message: `Report link resent to ${input.recipientEmail}` };
    }),

  importHistoricalCommitments: operatorProcedure
    .input(z.object({
      company: z.string(),
      commitments: z.array(z.object({
        commitment: z.string(),
        madeAt: z.string().optional(),
        deadline: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      for (const c of input.commitments) {
        await rawSql(
          `INSERT INTO historical_commitments (company, commitment, made_at, deadline)
           VALUES ($1, $2, $3, $4)`,
          [input.company, c.commitment, c.madeAt || null, c.deadline || null]
        );
      }
      return { success: true, count: input.commitments.length };
    }),

  upsertBoardMember: operatorProcedure
    .input(z.object({
      company: z.string(),
      name: z.string(),
      role: z.string().optional(),
      committee: z.string().optional(),
      bio: z.string().optional(),
      linkedinUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [rows] = await rawSql(
        `INSERT INTO board_members (company, name, role, committee, bio, linkedin_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.company, input.name, input.role || null, input.committee || null, input.bio || null, input.linkedinUrl || null]
      );
      return { success: true, id: rows[0]?.id };
    }),

  getBoardMembers: operatorProcedure
    .input(z.object({ company: z.string() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT * FROM board_members WHERE company = $1 AND active = true ORDER BY name`,
        [input.company]
      );
      return rows;
    }),

  detectJurisdiction: publicProcedure
    .input(z.object({ exchangeCode: z.string().optional(), company: z.string().optional() }))
    .query(({ input }) => {
      const map: Record<string, string> = {
        JSE: "JSE", NYSE: "SEC", NASDAQ: "SEC", LSE: "FCA", ASX: "ASIC", SGX: "SGX", HKEX: "HKEX",
      };
      const jurisdiction = input.exchangeCode ? (map[input.exchangeCode.toUpperCase()] || "other") : "other";
      return { jurisdiction };
    }),

  flagTranscriptSegment: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      segmentText: z.string(),
      flagType: z.enum(["notable", "compliance", "forward-guidance", "tone-shift", "action-required"]).default("notable"),
      operatorNote: z.string().optional(),
      speaker: z.string().optional(),
      eventTimestamp: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [marker] = await db.insert(sessionMarkers).values({
        sessionId: input.sessionId,
        segmentText: input.segmentText,
        flagType: input.flagType,
        operatorNote: input.operatorNote,
        speaker: input.speaker,
        eventTimestamp: input.eventTimestamp,
        operatorId: ctx.user?.id,
      }).returning();
      return marker;
    }),

  getSessionMarkers: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sessionMarkers)
        .where(eq(sessionMarkers.sessionId, input.sessionId))
        .orderBy(asc(sessionMarkers.createdAt));
    }),
});
