# CuraLive Platform

## Overview

CuraLive is a patented, real-time investor events intelligence platform designed to make regulated corporate communication events intelligent, compliant, and actionable. It offers live webcasting, telephony bridge conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services. The platform aims for strategic acquisition within 2-3 years and generates alternative data for fund managers via its CuraLive Weighted Sentiment Index (CWSI). Key channel partners like Lumi Global and Bastion Group leverage CuraLive for thousands of events annually.

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

The CuraLive platform is a pnpm monorepo built with TypeScript, featuring a React frontend and a Node.js backend, integrated with a separate Python FastAPI service for AI intelligence.

### Frontend
- **Technology Stack**: React, Vite, TailwindCSS, Framer Motion, Radix UI, TanStack React Query, tRPC React Query, Recharts, Chart.js, React Hook Form with Zod, Sonner, Lucide React, Wouter.
- **Client Pages**: `/live/:token`, `/report/:token`, `/presenter/:token`, `/qa/:accessCode`, `/virtual-studio`, `/feature-map` provide real-time data, reporting, Q&A, and partner branding.

### Backend (Node.js)
- **Core Technologies**: Node.js (20+), Express, tRPC Server (110 routers), Drizzle ORM with PostgreSQL (208 tables).
- **Authentication**: JWT cookie sessions, OAuth, and a role-based access control system (viewer, operator, admin).
- **Storage**: Unified `storageAdapter.ts` with Replit forge API and local disk fallback.
- **Background Services**: Seven auto-starting services manage infrastructure monitoring, compliance, event scheduling, session recovery, and conference orchestration.
- **White-Labeling**: `brandConfig.ts` middleware applies partner-specific branding and custom domains based on incoming domain.
- **Core Features**:
    - **Shadow Mode Operator Console**: 11 live tabs including Live Intelligence, Archives & Reports, AI Dashboard, Live Q&A (with AI triage), Board Compass, Compliance Monitor, and System Diagnostics.
    - **Intelligence Tiers**: Essential, Intelligence, Enterprise, and AGM tiers offer varying live dashboard features and post-event reporting.
    - **AI Report Pipeline**: Generates 10-module intelligence reports post-session, stored in `archive_events.ai_report`.

### AI Core (Python FastAPI)
- **Location**: `curalive_ai_core/` directory, running on Python 3.12 with FastAPI, SQLAlchemy 2.0, psycopg3.
- **Functionality**:
    - **Event Ingestion**: Normalizes raw event data into a canonical model.
    - **AI Analysis Modules**: Sentiment, Engagement, Compliance Signals, Commitment Extraction.
    - **Job Management**: Tracks analysis jobs, status, and module outputs.
    - **Commitment Drift Detection**: Identifies semantic, numerical, timing, and directional inconsistencies in commitments.
    - **Stakeholder Intelligence & Pre-Event Briefing**: Generates structured briefings and analyzes stakeholder signals.
    - **Governance Record Generation**: Creates structured governance records including meeting summaries, commitment registers, and risk/compliance summaries.
    - **Institutional Knowledge Profile**: Builds 6-dimension organizational profiles from all data sources.
    - **Internal Benchmarking**: Aggregates event/organization data into baselines for benchmarking and sector enrichment.
- **Integration**: Node.js backend communicates with the AI Core via `AICoreClient.ts` and `AICorePayloadMapper.ts`, with results persisted in `shadow_sessions` table.
- **Pipeline Observability**: Tracks every step of the AI pipeline with timing, status, and error details, stored in `ai_pipeline_trace`.

### Operator Dashboard
- **Route**: `/operator/dashboard` — operator-only dashboard for internal testing.
- **Router**: `server/routers/operatorDashboardRouter.ts` — 10 tRPC procedures (all `operatorProcedure`).
- **Frontend**: `client/src/pages/OperatorDashboard.tsx` — 5 panels: Command, Sessions, Customers, Reports, Billing.
- **Canonical session table**: `shadow_sessions` (not `sessions` or `shadow_mode_sessions`).
- **Canonical report source**: `archive_events.ai_report`.
- **Organisations table**: `organisations` with status/billing_type/subscription_amount/per_event_price/ir_contact_email/billing_contact_email/pilot_notes.
- **Billing automation**: `server/services/SubscriptionBillingService.ts` — monthly subscription invoicing on 1st of each month.
- **approveAndSendReport**: Idempotent mutation — checks status, validates IR contact, sends email via `sendEmail()`, creates adhoc invoice if applicable.

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **Ably**: Real-time pub/sub messaging.
- **Recall.ai**: AI bot deployment for conferencing platforms.
- **Mux**: RTMP/HLS video streaming.
- **OpenAI**: GPT-4o for AI analysis, Whisper for transcription.
- **Twilio**: PSTN telephony, IVR, SIP, WebRTC.
- **Telnyx**: Failover voice carrier.
- **Stripe**: Payment processing.
- **Resend**: Transactional email and ICS calendar invites.
- **AWS S3**: Object storage.