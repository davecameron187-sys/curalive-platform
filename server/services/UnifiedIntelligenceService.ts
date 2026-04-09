import { rawSql } from "../db";
import {
  checkAICoreHealth,
  getOrgProfile,
  getBenchmark,
  generateBriefing,
  getGovernanceRecord,
} from "./AICoreClient";
import type {
  AICoreBriefingResponse,
  AICoreGovernanceResponse,
  AICoreProfileResponse,
  AICoreBenchmarkResponse,
} from "./AICoreClient";
import type { PipelineTrace } from "./SessionClosePipeline";

const LOG = (msg: string) => console.log(`[UnifiedIntel] ${msg}`);

const CACHE_TTL_MS = 120_000;

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const profileCache = new Map<string, CacheEntry<AICoreProfileResponse>>();
const benchmarkCache = new Map<string, CacheEntry<AICoreBenchmarkResponse>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function cachedProfile(orgId: string): Promise<AICoreProfileResponse | null> {
  const cached = getCached(profileCache, orgId);
  if (cached) { LOG(`Profile cache hit: ${orgId}`); return cached; }
  try {
    const profile = await getOrgProfile(orgId);
    setCache(profileCache, orgId, profile);
    return profile;
  } catch (e) {
    LOG(`Profile fetch failed for ${orgId}: ${(e as Error).message}`);
    return null;
  }
}

async function cachedBenchmark(segmentKey: string): Promise<AICoreBenchmarkResponse | null> {
  const cached = getCached(benchmarkCache, segmentKey);
  if (cached) { LOG(`Benchmark cache hit: ${segmentKey}`); return cached; }
  try {
    const bm = await getBenchmark(segmentKey);
    setCache(benchmarkCache, segmentKey, bm);
    return bm;
  } catch {
    return null;
  }
}

export interface IntelligenceSummary {
  session_id: number | null;
  organisation_id: string | null;
  event_id: string | null;
  generated_at: string;

  overall_risk: {
    level: string;
    score: number;
    source: string;
  };

  sentiment_summary: {
    overall: string;
    score: number;
    positive_signals: number;
    negative_signals: number;
    neutral_signals: number;
    key_themes: string[];
  };

  key_commitments: Array<{
    text: string;
    speaker: string | null;
    type: string;
    confidence: number;
    drift_detected: boolean;
  }>;

  drift_status: {
    status: string;
    events_created: number;
    commitments_evaluated: number;
    top_drifts: Array<{
      commitment_text: string;
      drift_type: string;
      severity: string;
      explanation: string;
    }>;
  };

  top_compliance_issues: Array<{
    flag_type: string;
    severity: string;
    speaker: string | null;
    matched_pattern: string;
  }>;

  top_predicted_questions: Array<{
    question: string;
    likelihood: string;
    theme: string;
    rationale: string;
  }>;

  key_pressure_points: Array<{
    area: string;
    severity: string;
    source: string;
    detail: string;
  }>;

  governance_summary: {
    record_id: string | null;
    record_type: string | null;
    total_commitments: number;
    total_flags: number;
    overall_risk_level: string;
    executive_summary: string;
    matters_arising: number;
  };

  profile_summary: {
    version: number;
    events_incorporated: number;
    overall_risk_level: string;
    delivery_reliability: string;
    relationship_health: string;
    governance_quality: string;
    confidence: number;
    key_concerns: string[];
    key_strengths: string[];
  };

  benchmark_context: {
    segment: string;
    quality: string;
    event_count: number;
    concerns: string[];
    strengths: string[];
    positions: Record<string, string>;
  };

  data_sources: {
    ai_core_available: boolean;
    analysis_loaded: boolean;
    drift_loaded: boolean;
    governance_loaded: boolean;
    profile_loaded: boolean;
    benchmark_loaded: boolean;
    briefing_loaded: boolean;
    partial: boolean;
    failed_sources: string[];
  };

  generated_in_ms: number;
  pipeline_trace: PipelineTrace | null;
}

