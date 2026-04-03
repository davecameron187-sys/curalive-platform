import { rawSql } from "../db";
import { buildComplianceCloseEmail } from "../emails/templates";

export async function sendComplianceCloseEmail(opts: {
  sessionId: number;
  companyName: string;
  eventName: string;
  flags: { title: string; body: string; severity: string }[];
  deadlines: { action: string; hours: number; jurisdiction: string }[];
  recipients: { name: string; email: string }[];
}) {
  for (const recipient of opts.recipients) {
    const html = buildComplianceCloseEmail({
      recipientName: recipient.name,
      companyName: opts.companyName,
      eventName: opts.eventName,
      flags: opts.flags,
      deadlines: opts.deadlines,
    });

    try {
      const { sendEmail } = await import("../_core/email");
      await sendEmail({
        to: recipient.email,
        subject: `COMPLIANCE ALERT — ${opts.eventName} — Immediate Action Required`,
        html,
      });
      console.log(`[ComplianceDeadline] Compliance email sent to ${recipient.email}`);
    } catch (err: any) {
      console.warn(`[ComplianceDeadline] Failed to send to ${recipient.email}:`, err?.message);
    }
  }
}

export async function createComplianceDeadline(opts: {
  sessionId: number;
  action: string;
  deadlineHours: number;
  jurisdiction: string;
  assignedTo?: string;
  priority: string;
}) {
  try {
    await rawSql(
      `INSERT INTO compliance_deadlines (session_id, action, jurisdiction, deadline_at, priority, assigned_to)
       VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::INTERVAL, $5, $6)`,
      [opts.sessionId, opts.action, opts.jurisdiction, String(opts.deadlineHours), opts.priority, opts.assignedTo || null]
    );
    console.log(`[ComplianceDeadline] Created: "${opts.action}" due in ${opts.deadlineHours}h (${opts.jurisdiction})`);
  } catch (err: any) {
    console.error(`[ComplianceDeadline] Failed to create deadline:`, err?.message);
  }
}

export function startComplianceDeadlineMonitor() {
  console.log("[ComplianceDeadlineMonitor] Started — checking every 15 minutes");

  async function check() {
    try {
      const [overdue] = await rawSql(
        `SELECT id, session_id, action, jurisdiction, deadline_at, assigned_to, priority
         FROM compliance_deadlines
         WHERE status = 'pending' AND deadline_at < NOW() AND escalated_at IS NULL`,
        []
      );

      if (overdue.length > 0) {
        console.log(`[ComplianceDeadlineMonitor] ${overdue.length} overdue deadlines found — escalating`);
        for (const d of overdue) {
          await rawSql(
            `UPDATE compliance_deadlines SET escalated_at = NOW(), status = 'escalated' WHERE id = $1`,
            [d.id]
          );
          console.log(`[ComplianceDeadlineMonitor] Escalated: "${d.action}" (${d.jurisdiction}) — was due ${d.deadline_at}`);
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes("does not exist")) {
        console.warn("[ComplianceDeadlineMonitor] Check error:", err?.message);
      }
    }
  }

  check();
  setInterval(check, 15 * 60 * 1000);
}
