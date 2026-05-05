import { rawSql } from "../server/db";

async function main() {
  const sessionId = process.argv[2] || "186";
  const shadowId = "shadow-" + sessionId;

  console.log("=== Phase B Step 3C — Anchored vs Raw Comparison ===");
  console.log("Session: " + sessionId + " (" + shadowId + ")\n");

  const [rawSignals] = await rawSql(`
    SELECT feed_type, pipeline, severity, title, body, created_at
    FROM intelligence_feed
    WHERE session_id = $1
    ORDER BY created_at ASC
  `, [shadowId]);

  const [anchoredDeltas] = await rawSql(`
    SELECT topic, change_type, confidence, summary, why_it_matters, created_at
    FROM anchored_deltas
    WHERE session_id = $1
    ORDER BY created_at ASC
  `, [parseInt(sessionId)]);

  console.log("RAW SIGNALS (" + (rawSignals?.length ?? 0) + "):");
  if (!rawSignals || rawSignals.length === 0) {
    console.log("  none");
  } else {
    const grouped: Record<string, number> = {};
    for (const s of rawSignals) {
      const key = "[" + (s.pipeline || s.feed_type) + "] " + s.title;
      grouped[key] = (grouped[key] || 0) + 1;
    }
    for (const [key, count] of Object.entries(grouped)) {
      const suffix = count > 1 ? " (x" + count + ")" : "";
      console.log("  - " + key + suffix);
    }
  }

  console.log("\nANCHORED DELTAS (" + (anchoredDeltas?.length ?? 0) + "):");
  if (!anchoredDeltas || anchoredDeltas.length === 0) {
    console.log("  none — no prior anchors exist for this session period");
  } else {
    for (const d of anchoredDeltas) {
      console.log("  - " + d.change_type + " [" + d.confidence + "]: " + d.topic);
      console.log("    " + d.summary);
      console.log("    Why it matters: " + d.why_it_matters);
    }
  }

  console.log("\nOBSERVATION:");
  const rawCount = rawSignals?.length ?? 0;
  const deltaCount = anchoredDeltas?.length ?? 0;

  if (deltaCount === 0) {
    console.log("  - Anchored deltas: NONE for this session");
    console.log("  - Reason: no prior ODR anchors exist for session " + sessionId);
    console.log("  - Raw feed produces " + rawCount + " signals — unfiltered pipeline output");
    console.log("  - Evidence: INSUFFICIENT for replace vs hybrid decision");
  } else {
    const ratio = (rawCount / deltaCount).toFixed(1);
    console.log("  - Raw feed: " + rawCount + " signals");
    console.log("  - Anchored deltas: " + deltaCount + " signals");
    console.log("  - Compression ratio: " + ratio + ":1");
    console.log("  - Decision: NOT MADE — evidence collection only");
  }

  console.log("\n=== Comparison complete ===");
}

main().catch((err) => {
  console.error("COMPARISON_ERROR:", err);
  process.exit(1);
});
