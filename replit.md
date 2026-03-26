# CuraLive Platform

## Overview

A real-time investor events intelligence platform (CIPC Patent App ID 1773575338868 — 75 claims, 35 modules) providing live transcription, sentiment analysis, smart Q&A, AI summaries, compliance monitoring, and telephony for earnings calls, board briefings, and webcasts.

- **GitHub**: https://github.com/davecameron187-sys/curalive-platform (source of truth)
- **Branches**: `main` (prod) → `shadow-mode` (shadow) → `develop` (staging)
- **Replit deploys from GitHub branches; do NOT edit `.replit` from GitHub/Codespaces**

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS 4 + tRPC client + shadcn/ui
- **Backend**: Express + tRPC server (`server/_core/index.ts`)
- **Database**: PostgreSQL 16 via Drizzle ORM + `pg` driver
- **Build system**: pnpm + tsx (dev), esbuild (prod)
- **AI**: OpenAI GPT-4 + Whisper (via `server/replit_integrations/`)
- **Real-time**: Ably pub/sub, Recall.ai meeting bots, Mux video

## Structure

```text
curalive-platform/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Page components
│       ├── components/      # Shared UI components
│       ├── hooks/           # Custom React hooks
│       ├── contexts/        # React context providers
│       └── lib/             # Utilities
├── server/                  # Express + tRPC backend
│   ├── _core/               # Server entry, Vite middleware, OAuth
│   ├── routers/             # tRPC routers
│   ├── services/            # Business logic services
│   ├── webhooks/            # Webhook handlers
│   ├── webphone/            # Twilio/Telnyx telephony
│   └── replit_integrations/ # OpenAI integration wrappers
├── shared/                  # Shared types and constants
├── drizzle/                 # DB schema and migrations
├── scripts/                 # Utility scripts
├── public/                  # Static assets
├── artifacts/               # Replit artifact wrappers
│   ├── api-server/          # CuraLive deployment artifact (kind: web)
│   └── mockup-sandbox/      # Design preview sandbox
└── attached_assets/         # Uploaded assets
```

## Critical Development Rules

1. **Router registration**: New tRPC routers must be added in BOTH `server/routers.eager.ts` AND `server/routers.ts`
2. **tRPC imports**: Always use `"../_core/trpc"` for tRPC imports
3. **Toast notifications**: Use `sonner` only — no other toast libraries
4. **rawSql()** in `server/db.ts` auto-appends `RETURNING id` and translates MySQL `?` to `$1/$2`
5. **attendee_registrations**: Uses camelCase columns (`"createdAt"`, `"eventId"`) — must double-quote in raw SQL
6. **ai_am_audit_log.timestamp**: Is `bigint` (epoch ms), not a date column
7. **Schema sync**: Use `drizzle-kit push --force` (NOT `pnpm run db:push` — migration files have MySQL syntax). Never write manual SQL migrations.
8. **Health monitoring tables** (`health_checks`, `health_incidents`, `health_incident_reports`, `health_baselines`): Created via raw SQL, not in Drizzle schema. Timestamp columns must be `TIMESTAMP` type (the rawSql layer converts to Date strings)
9. **Server binding**: Must bind to `0.0.0.0` (not localhost) — Replit proxy can't reach localhost
10. **Health endpoint**: `/health` must always exist — Replit deployment checks it
11. **Never change primary key ID column types** (serial ↔ varchar) — breaks existing data
12. **Do NOT edit `.replit` file from code** — use Replit UI only
13. **Do NOT set `AUTH_BYPASS=true` in production** secrets

## Key Scripts

- `pnpm run dev` — Start development server (tsx watch, port from `PORT` env or 3000)
- `pnpm run build` — Production build (Vite + esbuild → `dist/`)
- `pnpm run start` — Start production server (`node dist/index.js`)
- `drizzle-kit push --force` — Sync database schema

## Ports (Replit)

- **Development**: `PORT` env var (default 3000, configured in artifact.toml)
- **Production/Deployment**: `PORT` env var (default 3000, set by artifact.toml)
- Server binds to `0.0.0.0` (required for Replit health checks)
- Original GitHub project uses port 5000 (dev) / 23636 (prod)

## UI Pages / Routes

- **`/`** — Unified Operator Dashboard with tabs: Overview, Shadow Mode, Events, Partners, Billing, Settings
- **`/intelligence-suite`** — Intelligence Suite with 11 AI algorithms
- **`/event/:id`** — Event room
- **`/m/:eventId`** — Attendee room
- **`/operator/:id`** — Operator console
- **`/operator-dashboard`** — Operator dashboard
- **`/operator-links`** — Operator links directory
- **`/qa/:accessCode`** — Public attendee Q&A (webphone link)
- **`/post-event/:id`** — Post-event report
- **`/transcript/:id/edit`** — Transcript editor
- **`/ai-dashboard`** — AI analytics dashboard
- **`/agentic-brain`** — 3-question wizard → AI action plan
- **`/virtual-studio`** — Virtual production studio
- **`/admin/panel`** — Admin panel
- **`/billing`** — Billing page
- **`/live-video/webcast/:slug`** — Webcast studio

Shadow Mode sub-tabs: Live Intelligence, Archive Upload, Reports, AI Learning, AI Dashboard, Advisory, Diagnostics, Live Q&A

## Key Integrations

