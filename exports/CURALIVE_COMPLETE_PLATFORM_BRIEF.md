# CURALIVE — COMPLETE PLATFORM BRIEF

**Date:** 2026-03-29
**Stack:** React 19 + Vite + Express + tRPC + PostgreSQL + Drizzle ORM + Ably + Recall.ai + Mux + Twilio/Telnyx
**Codebase:** ~184,000 lines across pages/components/routers/services
**Database:** 120+ PostgreSQL tables via Drizzle ORM
**Registered tRPC Routers:** 93
**Backend Services:** 58
**Frontend Pages:** 170+

---

## TABLE OF CONTENTS

**Part I — Platform Architecture**
1. Platform Overview & Mission
2. Tech Stack
3. Server Architecture
4. Database Schema Overview (120+ tables)
5. tRPC Router Registry (93 routers)
6. Authentication & Authorization
7. Real-Time Infrastructure (Ably + WebSocket)

**Part II — Core Product Modules**
8. Operator Conference Console (OCC)
9. Shadow Mode (Live Event Intelligence)
10. Archive & AI Reports
11. Webcasting Platform
12. Webphone System
13. Live Video Meetings
14. Roadshow AI
15. Live Q&A System
16. Billing & Invoicing
17. Training Mode

**Part III — Intelligence & AI Systems**
18. CIP4 Intelligence Suite
19. AI-AM (Automated Monitoring)
20. AI Evolution & Self-Improvement
21. Compliance Engine
22. Crisis Prediction
23. Valuation Impact Analysis
24. Disclosure Certificates
25. Market Reaction Analysis
26. Communication Index
27. Investor Question Intelligence
28. Intelligence Terminal
29. Intelligence Reports
30. External Sentiment Analysis
31. Market Impact Predictor
32. Materiality Risk Oracle
33. Investor Intent Decoder
34. Investor Engagement Scoring
35. Cross-Event Consistency
36. Volatility Simulator
37. Regulatory Intervention
38. Event Integrity Twin
39. Evasive Answer Detection
40. Adaptive Intelligence
41. IPO & M&A Intelligence
42. Sustainability Analytics

**Part IV — Operational Systems**
43. AGM Governance AI
44. Bastion Partner Intelligence
45. Lumi Partner Booking
46. Conference Dial-Out
47. Call Preparation
48. Event Brief Generator
49. Live Rolling Summary
50. Live Subtitles & Translation
51. Transcript Editor
52. Content Generation Triggers
53. Social Media Integration
54. Mailing List Manager
55. CRM API
56. Personalized Briefing

**Part V — Platform Infrastructure**
57. Virtual Studio
58. Intelligent Broadcaster
59. Agentic Event Brain
60. Autonomous Intervention
61. Platform Embed
62. Operator Links
63. Benchmarks
64. Tagged Metrics
65. Support Chat
66. Advisory Bot
67. Monthly Reports
68. Health Guardian
69. System Diagnostics
70. SOC 2 Compliance
71. ISO 27001 Compliance
72. RBAC (Role-Based Access)
73. Branding & Customisation
74. Scheduling
75. Polls
76. Mobile Notifications
77. Client Portal
78. Mux Video Streaming
79. Recall.ai Integration
80. Post-Event Reports

**Part VI — Design System**
81. Design Tokens & Theme
82. Component Library
83. Icon System

**Part VII — Environment & Configuration**
84. Environment Variables
85. Deployment Architecture
86. Key Gotchas

---

# PART I — PLATFORM ARCHITECTURE

---

## 1. PLATFORM OVERVIEW & MISSION

CuraLive is a real-time investor events intelligence platform purpose-built for the investor relations (IR) industry, specifically JSE-listed (Johannesburg Stock Exchange) companies and their service providers.

**Core mission:** Enable IR teams, conference operators, and compliance officers to run, monitor, analyze, and report on corporate events (earnings calls, AGMs, investor days, roadshows, capital markets events) with AI-powered real-time intelligence, automated compliance monitoring, and post-event analytics.

**Key user roles:**
- **Operators** — conference call operators managing live events
- **IR Teams** — investor relations professionals preparing and reviewing events
- **Compliance Officers** — monitoring regulatory compliance during events
- **Admins** — platform administrators managing users, billing, and configuration
- **Attendees** — external participants joining webcasts, Q&A, and events
- **Investors** — institutional investors in roadshows and capital markets events

**Product lines:**
- **OCC (Operator Conference Console)** — live conference management
- **Shadow Mode** — silent live event monitoring with AI
- **Webcasting** — branded webcast hosting and on-demand replay
- **Roadshow AI** — capital raising and investor meeting management
- **Intelligence Suite** — CIP4 analytics, compliance, sentiment, crisis prediction
- **Billing** — full quote-to-cash cycle
- **Training Mode** — operator training environment

---

## 2. TECH STACK

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite | Build tool and dev server |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui (Radix) | Component library |
| Wouter | Client-side routing |
| tRPC React Query | Server communication |
| Lucide React | Icon library |
| Recharts | Charts and data visualization |
| Framer Motion | Animations |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express.js | HTTP server |
| tRPC | Type-safe API layer |
| Drizzle ORM | Database queries and schema |
| PostgreSQL | Primary database |
| Ably | Real-time pub/sub messaging |
| Recall.ai | Meeting bot deployment and transcription |
| Mux | Video streaming and recording |
| Twilio | Phone dial-out (primary carrier) |
| Telnyx | Phone dial-out (secondary carrier) |
| OpenAI (GPT-4o / GPT-4o-mini) | AI analysis and generation |
| AWS S3 | Object storage |
| JSON Web Tokens | Session authentication |
| Express Rate Limiting | API protection |

### Dev & Build
| Technology | Purpose |
|-----------|---------|
| pnpm | Package manager (monorepo) |
| tsx | TypeScript execution (dev) |
| esbuild | Server bundling (prod) |
| Vitest | Unit testing |
| Drizzle Kit | Database migrations |
| Prettier / ESLint | Code formatting |

---

## 3. SERVER ARCHITECTURE

### Entry Point
`server/_core/index.ts` (1,081 lines)

