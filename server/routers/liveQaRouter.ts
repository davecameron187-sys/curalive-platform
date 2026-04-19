import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { rawSql } from "../db";
import Ably from "ably";

const getAblyClient = () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) throw new Error("ABLY_API_KEY not configured");
  return new Ably.Rest(key);
};

export const liveQaRouter = router({

  getAblyToken: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      attendeeId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT id, status FROM shadow_sessions WHERE id = $1`,
        [input.sessionId]
      );
      const session = rows?.[0];
      if (!session || !["live", "bot_joining"].includes(session.status)) {
        throw new Error("Session is not active");
      }
      const ably = getAblyClient();
      const tokenRequest = await ably.auth.createTokenRequest({
        clientId: input.attendeeId ?? `attendee-${Date.now()}`,
        capability: {
          [`session:${input.sessionId}:qa`]: ["publish", "subscribe", "presence"],
          [`session:${input.sessionId}:transcript`]: ["subscribe"],
        },
      });
      return tokenRequest;
    }),

  submitQuestion: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      attendeeId: z.string(),
      attendeeName: z.string().optional(),
      questionText: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input }) => {
      const [rows] = await rawSql(
        `INSERT INTO qa_questions
          (session_id, attendee_id, attendee_name, question_text, status, submitted_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING id`,
        [input.sessionId, input.attendeeId, input.attendeeName ?? "Anonymous", input.questionText]
      );
      return { id: rows?.[0]?.id };
    }),

  listQuestions: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      status: z.enum(["pending", "approved", "answered", "dismissed", "all"]).optional(),
    }))
    .query(async ({ input }) => {
      const statusFilter = input.status && input.status !== "all"
        ? `AND status = '${input.status}'`
        : "";
      const [rows] = await rawSql(
        `SELECT id, session_id, attendee_id, attendee_name, question_text, status, upvotes, submitted_at, answered_at
         FROM qa_questions
         WHERE session_id = $1 ${statusFilter}
         ORDER BY upvotes DESC, submitted_at ASC`,
        [input.sessionId]
      );
      return rows ?? [];
    }),

  updateQuestionStatus: protectedProcedure
    .input(z.object({
      questionId: z.number(),
      status: z.enum(["approved", "answered", "dismissed"]),
    }))
    .mutation(async ({ input }) => {
      await rawSql(
        `UPDATE qa_questions SET status = $1, answered_at = CASE WHEN $1 = 'answered' THEN NOW() ELSE answered_at END WHERE id = $2`,
        [input.status, input.questionId]
      );
      return { success: true };
    }),

  upvoteQuestion: publicProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      await rawSql(
        `UPDATE qa_questions SET upvotes = upvotes + 1 WHERE id = $1`,
        [input.questionId]
      );
      return { success: true };
    }),

  getJoinLinks: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT webphone_url, dial_in_number, access_code FROM shadow_sessions WHERE id = $1`,
        [input.sessionId]
      );
      return rows?.[0] ?? null;
    }),
});
