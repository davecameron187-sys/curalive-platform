import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { postEventReports } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";

async function callForgeAI(prompt: string): Promise<string> {
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "https://api.forge.replit.com/v1";
  if (!apiKey) return "[AI summary unavailable — API key not configured]";
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "replit-v1", messages: [{ role: "user", content: prompt }], max_tokens: 2000 }),
    });
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content ?? "[No response from AI]";
  } catch {
    return "[AI generation failed]";
  }
}

export const postEventReportRouter = router({
  generate: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      reportType: z.enum(["full", "executive", "compliance"]).default("full"),
      eventTitle: z.string().optional(),
      transcriptSummary: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(postEventReports).values({
        eventId: input.eventId,
        generatedBy: ctx.user.id,
        reportType: input.reportType,
        status: "generating",
      });
      const reportId = (result as any).insertId;

      const title = input.eventTitle ?? "CuraLive Event";
      const transcript = input.transcriptSummary ?? "No transcript provided.";

      const [summary, keyMoments, sentiment, qaSum] = await Promise.all([
        callForgeAI(`You are an expert investor relations analyst. Write a professional ${input.reportType} summary for the following event: "${title}". Transcript excerpt: ${transcript.slice(0, 1500)}. Provide a structured summary with key takeaways, notable moments, and overall assessment.`),
        callForgeAI(`From this event transcript, identify 3-5 key moments with timestamps. Format as JSON array: [{moment: string, significance: string, timestamp: string}]. Transcript: ${transcript.slice(0, 1000)}`),
        callForgeAI(`Analyse the sentiment of this investor event transcript. Return JSON: {overall: "positive|neutral|negative", score: 0-100, breakdown: {positive_pct, neutral_pct, negative_pct}, highlights: [string]}. Transcript: ${transcript.slice(0, 1000)}`),
        callForgeAI(`Summarise the Q&A section of this event. Return JSON: {total_questions: number, top_themes: [string], unanswered: number, notable_exchanges: [{question: string, summary: string}]}. Transcript: ${transcript.slice(0, 1000)}`),
      ]);

      await db.update(postEventReports).set({
        status: "completed",
        aiSummary: summary,
        keyMoments,
        sentimentOverview: sentiment,
        qaSummary: qaSum,
        engagementMetrics: JSON.stringify({ reportGeneratedAt: new Date().toISOString() }),
        complianceFlags: JSON.stringify({ flagged: false, notes: [] }),
      }).where(eq(postEventReports.id, reportId));

      return { reportId, status: "completed" };
    }),

  getReport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(postEventReports)
        .where(eq(postEventReports.eventId, input.eventId))
        .limit(1);
      return rows[0] ?? null;
    }),

  getReportStatus: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { status: "unknown" };
      const rows = await db.select().from(postEventReports)
        .where(eq(postEventReports.id, input.reportId))
        .limit(1);
      return { status: rows[0]?.status ?? "unknown" };
    }),

  downloadPdf: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(postEventReports)
        .where(eq(postEventReports.id, input.reportId))
        .limit(1);
      return { pdfUrl: rows[0]?.pdfUrl ?? null };
    }),

  regenerate: protectedProcedure
    .input(z.object({ reportId: z.number(), eventId: z.string(), reportType: z.enum(["full", "executive", "compliance"]).default("full") }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(postEventReports).set({ status: "generating", aiSummary: null, keyMoments: null }).where(eq(postEventReports.id, input.reportId));
      return { reportId: input.reportId, status: "generating" };
    }),

  listForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(postEventReports).where(eq(postEventReports.eventId, input.eventId));
    }),
});
