# CuraLive Platform

## Overview

CuraLive is a real-time investor events intelligence platform. It combines live webcasting, telephony bridge conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services into a single platform. It is a patented application (CIPC Patent App ID 1773575338868, filed March 2026, PCT deadline 12 March 2027).

**Core positioning:** CuraLive is the only platform that makes a regulated corporate communication event intelligent before it starts, compliant while it runs, and actionable before the operator leaves the room. One link. Any platform. Zero client-side integration required.

## User Preferences

- **Communication**: Use clear, concise language. Avoid jargon where simpler terms suffice.
- **Workflow**: Prioritize iterative development. Break down large tasks into smaller, manageable steps.
- **Interaction**: Ask for confirmation before making significant architectural changes or implementing complex features.
- **Codebase Changes**:
    - Do not modify the `.replit` file directly; use the Replit UI for configuration.
    - New tRPC routers must be registered in both `server/routers.eager.ts` and `server/routers.ts`.
    - Always use `"../_core/trpc"` for tRPC imports.
    - Only use `sonner` for toast notifications.
    - Be aware that `rawSql()` in `server/db.ts` auto-appends `RETURNING id` and translates MySQL `?` to PostgreSQL `$1/$2`.
    - Double-quote camelCase columns (e.g., `"createdAt"`) in raw SQL.
    - `ai_am_audit_log.timestamp` is a `bigint` (epoch ms), not a date column.
    - Use `drizzle-kit push --force` for schema sync, not `pnpm run db:push`.
    - `health_checks` and related tables are created via raw SQL; timestamp columns must be `TIMESTAMP` type.
    - Wrap PostgreSQL `NUMERIC` values from `rawSql()` in `Number()` before arithmetic.
    - Ensure `Recall.ai` webhook middleware is registered before `express.json()` to prevent requests from hanging due to HMAC signature verification requirements.
    - Ensure `dist/` is rebuilt locally (`esbuild`) before publishing for production deployments.
    - `rawSql()` auto-converts numbers between 1e12–1e13 to `Date` objects. For bigint timestamp columns, pass epoch values as strings to avoid conversion.

## Current Platform Status (April 2026)

### Inventory
| Asset | Count |
|-------|-------|
| tRPC Routers | 110 |
| Database Tables | 208 |
| Frontend Pages | 211 |
| UI Components | 81 |
| Backend Services | 61 |
| App Routes | 137 |
| Background Schedulers | 7 |

### System Health
- **Health Guardian**: 100% score — 6 services actively monitored (Database, Active Events, Twilio, OpenAI, Ably, Recall.ai).
- **Server**: Running clean on port 3000. All background services initialised at startup.
- **Session Data**: 10 completed sessions, no failed test data.

### Background Services (auto-started at boot)
1. **HealthGuardian** — 30-second autonomous infrastructure monitoring.
2. **ComplianceEngine** — 300-second regulatory compliance scanning.
3. **ComplianceDeadlineMonitor** — 15-minute compliance submission deadline checks with email alerts.
4. **BriefingScheduler** — 5-minute pre-event intelligence briefing dispatch.
5. **ShadowWatchdog** — 60-second zombie session detection and recovery.
6. **ReminderScheduler** — 300-second event reminder dispatch.
7. **ConferenceDialoutService** — Conference call orchestration.

## Core Capabilities

1. **One-Link Connection Model** — No IT integration, no SDK, no client-side setup. CuraLive joins any meeting through the link the same way a human participant would (Zoom, Teams, Meet, Webex).
2. **Multi-Path Platform Connectivity** — Recall.ai bot (primary), RTMP stream ingest via Mux (backup), Zoom RTMS API (planned Q3 2026). Architecture panel visible in Shadow Mode UI.
3. **Live Webcasting** — Mux RTMP/HLS video streaming with adaptive bitrate, on-demand replay, video-in-video.
4. **Telephony Bridge Console** — Twilio PSTN conferencing with IVR greeter, DTMF, hold/mute/park.
5. **AI-Powered Real-Time Transcription** — OpenAI Whisper via Recall.ai bots, speaker-diarised, multi-language.
6. **Shadow Mode** — Silent AI observation of external meetings via single meeting link.
7. **20-Module AI Intelligence Report** — Generated automatically from transcript on session close.
8. **Crisis Prediction Engine** — Financial, regulatory, reputational crisis signal detection.
9. **Valuation Impact Oracle** — Fair Value Gap and share price impact estimation.
10. **Disclosure Certificates** — SHA-256 hash-chained blockchain audit trail.
11. **Board Intelligence Compass** — Governance scoring, prior commitment audit, director liability mapping.
12. **Pre-Event Intelligence Briefing** — Auto-generated 60 minutes before each session.
13. **AI Self-Evolution Engine** — Meta-Observer, Gap Detection, Evolution Engine with governance gateway.
14. **Enterprise Billing** — Quotes, invoices, recurring templates, Stripe payments.
15. **Full Compliance Engine** — ISO 27001, SOC 2, SEC/FCA/ASIC/SGX/HKEX/JSE jurisdictions.
16. **AGM Intelligence** — Resolution tracking, shareholder dissent detection, proxy advisor monitoring, AI post-AGM dissent reports.
17. **White-Label Partner Delivery** — Branded client dashboards with customisable logos, colours, and fonts per partner.
18. **Client Delivery Pipeline** — Tokenised live dashboards, post-event reports, and presenter screens.
19. **Speaker Queue System** — Operator-approved questions routed to presenter with AI-suggested talking points.

