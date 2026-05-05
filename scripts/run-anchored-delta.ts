import { lookupAnchor } from "../server/services/AnchorLookupService";
import { generateAnchoredDelta } from "../server/services/AnchoredDeltaService";
import { rawSql } from "../server/db";

function mapCommitmentLevel(odrLevel: string): "explicit" | "implied" | "hedged" | "absent" {
  switch (odrLevel?.toUpperCase()) {
    case "CONFIRMED": return "explicit";
    case "INDICATED": return "implied";
    case "QUALIFIED": return "implied";
    case "HEDGED": return "hedged";
    case "AVOIDED": return "absent";
    default: return "implied";
  }
}

async function main() {
  console.log("=== Phase B Step 3A — Anchored Delta Integration Harness ===\n");

  const [rows] = await rawSql(`
    SELECT id, org_id, session_id, speaker_id, topic, commitment_level,
           statement_verbatim, source_date, source_event
    FROM organisation_disclosure_record
    WHERE org_id = 6
      AND commitment_level IN ('CONFIRMED', 'INDICATED', 'QUALIFIED')
      AND topic IS NOT NULL
      AND statement_verbatim IS NOT NULL
    ORDER BY source_date DESC, id DESC
    LIMIT 1
  `);

  if (!rows || rows.length === 0) {
    console.log("NO_ODR_RECORD_FOUND");
    process.exit(1);
  }

  const record = rows[0];
  console.log("ODR_RECORD_SELECTED");
  console.log("  id:               " + record.id);
  console.log("  topic:            " + record.topic);
  console.log("  speaker_id:       " + record.speaker_id);
  console.log("  commitment_level: " + record.commitment_level);
  console.log("  source_date:      " + record.source_date);
  console.log("  statement:        " + record.statement_verbatim + "\n");

  console.log("--- ANCHOR LOOKUP ---");
  const anchor = await lookupAnchor({
    orgId: Number(record.org_id),
    topic: record.topic,
    speaker: record.speaker_id ?? undefined,
    currentTimestamp: new Date(record.source_date),
  });

  if (!anchor.anchor_found) {
    console.log("NO_ANCHOR_FOUND");
    console.log("  reason: " + anchor.reason);
    process.exit(0);
  }

  console.log("ANCHOR_FOUND");
  console.log("  topic=" + anchor.topic + " speaker=" + anchor.speaker);
  console.log("  prior_date:       " + anchor.disclosed_at);
  console.log("  prior_commitment: " + anchor.commitment_level);
  console.log("  prior_statement:  " + anchor.statement + "\n");

  console.log("--- DELTA GENERATION ---");
  const priorCommitmentLevel = mapCommitmentLevel(anchor.commitment_level);
  const currentCommitmentLevel = mapCommitmentLevel(record.commitment_level);
  console.log("  mapped prior:   " + anchor.commitment_level + " -> " + priorCommitmentLevel);
  console.log("  mapped current: " + record.commitment_level + " -> " + currentCommitmentLevel + "\n");

  const delta = await generateAnchoredDelta({
    topic: record.topic,
    speaker: record.speaker_id ?? "Unknown",
    priorStatement: anchor.statement,
    priorCommitmentLevel,
    currentStatement: record.statement_verbatim,
    currentCommitmentLevel,
  });

  if (delta.suppress) {
    console.log("DELTA_SUPPRESSED");
    console.log("  reason: " + delta.reason);
    process.exit(0);
  }

  console.log("DELTA_GENERATED");
  console.log("  change_type: " + delta.change_type);
  console.log("  confidence:  " + delta.confidence);
  console.log("\nSummary:\n  " + delta.summary);
  console.log("\nWhy it matters:\n  " + delta.why_it_matters);
  console.log("\nPrior:\n  \"" + delta.prior_quote + "\"");
  console.log("\nCurrent:\n  \"" + delta.current_quote + "\"");
  console.log("\nIR framing:\n  " + delta.ir_framing);
  console.log("\n=== Phase B Step 3A complete ===");
}

main().catch((err) => {
  console.error("HARNESS_ERROR:", err);
  process.exit(1);
});
