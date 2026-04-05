import { z } from "zod";
import { router, operatorProcedure } from "../_core/trpc";
import { getDb, rawSql } from "../db";
import Ably from "ably";

const ably = process.env.ABLY_API_KEY
  ? new Ably.Rest(process.env.ABLY_API_KEY)
  : null;

const COORDINATION_THRESHOLD = 3;
const COORDINATION_WINDOW_MINS = 10;

export const qaAnalyticsRouter = router({

  getLiveQAPatterns: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { firms: [], timeline: [], alerts: [], totalQuestions: 0 };

      const [firmRows] = await rawSql(
        `SELECT
           COALESCE(asker_firm, 'Unknown') as firm,
           COUNT(*)::int                    as question_count,
           COUNT(*) FILTER (WHERE status = 'compliance_risk')::int as risk_count,
           MIN(created_at)                 as first_at,
           MAX(created_at)                 as last_at
         FROM approved_questions_queue
         WHERE session_id = $1
         GROUP BY COALESCE(asker_firm, 'Unknown')
         ORDER BY question_count DESC`,
        [input.sessionId]
      );

      const totalQuestions = firmRows.reduce((s: number, r: any) => s + Number(r.question_count), 0);

      const firms = firmRows.map((r: any) => ({
        firm:          r.firm,
        count:         Number(r.question_count),
        riskCount:     Number(r.risk_count),
        pct:           totalQuestions > 0
                         ? Math.round((Number(r.question_count) / totalQuestions) * 100)
                         : 0,
        firstAt:       r.first_at,
        lastAt:        r.last_at,
      }));

      const [timelineRows] = await rawSql(
        `SELECT
           date_trunc('minute', created_at) -
             (EXTRACT(MINUTE FROM created_at)::int % 10) * INTERVAL '1 minute'
             AS bucket,
           COUNT(*)::int as count
         FROM approved_questions_queue
         WHERE session_id = $1
         GROUP BY bucket
         ORDER BY bucket ASC`,
        [input.sessionId]
      );

      const timeline = timelineRows.map((r: any) => ({
        bucket: r.bucket,
        count:  Number(r.count),
      }));

      const alerts: Array<{
        firm: string;
        count: number;
        windowStart: Date;
        windowEnd: Date;
        severity: 'warning' | 'critical';
      }> = [];

      const now = new Date();
      const windowStart = new Date(now.getTime() - COORDINATION_WINDOW_MINS * 60 * 1000);

      const [recentByFirm] = await rawSql(
        `SELECT
           COALESCE(asker_firm, 'Unknown') as firm,
           COUNT(*)::int as count,
           MIN(created_at) as window_start,
           MAX(created_at) as window_end
         FROM approved_questions_queue
         WHERE session_id = $1
           AND created_at >= $2
         GROUP BY COALESCE(asker_firm, 'Unknown')
         HAVING COUNT(*) >= $3`,
        [input.sessionId, windowStart, COORDINATION_THRESHOLD]
      );

      for (const r of recentByFirm) {
        alerts.push({
          firm:        r.firm,
          count:       Number(r.count),
          windowStart: new Date(r.window_start),
          windowEnd:   new Date(r.window_end),
          severity:    Number(r.count) >= 5 ? 'critical' : 'warning',
        });
      }

      return { firms, timeline, alerts, totalQuestions };
    }),

  checkCoordinatedQuestioning: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      askerFirm: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!input.askerFirm) return { coordinated: false };

      const db = await getDb();
      if (!db) return { coordinated: false };

      const windowStart = new Date(
        Date.now() - COORDINATION_WINDOW_MINS * 60 * 1000
      );

      const [rows] = await rawSql(
        `SELECT COUNT(*)::int as count
         FROM approved_questions_queue
         WHERE session_id = $1
           AND COALESCE(asker_firm, '') = $2
           AND created_at >= $3`,
        [input.sessionId, input.askerFirm, windowStart]
      );

      const count = Number(rows[0]?.count ?? 0);
      const coordinated = count >= COORDINATION_THRESHOLD;

      if (coordinated && ably) {
        const alertPayload = {
          type:        'coordinated_questioning',
          firm:        input.askerFirm,
          count,
          windowMins:  COORDINATION_WINDOW_MINS,
          message:     `Coordinated questioning detected — ${input.askerFirm} — ${count} questions in ${COORDINATION_WINDOW_MINS} minutes`,
          severity:    count >= 5 ? 'critical' : 'warning',
          firedAt:     new Date().toISOString(),
          sessionId:   input.sessionId,
        };

        const opChannel = ably.channels.get(`operator-${input.sessionId}`);
        await opChannel.publish('qa.coordination.alert', alertPayload);

        const flagsChannel = ably.channels.get(`session-flags-${input.sessionId}`);
        await flagsChannel.publish('flag.new', {
          ...alertPayload,
          flagType: 'coordination',
          title:    `Coordinated questioning — ${input.askerFirm}`,
          body:     `${count} questions submitted within ${COORDINATION_WINDOW_MINS} minutes. Possible coordinated institutional strategy.`,
        });
      }

      return { coordinated, count, firm: input.askerFirm };
    }),

  getQAIntelligenceSummary: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [rows] = await rawSql(
        `SELECT
           COALESCE(asker_firm, 'Unknown')       as firm,
           COUNT(*)::int                           as total_questions,
           COUNT(*) FILTER (WHERE status = 'approved')::int           as approved,
           COUNT(*) FILTER (WHERE status = 'compliance_risk')::int    as compliance_risk,
           COUNT(*) FILTER (WHERE status = 'duplicate')::int          as duplicates,
           COUNT(*) FILTER (WHERE status = 'legal_review')::int       as legal_review,
           COUNT(*) FILTER (WHERE ai_suggested_answer IS NOT NULL)::int as had_ai_answer
         FROM approved_questions_queue
         WHERE session_id = $1
         GROUP BY COALESCE(asker_firm, 'Unknown')
         ORDER BY total_questions DESC`,
        [input.sessionId]
      );

      const totalQs = rows.reduce((s: number, r: any) => s + Number(r.total_questions), 0);
      const riskQs  = rows.reduce((s: number, r: any) => s + Number(r.compliance_risk), 0);

      return {
        firmBreakdown: rows.map((r: any) => ({
          firm:          r.firm,
          totalQuestions: Number(r.total_questions),
          approved:      Number(r.approved),
          complianceRisk: Number(r.compliance_risk),
          duplicates:    Number(r.duplicates),
          legalReview:   Number(r.legal_review),
          hadAiAnswer:   Number(r.had_ai_answer),
          shareOfTotal:  totalQs > 0
                           ? Math.round((Number(r.total_questions) / totalQs) * 100)
                           : 0,
        })),
        sessionSummary: {
          totalQuestions: totalQs,
          totalFirms:     rows.length,
          riskRatio:      totalQs > 0 ? Math.round((riskQs / totalQs) * 100) : 0,
          mostActiveFirm: rows[0]?.firm ?? null,
        },
      };
    }),
});
