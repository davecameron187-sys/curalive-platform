# CuraLive

A real-time investor events platform providing live transcription, sentiment analysis, smart Q&A, and AI summaries for earnings calls, board briefings, and webcasts.

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS 4 + tRPC client, served via Express middleware in dev
- **Backend**: Express + tRPC server (`server/_core/index.ts`)
- **Database**: MySQL via Drizzle ORM (requires external MySQL `DATABASE_URL`)
- **Build system**: pnpm + tsx (dev), esbuild (prod)
- **Package manager**: pnpm 10.4.1

## UI Architecture (Consolidated March 2026)

The platform has been consolidated to two main pages:

- **`/`** — Unified Operator Dashboard (`Dashboard.tsx`) with 5 tabs:
  - **Overview**: System health, quick actions, recent sessions, platform capabilities
  - **Shadow Mode**: Full Shadow Mode (embedded via `ShadowMode.tsx` with `embedded` prop)
  - **OCC**: Operator Control Console (telephony, conference dial-out)
  - **Partners**: Bastion Capital Partners + Lumi Global (sub-tab toggle)
  - **Settings**: Account, system status, integrations
- **`/intelligence-suite`** — Intelligence Suite: 11 advanced AI algorithms
  - Evasive Answer Detection (NLP + vocal forensics)
  - Market Impact Forecast (predictive volatility)
  - Multi-Modal Compliance Risk Scoring (text+tone+behavioral)
  - External Sentiment Aggregation (social/media fusion)
  - IR Briefing Generator (RAG-powered personalized briefings)
  - Materiality Risk Oracle (MNPI detection + auto-drafted SENS/8-K filings)
  - Investor Intention Decoder (hidden agenda detection via multi-agent LLM)
  - Cross-Event Consistency Guardian (contradiction scoring across events)
  - Predictive Volatility Simulator (Monte-Carlo price impact simulations)
  - Autonomous Regulatory Intervention Engine (RL-based self-evolving compliance)
  - Event Integrity Digital Twin (SHA-256 hash chain + Clean Disclosure Certificate)
- **`/live/:token`** — Client-facing live dashboard (read-only, no auth needed)
- Old routes (`/shadow-mode`, `/occ`, `/bastion`, `/lumi`) redirect to dashboard tabs

## Project Structure

```
client/          React frontend (Vite root)
  src/pages/     Dashboard.tsx (main), IntelligenceSuite.tsx, ShadowMode.tsx, OCC.tsx, BastionPartner.tsx, LumiPartner.tsx
server/          Express backend
  _core/         Server entry, OAuth, Vite middleware, env config
  routers/       tRPC routers (incl. 11 Intelligence Suite routers + 6 CIP patent module routers)
  services/      BastionInvestorAiService, BastionBookingService, LumiBookingService, WebcastArchiveAiService + 11 Intelligence Suite services
  webphone/      Twilio/Telnyx voice integration
  drizzle/       Drizzle schema + migrations
shared/          Shared types/constants between client and server
drizzle/         SQL migration files
```

## Running the App

The development server runs both the frontend (Vite) and backend (Express/tRPC) on port 5000.

```bash
pnpm dev
```

## Environment Variables

Key variables needed:
- `DATABASE_URL` — MySQL connection string (app runs without it but DB features are disabled)
- `PORT` — Set to `5000`
- `VITE_OAUTH_PORTAL_URL` — OAuth portal URL (optional; falls back to `/login`)
- `VITE_APP_ID` — Application ID for OAuth
- `JWT_SECRET` — Session cookie signing secret
- `OAUTH_SERVER_URL` — OAuth server URL
- `OWNER_OPEN_ID` — OpenID of the admin user

## Agentic Event Brain (March 2026 — Acquisition-Ready AI)

- **Route**: `/agentic-brain` — 3-question wizard → scoring algorithm → OpenAI action plan → ROI projection
- **Algorithm**: `score = (role_match×0.3) + (challenge_weight×0.4) + (event_factor×0.3) + (data_pattern×0.2)` + alignment bonus
- **Server router**: `server/routers/agenticEventBrainRouter.ts` — `agenticBrain.runAnalysis`, `agenticBrain.getHistory`
- **DB table**: `agentic_analyses` — logs every analysis with score, bundle, AI action, ROI preview, interconnections
- **AI**: Calls `invokeLLM` (GPT-4o) for live bundle optimization recommendations
- **Interconnections**: Auto-maps which bundles trigger each other (IR → Compliance, Operations → Marketing, etc.)
- **Migration**: `scripts/create-agentic-brain-table.ts`
- **OperatorLinks card**: Added to Interconnection Analytics & Workflows section

## Recent Additions (March 2026 — v2.0 AI Interconnection Release)

- **OperatorLinks** (`/operator-links`) — Full operator links directory with a floating "Run Demo Simulation" button that plays a 14-step, 37-second animated walkthrough of a complete Q4 Earnings Call. Each step shows live status and links to the relevant page. Panel includes progress bar, replay, and toast notifications.
- **operatorLinksRouter** — tRPC router with `trackClick`, `getPopularLinks`, `getMyHistory`, `getAllMetadata`, `getMetadataByCategory`, `getAnalyticsSummary`
- **DB tables** — `operator_link_analytics` + `operator_links_metadata` (50 links seeded). Migration: `scripts/create-operator-link-analytics-tables.ts`
- **FeatureDetail** (`/features/:slug`) — Detail page for all 16 AI features
- **BundleDetail** (`/bundles/:slug`) — Detail page for all 6 bundles (A–F)
- **WorkflowsPage** (`/workflows`) — Recommended feature activation sequences with ROI projections
- **IntelligentBroadcasterPage** (`/intelligent-broadcaster`) — Real-time AI alert and operator guidance panel demo
- **WebcastRecapPage** (`/webcast-recap`) — Recap generator: video, podcast, social content
- **TrainingSubPage** (`/training/virtual-studio`, `/training/ai-features`) — AI and studio training modules
- **OperatorQuickRef** (`/support`, `/docs`, `/certification`, `/my-dashboard`, `/feedback`, `/whats-new`) — Quick reference pages driven by URL path
- **Redirects** — `/live-sentiment` → webcast studio, `/post-event` → demo report, `/studio-config` → virtual studio, `/esg-setup` → virtual studio
- **Handover document** — `MANUS_DEPLOYMENT_STATUS.md` with full route reference, DB schema, tRPC procedures, and demo walkthrough guide
- **GitHub** — main `9695a98` + manus-demo branch `3dde94d` (30 batches, all files)