function emptyIntelligenceSummary(
  sessionId: number | null,
  orgId: string | null,
  eventId: string | null,
): IntelligenceSummary {
  return {
    session_id: sessionId,
    organisation_id: orgId,
    event_id: eventId,
    generated_at: new Date().toISOString(),
    overall_risk: { level: "unknown", score: 0, source: "none" },
    sentiment_summary: { overall: "neutral", score: 0, positive_signals: 0, negative_signals: 0, neutral_signals: 0, key_themes: [] },
    key_commitments: [],
    drift_status: { status: "unknown", events_created: 0, commitments_evaluated: 0, top_drifts: [] },
    top_compliance_issues: [],
    top_predicted_questions: [],
    key_pressure_points: [],
    governance_summary: { record_id: null, record_type: null, total_commitments: 0, total_flags: 0, overall_risk_level: "unknown", executive_summary: "", matters_arising: 0 },
    profile_summary: { version: 0, events_incorporated: 0, overall_risk_level: "unknown", delivery_reliability: "unknown", relationship_health: "unknown", governance_quality: "unknown", confidence: 0, key_concerns: [], key_strengths: [] },
    benchmark_context: { segment: "", quality: "unknown", event_count: 0, concerns: [], strengths: [], positions: {} },
    data_sources: {
      ai_core_available: false,
      analysis_loaded: false,
      drift_loaded: false,
      governance_loaded: false,
      profile_loaded: false,
      benchmark_loaded: false,
      briefing_loaded: false,
      partial: true,
      failed_sources: [],
    },
    generated_in_ms: 0,
    pipeline_trace: null,
  };
}

export async function getSessionIntelligence(sessionId: number): Promise<IntelligenceSummary> {
  const start = Date.now();
  const eventId = `shadow-${sessionId}`;

  const [sessionRows] = await rawSql(
    `SELECT id, company, client_name, event_name, event_type,
            ai_core_status, ai_core_results,
            ai_drift_status, ai_drift_results,
            ai_governance_id, ai_governance_results,
            ai_profile_version, ai_profile_summary,
            ai_pipeline_trace
     FROM shadow_sessions WHERE id = $1`,
    [sessionId],
  );

  if (!sessionRows.length) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const session = sessionRows[0] as any;
  const orgId = session.company ?? session.client_name ?? null;
  const summary = emptyIntelligenceSummary(sessionId, orgId, eventId);

  const aiResults = parseJson(session.ai_core_results);
  const driftResults = parseJson(session.ai_drift_results);
  const govSummary = parseJson(session.ai_governance_results);
  const profileSummary = parseJson(session.ai_profile_summary);
  const pipelineTrace = parseJson(session.ai_pipeline_trace);

  if (pipelineTrace) {
    summary.pipeline_trace = pipelineTrace as unknown as PipelineTrace;
  }

  if (aiResults) {
    fillAnalysisOutputs(summary, aiResults);
    summary.data_sources.analysis_loaded = true;
  }

  if (driftResults) {
    summary.drift_status = {
      status: session.ai_drift_status ?? "unknown",
      events_created: driftResults.drift_events_created ?? 0,
      commitments_evaluated: driftResults.commitments_evaluated ?? 0,
      top_drifts: (driftResults.drift_events ?? []).slice(0, 5).map((d: any) => ({
        commitment_text: d.commitment_text ?? "",
        drift_type: d.drift_type ?? "unknown",
        severity: d.severity ?? "low",
        explanation: d.explanation ?? "",
      })),
    };
    summary.data_sources.drift_loaded = true;
  }

  if (govSummary) {
    summary.governance_summary = {
      record_id: govSummary.governance_record_id ?? null,
      record_type: govSummary.record_type ?? null,
      total_commitments: govSummary.commitments ?? 0,
      total_flags: govSummary.compliance_flags ?? 0,
      overall_risk_level: govSummary.overall_risk_level ?? "unknown",
      executive_summary: "",
      matters_arising: govSummary.matters_arising ?? 0,
    };
    summary.data_sources.governance_loaded = true;

    if (govSummary.overall_risk_level) {
      summary.overall_risk = {
        level: govSummary.overall_risk_level,
        score: riskLevelToScore(govSummary.overall_risk_level),
        source: "governance",
      };
    }
  }

  if (profileSummary) {
    summary.profile_summary = {
      version: profileSummary.version ?? session.ai_profile_version ?? 0,
      events_incorporated: profileSummary.events_incorporated ?? 0,
      overall_risk_level: profileSummary.overall_risk_level ?? "unknown",
      delivery_reliability: profileSummary.delivery_reliability ?? "unknown",
      relationship_health: profileSummary.relationship_health ?? "unknown",
      governance_quality: profileSummary.governance_quality ?? "unknown",
      confidence: profileSummary.confidence ?? 0,
      key_concerns: profileSummary.key_concerns ?? [],
      key_strengths: profileSummary.key_strengths ?? [],
    };
    summary.data_sources.profile_loaded = true;
  }

  const healthy = await checkAICoreHealth().catch(() => false);
  summary.data_sources.ai_core_available = healthy;
  if (healthy && orgId) {
    await enrichFromAICore(summary, orgId, eventId);
  }

  const loadedCount = Object.entries(summary.data_sources)
    .filter(([k, v]) => k.endsWith("_loaded") && v === true).length;
  summary.data_sources.partial = loadedCount < 6;

  summary.generated_in_ms = Date.now() - start;
  LOG(`Session ${sessionId} intelligence assembled in ${summary.generated_in_ms}ms (${loadedCount}/6 sources loaded)`);
  return summary;
}

