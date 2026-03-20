// @ts-nocheck
/**
 * Predictive Jitter-Buffer Synchronization Service
 *
 * Aligns real-time transcripts with high-latency telephony bridges by calculating
 * the delta-time between audio signal arrival and transcript generation.
 * Maintains a unified temporal state for all compliance flags and metadata.
 *
 * CIPC Patent App ID 1773575338868 | CIP6 | Claim 66
 */

export interface DeltaTimeResult {
  audioArrivalMs: number;
  transcriptGeneratedMs: number;
  deltaMs: number;
  adjustedTimestamp: number;
  jitterBufferMs: number;
  latencyCategory: "low" | "moderate" | "high" | "critical";
}

export interface JitterBufferState {
  recentDeltas: number[];
  predictedJitter: number;
  avgLatency: number;
  maxObservedLatency: number;
  adjustmentFactor: number;
  sampleCount: number;
  lastActivityMs: number;
}

const MAX_JITTER_SAMPLES = 50;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const EVICTION_INTERVAL_MS = 10 * 60 * 1000;
const MAX_VALID_DELTA_MS = 30_000;

const LATENCY_THRESHOLDS = {
  low: 200,
  moderate: 500,
  high: 1500,
  critical: Infinity,
};

const jitterStates = new Map<string, JitterBufferState>();

let evictionTimer: ReturnType<typeof setInterval> | null = null;

function startEvictionTimer(): void {
  if (evictionTimer) return;
  evictionTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, state] of jitterStates) {
      if (now - state.lastActivityMs > SESSION_TTL_MS) {
        jitterStates.delete(key);
      }
    }
  }, EVICTION_INTERVAL_MS);
  if (evictionTimer && typeof evictionTimer === "object" && "unref" in evictionTimer) {
    evictionTimer.unref();
  }
}

function getOrCreateState(sessionId: string): JitterBufferState {
  startEvictionTimer();
  if (!jitterStates.has(sessionId)) {
    jitterStates.set(sessionId, {
      recentDeltas: [],
      predictedJitter: 0,
      avgLatency: 0,
      maxObservedLatency: 0,
      adjustmentFactor: 0,
      sampleCount: 0,
      lastActivityMs: Date.now(),
    });
  }
  return jitterStates.get(sessionId)!;
}

export function computeDeltaTime(
  sessionId: string,
  audioArrivalMs: number,
  transcriptGeneratedMs: number
): DeltaTimeResult {
  const rawDelta = transcriptGeneratedMs - audioArrivalMs;
  const deltaMs = Math.max(0, Math.min(rawDelta, MAX_VALID_DELTA_MS));
  const state = getOrCreateState(sessionId);
  state.lastActivityMs = Date.now();

  state.recentDeltas.push(deltaMs);
  if (state.recentDeltas.length > MAX_JITTER_SAMPLES) {
    state.recentDeltas.shift();
  }
  state.sampleCount++;

  state.avgLatency = state.recentDeltas.reduce((s, d) => s + d, 0) / state.recentDeltas.length;
  state.maxObservedLatency = Math.max(state.maxObservedLatency, deltaMs);

  const mean = state.avgLatency;
  const variance = state.recentDeltas.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / state.recentDeltas.length;
  state.predictedJitter = Math.sqrt(variance);

  state.adjustmentFactor = Math.max(0, mean + (state.predictedJitter * 0.5));

  const adjustedTimestamp = transcriptGeneratedMs - state.adjustmentFactor;
  const jitterBufferMs = state.predictedJitter * 2;

  const latencyCategory: DeltaTimeResult["latencyCategory"] =
    deltaMs <= LATENCY_THRESHOLDS.low ? "low" :
    deltaMs <= LATENCY_THRESHOLDS.moderate ? "moderate" :
    deltaMs <= LATENCY_THRESHOLDS.high ? "high" : "critical";

  return {
    audioArrivalMs,
    transcriptGeneratedMs,
    deltaMs,
    adjustedTimestamp,
    jitterBufferMs,
    latencyCategory,
  };
}

export function alignTranscriptTimestamp(
  sessionId: string,
  rawTranscriptTimestamp: number
): number {
  const state = jitterStates.get(sessionId);
  if (!state || state.sampleCount < 3) return rawTranscriptTimestamp;
  return rawTranscriptTimestamp - state.adjustmentFactor;
}

export function getJitterState(sessionId: string): JitterBufferState | null {
  return jitterStates.get(sessionId) ?? null;
}

export function resetJitterState(sessionId: string): void {
  jitterStates.delete(sessionId);
}

export function getLatencyReport(sessionId: string): {
  sessionId: string;
  avgLatencyMs: number;
  predictedJitterMs: number;
  maxLatencyMs: number;
  sampleCount: number;
  adjustmentFactorMs: number;
  healthStatus: "healthy" | "degraded" | "poor";
} | null {
  const state = jitterStates.get(sessionId);
  if (!state) return null;

  const healthStatus =
    state.avgLatency <= LATENCY_THRESHOLDS.low ? "healthy" :
    state.avgLatency <= LATENCY_THRESHOLDS.moderate ? "degraded" : "poor";

  return {
    sessionId,
    avgLatencyMs: Math.round(state.avgLatency),
    predictedJitterMs: Math.round(state.predictedJitter),
    maxLatencyMs: Math.round(state.maxObservedLatency),
    sampleCount: state.sampleCount,
    adjustmentFactorMs: Math.round(state.adjustmentFactor),
    healthStatus,
  };
}
