/**
 * SegmentOrchestrator.ts
 * Phase 2A — Real-Time Pipeline Orchestration
 * Receives canonical segments and coordinates AI pipeline execution
 * Patent: Invention Family 4, Claims 18-23
 */

import { rawSql } from "../db";
import { scoreSentiment } from "../aiAnalysis";
import crypto from "crypto";
import { evaluateOutput } from "./DeterministicGovernanceGateway";

// Maximum concurrent LLM calls per session
const MAX_CONCURRENT_LLM_CALLS = 3;

// Pipeline trigger thresholds
const SENTIMENT_INTERVAL = 5;
const SUMMARY_INTERVAL = 10;
const DYNAMICS_INTERVAL = 10;

// In-memory session state for orchestration
const sessionBuffers = new Map<number, {
  segments: Array<{ speaker: string; text: string; segmentIndex: number }>;
  activeLlmCalls: number;
  lastSentimentAt: number;
  lastSummaryAt: number;
  lastDynamicsAt: number;
}>();

function getOrCreateBuffer(sessionId: number) {
  if (!sessionBuffers.has(sessionId)) {
    sessionBuffers.set(sessionId, {
      segments: [],
      activeLlmCalls: 0,
      lastSentimentAt: 0,
      lastSummaryAt: 0,
      lastDynamicsAt: 0,
    });
  }
  return sessionBuffers.get(sessionId)!;
}

export function clearSessionBuffer(sessionId: number) {
  sessionBuffers.delete(sessionId);
  console.log(`[Orchestrator] Session ${sessionId} buffer cleared`);
}