export async function getOrgIntelligence(organisationId: string): Promise<IntelligenceSummary> {
  const start = Date.now();
  const summary = emptyIntelligenceSummary(null, organisationId, null);

  const healthy = await checkAICoreHealth().catch(() => false);
  summary.data_sources.ai_core_available = healthy;
  if (!healthy) {
    LOG(`AI Core not available for org ${organisationId}`);
    summary.generated_in_ms = Date.now() - start;
    return summary;
  }

  await enrichFromAICore(summary, organisationId, null);

  const orgRelevantSources = ["profile_loaded", "benchmark_loaded"];
  const orgLoadedCount = orgRelevantSources.filter(k => (summary.data_sources as any)[k] === true).length;
  summary.data_sources.partial = orgLoadedCount < 1;

  summary.generated_in_ms = Date.now() - start;
  LOG(`Org ${organisationId} intelligence assembled in ${summary.generated_in_ms}ms (${orgLoadedCount}/2 org sources loaded)`);
  return summary;
}

async function enrichFromAICore(
  summary: IntelligenceSummary,
  orgId: string,
  eventId: string | null,
): Promise<void> {
  const profile = await cachedProfile(orgId);
  if (profile) {
    applyProfile(summary, profile);
    summary.data_sources.profile_loaded = true;
  } else {
    summary.data_sources.failed_sources.push("profile");
  }

  const orgSlug = orgId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const orgBm = await cachedBenchmark(`organisation:${orgSlug}`);
  const globalBm = orgBm ? null : await cachedBenchmark("global:all");
  const bm = orgBm ?? globalBm;
  if (bm) {
    applyBenchmark(summary, bm);
    summary.data_sources.benchmark_loaded = true;
  } else {
    summary.data_sources.failed_sources.push("benchmark");
  }

  if (eventId) {
    try {
      const briefing = await generateBriefing({
        organisation_id: orgId,
        event_id: eventId,
      });
      if (briefing) {
        applyBriefing(summary, briefing);
        summary.data_sources.briefing_loaded = true;
      }
    } catch {
      summary.data_sources.failed_sources.push("briefing");
    }
  }

  if (summary.governance_summary.record_id) {
    try {
      const gov = await getGovernanceRecord(summary.governance_summary.record_id);
      applyGovernance(summary, gov);
    } catch {
      summary.data_sources.failed_sources.push("governance_detail");
    }
  }
}