## AI Services Dashboard (Intelligence Control Centre)

- **Route**: `/shadow-mode` → "AI Dashboard" tab
- **Component**: `client/src/components/AIDashboard.tsx`
- **Features**:
  - **22 AI Services** listed with checkboxes across 4 categories:
    - Capture & Transcription (Recording, AI Transcription)
    - Essential Intelligence (Executive Summary, Sentiment, Compliance, Key Topics)
    - Professional Analytics (Speaker, Q&A, Action Items, Investor Signals, Communication, Risk)
    - Enterprise Suite (Competitive Intel, Recommendations, Pace Coaching, Toxicity, Sentiment Arc, Financial, ESG, Press Release, Social Media, Board Summary)
  - **Tier presets**: Essential (6) / Professional (12) / Enterprise (all 22) — quick selection shortcuts
  - **Individual selection**: Tick/untick any service independently outside tier presets
  - **Category controls**: Select All / Deselect All per category, collapsible sections
  - **Run Selected Services**: Processes transcript through selected AI modules
  - **Save Report**: Export results as text file
  - **Email Report**: Send results to any email address
  - **Regenerate**: Re-run analysis on existing sessions
  - **Recording player**: Audio/video playback with download
  - **Transcript viewer**: With speaker labels, timestamps, export
  - **Custom data renderers**: Sentiment scores, compliance review, communication score, sentiment arc, speaking pace, toxicity screen, board-ready summary
- **Data flow**: Links shadow sessions to archive events via `event_id = shadow-{sessionId}` to retrieve AI reports
- **Note**: Event Recording & Transcriptions tab removed — functionality consolidated into AI Dashboard

## Self-Improving AI (Operator Feedback Loop)

- **Route**: `/shadow-mode` → "AI Learning" tab
- **Server router**: `server/routers/adaptiveIntelligenceRouter.ts` — `adaptiveIntelligence.submitCorrection`, `getCorrections`, `getAdaptiveThresholds`, `getComplianceVocabulary`, `addComplianceKeyword`, `toggleComplianceKeyword`, `getLearningStats`
- **DB tables**: `operator_corrections`, `adaptive_thresholds`, `compliance_vocabulary`
- **Migration**: `scripts/create-operator-corrections-table.ts`
- **How it works**: Operators correct AI sentiment scores or dismiss false compliance flags on any event. Each correction is stored as a training signal. The system recalculates adaptive thresholds using a weighted blend of defaults and operator corrections, improving accuracy per event type over time. Compliance vocabulary grows as operators add new keywords. Maturity levels: Initialising → Learning → Adapting → Calibrated → Self-Evolving.
- **Patent claims**: Implements Claims 13, 20, 21, 25, 33 from the CIPC patent (self-improving learning loop, operator corrections as training signals, autonomous threshold adaptation)

## Archive Intelligence Reports (20-Module AI Analysis)

- **Route**: `/shadow-mode` → "Archives & Reports" tab
- **Server router**: `server/routers/archiveUploadRouter.ts` — `archiveUpload.processTranscript`, `getArchiveDetail`, `listArchives`, `emailArchiveReport`, `generateReport`
- **DB table**: `archive_events` (includes `ai_report` JSON column for full GPT-4o analysis)
- **Migration**: `scripts/create-archive-events-table.ts`, `scripts/add-ai-report-column.ts`
- **How it works**: Uploads (paste text, .txt file, or audio/video recording via Whisper AI) are processed through the full intelligence pipeline. GPT-4o generates a comprehensive JSON report with **20 analysis modules**: executive summary, sentiment analysis, compliance review, key topics, speaker analysis, Q&A breakdown, action items, investor signals, communication scoring, risk factors, competitive intelligence, strategic recommendations, **speaking pace coaching** (WPM + filler word detection + delivery score), **toxicity & language risk screen** (price-sensitive + legal risk flags), **sentiment arc** (opening/midpoint/closing trajectory + trend), **financial highlights** (metrics + YoY changes), **ESG & sustainability mentions**, **press release draft** (SENS/RNS-style), **social media content** (LinkedIn/Twitter-ready posts), and **board-ready summary** (verdict + risks + opportunities + actions).
- **All modules always run**: Every event is processed through all 20 AI modules to build the intelligence database. Operators use the "Select Modules for Client Report" panel to choose which sections to include when sending reports to clients.
- **UI**: Collapsible report sections with severity badges, color-coded metrics, count indicators. Module selector with toggle checkboxes, "Select All" / "Clear All", and "Preview Client Report" button. "Generate AI Report" button for retroactive analysis of older archives. "Regenerate Report" to re-run analysis.
- **Audio transcription**: `server/audioTranscribe.ts` — sends audio buffer directly to OpenAI Whisper API (bypasses Forge storage proxy). Routes to `api.openai.com` when `OPENAI_API_KEY` is set.

## Sustainability Calculator (Module F — Claim 46)

- **Server router**: `server/routers/sustainabilityRouter.ts` — `sustainability.calculateEvent`, `getReport`, `getAggregateStats`, `generateESGNarrative`
- **DB table**: `sustainability_reports`
- **How it works**: Calculates carbon saved (CO₂e tonnes), cost avoided (USD), and sustainability grade (A+ to F) for virtual vs physical events. Uses DEFRA/GHG Protocol emission factors for flights (short/medium/long haul), hotels, ground transport, catering, printed materials, and venue energy. Generates ESG narratives via AI for annual sustainability reports.

