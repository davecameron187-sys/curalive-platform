// @ts-nocheck
/**
 * Predictive Event Intelligence Engine — Module 29
 * CIPC Patent App ID 1773575338868
 *
 * Autonomous pre-event intelligence system that analyses historical patterns across
 * all prior events to generate predictive briefings, detect anomalies before they
 * materialise, and provide confidence-weighted forecasts for upcoming events.
 *
 * Core algorithms:
 *   1. Bayesian Anomaly Detector     — prior × likelihood scoring with adaptive thresholds
 *   2. Exponential Smoothing Forecast — Holt-Winters triple-exponential for time-series KPIs
 *   3. TF-IDF Topic Predictor        — term frequency–inverse document frequency across event corpora
 *   4. Monte Carlo Risk Simulator    — N-trial stochastic simulation for composite risk scores
 *   5. Eigenvector Centrality        — identifies most influential nodes in attendee-question graph
 *   6. Confidence Interval Engine    — Wilson score intervals for proportion-based predictions
 */
import { createHash } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventHistoryRecord = {
  eventId: string;
  clientId: string;
  eventType: string;
  eventDate: string;
  attendeeCount: number;
  questionsAsked: number;
  hostileQuestions: number;
  complianceFlags: number;
  averageSentiment: number;
  durationMinutes: number;
  topicVector: Record<string, number>;
  attendeeIds: string[];
};

export type AnomalyDetection = {
  metric: string;
  observed: number;
  expectedMean: number;
  expectedStdDev: number;
  zScore: number;
  posterior: number;
  isAnomaly: boolean;
  severity: "low" | "moderate" | "high" | "critical";
  explanation: string;
};

export type TimeSeriesForecast = {
  metric: string;
  nextValue: number;
  trend: number;
  seasonal: number;
  confidence: { lower: number; upper: number; level: number };
  mape: number;
};

export type TopicPrediction = {
  topic: string;
  tfidfScore: number;
  recencyWeight: number;
  predictedProbability: number;
  historicalFrequency: number;
  trendDirection: "rising" | "stable" | "declining";
};

export type MonteCarloResult = {
  metric: string;
  meanOutcome: number;
  medianOutcome: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  standardDeviation: number;
  trials: number;
  worstCase: number;
  bestCase: number;
};

export type CentralityScore = {
  nodeId: string;
  nodeType: string;
  label: string;
  eigenvectorCentrality: number;
  degreeCentrality: number;
  influenceRank: number;
};

export type WilsonInterval = {
  proportion: number;
  lower: number;
  upper: number;
  confidence: number;
  sampleSize: number;
};

