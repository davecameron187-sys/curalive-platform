const AI_CORE_BASE_URL = process.env.AI_CORE_URL ?? "http://localhost:5000";
const LOG = (msg: string) => console.log(`[AICoreClient] ${msg}`);
const ERR = (msg: string, e: any) => console.error(`[AICoreClient] ${msg}`, e);

export interface AICoreAnalysisRequest {
  canonical_event: {
    event_id: string;
    title: string;
    organisation_id: string;
    organisation_name?: string | null;
    event_type: string;
    jurisdiction?: string | null;
    signal_source?: string;
    speakers: Array<{
      speaker_id: string;
      display_name?: string | null;
      role?: string | null;
      segment_count: number;
      total_words: number;
    }>;
    segments: Array<{
      speaker_id: string;
      speaker_name?: string | null;
      text: string;
      start_time?: number | null;
      end_time?: number | null;
      word_count: number;
    }>;
    total_segments: number;
    total_words: number;
    total_speakers: number;
    questions: Array<Record<string, any>>;
    compliance_flags: Array<Record<string, any>>;
  };
  modules: string[];
}

export interface AICoreModuleOutput {
  module: string;
  status: string;
  result: Record<string, any>;
  error?: string | null;
}

export interface AICoreAnalysisResponse {
  job_id: string;
  event_id: string;
  organisation_id: string;
  overall_status: "complete" | "partial" | "error" | "queued" | "running";
  modules_requested: string[];
  modules_completed: string[];
  modules_failed: string[];
  outputs: AICoreModuleOutput[];
  duration_ms: number | null;
  created_at: string | null;
}