## Communication Index (Module K — Claim 51) — Enhanced with Peer Benchmarking

- **Server router**: `server/routers/communicationIndexRouter.ts` — `communicationIndex.getCurrent`, `getHistory`, `publishSnapshot`, `getPeerBenchmark`, `getAllSectorBenchmarks`, `getSectorList`, `getExecutiveScorecard`
- **DB table**: `communication_index_snapshots`
- **How it works**: CICI score = (Communication Quality × 35%) + (Investor Engagement × 25%) + (Compliance Quality × 20%) + (Market Confidence × 20%). New peer benchmarking compares against 9 sector baselines (Financial Services, Technology, Mining, Healthcare, etc.) with percentile ranking and dimension-by-dimension comparison. Executive scorecard adds quarter-over-quarter trend analysis.

## Market Reaction Correlation (Module G — Claim 47) — Enhanced with Correlation Engine

- **Server router**: `server/routers/marketReactionRouter.ts` — `marketReaction.listRecords`, `getStats`, `getCorrelationAnalysis`, `addRecord`, `generatePrediction`, `deleteRecord`
- **DB table**: `market_reaction_correlations`
- **How it works**: New Pearson correlation coefficient engine computes actual statistical correlations between sentiment scores, executive confidence, compliance flags, Q&A difficulty, and market outcomes. Identifies the strongest predictor signal. Correlates with real 24h price changes when available.

## Intelligent Broadcaster + Recap (Module I — Claim 49)

- **Server router**: `server/routers/broadcasterRouter.ts` — `broadcaster.analyseSegment`, `updateSessionStats`, `getSession`, `generateRecap`, `listSessions`
- **DB table**: `broadcast_sessions`
- **How it works**: Real-time speaking pace analysis (WPM vs optimal 130-160 range), filler word detection (10 filler patterns), and automatic key moment detection (announcements, financial disclosures, guidance, risk warnings, quotable phrases). Generates structured post-event recaps via AI with executive summary, key takeaways, notable quotes, financial figures, and recommended follow-ups.

## Virtual Production Studio (Module L — Claim 52) — Expanded

- **Server router**: `server/routers/virtualStudioRouter.ts` — `virtualStudio.createSession`, `getSession`, `switchLayout`, `updateFeedSources`, `updateLowerThirds`, `toggleOverlay`, `getPreview`, `startRecording`, `stopRecording`, `getLayoutTemplates`
- **DB table**: `studio_sessions`
- **How it works**: 8 broadcast layout templates (single-presenter, dual, panel, interview, PiP, etc.). Video feed source management (camera, screen share, pre-recorded, remote guest). Lower third overlays for presenter info, logos, live sentiment scores, and participant counts. Real-time broadcast preview showing active feeds and visible overlays. Recording start/stop control.

## Zero-Click Registration (Module H — Claim 48) — Added

- **Server router**: `server/routers/mailingListRouter.ts` — `mailingList.zeroClickRegister` (new endpoint)
- **How it works**: Each mailing list entry gets a unique tokenised link. When a recipient clicks the link, they are automatically registered for the event without any form submission — using their pre-existing contact data from the CSV import. The token is consumed on first click (idempotent). Confirmation email sent automatically.

## Bastion Capital Partners Integration (March 2026)

- **Route**: `/bastion` — Full partner page with 3 tabs: Integration Package, Booking Pipeline, Live Sessions
- **Frontend**: `client/src/pages/BastionPartner.tsx` — Amber/gold branding, mirrors LumiPartner pattern
- **Backend Service**: `server/services/BastionBookingService.ts` — CRUD, pre-event checklist (ticker, event type, platform, meeting URL, contact, Recall API), session linking, Bastion-branded confirmation email
- **AI Service**: `server/services/BastionInvestorAiService.ts` — 6 autonomous investor algorithms:
  1. Earnings Sentiment Decoder — management tone vs actual results, spin index
  2. Forward Guidance Tracker — captures, scores, cross-references guidance statements across quarters
  3. Analyst Question Intelligence — analyst identification, categorisation, hostility detection
  4. Management Credibility Scorer — cross-quarter consistency, moved goalpost detection
  5. Market-Moving Statement Detector — flags share-price-impacting statements with severity
  6. Investment Brief Generator — autonomous PM-ready post-event report with recommendation
- **Router**: `server/routers/bastionBookingRouter.ts` — `bastionBooking.create`, `list`, `getById`, `update`, `runChecklist`, `linkSessions`, `complete`, `sendConfirmation`, `clientDashboard`
- **DB tables**: `bastion_bookings`, `bastion_intelligence_sessions`, `bastion_investor_observations`, `bastion_guidance_tracker`
- **Migration**: `scripts/create-bastion-tables.ts`
- **Module M integration**: All 6 algorithms feed observations into `ai_evolution_observations` for self-evolution
- **Booking fields**: `confirmationRecipients` (unified), `bastionReference`, `sector`, `ticker`, `eventType`

## Archive Upload — Specialised Algorithm Integration (March 2026)

- **What**: Archive uploads now automatically run specialised AI algorithms based on event type, on top of the standard 20-module report
- **Investor events** (earnings_call, interim_results, capital_markets_day, investor_day, roadshow, special_call): Creates a Bastion intelligence session and runs all 6 Bastion investor algorithms (Earnings Sentiment Decoder, Forward Guidance Tracker, Analyst Question Intelligence, Management Credibility Scorer, Market-Moving Statement Detector, Investment Brief Generator)
- **Governance events** (agm, board_meeting): Creates an AGM intelligence session and runs 4 governance algorithms (Dissent Pattern Engine, Q&A Governance Triage, Regulatory Speech Guardian, Governance Report Generator)
- **All observations** feed into Module M (ai_evolution_observations) for self-evolution
- **New DB columns** on `archive_events`: `specialised_analysis` (JSON), `specialised_algorithms_run`, `specialised_session_id`, `specialised_session_type`
- **New event types** added across archive/shadow systems: `investor_day`, `roadshow`, `special_call`
- **Frontend**: Archive detail view shows specialised algorithm results in dedicated panel (amber for investor, emerald for governance)
- **Files modified**: `server/routers/archiveUploadRouter.ts`, `drizzle/schema.ts`, `client/src/pages/ShadowMode.tsx`

