import { getDb, rawSql } from "../db";
import { invokeLLM } from "../_core/llm";

interface BoardIntelligenceUpdateOpts {
  sessionId:     number;
  company:       string;
  eventType?:    string;
  reportModules?: {
    module08?: string;
    module07?: string;
    module05?: string;
    module19?: string;
  };
  transcriptText?: string;
}

export async function runBoardIntelligenceUpdate(
  opts: BoardIntelligenceUpdateOpts
): Promise<void> {
  const startTime = Date.now();
  const db = await getDb();
  if (!db) return;

  console.log(`[BoardIntelligence] Starting update for session ${opts.sessionId} — ${opts.company}`);

  try {
    await Promise.allSettled([
      extractAndSaveNewCommitments(opts),
      verifyPriorCommitments(opts),
      logBoardMemberActivity(opts),
    ]);

    await updateGovernanceScore(opts);

    const elapsed = Date.now() - startTime;
    console.log(`[BoardIntelligence] Completed for session ${opts.sessionId} in ${elapsed}ms`);

  } catch (err) {
    console.error(`[BoardIntelligence] Error for session ${opts.sessionId}:`, err);
  }
}

async function extractAndSaveNewCommitments(
  opts: BoardIntelligenceUpdateOpts
): Promise<void> {
  const db = await getDb();
  if (!db || !opts.reportModules?.module08) return;

  try {
    let module08Data: any;
    try {
      module08Data = typeof opts.reportModules.module08 === 'string'
        ? JSON.parse(opts.reportModules.module08)
        : opts.reportModules.module08;
    } catch {
      const extractPrompt = `Extract all forward guidance statements, capital commitments, and management promises from this text.

TEXT:
${opts.reportModules.module08}

Return a JSON array. Each item must have:
- commitment (string): the exact commitment or guidance statement
- committedBy (string): speaker name/role if identifiable, otherwise "Management"
- deadline (string|null): specific date or timeframe if mentioned, null if not
- type (string): "guidance" | "commitment" | "promise"

Return ONLY the JSON array, no other text.`;

      const result = await invokeLLM({ messages: [{ role: 'user', content: extractPrompt }] });
      const response = result.content;
      try {
        module08Data = { commitments: JSON.parse(response) };
      } catch {
        return;
      }
    }

    const commitments: any[] = Array.isArray(module08Data)
      ? module08Data
      : (module08Data?.commitments ?? module08Data?.guidanceChanges ?? []);

    if (!commitments.length) return;

    let saved = 0;
    for (const c of commitments) {
      if (!c.commitment || c.commitment.trim().length < 10) continue;

      let deadlineDate: Date | undefined;
      if (c.deadline) {
        const parsed = parseFuzzyDeadline(c.deadline);
        if (parsed) deadlineDate = parsed;
      }

      try {
        await rawSql(
          `INSERT INTO historical_commitments
             (company, event_type, event_date, commitment, committed_by, deadline, status, verified_in_session_id)
           VALUES ($1, $2, NOW(), $3, $4, $5, 'open', $6)`,
          [
            opts.company,
            opts.eventType ?? 'earnings_call',
            c.commitment.trim(),
            c.committedBy ?? 'Management',
            deadlineDate ?? null,
            opts.sessionId,
          ]
        );
        saved++;
      } catch {
        // Skip duplicates or constraint errors
      }
    }

    console.log(`[BoardIntelligence] Saved ${saved} new commitments for ${opts.company}`);

  } catch (err) {
    console.error('[BoardIntelligence] extractAndSaveNewCommitments error:', err);
  }
}

async function verifyPriorCommitments(
  opts: BoardIntelligenceUpdateOpts
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const [openCommitments] = await rawSql(
      `SELECT id, commitment, committed_by, deadline, status
       FROM historical_commitments
       WHERE company = $1 AND status = 'open'
       ORDER BY COALESCE(event_date, created_at) DESC
       LIMIT 20`,
      [opts.company]
    );

    if (!openCommitments.length) return;

    const transcriptContext = opts.transcriptText ?? opts.reportModules?.module08 ?? '';
    if (!transcriptContext || transcriptContext.length < 100) return;

    const verifyPrompt = `You are an IR analyst reviewing whether prior management commitments were addressed in a recent event.

PRIOR OPEN COMMITMENTS:
${openCommitments.map((c: any, i: number) =>
  `${i + 1}. [ID:${c.id}] "${c.commitment}" (by ${c.committed_by || 'Management'})`
).join('\n')}

CURRENT EVENT TRANSCRIPT/REPORT:
${transcriptContext.slice(0, 3000)}

For each commitment, determine if it was:
- "met": explicitly addressed and confirmed or delivered
- "partial": mentioned but only partially addressed
- "at_risk": was expected and not mentioned at all
- "open": not relevant to this event yet

Return a JSON array with objects: { id: number, status: "met"|"partial"|"at_risk"|"open", evidence: string }
Return ONLY the JSON array.`;

    const verifyResult = await invokeLLM({ messages: [{ role: 'user', content: verifyPrompt }] });
    const response = verifyResult.content;

    let verifications: Array<{ id: number; status: string; evidence: string }>;
    try {
      verifications = JSON.parse(response);
    } catch {
      return;
    }

    for (const v of verifications) {
      if (!v.id || !v.status || v.status === 'open') continue;

      const validStatuses = ['met', 'partial', 'at_risk'];
      if (!validStatuses.includes(v.status)) continue;

      await rawSql(
        `UPDATE historical_commitments
         SET status = $1, verified_in_session_id = $2
         WHERE id = $3 AND company = $4`,
        [v.status, opts.sessionId, v.id, opts.company]
      );
    }

    const updated = verifications.filter(v => v.status !== 'open').length;
    console.log(`[BoardIntelligence] Verified ${updated} prior commitments for ${opts.company}`);

  } catch (err) {
    console.error('[BoardIntelligence] verifyPriorCommitments error:', err);
  }
}

