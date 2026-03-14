/**
 * complianceDigestScheduler.ts — Weekly compliance gap analysis digest.
 *
 * Runs every Monday at 08:00 UTC (checked via a 1-hour polling interval).
 * Queries live SOC 2 and ISO 27001 control statuses, computes readiness scores
 * and gap counts, then sends a structured digest notification to the project owner.
 *
 * The scheduler is started from server/_core/index.ts after the HTTP server
 * is ready and runs for the lifetime of the process.
 */

import { getDb } from "./db";
import { soc2Controls, iso27001Controls } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";

const POLL_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

/** Returns true if now is Monday between 08:00–09:00 UTC */
function isMondayDigestWindow(): boolean {
  const now = new Date();
  return now.getUTCDay() === 1 && now.getUTCHours() === 8;
}

/** Compute readiness score from an array of controls */
function computeScore(controls: { status: string }[]): number {
  if (controls.length === 0) return 0;
  const points = controls.reduce((sum, c) => {
    if (c.status === "compliant") return sum + 1;
    if (c.status === "partial") return sum + 0.5;
    if (c.status === "not_applicable") return sum + 1; // N/A doesn't penalise
    return sum;
  }, 0);
  const applicable = controls.filter((c) => c.status !== "not_applicable").length || 1;
  return Math.round((points / applicable) * 100);
}

/** Build a concise markdown digest without calling the LLM (fast path) */
function buildFastDigest(
  soc2: { status: string; name: string; category: string }[],
  iso: { status: string; name: string; clause: string }[]
): string {
  const soc2Score = computeScore(soc2);
  const isoScore = computeScore(iso);

  const soc2Gaps = soc2.filter((c) => c.status === "non_compliant");
  const isoGaps = iso.filter((c) => c.status === "non_compliant");

  const lines: string[] = [
    `## Weekly Compliance Digest`,
    ``,
    `**SOC 2 Readiness:** ${soc2Score}% (${soc2.filter((c) => c.status === "compliant").length}/${soc2.length} compliant, ${soc2Gaps.length} gaps)`,
    `**ISO 27001 Readiness:** ${isoScore}% (${iso.filter((c) => c.status === "compliant").length}/${iso.length} compliant, ${isoGaps.length} gaps)`,
    ``,
  ];

  if (soc2Gaps.length > 0) {
    lines.push(`### SOC 2 Non-Compliant Controls (${soc2Gaps.length})`);
    soc2Gaps.slice(0, 10).forEach((c) => lines.push(`- [${c.category}] ${c.name}`));
    if (soc2Gaps.length > 10) lines.push(`- ...and ${soc2Gaps.length - 10} more`);
    lines.push(``);
  }

  if (isoGaps.length > 0) {
    lines.push(`### ISO 27001 Non-Compliant Controls (${isoGaps.length})`);
    isoGaps.slice(0, 10).forEach((c) => lines.push(`- [${c.clause}] ${c.name}`));
    if (isoGaps.length > 10) lines.push(`- ...and ${isoGaps.length - 10} more`);
    lines.push(``);
  }

  if (soc2Gaps.length === 0 && isoGaps.length === 0) {
    lines.push(`All controls are compliant or partially compliant. No critical gaps this week.`);
  }

  return lines.join("\n");
}