## Shadow Mode — Event Recording & Downloads (March 2026)

- **Video recording**: Session detail now shows an "Event Recording" panel with embedded video player, "Open" (new tab), and "Download MP4" buttons when Recall AI captures a recording
- **Recording states**: Shows "Recording in progress" with pulsing indicator during live sessions, "Processing recording" after session ends, full player once URL is available
- **Transcript download**: "Export .txt" button on the Live Transcript header — one-click download of the full transcript as a text file
- **Backend**: `getSession` now returns `recordingUrl` and `botStatus` from the recall_bots table
- **Files modified**: `server/routers/shadowModeRouter.ts`, `client/src/pages/ShadowMode.tsx`

## Key Features

- **AI Shop** (`/ai-shop`) — 6 role-based AI bundles (A-F) + 28 individual AI applications browser
- **AI Onboarding Quiz** (`/ai-onboarding`) — 4-question guided quiz with bundle recommendation
- **Social Command Center** (`/social`) — Event Echo pipeline: live event → AI-generated social posts → compliance check → multi-platform publish → ROI analytics
  - 12 tRPC procedures in `server/routers/socialMedia.ts`
  - Event Echo Pipeline: `server/services/EventEchoPipeline.ts`
  - Compliance Moderator: `server/services/ComplianceModerator.ts`
  - Social Media Service: `server/services/SocialMediaService.ts`
  - OAuth config for 5 platforms: `server/_core/socialOAuth.ts`
  - DB tables: `social_media_accounts`, `social_posts`, `social_post_platforms`, `social_metrics`, `social_audit_log`
- **Bundle F** — "Social Amplification" at $199/mo added to AI Shop

### Social OAuth Setup (To Go Live)
Set these env vars + matching secrets to enable live OAuth publishing:
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`
- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`
- `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`

## Deployment

- **Target**: Autoscale
- **Build**: `pnpm run build`
- **Run**: `node dist/index.js`

## Key Features

- Live webcast platform with real-time transcription
- OCC (Operator Control Center) for event management — professional conference control centre
- Training Mode Console — isolated operator training environment (`/training-mode`)
- Operator Analytics dashboard with performance scoring (`/operator/analytics`)
- Development Dashboard with feature status & platform testing tools (`/dev-dashboard`)
- AI Features Status overview of all intelligence capabilities (`/ai-features`)
- WebRTC webphone for CuraLive Direct calls (Twilio/Telnyx carrier support)
  - PSTN bridge dial-out removed — Shadow Mode uses free Recall.ai bot join via meeting URL (zero call charges)
  - `server/webphone/twilio.ts` — Twilio WebRTC token + TwiML generation
  - `server/webphone/telnyx.ts` — Telnyx credential handling
  - `server/webphone/carrierManager.ts` — carrier health + failover management
- Multi-language translation (8 languages)
- **Post-Event AI Report** — 8-tab AI report: Executive Summary, Key Moments timeline, Sentiment chart, Q&A Log, Engagement Metrics, Compliance Flags, Transcript, Replay (`/post-event/:eventId`)
- **Real-Time Investor Sentiment Dashboard** — SVG gauge, Ably live updates, spike alerts, per-speaker breakdown (`/operator/:eventId/sentiment`)
- **Automated Investor Follow-Up Workflow** — Forge AI extracts commitments from transcripts, email + CRM sync (`/post-event/:eventId/followups`)
- **Compliance Audit Trail** — AI statement flagging, review/approve/reject workflow, certificate generation, cross-event audit log (`/compliance/audit-log`)
- **Complete AI Transcription** — `TranscriptViewer` with 12-language support, RTL, search, SRT/VTT/JSON export (`/post-event/:id/transcript`)
- **White-Label Client Portal** — multi-tenant branded portals with CSS var theme engine; admin management (`/portal/:clientSlug`, `/admin/clients`)
- **Attendee Mobile Experience** — 5-panel swipeable room (Video/Transcript/Q&A/Polls/Info), push notifications (`/m/:eventId`)
- **Live Polling & Audience Interaction** — 4 poll types, `LivePoll` + `PollManager` + `PollResults`, real-time Ably vote broadcasting
- **Event Scheduling & Calendar** — 6-step wizard with template/platform/feature/operator selection; 3-view calendar (month/week/day) (`/events/schedule`, `/events/calendar`)
- Recall.ai integration for Zoom/Teams/Webex bots
- Billing and PDF generation

## Shadow Mode — Production Configuration

Shadow Mode is the intelligence factory. Every event (live, uploaded, or pasted) runs the full 20-module AI report pipeline.

**Required environment variables:**
- `RECALL_AI_API_KEY` — (critical) Recall.ai bot deployment for live meeting capture
- `RECALL_AI_WEBHOOK_SECRET` — Webhook HMAC signature verification (required in production; skipped in dev)
- `ABLY_API_KEY` — Real-time transcript streaming to UI
- `RECALL_WEBHOOK_BASE_URL` — (optional) Override for webhook callback URL; auto-detected from `REPLIT_DEPLOYMENT_URL` / `REPLIT_DEV_DOMAIN`

**Webhook URL resolution order:**
1. `RECALL_WEBHOOK_BASE_URL` (explicit override)
2. `REPLIT_DEPLOYMENT_URL` (production deployment)
3. `REPLIT_DEV_DOMAIN` (development)
4. Fails with clear error if none available — never trusts client-supplied URLs

