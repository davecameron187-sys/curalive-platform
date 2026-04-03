# CuraLive Platform

## Overview

CuraLive is a patented real-time investor events intelligence platform that integrates live webcasting, telephony conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services. Its core purpose is to make corporate communication events intelligent, compliant, and actionable. The platform operates with a "one link, any platform, zero client-side integration" model, joining any meeting like a human participant. It aims for a strategic acquisition target of $80M–$120M within 24–36 months, with potential acquirers including Microsoft, Bloomberg, and Nasdaq. The platform also includes a data flywheel for alternative data business through its CuraLive Weighted Sentiment Index (CWSI).

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

## System Architecture

### Core Capabilities
CuraLive offers one-link connection, multi-path platform connectivity (Recall.ai, RTMP, Zoom RTMS), live webcasting, a telephony bridge console, AI-powered real-time transcription, silent AI observation (Shadow Mode), 20-module AI intelligence reports, a crisis prediction engine, valuation impact oracle, disclosure certificates with blockchain audit trails, board intelligence compass, pre-event intelligence briefings, an AI self-evolution engine, enterprise billing, and a full compliance engine (ISO 27001, SOC 2, SEC/FCA/ASIC/SGX/HKEX/JSE).

### Frontend
- **Framework**: React 19.2.1 with Vite 7.3.1 and TypeScript 5.9.3.
- **Styling**: TailwindCSS 4.1.14, Framer Motion 12.23.22, Radix UI primitives.
- **State Management**: TanStack React Query 5.90.2, tRPC React Query 11.6.0.
- **UI Components**: Recharts, Chart.js for charts; Sonner for toasts; Lucide React for icons; React Hook Form with Zod for forms.
- **Routing**: Wouter 3.3.5 for navigation across dashboards, webcast studios, bridge consoles, client-facing reports, and presenter screens.

### Backend
- **Runtime**: Node.js 20+, Express 4.21.2, tRPC Server 11.6.0 (96+ routers).
- **Database**: Drizzle ORM 0.44.5 with PostgreSQL (pg 8.20.0), managing over 100 tables.
- **Build System**: pnpm monorepo, tsx for development, esbuild for production.
- **Authentication**: JWT cookie sessions with OAuth and role-based access control (viewer, operator, admin).
- **Storage**: Unified `storageAdapter.ts` using Replit forge API (primary) or local disk.
- **AI Integration**: Dual-provider transcription with Gemini AI (primary) and Whisper (fallback) via Replit AI Integrations proxy.

### AI Intelligence Pipeline
The platform utilizes a 5-layer AI pipeline:
1.  **Transcript Capture**: Via Recall.ai bots, FFmpeg audio extraction from HLS, archive uploads, or direct text input.
2.  **Real-time Processing**: Includes sentiment scoring, rolling summaries, Q&A auto-triage, speaker coaching (WPM, filler words), evasive answer detection, and compliance flagging.
3.  **20-Module Intelligence Report**: Generated post-session covering executive summaries, financial metrics, ESG, risk assessment, competitive intelligence, and more.
4.  **Specialist Intelligence Services**: Crisis prediction, valuation impact, disclosure certificates, market impact prediction, and communication indexing.
5.  **AI Self-Evolution Engine**: A Meta-Observer scores module outputs, detects gaps, and proposes new AI capabilities, governed by a blockchain-audited gateway.

### Shadow Mode
- **Architecture**: `shadowModeRouter.ts` for session lifecycle, `ShadowModeGuardianService.ts` for background watchdog and state recovery, `recallRouter.ts` for bot deployment and webhook handling.
- **UI**: Features 11 sub-navigation tabs including Live Intelligence, Archives & Reports, AI Dashboard, Live Q&A, and Compliance Monitor.
- **Operator Features**: Real-time notes, action logs, keyboard shortcuts, session crash recovery, and automated intelligence runs.

### Live Q&A — AI Moderation Console
- **AI Triage**: Automatically classifies questions as Approved, Duplicate, Off-topic, or Compliance Risk.
- **Operator Console**: Two-panel UI with incoming queue, AI-suggested answers, analyst identity sidebar, evasive answer detection, and bulk actions.
- **Enhancements**: Jaccard word-overlap for duplicate detection, legal review status, AI draft responses, and enhanced filters.

### Live Video & Audio Webcast Platform
- **Streaming**: RTMP ingest via Mux, HLS delivery, AI audio layer for transcription.
- **Virtual Studio**: Selectable AI Bundles, dynamic overlays (sentiment gauge, compliance indicator), and presenter/speaker coaching.
- **Interactive Features**: Live Q&A, polling, real-time transcript display, slide synchronization, and multi-language subtitles.

### PSTN Telephony Bridge
- **IVR Greeter**: Inbound call handling with access code validation and name/organization capture.
- **Operator Controls**: Mute/unmute, hold/unhold, participant management, conference locking, recording, and DTMF hand-raising.
- **Failover**: Twilio (primary) to Telnyx (secondary).

### Enterprise Billing & Booking
- **Billing Engine**: Comprehensive system for quotes, invoices, recurring templates, and Stripe payments.
- **Packaging Tiers**: Essential, Intelligence, and Enterprise tiers with varying feature sets.

### Database Schema
PostgreSQL database, Drizzle ORM, with over 100 tables organized into core groups such as Users & Auth, Events, Shadow Mode & AI, Sentiment & Compliance, Board Intelligence (21 tables), Webcast, Bridge Telephony, Enterprise Billing, AI Evolution, Certificates & Audit, Predictions, Benchmarking, Investor Signals, Social Media, and Health Monitoring. Includes seeded jurisdiction profiles.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Ably**: Real-time pub/sub messaging.
- **Recall.ai**: AI bot deployment for meeting platforms (Zoom, Teams, Meet, Webex).
- **Mux**: RTMP/HLS video streaming.
- **OpenAI**: GPT-4o for analysis, Whisper for transcription.
- **Twilio**: PSTN telephony, IVR, SIP, WebRTC.
- **Telnyx**: Alternative voice carrier.
- **Stripe**: Payment processing.
- **Resend**: Transactional email and ICS calendar invites.
- **AWS S3**: Object storage.