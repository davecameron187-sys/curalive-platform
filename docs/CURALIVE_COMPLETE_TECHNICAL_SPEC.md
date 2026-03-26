# CuraLive Platform — Complete Technical Specification

**CIPC Patent Application ID:** 1773575338868
**Patent Claims:** 75 | **Platform Modules:** 35
**Version:** 1.0.0 | **Last Updated:** 2026-03-26
**Repository:** github.com/davecameron187-sys/curalive-platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Backend: tRPC Routers](#5-backend-trpc-routers)
6. [Backend: REST Endpoints](#6-backend-rest-endpoints)
7. [Backend: Services Layer](#7-backend-services-layer)
8. [AI/ML Intelligence Engine](#8-aiml-intelligence-engine)
9. [Frontend: Pages & Routes](#9-frontend-pages--routes)
10. [Frontend: Component Library](#10-frontend-component-library)
11. [Real-Time Infrastructure](#11-real-time-infrastructure)
12. [Telephony & OCC](#12-telephony--occ)
13. [Compliance & Governance](#13-compliance--governance)
14. [Billing & Enterprise](#14-billing--enterprise)
15. [External Integrations](#15-external-integrations)
16. [Security Architecture](#16-security-architecture)
17. [Deployment & Infrastructure](#17-deployment--infrastructure)
18. [File & Module Inventory](#18-file--module-inventory)

---

## 1. Executive Summary

CuraLive is a real-time investor events intelligence platform for high-stakes corporate communications — earnings calls, AGMs, IPO roadshows, investor days, and bondholder meetings. It combines live telephony operator controls, AI-powered transcription and analysis, regulatory compliance automation, and enterprise webcasting into a single, multi-tenant SaaS platform.

**Core Value Proposition:**
- Real-time AI sentiment analysis, evasiveness detection, and crisis prediction during live investor events
- Operator Command Center (OCC) for professional telephony management with SIP/WebRTC
- Automated JSE/SEC/FSB compliance monitoring with disclosure certificate generation
- Shadow Mode: silent AI bot monitoring of third-party meetings (Zoom/Teams) via Recall.ai
- Post-event intelligence reports with 20+ specialized analysis modules
- Enterprise billing with multi-currency quoting, invoicing, and recurring templates

**Scale Targets:**
- Up to 100,000 concurrent webcast attendees
- Sub-500ms AI sentiment latency
- 95% transcription accuracy
- Real-time processing of telephony events across Twilio and Telnyx

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  React 19 + Vite + Tailwind CSS + Radix UI + Wouter Router      │
│  tRPC Client ←→ Ably WebSocket ←→ Webphone (SIP/WebRTC)        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS (mTLS proxy)
┌───────────────────────────▼──────────────────────────────────────┐
│                     EXPRESS SERVER (Node.js)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  tRPC API   │  │  REST Routes │  │  Webhook Receivers     │  │
│  │  (97 routers│  │  (uploads,   │  │  (Recall.ai, Telnyx,   │  │
│  │   + merged) │  │   downloads) │  │   Twilio, Mux)         │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼────────────────▼──────────────────────▼─────────────┐  │
│  │                   SERVICE LAYER (58 services)              │  │
│  │  AI Analysis │ Compliance │ Telephony │ Billing │ Media    │  │
│  └──────┬────────────────┬──────────────────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼──┐  ┌──────────▼──────────┐  ┌───────▼────────────┐   │
│  │ OpenAI  │  │  PostgreSQL (Drizzle│  │ External Services  │   │
│  │ (GPT-4o │  │  ORM, 100+ tables)  │  │ Ably, Twilio,      │   │
│  │ Whisper)│  │                     │  │ Telnyx, Mux,       │   │
│  └─────────┘  └─────────────────────┘  │ Recall.ai, Stripe  │   │
│                                        └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Architecture Pattern:** Monolithic full-stack TypeScript with tRPC for type-safe client-server communication, Express for webhooks/uploads, and Drizzle ORM for database operations.

**Monorepo Structure (pnpm workspaces):**
```
/
├── client/src/          # React frontend (207 pages, 66 components)
├── server/              # Express + tRPC backend
│   ├── _core/           # Server bootstrap, env, LLM, tRPC context
│   ├── routers/         # 97 tRPC router files
│   ├── services/        # 58 service classes
│   └── config/          # AI applications, platform config
├── shared/              # Shared TypeScript types and constants
├── drizzle/             # Database schema (3,397 lines, 100+ tables)
├── docs/                # 42 specification documents
├── scripts/             # Health checks, smoke tests, router sync
└── artifacts/api-server # Replit deployment artifact
```

---

## 3. Technology Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Build | Vite | 7.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | Radix UI / Shadcn | Latest |
| Routing | Wouter | 3.x |
| API Client | tRPC React Query | 11.x |
| Real-time | Ably | SDK |
| Forms | React Hook Form + Zod | Latest |
| Charts | Recharts | 2.x |
| Notifications | Sonner (toast) | Latest |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js (tsx watch) | 22.x |
| Framework | Express | 4.x |
| API Layer | tRPC | 11.x |
| ORM | Drizzle | Latest |
| Database | PostgreSQL | 16 |
| AI/LLM | OpenAI GPT-4o / Whisper | API |
| Auth | JWT + OAuth2 (PKCE) | Custom |
| File Upload | Multer | Latest |
| Bundler (prod) | esbuild | Latest |

### External Services
| Service | Purpose |
|---------|---------|
| OpenAI (GPT-4o) | AI analysis, report generation, compliance |
| OpenAI (Whisper) | Audio transcription |
| Ably | Real-time WebSocket messaging |
| Twilio | Telephony (dial-out, TwiML, recording) |
| Telnyx | Telephony (alternative carrier) |
| Mux | Video streaming, live webcasting |
| Recall.ai | Meeting bot SDK (Shadow Mode) |
| Stripe | Payment processing, subscriptions |
| Resend | Transactional email delivery |
| Lumi Global | AGM voting integration |
| AWS S3 | Object storage |

---

## 4. Database Schema

**File:** `drizzle/schema.ts` (3,397 lines, 100+ tables)
**ORM:** Drizzle with PostgreSQL

### 4.1 Core Platform Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Authentication & profiles | id, openId, name, email, role, organisation, avatarUrl, timezone |
| `events` | Scheduled investor events | id, eventId, title, company, platform, status, accessCode |
| `attendee_registrations` | Event sign-ups | id, eventId, name, email, company, dialIn, accessPin |
| `ir_contacts` | Investor Relations contacts | id, name, email, company, role, phoneNumber |

### 4.2 Operator Command Center (OCC) Tables

| Table | Purpose |
|-------|---------|
| `occ_conferences` | Master telephony conference records (subject, codes, dial-in, status, recording state) |
| `occ_participants` | Real-time participant state (role, line, speaking status, request-to-speak queue) |
| `occ_lounge` | Waiting room / operator admission queue |
| `occ_operator_requests` | Participants requesting operator assistance |
| `occ_operator_sessions` | Operator presence and heartbeat tracking |
| `occ_chat_messages` | Operator-participant chat with auto-translation |
| `occ_audio_files` | Conference audio clips library |
| `occ_participant_history` | Audit trail for all participant state transitions |
| `occ_access_code_log` | DTMF access code entry attempts |
| `direct_access_log` | CuraLive Direct PIN-based auto-admit audit |

### 4.3 AI & Intelligence Tables

| Table | Purpose |
|-------|---------|
| `shadow_sessions` | Shadow Mode recording/analysis sessions |
| `sentiment_results` | Per-segment sentiment scores |
| `intelligence_reports` | AI-generated post-event intelligence summaries |
| `report_key_moments` | Critical event segments (insights, action items) |
| `operator_corrections` | Operator feedback loop for AI error correction |
| `adaptive_thresholds` | Learned sensitivity levels for AI detection |
| `evolution_observations` | AI self-improvement strategic insights |
| `evolution_proposals` | AI-proposed product roadmap items |
| `evolution_audit_log` | Blockchain-hashed AI evolution audit trail |
| `capability_roadmap` | AI-predicted feature roadmap |
| `autonomous_interventions` | AI actions taken without human triggers |
| `tagged_metrics` | Categorized performance metrics (engagement, compliance) |
| `crisis_predictions` | AI-driven risk scoring for corporate crises |
| `valuation_impacts` | Event sentiment vs. predicted share price impact |
| `transcription_jobs` | Whisper transcription job queue and status |

### 4.4 Compliance & Governance Tables

| Table | Purpose |
|-------|---------|
| `compliance_violations` | Detected regulatory violations |
| `compliance_vocabulary` | Keywords/phrases for automated flagging |
| `compliance_detection_stats` | Compliance engine performance metrics |
| `compliance_certificates` | Formal compliance attestation records |
| `disclosure_certificates` | Regulatory disclosure formal records |
| `soc2_controls` | SOC 2 compliance control tracking |
| `iso27001_controls` | ISO 27001 compliance control tracking |
| `ai_am_audit_log` | AI Automated Moderator audit trail |

### 4.5 Enterprise Billing Tables

| Table | Purpose |
|-------|---------|
| `billing_clients` | Enterprise customer profiles |
| `billing_quotes` | Financial proposals |
| `billing_quote_versions` | Quote revision history |
| `billing_line_items` | Individual charges on quotes/invoices |
| `billing_line_item_templates` | Reusable charge presets |
| `billing_invoices` | Tax invoices |
| `billing_payments` | Payment records (partial/full) |
| `billing_credit_notes` | Invoice adjustments |
| `billing_fx_rates` | Cached exchange rates (ZAR/USD/EUR) |
| `billing_activity_log` | Full billing audit trail |
| `billing_email_events` | Email open/click tracking |
| `billing_recurring_templates` | Retainer automation |
| `billing_client_contacts` | Multiple stakeholders per client |
| `stripe_subscriptions` | Stripe subscription state |

### 4.6 Webcasting & Media Tables

| Table | Purpose |
|-------|---------|
| `webcast_events` | Webcast event configuration |
| `webcast_registrations` | Webcast sign-ups |
| `webcast_qa` | Webcast Q&A submissions |
| `webcast_polls` | Live polling during webcasts |
| `webcast_enhancements` | Noise gate, dubbing, AI recap config |
| `webcast_analytics_expanded` | ROI + sustainability metrics (carbon saved) |
| `mux_streams` | Mux live stream records |
| `virtual_studios` | AI virtual presentation environments |

### 4.7 Investor Intelligence Tables

| Table | Purpose |
|-------|---------|
| `live_roadshows` | IPO/investor roadshow events |
| `live_roadshow_meetings` | Individual roadshow meetings |
| `live_roadshow_investors` | Investor participants in roadshows |
| `commitment_signals` | Detected investor buying intent signals |
| `bastion_intelligence_sessions` | Earnings call intelligence (Bastion Capital) |
| `bastion_investor_observations` | AI insights on management tone/credibility |
| `bastion_guidance_tracker` | Forward-looking statement tracking |
| `bastion_bookings` | Investor intelligence session scheduling |
| `lumi_bookings` | Lumi AGM management bookings |

### 4.8 AGM & Governance Tables

| Table | Purpose |
|-------|---------|
| `agm_intelligence_sessions` | AGM analysis sessions |
| `agm_resolutions` | Resolution voting and outcomes |
| `agm_dissent_patterns` | Institutional dissent pattern analysis |
| `agm_governance_observations` | AI governance quality observations |

### 4.9 Live Q&A Tables

| Table | Purpose |
|-------|---------|
| `live_qa_sessions` | Moderated Q&A session config |
| `live_qa_questions` | Attendee questions |
| `live_qa_answers` | Moderator/speaker answers |
| `live_qa_compliance_flags` | Regulatory risk assessment for questions |
| `live_qa_platform_shares` | Embed/share tracking |

### 4.10 Other Tables

| Table | Purpose |
|-------|---------|
| `event_customisation` | Branding, colors, unique links |
| `archive_events` | Post-event archive records with recording paths |
| `social_media_accounts` | Connected social accounts |
| `social_posts` | Published social media content |
| `social_metrics` | Social engagement tracking |
| `push_subscriptions` | Browser push notification subscriptions |
| `operator_link_analytics` | Operator tool usage tracking |
| `monthly_reports` | Aggregated monthly enterprise reports |
| `advisory_chat_messages` | AI advisor chat logs |
| `training_mode_sessions` | Operator training sandbox sessions |
| `training_conferences` | Training conference simulations |
| `training_participants` | Training participant records |
| `conference_dialouts` | Mass dial-out management |
| `conference_dialout_participants` | Per-participant dial-out state |

---

## 5. Backend: tRPC Routers

**Total:** 97 router files across `server/routers/`
**Protocol:** tRPC v11 with Zod validation
**Auth:** `protectedProcedure` (JWT-verified) and `publicProcedure`

### 5.1 Core Platform Routers

| Router | File | Purpose |
|--------|------|---------|
| `auth` | Built-in | Authentication, JWT tokens, session management |
| `profile` | Built-in | User profile CRUD |
| `events` | Built-in | Event creation, listing, status management |
| `registrations` | Built-in | Attendee registration and access control |
| `irContacts` | Built-in | Investor Relations contact management |
| `rbac` | `rbac.ts` | Role-based access control |
| `persistence` | `persistence.ts` | Generic key-value persistence |
| `scheduling` | `scheduling.ts` | Event scheduling and calendar |

### 5.2 OCC & Telephony Routers

| Router | Purpose |
|--------|---------|
| `occ` | Full OCC conference management (create, lock, admit, mute, disconnect) |
| `webphoneRouter` | SIP/WebRTC softphone control and recording |
| `conferenceDialoutRouter` | Mass dial-out orchestration (Twilio TwiML) |
| `trainingMode` | Sandboxed operator training conferences |
| `broadcasterRouter` | Intelligent live broadcast controls |

### 5.3 AI & Intelligence Routers

| Router | Purpose |
|--------|---------|
| `aiRouter` | Core AI operations (chat, analysis triggers) |
| `aiAmRouter` / `aiAmPhase2` | AI Automated Moderator (real-time content moderation) |
| `sentiment` | Real-time sentiment analysis endpoints |
| `transcription` | Whisper transcription job management |
| `intelligenceReportRouter` | Post-event intelligence report generation |
| `intelligenceTerminalRouter` | AI terminal / command-line intelligence interface |
| `archiveUploadRouter` | Archive upload + full AI report generation (20 modules) |
| `aiEvolutionRouter` | AI self-evolution proposals and observations |
| `crisisPredictionRouter` | Real-time crisis risk scoring |
| `valuationImpactRouter` | Sentiment-to-valuation correlation analysis |
| `materialityRiskRouter` | Real-time materiality risk oracle |
| `evasiveAnswerRouter` | Evasiveness detection in speaker responses |
| `marketImpactPredictorRouter` | Market impact prediction from event content |
| `marketReactionRouter` | Post-event market reaction tracking |
| `externalSentimentRouter` | External sentiment source aggregation |
| `communicationIndexRouter` | Communication quality scoring |
| `volatilitySimulatorRouter` | Volatility simulation from event data |
| `adaptiveIntelligenceRouter` | Adaptive AI threshold management |
| `agenticEventBrainRouter` | Autonomous event intelligence agent |
| `advisoryBotRouter` | AI advisory chatbot |
| `aiDashboard` | AI capabilities dashboard |
| `aiFeatures` | AI feature flags and configuration |
| `aiApplications` | AI shop / application catalog |

### 5.4 Investor Intelligence Routers

| Router | Purpose |
|--------|---------|
| `investorQuestionsRouter` | Investor question analysis and intelligence |
| `investorEngagementRouter` | Investor engagement scoring and tracking |
| `investorIntentRouter` | Investor intent signal detection |
| `roadshowAI` | IPO roadshow AI analysis |
| `ipoMandARouter` | IPO and M&A intelligence |
| `bastionBookingRouter` | Bastion Capital integration |
| `lumiBookingRouter` | Lumi Global AGM integration |
| `callPrepRouter` | Pre-call preparation intelligence |

### 5.5 Compliance Routers

| Router | Purpose |
|--------|---------|
| `compliance` | Core compliance violation management |
| `complianceEngineRouter` | Automated compliance scanning engine |
| `multiModalComplianceRouter` | Cross-modal compliance analysis |
| `regulatoryInterventionRouter` | Regulatory intervention triggers |
| `disclosureCertificateRouter` | Disclosure certificate generation |
| `soc2Router` | SOC 2 compliance dashboard |
| `iso27001Router` | ISO 27001 compliance dashboard |
| `eventIntegrityRouter` | Event integrity verification |

### 5.6 Webcasting & Media Routers

| Router | Purpose |
|--------|---------|
| `webcastRouter` | Webcast event management |
| `muxRouter` | Mux video stream management |
| `liveVideo` | Live video meeting controls |
| `virtualStudioRouter` | AI virtual studio configuration |
| `liveSubtitleRouter` | Real-time subtitle/captioning |
| `liveRollingSummary` | Live AI rolling summary generation |
| `liveQaRouter` | Moderated live Q&A platform |
| `polls` | Live polling during events |

### 5.7 Business & Admin Routers

| Router | Purpose |
|--------|---------|
| `billingRouter` | Enterprise billing, quoting, invoicing |
| `billing` | Legacy billing endpoints |
| `branding` | White-label branding configuration |
| `clientPortal` | Client-facing portal |
| `analytics` | Platform analytics and reporting |
| `monthlyReportRouter` | Monthly enterprise reports |
| `mailingListRouter` | Mailing list management |
| `socialMedia` | Social media integration |
| `sustainabilityRouter` | Sustainability metrics and ESG reporting |
| `operatorLinksRouter` | Internal operator tool links |
| `platformEmbedRouter` | Embeddable widget configuration |
| `crmApiRouter` | CRM integration endpoints |

### 5.8 System & Operations Routers

| Router | Purpose |
|--------|---------|
| `healthGuardianRouter` | Health monitoring and service status |
| `systemDiagnosticsRouter` | System diagnostics and debugging |
| `shadowModeRouter` | Shadow Mode session management |
| `recallRouter` | Recall.ai bot lifecycle management |
| `autonomousInterventionRouter` | AI autonomous action management |
| `taggedMetricsRouter` | Metrics tagging and retrieval |
| `benchmarksRouter` | Performance benchmarking |
| `crossEventConsistencyRouter` | Cross-event pattern analysis |
| `evolutionAuditRouter` | AI evolution audit chain |
| `interconnectionAnalytics` | System interconnection analytics |
| `personalizedBriefingRouter` | Personalized event briefings |
| `contentTriggers` | Automated content generation triggers |
| `followups` | Post-event follow-up management |
| `supportChatRouter` | Support chat interface |
| `mobileNotifications` | Push notification management |
| `customisationRouter` | Event customisation settings |
| `transcriptEditorRouter` | Post-event transcript editing |
| `eventBriefRouter` | Event brief generation |
| `postEventReport` | Post-event report generation |
| `bot` | Bot management |
| `ably` | Ably real-time channel management |

---

## 6. Backend: REST Endpoints

Defined in `server/_core/index.ts` (949 lines). These handle operations that tRPC doesn't suit (webhooks, file uploads, binary downloads).

### 6.1 Health & Status
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Full service status JSON (all integrations, DB, AI) |
| GET | `/api/status` | Simple alive check |

### 6.2 Webhooks
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/webhooks/recall/ai-am` | Recall.ai bot event callbacks |
| POST | `/api/webphone/telnyx` | Telnyx telephony event callbacks |
| POST | `/api/conference-dialout/twiml` | Twilio TwiML generation for dial-out |
| POST | `/api/webphone/recording-status` | Telephony recording status updates |
| POST | `/api/recall/webhook` | Recall.ai webhook events |

### 6.3 Media & Uploads
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/shadow/recording/:sessionId` | Upload Shadow Mode audio recording |
| POST | `/api/archives/upload` | Upload archive recording file |
| GET | `/api/archives/:id/recording` | Download archive recording |
| GET | `/api/archives/:id/transcript` | Download archive transcript |
| GET | `/api/archives/downloads` | List all downloadable archives |
| GET | `/api/archives/download-all` | ZIP download (supports `?ids=1,2,3`) |

### 6.4 Authentication
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/oauth/callback` | OAuth2 authorization code callback |
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/register` | User registration |

### 6.5 Public Downloads
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/download/architecture` | Architecture documentation download |
| GET | `/download/patent` | Patent documentation download |
| GET | `/download/ai-reports` | AI reports download |
| GET | `/download/mirroring` | Mirroring documentation download |

---

## 7. Backend: Services Layer

**Total:** 58 service files in `server/services/`

### 7.1 AI & Analysis Services

| Service | File | Purpose |
|---------|------|---------|
| `SentimentAnalysisService` | Built-in | Real-time sentiment scoring per transcript segment |
| `EvasiveAnswerDetectionService` | `EvasiveAnswerDetectionService.ts` | Detects evasive/deflecting answers from speakers |
| `SpeakingPaceCoachService` | `SpeakingPaceCoachService.ts` | WPM, filler words, pause analysis + coaching |
| `ToxicityFilterService` | `ToxicityFilterService.ts` | Content moderation, PSI detection, legal risk |
| `LiveRollingSummaryService` | `LiveRollingSummaryService.ts` | Real-time AI rolling summary generation |
| `AiEvolutionService` | `AiEvolutionService.ts` | AI self-improvement engine (Module M) |
| `PersonalizedBriefingService` | `PersonalizedBriefingService.ts` | Attendee-specific pre-event briefings |
| `PersonalizationEngine` | `PersonalizationEngine.ts` | User preference learning engine |
| `CrossEventConsistencyService` | `CrossEventConsistencyService.ts` | Cross-event pattern detection |
| `ContentPerformanceAnalyticsService` | `ContentPerformanceAnalyticsService.ts` | Content effectiveness scoring |
| `OrganizationalKnowledgeGraphService` | `OrganizationalKnowledgeGraphService.ts` | Client knowledge graph with decay-weighted history |
| `EventBriefGeneratorService` | `EventBriefGeneratorService.ts` | AI-powered event brief generation |
| `ContentGenerationTriggerService` | `ContentGenerationTriggerService.ts` | Automated content generation triggers |
| `RedactionWorkflowService` | `RedactionWorkflowService.ts` | PII detection and transcript redaction |

### 7.2 Compliance Services

| Service | File | Purpose |
|---------|------|---------|
| `ComplianceEngineService` | `ComplianceEngineService.ts` | Automated compliance scanning (300s interval) |
| `ComplianceModerator` | `ComplianceModerator.ts` | Real-time compliance monitoring singleton |
| `AgiComplianceService` | Built-in | AGI-level compliance assessment |
| `RegulatoryInterventionService` | `RegulatoryInterventionService.ts` | Automated regulatory intervention triggers |

### 7.3 Telephony & Real-Time Services

| Service | File | Purpose |
|---------|------|---------|
| `AblyRealtimeService` | Built-in | Ably WebSocket channel management |
| `ConferenceDialoutService` | `ConferenceDialoutService.ts` | Twilio mass dial-out orchestration |
| `WebphoneService` | Built-in | SIP/WebRTC softphone backend |
| `ShadowModeGuardianService` | `ShadowModeGuardianService.ts` | Shadow session watchdog (60s zombie check) |

### 7.4 Media & Content Services

| Service | File | Purpose |
|---------|------|---------|
| `AudioEnhancer` | `AudioEnhancer.ts` | Audio quality enhancement (noise gate) |
| `LanguageDubber` | `LanguageDubber.ts` | AI language dubbing for webcasts |
| `PodcastConverterService` | `PodcastConverterService.ts` | Event-to-podcast conversion |
| `WebcastRecapService` | `WebcastRecapService.ts` | AI webcast recap generation |
| `WebcastArchiveAiService` | `WebcastArchiveAiService.ts` | Webcast archive AI analysis |
| `SocialMediaService` | `SocialMediaService.ts` | Social media post generation and publishing |
| `PlatformEmbedService` | `PlatformEmbedService.ts` | Embeddable widget code generation |
| `EventEchoPipeline` | `EventEchoPipeline.ts` | Event content echo/replay pipeline |

### 7.5 Partner & Integration Services

| Service | File | Purpose |
|---------|------|---------|
| `BastionBookingService` | `BastionBookingService.ts` | Bastion Capital partner integration |
| `LumiBookingService` | Built-in | Lumi Global AGM integration |
| `LiveQaTriageService` | `LiveQaTriageService.ts` | Q&A triage and go-live authorization |

### 7.6 System Services

| Service | File | Purpose |
|---------|------|---------|
| `HealthGuardianService` | `HealthGuardianService.ts` | Autonomous health monitoring (30s interval) |
| `ReminderScheduler` | Built-in | Event reminder scheduling (300s interval) |

---

## 8. AI/ML Intelligence Engine

### 8.1 Full AI Report Generation

The `generateFullAiReport()` function (in `archiveUploadRouter.ts`) orchestrates GPT-4o to produce a structured report with **20 specialized analysis modules**:

| # | Module | Output |
|---|--------|--------|
| 1 | Executive Summary | 3-5 sentence event overview |
| 2 | Sentiment Analysis | Score (0-100), narrative, key drivers |
| 3 | Compliance Review | Risk level (Low→Critical), flagged phrases, recommendations |
| 4 | Key Topics | Topic name, sentiment, detailed explanation |
| 5 | Speaker Analysis | Per-speaker roles, key points, effectiveness |
| 6 | Questions Asked | Question text, asker identity, quality rating (Insightful/Routine/Challenging) |
| 7 | Action Items | Item description, owner, deadline |
| 8 | Investor Signals | Signal type, interpretation, severity |
| 9 | Communication Score | Score (0-100), clarity, transparency, confidence |
| 10 | Risk Factors | Factor, impact (H/M/L), likelihood |
| 11 | Competitive Intelligence | Competitor mentions, context, implications |
| 12 | Recommendations | Strategic advice for IR teams |
| 13 | Speaking Pace Analysis | WPM, filler word count, coaching tips |
| 14 | Toxicity Screen | Risk level, flagged content, PSI detection, legal risk |
| 15 | Sentiment Arc | Opening/midpoint/closing scores, trend direction |
| 16 | Financial Highlights | Metrics (Revenue, EBITDA), values, YoY changes |
| 17 | ESG Mentions | Environmental/Social/Governance topics, commitments |
| 18 | Press Release Draft | SENS/RNS-style regulatory announcement draft |
| 19 | Social Media Content | Platform-specific ready-to-post content (LinkedIn, Twitter) |
| 20 | Board-Ready Summary | Verdict (Strong→Critical), recommended board actions |

### 8.2 Real-Time AI Services

| Service | Latency | Algorithm |
|---------|---------|-----------|
| Sentiment Dashboard | <500ms | LLM-scored per-segment (Bullish/Neutral/Bearish) |
| Sentiment Spike Detection | Real-time | Threshold + anomaly detection |
| Evasive Answer Detection | <2s | LLM prompt analysis of Q&A exchanges |
| Crisis Prediction | Real-time | Multi-factor risk scoring |
| Toxicity/PSI Filter | <1s | Content moderation LLM + keyword matching |
| Rolling Summary | ~30s | Windowed LLM summarization |
| Materiality Risk Oracle | Real-time | JSE/SEC materiality threshold analysis |

### 8.3 AI Self-Evolution Engine (Module M — Patented)

Six proprietary algorithms for autonomous AI improvement:

1. **Module Quality Scoring** — Measures Depth (length), Breadth (completeness), and Specificity (penalizes generic LLM boilerplate like "key stakeholders")
2. **Evidence Decay Function** — Exponential decay: `0.5^(age/half_life)` weights recent AI performance higher
3. **Cross-Event Correlation Engine** — Detects systematic platform gaps across clients/event types
4. **Autonomous Promotion Pipeline** — Advances tool proposals: Emerging → Proposed → Approved
5. **Gap Detection Matrix** — Ranks platform blind spots by importance × failure rate
6. **Impact Estimation Model** — Predicts ROI of implementing new AI capabilities

### 8.4 AI Applications Inventory

**28 registered AI applications** in `server/config/aiApplications.ts` (1,417 lines):

**Real-Time Intelligence:** Sentiment Dashboard, Sentiment Timeline, Sentiment Drivers, Spike Detection
**Transcription:** Live Speech-to-Text, PII Redaction Workflow
**Content Generation:** Event Brief Generator, Rolling Summary, Q&A Deep-Dive, Press Release Draft
**Investor Intelligence:** Commitment Signals, Order Book Summary, Debrief Reports, Intent Detection
**Compliance:** Real-Time Compliance Monitor, Materiality Risk Oracle, Disclosure Certificate
**Analytics:** Communication Index, Valuation Impact, Market Reaction, Speaking Pace Coach
**Enterprise:** Personalized Briefing, Social Media Content, Sustainability Metrics

---

## 9. Frontend: Pages & Routes

**Total:** 207 page files in `client/src/pages/`
**Router:** Wouter with hash-based navigation

### 9.1 Core Operational Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Main operator landing — health metrics, live sessions, quick actions |
| `/shadow-mode` | ShadowMode | Silent AI monitoring of third-party meetings |
| `/occ` | OCC | Operator Command Center (telephony management) |
| `/operator/:id` | OperatorConsole | Per-event operator interface |
| `/event/:id` | EventRoom | Live meeting interface for participants |
| `/register/:id` | Registration | Public event registration |
| `/post-event/:id` | PostEvent | Post-call analytics and AI reports |
| `/intelligence-suite` | IntelligenceSuite | 11-algorithm AI intelligence dashboard |
| `/intelligence-terminal` | IntelligenceTerminal | AI command-line intelligence interface |

### 9.2 Dashboard Tabs

The main dashboard is organized into primary tabs:

- **Overview** — Real-time platform health (Health Guardian), active sessions, quick action tiles
- **Shadow Mode** — Manage Shadow bots that join external meetings (Zoom/Teams)
- **Events** — Sub-tabs: Webcasting hub, Calendar, Mailing list management
- **Partners** — Bastion Capital, Lumi Global integration portals
- **Billing** — Financial reports, ageing, recurring templates
- **Settings** — Account preferences, environment status (ServiceStatusPanel)

### 9.3 AI & Intelligence Pages

| Route | Purpose |
|-------|---------|
| `/intelligence-suite` | 11 specialized AI algorithms dashboard |
| `/intelligence-terminal` | Command-line AI intelligence interface |
| `/ai-shop` | AI capabilities marketplace |
| `/ai-dashboard` | AI service status and metrics |
| `/ai-onboarding` | AI feature onboarding flow |
| `/sentiment-dashboard` | Real-time sentiment visualization |
| `/toxicity-filter` | Content moderation dashboard |
| `/crisis-prediction` | Crisis risk assessment |
| `/communication-index` | Communication quality scoring |

### 9.4 Webcasting & Media Pages

| Route | Purpose |
|-------|---------|
| `/webcasting-hub` | Central broadcast management |
| `/live-video/webcast/:slug` | Production webcast studio |
| `/virtual-studio` | AI virtual presentation environment |
| `/webcast-analytics` | Webcast performance analytics |
| `/on-demand-library` | On-demand recording library |
| `/podcast-converter` | Event-to-podcast conversion |
| `/transcript-editor` | Post-event transcript editing |

### 9.5 Compliance Pages

| Route | Purpose |
|-------|---------|
| `/compliance-engine` | Automated violation detection dashboard |
| `/compliance-dashboard` | Compliance overview |
| `/compliance-audit-log` | Audit trail viewer |
| `/soc2-dashboard` | SOC 2 controls and evidence |
| `/iso27001-dashboard` | ISO 27001 controls and evidence |
| `/redaction-workflow` | PII redaction management |

### 9.6 Billing & Enterprise Pages

| Route | Purpose |
|-------|---------|
| `/billing` | Enterprise billing hub |
| `/admin/billing/quote/:id` | Quote builder/viewer |
| `/admin/billing/invoice/:id` | Invoice viewer |
| `/ageing-report` | Receivables ageing analysis |
| `/recurring-templates` | Recurring billing automation |

### 9.7 Security & Operations Pages (25+ pages)

Comprehensive security dashboard suite:
- Advanced Threat Detection, Threat Intelligence, IOC Management
- Incident Response Playbooks, Automated Incident Response
- Vulnerability Management, Penetration Testing
- SIEM Integration, Zero Trust Dashboard
- Security Metrics KPI, Security Scorecard
- Data Residency, Identity & Access Management
- Policy Management, Security Awareness Training
- Vendor Risk, CI/CD Security, Risk Forecasting

### 9.8 Admin Pages

| Route | Purpose |
|-------|---------|
| `/admin/panel` | System configuration |
| `/admin/users` | User management |
| `/admin/clients` | Client management |
| `/dev-dashboard` | Internal development tools |
| `/tech-handover` | Technical handover documentation |

---

## 10. Frontend: Component Library

**Total:** 66 custom components in `client/src/components/`

### 10.1 UI Foundation (Radix/Shadcn)
`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`

### 10.2 Domain Components

| Component | Purpose |
|-----------|---------|
| `AIChatBox` | AI advisory chat interface |
| `LivePoll` | Real-time polling during events |
| `LiveQuestionBox` | Attendee question submission |
| `RealtimeQaModeration` | Moderator Q&A approval interface |
| `SentimentTrendChart` | Real-time sentiment visualization |
| `ComplianceMonitor` | Live compliance violation alerts |
| `ParticipantStatusDashboard` | Conference participant status grid |
| `ServiceStatusPanel` | Platform health and integration status |
| `Webphone` | SIP/WebRTC softphone UI |
| `MuxStreamPanel` | Mux video stream controls |
| `TranscriptEditor` | Post-event transcript editing |
| `LiveRollingSummaryPanel` | AI rolling summary display |
| `WebcastRecapGenerator` | AI recap generation controls |
| `IntelligenceReport` | Full AI report renderer |
| `DashboardLayout` | Main application layout shell |

---

## 11. Real-Time Infrastructure

### 11.1 Ably WebSocket Channels

CuraLive uses Ably for real-time communication:

| Channel Pattern | Purpose |
|----------------|---------|
| `event:{eventId}:sentiment` | Real-time sentiment updates |
| `event:{eventId}:transcript` | Live transcript streaming |
| `event:{eventId}:qa` | Q&A updates |
| `event:{eventId}:compliance` | Compliance alerts |
| `shadow:{sessionId}` | Shadow Mode transcript/analysis |
| `occ:{conferenceId}` | Operator conference state updates |

### 11.2 Real-Time Data Flow
```
Audio Source → Recall.ai Bot → Webhook → Server → Whisper → Transcript
                                                      ↓
                                              Sentiment Analysis
                                                      ↓
                                              Ably → Client UI
```

---

## 12. Telephony & OCC

### 12.1 Operator Command Center

The OCC provides professional-grade telephony management:

- **Conference Management:** Create, lock, unlock, record, end conferences
- **Participant Controls:** Admit from lounge, mute/unmute, disconnect, move to subconference
- **Request-to-Speak Queue:** Ordered queue with operator approval
- **Chat:** Operator-participant messaging with automatic language detection/translation
- **Audio Playback:** Play audio clips into conference (hold music, announcements)
- **CuraLive Direct:** PIN-based auto-admission bypassing the lounge

### 12.2 Telephony Providers

| Provider | Use Case | Integration |
|----------|----------|-------------|
| Twilio | Primary dial-out, TwiML, recording | REST API + Webhooks |
| Telnyx | Alternative carrier, SIP trunking | REST API + Webhooks |

### 12.3 Webphone

Browser-based SIP/WebRTC softphone for operators:
- Direct dial, conference join, call transfer
- Recording controls (start/stop/pause)
- DTMF tone sending
- Call quality monitoring

---

## 13. Compliance & Governance

### 13.1 Regulatory Frameworks

| Framework | Coverage |
|-----------|----------|
| JSE Listings Requirements | South African stock exchange compliance |
| SEC Regulation FD | US fair disclosure rules |
| FSB (FSCA) | South African financial services regulation |
| SOC 2 | Security, availability, processing integrity |
| ISO 27001 | Information security management |
| King IV | South African corporate governance code |

### 13.2 Automated Compliance Engine

Runs every 300 seconds, scanning for:
- Price-sensitive information (PSI) disclosure
- Forward-looking statement compliance
- Insider trading risk indicators
- Selective disclosure violations
- POPIA/GDPR data protection violations
- Material information fair disclosure

### 13.3 Compliance Outputs

- **Disclosure Certificates:** Formal regulatory attestation documents
- **Compliance Reports:** Violation summaries with risk ratings
- **Audit Trail:** Immutable log of all compliance events
- **Real-time Alerts:** Immediate notification of critical violations

---

## 14. Billing & Enterprise

### 14.1 Multi-Currency Billing

- **Currencies:** ZAR (primary), USD, EUR with cached FX rates
- **Quote Workflow:** Draft → Sent → Accepted → Invoiced (with version history)
- **Invoice Workflow:** Draft → Sent → Partially Paid → Paid
- **Credit Notes:** Adjustment tracking against invoices
- **Recurring Templates:** Automated retainer billing

### 14.2 Billing Line Item Categories

| Category | Examples |
|----------|---------|
| Conference Services | Per-minute telephony, dial-out, recording |
| Webcasting | Per-attendee streaming, video encoding |
| AI Intelligence | Report generation, sentiment analysis |
| Compliance | Disclosure certificates, audit reports |
| Support | Operator hours, training |

---

## 15. External Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| OpenAI (GPT-4o + Whisper) | Active (via Replit proxy) | AI analysis, transcription |
| Ably | Requires API key | Real-time WebSocket messaging |
| Twilio | Requires credentials | Telephony dial-out and recording |
| Telnyx | Requires API key | Alternative telephony carrier |
| Mux | Requires tokens | Video streaming and live broadcast |
| Recall.ai | Active (API key set) | Meeting bot SDK for Shadow Mode |
| Stripe | Requires secret key | Payment processing |
| Resend | Requires API key | Transactional email |
| Lumi Global | Partner API | AGM voting management |
| AWS S3 | Configured | Object storage for recordings/assets |

---

## 16. Security Architecture

### 16.1 Authentication

- **Primary:** JWT tokens with configurable secret (`JWT_SECRET`)
- **OAuth2:** PKCE flow with configurable OAuth server
- **Session:** Stateless JWT with refresh token rotation
- **RBAC:** Role-based access control (Admin, Operator, Client, Attendee)

### 16.2 Data Protection

- **PII Redaction:** Automated detection and redaction in transcripts
- **Encryption:** TLS in transit, database-level encryption at rest
- **Audit Logging:** Complete action audit trail across all modules
- **Webhook Verification:** HMAC signature validation for Recall.ai, Twilio

### 16.3 Compliance Certifications (Dashboard Coverage)

- SOC 2 Type II controls tracking
- ISO 27001 controls tracking
- Zero Trust architecture dashboard
- Penetration testing management
- Vulnerability management
- Incident response playbooks

---

## 17. Deployment & Infrastructure

### 17.1 Replit Deployment

| Aspect | Configuration |
|--------|--------------|
| Platform | Replit (Nix-based container) |
| Build | `vite build` (frontend) + `esbuild` (backend) → `dist/` |
| Start | `NODE_ENV=production node dist/index.js` |
| Dev | `tsx watch server/_core/index.ts` |
| Database | Replit PostgreSQL (via `DATABASE_URL`) |
| Domain | `curalive-platform.replit.app` |

### 17.2 Environment Variables

**Required:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret

**AI (priority order):**
- `AI_INTEGRATIONS_OPENAI_API_KEY` → Replit proxy (active)
- `BUILT_IN_FORGE_API_KEY` → Replit built-in
- `OPENAI_API_KEY` → Direct OpenAI

**Optional Services:**
- `ABLY_API_KEY`, `RESEND_API_KEY`, `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELNYX_API_KEY`
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- `STRIPE_SECRET_KEY`, `OAUTH_SERVER_URL`

### 17.3 Background Processes

| Process | Interval | Purpose |
|---------|----------|---------|
| HealthGuardian | 30s | Service health monitoring |
| ComplianceEngine | 300s | Automated compliance scanning |
| ReminderScheduler | 300s | Event reminder dispatch |
| ShadowWatchdog | 60s | Zombie shadow session cleanup |

---

## 18. File & Module Inventory

### 18.1 Code Statistics

| Category | Count |
|----------|-------|
| tRPC Router Files | 97 |
| Service Files | 58 |
| Frontend Pages | 207 |
| Frontend Components | 66 |
| Database Tables | 100+ |
| AI Applications | 28 |
| Documentation Files | 42 |
| Schema LOC | 3,397 |
| Total Backend LOC | ~53,000 |

### 18.2 Key Configuration Files

| File | Purpose |
|------|---------|
| `server/_core/index.ts` | Server bootstrap (949 lines) |
| `server/_core/config/env.ts` | Environment validation |
| `server/_core/config/serviceStatus.ts` | Service health aggregation |
| `server/_core/llm.ts` | LLM invocation (OpenAI proxy routing) |
| `server/audioTranscribe.ts` | Whisper transcription service |
| `server/config/aiApplications.ts` | 28 AI application definitions (1,417 lines) |
| `server/routers.eager.ts` | Eager-loaded router registry |
| `server/routers.ts` | Full router registry |
| `drizzle/schema.ts` | Database schema (3,397 lines) |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |

### 18.3 Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Router Sync Check | `pnpm run check:routers` | Verifies 97 routers in sync between eager/full registries |
| Smoke Test | `bash scripts/smoke-test.sh` | End-to-end API health verification |
| DB Push | `drizzle-kit push --force` | Schema synchronization to PostgreSQL |
| Build | `pnpm run build` | Production build (Vite + esbuild) |
| Type Check | `pnpm run check` | Full TypeScript type verification |

---

*CuraLive Platform — CIPC Patent App 1773575338868 — 75 Claims — 35 Modules*
*Confidential Technical Specification — All Rights Reserved*
