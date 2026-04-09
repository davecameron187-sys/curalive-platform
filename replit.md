# CuraLive Platform

## Overview

CuraLive is a patented, real-time investor events intelligence platform offering live webcasting, telephony bridge conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services. Its core purpose is to make regulated corporate communication events intelligent before they start, compliant while they run, and actionable immediately. The platform aims for an $80M–$120M strategic acquisition within 24–36 months, with potential acquirers including Microsoft, Bloomberg, Nasdaq, Lumi Global, and Broadridge. Lumi Global and Bastion Group are key channel partners, leveraging CuraLive's capabilities for thousands of events annually. The platform also aims to generate alternative data for fund managers through its CuraLive Weighted Sentiment Index (CWSI).

## User Preferences

- **tRPC routers**: Register every new router in BOTH `server/routers.eager.ts` AND `server/routers.ts`.
- **tRPC imports**: Always use `"../_core/trpc"` for tRPC imports.
- **Toast notifications**: Only use `sonner`.
- **rawSql() behaviour**: `rawSql()` auto-appends `RETURNING id` and translates `?` to `$1/$2`. Do not manually add RETURNING id.
- **camelCase columns**: Double-quote camelCase column names in raw SQL. Example: `"createdAt"`.
- **Schema migrations**: Always use `drizzle-kit push --force`. Never `pnpm run db:push`.
- **Recall.ai webhook order**: Recall.ai webhook middleware MUST be registered before `express.json()`.
- **NUMERIC wrapping**: Wrap PostgreSQL `NUMERIC` from `rawSql()` in `Number()` before arithmetic.
- **Bigint timestamps**: `rawSql()` auto-converts numbers 1e12–1e13 to `Date` objects. Pass epoch values as strings.
- **Production build**: Rebuild `dist/` with esbuild before publishing.
- **Replit config**: Do not modify the `.replit` file directly.
- **Vendor names on client pages**: NEVER show on `/live/:token`, `/report/:token`, `/presenter/:token`: Whisper, Recall.ai, GPT-4o, OpenAI, Gemini, Ably, Twilio, Mux, Resend. Use: "CuraLive Intelligence Agent", "AI transcription", "CuraLive AI".
- **health_checks tables**: Created via raw SQL. Timestamp columns must be `TIMESTAMP` type, not bigint.
- **ai_am_audit_log**: `ai_am_audit_log.timestamp` is `bigint` (epoch ms). Do not treat as a date column.

## System Architecture

The CuraLive platform is built as a pnpm monorepo using TypeScript, with a React frontend and a Node.js backend.

### Frontend
- **Framework**: React 19.2.1, Vite 7.3.1.
- **Styling**: TailwindCSS 4.1.14, Framer Motion 12.23.22, Radix UI primitives.
- **State Management**: TanStack React Query 5.90.2, tRPC React Query 11.6.0.
- **Data Visualization**: Recharts 2.15.2, Chart.js 4.5.1.
- **Forms**: React Hook Form 7.64.0 with Zod 4.1.12 validation.
- **UI Components**: Sonner for toast notifications, Lucide React for icons.
- **Routing**: Wouter 3.3.5.
- **Client Pages**: `/live/:token`, `/report/:token`, `/presenter/:token`, `/qa/:accessCode`, `/virtual-studio`, `/feature-map`. These are client-facing dashboards and interaction points, featuring real-time data, reporting, Q&A, and partner branding.

