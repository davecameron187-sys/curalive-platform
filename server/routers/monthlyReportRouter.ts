// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { monthlyReports } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const monthlyReportRouter = router({
  generate: publicProcedure
    .input(z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      clientName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    const [inserted] = await db.insert(monthlyReports).values({
        reportMonth: input.month,
        clientName: input.clientName ?? null,
        status: "generating",
      }).returning();
      const reportId = inserted.id;

      try {
        const startDate = `${input.month}-01`;
        const [y, m] = input.month.split("-").map(Number);
        const endDate = new Date(y, m, 0);
        const endStr = `${y}-${String(m).padStart(2, "0")}-${endDate.getDate()}`;

        const [archiveRows] = await rawSql(
          `SELECT id, client_name, event_name, event_type, sentiment_avg, compliance_flags, ai_report, created_at
           FROM archive_events WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC`,
          [startDate, endStr + " 23:59:59"]
        );
        const archives = archiveRows as any[];

        const [shadowRows] = await rawSql(
          `SELECT id, client_name, event_name, event_type, sentiment_avg, compliance_flags, created_at
           FROM shadow_sessions WHERE status = 'completed' AND created_at >= ? AND created_at <= ?
           ORDER BY created_at ASC`,
          [startDate, endStr + " 23:59:59"]
        );
        const sessions = shadowRows as any[];

        const totalEvents = archives.length + sessions.length;
        const allSentiments = [
          ...archives.map(a => a.sentiment_avg).filter(Boolean),
          ...sessions.map(s => s.sentiment_avg).filter(Boolean),
        ];
        const avgSentiment = allSentiments.length > 0
          ? allSentiments.reduce((s, v) => s + v, 0) / allSentiments.length : 50;
        const totalComplianceFlags = [
          ...archives.map(a => a.compliance_flags ?? 0),
          ...sessions.map(s => s.compliance_flags ?? 0),
        ].reduce((s, v) => s + v, 0);

        const eventSummaries = [
          ...archives.map(a => ({
            name: a.event_name, client: a.client_name, type: a.event_type,
            sentiment: a.sentiment_avg, flags: a.compliance_flags, date: a.created_at,
            hasReport: !!a.ai_report,
          })),
          ...sessions.map(s => ({
            name: s.event_name, client: s.client_name, type: s.event_type,
            sentiment: s.sentiment_avg, flags: s.compliance_flags, date: s.created_at,
            hasReport: false,
          })),
        ];

        const resp = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are CuraLive's Monthly Intelligence Compiler. Generate a comprehensive monthly executive report aggregating all events.

Return ONLY valid JSON:
{
  "headline": "One-sentence summary of the month",
  "communicationHealthScore": <0-100>,
  "sentimentTrend": "improving|stable|declining|volatile",
  "executiveSummary": "3-5 paragraph narrative of the month's communications",
  "eventBreakdown": [{"event": "name", "client": "name", "type": "type", "sentiment": <0-100>, "verdict": "strong|satisfactory|concerning"}],
  "complianceOverview": {"totalFlags": <n>, "status": "clean|review_needed|action_required", "narrative": "summary"},
  "sentimentTrajectory": {"opening": <avg first week>, "midpoint": <avg mid month>, "closing": <avg last week>, "narrative": "trend description"},
  "topRisks": [{"risk": "description", "severity": "low|medium|high"}],
  "topOpportunities": [{"opportunity": "description", "impact": "low|medium|high"}],
  "recommendations": ["actionable recommendation"],
  "cleanDisclosureSummary": "Summary of compliance status for the period"
}`
            },
            {
              role: "user",
              content: `Monthly report for ${input.month}${input.clientName ? ` — ${input.clientName}` : ""}
Total events: ${totalEvents}
Average sentiment: ${avgSentiment.toFixed(1)}
Total compliance flags: ${totalComplianceFlags}

Events processed:
${JSON.stringify(eventSummaries.slice(0, 30), null, 2)}`
            },
          ],
          model: "gpt-4o",
        });

        const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
        const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
        const reportData = JSON.parse(cleaned);

        await db.update(monthlyReports).set({
          totalEvents,
          avgSentiment,
          totalComplianceFlags,
          communicationHealthScore: reportData.communicationHealthScore ?? avgSentiment,
          reportData,
          status: "completed",
        }).where(eq(monthlyReports.id, reportId));

        return { reportId, ...reportData, totalEvents, avgSentiment, totalComplianceFlags };
      } catch (err) {
        await db.update(monthlyReports).set({ status: "failed" }).where(eq(monthlyReports.id, reportId));
        throw err;
      }
    }),

  list: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(monthlyReports).orderBy(desc(monthlyReports.createdAt)).limit(24);
  }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [report] = await db.select().from(monthlyReports).where(eq(monthlyReports.id, input.id)).limit(1);
      return report ?? null;
    }),
});
