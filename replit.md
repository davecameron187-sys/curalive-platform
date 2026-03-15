# CuraLive

A real-time investor events platform providing live transcription, sentiment analysis, smart Q&A, and AI summaries for earnings calls, board briefings, and webcasts.

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS 4 + tRPC client, served via Express middleware in dev
- **Backend**: Express + tRPC server (`server/_core/index.ts`)
- **Database**: MySQL via Drizzle ORM (requires external MySQL `DATABASE_URL`)
- **Build system**: pnpm + tsx (dev), esbuild (prod)
- **Package manager**: pnpm 10.4.1

## Project Structure

```
client/          React frontend (Vite root)
server/          Express backend
  _core/         Server entry, OAuth, Vite middleware, env config
  routers/       tRPC routers
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
- WebRTC webphone with Twilio/Telnyx integration
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

## OpenAI API Key Configuration (March 2026)

- **Priority order** (`server/_core/env.ts`): `OPENAI_API_KEY` → `BUILT_IN_FORGE_API_KEY` → `AI_INTEGRATIONS_OPENAI_API_KEY`
- **URL routing** (`server/_core/llm.ts`): If `OPENAI_API_KEY` is set, always routes to `https://api.openai.com/v1/chat/completions` directly, bypassing the platform forge proxy entirely
- **Reason**: The built-in forge API (`forge.manus.ai`) has usage quotas. Setting `OPENAI_API_KEY` as a Replit secret gives full control with no quota ceiling
- **`isForgeMode()`**: Returns `false` when `OPENAI_API_KEY` is present — ensures GPT-4o is used, not Gemini