/** Try to enrich the digest with an LLM-generated remediation summary */
async function buildLLMDigest(
  soc2: { status: string; name: string; category: string }[],
  iso: { status: string; name: string; clause: string }[]
): Promise<string> {
  const soc2Score = computeScore(soc2);
  const isoScore = computeScore(iso);
  const soc2Gaps = soc2.filter((c) => c.status === "non_compliant");
  const isoGaps = iso.filter((c) => c.status === "non_compliant");

  const prompt = `You are a compliance advisor. Produce a concise weekly digest (max 300 words) for the project owner.

SOC 2 Readiness: ${soc2Score}% | Non-Compliant: ${soc2Gaps.length}/${soc2.length}
ISO 27001 Readiness: ${isoScore}% | Non-Compliant: ${isoGaps.length}/${iso.length}

Top SOC 2 gaps: ${soc2Gaps.slice(0, 5).map((c) => c.name).join(", ") || "None"}
Top ISO 27001 gaps: ${isoGaps.slice(0, 5).map((c) => c.name).join(", ") || "None"}

Write:
1. A one-sentence overall status (positive or urgent tone based on scores).
2. Top 3 prioritised remediation actions this week (be specific).
3. One sentence on what to celebrate if scores are above 80%.

Keep it factual and actionable. No preamble.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a concise compliance advisor writing a weekly digest for a platform owner." },
        { role: "user", content: prompt },
      ],
    });
    const llmText = response?.choices?.[0]?.message?.content ?? "";
    if (llmText.trim().length > 50) {
      return [
        `## Weekly Compliance Digest`,
        ``,
        `**SOC 2 Readiness:** ${soc2Score}% (${soc2Gaps.length} gaps)`,
        `**ISO 27001 Readiness:** ${isoScore}% (${isoGaps.length} gaps)`,
        ``,
        llmText.trim(),
      ].join("\n");
    }
  } catch (err) {
    console.warn("[ComplianceDigest] LLM call failed, falling back to fast digest:", err);
  }

  return buildFastDigest(soc2, iso);
}

/** Run one digest cycle */
async function runDigest(): Promise<void> {
  console.log("[ComplianceDigest] Running weekly compliance digest...");
  const db = await getDb();
  if (!db) {
    console.warn("[ComplianceDigest] No DB connection — skipping digest");
    return;
  }

  try {
    const [soc2, iso] = await Promise.all([
      db.select({ status: soc2Controls.status, name: soc2Controls.name, category: soc2Controls.category }).from(soc2Controls),
      db.select({ status: iso27001Controls.status, name: iso27001Controls.name, clause: iso27001Controls.clause }).from(iso27001Controls),
    ]);

    if (soc2.length === 0 && iso.length === 0) {
      console.log("[ComplianceDigest] No controls found — skipping digest");
      return;
    }

    const digestContent = await buildLLMDigest(soc2, iso);
    const soc2Score = computeScore(soc2);
    const isoScore = computeScore(iso);
    const soc2Gaps = soc2.filter((c) => c.status === "non_compliant").length;
    const isoGaps = iso.filter((c) => c.status === "non_compliant").length;

    const title = `Weekly Compliance Digest — SOC 2: ${soc2Score}% | ISO 27001: ${isoScore}% | ${soc2Gaps + isoGaps} gaps`;

    const sent = await notifyOwner({ title, content: digestContent });
    if (sent) {
      console.log(`[ComplianceDigest] Digest sent successfully (SOC2=${soc2Score}%, ISO=${isoScore}%, gaps=${soc2Gaps + isoGaps})`);
    } else {
      console.warn("[ComplianceDigest] Digest notification delivery failed");
    }
  } catch (err) {
    console.error("[ComplianceDigest] Error running digest:", err);
  }
}

let _lastDigestDate: string | null = null;

/** Polling loop — checks every hour whether it's time to send the Monday digest */
async function pollLoop(): Promise<void> {
  if (isMondayDigestWindow()) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (_lastDigestDate !== today) {
      _lastDigestDate = today;
      await runDigest();
    }
  }
  setTimeout(pollLoop, POLL_INTERVAL_MS);
}

/**
 * Start the compliance digest scheduler.
 * Call this once from server/_core/index.ts after the HTTP server is ready.
 */
export function startComplianceDigestScheduler(): void {
  console.log("[ComplianceDigest] Scheduler started — digest runs every Monday at 08:00 UTC");
  // Delay the first check by 30 seconds to let the server fully start
  setTimeout(pollLoop, 30_000);
}
