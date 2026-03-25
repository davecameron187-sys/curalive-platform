// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { advisoryChatMessages } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const advisoryBotRouter = router({
  chat: publicProcedure
    .input(z.object({
      sessionKey: z.string(),
      message: z.string().min(1).max(2000),
      eventIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    await db.insert(advisoryChatMessages).values({
        sessionKey: input.sessionKey,
        role: "user",
        content: input.message,
        eventIds: input.eventIds ?? [],
      });

      const history = await db.select().from(advisoryChatMessages)
        .where(eq(advisoryChatMessages.sessionKey, input.sessionKey))
        .orderBy(desc(advisoryChatMessages.createdAt))
        .limit(20);
      history.reverse();

      let contextData = "";

      const targetEventIds = input.eventIds ?? [];
      if (targetEventIds.length > 0) {
        const placeholders = targetEventIds.map(() => "?").join(",");
        const [archiveRows] = await rawSql(
          `SELECT event_id, client_name, event_name, event_type, sentiment_avg, compliance_flags, ai_report, created_at
           FROM archive_events WHERE event_id IN (${placeholders}) LIMIT 10`,
          targetEventIds
        );

        for (const row of archiveRows as any[]) {
          let reportSummary = "";
          if (row.ai_report) {
            try {
              const report = typeof row.ai_report === "string" ? JSON.parse(row.ai_report) : row.ai_report;
              reportSummary = `Executive Summary: ${report.executiveSummary ?? "N/A"}
Sentiment: ${report.sentimentAnalysis?.score ?? "N/A"}/100 — ${report.sentimentAnalysis?.narrative ?? ""}
Compliance: ${report.complianceReview?.riskLevel ?? "N/A"} — ${(report.complianceReview?.recommendations ?? []).join(", ")}
Key Topics: ${(report.keyTopics ?? []).map((t: any) => t.topic).join(", ")}
Board Verdict: ${report.boardReadySummary?.verdict ?? "N/A"}`;
            } catch {}
          }
          contextData += `\n--- Event: ${row.event_name} (${row.client_name}, ${row.event_type}) ---
Sentiment: ${row.sentiment_avg}/100 | Compliance Flags: ${row.compliance_flags}
Date: ${row.created_at}
${reportSummary}\n`;
        }
      } else {
        const [recentRows] = await rawSql(
          `SELECT event_id, client_name, event_name, event_type, sentiment_avg, compliance_flags, created_at
           FROM archive_events ORDER BY created_at DESC LIMIT 10`
        );
        for (const row of recentRows as any[]) {
          contextData += `Event: ${row.event_name} (${row.client_name}) — Sentiment: ${row.sentiment_avg}/100, Flags: ${row.compliance_flags}\n`;
        }
      }

      const messages = [
        {
          role: "system" as const,
          content: `You are CuraLive's Private AI Advisory Bot. You have access to all communications captured and analysed by the CuraLive platform. Answer questions about events, sentiment, compliance, risks, and strategic insights based on the data provided.

Be specific, cite actual data points, and provide actionable insights. If asked about something not in the data, say so clearly.

Available event data:
${contextData || "No event data available yet. Suggest the user run some Shadow Mode sessions first."}`,
        },
        ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
      ];

      const resp = await invokeLLM({
        messages,
        model: "gpt-4o",
      });

      const reply = resp.choices?.[0]?.message?.content?.trim() ?? "I wasn't able to generate a response. Please try again.";

      await db.insert(advisoryChatMessages).values({
        sessionKey: input.sessionKey,
        role: "assistant",
        content: reply,
        eventIds: input.eventIds ?? [],
      });

      return { reply };
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(advisoryChatMessages)
        .where(eq(advisoryChatMessages.sessionKey, input.sessionKey))
        .orderBy(advisoryChatMessages.createdAt)
        .limit(100);
    }),

  clearHistory: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    await rawSql(`DELETE FROM advisory_chat_messages WHERE session_key = ?`, [input.sessionKey]);
      return { success: true };
    }),
});
