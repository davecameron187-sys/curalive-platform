import { rawSql } from "../db";
import { lookupAnchor } from "./AnchorLookupService";
import { generateAnchoredDelta } from "./AnchoredDeltaService";

export async function runAnchoredDeltaShadow(orgId: number, sessionId?: number): Promise<void> {
  console.log("[AnchoredDeltaShadow] Starting shadow run for org_id=" + orgId);

  const [records] = await rawSql(`
    SELECT DISTINCT ON (topic, speaker_id)
      id, org_id, session_id, speaker_id, topic,
      commitment_level, statement, source_date, source_event
    FROM organisation_disclosure_record
    WHERE org_id = $1
      AND commitment_level IN ('CONFIRMED', 'INDICATED', 'QUALIFIED')
      AND topic IS NOT NULL
      AND statement IS NOT NULL
      ${sessionId ? 'AND session_id = ' + sessionId : ''}
    ORDER BY topic, speaker_id, source_date DESC
  `, [orgId]);

  if (!records || records.length === 0) {
    console.log("[AnchoredDeltaShadow] No eligible ODR records found");
    return;
  }

  console.log("[AnchoredDeltaShadow] Processing " + records.length + " ODR records");

  let generated = 0;
  let suppressed = 0;
  let noAnchor = 0;

  for (const record of records) {
    const anchor = await lookupAnchor({
      orgId: Number(record.org_id),
      topic: record.topic,
      speaker: record.speaker_id ?? undefined,
      currentTimestamp: new Date(record.source_date),
      currentSessionId: Number(record.session_id),
    });

    if (!anchor.anchor_found) {
      console.log("[AnchoredDeltaShadow] NO_ANCHOR topic=" + record.topic + " speaker=" + record.speaker_id);
      noAnchor++;
      continue;
    }

    console.log("[AnchoredDeltaShadow] ANCHOR_FOUND topic=" + record.topic + " prior_date=" + anchor.disclosed_at);

    const priorLevel = mapCommitmentLevel(anchor.commitment_level);
    const currentLevel = mapCommitmentLevel(record.commitment_level);

    const delta = await generateAnchoredDelta({
      topic: record.topic,
      speaker: record.speaker_id ?? "Unknown",
      priorStatement: anchor.statement,
      priorCommitmentLevel: priorLevel,
      currentStatement: record.statement,
      currentCommitmentLevel: currentLevel,
    });

    if (delta.suppress) {
      console.log("[AnchoredDeltaShadow] SUPPRESSED topic=" + record.topic + " reason=" + delta.reason);
      suppressed++;
      continue;
    }

    await rawSql(`
      INSERT INTO anchored_deltas
        (org_id, session_id, topic, change_type, confidence,
         summary, why_it_matters, prior_quote, current_quote,
         ir_framing, anchor_source_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      orgId,
      sessionId ?? record.session_id,
      record.topic,
      delta.change_type,
      delta.confidence,
      delta.summary,
      delta.why_it_matters,
      delta.prior_quote,
      delta.current_quote,
      delta.ir_framing,
      anchor.disclosed_at,
    ]);

    console.log("[AnchoredDeltaShadow] DELTA_WRITTEN topic=" + record.topic + " change_type=" + delta.change_type + " confidence=" + delta.confidence);
    generated++;
  }

  console.log("[AnchoredDeltaShadow] Complete — generated=" + generated + " suppressed=" + suppressed + " no_anchor=" + noAnchor);
}

function mapCommitmentLevel(level: string): "explicit" | "implied" | "hedged" | "absent" {
  switch (level?.toUpperCase()) {
    case "CONFIRMED": return "explicit";
    case "INDICATED": return "implied";
    case "QUALIFIED": return "implied";
    case "HEDGED": return "hedged";
    case "AVOIDED": return "absent";
    default: return "implied";
  }
}
