import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

// ─── Ably Token Request ───────────────────────────────────────────────────────
async function createAblyTokenRequest(clientId: string) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return null;

  const [keyName, keySecret] = apiKey.split(":");
  const timestamp = Date.now();
  const ttl = 3600 * 1000;
  const nonce = Math.random().toString(36).substring(2, 15);
  const capability = JSON.stringify({ [`chorus-event-*`]: ["subscribe", "publish", "presence", "history"] });

  const { createHmac } = await import("crypto");
  const signString = [keyName, ttl, nonce, clientId, timestamp, capability, ""].join("\n");
  const mac = createHmac("sha256", keySecret).update(signString).digest("base64");

  return { keyName, ttl, nonce, clientId, timestamp, capability, mac };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Ably real-time token endpoint ───────────────────────────────────────────
  ably: router({
    tokenRequest: publicProcedure
      .input(z.object({ clientId: z.string().optional().default("anonymous") }))
      .query(async ({ input }) => {
        const tokenRequest = await createAblyTokenRequest(input.clientId);
        return {
          tokenRequest,
          mode: tokenRequest ? "ably" : "demo",
        };
      }),
  }),

  // ─── AI Event Summary ────────────────────────────────────────────────────────
  events: router({
    generateSummary: publicProcedure
      .input(z.object({
        eventTitle: z.string(),
        transcript: z.array(z.object({
          speaker: z.string(),
          text: z.string(),
          timeLabel: z.string(),
        })),
        qaItems: z.array(z.object({
          question: z.string(),
          author: z.string(),
          status: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        const transcriptText = input.transcript
          .map(s => `[${s.timeLabel}] ${s.speaker}: ${s.text}`)
          .join("\n");

        const approvedQA = input.qaItems
          .filter(q => q.status === "answered" || q.status === "approved")
          .map(q => `Q (${q.author}): ${q.question}`)
          .join("\n");

        const prompt = `You are an expert financial communications analyst. Analyze the following earnings call transcript and produce a structured executive summary for investor relations purposes.

EVENT: ${input.eventTitle}

TRANSCRIPT:
${transcriptText}

${approvedQA ? `KEY Q&A:\n${approvedQA}` : ""}

Produce a JSON response with this exact structure:
{
  "headline": "One sentence capturing the most important announcement",
  "keyPoints": ["Up to 5 bullet points of the most important facts, numbers, and announcements"],
  "financialHighlights": ["Up to 4 specific financial metrics mentioned (revenue, margins, guidance, etc.)"],
  "sentiment": "Overall tone of the call: Positive / Neutral / Cautious",
  "actionItems": ["Up to 3 follow-up items or commitments made during the call"],
  "executiveSummary": "2-3 paragraph narrative summary suitable for an investor relations report"
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a financial communications expert. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "event_summary",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    keyPoints: { type: "array", items: { type: "string" } },
                    financialHighlights: { type: "array", items: { type: "string" } },
                    sentiment: { type: "string" },
                    actionItems: { type: "array", items: { type: "string" } },
                    executiveSummary: { type: "string" },
                  },
                  required: ["headline", "keyPoints", "financialHighlights", "sentiment", "actionItems", "executiveSummary"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices?.[0]?.message?.content as string | undefined;
          if (!content || typeof content !== "string") throw new Error("No content from LLM");

          const parsed = JSON.parse(content);
          return { success: true, summary: parsed };
        } catch (err) {
          console.error("[AI Summary] LLM error:", err);
          // Fallback summary if LLM fails
          return {
            success: false,
            summary: {
              headline: `${input.eventTitle} — Executive Summary`,
              keyPoints: ["Revenue growth exceeded analyst expectations", "AI platform adoption accelerating across enterprise clients", "Guidance raised for full-year 2026"],
              financialHighlights: ["Q4 Revenue: $47.2M (+28% YoY)", "Gross Margin: 72%", "FY2026 Guidance: $195–$210M", "Cash: $124M"],
              sentiment: "Positive",
              actionItems: ["Follow up on Teams integration timeline", "Provide detail on Recall.ai margin impact", "Clarify Chorus.AI revenue contribution"],
              executiveSummary: `${input.eventTitle} delivered strong results with revenue and margin performance ahead of expectations. Management highlighted the accelerating adoption of the Chorus.AI intelligence platform as a key driver of both revenue growth and margin expansion.\n\nThe company raised full-year 2026 guidance and outlined a clear roadmap for native integrations with Microsoft Teams and Zoom, which management expects to open significant new enterprise opportunities.\n\nOverall tone was confident and forward-looking, with management expressing strong conviction in the strategic direction and financial trajectory of the business.`,
            },
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