function fillAnalysisOutputs(summary: IntelligenceSummary, results: Record<string, any>): void {
  if (results.sentiment_analysis) {
    const sa = results.sentiment_analysis;
    summary.sentiment_summary = {
      overall: sa.overall ?? sa.sentiment ?? "neutral",
      score: sa.score ?? sa.sentiment_score ?? 0,
      positive_signals: sa.positive_signals ?? sa.positive_count ?? 0,
      negative_signals: sa.negative_signals ?? sa.negative_count ?? 0,
      neutral_signals: sa.neutral_signals ?? sa.neutral_count ?? 0,
      key_themes: sa.key_themes ?? sa.themes ?? [],
    };
  }

  if (results.commitment_extraction) {
    const ce = results.commitment_extraction;
    const commitments = ce.commitments ?? ce.extracted ?? [];
    summary.key_commitments = commitments.slice(0, 10).map((c: any) => ({
      text: c.commitment_text ?? c.text ?? "",
      speaker: c.speaker ?? c.speaker_name ?? null,
      type: c.commitment_type ?? c.type ?? "general",
      confidence: c.confidence ?? 0,
      drift_detected: c.drift_detected ?? false,
    }));
  }

  if (results.compliance_screening) {
    const cs = results.compliance_screening;
    const flags = cs.flags ?? cs.compliance_flags ?? [];
    summary.top_compliance_issues = flags.slice(0, 10).map((f: any) => ({
      flag_type: f.flag_type ?? f.type ?? "unknown",
      severity: f.severity ?? "medium",
      speaker: f.speaker ?? f.speaker_name ?? null,
      matched_pattern: f.matched_pattern ?? f.pattern ?? f.statement ?? "",
    }));

    if (flags.length > 0 && summary.overall_risk.source === "none") {
      const criticalCount = flags.filter((f: any) => f.severity === "critical").length;
      const highCount = flags.filter((f: any) => f.severity === "high").length;
      const level = criticalCount > 0 ? "critical" : highCount > 2 ? "high" : highCount > 0 ? "medium" : "low";
      summary.overall_risk = {
        level,
        score: riskLevelToScore(level),
        source: "compliance",
      };
    }
  }
}

function applyProfile(summary: IntelligenceSummary, profile: AICoreProfileResponse): void {
  const ps = profile.profile_summary;
  summary.profile_summary = {
    version: profile.version,
    events_incorporated: profile.events_incorporated,
    overall_risk_level: ps.overall_risk_level,
    delivery_reliability: ps.delivery_reliability,
    relationship_health: ps.relationship_health,
    governance_quality: ps.governance_quality,
    confidence: ps.confidence,
    key_concerns: ps.key_concerns,
    key_strengths: ps.key_strengths,
  };

  if (summary.overall_risk.source === "none") {
    summary.overall_risk = {
      level: ps.overall_risk_level,
      score: riskLevelToScore(ps.overall_risk_level),
      source: "profile",
    };
  }

  const sc = profile.sector_context ?? {};
  if (sc.benchmark_segment) {
    const positions: Record<string, string> = {};
    for (const key of ["compliance_position", "commitment_position", "drift_position", "sentiment_position", "governance_position"]) {
      if (sc[key]) positions[key.replace("_position", "")] = sc[key];
    }
    if (Object.keys(positions).length > 0) {
      summary.benchmark_context.positions = positions;
      summary.benchmark_context.segment = sc.benchmark_segment;
      summary.benchmark_context.quality = sc.benchmark_quality ?? "unknown";
    }
  }
}

