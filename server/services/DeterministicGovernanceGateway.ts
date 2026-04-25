/**
 * DeterministicGovernanceGateway.ts
 * Phase 2F — Deterministic Governance Gateway
 * Evaluates every intelligence_feed output against four criteria
 * before authorising it for operator/client display.
 * Patent: Embodiment 1, Claims throughout
 * 
 * CuraLive DETECTS → CLASSIFIES → DELIVERS. The CLIENT decides.
 * This gateway ensures every output is governed, explainable, and auditable.
 */

import { rawSql } from "../db";
import crypto from "crypto";
import { publishFeedItem } from "./IntelligenceFeedPublisher";

// Gateway configuration per pipeline
const GATEWAY_CONFIG: Record<string, {
  minConfidence: number;
  minObservations: number;
  maxFailureRate: number;
  minStabilityScore: number;
  isComplianceCritical: boolean;
}> = {
  compliance: {
    minConfidence: 0.80,
    minObservations: 1,
    maxFailureRate: 0.20,
    minStabilityScore: 0.70,
    isComplianceCritical: true,
  },
  sentiment: {
    minConfidence: 0.70,
    minObservations: 1,
    maxFailureRate: 0.30,
    minStabilityScore: 0.60,
    isComplianceCritical: false,
  },
  correlation: {
    minConfidence: 0.85,
    minObservations: 1,
    maxFailureRate: 0.20,
    minStabilityScore: 0.75,
    isComplianceCritical: true,
  },
  evasiveness: {
    minConfidence: 0.75,
    minObservations: 2,
    maxFailureRate: 0.25,
    minStabilityScore: 0.65,
    isComplianceCritical: false,
  },
  default: {
    minConfidence: 0.70,
    minObservations: 1,
    maxFailureRate: 0.30,
    minStabilityScore: 0.60,
    isComplianceCritical: false,
  },
};

interface GatewayDecision {
  decision: "authorised" | "withheld" | "pending_review";
  stabilityScore: number;
  observationCount: number;
  failureRate: number;
  reasonCode: string | null;
}

async function computeStabilityScore(
  pipeline: string,
  sessionId: number
): Promise<{ stabilityScore: number; observationCount: number; failureRate: number }> {
  try {
    // Get recent outputs from this pipeline for this session
    const [rows] = await rawSql(
      `SELECT confidence_score, governance_status, created_at
       FROM intelligence_feed
       WHERE session_id = $1
       AND pipeline = $2
       AND created_at > NOW() - INTERVAL '30 minutes'
       ORDER BY created_at DESC
       LIMIT 20`,
      [`shadow-${sessionId}`, pipeline]
    );

    if (!rows || rows.length === 0) {
      return { stabilityScore: 0.5, observationCount: 0, failureRate: 0 };
    }

    const observationCount = rows.length;
    const avgConfidence = rows.reduce((sum: number, r: any) =>
      sum + (r.confidence_score ?? 0.5), 0) / observationCount;

    // Decay function — recent observations weighted more
    const decayedEvidence = rows.reduce((sum: number, r: any, i: number) => {
      const weight = Math.pow(0.9, i); // 10% decay per observation back
      return sum + (r.confidence_score ?? 0.5) * weight;
    }, 0) / rows.length;

    const withheldCount = rows.filter((r: any) =>
      r.governance_status === "withheld").length;
    const failureRate = withheldCount / observationCount;

    const consistencyRate = avgConfidence > 0.6 ? 1 : avgConfidence / 0.6;
    const stabilityScore = (decayedEvidence * 0.5) +
      (consistencyRate * 0.3) +
      ((1 - failureRate) * 0.2);

    return {
      stabilityScore: Math.min(1, Math.max(0, stabilityScore)),
      observationCount,
      failureRate,
    };
  } catch {
    return { stabilityScore: 0.5, observationCount: 0, failureRate: 0 };
  }
}

