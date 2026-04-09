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