**Database:** `archive_events` table defined in `drizzle/schema.ts` and created via `scripts/create-archive-events-table.ts` + `scripts/add-ai-report-column.ts`

## Shadow Mode Guardian — Resilience & Backup

Three-layer protection system ensuring Shadow Mode never loses data:

**1. Graceful Shutdown** — On SIGTERM/SIGINT, annotates all active sessions so they're recoverable on restart.

**2. Startup Reconciliation** — On server boot, scans for sessions stuck in `live`, `bot_joining`, or `processing`:
- Sessions with transcript data → auto-recovered to `completed`
- Stale sessions with no data → marked `failed`
- Sessions stuck in `processing` > 15min → marked `failed`

**3. Watchdog (60s interval)** — Continuous monitoring of active sessions:
- `bot_joining` > 10 minutes → marked `failed` (bot never connected)
- `live` > 6 hours → auto-completed (maximum session duration safety net)

**Files:**
- `server/services/ShadowModeGuardianService.ts` — All three layers
- `server/_core/index.ts` — Wired into startup + shutdown signals

**Key safety design:**
- Recall.ai bots are external — they stay in meetings even if CuraLive restarts
- Transcripts are saved incrementally via webhooks, not batched
- All strategic AI modules (crisis, valuation, disclosure) use non-fatal error handling
- Bot deployment auto-retries 3× with exponential backoff

## AI Self-Evolution Engine

Autonomous system that observes its own AI report quality, detects gaps, and proposes new tools.

**Core Algorithms:**
1. **Module Quality Scoring** — Weighted depth/breadth/specificity analysis (40/30/30) per module with generic-phrase detection
2. **Evidence Decay** — Exponential half-life (14 days) so stale observations fade, recent data dominates
3. **Cross-Event Correlation** — Detects patterns spanning multiple clients/event types via capability clustering
4. **Autonomous Promotion** — emerging (5+ evidence, 55%+ score) → proposed → approved (12+ evidence, 70%+) → building → live
5. **Gap Detection Matrix** — importance × failure_rate × (1 - quality) × breadth_factor across all 20 modules
6. **Impact Estimation** — frequency × breadth × severity × urgency composite per proposal

**Files:**
- `server/services/AiEvolutionService.ts` — All 6 algorithms + `runMetaObserver()` + `runAccumulationEngine()` + `getEvolutionDashboard()`
- `server/routers/aiEvolutionRouter.ts` — tRPC router (protectedProcedure): `getDashboard`, `runAccumulation`, `updateProposalStatus` (with transition validation)
- `drizzle/schema.ts` — `ai_evolution_observations`, `ai_tool_proposals` tables
- `client/src/pages/ShadowMode.tsx` — Evolution Dashboard in AI Learning tab

**How it works:**
- After every AI report (archive upload or transcript), `runMetaObserver()` scores all 20 modules, detects weak ones, and calls gpt-4o-mini to identify missing capabilities
- `runAccumulationEngine()` clusters observations into tool proposals, runs cross-event correlation, and triggers autonomous promotion
- Dashboard shows velocity stats, gap matrix, cross-event patterns, tool proposals with approve/reject controls

## OCC (Operator Console) — `/occ`

The OCC is a world-class conference control centre built to the technical brief. Key areas:

- **Left sidebar navigation** (80px): Running Calls, Post Event, Simulate Call, Settings, Op Settings tabs
- **Metrics strip**: 8 live metrics across the top (Live, Pending, Completed, Lounge, Requests, Participants, CCP, Bridge)
- **Conference Overview (left panel)**: Running / Pending / Completed / Alarms tabs with call list
- **Control Panel (CCP)**: Full call controls (REC, Lock, Mute Parts, Mute All, Terminate, Dial Out)
- **Participant table**: 12-column table with Sentiment scores (0–100, color-coded, live-drifting every 5s)
- **Sub-tabs**: Monitoring (call quality metrics), Connection (IP/codec/encryption/NAT + dial-out), History, Audio, Chat, Notes, Q&A, Direct
- **Monitoring tab**: Bandwidth, Latency, Jitter, Packet Loss, MOS Score with color-coded thresholds
- **Q&A Queue tab**: Submitted text questions with approve/reject/pin/answer moderation + raised hands panel
- **Actions sidebar**: Call, Op Join, Join, Hold, TL/Mon, Disconnect, Voting, Q&A
- **Dev auth bypass**: `DEV_BYPASS = true` in `server/_core/trpc.ts` when `NODE_ENV=development` — disable before production

## Ably Integration

- Ably token auth is served at `GET /api/ably-token` (plain REST endpoint in `server/_core/index.ts`)
- Uses the Ably JS SDK (`new Ably.Rest(apiKey).auth.createTokenRequest(...)`) to generate signed token requests — avoids manual HMAC signing issues
- Capability grants `occ:*`, `curalive-event-*`, and `*` channel access
- OCC.tsx uses `authUrl: "/api/ably-token"` for both Ably client instances
- The old tRPC `ably.tokenRequest` procedure (in `server/routers.ts`) is still present but not used by OCC — it required tRPC input format which Ably SDK cannot send

## OCC Audio Library

- Audio files table: `occ_audio_files` (conferenceId, name, fileUrl, fileKey, durationSeconds, isPlaying)
- Upload endpoint: `POST /api/upload-audio` (multipart, accepts MP3/WAV/OGG/WebM, max 20MB)
- tRPC procedures: `occ.getAudioFiles`, `occ.addAudioFile`, `occ.deleteAudioFile`, `occ.setAudioPlayState`
- Frontend: Audio tab in OCC.tsx reads from DB, supports upload/play/pause/delete with HTML5 Audio API

## Training Mode System