### Startup Sequence
1. Express app created with `trust proxy`
2. Health check endpoint registered (`/health`)
3. **Recall webhook registered BEFORE body parsing** (critical — raw body required for signature verification)
4. Recording upload, audio transcribe, slide deck upload routes registered (multipart, before JSON parser)
5. `express.json()` middleware applied with 500MB limit
6. Rate limiters applied (`/api/trpc`, `/api/oauth`, `/api/auth`)
7. OAuth routes registered
8. Billing PDF routes registered
9. Webphone TwiML and Telnyx webhook endpoints registered
10. tRPC middleware mounted at `/api/trpc`
11. Database migrations run (ensure tables/columns exist)
12. Shadow Mode environment validated
13. Shadow Guardian watchdog started
14. Reminder scheduler started
15. Compliance digest scheduler started
16. Health Guardian started
17. Vite dev server (dev) or static files (prod) served
18. MetricsWebSocketServer attached
19. Server listens on PORT

### Request Flow
```
Client → HTTPS Proxy → Express
  → Rate Limiter
  → /api/trpc → tRPC Middleware → Context (auth) → Router → Procedure → DB
  → /api/recall/webhook → Raw body handler → Recall webhook processing
  → /api/webphone/twiml → TwiML voice response
  → Static files / Vite HMR
```

---

## 4. DATABASE SCHEMA OVERVIEW

**Total tables: 120+** defined in `drizzle/schema.ts` (3,413 lines)

### Table Categories

#### Core Platform (8 tables)
| Table | Purpose |
|-------|---------|
| `users` | User accounts (name, email, role, profile fields) |
| `events` | Event definitions (ID, title, company, platform, access code) |
| `attendee_registrations` | Event attendee registrations |
| `ir_contacts` | IR contact database |
| `direct_access_log` | Access code usage audit |
| `user_feedback` | User feedback submissions |
| `event_customisation` | Per-event UI customisation |
| `event_branding` | Per-event branding (colors, logos) |

#### OCC — Operator Conference Console (11 tables)
| Table | Purpose |
|-------|---------|
| `occ_conferences` | Conference instances |
| `occ_participants` | Conference participants (state machine) |
| `occ_lounge` | Pre-conference waiting lounge |
| `occ_operator_requests` | Operator action requests |
| `occ_operator_sessions` | Operator session tracking |
| `occ_chat_messages` | Conference chat |
| `occ_audio_files` | Audio file references |
| `occ_participant_history` | Participant state change audit |
| `occ_access_code_log` | Access code usage |
| `occ_dial_out_history` | Outbound dial history |
| `occ_green_rooms` | Pre-conference green rooms |

#### Roadshow & Investor (5 tables)
| Table | Purpose |
|-------|---------|
| `live_roadshows` | Roadshow definitions |
| `live_roadshow_meetings` | Individual roadshow meetings |
| `live_roadshow_investors` | Investor profiles for roadshows |
| `live_meeting_summaries` | AI meeting summaries |
| `commitment_signals` | Investor commitment tracking |

#### Webcasting (4 tables)
| Table | Purpose |
|-------|---------|
| `webcast_events` | Webcast event definitions |
| `webcast_registrations` | Attendee registrations |
| `webcast_qa` | Webcast Q&A items |
| `webcast_polls` | Live polls |

#### Media & Recording (4 tables)
| Table | Purpose |
|-------|---------|
| `recall_bots` | Recall.ai bot instances and transcript storage |
| `mux_streams` | Mux video stream definitions |
| `slide_thumbnails` | Slide deck thumbnails |
| `speaker_pace_results` | Speaking pace analysis |

#### Webphone (2 tables)
| Table | Purpose |
|-------|---------|
| `webphone_sessions` | Phone call sessions |
| `webphone_carrier_status` | Twilio/Telnyx carrier health |

#### Billing (12 tables)
| Table | Purpose |
|-------|---------|
| `billing_clients` | Client accounts |
| `billing_quotes` | Quote documents |
| `billing_line_items` | Quote/invoice line items |
| `billing_invoices` | Invoice documents |
| `billing_payments` | Payment records |
| `billing_client_contacts` | Client contact persons |
| `billing_quote_versions` | Quote version history |
| `billing_credit_notes` | Credit notes |
| `billing_fx_rates` | Foreign exchange rates |
| `billing_activity_log` | Billing audit trail |
| `billing_line_item_templates` | Reusable line item templates |
| `billing_recurring_templates` | Recurring billing templates |
| `billing_email_events` | Email delivery tracking |

#### Training Mode (6 tables)
| Table | Purpose |
|-------|---------|
| `training_mode_sessions` | Training session instances |
| `training_conferences` | Training conference setups |
| `training_participants` | Simulated participants |
| `training_lounge` | Training lounge state |
| `training_call_logs` | Training call history |
| `training_performance_metrics` | Operator performance scores |

#### Shadow Mode (4 tables)
| Table | Purpose |
|-------|---------|
| `shadow_sessions` | Shadow monitoring sessions |
| `operator_actions` | Operator action audit trail |
| `operator_corrections` | AI correction feedback loop |
| `adaptive_thresholds` | Self-adjusting AI thresholds |

#### Intelligence & Analytics (15+ tables)
| Table | Purpose |
|-------|---------|
| `tagged_metrics` | Intelligence-tagged metric records |
| `archive_events` | Archived events with AI reports |
| `crisis_predictions` | CIP4 crisis risk predictions |
| `valuation_impacts` | Valuation impact analyses |
| `disclosure_certificates` | Regulatory disclosure certificates |
| `monthly_reports` | Generated monthly reports |
| `advisory_chat_messages` | Advisory bot conversation history |
| `evolution_audit_log` | AI evolution audit trail |
| `capability_roadmap` | AI capability development tracking |
| `ai_evolution_observations` | AI self-improvement observations |
| `ai_tool_proposals` | AI-proposed tool/feature suggestions |
| `agentic_analyses` | Agentic brain analysis records |
| `autonomous_interventions` | Autonomous system interventions |
| `investor_briefing_packs` | Generated investor briefing packs |
| `post_event_data` | Post-event analysis data |
| `post_event_reports` | Generated post-event reports |

#### Compliance & Security (10 tables)
| Table | Purpose |
|-------|---------|
| `compliance_vocabulary` | Compliance keyword dictionary |
| `compliance_violations` | Detected compliance violations |
| `compliance_detection_stats` | Detection accuracy statistics |
| `ai_am_audit_log` | AI-AM monitoring audit trail |
| `alert_preferences` | Alert delivery preferences |
| `alert_history` | Alert delivery history |
| `soc2_controls` | SOC 2 control mappings |
| `iso27001_controls` | ISO 27001 control mappings |
| `compliance_evidence_files` | Compliance evidence documents |
| `compliance_threats` | Threat intelligence records |
| `compliance_framework_checks` | Framework compliance checks |