function evaluateCriteria(
  pipeline: string,
  confidenceScore: number,
  stabilityScore: number,
  observationCount: number,
  failureRate: number
): GatewayDecision {
  const config = GATEWAY_CONFIG[pipeline] ?? GATEWAY_CONFIG.default;

  // Criterion 1 — Confidence Score
  if (confidenceScore < config.minConfidence) {
    return {
      decision: "withheld",
      stabilityScore,
      observationCount,
      failureRate,
      reasonCode: "LOW_CONFIDENCE",
    };
  }

  // Criterion 2 — Minimum Observation Count
  if (observationCount < config.minObservations) {
    return {
      decision: "pending_review",
      stabilityScore,
      observationCount,
      failureRate,
      reasonCode: "INSUFFICIENT_OBSERVATIONS",
    };
  }

  // Criterion 3 — Failure Rate Ceiling
  if (failureRate > config.maxFailureRate) {
    return {
      decision: "withheld",
      stabilityScore,
      observationCount,
      failureRate,
      reasonCode: "HIGH_FAILURE_RATE",
    };
  }

  // Criterion 4 — Stability Score
  if (stabilityScore < config.minStabilityScore) {
    return {
      decision: "pending_review",
      stabilityScore,
      observationCount,
      failureRate,
      reasonCode: "LOW_STABILITY",
    };
  }

  // Compliance critical elevation check
  if (config.isComplianceCritical && observationCount < 1) {
    return {
      decision: "pending_review",
      stabilityScore,
      observationCount,
      failureRate,
      reasonCode: "COMPLIANCE_CRITICAL_PENDING",
    };
  }

  return {
    decision: "authorised",
    stabilityScore,
    observationCount,
    failureRate,
    reasonCode: null,
  };
}

async function recordGatewayDecision(
  intelligenceFeedId: number,
  sessionId: number,
  pipeline: string,
  gatewayDecision: GatewayDecision,
  inputSnapshot: Record<string, unknown>
): Promise<void> {
  try {
    // Compute chain hash for tamper detection
    const [lastRow] = await rawSql(
      `SELECT chain_hash FROM governance_decisions
       WHERE session_id = $1
       ORDER BY decided_at DESC LIMIT 1`,
      [sessionId]
    );
    const previousHash = lastRow?.[0]?.chain_hash ?? "genesis";
    const chainInput = `${previousHash}-${intelligenceFeedId}-${gatewayDecision.decision}-${Date.now()}`;
    const chainHash = crypto.createHash("sha256").update(chainInput).digest("hex");

    await rawSql(
      `INSERT INTO governance_decisions
        (session_id, decision_type, input_snapshot, decision, confidence_score,
         reasoning, intelligence_feed_id, pipeline_id, stability_score,
         observation_count, failure_rate, reason_code, previous_hash, chain_hash, decided_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
      [
        sessionId,
        "pipeline_output",
        JSON.stringify(inputSnapshot),
        gatewayDecision.decision,
        gatewayDecision.stabilityScore,
        gatewayDecision.reasonCode ?? "PASSED",
        intelligenceFeedId,
        pipeline,
        gatewayDecision.stabilityScore,
        gatewayDecision.observationCount,
        gatewayDecision.failureRate,
        gatewayDecision.reasonCode,
        previousHash,
        chainHash,
      ]
    );
  } catch (err: any) {
    console.warn(`[Gateway] Failed to record decision:`, err?.message);
  }
}

/**
 * Main gateway evaluation function.
 * Called after every intelligence_feed write.
 * Updates governance_status on the feed item.
 * Records full decision in governance_decisions.
 */
export async function evaluateOutput(params: {
  intelligenceFeedId: number;
  sessionId: number;
  pipeline: string;
  confidenceScore: number;
  feedType: string;
  title: string;
  body: string;
}): Promise<"authorised" | "withheld" | "pending_review"> {
  try {
    const { stabilityScore, observationCount, failureRate } =
      await computeStabilityScore(params.pipeline, params.sessionId);

    const gatewayDecision = evaluateCriteria(
      params.pipeline,
      params.confidenceScore,
      stabilityScore,
      observationCount,
      failureRate
    );

    // Update intelligence_feed governance_status
    await rawSql(
      `UPDATE intelligence_feed SET governance_status = $1 WHERE id = $2`,
      [gatewayDecision.decision, params.intelligenceFeedId]
    );

    // Record full audit trail
    await recordGatewayDecision(
      params.intelligenceFeedId,
      params.sessionId,
      params.pipeline,
      gatewayDecision,
      {
        feedType: params.feedType,
        title: params.title,
        confidenceScore: params.confidenceScore,
        pipeline: params.pipeline,
      }
    );

    console.log(`[Gateway] Session ${params.sessionId} — ${params.pipeline} → ${gatewayDecision.decision}${gatewayDecision.reasonCode ? ` (${gatewayDecision.reasonCode})` : ""}`);
    void publishFeedItem({
      sessionId: params.sessionId,
      feedItemId: params.intelligenceFeedId,
      feedType: params.feedType,
      severity: "medium",
      title: params.title,
      body: params.body,
      pipeline: params.pipeline,
      decision: gatewayDecision.decision,
    }).catch(err => console.error("[FeedPublisher] publish failed:", err?.message));

    return gatewayDecision.decision;
  } catch (err: any) {
    console.warn(`[Gateway] Evaluation failed:`, err?.message);
    return "pending_review";
  }
}
