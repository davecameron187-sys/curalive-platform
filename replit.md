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