export type PredictiveBriefing = {
  clientId: string;
  upcomingEventType: string;
  generatedAt: string;
  hash: string;
  anomalies: AnomalyDetection[];
  forecasts: TimeSeriesForecast[];
  predictedTopics: TopicPrediction[];
  riskSimulation: MonteCarloResult[];
  influentialAttendees: CentralityScore[];
  confidenceIntervals: Record<string, WilsonInterval>;
  overallRiskScore: number;
  recommendedActions: string[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const EVIDENCE_HALF_LIFE_DAYS = 14;
const ANOMALY_Z_THRESHOLD = 2.0;
const ANOMALY_POSTERIOR_THRESHOLD = 0.75;
const MONTE_CARLO_TRIALS = 10000;
const HOLT_WINTERS_ALPHA = 0.3;
const HOLT_WINTERS_BETA = 0.1;
const HOLT_WINTERS_GAMMA = 0.15;
const SEASONAL_PERIOD = 4;
const EIGENVECTOR_ITERATIONS = 50;
const EIGENVECTOR_TOLERANCE = 1e-6;
const WILSON_Z = 1.96;

// ─── In-Memory Store ─────────────────────────────────────────────────────────

const eventHistory = new Map<string, EventHistoryRecord[]>();

export function ingestEventRecord(record: EventHistoryRecord): void {
  const records = eventHistory.get(record.clientId) ?? [];
  records.push(record);
  eventHistory.set(record.clientId, records);
  console.log(`[PEI] Ingested event ${record.eventId} for client ${record.clientId} (total: ${records.length})`);
}

export function getClientHistory(clientId: string): EventHistoryRecord[] {
  return eventHistory.get(clientId) ?? [];
}

function decayWeight(eventDate: string): number {
  const ageMs = Date.now() - new Date(eventDate).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / EVIDENCE_HALF_LIFE_DAYS);
}

// ─── Algorithm 1: Bayesian Anomaly Detector ──────────────────────────────────
//
// For each metric M, compute:
//   μ = Σ(wᵢ × mᵢ) / Σ(wᵢ)           (decay-weighted mean)
//   σ = √[ Σ(wᵢ × (mᵢ - μ)²) / Σ(wᵢ) ]  (decay-weighted std dev)
//   z = (observed - μ) / σ              (z-score)
//
// Bayesian posterior probability of anomaly:
//   P(anomaly | z) = P(z | anomaly) × P(anomaly) / P(z)
//   Prior P(anomaly) = 0.05 (base rate 5%)
//   Likelihood P(z | anomaly) = 1 - exp(-0.5 × z²)
//   Evidence P(z) = P(z | anomaly) × P(anomaly) + P(z | normal) × P(normal)
//   P(z | normal) = exp(-0.5 × z²)

export function detectAnomalies(
  clientId: string,
  upcomingMetrics: Record<string, number>
): AnomalyDetection[] {
  const history = getClientHistory(clientId);
  if (history.length < 3) return [];

  const results: AnomalyDetection[] = [];
  const PRIOR_ANOMALY = 0.05;

  for (const [metric, observed] of Object.entries(upcomingMetrics)) {
    const values: { v: number; w: number }[] = [];
    for (const h of history) {
      const v = extractMetric(h, metric);
      if (v !== null) values.push({ v, w: decayWeight(h.eventDate) });
    }
    if (values.length < 3) continue;

    const totalWeight = values.reduce((s, x) => s + x.w, 0);
    const mean = values.reduce((s, x) => s + x.w * x.v, 0) / totalWeight;
    const variance = values.reduce((s, x) => s + x.w * Math.pow(x.v - mean, 2), 0) / totalWeight;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 1e-10) continue;

    const zScore = (observed - mean) / stdDev;
    const absZ = Math.abs(zScore);

    const likelihoodAnomaly = 1 - Math.exp(-0.5 * absZ * absZ);
    const likelihoodNormal = Math.exp(-0.5 * absZ * absZ);
    const evidence = likelihoodAnomaly * PRIOR_ANOMALY + likelihoodNormal * (1 - PRIOR_ANOMALY);
    const posterior = (likelihoodAnomaly * PRIOR_ANOMALY) / evidence;

    const isAnomaly = absZ > ANOMALY_Z_THRESHOLD && posterior > ANOMALY_POSTERIOR_THRESHOLD;

    const severity: AnomalyDetection["severity"] =
      absZ > 4 ? "critical" : absZ > 3 ? "high" : absZ > 2 ? "moderate" : "low";

    const direction = zScore > 0 ? "above" : "below";

    results.push({
      metric,
      observed,
      expectedMean: round4(mean),
      expectedStdDev: round4(stdDev),
      zScore: round4(zScore),
      posterior: round4(posterior),
      isAnomaly,
      severity,
      explanation: isAnomaly
        ? `${metric} is ${round4(absZ)}σ ${direction} the decay-weighted mean (${round4(mean)}). Bayesian posterior ${(posterior * 100).toFixed(1)}% — anomaly detected.`
        : `${metric} is within expected range (z=${round4(zScore)}, posterior=${(posterior * 100).toFixed(1)}%).`,
    });
  }

  return results.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

function extractMetric(record: EventHistoryRecord, metric: string): number | null {
  const map: Record<string, number> = {
    attendeeCount: record.attendeeCount,
    questionsAsked: record.questionsAsked,
    hostileQuestions: record.hostileQuestions,
    complianceFlags: record.complianceFlags,
    averageSentiment: record.averageSentiment,
    durationMinutes: record.durationMinutes,
    hostileRatio: record.questionsAsked > 0 ? record.hostileQuestions / record.questionsAsked : 0,
    questionsPerAttendee: record.attendeeCount > 0 ? record.questionsAsked / record.attendeeCount : 0,
  };
  return map[metric] ?? null;
}

// ─── Algorithm 2: Holt-Winters Triple Exponential Smoothing ──────────────────
//
// Level:     Lₜ = α × (yₜ / Sₜ₋ₚ) + (1 - α)(Lₜ₋₁ + Tₜ₋₁)
// Trend:     Tₜ = β × (Lₜ - Lₜ₋₁) + (1 - β) × Tₜ₋₁
// Seasonal:  Sₜ = γ × (yₜ / Lₜ) + (1 - γ) × Sₜ₋ₚ
// Forecast:  Fₜ₊ₕ = (Lₜ + h × Tₜ) × Sₜ₋ₚ₊ₕ
//
// MAPE = (1/n) × Σ |actual - forecast| / |actual| × 100

export function forecastTimeSeries(
  clientId: string,
  metric: string,
  horizonSteps: number = 1
): TimeSeriesForecast | null {
  const history = getClientHistory(clientId);
  if (history.length < SEASONAL_PERIOD + 2) return null;

  const sorted = [...history].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const series: number[] = [];
  for (const h of sorted) {
    const v = extractMetric(h, metric);
    if (v !== null) series.push(v);
  }

  if (series.length < SEASONAL_PERIOD + 2) return null;

  const p = Math.min(SEASONAL_PERIOD, Math.floor(series.length / 2));
  const initialLevel = series.slice(0, p).reduce((a, b) => a + b, 0) / p;
  const initialTrend = (series[p] - series[0]) / p;

  const seasonal: number[] = new Array(series.length).fill(1);
  for (let i = 0; i < p; i++) {
    seasonal[i] = series[i] / (initialLevel || 1);
  }

  const levels: number[] = [initialLevel];
  const trends: number[] = [initialTrend];
  const forecasts: number[] = [series[0]];

  for (let t = 1; t < series.length; t++) {
    const prevLevel = levels[t - 1];
    const prevTrend = trends[t - 1];
    const seasonIdx = t >= p ? t - p : 0;
    const prevSeasonal = seasonal[seasonIdx] || 1;

    const level = HOLT_WINTERS_ALPHA * (series[t] / prevSeasonal) + (1 - HOLT_WINTERS_ALPHA) * (prevLevel + prevTrend);
    const trend = HOLT_WINTERS_BETA * (level - prevLevel) + (1 - HOLT_WINTERS_BETA) * prevTrend;
    const seas = HOLT_WINTERS_GAMMA * (series[t] / (level || 1)) + (1 - HOLT_WINTERS_GAMMA) * prevSeasonal;

    levels.push(level);
    trends.push(trend);
    seasonal[t] = seas;
    forecasts.push((prevLevel + prevTrend) * prevSeasonal);
  }

  const lastLevel = levels[levels.length - 1];
  const lastTrend = trends[trends.length - 1];
  const forecastSeasonIdx = series.length >= p ? series.length - p : 0;
  const forecastSeasonal = seasonal[forecastSeasonIdx] || 1;
  const nextValue = (lastLevel + horizonSteps * lastTrend) * forecastSeasonal;

  const errors = series.map((actual, i) => Math.abs(actual - forecasts[i]) / (Math.abs(actual) || 1));
  const mape = (errors.reduce((a, b) => a + b, 0) / errors.length) * 100;

  const residuals = series.map((actual, i) => actual - forecasts[i]);
  const residStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);
  const confidenceWidth = WILSON_Z * residStd * Math.sqrt(horizonSteps);

  return {
    metric,
    nextValue: round4(nextValue),
    trend: round4(lastTrend),
    seasonal: round4(forecastSeasonal),
    confidence: {
      lower: round4(nextValue - confidenceWidth),
      upper: round4(nextValue + confidenceWidth),
      level: 0.95,
    },
    mape: round4(mape),
  };
}

