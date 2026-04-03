import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql } from "../db";

async function validateClientToken(token: string, sessionId: number): Promise<boolean> {
  const [rows] = await rawSql(
    `SELECT id FROM client_tokens WHERE token = $1 AND session_id = $2 AND expires_at > NOW()`,
    [token, sessionId]
  );
  return rows.length > 0;
}

export const sessionMessagesRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      sessionId: z.number().int(),
      fromRole: z.enum(["operator", "client"]),
      fromName: z.string().optional(),
      message: z.string().min(1).max(2000),
      token: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.fromRole === "client") {
        if (!input.token || !(await validateClientToken(input.token, input.sessionId))) {
          throw new Error("Invalid or expired client token");
        }
      } else {
        if (!ctx.user) throw new Error("Authentication required for operator messages");
      }

      const [rows] = await rawSql(
        `INSERT INTO session_messages (session_id, from_role, from_name, message)
         VALUES ($1, $2, $3, $4)`,
        [input.sessionId, input.fromRole, input.fromName || input.fromRole, input.message]
      );
      const messageId = rows[0]?.id;

      try {
        const Ably = (await import("ably")).default;
        const apiKey = process.env.ABLY_API_KEY;
        if (apiKey) {
          const ably = new Ably.Rest(apiKey);
          const channelName = input.fromRole === "client"
            ? `operator-${input.sessionId}`
            : `client-${input.sessionId}`;
          const channel = ably.channels.get(channelName);
          await channel.publish("message", {
            id: messageId,
            sessionId: input.sessionId,
            fromRole: input.fromRole,
            fromName: input.fromName || input.fromRole,
            message: input.message,
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        console.warn("[SessionMessages] Ably publish failed:", err?.message);
      }

      return { success: true, messageId };
    }),

  getSessionMessages: publicProcedure
    .input(z.object({
      sessionId: z.number().int(),
      fromRole: z.string().optional(),
      limit: z.number().int().optional().default(50),
      token: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        if (!input.token || !(await validateClientToken(input.token, input.sessionId))) {
          throw new Error("Invalid or expired token");
        }
      }

      let sql = `SELECT * FROM session_messages WHERE session_id = $1`;
      const params: any[] = [input.sessionId];
      if (input.fromRole) {
        sql += ` AND from_role = $2`;
        params.push(input.fromRole);
      }
      sql += ` ORDER BY created_at DESC LIMIT ${input.limit}`;
      const [rows] = await rawSql(sql, params);
      return rows.reverse();
    }),

  markRead: operatorProcedure
    .input(z.object({ messageIds: z.array(z.number().int()) }))
    .mutation(async ({ input }) => {
      if (input.messageIds.length === 0) return { success: true };
      const placeholders = input.messageIds.map((_, i) => `$${i + 1}`).join(",");
      await rawSql(
        `UPDATE session_messages SET read_at = NOW() WHERE id IN (${placeholders}) AND read_at IS NULL`,
        input.messageIds
      );
      return { success: true };
    }),

  getUnreadCount: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT COUNT(*) as count FROM session_messages WHERE session_id = $1 AND from_role = 'client' AND read_at IS NULL`,
        [input.sessionId]
      );
      return { count: Number(rows[0]?.count || 0) };
    }),
});
