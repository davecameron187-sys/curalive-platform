import { processSegment } from "../server/services/SegmentOrchestrator";
import { rawSql } from "../server/db";

async function run() {
  const SESSION_ID = 164;
  const ABLY_CHANNEL = "shadow-164-1776968450179";

  console.log("=== CuraLive Ably Pipeline Test ===");
  console.log("Session: " + SESSION_ID);
  console.log("Channel: curalive-event-" + ABLY_CHANNEL);

  const [rows] = await rawSql(
    "INSERT INTO canonical_event_segments (session_id, speaker, text, segment_index, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id",
    [164, "CEO", "We are projecting strong forward guidance for Q2 2026. Revenue growth remains on track.", 9999]
  );

  const canonicalSegmentId = rows?.[0]?.id;
  if (!canonicalSegmentId) {
    console.error("FAIL: no canonical segment");
    process.exit(1);
  }
  console.log("[1] Canonical segment id=" + canonicalSegmentId);

  await processSegment({
    sessionId: SESSION_ID,
    canonicalSegmentId,
    speaker: "CEO",
    text: "We are projecting strong forward guidance for Q2 2026. Revenue growth remains on track.",
    segmentIndex: 9999,
    ablyChannel: ABLY_CHANNEL,
  });
  console.log("[2] processSegment fired");

  console.log("[3] Waiting 15 seconds for pipeline...");
  await new Promise(res => setTimeout(res, 15000));

  const [feedRows] = await rawSql(
    "SELECT id, feed_type, severity, title, governance_status FROM intelligence_feed WHERE session_id = 'shadow-164' ORDER BY created_at DESC LIMIT 5",
    []
  );

  console.log("[4] Feed items:");
  feedRows?.forEach((r: any) => {
    console.log("  id=" + r.id + " type=" + r.feed_type + " governance=" + r.governance_status + " title=" + r.title);
  });

  console.log("=== DONE ===");
  process.exit(0);
}

run().catch(err => {
  console.error("FAILED", err);
  process.exit(1);
});