- 6 dedicated DB tables: `training_mode_sessions`, `training_conferences`, `training_participants`, `training_lounge`, `training_call_logs`, `training_performance_metrics`
- tRPC router at `server/routers/trainingMode.ts` — 8 procedures: `createSession`, `startConference`, `logCall`, `recordMetrics`, `completeSession`, `getSessionMetrics`, `getOperatorSessions`, `getActiveSessions`
- All training data is isolated — zero production data is read or written
- Frontend at `client/src/pages/TrainingModeConsole.tsx` — 3 tabs: My Sessions, New Session, Performance
- Performance scoring 0–5 across 5 dimensions; mentor notes; ready-for-production flag
- 11 vitest unit tests in `server/trainingMode.test.ts`

## Database (MySQL via Drizzle)

- `DATABASE_URL` secret is set and the schema is fully pushed — all tables exist
- Demo data seeded: conference CC-9921 (Q4 2025 Earnings Call) with 10 participants
- All training tables created and verified
- **NEVER use `pnpm db:push`** — fails with "table already exists" on training_call_logs. Use `pnpm exec tsx scripts/create-missing-tables.ts` or direct SQL with `CREATE TABLE IF NOT EXISTS` for new tables
- **New tables (from 6 Manus specs)**: `post_event_reports`, `transcription_jobs`, `polls`, `poll_options`, `poll_votes`, `event_schedules`, `operator_availability`, `resource_allocations`, `event_templates`, `clients`, `client_portals`
- **AI/transcript tables (14 new)**: `ai_generated_content`, `occ_transcription_segments`, `occ_live_rolling_summaries`, `qa_auto_triage_results`, `speaking_pace_analysis`, `toxicity_filter_results`, `transcript_edits`, `transcript_versions`, `transcript_edit_audit_log`, `event_brief_results`, `content_engagement_events`, `content_performance_metrics`, `content_type_performance`, `event_performance_summary`
- **Spec feature tables (5 new, March 2026)**: `report_key_moments`, `compliance_certificates`, `push_subscriptions`, `white_label_clients`, `client_event_assignments`

## Auth

- Dev: `NODE_ENV=development` (set in dev workflow) bypasses all auth — intentional for testing
- Production: `AUTH_BYPASS=false` set as production env var — full JWT auth enforced on deployment
- Controlled by `const DEV_BYPASS = process.env.AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'development'` in `server/_core/trpc.ts`

## Phase 1 Hardening (March 2026)

- **Rate limiting** (`express-rate-limit`): `/api/trpc` — 120 req/min prod / 500 dev; `/api/oauth` + `/api/auth` — 20/15min prod / 200 dev. Ably token endpoint is exempt.
- **Operator Hub** (`/operator-hub`): Single landing page for all operator training. 4-step learning path, full call-type guides (Audio Bridge / Audio Webcast / Video Webcast) with step-by-step setup, warnings, tips, operating tips, Quick Reference panel, and links to all training resources.
- OCC "Training" button (line 1383) now navigates to `/operator-hub` instead of `/training`.

## Intelligence Terminal (March 2026)

- **Route**: `/intelligence-terminal` — Bloomberg-style financial professional terminal
- **Router**: `server/routers/intelligenceTerminalRouter.ts` — registered in `server/routers.ts`
- **4 tabs**: Concern Intelligence, Market Signals, Exec Benchmarks, CICI Index
- **Filters**: Quarter and sector selectors
- **Link**: Added to `OperatorLinks.tsx`
- **Purpose**: Acquisition-readiness intelligence dashboard for financial professionals

## Q&A Support System (March 2026 — Built, Currently Disabled)

The full Q&A support infrastructure is built and working but the UI widget is currently unmounted. Can be re-enabled at any time.

**Infrastructure in place:**
- `client/src/components/LiveQuestionBox.tsx` — floating support widget, auth-gated, context-aware per page and event
- `server/routers/supportChatRouter.ts` — tRPC router using `protectedProcedure`; requires auth, accepts `eventId`/`eventName` context, logs all queries
- `server/services/KnowledgeRetrievalService.ts` — keyword-based RAG retrieval from knowledge base
- **DB tables**: `knowledge_entries` (20 entries seeded), `support_queries` (columns: `user_id`, `user_email`, `event_id`, `event_name`, `needs_escalation`, `matched_entries`)
- **Model**: `gpt-4o-mini` (cost-optimised for support use)
- **IP protection**: System prompt hard limits block all questions about internal algorithms, scoring formulas, model architecture, pipelines, and patent-pending IP

**To re-enable**: Import `LiveQuestionBox` and mount `<LiveQuestionBox />` in any page or in `App.tsx` (for global mounting).

## Mailing List & Auto-PIN Registration (March 2026)

- **Route**: `/mailing-lists` — Operator mailing list manager with CSV import, auto-PIN generation, one-click registration emails
- **Confirm route**: `/register/confirm/:token` — Public one-click registration page (token invalidated after use)
- **Server router**: `server/routers/mailingListRouter.ts` — `mailingList.create`, `mailingList.importCSV`, `mailingList.sendInvitations`, `mailingList.confirmRegistration`
- **DB tables**: `mailing_lists`, `mailing_list_entries` — migration: `scripts/create-mailing-list-tables.ts`
- **Email template**: `buildMailingListInvitationEmail` in `server/_core/email.ts` — "Click here to Register" button
- **Flow**: Upload CSV → auto-generate PINs → send personalised invitation emails → recipient clicks → **chooses join method** (Phone/Teams/Zoom/Web) → registered with method stored → confirmation email with method-specific instructions
- **Phase 2 (Multi-Mode)**: Confirmation page presents 4 join options — Phone Dial-In (with PIN), Microsoft Teams, Zoom, Web Browser. Join method stored on both `mailing_list_entries.join_method` and `attendee_registrations.join_method`
- **Phase 3 (CRM API)**: `server/routers/crmApiRouter.ts` — API key auth (SHA-256 hash, `clv_` prefix), endpoints: `createRegistration`, `bulkCreateRegistrations` (up to 500), `getRegistrationStatus`, `listRegistrations`, `getEventStats`. Webhook dispatch on registration events. API key management UI in mailing list detail (generate/revoke keys, webhook URL config). DB table: `crm_api_keys` + `webhook_url` column on `mailing_lists`. Migration: `scripts/create-crm-api-tables.ts`
- **Phase 4 (Zero-Click)**: `preRegisterAll` mutation in mailingListRouter — registers all unregistered entries with a chosen default join method, sends confirmation emails with join details immediately (no click required). "Pre-Register All" button with join method picker modal in MailingListManager. DB columns: `pre_registered`, `default_join_method` on `mailing_lists`
- **Security**: Confirm tokens are single-use (nulled after registration), PINs are unique per event, PINs only generated for phone join method. CRM API keys enforce event-scope and permission checks on all endpoints