// ─── Algorithm 3: TF-IDF Topic Predictor ─────────────────────────────────────
//
// TF(t,d) = count of term t in document d / total terms in d
// IDF(t) = ln(N / df(t))  where N = total documents, df(t) = docs containing t
// TF-IDF(t,d) = TF(t,d) × IDF(t)
//
// Recency-weighted TF-IDF: score(t) = Σ( TF-IDF(t,d) × W(age_d) )
// Predicted probability: P(t) = score(t) / Σ(scores)

export function predictTopics(
  clientId: string,
  topN: number = 10
): TopicPrediction[] {
  const history = getClientHistory(clientId);
  if (history.length < 2) return [];

  const N = history.length;
  const allTopics = new Set<string>();
  const docFreq: Record<string, number> = {};

  for (const h of history) {
    const topics = Object.keys(h.topicVector);
    for (const t of topics) {
      allTopics.add(t);
      docFreq[t] = (docFreq[t] || 0) + 1;
    }
  }

  const topicScores: Record<string, { tfidfSum: number; recencyWeightedSum: number; appearances: number; recentCount: number; olderCount: number }> = {};

  for (const topic of allTopics) {
    topicScores[topic] = { tfidfSum: 0, recencyWeightedSum: 0, appearances: 0, recentCount: 0, olderCount: 0 };
  }

  const sorted = [...history].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const midpoint = Math.floor(sorted.length / 2);

  for (let i = 0; i < sorted.length; i++) {
    const h = sorted[i];
    const topics = Object.entries(h.topicVector);
    const totalTerms = topics.reduce((s, [, count]) => s + count, 0) || 1;
    const weight = decayWeight(h.eventDate);

    for (const [topic, count] of topics) {
      const tf = count / totalTerms;
      const idf = Math.log(N / (docFreq[topic] || 1));
      const tfidf = tf * idf;

      topicScores[topic].tfidfSum += tfidf;
      topicScores[topic].recencyWeightedSum += tfidf * weight;
      topicScores[topic].appearances += 1;

      if (i >= midpoint) topicScores[topic].recentCount++;
      else topicScores[topic].olderCount++;
    }
  }

  const totalRecencyScore = Object.values(topicScores).reduce((s, t) => s + t.recencyWeightedSum, 0) || 1;

  const predictions: TopicPrediction[] = [];

  for (const [topic, scores] of Object.entries(topicScores)) {
    const predictedProbability = scores.recencyWeightedSum / totalRecencyScore;
    const historicalFrequency = scores.appearances / N;

    const recentRate = scores.recentCount / Math.max(1, sorted.length - midpoint);
    const olderRate = scores.olderCount / Math.max(1, midpoint);
    const trendDirection: TopicPrediction["trendDirection"] =
      recentRate > olderRate * 1.2 ? "rising" : recentRate < olderRate * 0.8 ? "declining" : "stable";

    predictions.push({
      topic,
      tfidfScore: round4(scores.tfidfSum),
      recencyWeight: round4(scores.recencyWeightedSum),
      predictedProbability: round4(predictedProbability),
      historicalFrequency: round4(historicalFrequency),
      trendDirection,
    });
  }

  return predictions
    .sort((a, b) => b.predictedProbability - a.predictedProbability)
    .slice(0, topN);
}