#### Partner Integrations (6 tables)
| Table | Purpose |
|-------|---------|
| `lumi_bookings` | Lumi partner bookings |
| `bastion_intelligence_sessions` | Bastion partner intelligence sessions |
| `bastion_investor_observations` | Bastion investor behavior observations |
| `bastion_guidance_tracker` | Forward guidance tracking |
| `bastion_bookings` | Bastion partner bookings |
| `conference_dialouts` | Conference dial-out records |
| `conference_dialout_participants` | Dial-out participant tracking |

#### AGM Governance (4 tables)
| Table | Purpose |
|-------|---------|
| `agm_resolutions` | AGM resolution tracking |
| `agm_intelligence_sessions` | AGM intelligence session records |
| `agm_dissent_patterns` | Shareholder dissent analysis |
| `agm_governance_observations` | Governance behavior observations |

#### Live Q&A (5 tables)
| Table | Purpose |
|-------|---------|
| `live_qa_sessions` | Q&A session instances |
| `live_qa_questions` | Submitted questions with triage data |
| `live_qa_answers` | Question answers (manual + AI draft) |
| `live_qa_compliance_flags` | Question compliance flags |
| `live_qa_platform_shares` | Q&A platform sharing records |

#### Other (10+ tables)
| Table | Purpose |
|-------|---------|
| `polls` | Live poll definitions |
| `poll_options` | Poll answer options |
| `poll_votes` | Vote records |
| `event_schedules` | Event scheduling |
| `operator_availability` | Operator availability calendar |
| `transcription_jobs` | Async transcription job tracking |
| `sustainability_reports` | ESG/sustainability analysis |
| `broadcast_sessions` | Intelligent broadcaster sessions |
| `studio_sessions` | Virtual studio sessions |
| `esg_studio_flags` | ESG topic flagging |
| `studio_interconnections` | Cross-event connections |
| `operator_link_analytics` | Operator link click tracking |
| `operator_links_metadata` | Operator link metadata |
| `stripe_customers` | Stripe customer records |
| `stripe_subscriptions` | Stripe subscriptions |
| `premium_features` | Feature gating |
| `stripe_payment_events` | Payment webhook events |
| `mailing_lists` | Mailing list definitions |
| `mailing_list_entries` | Mailing list subscribers |
| `crm_api_keys` | CRM integration API keys |

---

## 5. tRPC ROUTER REGISTRY

**93 registered routers** in `server/routers.eager.ts`


```
Router Key              → Source File                           → Category
─────────────────────── ─ ─────────────────────────────────── ─ ──────────────
system                  → systemRouter                         → Core
occ                     → occRouter                            → Conference
liveVideo               → liveVideoRouter                      → Video
roadshowAI              → roadshowAIRouter                     → Roadshow
branding                → brandingRouter                       → Customisation
webcast                 → webcastRouter                        → Webcasting
recall                  → recallRouter                         → Integration
mux                     → muxRouter                            → Video
billing                 → billingRouter                        → Billing
ai                      → aiRouter                             → AI
webphone                → webphoneRouter                       → Phone
customisation           → customisationRouter                  → Customisation
trainingMode            → trainingModeRouter                   → Training
postEventReport         → postEventReportRouter                → Reports
transcription           → transcriptionRouter                  → Transcription
polls                   → pollsRouter                          → Engagement
scheduling              → schedulingRouter                     → Operations
clientPortal            → clientPortalRouter                   → Client
compliance              → complianceRouter                     → Compliance
followups               → followupsRouter                      → Engagement
sentiment               → sentimentRouter                      → AI
mobileNotifications     → mobileNotificationsRouter            → Notifications
aiDashboard             → aiDashboardRouter                    → AI
aiFeatures              → aiFeaturesRouter                     → AI
analytics               → analyticsRouter                      → Analytics
contentTriggers         → contentTriggersRouter                → Content
eventBrief              → eventBriefRouter                     → Intelligence
liveRollingSummary      → liveRollingSummaryRouter             → Live
transcriptEditor        → transcriptEditorRouter               → Transcription
aiApplications          → aiApplicationsRouter                 → AI
socialMedia             → socialMediaRouter                    → Social
interconnectionAnalytics → interconnectionAnalyticsRouter      → Analytics
virtualStudio           → virtualStudioRouter                  → Studio
operatorLinks           → operatorLinksRouter                  → Operations
agenticBrain            → agenticEventBrainRouter              → AI
autonomousIntervention  → autonomousInterventionRouter         → AI
taggedMetrics           → taggedMetricsRouter                  → Intelligence
shadowMode              → shadowModeRouter                     → Shadow Mode
archiveUpload           → archiveUploadRouter                  → Archive
benchmarks              → benchmarksRouter                     → Analytics
marketReaction          → marketReactionRouter                 → Intelligence
communicationIndex      → communicationIndexRouter             → Intelligence
investorQuestions       → investorQuestionsRouter              → Intelligence
intelligenceReport      → intelligenceReportRouter             → Intelligence
callPrep                → callPrepRouter                       → Operations
intelligenceTerminal    → intelligenceTerminalRouter           → Intelligence
bot                     → botRouter                            → Integration
mailingList             → mailingListRouter                    → CRM
healthGuardian          → healthGuardianRouter                 → Operations
crmApi                  → crmApiRouter                         → CRM
supportChat             → supportChatRouter                    → Support
soc2                    → soc2Router                           → Compliance
iso27001                → iso27001Router                       → Compliance
adaptiveIntelligence    → adaptiveIntelligenceRouter           → AI
sustainability          → sustainabilityRouter                 → ESG
broadcaster             → broadcasterRouter                    → Studio
conferenceDialout       → conferenceDialoutRouter              → Phone
agmGovernance           → agmGovernanceRouter                  → Governance
lumiBooking             → lumiBookingRouter                    → Partner
bastionBooking          → bastionBookingRouter                 → Partner
evasiveAnswer           → evasiveAnswerRouter                  → AI
marketImpactPredictor   → marketImpactPredictorRouter          → Intelligence
multiModalCompliance    → multiModalComplianceRouter           → Compliance
externalSentiment       → externalSentimentRouter              → Intelligence
personalizedBriefing    → personalizedBriefingRouter           → Intelligence
materialityRisk         → materialityRiskRouter                → Intelligence
investorIntent          → investorIntentRouter                 → Intelligence
crossEventConsistency   → crossEventConsistencyRouter          → Intelligence
volatilitySimulator     → volatilitySimulatorRouter            → Intelligence
regulatoryIntervention  → regulatoryInterventionRouter         → Compliance
eventIntegrity          → eventIntegrityRouter                 → Intelligence
crisisPrediction        → crisisPredictionRouter               → CIP4
valuationImpact         → valuationImpactRouter                → CIP4
disclosureCertificate   → disclosureCertificateRouter          → CIP4
monthlyReport           → monthlyReportRouter                  → CIP4
advisoryBot             → advisoryBotRouter                    → AI
evolutionAudit          → evolutionAuditRouter                 → AI
systemDiagnostics       → systemDiagnosticsRouter              → Operations
liveQa                  → liveQaRouter                         → Q&A
platformEmbed           → platformEmbedRouter                  → Integration
investorEngagement      → investorEngagementRouter             → Intelligence
liveSubtitle            → liveSubtitleRouter                   → Accessibility
ipoMandA                → ipoMandARouter                       → Intelligence
complianceEngine        → complianceEngineRouter               → Compliance
aiAm                    → aiAmRouter                           → AI-AM
rbac                    → rbacRouter                           → Auth
aiEvolution             → aiEvolutionRouter                    → AI
persistence             → persistenceRouter                    → Core
aiAmPhase2              → aiAmPhase2Router                     → AI-AM
restBridge              → restBridgeRouter                     → Integration
session                 → sessionRouter                        → Auth
archive                 → archiveRouter                        → Archive
admin                   → (inline)                             → Admin
team                    → (inline)                             → Admin
auth                    → (inline)                             → Auth
profile                 → (inline)                             → Auth
ably                    → (inline)                             → Real-time
events                  → (inline)                             → Core
```