## AI Compliance Engine (March 2026)

- **Route**: `/compliance-engine` — Autonomous threat detection, predictive fraud analysis & framework compliance monitoring
- **Service**: `server/services/ComplianceEngineService.ts` — Runs every 5 minutes; detects registration fraud, access anomalies, data exfiltration; AI-assessed severity via LLM; predictive alerts for recurring threats and capacity stress
- **Router**: `server/routers/complianceEngineRouter.ts` — `complianceEngine.dashboard`, `complianceEngine.runScan`, `complianceEngine.threats`, `complianceEngine.threatStats`, `complianceEngine.updateThreat`
- **Framework Routers (from Manus)**: `server/routers/soc2Router.ts` (SOC 2 control CRUD, CSV import, evidence upload, audit ZIP), `server/routers/iso27001Router.ts` (ISO 27001 control CRUD, same features)
- **DB tables**: `compliance_threats`, `compliance_framework_checks`, `soc2_controls` (18 seeded), `iso27001_controls` (16 seeded), `compliance_evidence_files`
- **Migrations**: `scripts/create-compliance-framework-tables.ts`, `scripts/create-compliance-engine-tables.ts`
- **Auto-start**: Engine starts on server boot via dynamic import in `server/_core/index.ts`
- **PDF generation**: `server/compliancePdf.ts` (pdfmake) — compliance certificate PDF export
- **Patent extension**: `docs/CIPC-Patent-Extension-AI-Compliance.md` — 5 claims covering autonomous compliance monitoring, multi-signal predictive fraud detection, cross-system health-compliance correlation, AI-assessed threat severity, automated remediation lifecycle

## Conference Dial-Out (March 2026)

- **Route**: `/conference-dialout` — Batch dial-out facility for conference calls
- **Use case**: Dial out to 20–200 South African cell numbers and join them all into a single Twilio Conference bridge
- **Server service**: `server/services/ConferenceDialoutService.ts` — SA number normalisation, batched calling (10/batch with 500ms delay), Twilio Conference TwiML, status webhook handler, ownership-enforced CRUD
- **Router**: `server/routers/conferenceDialoutRouter.ts` — `conferenceDialout.create`, `.start`, `.status`, `.cancel`, `.list` (all `protectedProcedure` with userId ownership)
- **Express endpoints**: `POST /api/conference-dialout/twiml` (TwiML for connecting to conference), `POST /api/conference-dialout/status` (Twilio status callbacks with signature validation)
- **DB tables**: `conference_dialouts` (conference metadata + counts), `conference_dialout_participants` (per-number call tracking with callSid, status, duration)
- **UI**: `client/src/pages/ConferenceDialout.tsx` — conference setup with bulk paste, real-time status monitor with 3s polling, participant status table, cancel controls
- **Number format**: Accepts `0821234567`, `+27821234567`, or `0027821234567` — auto-normalised to E.164

## AGM Governance AI (March 2026)

- **Route**: `/agm-governance` — AGM-specific autonomous intelligence with 6 self-evolving algorithms
- **Service**: `server/services/AgmGovernanceAiService.ts` — 6 algorithms:
  1. **Resolution Sentiment Predictor** — Predicts approval % from debate sentiment + historical baselines + category weights. Learns from accuracy vs actual outcomes; feeds weak predictions to evolution engine
  2. **Shareholder Dissent Pattern Engine** — Builds cross-AGM institutional memory of opposition patterns. Uses evidence decay (14-day half-life). Detects category dissent, threshold breaches, institutional blocks
  3. **Q&A Governance Triage** — Classifies shareholder questions by governance category + regulatory significance (must_address / should_address / optional) under Companies Act 71, JSE Listings, King IV
  4. **Quorum & Participation Intelligence** — Monitors quorum thresholds by jurisdiction (SA: 25%). Benchmarks against decay-weighted historical averages. Alerts on thin margins and unusual proxy patterns
  5. **Regulatory Speech Guardian** — 8 rule categories: Companies Act 71 (notice, director duty, resolution procedure, shareholder rights), JSE Listings (price-sensitive, cautionary), King IV governance, forward-looking statements
  6. **Post-AGM Governance Report Generator** — 12-section board-ready reports. Auto-feeds weak predictions, defeated resolutions, and critical compliance observations to Module M evolution engine
- **Router**: `server/routers/agmGovernanceRouter.ts` — registered in `server/routers.eager.ts`
- **DB tables**: `agm_resolutions`, `agm_intelligence_sessions` (with `user_id` ownership), `agm_dissent_patterns`, `agm_governance_observations`
- **Migration**: `scripts/create-agm-tables.ts` (includes `user_id` column)
- **Security**: All mutations enforce `assertSessionOwnership(sessionId, userId)` + `assertResolutionBelongsToSession()`. Dissent engine derives `clientName` server-side from session record (prevents cross-tenant contamination)
- **Self-evolution**: All 6 algorithms feed observations into `ai_evolution_observations` (Module M) using correct schema columns (`sourceType`, `sourceId`, `eventType`, `moduleName`, `observation`, `rawContext`)
- **UI**: Algorithms tab has expandable "Run" panels for algorithms 2-5 (dissent, Q&A triage, quorum, compliance) with inline forms
- **Lumi Integration**: When starting a Lumi session with event type "AGM", an AGM Intelligence session is auto-created and linked via `shadowSessionId`. The Lumi session detail shows inline AGM Governance AI controls (resolutions, algorithm runners, report generation) — no need to visit the separate `/agm-governance` page