### Backend
- **Runtime**: Node.js 20+, Express 4.21.2.
- **API**: tRPC Server 11.6.0 (110 routers).
- **ORM**: Drizzle ORM 0.44.5 with PostgreSQL (pg 8.20.0), managing 208 tables.
- **Authentication**: JWT cookie sessions (`app_session_id`), supporting OAuth and a role hierarchy (viewer, operator, admin) via tRPC procedures (`publicProcedure`, `protectedProcedure`, `operatorProcedure`, `adminProcedure`).
- **Storage**: Unified `storageAdapter.ts` utilizing Replit forge API for object storage, with local disk fallback.
- **Background Services**: Seven auto-starting services manage infrastructure monitoring (HealthGuardian), compliance (ComplianceEngine, ComplianceDeadlineMonitor), event scheduling (BriefingScheduler, ReminderScheduler), session recovery (ShadowWatchdog), and conference orchestration (ConferenceDialoutService).
- **AI Intelligence Pipeline**: A five-layered system for transcription, real-time processing (sentiment, Q&A triage, compliance), 20-module intelligence reporting, specialist services (crisis prediction, valuation oracle), and AI self-evolution (meta-observer, gap detection, evolution engine, governance gateway).
- **White-Labeling**: Implemented via a `brandConfig.ts` middleware that reads the incoming domain to apply partner-specific branding (e.g., Lumi Global, Bastion Group) and supports custom domains and email configurations.
- **Core Features**:
    - **Shadow Mode**: Operator Console with 11 live tabs including Live Intelligence, Archives & Reports, AI Dashboard, Live Q&A (with AI triage and pattern analysis), Board Compass, Compliance Monitor, and System Diagnostics.
    - **Operator Console Additions**: TranscriptFlagTimeline, CollapsibleBottomTray, TeamCoordinationPanel (multi-operator support), ConsoleModeSwitcher, SessionSetupPanel, SessionScheduler, ClientMessagePanel.
    - **Intelligence Tiers**: Essential, Intelligence, Enterprise, and AGM tiers offer varying levels of live dashboard features and post-event reporting modules.
    - **New Services**: `ClientDeliveryService.ts` for tokenized links and email dispatch, `ComplianceDeadlineService.ts` for monitoring and escalation, `PreEventBriefingService.ts` for automated briefings.
    - **AI Report Pipeline**: `AIReportPipeline.ts` generates 10-module intelligence reports (executive summary, financial metrics, compliance flags, management tone, Q&A quality, board actions, social media pack, SENS/RNS draft, board intelligence, critical actions). Reports are stored in `archive_events.ai_report` (JSON column, keyed by `event_id = 'shadow-{sessionId}'`). Pipeline is invoked by `SessionClosePipeline.ts` on session end. Report data is read via `partners.getReportByToken` (public, token-scoped) for `/report/:token` pages.

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **Ably**: Real-time pub/sub messaging for communication features.
- **Recall.ai**: AI bot deployment for integrating with conferencing platforms (Zoom, Teams, etc.).
- **Mux**: RTMP/HLS video streaming services.
- **OpenAI**: Provides GPT-4o for AI analysis and Whisper for transcription.
- **Twilio**: Used for PSTN telephony, IVR, SIP, and WebRTC.
- **Telnyx**: Failover voice carrier.
- **Stripe**: Payment processing.
- **Resend**: Transactional email and ICS calendar invites.
- **AWS S3**: Object storage for media and files.

## CuraLive AI Core (Python FastAPI)

A separate Python FastAPI backend skeleton for the CuraLive intelligence layer, running alongside the main Node.js platform.

### Location
- **Directory**: `curalive_ai_core/`
- **Workflow**: "CuraLive AI Core" (port 5000)
- **Runtime**: Python 3.12, FastAPI, SQLAlchemy 2.0, psycopg3

### Endpoints
- `GET /health` — Health check
- `POST /api/events/ingest` — Ingest raw event, normalize to canonical event model
- `POST /api/analysis/run` — Run AI analysis modules, persist results to DB, return structured output
- `GET /api/analysis/jobs/{job_id}` — Retrieve job summary (status, timing, module list)
- `GET /api/analysis/jobs/{job_id}/results` — Retrieve full module outputs from DB

### Analysis Modules (Phase 2 — all operational)
- **Sentiment** (`sentiment`): Per-segment and per-speaker sentiment scoring, tone shift detection, positive/negative signal counts
- **Engagement** (`engagement`): Speaking balance (Gini-based), share of voice, pace analysis (WPM), Q&A density, engagement score
- **Compliance Signals** (`compliance_signals`): Forward-looking statement detection, hedging language, regulatory triggers (IFRS/SEC/JSE/FSCA/King IV), risk level assessment
- **Commitment Extraction** (`commitment_extraction`): Explicit commitment extraction with deadline detection, quantitative target identification, confidence scoring, commitment type classification

### Database Tables (prefixed `aic_`)
- `aic_events` — Canonical event storage (UUID PKs)
- `aic_analysis_jobs` — Job tracking with status, timing, module lists (event_id, organisation_id indexed)
- `aic_analysis_results` — Per-module result payloads (JSONB), linked to job_id
- `aic_commitments` — Persisted commitments with type, deadline, confidence, quantitative targets
- `aic_compliance_flags` — Persisted compliance flags with type, severity, matched pattern
- `aic_drift_events` — Commitment drift detection (reserved for Phase 3+)

### Job Status Values
- `queued` — Created, not yet started
- `running` — Analysis in progress
- `complete` — All modules succeeded
- `partial` — Some modules succeeded, some failed
- `error` — All modules failed

### Integration Contract
- Full JSON contract documented in `curalive_ai_core/docs/integration_contract.md`
- Covers request/response/error formats, job status values, Node.js integration pattern