---

## 6. AUTHENTICATION & AUTHORIZATION

### Auth Flow
- OAuth-based authentication (OpenID Connect)
- JWT session tokens stored in HTTP-only cookies
- Cookie name: defined in `@shared/const` as `COOKIE_NAME`

### Procedure Types
| Procedure | Access Level | Dev Mode Behavior |
|-----------|-------------|-------------------|
| `publicProcedure` | Anyone | Same |
| `protectedProcedure` | Authenticated users | Auto-auth |
| `operatorProcedure` | Operators + admins | Auto-auth as "Dev Operator" |
| `adminProcedure` | Admins only | Auto-auth |

### User Roles
```typescript
type Role = "user" | "admin" | "operator";
```

### DEV_BYPASS
In development (`NODE_ENV !== 'production'`), `auth.me` returns:
```typescript
{ id: 0, name: "Dev Operator", email: "dev@curalive.local", role: "operator" }
```

---

## 7. REAL-TIME INFRASTRUCTURE

### Ably Pub/Sub
- **Channel naming:** `curalive-event-*` (general), `shadow-{id}-{ts}` (shadow mode), `curalive-qa-{id}` (live Q&A)
- **Token generation:** Server-side HMAC-SHA256 signed token requests
- **Capabilities:** subscribe, publish, presence, history
- **Client hook:** `useAblyChannel.ts`, `useAblySessions.ts`

### WebSocket
- **MetricsWebSocketServer** — real-time metrics streaming
- **metricsWebsocket.ts** — WebSocket server attached to HTTP server

### Polling Fallback
All real-time features fall back to tRPC query polling with `refetchInterval` when WebSocket/Ably connections fail.

---

# PART II — CORE PRODUCT MODULES

---

## 8. OPERATOR CONFERENCE CONSOLE (OCC)

**Router:** `occ` (1,224 lines) | **Page:** `OCC.tsx` (5,101 lines)

The OCC is CuraLive's flagship product — a real-time conference management console for operators running corporate events. Think of it as air traffic control for investor conference calls.

### Core Features
- **Participant Management** — real-time state machine (free → incoming → connected → speaking → muted → parked → dropped)
- **Conference Control** — mute/unmute, park/unpark, dial-out, transfer
- **Green Rooms** — pre-conference holding areas for speakers
- **Chat System** — operator ↔ participant messaging
- **Live Transcription** — real-time transcript via Recall.ai or browser
- **Sentiment Analysis** — live sentiment scoring of call participants
- **Compliance Monitoring** — real-time keyword flagging
- **Audio Recording** — conference recording with playback
- **Operator Session Tracking** — who handled what, audit trail
- **Access Code Management** — PIN-based event access

### Participant State Machine
```
free → incoming → connected ↔ muted
                           ↔ parked
                           → speaking → speaking_ended
                           → dropped
                           → moved_to_subconference → returned_from_subconference
```

### Sub-Components
- `OccRealtimeUpdates` — Ably-powered real-time state sync
- `ParticipantStatusDashboard` — participant state overview
- `MutingControlPanel` — bulk muting controls
- `ComplianceMonitor` — live compliance alert feed

---

## 9. SHADOW MODE (LIVE EVENT INTELLIGENCE)

**Router:** `shadowMode` (1,386 lines) | **Page:** `ShadowMode.tsx` (4,221 lines)

Shadow Mode is CuraLive's silent monitoring dashboard. An operator creates a session, and CuraLive either deploys a Recall.ai bot or captures audio locally. During the event, AI transcribes, analyzes sentiment, flags compliance, and streams intelligence in real-time. Post-session, a full AI report is generated.

### 8 Tabs
- **Live** — session creation, live transcript, local audio capture
- **Archive** — completed sessions with bulk operations
- **Reports** — AI report viewer (executive summary, sentiment, compliance, topics, risks)
- **AI Learning** — operator corrections feeding self-improving AI
- **AI Dashboard** — CIP4 analytics (crisis, valuation, disclosure, evolution)
- **Advisory** — AI advisory chat
- **Console** — system diagnostics (15 health checks)
- **Live Q&A** — audience question management with AI triage

### Session Lifecycle
```
pending → bot_joining → live → processing → completed/failed
pending → live (local audio, no bot step)
```

### Key Features
- Recall.ai bot deploy with retry logic (3 attempts)
- Local Audio Capture for unsupported platforms (choruscall, other)
- Real-time Ably streaming of transcript segments
- Auto-generated AI reports on session end
- Tagged metrics generation (sentiment, engagement, compliance, intervention)
- AGM governance auto-detection
- Operator notes, action logging, handoff packages
- Export (CSV, JSON, PDF)
- Shadow Guardian watchdog service

*(Full Shadow Mode brief available in separate document)*

---

## 10. ARCHIVE & AI REPORTS

**Router:** `archiveUpload` (1,511 lines) | **Page:** `ArchiveUpload.tsx` (650 lines)

### Archive Upload
Operators upload pre-recorded event transcripts for AI analysis. Supports:
- Text transcript paste
- Audio file upload with transcription
- Slide deck upload for visual analysis

### AI Report Generation (`generateFullAiReport`)
Every event (live or archived) gets a comprehensive AI report:

