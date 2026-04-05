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