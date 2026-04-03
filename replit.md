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
- **UI Pages**:
    - `/`: Unified Operator Dashboard with 6 tabs (Overview, Shadow Mode, Events, Partners, Billing, Settings).
    - `/live-video/webcast/:slug`: Webcast Studio (production console with demo simulation mode).
    - `/live-video/webcast/demo?simulate=1`: Demo Studio with full simulation.
    - `/bridge` / `/bridge/:id`: Bridge Console — professional telephony operator console.
    - `/live/:token`: Client-facing read-only live dashboard.
    - `/qa/:accessCode`: Attendee webphone page for Live Q&A.

### Backend
- **Runtime**: Node.js 20+, Express 4.21.2, tRPC Server 11.6.0 (90+ routers).
- **ORM**: Drizzle ORM 0.44.5 with PostgreSQL (pg 8.20.0), 100+ tables.
- **Build System**: pnpm monorepo, tsx for development, esbuild for production.
- **Server Binding**: `0.0.0.0` on port from `PORT` env var.
- **Authentication**: JWT cookie sessions (`app_session_id`) with optional OAuth and `DEV_BYPASS`. Role hierarchy: viewer < operator < admin. tRPC procedures: `publicProcedure`, `protectedProcedure`, `operatorProcedure`, `adminProcedure`.
- **Storage**: Unified `storageAdapter.ts` — object storage (Replit forge API) primary, local disk fallback (`uploads/recordings/`). Extension allowlists, sanitization, path traversal protection.
- **Transcription Fallback**: Dual-provider — Gemini AI (primary) + Whisper (fallback) via Replit AI Integrations proxy.