| Module | Content |
|--------|---------|
| Executive Summary | 2-3 paragraph narrative |
| Sentiment Analysis | Score/100 + trajectory + narrative |
| Compliance Review | Risk level + flagged phrases + recommendations |
| Key Topics | Topic extraction with relevance scores |
| Risk Factors | Risk identification and assessment |
| Action Items | Follow-up commitments extracted |
| Speaker Analysis | Per-speaker sentiment and contribution |
| Forward-Looking Statements | Guidance and forecast extraction |
| Regulatory Highlights | JSE/regulatory compliance items |

### CIP4 Pipeline (triggered after every report)
1. Meta-Observer (AI Evolution)
2. Crisis Prediction
3. Disclosure Certificate
4. Valuation Impact Analysis
5. Accumulation Engine (cross-event learning)

---

## 11. WEBCASTING PLATFORM

**Router:** `webcast` (1,140 lines) | **Pages:** `WebcastStudio.tsx`, `WebcastingHub.tsx`, `WebcastRegister.tsx`

Full-featured corporate webcasting platform:

### Features
- **Event Creation** — title, description, schedule, branding, registration form
- **Registration** — public registration with confirmation emails
- **Studio** — presenter view with slide management, Q&A, polls
- **Attendee Room** — branded viewing experience with engagement tools
- **Q&A Management** — moderated Q&A with approval workflow
- **Live Polls** — real-time polling with results display
- **On-Demand** — automatic replay generation after live event
- **Analytics** — attendance, engagement, drop-off metrics

### Webcast Statuses
```
draft → scheduled → live → ended → on_demand / cancelled
```

---

## 12. WEBPHONE SYSTEM

**Router:** `webphone` (988 lines) | **Component:** `Webphone.tsx` (1,215 lines)

Browser-based phone system for conference operators:

### Features
- **Dual Carrier** — Twilio (primary) + Telnyx (secondary) with automatic failover
- **Inbound/Outbound** — receive and make calls from the browser
- **Conference Bridge** — connect calls to conference rooms
- **Call Controls** — mute, hold, transfer, park
- **TwiML/TeXML** — voice response generation for both carriers
- **Carrier Health** — real-time carrier status monitoring
- **Call History** — full call log with duration and status

### WebRTC Components
- `WebPhoneCallManager.tsx` — call management UI
- `WebPhoneJoinInstructions.tsx` — dial-in instructions
- `Webphone.tsx` — full phone interface

---

## 13. LIVE VIDEO MEETINGS

**Router:** `liveVideo` (673 lines) | **Page:** `LiveVideoMeetings.tsx`

Mux-powered live video meeting infrastructure:
- Stream creation and management
- Recording and playback
- Participant tracking
- Meeting summaries

---

## 14. ROADSHOW AI

**Router:** `roadshowAI` (798 lines) | **Pages:** `RoadshowDetail.tsx`, `RoadshowOrderBook.tsx`

Capital raising and investor roadshow management:
- **Meeting Scheduling** — 1x1, group, large group meetings
- **Investor Profiles** — track investor interest, commitment signals
- **Order Book** — capital raising order management
- **AI Summaries** — automated meeting summaries
- **Commitment Signals** — detect soft commits, interest, objections
- **Briefing Packs** — auto-generated investor briefing documents
- **Waiting Room** — investor waiting room management

---

## 15. LIVE Q&A SYSTEM

**Router:** `liveQa` (892 lines) | **Component:** `LiveQaDashboard.tsx` (1,224 lines)

AI-powered audience Q&A management:
- Public access via 8-character session code
- AI triage on every question (category, priority, compliance risk)
- Duplicate detection (Jaccard similarity ≥ 0.55)
- Operator approval workflow (approve/reject/hold/flag/send-to-speaker)
- AI draft answer generation
- Legal review flagging
- Compliance flag management
- Real-time updates via Ably
- Attendee upvoting with rate limiting
- Team broadcast and IR chat
- QR code for attendee access

---

## 16. BILLING & INVOICING

**Router:** `billing` (889 lines) + `billingRouter` (1,058 lines) | **Pages:** `Billing.tsx`, `AdminBilling.tsx`, `QuoteBuilder.tsx`, `InvoiceViewer.tsx`

Full quote-to-cash lifecycle:
- **Client Management** — client accounts, contacts, credit terms
- **Quote Builder** — line items, templates, versioning, multi-currency
- **Invoice Generation** — from quotes, with tax calculation
- **Payment Tracking** — record payments, partial payments, allocations
- **Credit Notes** — issue credits against invoices
- **Recurring Templates** — automated recurring billing
- **FX Rates** — multi-currency support (ZAR, USD, EUR, GBP)
- **PDF Generation** — invoice and quote PDFs
- **Email Delivery** — automated invoice/quote delivery with tracking
- **Ageing Report** — outstanding balance analysis
- **Activity Log** — full audit trail

---

## 17. TRAINING MODE

**Router:** `trainingMode` (229 lines) | **Page:** `Training.tsx` (1,318 lines)

Operator training environment:
- **Simulated Conferences** — practice managing calls with AI participants
- **Performance Metrics** — scored on response time, accuracy, professionalism
- **Call Scenarios** — various event types and difficulty levels
- **Training Sessions** — tracked progress and completion
- **Lounge Simulation** — practice managing waiting participants

---

# PART III — INTELLIGENCE & AI SYSTEMS

---

## 18. CIP4 INTELLIGENCE SUITE

CIP4 (CuraLive Intelligence Pipeline v4) is the umbrella for all AI analytics:

### Routers
| Router | Lines | Purpose |
|--------|-------|---------|
| `crisisPrediction` | ~200 | Crisis risk prediction engine |
| `valuationImpact` | ~200 | Financial valuation impact analysis |
| `disclosureCertificate` | ~200 | Regulatory disclosure certification |
| `monthlyReport` | ~200 | Monthly intelligence reports |
| `advisoryBot` | ~200 | AI advisory chatbot |
| `evolutionAudit` | ~200 | AI evolution audit trail |

### Intelligence Dashboard
`AIDashboard.tsx` (1,189 lines) — tabbed analytics view:
- Crisis predictions with risk scores
- Valuation impact analyses
- Disclosure certificates
- Evolution audit entries
- Monthly report summaries
- Cross-event intelligence

---

## 19. AI-AM (AUTOMATED MONITORING)

**Routers:** `aiAm` (350 lines) + `aiAmPhase2` | **Webhook:** `aiAmRecall.ts` (286 lines)