## System Architecture

### Frontend
- **Framework**: React 19.2.1 with Vite 7.3.1 and TypeScript 5.9.3.
- **Styling**: TailwindCSS 4.1.14, Framer Motion 12.23.22, Radix UI primitives.
- **State**: TanStack React Query 5.90.2, tRPC React Query 11.6.0.
- **Charts**: Recharts 2.15.2, Chart.js 4.5.1.
- **Routing**: Wouter 3.3.5.
- **Icons**: Lucide React 0.453.0.
- **Forms**: React Hook Form 7.64.0, Zod 4.1.12 validation.
- **Toasts**: Sonner 2.0.7.
- **Key Pages**:
    - `/`: Unified Operator Dashboard with 6 tabs (Overview, Shadow Mode, Events, Partners, Billing, Settings).
    - `/live-video/webcast/:slug`: Webcast Studio (production console with demo simulation mode).
    - `/live-video/webcast/demo?simulate=1`: Demo Studio with full simulation.
    - `/bridge` / `/bridge/:id`: Bridge Console — professional telephony operator console.
    - `/live/:token`: Client-facing branded live intelligence dashboard (5 tabs: Live Feed, Sentiment, Compliance, Q&A, AI Summary).
    - `/report/:token`: Client-facing post-event intelligence report (10 tabs: Executive Summary, Financial Metrics, Compliance Flags, Management Tone, Q&A Log, Full Transcript, Action Items, Social Media Pack, SENS/RNS Draft, Certificate).
    - `/presenter/:token`: Presenter screen — large-font Q&A display with AI-suggested talking points and "up next" queue.
    - `/qa/:accessCode`: Attendee webphone page for Live Q&A.
    - `/virtual-studio`: AI-enhanced virtual broadcast studio.
    - `/feature-map`: Platform feature map and capability explorer.

### Backend
- **Runtime**: Node.js 20+, Express 4.21.2, tRPC Server 11.6.0 (110 routers).
- **ORM**: Drizzle ORM 0.44.5 with PostgreSQL (pg 8.20.0), 208 tables.
- **Build System**: pnpm monorepo, tsx for development, esbuild for production.
- **Server Binding**: `0.0.0.0` on port from `PORT` env var.
- **Authentication**: JWT cookie sessions (`app_session_id`) with optional OAuth and `DEV_BYPASS`. Role hierarchy: viewer < operator < admin. tRPC procedures: `publicProcedure`, `protectedProcedure`, `operatorProcedure`, `adminProcedure`.
- **Storage**: Unified `storageAdapter.ts` — object storage (Replit forge API) primary, local disk fallback (`uploads/recordings/`). Extension allowlists, sanitisation, path traversal protection.
- **Transcription Fallback**: Dual-provider — Gemini AI (primary) + Whisper (fallback) via Replit AI Integrations proxy.