## Lumi Booking Pipeline & Client Live Dashboard (March 2026)

- **Booking Pipeline**: Full booking flow on the Lumi page (`/lumi` → Booking Pipeline tab) with stages: Booked → Setup → Ready → Live → Completed
- **Route**: `/live/:token` — client-facing read-only AGM dashboard, no login required, secured by unique token
- **DB table**: `lumi_bookings` — stores booking details, dashboard token, checklist state, linked sessions
- **Migration**: `scripts/create-lumi-bookings.ts`
- **Service**: `server/services/LumiBookingService.ts` — createBooking (generates dashboard token), updateBooking, getByToken, runChecklist, linkSessions, completeBooking, getClientDashboardData
- **Router**: `server/routers/lumiBookingRouter.ts` — registered as `lumiBooking` in `server/routers.eager.ts`. Operator endpoints require login; `clientDashboard` endpoint is public (token-secured)
- **Client Dashboard UI**: `client/src/pages/ClientLiveDashboard.tsx` — shows real-time sentiment, quorum status, resolution predictions, compliance alerts, intelligence feed. Auto-refreshes every 4s when live, 10s otherwise
- **Pre-Event Checklist**: Evaluates meeting URL, platform, date, jurisdiction, resolutions, contact info, Recall.ai API key — shows green/amber/red indicators
- **Deploy from Booking**: When deploying intelligence from a booking, the shadow session + AGM session are auto-linked back to the booking record
- **Copy Dashboard Link**: One-click copy of the client dashboard URL to share with Lumi/client
- **Booking Confirmation Email**: Branded HTML email sent to client contact + Lumi recipients with event details, live dashboard link, and CuraLive intelligence summary. Lumi Recipients field accepts comma-separated emails. Confirmation sent status tracked with timestamp. Resend supported. Uses Resend transactional email via `sendEmail()`
- **DB columns**: `lumi_recipients` (text, comma-separated emails), `confirmation_sent_at` (timestamp)

## CIP Submission 4 — Module 30/31 Implementation (March 2026)

All 14 gap-analysis items from CIP Submission 4 are now implemented. New routers, services, and DB tables:

### New Routers
- `server/routers/crisisPredictionRouter.ts` — **Crisis Prediction Engine** (T006): LLM-powered predictive crisis detection from communication signal trajectories (6 risk dimensions). Auto-runs on session end. DB table: `crisis_predictions`
- `server/routers/valuationImpactRouter.ts` — **Valuation Impact Oracle** (T007): Module 24 — models effect on fair value from material disclosures, forward guidance, risk factors. DB table: `valuation_impacts`
- `server/routers/disclosureCertificateRouter.ts` — **Clean Disclosure Certificate** (T008): SHA-256 hash-chain certificate for compliance attestation per event. Auto-generated on session end. Includes chain verification endpoint. DB table: `disclosure_certificates`
- `server/routers/monthlyReportRouter.ts` — **Monthly Executive Intelligence Report** (T009): Aggregates all sessions/archives for a month, generates comprehensive executive report via GPT-4o. DB table: `monthly_reports`
- `server/routers/advisoryBotRouter.ts` — **Private AI Advisory Bot** (T010): Chat interface for querying across captured event data with full context retrieval. DB table: `advisory_chat_messages`
- `server/routers/evolutionAuditRouter.ts` — **Evolution Audit + Roadmap + Shadow Testing** (T012/T013/T014): Blockchain-style audit trail for all evolution decisions, shadow testing of AI tool proposals against historical data, 30/60/90-day capability roadmap generation. DB tables: `evolution_audit_log`, `capability_roadmap`

### Enhanced Existing Files
- `server/routers/archiveUploadRouter.ts` — **Module Selection** (T003): `generateFullAiReport` now accepts `selectedModules` parameter. Backend focuses analysis depth on selected modules only
- `server/routers/shadowModeRouter.ts` — Multiple enhancements:
  - **Auto-retry** (T004): Bot deploy retries up to 2 times with exponential backoff on failure
  - **Calendar auto-session** (T005): `createFromCalendar` mutation pre-creates sessions from calendar events with dedup by `calendarEventId`
  - **AGM governance piping** (T011): `pipeAgmGovernance` mutation pipes live transcript segments into AGM governance analysis during session
  - **Auto crisis prediction + disclosure cert**: Both fire automatically in background after AI report generation on session end
- `client/src/components/AIDashboard.tsx` — Passes `selectedModules` from service selection to backend

### New DB Tables (7 total)
`disclosure_certificates`, `crisis_predictions`, `valuation_impacts`, `monthly_reports`, `advisory_chat_messages`, `evolution_audit_log`, `capability_roadmap`

### Migration
`scripts/create-cip4-tables.ts` — Creates all 7 tables via raw SQL

## OpenAI API Key Configuration (March 2026)

- **Priority order** (`server/_core/env.ts`): `OPENAI_API_KEY` → `BUILT_IN_FORGE_API_KEY` → `AI_INTEGRATIONS_OPENAI_API_KEY`
- **URL routing** (`server/_core/llm.ts`): If `OPENAI_API_KEY` is set, always routes to `https://api.openai.com/v1/chat/completions` directly, bypassing the platform forge proxy entirely
- **Reason**: The built-in forge API (`forge.manus.ai`) has usage quotas. Setting `OPENAI_API_KEY` as a Replit secret gives full control with no quota ceiling
- **`isForgeMode()`**: Returns `false` when `OPENAI_API_KEY` is present — ensures GPT-4o is used, not Gemini