Real-time compliance monitoring during live events:
- Transcript segment analysis for violations
- Violation type detection (forward-looking, insider, material)
- Severity scoring (high/medium/low)
- Deduplication (prevent duplicate alerts)
- Auto-muting thresholds
- Notification dispatch (email, Ably, in-app)
- Audit trail
- Report generation

### AI-AM Core Services
| Service | Purpose |
|---------|---------|
| `aiAmAblyChannels.ts` | Real-time alert publishing |
| `aiAmAuditTrail.ts` | Compliance audit logging |
| `aiAmAutoMuting.ts` | Automatic speaker muting on violations |
| `aiAmDeduplication.ts` | Alert deduplication logic |
| `aiAmFiltering.ts` | Alert filtering and prioritization |
| `aiAmNotificationDispatch.ts` | Multi-channel alert delivery |
| `aiAmReportGenerator.ts` | Post-event compliance report |

---

## 20. AI EVOLUTION & SELF-IMPROVEMENT

**Router:** `aiEvolution` | **Service:** `AiEvolutionService.ts` (913 lines)

AI self-improvement pipeline:
- **Meta-Observer** — watches AI report quality and identifies patterns
- **Accumulation Engine** — aggregates insights across events for learning
- **Operator Corrections** — feedback loop where operators correct AI outputs
- **Adaptive Thresholds** — thresholds that automatically adjust based on corrections
- **Capability Roadmap** — tracks proposed AI capability improvements
- **Tool Proposals** — AI suggests new tools and features

---

## 21-42. ADDITIONAL INTELLIGENCE MODULES

Each of these is a dedicated router + service:

| # | Module | Router | Service | Purpose |
|---|--------|--------|---------|---------|
| 21 | Compliance Engine | `complianceEngine` | `ComplianceEngineService.ts` (525L) | Multi-framework compliance monitoring |
| 22 | Crisis Prediction | `crisisPrediction` | — | Predict crisis risk from event data |
| 23 | Valuation Impact | `valuationImpact` | — | Analyze financial impact of statements |
| 24 | Disclosure Certificates | `disclosureCertificate` | — | Generate regulatory disclosure certs |
| 25 | Market Reaction | `marketReaction` (344L) | — | Predict market reaction to events |
| 26 | Communication Index | `communicationIndex` (329L) | — | Score communication effectiveness |
| 27 | Investor Questions | `investorQuestions` | — | Intelligence on investor question patterns |
| 28 | Intelligence Terminal | `intelligenceTerminal` | — | Command-line style intelligence query |
| 29 | Intelligence Reports | `intelligenceReport` | — | Generate comprehensive intelligence reports |
| 30 | External Sentiment | `externalSentiment` | `ExternalSentimentService.ts` | Social/news sentiment analysis |
| 31 | Market Impact Predictor | `marketImpactPredictor` | `MarketImpactPredictorService.ts` | Pre-event market impact forecasting |
| 32 | Materiality Risk Oracle | `materialityRisk` | `MaterialityRiskOracleService.ts` | Material risk identification |
| 33 | Investor Intent Decoder | `investorIntent` | `InvestorIntentionDecoderService.ts` | Decode investor behavior signals |
| 34 | Investor Engagement | `investorEngagement` | `InvestorEngagementScoringService.ts` (504L) | Score investor engagement levels |
| 35 | Cross-Event Consistency | `crossEventConsistency` | `CrossEventConsistencyService.ts` | Verify message consistency across events |
| 36 | Volatility Simulator | `volatilitySimulator` | `VolatilitySimulatorService.ts` | Simulate stock price volatility scenarios |
| 37 | Regulatory Intervention | `regulatoryIntervention` | `RegulatoryInterventionService.ts` | Flag potential regulatory issues |
| 38 | Event Integrity Twin | `eventIntegrity` | `EventIntegrityTwinService.ts` | Digital twin for event integrity verification |
| 39 | Evasive Answer Detection | `evasiveAnswer` | `EvasiveAnswerDetectionService.ts` | Detect evasive management responses |
| 40 | Adaptive Intelligence | `adaptiveIntelligence` (285L) | — | Self-adjusting AI models |
| 41 | IPO & M&A Intelligence | `ipoMandA` | `IpoMandAIntelligenceService.ts` (834L) | IPO/M&A deal intelligence |
| 42 | Sustainability | `sustainability` | `SustainabilityOptimizer.ts` | ESG and sustainability analytics |

---

# PART IV — OPERATIONAL SYSTEMS

---

## 43. AGM GOVERNANCE AI

**Router:** `agmGovernance` | **Service:** `AgmGovernanceAiService.ts` (935 lines) | **Page:** `AgmGovernanceAi.tsx` (849 lines)

Specialized AGM intelligence:
- **Resolution Tracking** — monitor voting on resolutions
- **Governance Question Triage** — AI classification of shareholder questions
- **Regulatory Compliance Scan** — JSE Listings Requirements, Companies Act
- **Dissent Pattern Detection** — identify shareholder dissent trends
- **Governance Observations** — behavioral analysis of meeting dynamics

---

## 44. BASTION PARTNER INTELLIGENCE

**Router:** `bastionBooking` | **Service:** `BastionInvestorAiService.ts` (729L), `BastionBookingService.ts` (476L)

Bastion Investor Communications partner integration:
- Partner booking management
- Investor observation tracking
- Forward guidance monitoring
- Intelligence session management

---

## 45. LUMI PARTNER BOOKING

**Router:** `lumiBooking` | **Service:** `LumiBookingService.ts` (486L)

Lumi Global partner integration for AGM management:
- Booking creation and management
- Event coordination
- Billing integration

---

## 46-56. ADDITIONAL OPERATIONAL MODULES

| # | Module | Router | Lines | Purpose |
|---|--------|--------|-------|---------|
| 46 | Conference Dial-Out | `conferenceDialout` | — | Twilio-powered participant dial-out |
| 47 | Call Preparation | `callPrep` (240L) | — | Pre-event call preparation packs |
| 48 | Event Brief Generator | `eventBrief` | `EventBriefGeneratorService.ts` (427L) | Auto-generated event briefings |
| 49 | Live Rolling Summary | `liveRollingSummary` | `LiveRollingSummaryService.ts` (307L) | Real-time event summary updates |
| 50 | Live Subtitles | `liveSubtitle` | `LiveSubtitleTranslationService.ts` (428L) | Real-time subtitle translation |
| 51 | Transcript Editor | `transcriptEditor` (238L) | `TranscriptEditorService.ts` (491L) | Post-event transcript editing |
| 52 | Content Triggers | `contentTriggers` | `ContentGenerationTriggerService.ts` (306L) | Auto-trigger content generation |
| 53 | Social Media | `socialMedia` (256L) | `SocialMediaService.ts` | Social media post creation & scheduling |
| 54 | Mailing Lists | `mailingList` (669L) | — | Event mailing list management |
| 55 | CRM API | `crmApi` (478L) | — | External CRM integration endpoints |
| 56 | Personalized Briefing | `personalizedBriefing` | `PersonalizedBriefingService.ts` | Per-investor personalized briefings |