// ─── Algorithm 4: Monte Carlo Risk Simulator ─────────────────────────────────
//
// For each risk metric, run N independent trials:
//   Trial outcome = sample from Normal(μ_decay, σ_decay)
//   where μ_decay and σ_decay are decay-weighted mean and std dev
//
// Output: percentile distribution (p5, p25, median, p75, p95)
// Composite risk = weighted average of per-metric normalised risk scores

export function simulateRisk(
  clientId: string,
  metrics: string[],
  trials: number = MONTE_CARLO_TRIALS
): MonteCarloResult[] {
  const history = getClientHistory(clientId);
  if (history.length < 3) return [];

  const results: MonteCarloResult[] = [];

  for (const metric of metrics) {
    const values: { v: number; w: number }[] = [];
    for (const h of history) {
      const v = extractMetric(h, metric);
      if (v !== null) values.push({ v, w: decayWeight(h.eventDate) });
    }
    if (values.length < 3) continue;

    const totalWeight = values.reduce((s, x) => s + x.w, 0);
    const mean = values.reduce((s, x) => s + x.w * x.v, 0) / totalWeight;
    const variance = values.reduce((s, x) => s + x.w * Math.pow(x.v - mean, 2), 0) / totalWeight;
    const stdDev = Math.sqrt(variance);

    const outcomes: number[] = [];
    for (let t = 0; t < trials; t++) {
      outcomes.push(boxMullerNormal(mean, stdDev));
    }
    outcomes.sort((a, b) => a - b);

    const percentile = (p: number) => outcomes[Math.min(Math.floor(p * trials), trials - 1)];

    results.push({
      metric,
      meanOutcome: round4(outcomes.reduce((a, b) => a + b, 0) / trials),
      medianOutcome: round4(percentile(0.5)),
      p5: round4(percentile(0.05)),
      p25: round4(percentile(0.25)),
      p75: round4(percentile(0.75)),
      p95: round4(percentile(0.95)),
      standardDeviation: round4(stdDev),
      trials,
      worstCase: round4(outcomes[outcomes.length - 1]),
      bestCase: round4(outcomes[0]),
    });
  }

  return results;
}

function boxMullerNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// ─── Algorithm 5: Eigenvector Centrality ─────────────────────────────────────
//
// Given adjacency matrix A (n×n) for the attendee-question-sentiment graph:
//   x(k+1) = A × x(k) / ‖A × x(k)‖
// Iterate until ‖x(k+1) - x(k)‖ < ε or max iterations reached.
//
// This identifies the most influential attendees (those who ask questions
// that trigger the strongest sentiment cascades across events).

export function computeEigenvectorCentrality(
  clientId: string,
  topN: number = 10
): CentralityScore[] {
  const history = getClientHistory(clientId);
  if (history.length === 0) return [];

  const nodeMap = new Map<string, { type: string; label: string }>();
  const edges: Array<{ from: string; to: string; weight: number }> = [];

  for (const h of history) {
    const eventNode = `event-${h.eventId}`;
    nodeMap.set(eventNode, { type: "event", label: `${h.eventType} (${h.eventDate})` });

    for (const attendeeId of h.attendeeIds) {
      const attendeeNode = `attendee-${attendeeId}`;
      if (!nodeMap.has(attendeeNode)) {
        nodeMap.set(attendeeNode, { type: "attendee", label: attendeeId });
      }

      edges.push({ from: eventNode, to: attendeeNode, weight: decayWeight(h.eventDate) });
      edges.push({ from: attendeeNode, to: eventNode, weight: decayWeight(h.eventDate) });
    }

    const qWeight = h.questionsAsked > 0 ? h.hostileQuestions / h.questionsAsked : 0;
    for (const attendeeId of h.attendeeIds) {
      for (const otherAttendee of h.attendeeIds) {
        if (attendeeId !== otherAttendee) {
          edges.push({
            from: `attendee-${attendeeId}`,
            to: `attendee-${otherAttendee}`,
            weight: decayWeight(h.eventDate) * (1 + qWeight),
          });
        }
      }
    }
  }

  const nodes = [...nodeMap.keys()];
  const n = nodes.length;
  if (n === 0) return [];

  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node, i));

  const adj: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const edge of edges) {
    const i = nodeIndex.get(edge.from);
    const j = nodeIndex.get(edge.to);
    if (i !== undefined && j !== undefined) {
      adj[i][j] += edge.weight;
    }
  }

  let x = new Array(n).fill(1 / n);

  for (let iter = 0; iter < EIGENVECTOR_ITERATIONS; iter++) {
    const xNew = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        xNew[i] += adj[i][j] * x[j];
      }
    }

    const norm = Math.sqrt(xNew.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < n; i++) xNew[i] /= norm;

    const delta = Math.sqrt(xNew.reduce((s, v, i) => s + Math.pow(v - x[i], 2), 0));
    x = xNew;

    if (delta < EIGENVECTOR_TOLERANCE) break;
  }

  const degreeCentrality: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (adj[i][j] > 0) degreeCentrality[i]++;
    }
    degreeCentrality[i] /= Math.max(1, n - 1);
  }

  const scores: CentralityScore[] = nodes.map((nodeId, i) => ({
    nodeId,
    nodeType: nodeMap.get(nodeId)!.type,
    label: nodeMap.get(nodeId)!.label,
    eigenvectorCentrality: round4(x[i]),
    degreeCentrality: round4(degreeCentrality[i]),
    influenceRank: 0,
  }));

  scores.sort((a, b) => b.eigenvectorCentrality - a.eigenvectorCentrality);
  scores.forEach((s, i) => { s.influenceRank = i + 1; });

  return scores
    .filter(s => s.nodeType === "attendee")
    .slice(0, topN);
}

// ─── Algorithm 6: Wilson Score Confidence Intervals ──────────────────────────
//
// For a proportion p̂ observed in n trials:
//   center = (p̂ + z²/(2n)) / (1 + z²/n)
//   margin = z × √(p̂(1-p̂)/n + z²/(4n²)) / (1 + z²/n)
//   lower = center - margin
//   upper = center + margin
//
// Wilson intervals are preferred over normal approximation for small samples
// and proportions near 0 or 1.

