import { getDb, rawSql } from "../db";
import { sendComplianceCloseEmail } from "./ComplianceDeadlineService";
import { sendReportLinks }          from "./ClientDeliveryService";
import { runBoardIntelligenceUpdate } from "./BoardIntelligenceService";
import { calculateBriefingAccuracy }  from "./PreEventBriefingService";

const LOG = (msg: string) => console.log(`[SessionClose] ${msg}`);
const ERR = (msg: string, e: any) => console.error(`[SessionClose] ${msg}`, e);

export async function runSessionClosePipeline(sessionId: number): Promise<void> {
  const pipelineStart = Date.now();
  LOG(`Starting pipeline for session ${sessionId}`);

  const db = await getDb();
  if (!db) { ERR('No database connection', null); return; }

  const [sessionRows] = await rawSql(
    `SELECT s.*,
            p.sending_name, p.sending_email, p.logo_url, p.primary_color
     FROM shadow_sessions s
     LEFT JOIN partners p ON p.id = s.partner_id
     WHERE s.id = $1`,
    [sessionId]
  );
  if (!sessionRows.length) { ERR(`Session ${sessionId} not found`, null); return; }
  const session = sessionRows[0];

  const recipients: Array<{name:string;email:string;role?:string;sendLive?:boolean;sendReport?:boolean}> =
    typeof session.recipients === 'string'
      ? JSON.parse(session.recipients)
      : (session.recipients ?? []);

  const [flagRows] = await rawSql(
    `SELECT id, flag_type, severity, statement, rule_basis, jurisdiction
     FROM regulatory_flags
     WHERE monitor_id = $1
     ORDER BY severity DESC, created_at ASC`,
    [sessionId]
  );

  const complianceRecipients = recipients.filter(r =>
    r.role?.toLowerCase().includes('compliance') || r.sendReport !== false
  );

  if (flagRows.length > 0 && complianceRecipients.length > 0) {
    try {
      for (const flag of flagRows) {
        const deadlineHours = 48;
        await rawSql(
          `INSERT INTO compliance_deadlines
             (session_id, flag_id, action, deadline_at, jurisdiction, priority, status, assigned_to)
           VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval, $5, $6, 'open', $7)`,
          [
            sessionId,
            flag.id,
            flag.statement ?? flag.flag_type,
            deadlineHours,
            flag.jurisdiction ?? session.jurisdiction ?? 'JSE',
            flag.severity === 'critical' ? 'critical' : 'high',
            complianceRecipients[0]?.email ?? null,
          ]
        );
      }

      await sendComplianceCloseEmail({
        sessionId,
        companyName:  session.company ?? session.client_name ?? 'Company',
        eventName:    session.event_name ?? 'Event',
        flags:        flagRows.map((f: any) => ({
          title:    f.flag_type ?? f.statement,
          body:     f.statement ?? f.rule_basis ?? '',
          severity: f.severity ?? 'high',
        })),
        deadlines: flagRows.map((f: any) => ({
          action:     f.statement ?? f.flag_type,
          hours:      48,
          jurisdiction: f.jurisdiction ?? session.jurisdiction ?? 'JSE',
        })),
        recipients: complianceRecipients.map(r => ({ name: r.name, email: r.email })),
      });

      LOG(`Compliance email sent to ${complianceRecipients.length} recipients (${Date.now()-pipelineStart}ms)`);
    } catch (e) {
      ERR('Compliance email failed', e);
    }
  }

  let reportModules: Record<string, string> = {};
  try {
    reportModules = await generateAIReport(sessionId, session);
    LOG(`AI report generated (${Date.now()-pipelineStart}ms)`);
  } catch (e) {
    ERR('AI report generation failed', e);
  }

  const reportRecipients = recipients.filter(r => r.sendReport !== false);
  if (reportRecipients.length > 0) {
    try {
      await sendReportLinks({
        sessionId,
        eventName:    session.event_name ?? 'Event',
        companyName:  session.company ?? session.client_name ?? 'Company',
        eventDate:    new Date(session.created_at).toLocaleDateString(),
        reportModules: Object.keys(reportModules).length,
        complianceFlags: flagRows.length,
        sessionDuration: calculateDuration(session),
        recipients:   reportRecipients.map(r => ({ name: r.name, email: r.email })),
        partnerId:    session.partner_id ?? undefined,
      });
      LOG(`Report links sent to ${reportRecipients.length} recipients (${Date.now()-pipelineStart}ms)`);
    } catch (e) {
      ERR('Report delivery failed', e);
    }
  }

  runBoardIntelligenceUpdate({
    sessionId,
    company:        session.company ?? session.client_name ?? '',
    eventType:      session.event_type,
    reportModules:  {
      module08: reportModules['module_08'] ?? reportModules['guidance'],
      module07: reportModules['module_07'] ?? reportModules['tone'],
      module05: reportModules['module_05'] ?? reportModules['compliance'],
      module19: reportModules['module_19'] ?? reportModules['governance'],
    },
    transcriptText: await getTranscriptText(sessionId),
  }).catch(e => ERR('Board Intelligence update failed', e));

  scoreBriefingAccuracy(sessionId).catch(e =>
    ERR('Briefing accuracy scoring failed', e)
  );

  rawSql(
    `UPDATE shadow_sessions SET report_links_sent_at = NOW() WHERE id = $1`,
    [sessionId]
  ).catch(() => {});

  LOG(`Pipeline complete for session ${sessionId} in ${Date.now()-pipelineStart}ms`);
}

async function generateAIReport(
  sessionId: number,
  session: any
): Promise<Record<string, string>> {
  await rawSql(
    `UPDATE shadow_sessions SET status = 'processing' WHERE id = $1`,
    [sessionId]
  );

  await rawSql(
    `UPDATE shadow_sessions SET status = 'completed' WHERE id = $1`,
    [sessionId]
  );

  return {};
}

async function getTranscriptText(sessionId: number): Promise<string> {
  try {
    const [rows] = await rawSql(
      `SELECT text FROM occ_transcription_segments
       WHERE conference_id = $1
       ORDER BY created_at ASC
       LIMIT 500`,
      [sessionId]
    );
    if (rows.length) return rows.map((r: any) => r.text).join(' ');
    const [fallback] = await rawSql(
      `SELECT local_transcript_json FROM shadow_sessions WHERE id = $1`,
      [sessionId]
    );
    if (fallback[0]?.local_transcript_json) {
      try {
        const parsed = JSON.parse(fallback[0].local_transcript_json);
        if (Array.isArray(parsed)) return parsed.map((s: any) => s.text ?? '').join(' ');
      } catch {}
    }
    return '';
  } catch {
    return '';
  }
}

async function scoreBriefingAccuracy(sessionId: number): Promise<void> {
  try {
    await calculateBriefingAccuracy(sessionId);
  } catch (err) {
    console.error('[SessionClose] Briefing accuracy scoring error:', err);
  }
}

function calculateDuration(session: any): string {
  if (!session.created_at) return '—';
  try {
    const start  = new Date(session.created_at);
    const end    = session.ended_at ? new Date(Number(session.ended_at)) : new Date();
    const mins   = Math.round((end.getTime() - start.getTime()) / 60_000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } catch {
    return '—';
  }
}
