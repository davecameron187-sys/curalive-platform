/**
 * SegmentOrchestrator.ts
 * Phase 2A — Real-Time Pipeline Orchestration
 * Receives canonical segments and coordinates AI pipeline execution
 * Patent: Invention Family 4, Claims 18-23
 */

import { rawSql } from "../db";
import { scoreSentiment } from "../aiAnalysis";

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
}) {
  try {
    await rawSql(
      `INSERT INTO intelligence_feed 
        (session_id, feed_type, severity, title, body, pipeline, speaker, 
         canonical_segment_id, governance_status, confidence_score, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, NOW())`,
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
      ]
    );
  } catch (err: any) {
    console.warn(`[Orchestrator] Failed to write to intelligence_feed:`, err?.message);
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
}
