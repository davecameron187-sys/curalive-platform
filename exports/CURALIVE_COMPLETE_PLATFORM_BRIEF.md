# CuraLive Platform - Complete Technical Clone Brief

**Date:** April 1, 2026
**Version:** 1.0.0
**Purpose:** Full technical specification for platform replication onto a new environment

---

## TABLE OF CONTENTS

1. [Platform Overview](#1-platform-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure & Monorepo Layout](#3-project-structure--monorepo-layout)
4. [Environment Variables & Secrets](#4-environment-variables--secrets)
5. [Database Schema (Complete)](#5-database-schema-complete)
6. [Server Architecture](#6-server-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [tRPC API Layer (Complete Router Map)](#8-trpc-api-layer-complete-router-map)
9. [Webhook Handlers & External Integrations](#9-webhook-handlers--external-integrations)
10. [Backend Services (Complete)](#10-backend-services-complete)
11. [AI Intelligence Pipeline](#11-ai-intelligence-pipeline)
12. [Shadow Mode System](#12-shadow-mode-system)
13. [Webcast & Live Video System](#13-webcast--live-video-system)
14. [Bridge Console (Telephony)](#14-bridge-console-telephony)
15. [Storage System](#15-storage-system)
16. [Real-Time Messaging (Ably)](#16-real-time-messaging-ably)
17. [Email System](#17-email-system)
18. [Frontend Architecture](#18-frontend-architecture)
19. [Frontend Pages (Complete List)](#19-frontend-pages-complete-list)
20. [Frontend Components (Complete List)](#20-frontend-components-complete-list)
21. [Frontend Hooks & Utilities](#21-frontend-hooks--utilities)
22. [Build, Dev & Deployment](#22-build-dev--deployment)
23. [Scripts & Migrations](#23-scripts--migrations)
24. [File Manifest](#24-file-manifest)

---

## 1. PLATFORM OVERVIEW

CuraLive is a real-time investor events intelligence platform designed as a professional-grade competitor to Chorus Call/BroadData. It combines live webcasting, telephony bridge conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services into a single platform.

**Core Capabilities:**
- Live webcasting with Mux RTMP/HLS video streaming
- Telephony bridge console (Twilio PSTN conferencing with IVR, DTMF, hold/mute/park)
- AI-powered real-time transcription (OpenAI Whisper via Recall.ai bots)
- Shadow Mode: Silent AI observation of external meetings (Zoom/Teams/Meet)
- 20-module AI intelligence report generation from transcripts
- Crisis prediction, valuation impact oracle, disclosure certificates
- Board Intelligence Compass, Pre-Event Briefings, Regulatory Compliance Monitor
- Self-evolving AI system with governance audit trails (Meta-Observer + Evolution Engine)
- Enterprise billing, attendee registration, operator console
- Real-time pub/sub via Ably for live dashboards
- Webphone (Twilio + Telnyx SIP)
- Full compliance engine (ISO 27001, SOC 2, SEC/FCA/ASIC/SGX/HKEX/JSE jurisdictions)

---

## 2. TECHNOLOGY STACK

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.1 | UI framework |
| Vite | 7.3.1 | Build tool & dev server |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.1.14 | Utility-first styling |
| Radix UI | Various | Accessible component primitives (accordion, dialog, tabs, tooltip, etc.) |
| Framer Motion | 12.23.22 | Animations |
| Wouter | 3.3.5 | Client-side routing |
| TanStack React Query | 5.90.2 | Server state management |
| tRPC React Query | 11.6.0 | Type-safe API client |
| Recharts | 2.15.2 | Charting/data visualization |
| Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 | Additional charting |
| Lucide React | 0.453.0 | Icon library |
| Sonner | 2.0.7 | Toast notifications |
| cmdk | 1.1.1 | Command palette |
| Embla Carousel | 8.6.0 | Carousel/slider |
| React Day Picker | 9.11.1 | Date picker |
| React Hook Form | 7.64.0 | Form management |
| React Resizable Panels | 3.0.6 | Resizable panel layouts |
| Vaul | 1.1.2 | Drawer component |
| input-otp | 1.4.2 | OTP input component |
| Superjson | 1.13.3 | JSON serialization (Date, BigInt support) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4.21.2 | HTTP server |
| tRPC Server | 11.6.0 | Type-safe API layer |
| Drizzle ORM | 0.44.5 | Database ORM |
| PostgreSQL (pg) | 8.20.0 | Primary database |
| OpenAI SDK | 6.27.0 | LLM integration (GPT-4o + Whisper) |
| Ably | 2.18.0 | Real-time pub/sub messaging |
| Twilio | 5.12.2 | Voice/telephony (server SDK) |
| @twilio/voice-sdk | 2.18.0 | WebRTC voice client |
| Telnyx | 5.51.0 | Alternative voice carrier |
| @mux/mux-node | 12.8.1 | Live video streaming |
| @mux/mux-player-react | 3.11.5 | Video player component |
| Stripe | 20.4.0 | Payment processing |
| Resend | 6.9.3 | Transactional email |
| Jose | 6.1.0 | JWT token verification |
| Multer | 2.1.0 | File upload middleware |
| Sharp | 0.34.5 | Image processing |
| Puppeteer | 24.38.0 | PDF generation |
| PDFKit / pdfmake / pdf-lib | Various | PDF creation |
| Mammoth | 1.12.0 | DOCX parsing |
| Archiver / adm-zip | 7.0.1 / 0.5.16 | ZIP file handling |
| Axios | 1.12.0 | HTTP client |
| Zod | 4.1.12 | Schema validation |
| express-rate-limit | 8.3.0 | API rate limiting |
| cookie | 1.0.2 | Cookie parsing |
| nanoid | 5.1.5 | Unique ID generation |
| date-fns | 4.1.0 | Date utilities |
| dotenv | 17.2.2 | Environment variable loading |
| @aws-sdk/client-s3 | 3.1016.0 | S3 storage client |
| @aws-sdk/s3-request-presigner | 3.1016.0 | S3 presigned URLs |

### Dev Dependencies
| Technology | Version | Purpose |
|---|---|---|
| tsx | 4.19.1 | TypeScript execution (dev server) |
| esbuild | 0.25.0 | Server bundle builder |
| Drizzle Kit | 0.31.4 | Database migration tool |
| Vitest | 2.1.4 | Unit testing |
| c8 | 11.0.0 | Code coverage |
| ESLint | 10.1.0 | Linting |
| Prettier | 3.6.2 | Code formatting |
| PostCSS | 8.4.47 | CSS processing |
| Autoprefixer | 10.4.20 | CSS vendor prefixes |
| docx | 9.6.1 | DOCX generation |
| ExcelJS | 4.4.0 | Excel file generation |
| @vitejs/plugin-react | 5.0.4 | Vite React plugin |
| @tailwindcss/typography | 0.5.15 | Prose styling |
| tw-animate-css | 1.4.0 | Animation utilities |

---

## 3. PROJECT STRUCTURE & MONOREPO LAYOUT

```
curalive/
├── package.json                    # Root package (name: "curalive")
├── pnpm-workspace.yaml             # pnpm workspace config
├── tsconfig.json                   # TypeScript config (aliases: @/* -> client/src/*, @shared/* -> shared/*)
├── vite.config.ts                  # Vite config (root: ./client, build output: dist/_app)
├── drizzle.config.ts               # Drizzle ORM config (dialect: postgresql)
├── replit.nix                      # Nix environment (Node.js 20+)
├── .replit                         # Replit configuration
├── replit.md                       # Project documentation
│
├── client/                         # FRONTEND (React 19 + Vite)
│   ├── index.html                  # HTML entry point
│   ├── src/
│   │   ├── main.tsx                # React entry point
│   │   ├── App.tsx                 # Main app shell with routing (wouter)
│   │   ├── AppEnhanced.tsx         # Alternative/experimental app shell
│   │   ├── const.ts                # Global constants
│   │   ├── index.css               # Global styles
│   │   ├── _core/
│   │   │   └── hooks/              # Core hooks (useAuth.ts)
│   │   ├── pages/                  # 208 page components
│   │   ├── components/             # 75+ business components
│   │   │   ├── ui/                 # 53 shadcn/ui components
│   │   │   └── mobile/             # Mobile-specific components
│   │   ├── hooks/                  # 7 custom hooks
│   │   ├── contexts/               # ThemeContext, AblyContext
│   │   ├── lib/                    # trpc.ts, utils.ts, useSmartBack.ts
│   │   └── services/               # sessionAutoSave.ts
│   └── replit_integrations/
│       └── audio/                  # Audio utilities (playback, recording, streaming)
│
├── server/                         # BACKEND (Express + tRPC)
│   ├── _core/                      # Server engine
│   │   ├── index.ts                # Express server entry point + startup
│   │   ├── trpc.ts                 # tRPC setup, procedure definitions, dev bypass
│   │   ├── context.ts              # tRPC context creation
│   │   ├── sdk.ts                  # OAuth SDK (JWT verification, session management)
│   │   ├── env.ts                  # Environment variable config
│   │   ├── llm.ts                  # LLM integration (OpenAI GPT-4o + Gemini 2.5 Flash)
│   │   ├── email.ts                # Resend email integration
│   │   ├── ably.ts                 # Ably real-time pub/sub
│   │   ├── notification.ts         # Owner notification service
│   │   ├── voiceTranscription.ts   # Voice-to-text
│   │   ├── systemRouter.ts         # System health + restart
│   │   └── transcription/          # Transcription pipeline
│   │
│   ├── routers/                    # 100+ tRPC router files
│   │   ├── routers.eager.ts        # Router registry (eager loading)
│   │   └── routers.ts              # Router registry (standard loading)
│   │
│   ├── services/                   # 59 backend service files
│   │
│   ├── webhooks/                   # Webhook handlers
│   │   ├── bridgeWebhooks.ts       # Twilio bridge webhooks
│   │   ├── recall.ts               # Recall.ai webhook handler
│   │   └── aiAmRecall.ts           # AI moderation recall handler
│   │
│   ├── webphone/                   # Telephony integration
│   │   ├── twilio.ts               # Twilio WebRTC/SIP
│   │   ├── telnyx.ts               # Telnyx SIP
│   │   ├── carrierManager.ts       # Multi-carrier management
│   │   └── ablyPublish.ts          # Real-time call events
│   │
│   ├── replit_integrations/        # Platform integrations
│   │   ├── audio/                  # Audio processing
│   │   ├── chat/                   # Chat services
│   │   └── image/                  # Image processing
│   │
│   ├── storage.ts                  # Object storage (Forge proxy to S3)
│   ├── storageAdapter.ts           # Local/cloud storage hybrid adapter
│   ├── recordingUpload.ts          # Recording file upload handler
│   ├── audioUpload.ts              # Audio library upload handler
│   ├── slideDeckUpload.ts          # Slide deck upload handler
│   ├── audioIngest.ts              # FFmpeg HLS audio ingest for transcription
│   ├── aiAnalysis.ts               # Real-time AI analysis pipeline
│   ├── recallWebhook.ts            # Recall.ai webhook (primary handler)
│   ├── reminderScheduler.ts        # Event reminder email scheduler
│   └── db.ts                       # Database connection (getDb, rawSql)
│
├── shared/                         # SHARED CODE (client + server)
│   ├── const.ts                    # Shared constants (cookie name, etc.)
│   ├── types.ts                    # Shared TypeScript types
│   ├── _core/
│   │   └── errors.ts               # Error handling utilities
│   └── models/
│       └── chat.ts                 # Chat Zod schemas
│
├── drizzle/                        # DATABASE
│   ├── schema.ts                   # Complete Drizzle schema (100+ tables)
│   ├── relations.ts                # Table relationships
│   └── migrations/                 # SQL migration files
│
├── scripts/                        # UTILITY SCRIPTS
│   ├── create-*.ts                 # Table creation scripts (raw SQL)
│   ├── add-*.ts                    # Column addition scripts
│   ├── check-router-sync.mjs       # Router sync verification
│   └── ...                         # Various migration/seeding scripts
│
├── docs/                           # DOCUMENTATION
│   ├── CURALIVE_COMPLETE_TECHNICAL_SPEC.md
│   ├── CURALIVE_PLATFORM_SPECIFICATION.md
│   ├── CIP-Module-M-AI-Self-Evolution-Engine.md
│   ├── CURALIVE_AI_APPLICATIONS_INVENTORY.md
│   ├── BETA_DEPLOYMENT_GUIDE.md
│   └── ...                         # 30+ documentation files
│
├── artifacts/                      # SUB-PACKAGES
│   ├── api-server/                 # Production API server artifact
│   └── mockup-sandbox/             # UI prototyping environment
│
├── exports/                        # Generated export files
└── uploads/                        # Local file uploads
    └── recordings/                 # Recording files (local fallback)
```

---

## 4. ENVIRONMENT VARIABLES & SECRETS

### Required Secrets
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT token signing secret (cookie encryption) |
| `ABLY_API_KEY` | Ably real-time messaging API key |
| `RECALL_AI_API_KEY` | Recall.ai bot API key (transcription bots) |
| `RECALL_AI_WEBHOOK_SECRET` | HMAC-SHA256 webhook signature verification |
| `MUX_WEBHOOK_SECRET` | Mux video webhook verification |

### Optional / Service-Specific
| Variable | Purpose |
|---|---|
| `VITE_APP_ID` | Application identifier |
| `OAUTH_SERVER_URL` | OAuth authentication server URL |
| `OWNER_OPEN_ID` | Platform owner's OpenID identifier |
| `RESEND_API_KEY` | Resend email API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_API_KEY` | Twilio API key |
| `TWILIO_API_SECRET` | Twilio API secret |
| `TWILIO_TRUNKING_SID` | Twilio SIP trunking SID |
| `TELNYX_API_KEY` | Telnyx voice API key |
| `TELNYX_SIP_USER` | Telnyx SIP credentials |
| `TELNYX_SIP_PASS` | Telnyx SIP password |
| `TELNYX_CONNECTION_ID` | Telnyx connection identifier |
| `MUX_TOKEN_ID` | Mux video API token ID |
| `MUX_TOKEN_SECRET` | Mux video API token secret |
| `STRIPE_SECRET_KEY` | Stripe payment processing |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o, Whisper) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Alternative OpenAI key (Replit proxy) |
| `BUILT_IN_FORGE_API_URL` | Forge API URL (storage + AI proxy) |
| `BUILT_IN_FORGE_API_KEY` | Forge API bearer token |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Object storage bucket |
| `PRIVATE_OBJECT_DIR` | Private object storage directory |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public object storage paths |
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Server port (auto-assigned by Replit) |
| `AUTH_BYPASS` | Dev mode auth bypass flag |

### ENV Resolution (`server/_core/env.ts`)
```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    ?? process.env.BUILT_IN_FORGE_API_KEY
    ?? process.env.OPENAI_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
```

---

## 5. DATABASE SCHEMA (COMPLETE)

**Database:** PostgreSQL
**ORM:** Drizzle ORM 0.44.5
**Schema File:** `drizzle/schema.ts`
**Relations File:** `drizzle/relations.ts`

### Core Tables

#### Users & Auth
| Table | Key Columns | Purpose |
|---|---|---|
| `users` | id (serial PK), openId (varchar unique), name, email, role, organisation, jobTitle, avatarUrl, phone, timezone, createdAt, updatedAt | Central user table |

#### Events
| Table | Key Columns | Purpose |
|---|---|---|
| `events` | id (serial PK), eventId (unique string), title, company, platform, status, accessCode, createdAt, updatedAt | Event metadata |
| `attendee_registrations` | id, eventId, name, email, company, language, dialIn, accessPin | Participant sign-ups |

### OCC (Operator Call Centre) Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `occ_conferences` | id, eventId, callId, status, moderatorCode, participantCode, isLocked, autoAdmitEnabled, scheduledStart | Master conference record |
| `occ_participants` | id, conferenceId, lineNumber, role, name, state (enum), phoneNumber, isSpeaking | Real-time participant state |
| `occ_lounge` | id, conferenceId, participantId | Waiting room queue |
| `occ_operator_requests` | id, conferenceId, type (DTMF/assistance) | Operator request log |
| `occ_operator_sessions` | id, operatorId, conferenceId | Operator presence tracking |
| `occ_chat_messages` | id, conferenceId, sender, message, translatedMessage | Real-time chat with translation |
| `occ_participant_history` | id, participantId, action, timestamp | State transition audit log |
| `occ_transcription_segments` | id, conferenceId, speaker, text, timestamp | Live transcript segments |
| `occ_live_rolling_summaries` | id, conferenceId, summary, timestamp | Rolling AI summaries |

### Bridge Console Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `bridge_conferences` | id, eventId, twilioConferenceSid, status, moderatorPin, participantPin, isLocked, isRecording | Twilio bridge conference state |
| `bridge_participants` | id, conferenceId, callSid, name, role, state, isMuted, isOnHold | Bridge participant management |
| `bridge_greeter_queue` | id, conferenceId, callSid, name, status | IVR greeter waiting queue |

### Enterprise Billing Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `billing_clients` | id, name, company, email, status | Enterprise customer companies |
| `billing_client_contacts` | id, clientId, name, email, role | Client contact people |
| `billing_quotes` | id, clientId, quoteNumber, status, total, validUntil | Financial quotes |
| `billing_invoices` | id, clientId, invoiceNumber, status, total, dueDate | Invoices |
| `billing_line_items` | id, invoiceId/quoteId, description, quantity, unitPrice | Individual charges |
| `billing_payments` | id, invoiceId, amount, method, reference | Payment records |
| `billing_recurring_templates` | id, clientId, frequency, nextRun | Recurring billing automation |

### AI & Intelligence Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `shadow_sessions` | id, meetingUrl, platform, status, botId, transcriptJson, aiReport | Shadow Mode session tracking |
| `recall_bots` | id, sessionId, recallBotId, status, joinUrl | Recall.ai bot state |
| `bastion_intelligence_sessions` | id, eventId, investorProfile, analysis | Investor-focused AI analysis |
| `agm_intelligence_sessions` | id, eventId, governanceAnalysis, dissentAnalysis | AGM governance analysis |
| `agentic_analyses` | id, eventId, roiAnalysis, bundleRecommendations | AI-driven ROI analysis |
| `agentic_brain_decisions` | id, eventId, decision, reasoning, timestamp | Agentic brain audit log |
| `operator_corrections` | id, sessionId, correction, feedback | RLHF feedback loop |
| `ai_generated_content` | id, eventId, contentType, content | AI-generated content store |
| `sentiment_snapshots` | id, eventId, score, magnitude, timestamp | Sentiment data points |
| `qa_auto_triage_results` | id, questionId, classification, confidence | Q&A auto-triage results |
| `speaking_pace_analysis` | id, segmentId, wpm, fillerCount | Speaker coaching data |
| `toxicity_filter_results` | id, messageId, score, flagged | Content moderation results |
| `transcript_edits` | id, segmentId, originalText, editedText, editor | Transcript edit history |
| `event_brief_results` | id, eventId, brief, generatedAt | Event briefing outputs |

### Board Intelligence Tables (21 tables for 3 new AI services)
| Table | Key Columns | Purpose |
|---|---|---|
| `board_intelligence_compass` | id, sessionId, eventId, createdAt | Board Intelligence session |
| `prior_commitment_audits` | id, compassId, commitment, source, status, assessment | Prior commitment tracking |
| `director_liability_maps` | id, compassId, directorName, area, riskLevel, exposure | Director liability mapping |
| `analyst_expectation_audits` | id, compassId, metric, consensusValue, range, revisionTrend | Analyst consensus data |
| `governance_communication_scores` | id, compassId, clarity, consistency, completeness, timeliness | Governance scoring |
| `board_resolutions` | id, compassId, actionType, description, priority, owner, dueDate, status | Board action items |
| `pre_event_intelligence_briefings` | id, sessionId, eventId, briefingDate | Pre-event briefing session |
| `analyst_consensus_data` | id, briefingId, metric, consensusValue, lowEstimate, highEstimate | Analyst consensus |
| `predicted_qa_items` | id, briefingId, question, probability, riskLevel, suggestedResponse | Predicted Q&A items |
| `compliance_hotspots` | id, briefingId, topic, riskLevel, regulatoryBasis, mitigation | Compliance risk areas |
| `readiness_scores` | id, briefingId, category, score, maxScore, notes | Event readiness metrics |
| `regulatory_compliance_monitors` | id, sessionId, eventId, monitoringStarted | Compliance monitor session |
| `regulatory_flags` | id, monitorId, flagType, severity, description, timestamp | Regulatory flag detection |
| `disclosure_triggers` | id, monitorId, triggerType, description, status, deadline | Disclosure trigger tracking |
| `jurisdiction_profiles` | id, code, name, regulator, keyRules, reportingDeadline | Jurisdiction profiles (6 seeded) |
| `compliance_action_items` | id, monitorId, action, priority, assignee, dueDate, status | Compliance action items |

### Webcast & Video Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `webcast_events` | id, slug, title, status, muxStreamId, muxPlaybackId, scheduledStart | Webcast event management |
| `webcast_registrations` | id, eventId, name, email, attendeeToken | Attendee registration |
| `webcast_enhancements` | id, eventId, noiseCancellation, xrEnabled, aiDubbing | Webcast feature config |
| `webcast_qa` | id, eventId, question, status, approved | Q&A moderation |
| `virtual_studios` | id, name, layout, overlays, aiBundle | Virtual studio config |

### Live Q&A Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `live_qa_sessions` | id, eventId, status | Q&A session management |
| `live_qa_questions` | id, sessionId, text, askerName, status, aiTriage | Questions with AI triage |
| `live_qa_answers` | id, questionId, text, answeredBy | Moderated answers |

### Compliance & Security Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `compliance_threats` | id, type, severity, description, detected, status | Security threat log |
| `compliance_framework_checks` | id, framework, control, status, evidence | ISO/SOC compliance checks |
| `compliance_audit_log` | id, action, userId, timestamp, details | Audit trail |

### Social Media Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `social_media_accounts` | id, platform, accountId, accessToken | Connected social accounts |
| `social_media_posts` | id, accountId, content, scheduledAt, postedAt | Post management |
| `social_media_analytics` | id, postId, impressions, engagement | Post analytics |

### Interconnection & Analytics Tables
| Table | Key Columns | Purpose |
|---|---|---|
| `interconnection_activations` | id, sourceModule, targetModule, eventId | Cross-module feature usage |
| `aggregate_intelligence` | id, sector, metric, value, period | Anonymized aggregate data |

### Additional Tables (created via raw SQL scripts)
- `ai_evolution_proposals`, `ai_evolution_governance_log`, `ai_evolution_tools`
- `disclosure_certificates`, `disclosure_certificate_chains`
- `crisis_predictions`, `valuation_impacts`
- `tagged_metrics`, `tagged_metric_benchmarks`
- `cross_event_consistency_reports`
- `investor_engagement_scores`, `investor_intent_signals`
- `communication_index_scores`
- `autonomous_interventions`
- `market_impact_predictions`
- `materiality_risk_assessments`
- `multi_modal_compliance_results`
- `regulatory_intervention_logs`
- `sustainability_metrics`
- `volatility_simulations`
- `call_preparations`
- `monthly_report_data`
- `platform_embed_configs`
- `personalized_briefings`
- `external_sentiment_data`

### Seeded Data
- **Jurisdiction Profiles (6):** SEC (USA), FCA (UK), ASIC (Australia), SGX (Singapore), HKEX (Hong Kong), JSE (South Africa)

---

## 6. SERVER ARCHITECTURE

### Entry Point
**File:** `server/_core/index.ts`
**Function:** `startServer()`

### Startup Sequence
1. `enforceEnvOrExit()` - Validates required environment variables
2. Create Express app + HTTP server
3. Register middleware:
   - `express.json()` + `express.urlencoded()` (Twilio/Telnyx webhook body parsing)
   - `express-rate-limit` (API: 120/min prod, 500/min dev; Auth: 20/15min prod, 200/15min dev)
   - `systemStatusRouter` (health check at root)
   - Mockup proxy (`/__mockup` -> localhost:23636 in dev)
   - tRPC middleware at `/api/trpc`
   - Vite dev server (dev) or static file serving (prod)
4. Register webhook routes:
   - `registerRecallWebhookRoute(app)` at `/api/recall/webhook`
   - `registerBridgeWebhooks(app)` at `/api/bridge/*`
   - Telnyx webhook at `/api/webphone/telnyx`
   - Twilio TwiML at `/api/webphone/twiml`, `/api/voice/inbound`
5. Start background services:
   - `startReminderScheduler(origin)` - Email reminders (60s interval)
   - `startHealthGuardian()` - Health monitoring (30s interval)
   - `startComplianceEngine()` + `seedFrameworkControls()` - Compliance scanning (5min interval)
   - `reconcileShadowSessions()` + `startShadowWatchdog()` - Shadow Mode recovery (60s interval)
6. Run non-blocking migrations (transcription columns, Q&A columns)
7. Graceful shutdown handler (SIGTERM/SIGINT)

### Server Build Pipeline
- **Dev:** `tsx watch server/_core/index.ts` (hot-reload)
- **Build:** `vite build` (frontend to `dist/_app`) + `esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` (backend to `dist/index.js`)
- **Production:** `node dist/index.js`

---

## 7. AUTHENTICATION & AUTHORIZATION

### Authentication Flow
1. **OAuth/OpenID Connect:** External OAuth server (`OAUTH_SERVER_URL`) handles login
2. **JWT Sessions:** JWTs stored in cookies (cookie name from `@shared/const`)
3. **JWT Verification:** `jose` library verifies tokens in `server/_core/sdk.ts`
4. **User Sync:** If JWT is valid but user missing from local DB, auto-syncs from OAuth server via `getUserInfoWithJwt`
5. **Dev Bypass:** When `NODE_ENV !== 'production'` and `AUTH_BYPASS === true`, injects `DEV_USER` (id: 0, name: "Dev Operator") into context

### tRPC Context
**File:** `server/_core/context.ts`
- Calls `sdk.authenticateRequest(req)` to populate `user` object
- Returns `{ user, req, res }` to all procedures

### Procedure Security Levels
| Level | Required | Access |
|---|---|---|
| `publicProcedure` | None | Anyone |
| `protectedProcedure` | Valid session | Authenticated users |
| `operatorProcedure` | role = 'operator' or 'admin' | Operators |
| `adminProcedure` | role = 'admin' | Administrators only |

### Database Access Pattern
```typescript
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}
```

---

## 8. tRPC API LAYER (COMPLETE ROUTER MAP)

**Mount Point:** `/api/trpc`
**Registry Files:** `server/routers.eager.ts` (SSR optimized) AND `server/routers.ts` (standard)

**CRITICAL:** New routers MUST be registered in BOTH files.

### Complete Router Registry (90+ routers)

#### Core Infrastructure Routers
| Router Key | Source File | Procedures |
|---|---|---|
| `system` | `server/_core/systemRouter.ts` | health (Q), restart (M) |
| `auth` | Inline in routers.ts | me (Q), logout (M) |
| `admin` | Inline in routers.ts | listUsers (Q), updateUserRole (M) |
| `team` | Inline in routers.ts | requestOperatorAccess (M) |
| `profile` | Inline in routers.ts | get (Q), update (M), uploadAvatar (M), getEventHost (Q) |
| `ably` | `server/routers/ably.ts` | tokenRequest (Q) |
| `events` | Inline in routers.ts | verifyAccess (Q), getEvent (Q), upsertEvent (M), setAccessCode (M), generateSummary (M) |
| `rbac` | `server/routers/rbac.ts` | getRoles (Q), updatePermissions (M) |
| `persistence` | `server/routers/persistence.ts` | saveState (M), loadState (Q) |

#### Operator Call Centre (OCC)
| Router Key | Source File | Procedures |
|---|---|---|
| `occ` | `server/routers/occ.ts` | getConferences (Q), getConference (Q), getConferenceByEventId (Q), toggleRecording (M), toggleLock (M), muteAll (M), terminateConference (M), toggleAutoAdmit (M), getDirectAccessStats (Q), getDirectAccessLog (Q), getParticipants (Q), updateParticipant (M), toggleMuteParticipant (M), dropParticipant (M), parkParticipant (M), reconnectParticipant (M), getOperatorActivities (Q), logOperatorActivity (M) |

#### Bridge Console (Telephony)
| Router Key | Source File | Procedures |
|---|---|---|
| `bridgeConsole` | `server/routers/bridgeConsoleRouter.ts` | getConferences, getConference, createConference, updateConference, getParticipants, holdParticipant, removeParticipant, muteParticipant, admitFromGreeterQueue, getGreeterQueue, deployRecallBot |
| `conferenceDialout` | `server/routers/conferenceDialoutRouter.ts` | dialOut, getDialoutHistory |
| `restBridge` | `server/routers/restBridgeRouter.ts` | REST API bridge endpoints |

#### Webcast & Live Video
| Router Key | Source File | Procedures |
|---|---|---|
| `webcast` | `server/routers/webcastRouter.ts` | getEvent (Q), createEvent (M), updateEvent (M), deleteEvent (M), register (M), getAttendees (Q), toggleLive (M), getStats (Q) |
| `liveVideo` | `server/routers/liveVideo.ts` | createStream (M), getStream (Q), listStreams (Q), stopStream (M), getRecording (Q), listRecordings (Q) |
| `mux` | `server/routers/muxRouter.ts` | createLiveStream (M), getLiveStream (Q), listLiveStreams (Q), deleteLiveStream (M), createAsset (M), getAsset (Q) |
| `virtualStudio` | `server/routers/virtualStudioRouter.ts` | getScene (Q), updateScene (M) |
| `broadcaster` | `server/routers/broadcasterRouter.ts` | analyzePace, detectFillers, identifyKeyMoments |
| `liveSubtitle` | `server/routers/liveSubtitleRouter.ts` | getSubtitles, startSubtitles, stopSubtitles |

#### AI Core
| Router Key | Source File | Procedures |
|---|---|---|
| `ai` | `server/routers/aiRouter.ts` | chat (M), summarize (M), analyzeSentiment (M), extractInsights (M) |
| `aiDashboard` | `server/routers/aiDashboard.ts` | getMetrics (Q), getUsageStats (Q) |
| `aiFeatures` | `server/routers/aiFeatures.ts` | getEnabledFeatures (Q), toggleFeature (M) |
| `aiApplications` | `server/routers/aiApplications.ts` | getAll (Q), updateAppConfig (M) |
| `aiAm` | `server/routers/aiAm.ts` | moderateChat (M), getModerationStats (Q) |
| `aiEvolution` | `server/routers/aiEvolutionRouter.ts` | getEvolutionState (Q), triggerLearning (M) |
| `agenticBrain` | `server/routers/agenticEventBrainRouter.ts` | processEvent (M), getHistory (Q) |
| `advisoryBot` | `server/routers/advisoryBotRouter.ts` | Advisory bot interactions |
| `supportChat` | `server/routers/supportChatRouter.ts` | Support chat endpoints |

#### Shadow Mode & Recall.ai
| Router Key | Source File | Procedures |
|---|---|---|
| `shadowMode` | `server/routers/shadowModeRouter.ts` | getStatus (Q), toggle (M), getSessions, deployBot, getTranscript, generateReport |
| `recall` | `server/routers/recallRouter.ts` | botStatus (Q), inviteBot (M), removeBot (M), getTranscript (Q), getVideoUrl (Q) |
| `archiveUpload` | `server/routers/archiveUploadRouter.ts` | uploadArchive (M), getUploadStatus (Q), generateReport (M) |

#### Intelligence Services
| Router Key | Source File | Procedures |
|---|---|---|
| `boardIntelligence` | `server/routers/boardIntelligenceRouter.ts` | getOrCreateCompass, getPriorCommitmentAudit, getDirectorLiabilityMap, getAnalystExpectationAudit, getGovernanceCommunicationScore, getBoardResolutions, createBoardResolution, updateResolutionStatus, generateBoardBriefing |
| `preEventIntelligence` | `server/routers/preEventIntelligenceRouter.ts` | getOrCreateBriefing, getAnalystConsensus, getPredictedQa, getComplianceHotspots, getReadinessScores |
| `regulatoryCompliance` | `server/routers/regulatoryComplianceRouter.ts` | getOrCreateMonitor, getRegulatoryFlags, getDisclosureTriggers, getJurisdictionProfiles, getComplianceActionItems, createActionItem, updateActionItemStatus |
| `intelligenceReport` | `server/routers/intelligenceReportRouter.ts` | generateReport, getReport |
| `intelligenceTerminal` | `server/routers/intelligenceTerminalRouter.ts` | query, getHistory |
| `adaptiveIntelligence` | `server/routers/adaptiveIntelligenceRouter.ts` | Adaptive intelligence endpoints |

#### Analytics & Sentiment
| Router Key | Source File | Procedures |
|---|---|---|
| `analytics` | `server/routers/analytics.ts` | getEngagementStats (Q), getAttendeeMetrics (Q) |
| `sentiment` | `server/routers/sentiment.ts` | getRealtimeSentiment (Q), getHistoricalSentiment (Q) |
| `externalSentiment` | `server/routers/externalSentimentRouter.ts` | External sentiment feed |
| `benchmarks` | `server/routers/benchmarksRouter.ts` | Benchmarking data |
| `taggedMetrics` | `server/routers/taggedMetricsRouter.ts` | Tagged numerical metrics |
| `interconnection` | `server/routers/interconnectionAnalytics.ts` | getGraph (Q), analyzeNodes (M) |

#### Compliance & Risk
| Router Key | Source File | Procedures |
|---|---|---|
| `compliance` | `server/routers/compliance.ts` | checkCompliance (M), getAuditLog (Q), generateReport (M) |
| `complianceEngine` | `server/routers/complianceEngineRouter.ts` | runRuleEngine (M), getRules (Q) |
| `iso27001` | `server/routers/iso27001Router.ts` | ISO 27001 compliance endpoints |
| `soc2` | `server/routers/soc2Router.ts` | SOC 2 compliance endpoints |
| `multiModalCompliance` | `server/routers/multiModalComplianceRouter.ts` | Multi-modal compliance analysis |
| `regulatoryIntervention` | `server/routers/regulatoryInterventionRouter.ts` | Regulatory intervention tracking |
| `autonomousIntervention` | `server/routers/autonomousInterventionRouter.ts` | AI autonomous interventions |

#### Investor Intelligence
| Router Key | Source File | Procedures |
|---|---|---|
| `crisisPrediction` | `server/routers/crisisPredictionRouter.ts` | Crisis prediction analysis |
| `valuationImpact` | `server/routers/valuationImpactRouter.ts` | Share price impact prediction |
| `disclosureCertificate` | `server/routers/disclosureCertificateRouter.ts` | SHA-256 hash-chained disclosure certificates |
| `investorEngagement` | `server/routers/investorEngagementRouter.ts` | Investor engagement scoring |
| `investorIntent` | `server/routers/investorIntentRouter.ts` | Investor intention decoding |
| `investorQuestions` | `server/routers/investorQuestionsRouter.ts` | Investor question intelligence |
| `marketImpactPredictor` | `server/routers/marketImpactPredictorRouter.ts` | Market impact predictions |
| `marketReaction` | `server/routers/marketReactionRouter.ts` | Market reaction tracking |
| `materialityRisk` | `server/routers/materialityRiskRouter.ts` | Materiality risk assessment |
| `evasiveAnswer` | `server/routers/evasiveAnswerRouter.ts` | Evasive answer detection |
| `volatilitySimulator` | `server/routers/volatilitySimulatorRouter.ts` | Volatility simulation |
| `ipoMandA` | `server/routers/ipoMandARouter.ts` | IPO & M&A intelligence |
| `crossEventConsistency` | `server/routers/crossEventConsistencyRouter.ts` | Cross-event consistency analysis |
| `communicationIndex` | `server/routers/communicationIndexRouter.ts` | Communication quality index |

#### Content & Communication
| Router Key | Source File | Procedures |
|---|---|---|
| `transcription` | `server/routers/transcription.ts` | getTranscript (Q), updateTranscript (M), exportTranscript (M) |
| `transcriptEditor` | `server/routers/transcriptEditorRouter.ts` | saveEdits (M), getEditHistory (Q) |
| `liveRollingSummary` | `server/routers/liveRollingSummary.ts` | getSummary (Q), startSummary (M), stopSummary (M) |
| `contentTriggers` | `server/routers/contentTriggers.ts` | getTriggers (Q), createTrigger (M), executeTrigger (M) |
| `socialMedia` | `server/routers/socialMedia.ts` | postUpdate (M), getFeed (Q) |
| `sustainability` | `server/routers/sustainabilityRouter.ts` | Sustainability metrics |

#### Business Operations
| Router Key | Source File | Procedures |
|---|---|---|
| `billing` | `server/routers/billingRouter.ts` | getInvoices, createInvoice, getQuotes, createQuote, getAgeingReport, getDashboardKpis, markOverdueInvoices, deleteRecurringTemplate |
| `scheduling` | `server/routers/scheduling.ts` | getEvents (Q), createEvent (M), updateEvent (M), deleteEvent (M) |
| `followups` | `server/routers/followups.ts` | getFollowups (Q), createFollowup (M), markCompleted (M) |
| `polls` | `server/routers/polls.ts` | getPolls, createPoll, updatePoll, deletePoll, vote, getResults |
| `postEventReport` | `server/routers/postEventReport.ts` | generateReport (M), getReport (Q), listReports (Q) |
| `monthlyReport` | `server/routers/monthlyReportRouter.ts` | Monthly report generation |
| `mailingList` | `server/routers/mailingListRouter.ts` | Mailing list management |

#### Telephony & Communication
| Router Key | Source File | Procedures |
|---|---|---|
| `webphone` | `server/routers/webphoneRouter.ts` | getAccountStatus, getCarrierStatus, getCallerIds, getTelnyxNumbers, makeCall, sendSms, getActivityStats, getInboundRoutingStatus |
| `liveQa` | `server/routers/liveQaRouter.ts` | Live Q&A management |

#### Configuration & Customization
| Router Key | Source File | Procedures |
|---|---|---|
| `branding` | `server/routers/branding.ts` | getSettings, updateSettings, uploadLogo, resetToDefault |
| `customisation` | `server/routers/customisationRouter.ts` | getPortalConfig, updatePortalConfig |
| `clientPortal` | `server/routers/clientPortal.ts` | getPortalData, updateBranding, getAnalytics |
| `trainingMode` | `server/routers/trainingMode.ts` | enableTraining, disableTraining, getTrainingStats, resetTraining |
| `operatorLinks` | `server/routers/operatorLinksRouter.ts` | getLinks, createLink |
| `platformEmbed` | `server/routers/platformEmbedRouter.ts` | Platform embedding configuration |
| `crmApi` | `server/routers/crmApiRouter.ts` | CRM API integration |

#### Specialized Intelligence
| Router Key | Source File | Procedures |
|---|---|---|
| `roadshowAI` | `server/routers/roadshowAI.ts` | generateSchedule, getItinerary, analyzeSentiment, optimizeTravel |
| `eventBrief` | `server/routers/eventBriefRouter.ts` | generateBrief, getBrief |
| `callPrep` | `server/routers/callPrepRouter.ts` | Call preparation intelligence |
| `personalizedBriefing` | `server/routers/personalizedBriefingRouter.ts` | Personalized briefing generation |
| `bastionBooking` | `server/routers/bastionBookingRouter.ts` | Bastion partner booking |
| `lumiBooking` | `server/routers/lumiBookingRouter.ts` | Lumi partner booking |
| `agmGovernance` | `server/routers/agmGovernanceRouter.ts` | AGM governance intelligence |
| `evolutionAudit` | `server/routers/evolutionAuditRouter.ts` | AI evolution audit trail |
| `archive` | `server/routers/archive.ts` | Archive management |
| `session` | `server/routers/session.ts` | Session management |
| `healthGuardian` | `server/routers/healthGuardianRouter.ts` | Health monitoring dashboard |
| `systemDiagnostics` | `server/routers/systemDiagnosticsRouter.ts` | System diagnostics |

---

## 9. WEBHOOK HANDLERS & EXTERNAL INTEGRATIONS

### Recall.ai Webhooks
- **URL:** `POST /api/recall/webhook`
- **Handler:** `server/recallWebhook.ts` (primary), `server/webhooks/recall.ts` (structured)
- **Security:** HMAC-SHA256 via `x-recall-signature` header + `RECALL_AI_WEBHOOK_SECRET`
- **Events:**
  - `bot.status_change` -> Updates `recall_bots` table, publishes to Ably
  - `transcript.data` -> Joins word-level chunks into segments, stores in DB, broadcasts via Ably
  - `recording.done` -> Captures final recording URL, updates DB
- **Registration:** `registerRecallWebhookRoute(app)` in `server/_core/index.ts` with custom raw body parser for HMAC

### Bridge (Twilio) Webhooks
- **URLs:**
  - `POST /api/bridge/inbound` - Conference call entry point
  - `POST /api/bridge/access-code` - Event access code validation
  - `POST /api/bridge/name-captured` - IVR name recording
  - `POST /api/bridge/org-captured` - IVR organization recording
  - `POST /api/bridge/conference-status` - Conference events (join, leave, mute, recording)
  - `POST /api/bridge/participant-dtmf` - DTMF keypresses (*2 for hand-raising)
- **Handler:** `server/webhooks/bridgeWebhooks.ts`
- **Logic:** Generates TwiML responses, validates Twilio signatures, updates `bridge_participants`/`bridge_conferences`/`bridge_greeter_queue`, publishes to Ably channel `bridge-{conferenceId}`
- **Registration:** `registerBridgeWebhooks(app)` in `server/_core/index.ts`

### Mux Integration
- **Type:** API-driven with audio ingest worker
- **Handler:** `server/routers/muxRouter.ts` (tRPC)
- **Audio Ingest:** `server/audioIngest.ts` - FFmpeg pulls HLS audio, chunks to Whisper, broadcasts via Ably
- **Operations:** RTMP ingest, HLS playback, live stream CRUD, asset management

### Telnyx Integration
- **URL:** `POST /api/webphone/telnyx`
- **Handler:** `server/webphone/telnyx.ts`
- **Logic:** Parses call-control events, logs activity

### Twilio Voice (non-Bridge)
- **URLs:** `/api/webphone/twiml`, `/api/voice/inbound`
- **Handler:** `server/webphone/twilio.ts`
- **Logic:** WebRTC voice, SIP trunking, caller ID management

### Ably Real-time
- **Server:** `server/_core/ably.ts` (SDK-based), `server/recallWebhook.ts` (REST-based for performance)
- **Token Auth:** tRPC `ably.tokenRequest` procedure provides temporary client capabilities
- **Channels:** Transcripts, bot statuses, participant events, sentiment, bridge updates

### Resend Email
- **Handler:** `server/_core/email.ts`
- **Templates:** IR Summaries, Registration Confirmations (with ICS attachments), Event Reminders
- **Fallback:** Logs warning if `RESEND_API_KEY` missing (graceful degradation for development)

### Stripe
- **Status:** Referenced but not actively routed. Custom enterprise billing system used instead.
- **Package:** `stripe@20.4.0` installed

---

## 10. BACKEND SERVICES (COMPLETE)

### 59 Service Files in `server/services/`

#### Autonomous Background Services (started at server boot)
| Service | File | Interval | Purpose |
|---|---|---|---|
| Shadow Mode Guardian | `ShadowModeGuardianService.ts` | 60s | Monitors zombie sessions, handles timeouts, state recovery |
| Health Guardian | `HealthGuardianService.ts` | 30s | Health/latency checks on DB, Twilio, OpenAI, Ably, Recall.ai + LLM root cause analysis |
| Compliance Engine | `ComplianceEngineService.ts` | 5min | Security threat scanning (fraud, access anomalies, data exfiltration) + ISO 27001/SOC 2 controls |
| Reminder Scheduler | `reminderScheduler.ts` | 60s | Automated email reminders (24h + 1h before events) |

#### AI & Intelligence Services
| Service | File | Purpose |
|---|---|---|
| AI Evolution | `AiEvolutionService.ts` | Self-improving AI with Meta-Observer, gap detection, autonomous tool proposals, SHA-256 governance audit chain |
| Event Integrity Twin | `EventIntegrityTwinService.ts` | Cryptographic hash chain of transcript+sentiment+compliance for immutable audit trail, "Clean Disclosure Certificate" |
| Bastion Investor AI | `BastionInvestorAiService.ts` | Institutional investor profiling and engagement analysis |
| AGM Governance AI | `AgmGovernanceAiService.ts` | AGM-specific governance and dissent analysis |
| AGI Compliance | `AgiComplianceService.ts` | Advanced AI compliance checking |
| AGI Tool Generator | `AgiToolGeneratorService.ts` | Autonomous AI tool generation |
| Market Impact Predictor | `MarketImpactPredictorService.ts` | Market impact prediction engine |
| Materiality Risk Oracle | `MaterialityRiskOracleService.ts` | Material disclosure risk assessment |
| Investor Engagement Scoring | `InvestorEngagementScoringService.ts` | Investor engagement metrics |
| Investor Intention Decoder | `InvestorIntentionDecoderService.ts` | Investor intent signal analysis |
| IPO M&A Intelligence | `IpoMandAIntelligenceService.ts` | IPO and M&A event intelligence |
| Cross-Event Consistency | `CrossEventConsistencyService.ts` | Cross-event narrative consistency checking |
| External Sentiment | `ExternalSentimentService.ts` | External market sentiment aggregation |
| Predictive Event Intelligence | `PredictiveEventIntelligenceService.ts` | Predictive analytics for events |
| Volatility Simulator | `VolatilitySimulatorService.ts` | Market volatility simulation |

#### Real-time Processing Services
| Service | File | Purpose |
|---|---|---|
| Transcription | `TranscriptionService.ts` | Core audio-to-text (Whisper/OpenAI) |
| Sentiment Analysis | `SentimentAnalysisService.ts` | Rolling sentiment scoring for live transcripts |
| Live Rolling Summary | `LiveRollingSummaryService.ts` | "What you missed" summaries every 20 segments |
| Q&A Auto-Triage | `QaAutoTriageService.ts` | AI classification of questions (approved/duplicate/off-topic/compliance-risk) |
| Speaking Pace Coach | `SpeakingPaceCoachService.ts` | WPM analysis, filler word detection, delivery quality |
| Toxicity Filter | `ToxicityFilterService.ts` | Content moderation |
| Evasive Answer Detection | `EvasiveAnswerDetectionService.ts` | Detects evasive/non-answer responses |
| Live Subtitle Translation | `LiveSubtitleTranslationService.ts` | Real-time subtitle translation |
| Language Dubber | `LanguageDubber.ts` | AI language dubbing |
| Audio Enhancer | `AudioEnhancer.ts` | Audio quality enhancement |

#### Content & Communication Services
| Service | File | Purpose |
|---|---|---|
| Content Generation Trigger | `ContentGenerationTriggerService.ts` | AI-triggered content generation |
| Content Performance Analytics | `ContentPerformanceAnalyticsService.ts` | Content analytics |
| Social Media | `SocialMediaService.ts` | Social media posting and analytics |
| Personalization Engine | `PersonalizationEngine.ts` | Real-time operator suggestions based on engagement |
| Personalized Briefing | `PersonalizedBriefingService.ts` | Custom briefing generation |
| Event Brief Generator | `EventBriefGeneratorService.ts` | Event preparation briefs |
| Webcast Archive AI | `WebcastArchiveAiService.ts` | Post-event archive AI analysis |
| Webcast Recap | `WebcastRecapService.ts` | Event recap generation |
| Podcast Converter | `PodcastConverterService.ts` | Event-to-podcast conversion |
| Transcript Editor | `TranscriptEditorService.ts` | Transcript editing and versioning |
| Transcript Sync | `TranscriptSyncService.ts` | Transcript synchronization |

#### Infrastructure Services
| Service | File | Purpose |
|---|---|---|
| Ably Realtime | `AblyRealtimeService.ts` | Real-time pub/sub messaging |
| Conference Dialout | `ConferenceDialoutService.ts` | Twilio outbound dial-out for hybrid conferences |
| Virtual Studio | `VirtualStudioService.ts` | Branded broadcasting environment management |
| Platform Embed | `PlatformEmbedService.ts` | Embeddable widget configuration |
| Realtime Collaboration | `RealtimeCollaborationService.ts` | Multi-user collaboration |
| Knowledge Retrieval | `KnowledgeRetrievalService.ts` | Organizational knowledge search |
| Organizational Knowledge Graph | `OrganizationalKnowledgeGraphService.ts` | Knowledge graph construction |
| Redaction Workflow | `RedactionWorkflowService.ts` | Sensitive data redaction |
| Regulatory Intervention | `RegulatoryInterventionService.ts` | Regulatory intervention tracking |
| Multi-Modal Compliance | `MultiModalComplianceService.ts` | Multi-modal compliance analysis |
| Sustainability Optimizer | `SustainabilityOptimizer.ts` | ESG/sustainability metrics |
| Compliance Moderator | `ComplianceModerator.ts` | Real-time compliance moderation |
| Event Echo Pipeline | `EventEchoPipeline.ts` | Event data pipeline |

#### Business Services
| Service | File | Purpose |
|---|---|---|
| Aeos Quote-to-Cash | `AeosQuoteToCashService.ts` | Enterprise quote-to-cash workflow |
| Aeos Semantic API | `AeosSemanticApiService.ts` | Semantic search for organizational knowledge |
| Aeos Sovereign Data | `AeosSovereignDataService.ts` | Data sovereignty management |
| Bastion Booking | `BastionBookingService.ts` | Bastion partner booking |
| Lumi Booking | `LumiBookingService.ts` | Lumi partner booking |

---

## 11. AI INTELLIGENCE PIPELINE

### Layer 1: Transcript Capture
- **Shadow Mode** (`shadowModeRouter.ts`): Recall.ai bots join Zoom/Teams/Meet silently
- **Live Webcast** (`muxRouter.ts` + `audioIngest.ts`): FFmpeg pulls HLS audio, chunks to Whisper
- **Archive Upload** (`archiveUploadRouter.ts`): Upload pre-recorded audio/video for analysis

### Layer 2: Real-time Processing (`server/aiAnalysis.ts`)
As transcript segments arrive:
1. **Sentiment Scoring** - Financial-tuned LLM analysis every few segments
2. **Rolling Summaries** - "What you missed" (2-3 sentences) every 20 segments
3. **Q&A Auto-Triage** - Classifies: approved, duplicate, off-topic, compliance-risk
4. **Speaker Coaching** - WPM pace analysis, filler word detection, delivery quality

### Layer 3: Intelligence Synthesis (20-Module Report)
Upon session completion, `archiveUploadRouter.ts` orchestrates a massive prompt generating:

| Module # | Module Name | Output |
|---|---|---|
| 1 | Executive Summary | Board-ready verdict |
| 2 | Financial Metrics Extraction | Revenue, EPS, margins, guidance |
| 3 | ESG & Sustainability | Environmental/social/governance commitments |
| 4 | Risk Assessment | Material risks and mitigations |
| 5 | Compliance Flags | Regulatory disclosure requirements |
| 6 | Competitive Intelligence | Competitive positioning signals |
| 7 | Management Tone Analysis | Confidence, hedging, deflection patterns |
| 8 | Guidance Analysis | Forward-looking statement extraction |
| 9 | Q&A Quality Assessment | Response quality scoring |
| 10 | Investor Sentiment Signals | Buy/sell/hold signal inference |
| 11 | Key Personnel Changes | Leadership transition signals |
| 12 | M&A Signals | Merger/acquisition indicators |
| 13 | Capital Allocation | Buyback, dividend, capex signals |
| 14 | Sector Impact | Industry-wide implications |
| 15 | Regulatory Impact | Regulatory change implications |
| 16 | Social Media Content Pack | Draft posts for LinkedIn/Twitter/X |
| 17 | SENS/RNS Press Release | Exchange announcement draft |
| 18 | Analyst Action Items | Follow-up research topics |
| 19 | Board Action Items | Governance action requirements |
| 20 | Cross-Event Consistency | Narrative consistency vs. prior events |

**Chunking Logic:** For long events, creates "dense factual summaries" of 12,000-character chunks before synthesizing the final report.

### Layer 4: Specialized Intelligence Services
| Service | Purpose |
|---|---|
| Crisis Prediction | Evaluates sentiment trajectories + hedging language for financial/regulatory/reputational crises |
| Valuation Impact Oracle | Estimates Fair Value Gaps + share price impact from material disclosures |
| Disclosure Certificates | SHA-256 hash-chained immutable log linking transcript + AI report + compliance flags |
| Tagged Metrics | Structured numerical data (Sentiment, Engagement, Compliance Risk) for cross-event benchmarking |
| Evasive Answer Detection | Identifies non-answers and deflection in management Q&A |
| Communication Index | Communication quality scoring across dimensions |
| Market Impact Predictor | Predicts market reaction to disclosed information |
| Materiality Risk Oracle | Assesses materiality risk of disclosures |

### Layer 5: Meta-Intelligence & Self-Evolution
1. **Meta-Observer** (`AiEvolutionService.ts`): AI "observes" its own module outputs, scoring depth/breadth/specificity
2. **Gap Detection Matrix**: Identifies systematic blind spots across event types/clients
3. **AI Evolution Engine**: Autonomously proposes new AI tool capabilities when patterns detected
4. **Governance Gateway**: Proposals promoted through Stability/Consistency checks with immutable SHA-256 audit chain
5. **Aggregate Intelligence** (`aggregateIntelligence.ts`): Anonymized macro-sentiment and sector benchmarking

### LLM Configuration (`server/_core/llm.ts`)
- **Primary Model:** OpenAI GPT-4o
- **Forge Mode:** Gemini 2.5 Flash (via `BUILT_IN_FORGE_API_KEY`)
- **Features:** Tool/function calling, structured JSON output via `json_schema`, message normalization
- **Transcription:** OpenAI Whisper (via `server/_core/voiceTranscription.ts`)

---

## 12. SHADOW MODE SYSTEM

### Architecture
Shadow Mode enables CuraLive to silently observe external meetings (Zoom, Microsoft Teams, Google Meet) using AI bots, capturing real-time transcription and generating intelligence reports.

### Components
1. **Shadow Mode Router** (`server/routers/shadowModeRouter.ts`)
   - Session CRUD (create, list, get, delete)
   - Bot deployment via Recall.ai API
   - Transcript retrieval and AI report generation
   - Session status tracking: `pending` -> `joining` -> `live` -> `processing` -> `completed` -> `failed`

2. **Shadow Mode Guardian** (`server/services/ShadowModeGuardianService.ts`)
   - Background watchdog (60s interval)
   - Zombie session detection (bots stuck in joining/live states)
   - State recovery after server restarts
   - Graceful shutdown (marks active sessions for recovery)
   - Session reconciliation on startup

3. **Recall.ai Integration** (`server/recallRouter.ts`, `server/recallWebhook.ts`)
   - Bot deployment: POST to Recall.ai API with meeting URL
   - Webhook events: bot.status_change, transcript.data, recording.done
   - HMAC-SHA256 signature verification

### Shadow Mode UI Tabs (in `client/src/pages/ShadowMode.tsx`)
- **Sessions** - Active/completed shadow sessions list
- **Live Transcript** - Real-time transcript feed via Ably
- **AI Report** - 20-module intelligence report
- **Board Intelligence** - Board Intelligence Compass (sub-tabs: Overview, Commitments, Liabilities, Expectations, Actions)
- **Pre-Event Briefing** - Pre-Event Intelligence Briefing (sub-tabs: Consensus, Q&A, Hotspots, Readiness)
- **Compliance Monitor** - Regulatory Compliance Monitor (sub-tabs: Flags, Triggers, Jurisdictions, Actions)

### Database Tables
- `shadow_sessions` - Session tracking (meetingUrl, platform, status, transcriptJson, aiReport)
- `recall_bots` - Bot state (recallBotId, status, joinUrl)

---

## 13. WEBCAST & LIVE VIDEO SYSTEM

### Video Streaming Architecture
1. **Ingest:** RTMP push from OBS/vMix to `rtmps://global-live.mux.com:443/app` with unique `streamKey`
2. **Processing:** Mux handles transcoding, adaptive bitrate, recording
3. **Playback:** HLS via `https://stream.mux.com/{playbackId}.m3u8`
4. **AI Audio:** FFmpeg extracts HLS audio -> OpenAI Whisper -> Ably broadcast
5. **Low Latency:** `reduced_latency: true`, `reconnect_window: 60`

### Event Lifecycle
`draft` -> `scheduled` -> `live` -> `ended` -> `on_demand`

### Attendee Registration Flow
1. Attendee submits `WebcastRegistrationForm` (name, email, company)
2. Server generates 24-byte `attendeeToken`, stores in `webcast_registrations`
3. Confirmation email via Resend with:
   - Personalized `attendUrl` containing token (e.g., `/live-video/webcast/{slug}/attend?token={token}`)
   - ICS calendar invite attachment
4. Token verification on access, routes to `AttendeeEventRoom` (live) or on-demand recording

### Virtual Studio
- Centralized configuration for "Intelligent Broadcaster"
- AI Bundles: Investor Relations, Compliance & Risk, etc.
- Layouts: presenter-slides, panel-discussion
- Dynamic overlays: sentiment-gauge, compliance-indicator

### Broadcaster Intelligence
- Speaking pace analysis (WPM)
- Filler word detection
- Key moment identification (financial disclosures, guidance)
- Real-time operator suggestions via PersonalizationEngine

### Interactive Features
- Live Q&A with AI auto-triage moderation (approved/duplicate/off-topic/compliance-risk)
- Live polling with real-time results
- Real-time transcript display
- Slide synchronization via Ably
- Live subtitle translation

---

## 14. BRIDGE CONSOLE (TELEPHONY)

### Architecture
Professional telephony bridge for PSTN conference calling (Chorus Call/BroadData competitor).

### IVR Flow
1. Inbound call -> `POST /api/bridge/inbound`
2. Welcome TwiML prompt
3. Access code entry -> `POST /api/bridge/access-code` (validates against event)
4. Name/organization capture via recording -> `/api/bridge/name-captured`, `/api/bridge/org-captured`
5. Join conference or enter greeter queue (if auto-admit disabled)

### Operator Controls
- Mute/unmute individual participants
- Hold/unhold participants
- Remove participants from conference
- Lock/unlock conference
- Start/stop recording
- Auto-admit toggle
- Greeter queue management (admit from waiting room)
- DTMF hand-raising (*2)
- Recall.ai bot deployment for AI transcription

### Real-time Updates
- Ably channel: `bridge-{conferenceId}`
- Events: participant join/leave, mute state, speaking detection, recording status

### Error Handling (Hardened)
- `twilioHoldParticipant`: Throws on Twilio API failure (no false-success DB state)
- `twilioRemoveParticipant`: Throws on failure
- `deployRecallBot`: Throws on failure

### Database Tables
- `bridge_conferences` - Conference state (twilioConferenceSid, status, moderatorPin, participantPin, isLocked, isRecording)
- `bridge_participants` - Participant management (callSid, name, role, state, isMuted, isOnHold)
- `bridge_greeter_queue` - IVR waiting queue (callSid, name, status)

### Status: On Ice
Audio bridge telephony features are built but put on hold. UI and backend are functional.

---

## 15. STORAGE SYSTEM

### Architecture
Hybrid local/cloud storage with graceful fallback.

### Object Storage (Cloud)
- **Provider:** Forge API proxy (abstracts S3/cloud provider)
- **Upload:** POST to `{BUILT_IN_FORGE_API_URL}/v1/storage/upload?path={key}` with multipart/form-data
- **Download:** POST to `{BUILT_IN_FORGE_API_URL}/v1/storage/downloadUrl` returns pre-signed URL
- **Auth:** Bearer token via `BUILT_IN_FORGE_API_KEY`

### Upload Handlers
| Handler | File | Storage | Purpose |
|---|---|---|---|
| Recording Upload | `server/recordingUpload.ts` | Disk first, then cloud | Session recordings |
| Audio Upload | `server/audioUpload.ts` | Memory -> cloud | Audio library files |
| Slide Deck Upload | `server/slideDeckUpload.ts` | Memory -> cloud | Presentation slides |
| Avatar Upload | Inline in routers.ts | Cloud | User profile images |

### Recording Resolution Logic (`server/storageAdapter.ts`)
1. Check if Object Storage configured (`isObjectStorageConfigured()`)
2. If configured, try cloud URL (redirect to pre-signed URL)
3. If cloud fails or unconfigured, fallback to local disk (`./uploads/recordings/`)
4. Serve via `res.sendFile` for local files

### Local Storage Directories
- `./uploads/recordings/` - Session recordings
- `./exports/` - Generated export files (reports, documents)

---

## 16. REAL-TIME MESSAGING (ABLY)

### Server-Side
- **SDK Client:** `server/_core/ably.ts` (full Ably SDK)
- **REST Client:** Used in webhooks for performance (avoids SDK overhead)
- **Token Auth:** `ably.tokenRequest` tRPC procedure provides temporary client capabilities

### Client-Side
- **Context:** `client/src/contexts/AblyContext.tsx`
- **Hooks:** `useAblyChannel.ts`, `useAblySessions.ts`

### Channel Patterns
| Channel | Events | Purpose |
|---|---|---|
| `bridge-{conferenceId}` | participant-joined, participant-left, mute-changed, recording-status | Bridge console real-time |
| `transcript-{sessionId}` | segment | Live transcript segments |
| `sentiment-{sessionId}` | update | Real-time sentiment scores |
| `bot-status-{sessionId}` | status-change | Recall.ai bot state |
| `conference-{eventId}` | Various | OCC conference events |
| `voicemail:received` | new | Voicemail notifications |

---

## 17. EMAIL SYSTEM

### Provider: Resend
**File:** `server/_core/email.ts`

### Templates
1. **IR Summary Email** (`buildIRSummaryEmail`) - AI-generated investor relations summary
2. **Registration Confirmation** (`buildRegistrationConfirmationEmail`) - Event registration with ICS calendar attachment
3. **Event Reminder** - Automated reminders (24h + 1h before event)

### Scheduling
- `reminderScheduler.ts` runs every 60s
- Scans `attendee_registrations` for upcoming events
- Sends 24-hour and 1-hour reminders

### Fallback
If `RESEND_API_KEY` is missing, logs warning instead of crashing (graceful degradation for development).

---

## 18. FRONTEND ARCHITECTURE

### Core Stack
- **Framework:** React 19 with JSX transform
- **Build:** Vite 7.3.1 (root: `./client`, output: `dist/_app`)
- **Routing:** Wouter (lightweight, hook-based)
- **Styling:** Tailwind CSS 4 + Radix UI primitives + shadcn/ui
- **State:** TanStack React Query + tRPC React Query
- **Animations:** Framer Motion

### Application Shell (`client/src/App.tsx`)
- Global providers: Theme, Ably, React Query, tRPC
- Route definitions for 100+ pages
- Auth wrapping via `RequireAuth` component
- Error boundary wrapper

### Path Aliases (tsconfig.json)
```
@/* -> ./client/src/*
@shared/* -> ./shared/*
@assets -> ./attached_assets
```

### UI Component Library (`client/src/components/ui/`)
53 shadcn/ui components including:
accordion, alert-dialog, aspect-ratio, avatar, badge, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

### Contexts
| Context | File | Purpose |
|---|---|---|
| ThemeContext | `contexts/ThemeContext.tsx` | Light/dark mode management |
| AblyContext | `contexts/AblyContext.tsx` | Real-time messaging provider |

---

## 19. FRONTEND PAGES (COMPLETE - 208 FILES)

### Core Navigation
| Page | File | Route |
|---|---|---|
| Home/Landing | `Home.tsx` | `/` |
| Dashboard | `Dashboard.tsx` | `/` (authenticated) |
| Settings | `Settings.tsx` | `/settings` |
| Onboarding | `AIOnboarding.tsx` | `/onboarding` |

### Operator & Admin
| Page | File |
|---|---|
| Operator Console | `OperatorConsole.tsx` |
| Operator Hub | `OperatorHub.tsx` |
| Bridge Console | `BridgeConsole.tsx` |
| Summit Console | `SummitConsole.tsx` |
| Admin Dashboard | `AdminDashboard.tsx` |
| Admin Users | `AdminUsers.tsx` |
| Admin Clients | `AdminClients.tsx` |
| Admin Billing | `AdminBilling.tsx` |
| Admin Panel | `AdminPanel.tsx` |
| Training Mode Console | `TrainingModeConsole.tsx` |

### Events & Webcasting
| Page | File |
|---|---|
| Event Room | `EventRoom.tsx` |
| Event Calendar | `EventCalendar.tsx` |
| Event Scheduler | `EventScheduler.tsx` |
| Create Event Wizard | `CreateEventWizard.tsx` |
| Event Pass | `EventPass.tsx` |
| Event Brief Generator | `EventBriefGenerator.tsx` |
| Webcast Studio | `WebcastStudio.tsx` |
| Webcast Register | `WebcastRegister.tsx` |
| Webcast Analytics | `WebcastAnalytics.tsx` |
| Webcast Report | `WebcastReport.tsx` |
| Webcast Recap | `WebcastRecapPage.tsx` |
| Webcasting Hub | `WebcastingHub.tsx` |
| Attendee Event Room | `AttendeeEventRoom.tsx` |
| Attendee Room | `AttendeeRoom.tsx` |
| Attendee Q&A | `AttendeeQA.tsx` |
| Virtual Studio | `VirtualStudio.tsx` |
| Intelligent Broadcaster | `IntelligentBroadcasterPage.tsx` |
| Hybrid Conference | `HybridConference.tsx` |
| Live Video Meetings | `LiveVideoMeetings.tsx` |
| Slide Presenter | `SlidePresenter.tsx` |
| Conference Dialout | `ConferenceDialout.tsx` |

### AI & Intelligence
| Page | File |
|---|---|
| AI Dashboard | `AIDashboard.tsx` |
| Intelligence Suite | `IntelligenceSuite.tsx` |
| Intelligence Terminal | `IntelligenceTerminal.tsx` |
| Intelligence Report | `IntelligenceReport.tsx` |
| Agentic Brain | `AgenticBrain.tsx` |
| AI Shop | `AIShop.tsx` |
| AI Features Status | `AIFeaturesStatus.tsx` |
| Shadow Mode | `ShadowMode.tsx` |
| Archive Upload | `ArchiveUpload.tsx` |
| AGM Governance AI | `AgmGovernanceAi.tsx` |
| Autonomous Intervention | `AutonomousIntervention.tsx` |

### Analytics & Reporting
| Page | File |
|---|---|
| Analytics Dashboard | `AnalyticsDashboard.tsx` |
| Dashboard Analytics | `DashboardAnalytics.tsx` |
| Advanced Reporting | `AdvancedReporting.tsx` |
| Benchmarks | `Benchmarks.tsx` |
| Benchmarking Dashboard | `BenchmarkingDashboard.tsx` |
| Market Reaction | `MarketReaction.tsx` |
| Sentiment Dashboard | `SentimentDashboard.tsx` |
| Tagged Metrics | `TaggedMetricsDashboard.tsx` |
| Communication Index | `CommunicationIndex.tsx` |
| Interconnection Analytics | `InterconnectionAnalytics.tsx` |
| API Usage Dashboard | `ApiUsageDashboard.tsx` |

### Billing & Finance
| Page | File |
|---|---|
| Billing | `Billing.tsx` |
| Billing Preview | `BillingPreview.tsx` |
| Ageing Report | `AgeingReport.tsx` |
| Invoice Viewer | `InvoiceViewer.tsx` |
| Invoice View | `InvoiceView.tsx` |

### Compliance & Security (36 pages)
`ComplianceDashboard.tsx`, `ComplianceEngineDashboard.tsx`, `ComplianceReport.tsx`, `ComplianceAuditLog.tsx`, `ComplianceAuditTrail.tsx`, `ComplianceGapAnalysis.tsx`, `ComplianceMonitoringDashboard.tsx`, `ComplianceReportingDashboard.tsx`, `ComplianceReportExport.tsx`, `ComplianceAutomationWorkflows.tsx`, `AutomatedComplianceReporting.tsx`, `ISO27001Dashboard.tsx`, `SOC2Dashboard.tsx`, `ZeroTrustDashboard.tsx`, `HealthGuardian.tsx`, `SecurityPostureManagement.tsx`, `SecurityPostureBenchmarking.tsx`, `AdvancedThreatDetectionDashboard.tsx`, `AdvancedThreatHunting.tsx`, `ThreatIntelligenceDashboard.tsx`, `ThreatIntelligenceIntegration.tsx`, `ThreatIntelligenceIOC.tsx`, `ThreatResponseWorkflows.tsx`, `IncidentResponseAutomation.tsx`, `IncidentResponsePlaybook.tsx`, `IncidentTimeline.tsx`, `IncidentCorrelationEngine.tsx`, `VulnerabilityDashboard.tsx`, `SecurityRiskScoring.tsx`, `SecurityScorecardDashboard.tsx`, `SecurityMetricsKPIDashboard.tsx`, `SIEMIntegration.tsx`, `CICDSecurityDashboard.tsx`, `DataResidencyDashboard.tsx`, `IdentityAccessManagement.tsx`, `VendorRiskDashboard.tsx`, `SecurityTrainingAwareness.tsx`, `BackupDisasterRecoveryDashboard.tsx`, `FeatureFlagsDashboard.tsx`, `AutomatedIncidentResponse.tsx`, `ContinuousSecurityMonitoring.tsx`, `ExecutiveSecurityMetrics.tsx`, `SecurityMetricsExport.tsx`, `SecurityMetricsReportingDashboard.tsx`, `SecurityOrchestrationResponse.tsx`, `SecurityVendorEcosystem.tsx`, `SecurityVulnerabilityManagement.tsx`

### Investor & Client
`ClientPortal.tsx`, `ClientLiveDashboard.tsx`, `InvestorFollowUps.tsx`, `InvestorQuestionIntelligence.tsx`, `InvestorWaitingRoom.tsx`, `CallPreparation.tsx`, `BastionPartner.tsx`, `Bastion.tsx`, `LumiPartner.tsx`, `RoadshowDetailPage.tsx`, `BookingsEnhanced.tsx`

### Content & Social
`SocialMediaPage.tsx`, `MailingListManager.tsx`, `MailingListConfirm.tsx`, `SustainabilityDashboard.tsx`, `ToxicityFilterDashboard.tsx`, `TranscriptEditor.tsx`, `TranscriptPage.tsx`

### Miscellaneous
`BrandingSettings.tsx`, `ComponentShowcase.tsx`, `Demo.tsx`, `DemoRegistration.tsx`, `BookDemo.tsx`, `DevelopmentDashboard.tsx`, `EmbeddableQaWidget.tsx`, `EmbedWidget.tsx`, `FeatureMap.tsx`, `FeatureDetail.tsx`, `BundleDetail.tsx`, `IntegrationHub.tsx`, `ExternalToolsIntegration.tsx`, `WebhookManager.tsx`, `TemplateBuilder.tsx`, `WorkflowsPage.tsx`, `PostEvent.tsx`, `PlatformEmbed.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `NotFound.tsx`, `TechHandover.tsx`, `AlertDashboard.tsx`, `SyncTest.tsx`, `TestGuide.tsx`, `TwilioDirectGuide.tsx`, `Training.tsx`, `TrainingPlatform.tsx`, `TrainingSubPage.tsx`, `ModeratorQAConsole.tsx`

---

## 20. FRONTEND COMPONENTS (COMPLETE - 75+ BUSINESS COMPONENTS)

### AI & Intelligence Components
| Component | File | Purpose |
|---|---|---|
| AIChatBox | `AIChatBox.tsx` | AI conversational interface |
| AIDashboard | `AIDashboard.tsx` | AI metrics dashboard |
| AIApplicationsSection | `AIApplicationsSection.tsx` | AI apps catalog |
| BoardIntelligenceCompass | `BoardIntelligenceCompass.tsx` | Board intelligence UI with sub-tabs (Overview/Commitments/Liabilities/Expectations/Actions) |
| PreEventIntelligenceBriefing | `PreEventIntelligenceBriefing.tsx` | Pre-event briefing UI (Consensus/Q&A/Hotspots/Readiness) |
| RegulatoryComplianceMonitor | `RegulatoryComplianceMonitor.tsx` | Regulatory compliance UI (Flags/Triggers/Jurisdictions/Actions) |
| InsightsPanel | `InsightsPanel.tsx` | AI insights display |
| BriefingPackPanel | `BriefingPackPanel.tsx` | Briefing pack viewer |
| EventBriefPanel | `EventBriefPanel.tsx` | Event brief display |

### Live Session Components
| Component | File | Purpose |
|---|---|---|
| LiveTranscriptFeed | `LiveTranscriptFeed.tsx` | Real-time transcript display |
| LiveTranscriptDisplay | `LiveTranscriptDisplay.tsx` | Transcript viewer |
| LiveQaDashboard | `LiveQaDashboard.tsx` | Live Q&A management |
| LiveQuestionBox | `LiveQuestionBox.tsx` | Question submission |
| LivePolling | `LivePolling.tsx` | Live poll display |
| LivePoll | `LivePoll.tsx` | Individual poll |
| LiveRollingSummaryPanel | `LiveRollingSummaryPanel.tsx` | Rolling summary display |
| LiveSessionPanel | `LiveSessionPanel.tsx` | Active session info |
| RollingSummaryPanel | `RollingSummaryPanel.tsx` | Summary viewer |
| SentimentTrendChart | `SentimentTrendChart.tsx` | Sentiment visualization |
| CommitmentSignalPanel | `CommitmentSignalPanel.tsx` | Commitment signals |

### Operator & Conference Components
| Component | File | Purpose |
|---|---|---|
| OccRealtimeUpdates | `OccRealtimeUpdates.tsx` | Real-time OCC updates |
| ParticipantStatusDashboard | `ParticipantStatusDashboard.tsx` | Participant state display |
| MutingControlPanel | `MutingControlPanel.tsx` | Mute controls |
| RecallAiBot | `RecallAiBot.tsx` | Recall.ai bot controls |
| RecallBotPanel | `RecallBotPanel.tsx` | Bot status panel |
| MuxStreamPanel | `MuxStreamPanel.tsx` | Mux stream controls |

### Communication Components
| Component | File | Purpose |
|---|---|---|
| Webphone | `Webphone.tsx` | Full webphone interface |
| WebPhoneCallManager | `WebPhoneCallManager.tsx` | Call management |
| WebPhoneJoinInstructions | `WebPhoneJoinInstructions.tsx` | Join instructions |
| WebphoneActivityCard | `WebphoneActivityCard.tsx` | Call activity card |

### Content & Media Components
| Component | File | Purpose |
|---|---|---|
| AccessibleVideoPlayer | `AccessibleVideoPlayer.tsx` | Accessible video player |
| EventReplayPlayer | `EventReplayPlayer.tsx` | Event recording playback |
| TranscriptEditor | `TranscriptEditor.tsx` | Transcript editing UI |
| TranscriptViewer | `TranscriptViewer.tsx` | Transcript display |
| ContentGenerationTrigger | `ContentGenerationTrigger.tsx` | AI content trigger UI |
| WebcastRecapGenerator | `WebcastRecapGenerator.tsx` | Recap generator |
| WebcastRegistrationForm | `WebcastRegistrationForm.tsx` | Registration form |
| IntelligentBroadcasterPanel | `IntelligentBroadcasterPanel.tsx` | Broadcaster AI panel |

### Social & Analytics Components
| Component | File | Purpose |
|---|---|---|
| SocialAnalyticsDashboard | `SocialAnalyticsDashboard.tsx` | Social analytics |
| SocialMediaLinking | `SocialMediaLinking.tsx` | Social account linking |
| SocialPostCreator | `SocialPostCreator.tsx` | Post creation |
| InterconnectionGraph | `InterconnectionGraph.tsx` | Feature interconnection visualization |
| InterconnectionModal | `InterconnectionModal.tsx` | Interconnection details |
| EngagementDashboard | `EngagementDashboard.tsx` | Engagement metrics |

### UI Infrastructure Components
| Component | File | Purpose |
|---|---|---|
| DashboardLayout | `DashboardLayout.tsx` | Main layout with sidebar navigation |
| DashboardLayoutSkeleton | `DashboardLayoutSkeleton.tsx` | Loading skeleton |
| ErrorBoundary | `ErrorBoundary.tsx` | Error boundary wrapper |
| RequireAuth | `RequireAuth.tsx` | Auth guard component |
| RealtimeEventUpdates | `RealtimeEventUpdates.tsx` | Real-time update wrapper |
| NotificationCenter | `NotificationCenter.tsx` | Notification display |
| AlertFeed | `AlertFeed.tsx` | Alert notifications |
| ExportDialog | `ExportDialog.tsx` | Export options dialog |
| FeedbackForm | `FeedbackForm.tsx` | User feedback form |
| FollowUpEmailDrafter | `FollowUpEmailDrafter.tsx` | Email draft UI |
| Map | `Map.tsx` | Google Maps integration |
| PollManager | `PollManager.tsx` | Poll management |
| PollResults | `PollResults.tsx` | Poll results display |
| PollWidget | `PollWidget.tsx` | Embeddable poll |
| ProviderStateIndicator | `ProviderStateIndicator.tsx` | Service status indicator |
| ServiceStatusPanel | `ServiceStatusPanel.tsx` | Service health panel |
| SpeakerProfileCard | `SpeakerProfileCard.tsx` | Speaker info card |
| SystemDiagnostics | `SystemDiagnostics.tsx` | System diagnostics panel |
| BrandingEditor | `BrandingEditor.tsx` | Branding customization |
| CustomisationPortal | `CustomisationPortal.tsx` | Client customization |
| ComplianceDashboard | `ComplianceDashboard.tsx` | Compliance overview |
| ComplianceMonitor | `ComplianceMonitor.tsx` | Real-time compliance |

---

## 21. FRONTEND HOOKS & UTILITIES

### Custom Hooks (`client/src/hooks/`)
| Hook | File | Purpose |
|---|---|---|
| useAblyChannel | `useAblyChannel.ts` | Subscribe to Ably channels with auto-cleanup |
| useAblySessions | `useAblySessions.ts` | Track active Ably sessions |
| useComposition | `useComposition.ts` | Input composition state (CJK support) |
| useKeyboardShortcuts | `useKeyboardShortcuts.ts` | Keyboard shortcut registration |
| useMetricsWebSocket | `useMetricsWebSocket.ts` | WebSocket metrics streaming |
| useMobile | `useMobile.tsx` | Responsive breakpoint detection |
| usePersistFn | `usePersistFn.ts` | Stable function reference |

### Core Hooks (`client/src/_core/hooks/`)
| Hook | Purpose |
|---|---|
| useAuth | Authentication state management |

### Libraries (`client/src/lib/`)
| File | Purpose |
|---|---|
| trpc.ts | tRPC client configuration (createTRPCReact, httpBatchLink, superjson transformer) |
| utils.ts | Utility functions (cn = clsx + tailwind-merge) |
| useSmartBack.ts | Smart navigation back (history-aware) |

### Services (`client/src/services/`)
| File | Purpose |
|---|---|
| sessionAutoSave.ts | Auto-persist session data to localStorage |

### Audio Integrations (`client/replit_integrations/audio/`)
| File | Purpose |
|---|---|
| audio-utils.ts | Audio utility functions |
| audio-playback-worklet.js | AudioWorklet for playback |
| useAudioPlayback.ts | Audio playback hook |
| useVoiceRecorder.ts | Voice recording hook |
| useVoiceStream.ts | Voice streaming hook |
| index.ts | Audio integration barrel export |

---

## 22. BUILD, DEV & DEPLOYMENT

### Package Scripts
```json
{
  "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build --logLevel warn && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js",
  "check": "NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:coverage": "c8 vitest run",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "db:push": "drizzle-kit generate && drizzle-kit migrate",
  "check:routers": "node scripts/check-router-sync.mjs"
}
```

### Build Pipeline
1. **Frontend:** Vite builds React app to `dist/_app/` (4GB max heap for large codebase)
2. **Backend:** esbuild bundles `server/_core/index.ts` to `dist/index.js` (ESM format, external packages)
3. **Production:** `node dist/index.js` serves both API and static files

### Dev Server
- `tsx watch` provides hot-reload for server changes
- Vite dev server proxied for frontend HMR
- Mockup sandbox on port 23636

### TypeScript Configuration
- `compilerOptions.paths`: `@/*` -> `client/src/*`, `@shared/*` -> `shared/*`
- `include`: `["client", "server", "shared"]`
- ESM module system

### Rate Limiting
| Endpoint | Production | Development |
|---|---|---|
| API / tRPC | 120 req/min | 500 req/min |
| Auth routes | 20 req/15min | 200 req/15min |

---

## 23. SCRIPTS & MIGRATIONS

### Database Scripts (`scripts/`)
These scripts use raw SQL via `pg` Pool for creating tables that were added incrementally:

| Script | Purpose |
|---|---|
| `create-missing-tables.ts` | Creates ai_generated_content, occ_transcription_segments, occ_live_rolling_summaries, qa_auto_triage_results, speaking_pace_analysis, toxicity_filter_results, transcript_edits, event_brief_results |
| `create-agentic-brain-table.ts` | Creates agentic_brain_decisions |
| `create-aggregate-intelligence-table.ts` | Creates aggregate_intelligence |
| `create-agm-tables.ts` | Creates AGM governance tables |
| `create-ai-evolution-tables.ts` | Creates AI evolution proposals/governance/tools tables |
| `create-archive-events-table.ts` | Creates archive events table |
| `create-autonomous-interventions-table.ts` | Creates autonomous interventions table |
| `create-bastion-tables.ts` | Creates Bastion investor tables |
| `create-call-preparations-table.ts` | Creates call preparations table |
| `create-cip4-tables.ts` | Creates CIP4 patent module tables |
| `create-communication-index-table.ts` | Creates communication index table |
| `create-compliance-engine-tables.ts` | Creates compliance engine tables |
| `create-compliance-framework-tables.ts` | Creates compliance framework tables |
| `add-ai-report-column.ts` | Adds AI report column to existing tables |
| `add-choruscall-platform.ts` | Adds ChorusCall platform support |
| `add-event-id-to-archive.ts` | Adds eventId to archive table |
| `add-interim-results-type.ts` | Adds interim results type |
| `add-join-method-columns.ts` | Adds join method tracking columns |
| `add-local-recording-column.ts` | Adds local recording path column |
| `add-local-transcript-column.ts` | Adds local transcript column |
| `update-sentiment-table.ts` | Adds columns to sentiment_snapshots |
| `check-router-sync.mjs` | Verifies routers.eager.ts and routers.ts are in sync |

### Migration Pattern
```typescript
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(`CREATE TABLE IF NOT EXISTS table_name (...)`);
```

### Drizzle Migrations
Standard Drizzle migration files in `drizzle/migrations/` directory, generated via `drizzle-kit generate` and applied via `drizzle-kit migrate`.

---

## 24. FILE MANIFEST

### Total File Counts
| Category | Count |
|---|---|
| Frontend Pages | 208 |
| Frontend Business Components | 75+ |
| Frontend UI Components (shadcn) | 53 |
| Frontend Hooks | 8 |
| Backend Router Files | 100+ |
| Backend Service Files | 59 |
| Database Tables | 100+ |
| tRPC Router Keys | 90+ |
| Environment Variables | 25+ |
| Documentation Files | 30+ |
| Migration Scripts | 20+ |

### Critical Files for Clone
1. `package.json` - All dependencies
2. `pnpm-workspace.yaml` - Monorepo config
3. `tsconfig.json` - TypeScript config with path aliases
4. `vite.config.ts` - Build configuration
5. `drizzle.config.ts` - Database ORM config
6. `drizzle/schema.ts` - Complete database schema
7. `drizzle/relations.ts` - Table relationships
8. `server/_core/index.ts` - Server entry point
9. `server/_core/trpc.ts` - tRPC setup + auth procedures
10. `server/_core/context.ts` - tRPC context
11. `server/_core/sdk.ts` - OAuth/JWT SDK
12. `server/_core/env.ts` - Environment config
13. `server/_core/llm.ts` - LLM integration (GPT-4o + Gemini)
14. `server/_core/email.ts` - Resend email
15. `server/_core/ably.ts` - Real-time messaging
16. `server/routers.ts` - Router registry
17. `server/routers.eager.ts` - Eager router registry (MUST stay in sync)
18. `server/db.ts` - Database connection
19. `client/src/App.tsx` - Frontend routing
20. `client/src/main.tsx` - Frontend entry
21. `shared/const.ts` - Shared constants
22. All `scripts/create-*.ts` - Table creation scripts

### Clone Procedure
1. Copy entire codebase
2. Set up PostgreSQL database
3. Configure all environment variables (Section 4)
4. Run `pnpm install`
5. Run `pnpm run db:push` for Drizzle tables
6. Run all `scripts/create-*.ts` for supplementary tables
7. Seed jurisdiction profiles (6 profiles for regulatory compliance)
8. Run `pnpm run dev` for development or `pnpm run build && pnpm run start` for production

---

*End of CuraLive Platform Complete Technical Brief*