export interface AICoreJobSummary {
  job_id: string;
  event_id: string;
  organisation_id: string;
  overall_status: string;
  requested_modules: string[];
  completed_modules: string[];
  failed_modules: string[];
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AICoreJobResults {
  job_id: string;
  event_id: string;
  organisation_id: string;
  overall_status: string;
  modules: AICoreModuleOutput[];
  commitments_persisted: number;
  compliance_flags_persisted: number;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI Core ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function checkAICoreHealth(): Promise<boolean> {
  try {
    const data = await fetchJSON<{ status: string }>(`${AI_CORE_BASE_URL}/health`);
    return data.status === "ok";
  } catch (e) {
    ERR("Health check failed", e);
    return false;
  }
}

export async function runAICoreAnalysis(
  request: AICoreAnalysisRequest
): Promise<AICoreAnalysisResponse> {
  LOG(`Running analysis for event ${request.canonical_event.event_id} (${request.modules.length} modules)`);
  const start = Date.now();

  const result = await fetchJSON<AICoreAnalysisResponse>(
    `${AI_CORE_BASE_URL}/api/analysis/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );

  LOG(`Analysis complete: job=${result.job_id} status=${result.overall_status} (${Date.now() - start}ms)`);
  return result;
}

export async function getAICoreJobSummary(jobId: string): Promise<AICoreJobSummary> {
  return fetchJSON<AICoreJobSummary>(`${AI_CORE_BASE_URL}/api/analysis/jobs/${jobId}`);
}

export async function getAICoreJobResults(jobId: string): Promise<AICoreJobResults> {
  return fetchJSON<AICoreJobResults>(`${AI_CORE_BASE_URL}/api/analysis/jobs/${jobId}/results`);
}

export interface AICoreDriftSourceStatement {
  text: string;
  speaker_id?: string | null;
  speaker_name?: string | null;
  source_type?: string;
  source_reference?: string;
  timestamp?: number | null;
}

export interface AICoreDriftRequest {
  organisation_id: string;
  event_id?: string | null;
  job_id?: string | null;
  statements: AICoreDriftSourceStatement[];
}

export interface AICoreDriftEventSummary {
  drift_event_id: string;
  commitment_id: string;
  commitment_text: string;
  drift_type: "semantic" | "numerical" | "timing" | "directional";
  severity: "low" | "medium" | "high";
  matched_text: string;
  explanation: string;
  confidence: number;
  source_type: string;
  source_reference: string;
}

export interface AICoreDriftResponse {
  organisation_id: string;
  event_id: string | null;
  commitments_evaluated: number;
  statements_processed: number;
  drift_events_created: number;
  drift_events: AICoreDriftEventSummary[];
  duration_ms: number | null;
}

export async function runAICoreDriftDetection(
  request: AICoreDriftRequest,
): Promise<AICoreDriftResponse> {
  LOG(`Running drift detection for org=${request.organisation_id} (${request.statements.length} statements)`);
  const start = Date.now();

  const result = await fetchJSON<AICoreDriftResponse>(
    `${AI_CORE_BASE_URL}/api/drift/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  LOG(`Drift detection complete: ${result.drift_events_created} drifts found across ${result.commitments_evaluated} commitments (${Date.now() - start}ms)`);
  return result;
}

export interface AICoreStakeholderSignalInput {
  organisation_id: string;
  signal_type: string;
  source_name: string;
  source_url?: string | null;
  author?: string | null;
  title?: string | null;
  content: string;
  sentiment?: string | null;
  topics?: string[] | null;
  relevance_score?: number;
  signal_date?: string | null;
  metadata?: Record<string, any> | null;
}

export interface AICoreStakeholderBatchRequest {
  signals: AICoreStakeholderSignalInput[];
}

export interface AICoreStakeholderSignalResponse {
  signal_id: string;
  organisation_id: string;
  signal_type: string;
  source_name: string;
  sentiment: string | null;
  sentiment_score: number | null;
  topics: string[] | null;
  created_at: string;
}

export interface AICoreStakeholderBatchResponse {
  ingested: number;
  signals: AICoreStakeholderSignalResponse[];
}

export async function ingestStakeholderSignals(
  request: AICoreStakeholderBatchRequest,
): Promise<AICoreStakeholderBatchResponse> {
  LOG(`Ingesting ${request.signals.length} stakeholder signals`);
  const result = await fetchJSON<AICoreStakeholderBatchResponse>(
    `${AI_CORE_BASE_URL}/api/stakeholder/ingest`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
  LOG(`Ingested ${result.ingested} signals`);
  return result;
}

export interface AICoreBriefingRequest {
  organisation_id: string;
  event_id?: string | null;
  event_name?: string | null;
  event_type?: string | null;
}

export interface AICoreBriefingTopicEntry {
  topic: string;
  confidence: number;
  source: string;
  detail: string | null;
}

export interface AICoreBriefingPressurePoint {
  area: string;
  severity: string;
  source: string;
  detail: string;
}

export interface AICoreBriefingSentimentSummary {
  overall: string;
  score: number;
  positive_signals: number;
  negative_signals: number;
  neutral_signals: number;
  key_themes: string[];
}

export interface AICoreBriefingPredictedQuestion {
  question: string;
  likelihood: string;
  source: string;
  theme: string;
  rationale: string;
}

export interface AICoreBriefingNarrativeRisk {
  level: string;
  score: number;
  indicators: string[];
  detail: string;
}

export interface AICoreBriefingResponse {
  briefing_id: string;
  organisation_id: string;
  event_id: string | null;
  event_name: string | null;
  likely_topics: AICoreBriefingTopicEntry[];
  pressure_points: AICoreBriefingPressurePoint[];
  sentiment_summary: AICoreBriefingSentimentSummary;
  predicted_questions: AICoreBriefingPredictedQuestion[];
  narrative_risk: AICoreBriefingNarrativeRisk;
  signals_used: number;
  commitments_referenced: number;
  drift_events_referenced: number;
  confidence: number;
  duration_ms: number | null;
  created_at: string | null;
}

export async function generateBriefing(
  request: AICoreBriefingRequest,
): Promise<AICoreBriefingResponse> {
  LOG(`Generating briefing for org=${request.organisation_id} event=${request.event_id ?? "none"}`);
  const start = Date.now();

  const result = await fetchJSON<AICoreBriefingResponse>(
    `${AI_CORE_BASE_URL}/api/briefing/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  LOG(`Briefing generated: ${result.briefing_id} (${result.likely_topics.length} topics, ${result.predicted_questions.length} questions, risk=${result.narrative_risk.level}) in ${Date.now() - start}ms`);
  return result;
}

export async function getBriefing(briefingId: string): Promise<AICoreBriefingResponse> {
  return fetchJSON<AICoreBriefingResponse>(`${AI_CORE_BASE_URL}/api/briefing/${briefingId}`);
}

export interface AICoreGovernanceSegment {
  speaker_id?: string | null;
  speaker_name?: string | null;
  text: string;
  start_time?: number | null;
  word_count?: number | null;
}

export interface AICoreGovernanceRequest {
  organisation_id: string;
  event_id?: string | null;
  event_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  analysis_job_id?: string | null;
  briefing_id?: string | null;
  segments?: AICoreGovernanceSegment[];
  include_matters_arising?: boolean;
}

export interface AICoreGovernanceMeetingSummary {
  title: string;
  date: string | null;
  event_type: string | null;
  duration: string | null;
  total_speakers: number;
  total_segments: number;
  key_topics: string[];
  executive_summary: string;
  speaker_contributions: Array<{
    speaker_name: string;
    word_count: number;
    segment_count: number;
    share_pct: number;
  }>;
}

export interface AICoreGovernanceCommitmentEntry {
  commitment_id: string;
  speaker: string | null;
  commitment_text: string;
  commitment_type: string;
  deadline: string | null;
  has_quantitative_target: boolean;
  quantitative_values: string[];
  status: string;
  confidence: number;
  drift_detected: boolean;
  drift_details: Record<string, any> | null;
}

export interface AICoreGovernanceComplianceFlag {
  flag_id: string;
  flag_type: string;
  severity: string;
  speaker: string | null;
  matched_pattern: string;
  segment_text: string;
}

export interface AICoreGovernanceRiskSummary {
  total_flags: number;
  critical_flags: number;
  high_flags: number;
  medium_flags: number;
  low_flags: number;
  flags: AICoreGovernanceComplianceFlag[];
  drift_summary: Record<string, any>;
  narrative_risk: Record<string, any>;
  overall_risk_level: string;
}

export interface AICoreGovernanceMattersArising {
  source: string;
  reference_type: string;
  reference_id: string | null;
  description: string;
  status: string;
  original_event: string | null;
  current_position: string | null;
  severity: string;
}

export interface AICoreGovernanceDataSources {
  analysis_job_id: string | null;
  briefing_id: string | null;
  commitments_count: number;
  compliance_flags_count: number;
  drift_events_count: number;
  signals_count: number;
  segments_count: number;
}

export interface AICoreGovernanceResponse {
  governance_record_id: string;
  organisation_id: string;
  event_id: string | null;
  event_name: string | null;
  event_type: string | null;
  event_date: string | null;
  record_type: string;
  meeting_summary: AICoreGovernanceMeetingSummary;
  commitment_register: AICoreGovernanceCommitmentEntry[];
  risk_compliance_summary: AICoreGovernanceRiskSummary;
  matters_arising: AICoreGovernanceMattersArising[];
  data_sources: AICoreGovernanceDataSources;
  confidence: number;
  duration_ms: number | null;
  created_at: string | null;
}

export async function generateGovernanceRecord(
  request: AICoreGovernanceRequest,
): Promise<AICoreGovernanceResponse> {
  LOG(`Generating governance record for org=${request.organisation_id} event=${request.event_id ?? "none"}`);
  const start = Date.now();

  const result = await fetchJSON<AICoreGovernanceResponse>(
    `${AI_CORE_BASE_URL}/api/governance/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  LOG(`Governance record generated: ${result.governance_record_id} (${result.commitment_register.length} commitments, ${result.risk_compliance_summary.total_flags} flags, ${result.matters_arising.length} matters arising, risk=${result.risk_compliance_summary.overall_risk_level}) in ${Date.now() - start}ms`);
  return result;
}

export async function getGovernanceRecord(recordId: string): Promise<AICoreGovernanceResponse> {
  return fetchJSON<AICoreGovernanceResponse>(`${AI_CORE_BASE_URL}/api/governance/${recordId}`);
}

export interface AICoreProfileUpdateRequest {
  organisation_id: string;
  event_id?: string | null;
  event_name?: string | null;
  event_type?: string | null;
  force_rebuild?: boolean;
}

export interface AICoreProfileSummary {
  organisation_id: string;
  events_incorporated: number;
  overall_risk_level: string;
  delivery_reliability: string;
  relationship_health: string;
  governance_quality: string;
  key_concerns: string[];
  key_strengths: string[];
  confidence: number;
}

export interface AICoreProfileResponse {
  profile_id: string;
  organisation_id: string;
  speaker_profiles: Record<string, any>;
  compliance_risk_profile: Record<string, any>;
  commitment_delivery_profile: Record<string, any>;
  stakeholder_relationship_profile: Record<string, any>;
  governance_trajectory_profile: Record<string, any>;
  sector_context: Record<string, any>;
  profile_summary: AICoreProfileSummary;
  events_incorporated: number;
  last_event_id: string | null;
  confidence: number;
  version: number;
  duration_ms: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AICoreProfileSummaryResponse {
  organisation_id: string;
  profile_summary: AICoreProfileSummary;
  events_incorporated: number;
  last_event_id: string | null;
  confidence: number;
  version: number;
  updated_at: string;
}

export async function updateOrgProfile(
  request: AICoreProfileUpdateRequest,
): Promise<AICoreProfileResponse> {
  LOG(`Updating profile for org=${request.organisation_id} event=${request.event_id ?? "none"}`);
  const start = Date.now();

  const result = await fetchJSON<AICoreProfileResponse>(
    `${AI_CORE_BASE_URL}/api/profile/update`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  const ps = result.profile_summary;
  LOG(`Profile updated: v${result.version} (risk=${ps.overall_risk_level}, reliability=${ps.delivery_reliability}, health=${ps.relationship_health}, governance=${ps.governance_quality}, ${ps.key_concerns.length} concerns, ${ps.key_strengths.length} strengths) in ${Date.now() - start}ms`);
  return result;
}

export async function getOrgProfile(organisationId: string): Promise<AICoreProfileResponse> {
  return fetchJSON<AICoreProfileResponse>(`${AI_CORE_BASE_URL}/api/profile/${organisationId}`);
}

export async function getOrgProfileSummary(organisationId: string): Promise<AICoreProfileSummaryResponse> {
  return fetchJSON<AICoreProfileSummaryResponse>(`${AI_CORE_BASE_URL}/api/profile/${organisationId}/summary`);
}

export interface AICoreBenchmarkBuildRequest {
  segment_type?: string | null;
  segment_value?: string | null;
  force_rebuild?: boolean;
}

export interface AICoreBenchmarkSummary {
  segment_key: string;
  segment_type: string;
  segment_value: string;
  event_count: number;
  organisation_count: number;
  avg_flags_per_event: number;
  avg_commitments_per_event: number;
  drift_rate: number;
  avg_sentiment_score: number;
  avg_governance_confidence: number;
  most_common_risk_level: string | null;
  top_topics: string[];
  confidence: number;
}

export interface AICoreBenchmarkResponse {
  benchmark_id: string;
  segment_key: string;
  segment_type: string;
  segment_value: string;
  event_count: number;
  organisation_count: number;
  compliance_baselines: Record<string, any>;
  commitment_baselines: Record<string, any>;
  drift_baselines: Record<string, any>;
  sentiment_baselines: Record<string, any>;
  governance_baselines: Record<string, any>;
  topic_baselines: Record<string, any>;
  summary: AICoreBenchmarkSummary;
  confidence: number;
  version: number;
  duration_ms: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AICoreBenchmarkBuildResponse {
  benchmarks_built: number;
  segments: AICoreBenchmarkResponse[];
  duration_ms: number;
}

export interface AICoreBenchmarkListResponse {
  benchmarks: Array<{
    benchmark_id: string;
    segment_key: string;
    segment_type: string;
    segment_value: string;
    event_count: number;
    organisation_count: number;
    compliance_baselines: Record<string, any>;
    commitment_baselines: Record<string, any>;
    drift_baselines: Record<string, any>;
    sentiment_baselines: Record<string, any>;
    governance_baselines: Record<string, any>;
    topic_baselines: Record<string, any>;
    summary: Record<string, any>;
    confidence: number;
    version: number;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

export interface AICoreSectorEnrichmentRequest {
  organisation_id: string;
  apply?: boolean;
}

export interface AICoreSectorEnrichmentResponse {
  organisation_id: string;
  sector_context: Record<string, any>;
  benchmark_comparison: Record<string, any>;
  profile_summary_updates: Record<string, any> | null;
  applied: boolean;
  duration_ms: number;
}

export async function buildBenchmarks(
  request: AICoreBenchmarkBuildRequest,
): Promise<AICoreBenchmarkBuildResponse> {
  LOG(`Building benchmarks (type=${request.segment_type ?? "all"}, value=${request.segment_value ?? "all"})`);
  const start = Date.now();

  const result = await fetchJSON<AICoreBenchmarkBuildResponse>(
    `${AI_CORE_BASE_URL}/api/benchmark/build`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  LOG(`Benchmarks built: ${result.benchmarks_built} segments in ${Date.now() - start}ms`);
  return result;
}

export async function listBenchmarks(segmentType?: string): Promise<AICoreBenchmarkListResponse> {
  const url = segmentType
    ? `${AI_CORE_BASE_URL}/api/benchmark/list?segment_type=${encodeURIComponent(segmentType)}`
    : `${AI_CORE_BASE_URL}/api/benchmark/list`;
  return fetchJSON<AICoreBenchmarkListResponse>(url);
}

export async function getBenchmark(segmentKey: string): Promise<AICoreBenchmarkResponse> {
  return fetchJSON<AICoreBenchmarkResponse>(`${AI_CORE_BASE_URL}/api/benchmark/${segmentKey}`);
}

export async function enrichSectorContext(
  request: AICoreSectorEnrichmentRequest,
): Promise<AICoreSectorEnrichmentResponse> {
  LOG(`Enriching sector context for org=${request.organisation_id} (apply=${request.apply ?? false})`);
  const start = Date.now();

  const result = await fetchJSON<AICoreSectorEnrichmentResponse>(
    `${AI_CORE_BASE_URL}/api/benchmark/enrich-sector`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  LOG(`Sector enrichment complete: applied=${result.applied} in ${Date.now() - start}ms`);
  return result;
}