### Key Files (Python)
- `app/main.py` — FastAPI bootstrap with DB lifespan, router registration
- `app/api/routes/events.py` — Event ingestion endpoint
- `app/api/routes/analysis.py` — Analysis orchestration with persistence + job retrieval
- `app/schemas/event_ingest.py` — Canonical event model schemas
- `app/schemas/analysis.py` — Analysis request/response/job schemas
- `app/models/analysis_job.py` — AnalysisJob ORM model
- `app/models/analysis_result.py` — AnalysisResult ORM model
- `app/models/commitment.py` — Commitment ORM model
- `app/models/compliance_flag.py` — ComplianceFlag ORM model
- `app/services/sentiment.py` — Sentiment analysis service
- `app/services/engagement.py` — Engagement scoring service
- `app/services/compliance_signals.py` — Compliance signal detection service
- `app/services/commitment_extraction.py` — Commitment extraction service

### Node.js ↔ Python Integration (Phase 3B)
- `server/services/AICoreClient.ts` — Reusable HTTP client for all Python AI Core calls (health, run, job summary, job results)
- `server/services/AICorePayloadMapper.ts` — Maps Node session/transcript data into canonical event format
- `server/services/SessionClosePipeline.ts` — Now calls Python AI Core after session close, persists job_id and results
- **shadow_sessions columns added**: `ai_core_job_id` (VARCHAR), `ai_core_status` (VARCHAR), `ai_core_results` (JSONB)
- **Flow**: Session close → load transcript segments → map to canonical → POST /api/analysis/run → persist job_id + status + full results JSONB to shadow_sessions

### Phase 4A — Commitment Drift Detection
- `curalive_ai_core/app/services/commitment_drift.py` — Drift detection service: semantic, numerical, timing, directional inconsistency detection
- `curalive_ai_core/app/schemas/drift.py` — Pydantic schemas for drift request/response
- `curalive_ai_core/app/api/routes/drift.py` — `POST /api/drift/run` endpoint
- `curalive_ai_core/app/models/drift_event.py` — Updated DriftEvent model (14 cols)
- `server/services/AICoreClient.ts` — Added `runAICoreDriftDetection()` + typed interfaces
- **Table**: `aic_drift_events` — id, commitment_id, job_id, event_id, organisation_id, source_type, source_reference, drift_type, severity, matched_text, explanation, confidence, original_commitment_text, created_at

### Phase 4B — Drift Detection in SessionClosePipeline
- `server/services/SessionClosePipeline.ts` — Added `runDriftDetectionStep()`, triggered after AI Core analysis completes
- **shadow_sessions columns added**: `ai_drift_status` (VARCHAR), `ai_drift_results` (JSONB)
- **Flow**: Analysis complete → load transcript segments → map to drift statements → POST /api/drift/run → persist drift_status + drift_results JSONB
- **Non-blocking**: drift failures are logged and pipeline continues
- **Drift status values**: `running`, `drift_detected`, `no_drift`

### Phase 5 — Stakeholder Intelligence + Pre-Event Briefing
- `curalive_ai_core/app/models/stakeholder_signal.py` — StakeholderSignal model (15 cols)
- `curalive_ai_core/app/models/briefing.py` — Briefing model (16 cols)
- `curalive_ai_core/app/services/stakeholder_intelligence.py` — Auto sentiment/topic analysis for signals
- `curalive_ai_core/app/services/briefing_generator.py` — Generates structured briefings from signals + commitments + drifts
- `curalive_ai_core/app/schemas/stakeholder.py` — Pydantic schemas for signal ingestion/query
- `curalive_ai_core/app/schemas/briefing.py` — Pydantic schemas for briefing generation/retrieval
- `curalive_ai_core/app/api/routes/stakeholder.py` — `POST /api/stakeholder/ingest`, `POST /api/stakeholder/query`
- `curalive_ai_core/app/api/routes/briefing.py` — `POST /api/briefing/generate`, `GET /api/briefing/{id}`
- `server/services/AICoreClient.ts` — Added `ingestStakeholderSignals()`, `generateBriefing()`, `getBriefing()` + typed interfaces
- `server/services/PreEventBriefingService.ts` — Enriched with AI Core briefing before LLM fallback
- **Tables**: `aic_stakeholder_signals` (15 cols), `aic_briefings` (16 cols)
- **scheduled_sessions columns added**: `ai_briefing_id` (VARCHAR), `ai_briefing_results` (JSONB)