- **Twilio/Telnyx** — Telephony and WebRTC
- **Ably** — Real-time pub/sub messaging
- **Mux** — Video streaming
- **OpenAI** — AI analysis and transcription (via Replit AI integrations proxy)
- **Stripe** — Billing
- **Resend** — Email
- **Replit Object Storage** — File/recording storage (GCS-backed, replaced AWS S3)
- **Recall.ai** — Meeting bot deployment

## Environment Variables

Core (auto-provisioned by Replit):
- `DATABASE_URL` / `PG*` — PostgreSQL connection

Configured secrets:
- `RECALL_AI_API_KEY` — Recall.ai for bot deployment
- `MUX_WEBHOOK_SECRET` — Mux webhook verification
- `JWT_SECRET` — Session cookie signing
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — Replit Object Storage (replaces AWS S3)

Optional (not yet configured — user manages these credentials directly, not via Replit integrations):
- `OAUTH_SERVER_URL` — OAuth server URL
- `ABLY_API_KEY` — Real-time messaging
- `TWILIO_*` / `TELNYX_*` — Telephony
- `STRIPE_SECRET_KEY` — Billing (user dismissed Replit Stripe integration)
- `RESEND_API_KEY` — Email (user dismissed Replit Resend integration)

Note: Stripe, Resend, and Twilio Replit integrations were dismissed by the user. Provide API keys as secrets directly when ready.

## tRPC Routers (99 total — 89 imported + 10 inline)

All registered in BOTH `server/routers.ts` AND `server/routers.eager.ts`:

- **Core (9)**: aiRouter, auth, billing, rbac, systemDiagnostics, admin, team, profile, events
- **Shadow Mode (3)**: shadowModeRouter, recallRouter, archiveUploadRouter
- **AI Intelligence (8)**: aiAm, aiAmPhase2, aiDashboard, aiFeatures, aiApplications, aiEvolution, adaptiveIntelligence, agenticEventBrain
- **Compliance (8)**: complianceEngine, compliance, soc2, iso27001, disclosureCertificate, multiModalCompliance, regulatoryIntervention, eventIntegrity
- **Sentiment & Analytics (8)**: sentiment, externalSentiment, analytics, benchmarks, interconnectionAnalytics, communicationIndex, marketReaction, marketImpactPredictor
- **Event Management (11)**: scheduling, eventBrief, postEventReport, webcast, virtualStudio, broadcaster, liveQa, polls, liveRollingSummary, liveSubtitle, liveVideo
- **OCC & Telephony (3)**: occ, webphone, conferenceDialout
- **Investment Intel (13)**: investorEngagement, investorIntent, investorQuestions, ipoMandA, valuationImpact, crisisPrediction, crossEventConsistency, volatilitySimulator, roadshowAI, evasiveAnswer, callPrep, personalizedBriefing, materialityRisk
- **Business (11)**: clientPortal, customisation, branding, supportChat, advisoryBot, mailingList, mobileNotifications, socialMedia, sustainability, intelligenceReport, intelligenceTerminal
- **Platform (18)**: ably, bot, operatorLinks, trainingMode, mux, crmApi, platformEmbed, contentTriggers, taggedMetrics, monthlyReport, transcriptEditor, transcription, followups, healthGuardian, autonomousIntervention, evolutionAudit, bastionBooking, lumiBooking
- **Inline (6)**: agmGovernance, persistence, pressRelease, registrations, events (inline), ably (inline)

## REST Endpoints (non-tRPC)

- `GET /health` — Health check (returns `{ status: "ok", timestamp: "..." }`)
- `GET /api/ably-token` — Ably token generation for real-time
- `GET /api/archives/:id/transcript` — Download transcript as `.txt` file
- `GET /api/archives/:id/recording` — Download recording as `.mp3` file
- `POST /api/webphone/twiml` — Outbound WebRTC calls
- `POST /api/webphone/inbound` — Smart routing to operators/voicemail
- `POST /api/webphone/voicemail-status` — Voicemail recording capture
- `POST /api/conference-dialout/twiml` — Conference participant TwiML
- `POST /api/conference-dialout/status` — HMAC-verified status updates
- `POST /api/voice/inbound` — IVR greeting + 5-digit PIN collection
- `POST /api/voice/pin` — PIN validation for auto-admit
- `POST /api/recall/webhook` — Recall.ai bot webhooks (HMAC-verified)
- `POST /api/shadow/recording/:sessionId` — Upload local recordings
- `POST /api/upload/slide-deck` — Slide deck upload
- `POST /api/upload/recording` — Recording upload
- `POST /api/transcribe/audio` — Audio transcription
- `GET/POST /api/oauth/callback` — OpenID authentication callback

## Background Services

Started automatically when the server launches:
- **HealthGuardian** — Monitors system health and uptime
- **ComplianceEngine** — Monitors regulatory controls, seeds SOC 2 / ISO 27001 data
- **ShadowModeGuardian** — Reconciles active bot sessions on startup and shutdown
- **Reminder & Audit Schedulers** — Automated notifications and compliance digests

Graceful shutdown: Listens for SIGTERM/SIGINT, reconciles active Shadow Mode sessions before exit.

## Deployment

- **Artifact**: `artifacts/api-server` (kind: web, previewPath: `/`)
- **Build**: `vite build` + `esbuild` → `dist/`
- **Run**: `NODE_ENV=production node dist/index.js`
- **Target**: Autoscale
- **Health check**: `GET /health` returns `{ status: "ok" }` (registered early, before heavy middleware)
- Server listens on `0.0.0.0:PORT`

## Database Backup

`database-backup.json` in the repo contains data from the previous project. Can be restored when needed.