---

# PART V — PLATFORM INFRASTRUCTURE

---

## 57-80. INFRASTRUCTURE MODULES

| # | Module | Router/Service | Purpose |
|---|--------|---------------|---------|
| 57 | Virtual Studio | `virtualStudio` (300L) / `VirtualStudioService.ts` | Virtual production studio |
| 58 | Intelligent Broadcaster | `broadcaster` (239L) | AI-powered broadcasting |
| 59 | Agentic Event Brain | `agenticBrain` (221L) | Autonomous event management AI |
| 60 | Autonomous Intervention | `autonomousIntervention` (232L) | Auto-triggered interventions |
| 61 | Platform Embed | `platformEmbed` / `PlatformEmbedService.ts` | Embeddable widget generation |
| 62 | Operator Links | `operatorLinks` | Shareable operator links |
| 63 | Benchmarks | `benchmarks` | Industry benchmarking |
| 64 | Tagged Metrics | `taggedMetrics` | Intelligence metric management |
| 65 | Support Chat | `supportChat` | In-platform support |
| 66 | Advisory Bot | `advisoryBot` | AI advisory chatbot |
| 67 | Monthly Reports | `monthlyReport` | Automated monthly reports |
| 68 | Health Guardian | `healthGuardian` / `HealthGuardianService.ts` (543L) | Platform health monitoring |
| 69 | System Diagnostics | `systemDiagnostics` (155L) | 15-test health check |
| 70 | SOC 2 Compliance | `soc2` (271L) | SOC 2 control tracking |
| 71 | ISO 27001 | `iso27001` (311L) | ISO 27001 control tracking |
| 72 | RBAC | `rbac` | Role-based access control |
| 73 | Branding | `branding` | Event branding (colors, logos) |
| 74 | Scheduling | `scheduling` (233L) | Event scheduling |
| 75 | Polls | `polls` | Live polling system |
| 76 | Mobile Notifications | `mobileNotifications` | Push notification management |
| 77 | Client Portal | `clientPortal` | Client-facing portal |
| 78 | Mux Streaming | `mux` (395L) | Mux video management |
| 79 | Recall.ai | `recall` (282L) | Recall bot management |
| 80 | Post-Event Reports | `postEventReport` | Automated post-event reports |

---

# PART VI — DESIGN SYSTEM

---

## 81. DESIGN TOKENS & THEME

### Dark Theme
CuraLive uses a dark theme with slate/violet/emerald palette across all pages.

### Color Tokens
| Token | Tailwind | Usage |
|-------|----------|-------|
| Background | `bg-[#0a0a0f]` or `bg-slate-950` | Page background |
| Card | `bg-white/[0.02]` | Card backgrounds |
| Card hover | `bg-white/[0.04]` | Hover state |
| Card selected | `bg-violet-500/10` | Selected state |
| Border | `border-white/10` | Default borders |
| Border selected | `border-violet-500/50` | Selected borders |
| Primary text | `text-slate-200` | Main content |
| Secondary text | `text-slate-500` | Labels, metadata |
| Muted text | `text-slate-600` | Timestamps, hints |

### Accent Colors
| Color | Token | Usage |
|-------|-------|-------|
| Violet | `violet-400/500` | Primary accent, completed status |
| Emerald | `emerald-400/500` | Success, live status, positive |
| Amber | `amber-400/500` | Warning, bot_joining, caution |
| Red | `red-400/500` | Error, failed, critical |
| Blue | `blue-400/500` | Processing, info |
| Indigo | `indigo-400/500` | Diagnostics, secondary accent |
| Slate | `slate-400` | Pending, neutral |

### Button Patterns
```
Primary:  bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/20
Danger:   bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20
Success:  bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20
Neutral:  bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10
```

### Component Library
- shadcn/ui (Radix) for base components (Button, Dialog, Accordion, etc.)
- Custom dark-themed cards with `rounded-2xl` corners
- Lucide React for all iconography

---

# PART VII — ENVIRONMENT & CONFIGURATION

---

## 84. ENVIRONMENT VARIABLES

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | JWT signing |
| `ABLY_API_KEY` | Yes | Real-time pub/sub |
| `RECALL_AI_API_KEY` | Yes* | Recall.ai bot deployment |
| `RECALL_AI_BASE_URL` | No | Recall API region (default: eu-central-1) |
| `RECALL_AI_WEBHOOK_SECRET` | No | Webhook signature verification |
| `RECALL_WEBHOOK_BASE_URL` | No | Override webhook callback URL |
| `MUX_WEBHOOK_SECRET` | No | Mux webhook verification |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Yes | S3 storage bucket |
| `PRIVATE_OBJECT_DIR` | Yes | Private storage directory |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Yes | Public storage paths |

*Required for Recall.ai-supported platforms (Zoom, Teams, Meet, Webex)

---

## 85. DEPLOYMENT ARCHITECTURE

```
                    ┌─────────────────┐
                    │   CDN / Proxy   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Express Server │
                    │   (Node.js)     │
                    ├─────────────────┤
                    │ tRPC Middleware  │
                    │ Static Assets   │
                    │ Webhook Routes  │
                    │ WebSocket       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
     │  PostgreSQL   │ │  Ably   │ │   Recall.ai  │
     │  (Drizzle)    │ │ Pub/Sub │ │   Bot API    │
     └───────────────┘ └─────────┘ └──────────────┘
              │                           │
     ┌────────▼──────┐           ┌────────▼──────┐
     │   AWS S3      │           │   Mux Video   │
     │   Storage     │           │   Streaming   │
     └───────────────┘           └───────────────┘
```

### Build Pipeline
```
Dev:   tsx watch server/_core/index.ts (hot reload)
Build: vite build (frontend) + esbuild (server bundle)
Prod:  node dist/index.js
```

---

## 86. KEY GOTCHAS