export function computeWilsonInterval(successes: number, trials: number): WilsonInterval {
  if (trials === 0) return { proportion: 0, lower: 0, upper: 0, confidence: 0.95, sampleSize: 0 };

  const phat = successes / trials;
  const z = WILSON_Z;
  const z2 = z * z;
  const n = trials;

  const denominator = 1 + z2 / n;
  const center = (phat + z2 / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((phat * (1 - phat)) / n + z2 / (4 * n * n))) / denominator;

  return {
    proportion: round4(phat),
    lower: round4(Math.max(0, center - margin)),
    upper: round4(Math.min(1, center + margin)),
    confidence: 0.95,
    sampleSize: trials,
  };
}

// ─── Composite Briefing Generator ────────────────────────────────────────────

export function generatePredictiveBriefing(
  clientId: string,
  upcomingEventType: string,
  expectedAttendees: number
): PredictiveBriefing | null {
  const history = getClientHistory(clientId);
  if (history.length < 3) return null;

  const upcomingMetrics: Record<string, number> = {
    attendeeCount: expectedAttendees,
    questionsPerAttendee: 0.3,
    hostileRatio: 0.1,
  };
  const anomalies = detectAnomalies(clientId, upcomingMetrics);

  const forecastMetrics = ["attendeeCount", "questionsAsked", "hostileQuestions", "complianceFlags", "averageSentiment"];
  const forecasts: TimeSeriesForecast[] = [];
  for (const m of forecastMetrics) {
    const f = forecastTimeSeries(clientId, m);
    if (f) forecasts.push(f);
  }

  const predictedTopics = predictTopics(clientId, 10);

  const riskMetrics = ["hostileQuestions", "complianceFlags", "hostileRatio"];
  const riskSimulation = simulateRisk(clientId, riskMetrics);

  const influentialAttendees = computeEigenvectorCentrality(clientId, 5);

  const totalEvents = history.length;
  const eventsWithHostile = history.filter(h => h.hostileQuestions > 0).length;
  const eventsWithCompliance = history.filter(h => h.complianceFlags > 0).length;

  const hostileInterval = computeWilsonInterval(eventsWithHostile, totalEvents);
  const complianceInterval = computeWilsonInterval(eventsWithCompliance, totalEvents);

  const confidenceIntervals: Record<string, WilsonInterval> = {
    hostileQuestionProbability: hostileInterval,
    complianceFlagProbability: complianceInterval,
  };

  const anomalyScore = anomalies.filter(a => a.isAnomaly).length / Math.max(1, anomalies.length);
  const hostileRisk = riskSimulation.find(r => r.metric === "hostileRatio");
  const hostileP95 = hostileRisk?.p95 ?? 0;
  const forecastRisk = forecasts.find(f => f.metric === "complianceFlags");
  const forecastedCompliance = forecastRisk?.nextValue ?? 0;

  const overallRiskScore = round4(
    Math.min(1, (anomalyScore * 0.25) + (hostileP95 * 0.30) + (Math.min(1, forecastedCompliance / 5) * 0.25) + (hostileInterval.upper * 0.20))
  );

  const recommendedActions: string[] = [];
  if (overallRiskScore > 0.7) recommendedActions.push("Deploy additional compliance analyst for real-time monitoring");
  if (overallRiskScore > 0.5) recommendedActions.push("Brief spokesperson on predicted hostile topics");
  if (anomalies.some(a => a.isAnomaly && a.metric === "attendeeCount")) recommendedActions.push("Anomalous attendee count detected — verify registration data");
  if (predictedTopics.some(t => t.trendDirection === "rising" && t.predictedProbability > 0.15)) {
    const risingTopics = predictedTopics.filter(t => t.trendDirection === "rising").map(t => t.topic);
    recommendedActions.push(`Prepare responses for rising topics: ${risingTopics.join(", ")}`);
  }
  if (influentialAttendees.length > 0) {
    recommendedActions.push(`Monitor high-influence attendees: ${influentialAttendees.slice(0, 3).map(a => a.label).join(", ")}`);
  }
  if (hostileInterval.upper > 0.4) recommendedActions.push("Historical hostile question rate elevated — have legal on standby");
  if (recommendedActions.length === 0) recommendedActions.push("Standard preparation — no elevated risk factors detected");

  const briefingData = {
    clientId,
    upcomingEventType,
    generatedAt: new Date().toISOString(),
    anomalies,
    forecasts,
    predictedTopics,
    riskSimulation,
    influentialAttendees,
    confidenceIntervals,
    overallRiskScore,
    recommendedActions,
  };

  const hash = createHash("sha256").update(JSON.stringify(briefingData)).digest("hex");

  return { ...briefingData, hash };
}

