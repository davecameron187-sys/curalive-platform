// @ts-nocheck
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { retrieveRelevantEntries, buildContextBlock } from "../services/KnowledgeRetrievalService";

const BASE_SYSTEM_PROMPT = `You are the CuraLive Support Assistant — a knowledgeable, professional AI that helps users understand and use the CuraLive investor intelligence platform.

CuraLive is a real-time AI platform for investor events (earnings calls, AGMs, analyst briefings). It serves IR teams, executives, listed companies, stock exchanges, and financial professionals.

Your role:
- Answer questions about CuraLive features, integrations, compliance, and setup
- Use the knowledge base context provided to give accurate, specific answers
- Be concise but complete — 2-4 sentences is ideal for most answers
- If a question is about pricing, commercial terms, or sensitive partnerships, say you will escalate it
- If you cannot answer confidently from the context, say so and offer to escalate
- Always be professional, warm, and accurate
- Never make up specific numbers, dates, or commercial details
- If the user is on a specific page, tailor your answer to that context

When you need to escalate, include the exact phrase "I'll escalate this" in your response.`;

const PAGE_LABELS: Record<string, string> = {
  "/shadow-mode": "Shadow Mode (Live Event Monitor) — user is actively monitoring a live investor event",
  "/call-preparation": "Earnings Call Preparation Intelligence — user is preparing a pre-event briefing",
  "/intelligence-terminal": "Intelligence Terminal — Bloomberg-style dashboard for financial professionals",
  "/intelligence-report": "Investor Intelligence Reports — user is viewing or generating post-event reports",
  "/investor-questions": "Investor Question Intelligence — user is working with the question scoring database",
  "/benchmarks": "Benchmarks — user is viewing sector benchmarks and the CICI index",
  "/market-reaction": "Market Reaction Intelligence — user is viewing communication-to-market-outcome correlations",
  "/communication-index": "CICI Publisher — user is publishing the quarterly CICI index snapshot",
  "/bastion": "Bastion Capital integration page",
  "/lumi": "Lumi Global integration page",
  "/archive-upload": "Archive Upload — user is uploading a past event transcript",
};

async function rawExecute(sql: string, params: any[] = []) {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(sql, params);
}

export const supportChatRouter = router({
  ask: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(1000),
      conversationId: z.string().optional(),
      currentPage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { message, conversationId, currentPage } = input;

      const pageLabel = currentPage
        ? Object.entries(PAGE_LABELS).find(([key]) => currentPage.startsWith(key))?.[1]
        : null;

      const systemPrompt = pageLabel
        ? `${BASE_SYSTEM_PROMPT}\n\nCurrent page context: ${pageLabel}`
        : BASE_SYSTEM_PROMPT;

      const entries = await retrieveRelevantEntries(message, 4);
      const contextBlock = buildContextBlock(entries);

      const messages: any[] = [
        { role: "system", content: systemPrompt },
      ];

      if (contextBlock) {
        messages.push({
          role: "system",
          content: `Relevant knowledge base context:\n\n${contextBlock}`,
        });
      }

      messages.push({ role: "user", content: message });

      let answer = "I'm sorry, I wasn't able to generate a response. Please try again.";
      let needsEscalation = false;

      try {
        const result = await invokeLLM({ messages, model: "gpt-4o" });
        answer = result.choices?.[0]?.message?.content ?? answer;
        needsEscalation = answer.toLowerCase().includes("i'll escalate") ||
          answer.toLowerCase().includes("escalate this") ||
          answer.toLowerCase().includes("contact the team") ||
          answer.toLowerCase().includes("reach out");
      } catch (err) {
        console.error("LLM error in supportChatRouter:", err);
        answer = "I encountered an issue generating a response. Please try again or contact the CuraLive team directly.";
        needsEscalation = true;
      }

      const matchedEntryIds = entries.map(e => e.id).join(",");

      try {
        await rawExecute(
          `INSERT INTO support_queries
             (conversation_id, user_message, ai_response, needs_escalation, matched_entries)
           VALUES (?, ?, ?, ?, ?)`,
          [
            conversationId ?? null,
            message,
            answer,
            needsEscalation ? 1 : 0,
            matchedEntryIds || null,
          ]
        );
      } catch (logErr) {
        console.error("Failed to log support query:", logErr);
      }

      return { answer, needsEscalation };
    }),

  getRecentQueries: publicProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;
      const [rows] = await conn.execute(
        `SELECT id, conversation_id, user_message, ai_response, needs_escalation, created_at
         FROM support_queries
         ORDER BY created_at DESC
         LIMIT ?`,
        [input.limit]
      );
      return rows;
    }),
});