### Phase 6 — Governance Record Generation
- `curalive_ai_core/app/models/governance_record.py` — GovernanceRecord ORM model (15 cols)
- `curalive_ai_core/app/schemas/governance.py` — Pydantic schemas for generation (with segment input) and retrieval
- `curalive_ai_core/app/services/governance_generator.py` — Generates structured governance records: meeting summary, commitment register, risk/compliance summary, matters arising
- `curalive_ai_core/app/api/routes/governance.py` — `POST /api/governance/generate`, `GET /api/governance/{id}`
- `server/services/AICoreClient.ts` — Added `generateGovernanceRecord()`, `getGovernanceRecord()` + 10 typed interfaces
- `server/services/SessionClosePipeline.ts` — Added `runGovernanceRecordStep()` after drift detection; persists `ai_governance_id` + `ai_governance_results` JSONB to `shadow_sessions`
- **Table**: `aic_governance_records` (15 cols)
- **shadow_sessions columns added**: `ai_governance_id` (VARCHAR), `ai_governance_results` (JSONB)
- **Flow**: AI Core analysis → drift detection → governance generation → persist to shadow_sessions
- **Non-blocking**: governance failures are logged and pipeline continues
- **Governance inputs**: transcript segments, commitments, compliance flags, drift events, briefing context
- **Governance outputs**: meeting summary (speakers, topics, contributions), commitment register (with drift annotations), risk/compliance summary (flags + drift + narrative risk), matters arising (from drifts + escalated/deadline commitments)

### Phase 7A — Heartbeat Foundation / Institutional Knowledge Profile
- `curalive_ai_core/app/models/org_profile.py` — OrgProfile ORM model (15 cols, unique on organisation_id)
- `curalive_ai_core/app/schemas/profile.py` — Pydantic schemas for update/retrieval/summary with typed sub-schemas
- `curalive_ai_core/app/services/profile_generator.py` — ProfileGenerator: builds 6-dimension profile from all data sources
- `curalive_ai_core/app/api/routes/profile.py` — `POST /api/profile/update`, `GET /api/profile/{org_id}`, `GET /api/profile/{org_id}/summary`
- `server/services/AICoreClient.ts` — Added `updateOrgProfile()`, `getOrgProfile()`, `getOrgProfileSummary()` + typed interfaces
- `server/services/SessionClosePipeline.ts` — Added `runProfileUpdateStep()` after governance step; persists `ai_profile_version` + `ai_profile_summary` JSONB to `shadow_sessions`
- **Table**: `aic_org_profiles` (15 cols, unique org_id, versioned)
- **shadow_sessions columns added**: `ai_profile_version` (INTEGER), `ai_profile_summary` (JSONB)
- **Profile dimensions**: speaker_profiles, compliance_risk_profile, commitment_delivery_profile, stakeholder_relationship_profile, governance_trajectory_profile, sector_context
- **Flow**: AI Core analysis → drift → governance → **profile update** → AI report → delivery
- **Non-blocking**: profile failures are logged and pipeline continues

### Phase 8A — Internal Benchmarking Foundation / Sector Context Enrichment
- `curalive_ai_core/app/models/benchmark.py` — Benchmark ORM model (17 cols, unique segment_key)
- `curalive_ai_core/app/schemas/benchmark.py` — Pydantic schemas for build/retrieve/list/enrich with typed baseline sub-schemas
- `curalive_ai_core/app/services/benchmark_generator.py` — BenchmarkGenerator: aggregates event/org data into baselines + sector enrichment
- `curalive_ai_core/app/api/routes/benchmark.py` — `POST /api/benchmark/build`, `GET /api/benchmark/list`, `GET /api/benchmark/{segment_key}`, `POST /api/benchmark/enrich-sector`
- `server/services/AICoreClient.ts` — Added `buildBenchmarks()`, `listBenchmarks()`, `getBenchmark()`, `enrichSectorContext()` + 7 typed interfaces
- **Table**: `aic_benchmarks` (17 cols, unique segment_key, versioned)
- **Segmentation**: global, event_type, organisation (extensible to jurisdiction, sector, reporting_period)
- **Baseline dimensions**: compliance, commitment, drift, sentiment, governance, topics
- **Sector enrichment**: compares org profile vs benchmark, positions as above/at/below benchmark, updates sector_context + profile_summary
- **No pipeline integration** yet — benchmarks are built on-demand via API