async function logBoardMemberActivity(
  opts: BoardIntelligenceUpdateOpts
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const [members] = await rawSql(
      `SELECT id, name, company FROM board_members WHERE company = $1 AND active = true`,
      [opts.company]
    );

    if (!members.length) return;
    if (!opts.transcriptText) return;

    const [flagRows] = await rawSql(
      `SELECT speaker, COUNT(*)::int as flag_count, flag_type
       FROM regulatory_flags
       WHERE monitor_id IN (
         SELECT id FROM shadow_sessions WHERE id = $1
       )
       GROUP BY speaker, flag_type`,
      [opts.sessionId]
    );

    const [segmentRows] = await rawSql(
      `SELECT speaker, COUNT(*)::int as segments
       FROM occ_transcription_segments
       WHERE conference_id IN (
         SELECT id FROM shadow_sessions WHERE id = $1
       )
       GROUP BY speaker`,
      [opts.sessionId]
    );

    for (const member of members) {
      const memberName = (member.name || '').toLowerCase();
      if (!memberName) continue;

      const speakerSegments = segmentRows.find((r: any) =>
        r.speaker?.toLowerCase().includes(memberName.split(' ')[0]) ||
        r.speaker?.toLowerCase().includes(memberName.split(' ').slice(-1)[0])
      );

      if (!speakerSegments) continue;

      const memberFlags = flagRows.filter((r: any) =>
        r.speaker?.toLowerCase().includes(memberName.split(' ')[0])
      );
      const totalFlags = memberFlags.reduce((s: number, r: any) => s + Number(r.flag_count), 0);

      await rawSql(
        `UPDATE board_members
         SET notes = COALESCE(notes, '') || $1
         WHERE id = $2`,
        [
          `\n[Session ${opts.sessionId} — ${new Date().toISOString().slice(0, 10)}] Spoke: ${speakerSegments.segments} segments. Compliance flags: ${totalFlags}.`,
          member.id,
        ]
      );
    }

  } catch (err) {
    console.error('[BoardIntelligence] logBoardMemberActivity error:', err);
  }
}

async function updateGovernanceScore(
  opts: BoardIntelligenceUpdateOpts
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const [stats] = await rawSql(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open')::int    as open_count,
         COUNT(*) FILTER (WHERE status = 'met')::int     as met_count,
         COUNT(*) FILTER (WHERE status = 'missed')::int  as missed_count,
         COUNT(*) FILTER (WHERE status = 'partial')::int as partial_count,
         COUNT(*) FILTER (WHERE status = 'at_risk')::int as at_risk_count,
         COUNT(*)::int                                   as total_count
       FROM historical_commitments
       WHERE company = $1`,
      [opts.company]
    );

    const s = stats[0];
    if (!s || Number(s.total_count) === 0) return;

    const total   = Number(s.total_count);
    const met     = Number(s.met_count);
    const partial = Number(s.partial_count);
    const missed  = Number(s.missed_count);
    const atRisk  = Number(s.at_risk_count);

    const rawScore = ((met * 100) + (partial * 60) - (missed * 100) - (atRisk * 40)) / total;
    const score    = Math.max(0, Math.min(100, Math.round(rawScore)));

    const [flagStats] = await rawSql(
      `SELECT COUNT(*)::int as flag_count
       FROM regulatory_flags rf
       WHERE rf.created_at > NOW() - INTERVAL '90 days'`,
      []
    );
    const recentFlags = Number(flagStats[0]?.flag_count ?? 0);

    const compliancePenalty = Math.min(20, recentFlags * 2);
    const finalScore = Math.max(0, score - compliancePenalty);

    await rawSql(
      `INSERT INTO agm_governance_scores (session_id, company, overall_score, calculated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (company) DO UPDATE
       SET overall_score = $3, calculated_at = NOW()`,
      [opts.sessionId, opts.company, finalScore]
    );

    console.log(`[BoardIntelligence] Governance score for ${opts.company}: ${finalScore}/100`);

  } catch (err) {
    console.error('[BoardIntelligence] updateGovernanceScore error:', err);
  }
}

function parseFuzzyDeadline(str: string): Date | undefined {
  if (!str) return undefined;
  const s = str.toLowerCase();
  const now = new Date();

  if (s.includes('q1')) return new Date(now.getFullYear(), 2, 31);
  if (s.includes('q2')) return new Date(now.getFullYear(), 5, 30);
  if (s.includes('q3')) return new Date(now.getFullYear(), 8, 30);
  if (s.includes('q4')) return new Date(now.getFullYear(), 11, 31);
  if (s.includes('full year') || s.includes('year end')) return new Date(now.getFullYear(), 11, 31);
  if (s.includes('half year') || s.includes('h1')) return new Date(now.getFullYear(), 5, 30);
  if (s.includes('h2')) return new Date(now.getFullYear(), 11, 31);

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return undefined;
}