### External Integrations
| Service | Purpose | Env Vars |
|---------|---------|----------|
| PostgreSQL | Primary database (208 tables) | `DATABASE_URL` |
| Ably | Real-time pub/sub messaging | `ABLY_API_KEY` |
| Recall.ai | AI bot deployment for Zoom/Teams/Meet/Webex | `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` |
| Mux | RTMP/HLS video streaming | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` |
| OpenAI | GPT-4o (analysis) + Whisper (transcription) | `OPENAI_API_KEY` |
| Twilio | PSTN telephony, IVR, SIP, WebRTC | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID` |
| Telnyx | Alternative voice carrier (failover) | — |
| Stripe | Payment processing | — |
| Resend | Transactional email + ICS calendar invites | — |
| AWS S3 | Object storage | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` |

## AI Intelligence Pipeline (5 Layers)

### Layer 1 — Transcript Capture
- **Shadow Mode**: Recall.ai bots join Zoom/Teams/Meet silently via meeting link.
- **Live Webcast**: FFmpeg extracts HLS audio → chunked to OpenAI Whisper.
- **Archive Upload**: Pre-recorded audio/video uploaded for retrospective analysis.
- **Paste Transcript**: Raw text or .txt file input.
- Ably pub/sub broadcasts transcript segments to all connected dashboards in real time.

### Layer 2 — Real-time Processing
- **Sentiment scoring**: Financial-tuned GPT-4o analysis — confidence, hedging, deflection.
- **Rolling summaries**: "What you missed" briefings pushed live every 20 segments.
- **Q&A auto-triage**: Classifies questions as approved / duplicate / off-topic / compliance-risk.
- **Speaker coaching**: WPM tracking, filler word detection, hedging percentage.
- **Evasive answer detection**: AI flags non-committal management responses.
- **Compliance flagging**: Real-time detection of forward-looking statements and regulatory triggers.

### Layer 3 — Post-Event Intelligence Report (20 Modules)
Generated automatically on session close: Executive Summary, Key Financial Metrics, Sentiment Analysis, Management Tone, Guidance Changes, Competitive References, ESG Mentions, Analyst Questions, Risk Factors, Action Items, Social Media Narrative Pack, SENS/RNS Draft, Transcript with timestamps, Commitments vs. Prior Quarter, Communication Effectiveness, Compliance Flags, Investor Sentiment Profile, Board Governance Review, Market Impact Prediction, Blockchain Disclosure Certificate.

### Layer 4 — Specialist Intelligence Services
- **Crisis Prediction Engine**: Financial, regulatory, reputational crisis signal detection.
- **Valuation Impact Oracle**: Fair Value Gap and share price impact estimation.
- **Disclosure Certificates**: SHA-256 hash-chained blockchain audit trail.
- **Market Impact Predictor**: Share price movement probability modelling.
- **CuraLive Communication Index**: Standardised metric of corporate communication quality.

### Layer 5 — AI Self-Evolution Engine
- **Meta-Observer**: Scores each module's output quality (1-10) for accuracy, relevance, depth.
- **Gap Detection**: Identifies missing capabilities from transcript analysis patterns.
- **Evolution Engine**: Proposes new AI capabilities with architecture specs.
- **Governance Gateway**: Blockchain-audited approval process for AI self-modification.

## Shadow Mode Platform

### Architecture
- `shadowModeRouter.ts` — Session lifecycle (create, start, end, delete, retry).
- `ShadowModeGuardianService.ts` — Background watchdog: 60s interval zombie detection, crash recovery, graceful shutdown.
- `recallRouter.ts` — Recall.ai bot deployment and webhook handling.

### UI (11 Sub-Navigation Tabs)
1. **Live Intelligence** — Active session monitoring with real-time transcript, sentiment, compliance.
2. **Archives & Reports** — Historical session browser with search, filtering, and bulk operations.
3. **AI Dashboard** — Consolidated AI module outputs.
4. **Live Q&A** — Moderation console with AI triage.
5. **Board Compass** — Board intelligence and governance scoring.
6. **Pre-Event Intel** — Pre-event intelligence briefing viewer.
7. **Compliance Monitor** — Real-time regulatory compliance dashboard.
8. **System Diagnostics** — Platform health and connectivity diagnostics.
9. **Intelligence Suite** — Advanced AI analysis tools.
10. **Operator Tools** — Session management and operational controls.
11. **Settings** — Configuration and preferences.

### Operator Console Additions (Master Integration v2)
- **Item A — Transcript Segment Flagging**: Operators can flag transcript segments with 5 flag types (Notable, Compliance, Forward Guidance, Tone Shift, Action Required) and see them on a visual timeline with colour-coded markers.
- **Item B — Collapsible Bottom Tray**: A persistent bottom panel with tabbed sections (Flags, Messages, Team, Live Stats) that collapses to save screen space.
- **Item C — Internal Team Coordination**: Multi-operator panel with join/leave session, operator list, handoff initiation, and internal team chat with real-time messaging.
- **Item D — Three-State Console Mode**: Mode switcher in the header — Monitor (read-only observation), Active (full operator controls), Review (post-session analysis). Session Configuration and Team Coordination panels are hidden in non-Active modes.

## Live Q&A — AI Moderation Console

### AI Triage
- Automatically classifies every attendee question into one of four categories: Approved, Duplicate, Off-topic, Compliance Risk.
- Jaccard word-overlap algorithm for duplicate detection.
- Confidence thresholds configurable per session.

### Operator Console
- Two-panel layout: incoming queue (left) + AI-suggested answers / analyst identity (right).
- Legal review status tracking with operator notes.
- AI draft responses generated from transcript context.
- Bulk actions: approve all, reject duplicates, export Q&A log.

### Speaker Queue System
- Operator-approved questions routed to presenter screen via Ably real-time.
- AI-generated suggested talking points for each question.
- Presenter screen (`/presenter/:token`) shows current question + 3 up-next with large readable text.
- Status tracking: queued → answered / skipped.

## Client Delivery Pipeline

### Token-Based Access
- Secure tokenised links generated per session per recipient.
- Token types: `live` (dashboard access during session), `report` (post-event report), `presenter` (speaker Q&A screen).
- Tokens scoped to session ID with expiry timestamps.
- Token validation enforced server-side on all client-facing endpoints.

### Live Intelligence Dashboard (`/live/:token`)
- 5 tabs: Live Feed (speaker-diarised transcript), Sentiment (real-time gauges), Compliance (flag stream), Q&A (approved questions), AI Summary (rolling summary).
- Branded with partner logo, colours, and fonts via `useBrandConfig` hook.
- Floating chat widget (ClientMessagePanel) for client↔operator messaging.
- Real-time updates via 5-second polling.

### Post-Event Report (`/report/:token`)
- 10 tabs: Executive Summary, Financial Metrics, Compliance Flags, Management Tone, Q&A Log, Full Transcript, Action Items, Social Media Pack, SENS/RNS Draft, Blockchain Certificate.
- Client view logging — every tab switch recorded for operator analytics.
- Client feedback (1-5 star rating + comment) captured post-viewing.

### White-Label Partner Branding
- Partners: Lumi Global (~4,000 events/year), Bastion Group (~500 events/year).
- Per-partner configuration: display name, logo URL, primary/accent colours, font family, footer text, email domain.
- `brandConfigMiddleware` injects partner branding on all requests.
- Client pages dynamically apply brand via CSS custom properties.

## Session Configuration System

### Intelligence Tiers
| Tier | Capabilities |
|------|-------------|
| Essential | Core intelligence + transcript |
| Intelligence | Essential + compliance + Q&A routing |
| Enterprise | Full suite + presenter screen |
| AGM | Enterprise + AGM intelligence + dissent analysis |

### Session Setup
- **SessionSetupPanel**: Tier selection, recipient management (name, email, role, send live/report toggles).
- **SessionScheduler**: Event scheduling with meeting URL, auto-triggers pre-event briefing dispatch.
- **Readiness Check**: Pre-session validation (DB, Recall.ai, Ably, OpenAI, recipients, tier).

## AGM Intelligence Module

### Resolution Tracking
- Create and track resolutions with number, title, description, category.
- Sentiment scoring and dissent level per resolution.
- Vote tallying (for, against, abstentions) with status tracking.

### Shareholder Signal Detection
- **Dissent Keywords** (7): "vote against", "oppose", "reject", "excessive", "unacceptable", "shareholder revolt", "proxy fight".
- **Proxy Advisor References** (5): ISS, Glass Lewis, Hermes, Sustainalytics, PIRC.
- **Activist Language Detection**: "activist", "institutional investor", "block vote", "coordinated".
- Signals stored with confidence scores and linked to transcript segments.

### Post-AGM Reporting
- AI-generated dissent report via GPT-4o covering: overall dissent level, resolution-by-resolution analysis, activist activity, proxy advisor impact, and recommended board actions.

## Operations & Team Coordination

### Multi-Operator Sessions
- Operators can join/leave sessions with role assignment (primary, secondary).
- Session handoff with reason tracking (from/to operator, accepted timestamp).
- Active operator list visible in Team Coordination Panel.

### Client Analytics
- View logging: every client page visit and tab switch recorded.
- Feedback collection: star rating + free-text comment.
- Report link resend capability for operators.

### Compliance Deadline Monitoring
- Background service checking every 15 minutes for upcoming compliance submission deadlines.
- Automated email alerts to IR teams before deadline expiry.
- Jurisdiction detection (JSE, SEC, FCA, ASIC, SGX, HKEX) from exchange code.

### Historical Intelligence
- Board member profiles (name, role, committee, bio, LinkedIn).
- Historical commitment tracking with deadlines.
- Cross-event consistency analysis.

## Live Video & Audio Webcast Platform

### Streaming
- RTMP ingest via Mux, HLS delivery to viewers with adaptive bitrate.
- AI audio layer: FFmpeg extracts audio from HLS for real-time Whisper transcription.
- Mux webhook integration for stream lifecycle events.

### Virtual Studio
- Selectable AI Bundles (sentiment, compliance, Q&A, coaching).
- Dynamic overlays: sentiment gauge, compliance indicator, speaker coaching.
- Multi-speaker support with automated switching.

### Interactive Features
- Live Q&A with AI moderation.
- Polling with real-time results.
- Real-time transcript display.
- Slide synchronisation.
- Multi-language subtitle overlays.

## PSTN Telephony Bridge

### IVR Greeter
- Inbound call handling with access code validation.
- Name and organisation capture via keypad/voice.
- Welcome message and hold music.

### Operator Controls
- Mute/unmute, hold/unhold per participant.
- Conference locking, participant removal.
- Recording start/stop.
- DTMF hand-raising detection.

### Failover
- Twilio (primary) to Telnyx (secondary) automatic failover.
- SIP connectivity for enterprise PBX integration.
- WebRTC bridge for browser-based participation.

## Enterprise Billing & Booking

### Billing Engine
- Quotes with line items, discounts, and validity periods.
- Invoices with payment tracking and overdue notifications.
- Recurring invoice templates with auto-generation.
- Stripe payment integration (card, bank transfer).

### Packaging
- Three commercial tiers: Essential, Intelligence, Enterprise.
- Per-event or subscription pricing models.
- Partner-specific pricing for Lumi and Bastion channels.

## Full Compliance Engine

### Frameworks
- ISO 27001 information security controls.
- SOC 2 Type II trust service criteria.

### Jurisdictions
- JSE (South Africa), SEC (USA), FCA (UK), ASIC (Australia), SGX (Singapore), HKEX (Hong Kong).
- Jurisdiction-specific compliance rules and deadlines.
- Real-time compliance flag detection during live events.

### Monitoring
- Background scanner every 300 seconds.
- Compliance digest reports.
- Audit trail with blockchain-verified timestamps.

## Database Schema (208 Tables)

Organised into core groups:
- **Users & Auth**: users, sessions, roles, permissions.
- **Events**: events, event_schedules, mailing_lists, registrations.
- **Shadow Mode & AI**: shadow_sessions (with tier, partner_id, recipients, scheduled_at columns), transcript_segments, sentiment_scores, compliance_flags.
- **Session Operations**: session_messages, session_handoffs, session_operators, session_markers, session_readiness_checks, scheduled_sessions.
- **Client Delivery**: client_tokens, client_report_access, client_report_feedback, client_report_view_log.
- **Partners**: partners, partner_events.
- **AGM Intelligence**: agm_resolutions, agm_shareholder_signals, agm_governance_scores.
- **Q&A System**: approved_questions_queue, investor_questions.
- **Compliance**: compliance_deadlines, historical_commitments, board_members.
- **Board Intelligence**: 21+ tables for governance scoring, director profiles, commitment tracking.
- **Webcast**: streams, recordings, overlays, polls.
- **Bridge Telephony**: conferences, participants, call_logs.
- **Enterprise Billing**: quotes, invoices, line_items, payments.
- **AI Evolution**: evolution_proposals, audit_logs, meta_observer_scores.
- **Certificates & Audit**: disclosure_certificates, hash_chains.
- **Health Monitoring**: health_checks, incidents, metrics.

## Health Guardian

- Autonomous infrastructure monitoring at 30-second intervals.
- Only checks services with configured credentials (Database + ActiveEvents always; Twilio/OpenAI/Ably/Recall only if env vars present).
- API reachability (401/403) treated as "healthy" — credentials pending validation.
- Current score: **100%** with 6 services (Database, Active Events, Twilio, OpenAI, Ably, Recall.ai).
- AI-powered root cause analysis for incidents.
- File: `server/services/HealthGuardianService.ts`.

## Live Operator Console

- **LiveSessionPanel** (`client/src/components/LiveSessionPanel.tsx`): 5-phase integrated live operator console with WebPhone, Q&A moderation, transcript view, notes with auto-save, and session analytics.
- **WebPhoneCallManager**: Operator dashboard showing active participants, audio levels, quality badges, call stats, mute/remove controls.
- **WebPhoneJoinInstructions**: Customer-facing join instructions with WebPhone primary, dial-in/SIP/access code tabs.
- **ProviderStateIndicator**: Connection quality indicator — `"excellent" | "good" | "fair" | "poor"`.
- **Hooks**: `useAblySessions` (Ably real-time), `useKeyboardShortcuts` (keyboard shortcuts), `useBrandConfig` (partner branding).
- **Services**: `sessionAutoSave` (auto-saves operator notes).
- **New Components**: TranscriptFlagTimeline, CollapsibleBottomTray, TeamCoordinationPanel, ConsoleModeSwitcher, SessionSetupPanel, SessionScheduler, ClientMessagePanel.

## Key File Locations

### Schema Files
- `drizzle/schema.ts` — Main schema index (re-exports all).
- `drizzle/gaps.schema.ts` — 14 operational tables + session_markers.
- `drizzle/partners.schema.ts` — Partners, client_tokens, client_report_access, partner_events.

### Backend Services
- `server/services/ClientDeliveryService.ts` — Send live dashboard links + report links.
- `server/services/ComplianceDeadlineService.ts` — Compliance deadline monitoring + email alerts.
- `server/services/PreEventBriefingService.ts` — Pre-event briefing scheduler.
- `server/middleware/brandConfig.ts` — White-label brand injection middleware.
- `server/emails/templates.ts` — Branded email templates.

### tRPC Routers (6 New — Master Integration v2)
- `server/routers/partnerRouter.ts` — Partner CRUD, brand config, token validation.
- `server/routers/sessionConfigRouter.ts` — Tier config, recipients, scheduling, readiness checks.
- `server/routers/sessionMessagesRouter.ts` — Token-validated bidirectional messaging.
- `server/routers/speakerQueueRouter.ts` — Question approval, presenter queue, mark answered/skip.
- `server/routers/agmIntelligenceRouter.ts` — Resolutions, dissent signals, post-AGM reports.
- `server/routers/operationsRouter.ts` — Handoffs, team coordination, feedback, flagging, compliance.

### Client Pages (3 New — Master Integration v2)
- `client/src/pages/ClientLive.tsx` — Branded live intelligence dashboard.
- `client/src/pages/ClientReport.tsx` — 10-tab post-event report.
- `client/src/pages/PresenterScreen.tsx` — Speaker Q&A display.

### Client Components (7 New — Master Integration v2)
- `client/src/components/SessionSetupPanel.tsx` — Tier and recipient configuration.
- `client/src/components/SessionScheduler.tsx` — Event scheduling.
- `client/src/components/ClientMessagePanel.tsx` — Client↔operator chat widget.
- `client/src/components/TranscriptFlagTimeline.tsx` — Segment flagging with visual timeline.
- `client/src/components/CollapsibleBottomTray.tsx` — Collapsible operator toolkit tray.
- `client/src/components/TeamCoordinationPanel.tsx` — Multi-operator coordination + internal chat.
- `client/src/components/ConsoleModeSwitcher.tsx` — Three-state mode switcher.

## Demo Readiness (April 2026)

- **Health Guardian**: 100% score with 6 services actively monitored.
- **Session Cleanup**: 10 completed sessions, no failed test data.
- **Demo Studio**: `/live-video/webcast/demo?simulate=1` — full simulation with institutional Q&A, attendees, transcription, sentiment.
- **Platform Connectivity**: Multi-path architecture panel visible in Shadow Mode.
- **Demo Flow**: Overview (100% health) → Shadow Mode (paste transcript) → Events/Webcasting Hub → Demo Studio → Partners page.
- **Client Delivery Demo**: Use `/live/:token`, `/report/:token`, `/presenter/:token` with generated test tokens.

## Commercial Context

- **Exit target**: $80M–$120M strategic acquisition within 24–36 months.
- **Primary acquirers**: Microsoft (Teams), Bloomberg, Nasdaq, Lumi Global, Broadridge.
- **Channel partners**: Lumi Global (~4,000 events/year), Bastion Group (~500 events/year).
- **Data flywheel**: CWSI (CuraLive Weighted Sentiment Index) — alternative data business for fund managers.

## Patent Portfolio

- **Filing authority**: CIPC (South Africa), App ID 1773575338868.
- **Priority date**: 12 March 2026. PCT deadline: 12 March 2027.
- **Claims**: 82 claims across 32 modules and 11 invention families.
- **CIP filings**: 3 pending — projecting expansion to 158 total claims.