### Phase 8B — Benchmark Hardening + Auto-Enrichment
- **Quality controls** in `BenchmarkGenerator`: `assess_quality()` flags low_sample (< 3 events), zero_events, weak_confidence (< 0.3); `select_best_segment()` filters zero-event/weak-confidence candidates, falls back to global:all
- **aic_benchmarks new columns**: `last_refresh_source` (VARCHAR 128), `refresh_scope` (VARCHAR 32), `low_sample` (BOOLEAN), `fallback_segment_used` (VARCHAR 256)
- **Benchmark summary** now includes `low_sample` flag and `quality_notes` array
- **Auto-benchmark refresh**: Profile update triggers incremental refresh of global:all, event_type:{type}, and organisation:{org_id} benchmark segments
- **Auto-sector enrichment**: After profile update, best benchmark is selected (quality-aware), sector_context auto-enriched with benchmark positions (compliance/commitment/drift/sentiment/governance), enrichment_source and enrichment_timestamp persisted
- **Briefing benchmark context**: Briefing generation loads org profile + best benchmark, passes `benchmark_context` to generator; adds benchmark-relative pressure points and predicted questions; response includes `benchmark_context` schema
- **Profile schema extended**: `SectorContextSchema` gains benchmark_segment, benchmark_quality, compliance/commitment/drift/sentiment/governance_position, enrichment_source, enrichment_timestamp
- **Persistence metadata**: All benchmark build/refresh operations persist last_refresh_source (manual_build/profile_update), refresh_scope (full/incremental), low_sample flag

### Phase 9 — Product Surfacing and Output Unification
- `server/services/UnifiedIntelligenceService.ts` — Unified AI output layer aggregating all AI Core outputs (analysis, drift, governance, profile, benchmark, briefing) into a single normalized `IntelligenceSummary` object per session or organisation
- `server/routers/unifiedIntelligenceRouter.ts` — tRPC router with `getSessionIntelligence` (by session ID) and `getOrgIntelligence` (by organisation ID) procedures
- `client/src/components/IntelligenceSummaryPanel.tsx` — Accordion-style UI panel showing all 10 intelligence dimensions with expand/collapse, risk badges, benchmark positions, export to JSON
- **IntelligenceSummary schema** (10 sections): overall_risk, sentiment_summary, key_commitments, drift_status, top_compliance_issues, top_predicted_questions, key_pressure_points, governance_summary, profile_summary, benchmark_context
- **UI surfaces updated**: Shadow Mode session detail (shows panel for completed/processing sessions), Event Brief Generator (shows org intelligence after brief generation)
- **Data flow**: Session-based queries pull persisted pipeline data from shadow_sessions columns (ai_core_results, ai_drift_results, ai_governance_results, ai_profile_summary) + live AI Core enrichment (profile, benchmark, briefing, governance detail); Org-based queries pull directly from AI Core APIs
- **Pipeline order unchanged**: compliance email → AI Core analysis → drift → governance → profile update → auto-benchmark-refresh → auto-sector-enrichment → AI report → delivery → board intelligence → briefing accuracy

### Phase 10 — Production Hardening + Demo Readiness
- **Reliability protections** in `AICoreClient.ts`: All HTTP calls have configurable timeouts (5s health, 30s reads, 120s writes), retry logic with backoff (up to 2 retries for analysis/drift, 1 for others), structured `AICoreError` class with error types (timeout/network/upstream/parse), AbortController-based timeout enforcement
- **Pipeline observability** in `SessionClosePipeline.ts`: `PipelineTrace` and `PipelineStepTrace` interfaces track every step with timing, status (ok/skipped/error/timeout), error details, and step metadata; full trace persisted to `ai_pipeline_trace` JSONB column in `shadow_sessions`; overall pipeline status (complete/partial/error) computed from step outcomes
- **In-memory caching** in `UnifiedIntelligenceService.ts`: TTL-based cache (120s) for profile and benchmark lookups; cache size bounded at 200 entries with LRU eviction; eliminates redundant AI Core calls during repeated intelligence queries
- **Data source tracking**: `IntelligenceSummary` extended with `data_sources` (per-source loaded/failed status, partial flag, failed_sources list), `generated_in_ms` timing, and `pipeline_trace` object; enables UI to distinguish "no data" vs "upstream unavailable"
- **Demo-safe seeded data** via `server/scripts/seedDemoData.ts`: Two stable demo flows — Meridian Holdings (session 99901, moderate risk, earnings call) and Atlas Energy Group (session 99902, high risk, AGM); realistic transcripts, commitments, compliance flags, drift events, governance summaries, profile data, and pipeline traces; seeded via `seedDemoData` tRPC mutation
- **UI polish**: `IntelligenceSummaryPanel.tsx` shows Complete/Partial badges, generation timing (ms), data source indicators footer, Pipeline Trace accordion (step-by-step with status icons, timing, error details)
- **shadow_sessions new column**: `ai_pipeline_trace` (JSONB)