function applyBenchmark(summary: IntelligenceSummary, bm: AICoreBenchmarkResponse): void {
  const bmSummary = bm.summary;
  if (!summary.benchmark_context.segment) {
    summary.benchmark_context.segment = bm.segment_key;
  }
  summary.benchmark_context.event_count = bmSummary.event_count;
  summary.benchmark_context.quality = bmSummary.confidence > 0.5 ? "reliable" : "low_sample";

  const concerns: string[] = [];
  const strengths: string[] = [];

  if (bmSummary.drift_rate > 0.3) concerns.push(`High drift rate: ${(bmSummary.drift_rate * 100).toFixed(0)}%`);
  else if (bmSummary.drift_rate < 0.1) strengths.push(`Low drift rate: ${(bmSummary.drift_rate * 100).toFixed(0)}%`);

  if (bmSummary.avg_flags_per_event > 5) concerns.push(`Above-average compliance flags: ${bmSummary.avg_flags_per_event.toFixed(1)}/event`);
  else if (bmSummary.avg_flags_per_event < 2) strengths.push(`Below-average compliance flags: ${bmSummary.avg_flags_per_event.toFixed(1)}/event`);

  if (bmSummary.avg_sentiment_score < 0.3) concerns.push("Low average sentiment across benchmark");
  else if (bmSummary.avg_sentiment_score > 0.6) strengths.push("Strong positive sentiment trend");

  summary.benchmark_context.concerns = [...summary.benchmark_context.concerns, ...concerns];
  summary.benchmark_context.strengths = [...summary.benchmark_context.strengths, ...strengths];
}

function applyBriefing(summary: IntelligenceSummary, briefing: AICoreBriefingResponse): void {
  if (briefing.sentiment_summary && !summary.sentiment_summary.key_themes.length) {
    summary.sentiment_summary = {
      overall: briefing.sentiment_summary.overall,
      score: briefing.sentiment_summary.score,
      positive_signals: briefing.sentiment_summary.positive_signals,
      negative_signals: briefing.sentiment_summary.negative_signals,
      neutral_signals: briefing.sentiment_summary.neutral_signals,
      key_themes: briefing.sentiment_summary.key_themes,
    };
  }

  summary.top_predicted_questions = (briefing.predicted_questions ?? []).slice(0, 5).map(q => ({
    question: q.question,
    likelihood: q.likelihood,
    theme: q.theme,
    rationale: q.rationale,
  }));

  summary.key_pressure_points = (briefing.pressure_points ?? []).slice(0, 5).map(p => ({
    area: p.area,
    severity: p.severity,
    source: p.source,
    detail: p.detail,
  }));

  if (briefing.narrative_risk && summary.overall_risk.source === "none") {
    summary.overall_risk = {
      level: briefing.narrative_risk.level,
      score: briefing.narrative_risk.score,
      source: "briefing",
    };
  }
}

function applyGovernance(summary: IntelligenceSummary, gov: AICoreGovernanceResponse): void {
  summary.governance_summary = {
    record_id: gov.governance_record_id,
    record_type: gov.record_type,
    total_commitments: gov.commitment_register.length,
    total_flags: gov.risk_compliance_summary.total_flags,
    overall_risk_level: gov.risk_compliance_summary.overall_risk_level,
    executive_summary: gov.meeting_summary.executive_summary,
    matters_arising: gov.matters_arising.length,
  };

  if (gov.commitment_register.length > 0 && summary.key_commitments.length === 0) {
    summary.key_commitments = gov.commitment_register.slice(0, 10).map(c => ({
      text: c.commitment_text,
      speaker: c.speaker ?? null,
      type: c.commitment_type,
      confidence: c.confidence,
      drift_detected: c.drift_detected,
    }));
  }

  if (gov.risk_compliance_summary.flags.length > 0 && summary.top_compliance_issues.length === 0) {
    summary.top_compliance_issues = gov.risk_compliance_summary.flags.slice(0, 10).map(f => ({
      flag_type: f.flag_type,
      severity: f.severity,
      speaker: f.speaker ?? null,
      matched_pattern: f.matched_pattern,
    }));
  }

  if (summary.overall_risk.source !== "governance") {
    summary.overall_risk = {
      level: gov.risk_compliance_summary.overall_risk_level,
      score: riskLevelToScore(gov.risk_compliance_summary.overall_risk_level),
      source: "governance",
    };
  }
}

function riskLevelToScore(level: string): number {
  switch (level.toLowerCase()) {
    case "critical": return 1.0;
    case "high": return 0.75;
    case "elevated":
    case "medium": return 0.5;
    case "low": return 0.25;
    case "minimal":
    case "none": return 0.0;
    default: return 0;
  }
}

function parseJson(val: any): Record<string, any> | null {
  if (!val) return null;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return null; }
}