async function writeToIntelligenceFeed(params: {
  sessionId: number;
  canonicalSegmentId: number;
  feedType: string;
  severity: string;
  title: string;
  body: string;
  pipeline: string;
  speaker: string;
  confidenceScore: number;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  try {
    const idempotencyKey = params.idempotencyKey ?? crypto
      .createHash("sha256")
      .update(`${params.sessionId}-${params.pipeline}-${params.canonicalSegmentId}-${params.feedType}`)
      .digest("hex")
      .substring(0, 64);
    console.log(`[Orchestrator] Attempting intelligence_feed write for session ${params.sessionId}, pipeline ${params.pipeline}`);
    await rawSql(
      `INSERT INTO intelligence_feed 
        (session_id, feed_type, severity, title, body, pipeline, speaker, 
         canonical_segment_id, governance_status, confidence_score, metadata, idempotency_key, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, NOW())
       ON CONFLICT DO NOTHING`,
      [
        `shadow-${params.sessionId}`,
        params.feedType,
        params.severity,
        params.title,
        params.body,
        params.pipeline,
        params.speaker,
        params.canonicalSegmentId,
        params.confidenceScore,
        params.metadata ? JSON.stringify(params.metadata) : null,
        idempotencyKey,
      ]
    );
    // Get the inserted row ID and evaluate through governance gateway
    const [inserted] = await rawSql(
      `SELECT id FROM intelligence_feed WHERE session_id = $1 AND pipeline = $2 ORDER BY created_at DESC LIMIT 1`,
      [`shadow-${params.sessionId}`, params.pipeline]
    );
    const feedId = inserted?.[0]?.id;
    if (feedId) {
      void evaluateOutput({
        intelligenceFeedId: feedId,
        sessionId: params.sessionId,
        pipeline: params.pipeline,
        confidenceScore: params.confidenceScore,
        feedType: params.feedType,
        title: params.title,
        body: params.body,
      }).catch(err => console.warn("[Gateway] Evaluation failed:", err?.message));
    }
  } catch (err: any) {
    console.error(`[Orchestrator] FAILED to write to intelligence_feed:`, err?.message, err?.code, JSON.stringify(err));
  }
}

// Pipeline 1 — Compliance Language (every segment, synchronous)
async function runCompliancePipeline(
  sessionId: number,
  canonicalSegmentId: number,
  text: string,
  speaker: string
) {
  try {
    // Compliance keywords — will be replaced by ComplianceEngineService in Phase 2B
    const complianceKeywords = [
      "material information", "inside information", "not yet public",
      "haven't announced", "between us", "off the record",
      "selective disclosure", "mnpi", "non-public"
    ];
    const lowerText = text.toLowerCase();
    const matches = complianceKeywords.filter(k => lowerText.includes(k));
    if (matches.length > 0) {
      await writeToIntelligenceFeed({
        sessionId,
        canonicalSegmentId,
        feedType: "compliance",
        severity: "high",
        title: "Compliance Signal Detected",
        body: `Potential compliance-sensitive language: "${matches.join(", ")}"`,
        pipeline: "compliance",
        speaker,
        confidenceScore: 0.85,
        metadata: { matches, text },
      });
      console.log(`[Orchestrator] Compliance signal detected for session ${sessionId}`);
    }
  } catch (err: any) {
    console.warn(`[Orchestrator] Compliance pipeline error:`, err?.message);
  }
}

// Pipeline 2 — Sentiment Analysis (every 5 segments)
async function runSentimentPipeline(
  sessionId: number,
  canonicalSegmentId: number,
  recentText: string,
  speaker: string,
  buffer: ReturnType<typeof getOrCreateBuffer>
) {
  if (buffer.activeLlmCalls >= MAX_CONCURRENT_LLM_CALLS) {
    console.log(`[Orchestrator] Sentiment skipped — max concurrent LLM calls reached for session ${sessionId}`);
    return;
  }
  buffer.activeLlmCalls++;
  try {
    const sentiment = await scoreSentiment(recentText);
    buffer.lastSentimentAt = buffer.segments.length;
    await writeToIntelligenceFeed({
      sessionId,
      canonicalSegmentId,
      feedType: "sentiment",
      severity: sentiment.score < 30 ? "warning" : "info",
      title: `Sentiment: ${sentiment.label}`,
      body: `Score: ${sentiment.score}/100. Keywords: ${sentiment.keywords?.join(", ") ?? "none"}`,
      pipeline: "sentiment",
      speaker,
      confidenceScore: 0.8,
      metadata: sentiment,
    });
    console.log(`[Orchestrator] Sentiment scored for session ${sessionId}: ${sentiment.label} (${sentiment.score})`);
  } catch (err: any) {
    console.warn(`[Orchestrator] Sentiment pipeline error:`, err?.message);
  } finally {
    buffer.activeLlmCalls--;
  }
}

// Correlation Engine — cross-dimensional signal detection
async function runCorrelationEngine(
  sessionId: number,
  canonicalSegmentId: number,
  buffer: ReturnType<typeof getOrCreateBuffer>
) {
  try {
    const recentSegments = buffer.segments.slice(-5);
    if (recentSegments.length < 2) return;

    const [recentSignals] = await rawSql(
      `SELECT feed_type, pipeline, confidence_score, body, created_at
       FROM intelligence_feed
       WHERE session_id = $1
       AND created_at > NOW() - INTERVAL '2 minutes'
       ORDER BY created_at DESC
       LIMIT 20`,
      [`shadow-${sessionId}`]
    );

    if (!recentSignals || recentSignals.length < 2) return;

    const hasCompliance = recentSignals.some((s: any) => s.pipeline === "compliance");
    const sentimentSignals = recentSignals.filter((s: any) => s.pipeline === "sentiment");
    const latestSentiment = sentimentSignals[0];
    const sentimentScore = latestSentiment?.body?.match(/Score: (\d+)/)?.[1];
    const sentimentValue = sentimentScore ? parseInt(sentimentScore) : null;

    if (hasCompliance && sentimentValue !== null && sentimentValue < 40) {
      await writeToIntelligenceFeed({
        sessionId,
        canonicalSegmentId,
        feedType: "composite",
        severity: "critical",
        title: "⚡ Composite Risk: Compliance + Negative Sentiment",
        body: `Compliance signal detected alongside negative sentiment (${sentimentValue}/100). Elevated concern — review recent statements.`,
        pipeline: "correlation",
        speaker: recentSegments[recentSegments.length - 1]?.speaker ?? "",
        confidenceScore: 0.92,
        metadata: { patterns: ["compliance", "negative_sentiment"], sentimentValue },
      });
      console.log(`[Correlation] Composite risk detected for session ${sessionId}: compliance + negative sentiment`);
    }

    if (sentimentSignals.length >= 2) {
      const scores = sentimentSignals
        .map((s: any) => parseInt(s.body?.match(/Score: (\d+)/)?.[1] ?? "0"))
        .filter((s: number) => s > 0);
      if (scores.length >= 2) {
        const drop = scores[scores.length - 1] - scores[0];
        if (drop < -20) {
          await writeToIntelligenceFeed({
            sessionId,
            canonicalSegmentId,
            feedType: "composite",
            severity: "high",
            title: "⚡ Sentiment Deterioration Pattern",
            body: `Sentiment dropped ${Math.abs(drop)} points across recent segments. Communication stress pattern detected.`,
            pipeline: "correlation",
            speaker: recentSegments[recentSegments.length - 1]?.speaker ?? "",
            confidenceScore: 0.85,
            metadata: { patterns: ["sentiment_drop"], drop, scores },
          });
          console.log(`[Correlation] Sentiment deterioration detected for session ${sessionId}: ${drop} point drop`);
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Correlation] Engine error:`, err?.message);
  }
}

/**
 * Main entry point — called for every canonical segment written
 * This is the heart of the real-time AI system
 */
export async function processSegment(params: {
  sessionId: number;
  canonicalSegmentId: number;
  speaker: string;
  text: string;
  segmentIndex: number;
  ablyChannel?: string;
}) {
  const { sessionId, canonicalSegmentId, speaker, text, segmentIndex } = params;
  const buffer = getOrCreateBuffer(sessionId);

  // Add segment to buffer
  buffer.segments.push({ speaker, text, segmentIndex });
  const totalSegments = buffer.segments.length;

  console.log(`[Orchestrator] Session ${sessionId} — segment ${segmentIndex} received (buffer: ${totalSegments})`);

  // Pipeline 1 — Compliance (every segment, fire-and-forget, non-blocking)
  void runCompliancePipeline(sessionId, canonicalSegmentId, text, speaker).catch(err =>
    console.warn(`[Orchestrator] Compliance pipeline failed:`, err?.message)
  );

  // Pipeline 2 — Sentiment (every 5 segments)
  if (totalSegments % SENTIMENT_INTERVAL === 0 && totalSegments > buffer.lastSentimentAt) {
    const recentText = buffer.segments
      .slice(-SENTIMENT_INTERVAL)
      .map(s => s.text)
      .join(" ");
    void runSentimentPipeline(sessionId, canonicalSegmentId, recentText, speaker, buffer).catch(err =>
      console.warn(`[Orchestrator] Sentiment pipeline failed:`, err?.message)
    );
  }

  void runCorrelationEngine(sessionId, canonicalSegmentId, buffer).catch(err =>
    console.warn("[Correlation] Failed:", err?.message)
  );
}
