// Canonical session table: shadow_sessions — aligns with Shadow Mode / OCC pipeline and wider CuraLive integration.
import { z } from "zod";
import { router, operatorProcedure } from "../_core/trpc";
import { rawSql } from "../db";
import { sendEmail } from "../_core/email";

function buildReportApprovalEmail(opts: { clientName: string; eventName: string; reportUrl: string | null }): string {
  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#f8fafc;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;">
    <div style="padding:32px 40px;text-align:center;border-bottom:1px solid #334155;">
      <h1 style="color:#f1f5f9;font-size:20px;margin:0;">CuraLive Intelligence Report</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#e2e8f0;font-size:14px;line-height:1.6;">Your intelligence report for <strong style="color:#38bdf8;">${opts.eventName}</strong> (${opts.clientName}) is now ready for review.</p>
      ${opts.reportUrl ? `<div style="text-align:center;padding:24px 0;"><a href="${opts.reportUrl}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Full Report</a></div>` : ""}
    </div>
    <div style="padding:16px 40px;text-align:center;border-top:1px solid #334155;">
      <p style="color:#64748b;font-size:12px;margin:0;">CuraLive · Investor Events Intelligence</p>
    </div>
  </div></body></html>`;
}

export const operatorDashboardRouter = router({
  getDashboardSummary: operatorProcedure.query(async () => {
    const [liveRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM shadow_sessions WHERE status = 'live'`
    );
    const liveCount = liveRows[0]?.cnt ?? 0;

    const [pendingRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM archive_events WHERE status = 'ready_to_send' AND ai_report IS NOT NULL`
    );
    const pendingReportCount = pendingRows[0]?.cnt ?? 0;

    const [activeRows] = await rawSql(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'demo')::int AS demo,
         COUNT(*) FILTER (WHERE status = 'pilot')::int AS pilot
       FROM organisations`
    );
    const customers = activeRows[0] ?? { active: 0, demo: 0, pilot: 0 };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [revenueRows] = await rawSql(
      `SELECT
         COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_cents ELSE 0 END), 0)::bigint AS this_month,
         COALESCE(SUM(CASE WHEN created_at >= $2 AND created_at < $1 THEN total_cents ELSE 0 END), 0)::bigint AS last_month
       FROM billing_invoices
       WHERE status IN ('pending', 'paid')`,
      [monthStart, lastMonthStart]
    );
    const revenueThisMonth = Number(revenueRows[0]?.this_month ?? 0);
    const revenueLastMonth = Number(revenueRows[0]?.last_month ?? 0);

    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const [upcomingRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM scheduled_sessions WHERE scheduled_at >= NOW() AND scheduled_at <= $1`,
      [nextWeek]
    );
    const upcomingCount = upcomingRows[0]?.cnt ?? 0;

    return {
      liveCount,
      pendingReportCount,
      customers,
      revenueThisMonth,
      revenueLastMonth,
      upcomingCount,
    };
  }),

  getLiveSession: operatorProcedure.query(async () => {
    const [rows] = await rawSql(
      `SELECT s.id, s.company, s.client_name, s.event_name, s.event_type, s.started_at, s.status,
              s.sentiment_avg, s.compliance_flags, s.ai_core_results,
              COALESCE(s.org_id, 0) AS org_id
       FROM shadow_sessions s
       WHERE s.status = 'live'
       ORDER BY s.started_at DESC
       LIMIT 1`
    );
    if (!rows.length) return null;

    const session = rows[0];
    const sessionId = session.id;

    const [segRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM occ_transcription_segments WHERE conference_id = $1`,
      [sessionId]
    );
    const segmentCount = segRows[0]?.cnt ?? 0;

    const [commitRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM aic_commitments WHERE event_id = $1::text`,
      [`shadow-${sessionId}`]
    );
    const commitmentCount = commitRows[0]?.cnt ?? 0;

    const [flagRows] = await rawSql(
      `SELECT COUNT(*)::int AS cnt FROM regulatory_flags WHERE monitor_id = $1`,
      [sessionId]
    );
    const complianceFlagCount = flagRows[0]?.cnt ?? 0;

    let riskLevel = "unknown";
    if (session.ai_core_results) {
      try {
        const parsed = typeof session.ai_core_results === "string"
          ? JSON.parse(session.ai_core_results)
          : session.ai_core_results;
        riskLevel = parsed?.risk?.overall_level ?? "unknown";
      } catch {}
    }

    return {
      id: sessionId,
      company: session.company ?? session.client_name,
      eventName: session.event_name,
      eventType: session.event_type,
      startedAt: session.started_at,
      segmentCount,
      commitmentCount,
      complianceFlagCount,
      riskLevel,
      orgId: session.org_id,
    };
  }),

  getUpcomingSessions: operatorProcedure.query(async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const [rows] = await rawSql(
      `SELECT ss.id, ss.event_name, ss.scheduled_at, ss.event_type,
              o.name AS org_name
       FROM scheduled_sessions ss
       LEFT JOIN organisations o ON o.id = ss.org_id
       WHERE ss.scheduled_at >= NOW() AND ss.scheduled_at <= $1
       ORDER BY ss.scheduled_at ASC
       LIMIT 10`,
      [nextWeek]
    );
    return rows.map((r: any) => ({
      id: r.id,
      eventName: r.event_name,
      scheduledAt: r.scheduled_at,
      eventType: r.event_type,
      orgName: r.org_name ?? "Unassigned",
    }));
  }),

  getAttentionItems: operatorProcedure.query(async () => {
    const items: Array<{ type: string; id: number; title: string; subtitle: string; severity: string; createdAt: string }> = [];

    const [reportRows] = await rawSql(
      `SELECT id, client_name, event_name, created_at
       FROM archive_events
       WHERE status = 'ready_to_send' AND ai_report IS NOT NULL
       ORDER BY created_at ASC
       LIMIT 10`
    );
    for (const r of reportRows) {
      items.push({
        type: "report_pending",
        id: r.id,
        title: `Report ready: ${r.client_name}`,
        subtitle: r.event_name,
        severity: "warning",
        createdAt: r.created_at?.toISOString?.() ?? String(r.created_at),
      });
    }

    return items;
  }),

  getAllSessions: operatorProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input }) => {
      const limit = 20;
      const offset = (input.page - 1) * limit;

      const [countRows] = await rawSql(`SELECT COUNT(*)::int AS cnt FROM shadow_sessions`);
      const total = countRows[0]?.cnt ?? 0;

      const [rows] = await rawSql(
        `SELECT s.id, s.company, s.client_name, s.event_name, s.event_type, s.status,
                s.started_at, s.ended_at, s.created_at, s.sentiment_avg,
                s.compliance_flags, s.transcript_segments, s.org_id,
                o.name AS org_name
         FROM shadow_sessions s
         LEFT JOIN organisations o ON o.id = s.org_id
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        sessions: rows.map((r: any) => ({
          id: r.id,
          company: r.company ?? r.client_name,
          eventName: r.event_name,
          eventType: r.event_type,
          status: r.status,
          startedAt: r.started_at,
          endedAt: r.ended_at,
          createdAt: r.created_at,
          sentimentAvg: r.sentiment_avg,
          complianceFlags: r.compliance_flags,
          transcriptSegments: r.transcript_segments,
          orgName: r.org_name,
        })),
        total,
        page: input.page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getCustomersByStage: operatorProcedure
    .input(z.object({ stage: z.enum(["active", "demo", "pilot"]) }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT o.*,
                (SELECT COUNT(*)::int FROM shadow_sessions s WHERE s.org_id = o.id) AS events_run,
                (SELECT MAX(s.created_at) FROM shadow_sessions s WHERE s.org_id = o.id) AS last_event,
                (SELECT token FROM client_tokens ct WHERE ct.session_id IN (SELECT id FROM shadow_sessions WHERE org_id = o.id) AND ct.access_type = 'report' LIMIT 1) AS demo_token
         FROM organisations o
         WHERE o.status = $1
         ORDER BY o.name ASC`,
        [input.stage]
      );

      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        billingType: r.billing_type,
        subscriptionAmount: r.subscription_amount,
        perEventPrice: r.per_event_price,
        billingContactEmail: r.billing_contact_email,
        irContactEmail: r.ir_contact_email,
        pilotEventsTotal: r.pilot_events_total ?? 3,
        pilotEventsUsed: r.pilot_events_used ?? 0,
        pilotNotes: r.pilot_notes,
        followupDate: r.followup_date,
        eventsRun: r.events_run ?? 0,
        lastEvent: r.last_event,
        demoToken: r.demo_token,
      }));
    }),

  getReportsPending: operatorProcedure.query(async () => {
    const [rows] = await rawSql(
      `SELECT ae.id, ae.client_name, ae.event_name, ae.event_type, ae.created_at,
              ae.ai_report, ae.org_id,
              ct.token AS report_token
       FROM archive_events ae
       LEFT JOIN client_tokens ct ON ct.session_id = ae.specialised_session_id AND ct.access_type = 'report'
       WHERE ae.status = 'ready_to_send' AND ae.ai_report IS NOT NULL
       ORDER BY ae.created_at DESC`
    );

    return rows.map((r: any) => {
      let moduleKeys: string[] = [];
      try {
        const report = typeof r.ai_report === "string" ? JSON.parse(r.ai_report) : r.ai_report;
        if (report && typeof report === "object") {
          moduleKeys = Object.keys(report).filter(k => k !== "metadata" && k !== "generatedAt");
        }
      } catch {}

      return {
        id: r.id,
        clientName: r.client_name,
        eventName: r.event_name,
        eventType: r.event_type,
        createdAt: r.created_at,
        reportToken: r.report_token ?? null,
        moduleKeys,
        orgId: r.org_id,
      };
    });
  }),

  getReportsSent: operatorProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input }) => {
      const limit = 20;
      const offset = (input.page - 1) * limit;

      const [countRows] = await rawSql(
        `SELECT COUNT(*)::int AS cnt FROM archive_events WHERE status = 'sent'`
      );
      const total = countRows[0]?.cnt ?? 0;

      const [rows] = await rawSql(
        `SELECT id, client_name, event_name, event_type, created_at, updated_at
         FROM archive_events
         WHERE status = 'sent'
         ORDER BY updated_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        reports: rows.map((r: any) => ({
          id: r.id,
          clientName: r.client_name,
          eventName: r.event_name,
          eventType: r.event_type,
          createdAt: r.created_at,
          sentAt: r.updated_at,
        })),
        total,
        page: input.page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  approveAndSendReport: operatorProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [eventRows] = await rawSql(
        `SELECT ae.id, ae.status, ae.client_name, ae.event_name, ae.ai_report, ae.org_id,
                ct.token AS report_token
         FROM archive_events ae
         LEFT JOIN client_tokens ct ON ct.session_id = ae.specialised_session_id AND ct.access_type = 'report'
         WHERE ae.id = $1`,
        [input.eventId]
      );

      if (!eventRows.length) {
        return { success: false, error: "Report not found." };
      }

      const event = eventRows[0];

      if (event.status === "sent") {
        return { success: true, alreadySent: true };
      }

      if (event.status !== "ready_to_send") {
        return { success: false, error: `Report status is '${event.status}', expected 'ready_to_send'.` };
      }

      let irContactEmail: string | null = null;
      if (event.org_id) {
        const [orgRows] = await rawSql(
          `SELECT ir_contact_email, billing_type, per_event_price, billing_contact_email FROM organisations WHERE id = $1`,
          [event.org_id]
        );
        if (orgRows.length) {
          irContactEmail = orgRows[0].ir_contact_email;
        }
      }

      if (!irContactEmail) {
        return { success: false, error: "IR contact email missing — report cannot be sent." };
      }

      const reportUrl = event.report_token
        ? `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : ""}/report/${event.report_token}`
        : null;

      const html = buildReportApprovalEmail({
        clientName: event.client_name,
        eventName: event.event_name,
        reportUrl,
      });

      const emailResult = await sendEmail({
        to: irContactEmail,
        subject: `CuraLive Intelligence Report — ${event.event_name}`,
        html,
      });

      if (!emailResult.success) {
        return { success: false, error: `Email failed: ${emailResult.error}` };
      }

      await rawSql(
        `UPDATE archive_events SET status = 'sent' WHERE id = $1`,
        [input.eventId]
      );

      let invoiceCreated = false;
      if (event.org_id) {
        const [orgRows] = await rawSql(
          `SELECT billing_type, per_event_price, billing_contact_email, name FROM organisations WHERE id = $1`,
          [event.org_id]
        );
        const org = orgRows[0];
        if (org?.billing_type === "adhoc" && org.per_event_price) {
          const [existingInv] = await rawSql(
            `SELECT id FROM billing_invoices WHERE internal_notes LIKE $1 LIMIT 1`,
            [`%event_id:${input.eventId}%`]
          );
          if (!existingInv.length) {
            const invNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
            const amount = org.per_event_price * 100;
            const taxCents = Math.round(amount * 0.15);
            await rawSql(
              `INSERT INTO billing_invoices (invoice_number, client_id, title, subtotal_cents, tax_percent, tax_cents, total_cents, status, issued_at, internal_notes)
               VALUES ($1, $2, $3, $4, 15, $5, $6, 'pending', NOW(), $7)`,
              [
                invNumber,
                event.org_id,
                `${event.event_name} — ${event.client_name}`,
                amount,
                taxCents,
                amount + taxCents,
                `event_id:${input.eventId}`,
              ]
            );
            invoiceCreated = true;
          }
        } else if (org?.billing_type === "adhoc" && !org.per_event_price) {
          console.warn(`[Dashboard] Adhoc org ${org.name} missing per_event_price — invoice skipped`);
        }
      }

      return { success: true, alreadySent: false, invoiceCreated };
    }),

  getBillingSummary: operatorProcedure.query(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [kpiRows] = await rawSql(
      `SELECT
         COALESCE(SUM(CASE WHEN created_at >= $1 AND status IN ('pending','paid') THEN total_cents ELSE 0 END), 0)::bigint AS revenue_this_month,
         COALESCE(SUM(CASE WHEN created_at >= $2 AND created_at < $1 AND status IN ('pending','paid') THEN total_cents ELSE 0 END), 0)::bigint AS revenue_last_month,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS invoices_pending,
         COUNT(*) FILTER (WHERE status = 'paid' AND created_at >= $1)::int AS events_billed
       FROM billing_invoices`,
      [monthStart, lastMonthStart]
    );

    const kpi = kpiRows[0] ?? {};

    const [orgRows] = await rawSql(
      `SELECT o.id, o.name, o.status, o.billing_type, o.subscription_amount, o.per_event_price,
              o.billing_contact_email, o.ir_contact_email,
              (SELECT bi.status FROM billing_invoices bi WHERE bi.client_id = o.id ORDER BY bi.created_at DESC LIMIT 1) AS latest_invoice_status,
              (SELECT bi.total_cents FROM billing_invoices bi WHERE bi.client_id = o.id ORDER BY bi.created_at DESC LIMIT 1) AS latest_invoice_amount
       FROM organisations o
       WHERE o.status IN ('active', 'pilot', 'demo')
       ORDER BY o.billing_type, o.name`
    );

    return {
      revenueThisMonth: Number(kpi.revenue_this_month ?? 0),
      revenueLastMonth: Number(kpi.revenue_last_month ?? 0),
      invoicesPending: kpi.invoices_pending ?? 0,
      eventsBilled: kpi.events_billed ?? 0,
      organisations: orgRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        billingType: r.billing_type,
        subscriptionAmount: r.subscription_amount,
        perEventPrice: r.per_event_price,
        billingContactEmail: r.billing_contact_email,
        irContactEmail: r.ir_contact_email,
        latestInvoiceStatus: r.latest_invoice_status,
        latestInvoiceAmount: r.latest_invoice_amount ? Number(r.latest_invoice_amount) : null,
      })),
    };
  }),
});