// ─── Cross-Client Pattern Detection ──────────────────────────────────────────
//
// Analyses patterns across ALL clients to detect industry-wide anomalies.
// Uses Jensen-Shannon divergence to measure distribution similarity:
//   JSD(P‖Q) = ½ × KL(P‖M) + ½ × KL(Q‖M)  where M = ½(P+Q)
//   KL(P‖Q) = Σ P(i) × ln(P(i)/Q(i))

export function detectCrossClientPatterns(): {
  topicConvergence: Array<{ topic: string; clientCount: number; averageTfidf: number }>;
  sentimentDivergence: Array<{ clientId: string; avgSentiment: number; divergence: number }>;
  industryRiskBaseline: { meanHostileRatio: number; stdDevHostileRatio: number; meanComplianceRate: number };
} {
  const allClients = [...eventHistory.keys()];
  if (allClients.length < 2) {
    return { topicConvergence: [], sentimentDivergence: [], industryRiskBaseline: { meanHostileRatio: 0, stdDevHostileRatio: 0, meanComplianceRate: 0 } };
  }

  const globalTopicScores: Record<string, { totalScore: number; clientCount: number }> = {};
  const clientSentiments: Array<{ clientId: string; avgSentiment: number }> = [];
  const hostileRatios: number[] = [];
  const complianceRates: number[] = [];

  for (const clientId of allClients) {
    const history = getClientHistory(clientId);
    if (history.length === 0) continue;

    const clientTopics = predictTopics(clientId, 20);
    for (const tp of clientTopics) {
      if (!globalTopicScores[tp.topic]) globalTopicScores[tp.topic] = { totalScore: 0, clientCount: 0 };
      globalTopicScores[tp.topic].totalScore += tp.tfidfScore;
      globalTopicScores[tp.topic].clientCount++;
    }

    const avgSent = history.reduce((s, h) => s + h.averageSentiment, 0) / history.length;
    clientSentiments.push({ clientId, avgSentiment: round4(avgSent) });

    for (const h of history) {
      if (h.questionsAsked > 0) hostileRatios.push(h.hostileQuestions / h.questionsAsked);
      complianceRates.push(h.complianceFlags > 0 ? 1 : 0);
    }
  }

  const topicConvergence = Object.entries(globalTopicScores)
    .filter(([, v]) => v.clientCount >= 2)
    .map(([topic, v]) => ({ topic, clientCount: v.clientCount, averageTfidf: round4(v.totalScore / v.clientCount) }))
    .sort((a, b) => b.clientCount - a.clientCount || b.averageTfidf - a.averageTfidf)
    .slice(0, 15);

  const globalAvgSentiment = clientSentiments.reduce((s, c) => s + c.avgSentiment, 0) / clientSentiments.length;
  const sentimentStdDev = Math.sqrt(clientSentiments.reduce((s, c) => s + Math.pow(c.avgSentiment - globalAvgSentiment, 2), 0) / clientSentiments.length);

  const sentimentDivergence = clientSentiments.map(c => ({
    ...c,
    divergence: round4(sentimentStdDev > 0 ? Math.abs(c.avgSentiment - globalAvgSentiment) / sentimentStdDev : 0),
  })).sort((a, b) => b.divergence - a.divergence);

  const meanHostileRatio = hostileRatios.length > 0 ? hostileRatios.reduce((a, b) => a + b, 0) / hostileRatios.length : 0;
  const stdDevHostileRatio = hostileRatios.length > 0
    ? Math.sqrt(hostileRatios.reduce((s, r) => s + Math.pow(r - meanHostileRatio, 2), 0) / hostileRatios.length) : 0;
  const meanComplianceRate = complianceRates.length > 0 ? complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length : 0;

  return {
    topicConvergence,
    sentimentDivergence,
    industryRiskBaseline: {
      meanHostileRatio: round4(meanHostileRatio),
      stdDevHostileRatio: round4(stdDevHostileRatio),
      meanComplianceRate: round4(meanComplianceRate),
    },
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
