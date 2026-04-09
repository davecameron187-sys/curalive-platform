import { getDb, rawSql } from "../db";
import { sendComplianceCloseEmail } from "./ComplianceDeadlineService";
import { sendReportLinks }          from "./ClientDeliveryService";
import { runBoardIntelligenceUpdate } from "./BoardIntelligenceService";
import { calculateBriefingAccuracy }  from "./PreEventBriefingService";
import { checkAICoreHealth, runAICoreAnalysis, runAICoreDriftDetection, generateGovernanceRecord, updateOrgProfile } from "./AICoreClient";
import type { AICoreAnalysisResponse, AICoreDriftResponse, AICoreDriftSourceStatement, AICoreGovernanceResponse, AICoreProfileResponse } from "./AICoreClient";
import { buildCanonicalPayload } from "./AICorePayloadMapper";

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

  let aiCoreResult: AICoreAnalysisResponse | null = null;
  try {
    aiCoreResult = await runAICoreAnalysisStep(sessionId, session);
    if (aiCoreResult) {
      LOG(`AI Core analysis complete: job=${aiCoreResult.job_id} status=${aiCoreResult.overall_status} (${Date.now()-pipelineStart}ms)`);
    }
  } catch (e) {
    ERR('AI Core analysis failed — continuing with legacy pipeline', e);
  }

  if (aiCoreResult && aiCoreResult.overall_status === 'complete') {
    try {
      await runDriftDetectionStep(sessionId, session, aiCoreResult);
    } catch (e) {
      ERR('Drift detection failed — continuing pipeline', e);
    }
  }

  if (aiCoreResult) {
    try {
      await runGovernanceRecordStep(sessionId, session, aiCoreResult);
    } catch (e) {
      ERR('Governance record generation failed — continuing pipeline', e);
    }

    try {
      await runProfileUpdateStep(sessionId, session, aiCoreResult);
    } catch (e) {
      ERR('Profile update failed — continuing pipeline', e);
    }
  }

  let reportModules: Record<string, string> = {};
  try {
    reportModules = await generateAIReportWrapper(sessionId, session);
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

async function generateAIReportWrapper(
  sessionId: number,
  session: any
): Promise<Record<string, string>> {
  await rawSql(
    `UPDATE shadow_sessions SET status = 'processing' WHERE id = $1`,
    [sessionId]
  );

  try {
    const { generateAIReport } = await import("./AIReportPipeline");
    return await generateAIReport(sessionId, session);
  } catch (e) {
    ERR("AIReportPipeline failed — marking completed anyway", e);
    await rawSql(
      `UPDATE shadow_sessions SET status = 'completed' WHERE id = $1`,
      [sessionId]
    );
    return {};
  }
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

async function runDriftDetectionStep(
  sessionId: number,
  session: any,
  aiCoreResult: AICoreAnalysisResponse,
): Promise<void> {
  const organisationId = aiCoreResult.organisation_id;

  const [segRows] = await rawSql(
    `SELECT speaker_name, text, start_time
     FROM occ_transcription_segments
     WHERE conference_id = $1
     ORDER BY created_at ASC
     LIMIT 2000`,
    [sessionId]
  );

  let segments: Array<{ speaker_name: string | null; text: string; start_time: number | null }> = segRows;

  if (segments.length === 0 && session.local_transcript_json) {
    try {
      const parsed = JSON.parse(session.local_transcript_json);
      if (Array.isArray(parsed)) {
        segments = parsed.map((s: any) => ({
          speaker_name: s.speaker ?? s.speaker_name ?? null,
          text: s.text ?? '',
          start_time: s.start_time ?? s.timestamp ?? null,
        }));
      }
    } catch {}
  }

  if (segments.length === 0) {
    LOG('No segments for drift detection — skipping');
    return;
  }

  const statements: AICoreDriftSourceStatement[] = segments.map((seg, idx) => ({
    text: seg.text,
    speaker_id: seg.speaker_name
      ? seg.speaker_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
      : undefined,
    speaker_name: seg.speaker_name ?? undefined,
    source_type: 'transcript',
    source_reference: `session-${sessionId}/segment-${idx}`,
    timestamp: seg.start_time != null ? seg.start_time / 1000 : undefined,
  }));

  await rawSql(
    `UPDATE shadow_sessions SET ai_drift_status = 'running' WHERE id = $1`,
    [sessionId]
  );

  const driftResult = await runAICoreDriftDetection({
    organisation_id: organisationId,
    event_id: `shadow-${sessionId}`,
    job_id: aiCoreResult.job_id,
    statements,
  });

  const driftSummary = {
    commitments_evaluated: driftResult.commitments_evaluated,
    statements_processed: driftResult.statements_processed,
    drift_events_created: driftResult.drift_events_created,
    drift_events: driftResult.drift_events,
    duration_ms: driftResult.duration_ms,
  };

  await rawSql(
    `UPDATE shadow_sessions
     SET ai_drift_status = $1,
         ai_drift_results = $2
     WHERE id = $3`,
    [
      driftResult.drift_events_created > 0 ? 'drift_detected' : 'no_drift',
      JSON.stringify(driftSummary),
      sessionId,
    ]
  );

  LOG(`Drift detection complete: ${driftResult.drift_events_created} drifts across ${driftResult.commitments_evaluated} commitments (${driftResult.duration_ms}ms)`);
}

async function runProfileUpdateStep(
  sessionId: number,
  session: any,
  aiCoreResult: AICoreAnalysisResponse,
): Promise<void> {
  const organisationId = aiCoreResult.organisation_id;

  const profileResult = await updateOrgProfile({
    organisation_id: organisationId,
    event_id: `shadow-${sessionId}`,
    event_name: session.event_name ?? session.company ?? 'Event',
    event_type: session.event_type ?? 'earnings_call',
  });

  const profileSummary = {
    profile_id: profileResult.profile_id,
    version: profileResult.version,
    overall_risk_level: profileResult.profile_summary.overall_risk_level,
    delivery_reliability: profileResult.profile_summary.delivery_reliability,
    relationship_health: profileResult.profile_summary.relationship_health,
    governance_quality: profileResult.profile_summary.governance_quality,
    events_incorporated: profileResult.events_incorporated,
    confidence: profileResult.confidence,
    key_concerns: profileResult.profile_summary.key_concerns,
    key_strengths: profileResult.profile_summary.key_strengths,
  };

  await rawSql(
    `UPDATE shadow_sessions
     SET ai_profile_version = $1,
         ai_profile_summary = $2
     WHERE id = $3`,
    [
      profileResult.version,
      JSON.stringify(profileSummary),
      sessionId,
    ]
  );

  const ps = profileResult.profile_summary;
  LOG(`Profile updated: v${profileResult.version} (risk=${ps.overall_risk_level}, reliability=${ps.delivery_reliability}, health=${ps.relationship_health}, governance=${ps.governance_quality}, ${ps.key_concerns.length} concerns, ${ps.key_strengths.length} strengths)`);
}

async function runGovernanceRecordStep(
  sessionId: number,
  session: any,
  aiCoreResult: AICoreAnalysisResponse,
): Promise<void> {
  const organisationId = aiCoreResult.organisation_id;

  const [segRows] = await rawSql(
    `SELECT speaker_name, text, start_time
     FROM occ_transcription_segments
     WHERE conference_id = $1
     ORDER BY created_at ASC
     LIMIT 2000`,
    [sessionId]
  );

  let segments: Array<{ speaker_name: string | null; text: string; start_time: number | null }> = segRows;

  if (segments.length === 0 && session.local_transcript_json) {
    try {
      const parsed = JSON.parse(session.local_transcript_json);
      if (Array.isArray(parsed)) {
        segments = parsed.map((s: any) => ({
          speaker_name: s.speaker ?? s.speaker_name ?? null,
          text: s.text ?? '',
          start_time: s.start_time ?? s.timestamp ?? null,
        }));
      }
    } catch {}
  }

  const govSegments = segments.map(seg => ({
    speaker_name: seg.speaker_name ?? undefined,
    text: seg.text,
    start_time: seg.start_time != null ? seg.start_time / 1000 : undefined,
    word_count: seg.text.split(/\s+/).length,
  }));

  const govResult = await generateGovernanceRecord({
    organisation_id: organisationId,
    event_id: `shadow-${sessionId}`,
    event_name: session.event_name ?? session.company ?? 'Event',
    event_type: session.event_type ?? 'earnings_call',
    analysis_job_id: aiCoreResult.job_id,
    briefing_id: session.ai_briefing_id ?? undefined,
    segments: govSegments,
    include_matters_arising: true,
  });

  const govSummary = {
    governance_record_id: govResult.governance_record_id,
    record_type: govResult.record_type,
    commitments: govResult.commitment_register.length,
    compliance_flags: govResult.risk_compliance_summary.total_flags,
    matters_arising: govResult.matters_arising.length,
    overall_risk_level: govResult.risk_compliance_summary.overall_risk_level,
    confidence: govResult.confidence,
    duration_ms: govResult.duration_ms,
  };

  await rawSql(
    `UPDATE shadow_sessions
     SET ai_governance_id = $1,
         ai_governance_results = $2
     WHERE id = $3`,
    [
      govResult.governance_record_id,
      JSON.stringify(govSummary),
      sessionId,
    ]
  );

  LOG(`Governance record generated: ${govResult.governance_record_id} (${govResult.commitment_register.length} commitments, ${govResult.risk_compliance_summary.total_flags} flags, ${govResult.matters_arising.length} matters arising, risk=${govResult.risk_compliance_summary.overall_risk_level})`);
}

async function runAICoreAnalysisStep(
  sessionId: number,
  session: any
): Promise<AICoreAnalysisResponse | null> {
  const healthy = await checkAICoreHealth();
  if (!healthy) {
    LOG('AI Core not available — skipping');
    return null;
  }

  const payload = await buildCanonicalPayload(sessionId, session);

  if (payload.canonical_event.segments.length === 0) {
    LOG('No transcript segments — skipping AI Core analysis');
    return null;
  }

  await rawSql(
    `UPDATE shadow_sessions SET ai_core_status = 'running' WHERE id = $1`,
    [sessionId]
  );

  const result = await runAICoreAnalysis(payload);

  const outputsSummary: Record<string, any> = {};
  for (const output of result.outputs) {
    if (output.status === 'ok') {
      outputsSummary[output.module] = output.result;
    }
  }

  await rawSql(
    `UPDATE shadow_sessions
     SET ai_core_job_id = $1,
         ai_core_status = $2,
         ai_core_results = $3
     WHERE id = $4`,
    [
      result.job_id,
      result.overall_status,
      JSON.stringify(outputsSummary),
      sessionId,
    ]
  );

  LOG(`Persisted AI Core results: job=${result.job_id}, modules=${result.modules_completed.length}/${result.modules_requested.length}`);
  return result;
}
