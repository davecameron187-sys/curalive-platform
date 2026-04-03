import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql } from "../db";

export const speakerQueueRouter = router({
  queueForSpeaker: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      questionId: z.number().int().optional(),
      questionText: z.string(),
      askerName: z.string().optional(),
      askerFirm: z.string().optional(),
      aiSuggestedAnswer: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [rows] = await rawSql(
        `INSERT INTO approved_questions_queue (session_id, question_id, question_text, asker_name, asker_firm, ai_suggested_answer, operator_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [input.sessionId, input.questionId || null, input.questionText, input.askerName || null,
         input.askerFirm || null, input.aiSuggestedAnswer || null, ctx.user?.id || null]
      );

      try {
        const Ably = (await import("ably")).default;
        const apiKey = process.env.ABLY_API_KEY;
        if (apiKey) {
          const ably = new Ably.Rest(apiKey);

          const speakerChannel = ably.channels.get(`speaker-${input.sessionId}`);
          await speakerChannel.publish("question.queued", {
            id: rows[0]?.id,
            questionText: input.questionText,
            askerName: input.askerName,
            askerFirm: input.askerFirm,
            aiSuggestedAnswer: input.aiSuggestedAnswer,
            timestamp: Date.now(),
          });

          if (input.aiSuggestedAnswer) {
            const clientChannel = ably.channels.get(`client-${input.sessionId}`);
            await clientChannel.publish("ai.suggestion", {
              questionText: input.questionText,
              aiSuggestedAnswer: input.aiSuggestedAnswer,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err: any) {
        console.warn("[SpeakerQueue] Ably publish failed:", err?.message);
      }

      return { success: true, id: rows[0]?.id };
    }),

  getSpeakerQueue: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT * FROM approved_questions_queue WHERE session_id = $1 ORDER BY queued_at ASC`,
        [input.sessionId]
      );
      return rows;
    }),

  getPresenterQueue: publicProcedure
    .input(z.object({ sessionId: z.number().int(), token: z.string() }))
    .query(async ({ input }) => {
      const [valid] = await rawSql(
        `SELECT id FROM client_tokens WHERE token = $1 AND session_id = $2 AND expires_at > NOW() AND access_type IN ('presenter', 'live')`,
        [input.token, input.sessionId]
      );
      if (valid.length === 0) throw new Error("Invalid or expired presenter token");
      const [rows] = await rawSql(
        `SELECT id, question_text, asker_name, asker_firm, ai_suggested_answer, status, queued_at FROM approved_questions_queue WHERE session_id = $1 AND status IN ('pending', 'queued') ORDER BY queued_at ASC`,
        [input.sessionId]
      );
      return rows;
    }),

  markAnswered: operatorProcedure
    .input(z.object({ questionId: z.number().int() }))
    .mutation(async ({ input }) => {
      await rawSql(
        `UPDATE approved_questions_queue SET status = 'answered', answered_at = NOW() WHERE id = $1`,
        [input.questionId]
      );

      try {
        const [q] = await rawSql(`SELECT session_id FROM approved_questions_queue WHERE id = $1`, [input.questionId]);
        if (q[0]) {
          const Ably = (await import("ably")).default;
          const apiKey = process.env.ABLY_API_KEY;
          if (apiKey) {
            const ably = new Ably.Rest(apiKey);
            const channel = ably.channels.get(`speaker-${q[0].session_id}`);
            await channel.publish("question.answered", { id: input.questionId, timestamp: Date.now() });
          }
        }
      } catch {}

      return { success: true };
    }),

  skipQuestion: operatorProcedure
    .input(z.object({ questionId: z.number().int() }))
    .mutation(async ({ input }) => {
      await rawSql(
        `UPDATE approved_questions_queue SET status = 'skipped' WHERE id = $1`,
        [input.questionId]
      );
      return { success: true };
    }),
});