1. **Router dual registration** — routers must appear in BOTH `routers.eager.ts` AND `routers.ts`
2. **Recall webhook before JSON parser** — `registerRecallWebhookRoute(app)` MUST come before `express.json()`
3. **connectionQuality enum** — only `"excellent" | "good" | "fair" | "poor"` (never `"degraded"`)
4. **SQL placeholder styles** — `rawSql()` uses `?`; direct `db.execute()` uses `$1`
5. **DEV_BYPASS** — all auth auto-passes in development mode
6. **Ably channel uniqueness** — shadow channels include timestamp: `shadow-{id}-{ts}`
7. **Notes as JSON** — operator notes stored as JSON array in text column, not separate table
8. **AI reports in archive_events** — stored in `ai_report` column keyed by `event_id`
9. **AGM auto-creation** — AGM event type triggers automatic `agm_intelligence_sessions` record
10. **Fire-and-forget AI** — `autoGenerateAiReport()` runs with `.catch()`, doesn't block response
11. **Schema size** — 3,413 lines, 120+ tables. Use `db:push` for migrations, never manual SQL
12. **Rate limiting** — `/api/trpc` (100/15min general), `/api/oauth` + `/api/auth` (20/15min)
13. **Max body size** — 500MB (`express.json({ limit: "500mb" })`)
14. **Dual carrier webphone** — Twilio primary, Telnyx fallback. Both have separate TwiML/TeXML endpoints

---

## BACKEND SERVICES INVENTORY (58 services)

| Service | Lines | Purpose |
|---------|-------|---------|
| `AgmGovernanceAiService.ts` | 935 | AGM governance intelligence |
| `AiEvolutionService.ts` | 913 | AI self-improvement pipeline |
| `IpoMandAIntelligenceService.ts` | 834 | IPO/M&A deal intelligence |
| `PredictiveEventIntelligenceService.ts` | 767 | Predictive event analysis |
| `OrganizationalKnowledgeGraphService.ts` | 742 | Knowledge graph management |
| `BastionInvestorAiService.ts` | 729 | Bastion investor AI |
| `HealthGuardianService.ts` | 543 | Platform health monitoring |
| `ComplianceEngineService.ts` | 525 | Compliance framework engine |
| `InvestorEngagementScoringService.ts` | 504 | Investor engagement scoring |
| `TranscriptEditorService.ts` | 491 | Transcript editing AI |
| `AeosQuoteToCashService.ts` | 487 | Quote-to-cash automation |
| `LumiBookingService.ts` | 486 | Lumi partner bookings |
| `BastionBookingService.ts` | 476 | Bastion partner bookings |
| `ContentPerformanceAnalyticsService.ts` | 470 | Content performance metrics |
| `AblyRealtimeService.ts` | 458 | Ably real-time management |
| `LiveSubtitleTranslationService.ts` | 428 | Live subtitle translation |
| `EventBriefGeneratorService.ts` | 427 | Event briefing generation |
| `RealtimeCollaborationService.ts` | 405 | Real-time collaboration |
| `SentimentAnalysisService.ts` | 402 | Sentiment analysis |
| `ConferenceDialoutService.ts` | 402 | Phone dial-out management |
| `ToxicityFilterService.ts` | 382 | Content toxicity filtering |
| `RedactionWorkflowService.ts` | 369 | Transcript redaction |
| `QaAutoTriageService.ts` | 367 | Q&A auto-triage |
| `AeosSemanticApiService.ts` | 357 | Semantic API queries |
| `SpeakingPaceCoachService.ts` | 354 | Speaker pace coaching |
| `TranscriptionService.ts` | 337 | Transcription pipeline |
| `WebcastArchiveAiService.ts` | 330 | Webcast archive analysis |
| `LiveRollingSummaryService.ts` | 307 | Live summary generation |
| `ContentGenerationTriggerService.ts` | 306 | Content trigger management |
| `MaterialityRiskOracleService.ts` | — | Material risk assessment |
| `MarketImpactPredictorService.ts` | — | Market impact prediction |
| `InvestorIntentionDecoderService.ts` | — | Investor intent analysis |
| `CrossEventConsistencyService.ts` | — | Cross-event message consistency |
| `VolatilitySimulatorService.ts` | — | Stock volatility simulation |
| `RegulatoryInterventionService.ts` | — | Regulatory issue flagging |
| `EventIntegrityTwinService.ts` | — | Digital twin verification |
| `EvasiveAnswerDetectionService.ts` | — | Evasive answer detection |
| `MultiModalComplianceService.ts` | — | Multi-modal compliance |
| `ExternalSentimentService.ts` | — | External sentiment feeds |
| `PersonalizedBriefingService.ts` | — | Personalized briefings |
| `ShadowModeGuardianService.ts` | 153 | Shadow session watchdog |
| `LiveQaTriageService.ts` | — | Q&A AI triage |
| `ComplianceModerator.ts` | — | Compliance moderation |
| `AudioEnhancer.ts` | — | Audio enhancement |
| `LanguageDubber.ts` | — | Language dubbing |
| `PersonalizationEngine.ts` | — | Content personalization |
| `PlatformEmbedService.ts` | — | Embed widget management |
| `PodcastConverterService.ts` | — | Event-to-podcast conversion |
| `SocialMediaService.ts` | — | Social media management |
| `SustainabilityOptimizer.ts` | — | ESG optimization |
| `TranscriptSyncService.ts` | — | Transcript synchronization |
| `VirtualStudioService.ts` | — | Virtual studio management |
| `WebcastRecapService.ts` | — | Webcast recap generation |
| `AgiComplianceService.ts` | — | AGI compliance |
| `AgiToolGeneratorService.ts` | — | AI tool auto-generation |
| `AeosSovereignDataService.ts` | — | Data sovereignty |
| `EventEchoPipeline.ts` | — | Event echo analysis |
| `KnowledgeRetrievalService.ts` | — | Knowledge base retrieval |

---

## FRONTEND PAGE COUNT SUMMARY

| Category | Page Count | Total Lines |
|----------|-----------|-------------|
| Security & Compliance dashboards | ~30 | ~15,000 |
| Intelligence & Analytics pages | ~20 | ~12,000 |
| Operator tools (OCC, Shadow, Hub) | ~15 | ~15,000 |
| Webcasting & Studio | ~8 | ~5,000 |
| Billing & Admin | ~8 | ~5,000 |
| Training & Onboarding | ~5 | ~3,500 |
| Event management | ~10 | ~6,000 |
| Partner integrations | ~5 | ~3,000 |
| Other (profile, settings, etc.) | ~15 | ~5,000 |
| **Total** | **~170** | **~108,000** |

---

### END OF COMPLETE CURALIVE PLATFORM BRIEF

**Total routers:** 93
**Total services:** 58
**Total frontend pages:** 170+
**Total database tables:** 120+
**Total codebase:** ~184,000 lines