### External Integrations
| Service | Purpose | Env Vars |
|---------|---------|----------|
| PostgreSQL | Primary database (100+ tables) | `DATABASE_URL` |
| Ably | Real-time pub/sub messaging | `ABLY_API_KEY` |
| Recall.ai | AI bot deployment for Zoom/Teams/Meet/Webex | `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` |
| Mux | RTMP/HLS video streaming | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` |
| OpenAI | GPT-4o (analysis) + Whisper (transcription) | `OPENAI_API_KEY` |
| Twilio | PSTN telephony, IVR, SIP, WebRTC | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID` |
| Telnyx | Alternative voice carrier (failover) | — |
| Stripe | Payment processing | — |
| Resend | Transactional email + ICS calendar invites | — |
| AWS S3 | Object storage | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` |

### Health Guardian
- Autonomous infrastructure monitoring at 30-second intervals.
- Only checks services with configured credentials (Database + ActiveEvents always; Twilio/OpenAI/Ably/Recall only if env vars present).
- API reachability (401/403) treated as "healthy" — credentials pending validation.
- Current score: **100%** with 6 services (Database, Active Events, Twilio, OpenAI, Ably, Recall.ai).
- AI-powered root cause analysis for incidents.
- File: `server/services/HealthGuardianService.ts`.

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
- **Speaker coaching**: WPM pace analysis, filler word detection, delivery quality scoring.
- **Evasive answer detection**: Identifies non-answers and deflection patterns.
- **Compliance flags**: Jurisdiction-specific rules applied in real time — JSE, SEC, FCA, ASIC, SGX, HKEX.

### Layer 3 — 20-Module Intelligence Report
Generated on session close via massive parallel prompt synthesis:
- M01: Executive summary | M02: Financial metrics extraction | M03: ESG & sustainability
- M04: Risk assessment | M05: Compliance flags | M06: Competitive intelligence
- M07: Management tone analysis | M08: Guidance analysis | M09: Q&A quality assessment
- M10: Investor sentiment signals | M11: Key personnel changes | M12: M&A signals
- M13: Capital allocation | M14: Sector impact | M15: Regulatory impact
- M16: Social media content pack | M17: SENS/RNS press release | M18: Analyst action items
- M19: Board action items | M20: Cross-event consistency

### Layer 4 — Specialist Intelligence Services
- **Crisis Prediction Engine**: Sentiment trajectories + hedging language analysis for crisis signals.
- **Valuation Impact Oracle**: Fair Value Gaps and share price impact from material disclosures.
- **Disclosure Certificates**: SHA-256 hash-chained immutable audit log.
- **Tagged Metrics**: Structured numerical data (Sentiment, Engagement, Compliance Risk) for benchmarking.
- **Market Impact Predictor**: Predicts market reaction to disclosed information.
- **Communication Index**: Quality scoring across clarity, consistency, completeness, timeliness.
- **Aggregate Intelligence**: Anonymised macro-sentiment and sector benchmarking.

### Layer 5 — AI Self-Evolution Engine
- **Meta-Observer** (`AiEvolutionService.ts`): Scores every module output for depth, breadth, specificity.
- **Gap Detection Matrix**: Identifies systematic blind spots across event types and clients.
- **Evolution Engine**: Autonomously proposes new AI capabilities when patterns detected.
- **Governance Gateway**: Proposals promoted through Stability/Consistency checks with SHA-256 audit chain.

## Shadow Mode

### Architecture
- **Shadow Mode Router** (`shadowModeRouter.ts`): Session CRUD, bot deployment, transcript retrieval, report generation. Status lifecycle: `pending → bot_joining → live → processing → completed → failed`.
- **Shadow Mode Guardian** (`ShadowModeGuardianService.ts`): Background watchdog (60s interval), zombie session detection, state recovery after server restart.
- **Recall.ai Integration** (`recallRouter.ts` + `recallWebhook.ts`): Bot deployment via API, webhook events, HMAC-SHA256 signature verification.
- **Platform Connectivity**: Multi-path architecture — Recall.ai (primary), RTMP ingest (backup/standby), Zoom RTMS (planned Q3 2026). UI panel in Live Intelligence tab.

### Shadow Mode UI — 11 Sub-Navigation Tabs
1. **Live Intelligence**: Session management, 3 input paths (Join Live Event, Upload Recording, Paste Transcript), Platform Connectivity panel.
2. **Archive Upload**: File upload with platform/event type selection.
3. **Archives & Reports**: Session archive browser with search, status filtering, pagination.
4. **AI Dashboard**: AI-powered analytics and insights.
5. **AI Learning**: Machine learning model performance and training data.
6. **AI Advisory**: AI-generated strategic recommendations.
7. **Live Q&A**: Full AI triage console (1,225 lines) — the most commercially critical component.
8. **System Test**: System diagnostics and health monitoring.
9. **Board Intelligence**: Board Intelligence Compass — governance score, open commitments, liability flags.
10. **Pre-Event Briefing**: Analyst consensus, predicted Q&A, compliance hotspots, readiness scores.
11. **Compliance Monitor**: Regulatory flags, disclosure triggers, jurisdiction profiles, action items.

### Operator Intelligence Features
- Operator Notes panel — real-time add/delete notes per session.
- Operator Action Log — every action timestamped and permanently logged.
- Keyboard shortcuts — M (mute), A (approve), R (reject), S (send to speaker), E (end session), H (handoff), ? (help).
- Session crash recovery — `sessionAutoSave.ts` for resilience.
- 27 distinct event types — earnings call, IPO roadshow, activist meeting, bondholder meeting, AGM, and more.
- Crisis prediction auto-run on session end.
- Disclosure Certificate auto-generation post-session.
- Valuation Impact Analysis automatic scoring on close.
- AiEvolution meta-observer hook — every session feeds the self-improvement loop.

## Live Q&A — AI Moderation Console

### AI Triage Engine
Every question classified automatically: Approved | Duplicate | Off-topic | Compliance Risk.

### Operator Console Features
- Two-panel UI — incoming question queue + AI triage summary.
- Per-question AI triage tag displayed instantly.
- AI-suggested answer for approved questions.
- Analyst identity sidebar — historical question fingerprint per analyst.
- Evasive answer detection — flags non-answers.
- Real-time Q&A count with category breakdown.
- Operator can admit, reject, merge, or escalate any question.

### P1 Enhancements
- **Duplicate Detection**: Jaccard word-overlap similarity (threshold 0.55). Duplicates get `triage_classification: "duplicate"`, priority reduced by 20.
- **Legal Review**: Distinct from `flagged` status — `legal_review_reason` column, modal with reason text.
- **AI Draft Responses**: `generateContextDraft` with transcript context. Stored in `ai_draft_text`/`ai_draft_reasoning`.
- **Enhanced Filters**: 10-tab filter bar with sort controls (Priority/Time/Compliance) and order toggle.
- **Keyboard Shortcuts**: 1-6 filter tabs, P/T/C sort mode, O toggle order, ? help panel.
- **Bulk Actions**: Checkbox selection with bulk approve/reject.

## Live Video & Audio Webcast Platform

### Streaming Architecture
- **Ingest**: RTMP push from OBS/vMix to Mux with unique streamKey.
- **Processing**: Mux transcoding, adaptive bitrate (HLS), recording. `reduced_latency: true`, `reconnect_window: 60`.
- **AI Audio Layer**: FFmpeg extracts HLS audio → chunked to OpenAI Whisper → Ably broadcasts transcript.
- **Delivery**: HLS via Mux global CDN. Event lifecycle: `draft → scheduled → live → ended → on_demand`.

### Virtual Studio — Intelligent Broadcaster
- AI Bundles selectable per event: Investor Relations, Compliance & Risk, Board Governance.
- Layouts: presenter-slides (PiP), panel-discussion (multi-speaker), full-screen.
- Dynamic overlays: sentiment gauge (live), compliance indicator (real-time flag display).
- AI sentiment HUD and compliance flag HUD for operator.

### Broadcaster Intelligence (Live Speaker Coaching)
- Speaking pace (WPM) tracking — alerts outside 140-180 WPM optimal range.
- Filler word detection — counts um, uh, like, you know per minute.
- Key moment identification — financial disclosures, guidance, M&A signals timestamped.
- Evasive language detection — hedging density flagging.

### Demo Studio
- Accessible at `/live-video/webcast/demo?simulate=1`.
- Full simulation: mock Q&A from Goldman Sachs, JP Morgan, Morgan Stanley, UBS, Barclays.
- Simulated attendees (up to 1,200), live transcription, sentiment analysis.
- Launched from Webcasting Hub "Launch Demo Studio" button.

### Attendee Registration Flow
- Registration form → 24-byte attendeeToken → confirmation email via Resend with ICS calendar invite → token-verified access.

### Interactive Features
- Live Q&A with AI auto-triage moderation.
- Live polling with real-time results.
- Real-time transcript display for attendees (optional).
- Slide synchronisation via Ably.
- Live subtitle translation (multi-language).
- Video in video — presenter plus slide deck.

## PSTN Telephony Bridge

### IVR Greeter Flow
1. Inbound call → POST `/api/bridge/inbound`.
2. Welcome TwiML prompt.
3. Access code entry → validation against event.
4. Name/organisation capture via recording.
5. Join conference or enter greeter queue (if auto-admit disabled).

### Operator Controls
- Mute/unmute, hold/unhold, remove individual participants.
- Lock/unlock conference, start/stop recording.
- Auto-admit toggle, greeter queue management.
- DTMF hand-raising (*2).
- Recall.ai bot deployment for AI transcription on the bridge.
- Carrier failover: Twilio (primary) → Telnyx (secondary).

**Status**: Audio bridge telephony built in codebase. UI and backend functional — requires Twilio trunk configuration to activate for production PSTN.

## Enterprise Billing & Booking

### Billing Engine
- Full enterprise billing built into the platform.
- Tables: `billing_clients`, `billing_client_contacts`, `billing_quotes`, `billing_invoices`, `billing_line_items`, `billing_payments`, `billing_recurring_templates`.
- Quote builder, invoice viewer, ageing report, recurring templates.

### Packaging Tiers
| Tier | Included |
|------|----------|
| Essential (per event) | Live transcript, rolling summaries, Q&A log + triage, 5 core AI modules, disclosure certificate |
| Intelligence (per event/retainer) | All Essential + full 20-module report, crisis prediction, valuation oracle, SENS/RNS draft, social media pack |
| Enterprise (annual licence) | All Intelligence + Board Intelligence Compass, Pre-Event Briefing, cross-event benchmarking, RBAC, white label, multi-tenant billing |

## Database Schema Summary

PostgreSQL database. Drizzle ORM 0.44.5. 100+ tables across all modules.

### Core Table Groups
| Group | Tables |
|-------|--------|
| Users & auth | `users` — id, openId, name, email, role, organisation, jobTitle, avatarUrl, phone, timezone |
| Events | `events`, `attendee_registrations` |
| Shadow Mode & AI | `shadow_sessions`, `recall_bots`, `bastion_intelligence_sessions`, `agm_intelligence_sessions`, `agentic_analyses`, `agentic_brain_decisions`, `operator_corrections`, `ai_generated_content` |
| Sentiment & compliance | `sentiment_snapshots`, `qa_auto_triage_results`, `speaking_pace_analysis`, `toxicity_filter_results`, `compliance_threats`, `compliance_framework_checks`, `compliance_audit_log` |
| Board intelligence (21 tables) | `board_intelligence_compass`, `prior_commitment_audits`, `director_liability_maps`, `analyst_expectation_audits`, `governance_communication_scores`, `board_resolutions`, `pre_event_intelligence_briefings`, `analyst_consensus_data`, `predicted_qa_items`, `compliance_hotspots`, `readiness_scores`, `regulatory_compliance_monitors`, `regulatory_flags`, `disclosure_triggers`, `jurisdiction_profiles` (6 seeded), `compliance_action_items` |
| Webcast | `webcast_events`, `webcast_registrations`, `webcast_enhancements`, `webcast_qa`, `virtual_studios` |
| Bridge telephony | `bridge_conferences`, `bridge_participants`, `bridge_greeter_queue` |
| Enterprise billing | `billing_clients`, `billing_client_contacts`, `billing_quotes`, `billing_invoices`, `billing_line_items`, `billing_payments`, `billing_recurring_templates` |
| AI evolution | `ai_evolution_proposals`, `ai_evolution_governance_log`, `ai_evolution_tools` |
| Certificates & audit | `disclosure_certificates`, `disclosure_certificate_chains` |
| Predictions | `crisis_predictions`, `valuation_impacts`, `market_impact_predictions` |
| Benchmarking | `tagged_metrics`, `tagged_metric_benchmarks`, `cross_event_consistency_reports`, `communication_index_scores`, `aggregate_intelligence` |
| Investor signals | `investor_engagement_scores`, `investor_intent_signals` |
| Social media | `social_media_accounts`, `social_media_posts`, `social_media_analytics` |
| Health monitoring | `health_checks`, `health_incidents` (raw SQL, not Drizzle) |

### Seeded Data
- Jurisdiction profiles (6): SEC (USA), FCA (UK), ASIC (Australia), SGX (Singapore), HKEX (Hong Kong), JSE (South Africa).

## Live Operator Console
- **LiveSessionPanel** (`client/src/components/LiveSessionPanel.tsx`): 5-phase integrated live operator console with WebPhone, Q&A moderation, transcript view, notes with auto-save, and session analytics.
- **WebPhoneCallManager**: Operator dashboard showing active participants, audio levels, quality badges, call stats, mute/remove controls.
- **WebPhoneJoinInstructions**: Customer-facing join instructions with WebPhone primary, dial-in/SIP/access code tabs.
- **ProviderStateIndicator**: Connection quality indicator — `"excellent" | "good" | "fair" | "poor"`.
- **Hooks**: `useAblySessions` (Ably real-time), `useKeyboardShortcuts` (keyboard shortcuts).
- **Services**: `sessionAutoSave` (auto-saves operator notes).

## Demo Readiness (April 2026)
- **Health Guardian**: 100% score with 6 services actively monitored.
- **Session Cleanup**: 10 completed sessions, no failed test data.
- **Demo Studio**: `/live-video/webcast/demo?simulate=1` — full simulation with institutional Q&A, attendees, transcription, sentiment.
- **Platform Connectivity**: Multi-path architecture panel visible in Shadow Mode.
- **Demo Flow**: Overview (100% health) → Shadow Mode (paste transcript) → Events/Webcasting Hub → Demo Studio → Partners page.

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
