# CuraLive Platform

## Overview

CuraLive is a real-time investor events intelligence platform providing live transcription, sentiment analysis, smart Q&A, AI summaries, compliance monitoring, and telephony for critical corporate events like earnings calls, board briefings, and webcasts. The platform aims to deliver immediate, AI-powered insights to operators and clients, enhancing decision-making and compliance. It is a patented application (CIPC Patent App ID 1773575338868) with a vision to become a leading solution in financial intelligence.

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

## System Architecture

The CuraLive platform utilizes a modern full-stack architecture.

### Frontend
- **Framework**: React 19 with Vite for fast development and builds.
- **Styling**: TailwindCSS 4 for utility-first styling, complemented by shadcn/ui components.
- **Communication**: tRPC client for type-safe end-to-end communication with the backend.
- **UI Pages**:
    - `/`: Unified Operator Dashboard (Overview, Shadow Mode, OCC, Partners, Settings).
    - `/bridge` / `/bridge/:id`: Bridge Console — professional telephony operator console (greeter queue, green room, lecture mode, managed Q&A, post-call package). Requires operator role.
    - `/intelligence-suite`: AI-powered intelligence suite.
    - `/live/:token`: Client-facing read-only live dashboard.
    - `/qa/:accessCode`: Attendee webphone page for Live Q&A.

### Backend
- **Framework**: Express.js with tRPC server (`server/_core/index.ts`).
- **Build System**: pnpm for package management, tsx for development, esbuild for production.
- **Deployment**: Replit deploys from GitHub branches (`main`, `shadow-mode`, `develop`).
- **Server Binding**: Binds to `0.0.0.0` for Replit proxy compatibility.
- **Authentication**: JWT cookie sessions (`app_session_id`) with optional OAuth and a `DEV_BYPASS` for development. tRPC procedures are secured with `publicProcedure`, `protectedProcedure`, `operatorProcedure`, and `adminProcedure` based on role hierarchy (viewer < operator < admin).
- **Storage**: A unified `storageAdapter.ts` handles file resolution, prioritizing object storage (Replit's forge API) with a local disk fallback (`uploads/recordings/`). Uploads are hardened with extension allowlists, sanitization, and path traversal protection. Asynchronous persistence streams local recordings to object storage for durability.
- **Operator Action Logging**: All operator activities are logged to the `operator_actions` table for auditing. Features include session handoff packages and robust CSV/JSON/PDF exports with formula injection protection and proper data serialization.
- **Transcription Fallback**: Employs a dual-provider strategy using Gemini AI (primary, via Replit AI Integrations) and Whisper (fallback, via Replit AI Integrations) for archive audio transcription to ensure resilience against quota limits.

### Database
- **Type**: PostgreSQL 16.
- **ORM**: Drizzle ORM with the `pg` driver.
- **Migrations**: Startup migrations are used to ensure schema updates and table creation, as Drizzle migrations are currently incompatible (MySQL syntax in migration files).

### AI & Real-time
- **AI Integration**: OpenAI GPT-4 (via Replit AI integrations proxy) for core AI functionalities. Gemini 2.5 Flash is also used for primary audio transcription.
- **Real-time Communication**: Ably pub/sub for live transcript streaming and other real-time updates.
- **Meeting Bots**: Recall.ai for deploying bots to virtual meeting platforms and streaming transcripts via webhooks.
- **Video**: Mux for video streaming.

### Shadow Mode
Shadow Mode enables real-time monitoring and AI-powered intelligence generation for investor events. It supports two transcription paths: Recall.ai for meeting platforms and a local-audio path for browser-captured audio. The pipeline generates a 20-module AI intelligence report after the session, tagging metrics like forward-looking statements, guidance, and MNPI.

### Live Operator Console (Manus Parts 1-3)
- **LiveSessionPanel** (`client/src/components/LiveSessionPanel.tsx`): 5-phase integrated live operator console with WebPhone, Q&A moderation, transcript view, notes with auto-save, and session analytics. Uses Ably real-time, keyboard shortcuts, and auto-save service. Exports both default and named.
- **WebPhoneCallManager** (`client/src/components/WebPhoneCallManager.tsx`): Operator dashboard showing active participants, audio levels, quality badges, call stats, mute/remove controls.
- **WebPhoneJoinInstructions** (`client/src/components/WebPhoneJoinInstructions.tsx`): Customer-facing join instructions with WebPhone primary, dial-in/SIP/access code tabs, and copy-to-clipboard.
- **ProviderStateIndicator** (`client/src/components/ProviderStateIndicator.tsx`): Connection quality indicator with `ProviderState` interface; `connectionQuality` values: `"excellent" | "good" | "fair" | "poor"`. Default export only.
- **Session Router** (`server/routers/session.ts`): tRPC router for live session operations. Queries use `publicProcedure`; mutations (approve/reject/save/export/handoff) use `operatorProcedure` for auth security.
- **Archive Router** (`server/routers/archive.ts`): tRPC router for session archive queries.
- **Hooks**: `useAblySessions` (Ably real-time subscriptions), `useKeyboardShortcuts` (keyboard shortcut bindings).
- **Services**: `sessionAutoSave` (auto-saves operator notes).
- **Analytics**: `getSessionEventAnalytics` procedure added to analytics router (takes `sessionId: string`, distinct from existing `getEventAnalytics` which takes `eventId: number`).

## External Dependencies

- **PostgreSQL**: Primary database for all platform data.
- **Ably**: Real-time pub/sub messaging for live data streams.
- **Recall.ai**: API for deploying meeting bots and handling webhooks for live transcription.
- **Mux**: Video streaming and asset management.
- **OpenAI**: AI models (GPT-4, Whisper) for analysis and transcription. Utilizes Replit AI integrations proxy.
- **Google Gemini**: AI models (Gemini 2.5 Flash) for transcription, accessed via Replit AI integrations proxy.
- **Twilio/Telnyx**: Telephony and WebRTC capabilities for webphone and conference dial-out.
- **Stripe**: Billing and payment processing.
- **Resend**: Email delivery services.
- **AWS S3**: Object storage for durable asset storage (integrated via Replit's forge API).

### Bridge Console — Telephony & Post-Call
- **Twilio Webhook Handlers** (`server/webhooks/bridgeWebhooks.ts`): Full IVR flow for inbound calls — access code entry, name/org voice capture, transcription callbacks, greeter queue placement. Twilio signature validation middleware on all callback routes. DTMF *2 hand-raise detection. Conference status events (start/end/join/leave/mute/hold/recording). Call status tracking for dial-outs.
- **Twilio API Integration** (`bridgeConsoleRouter.ts`): `twilioDialOut` places real outbound calls via Twilio Calls API. `twilioAdmitCaller` redirects greeter queue callers into named Twilio Conferences. `twilioMuteParticipant`, `twilioHoldParticipant`, `twilioRemoveParticipant` control participants via Twilio Conferences API. `twilioAnnounce` plays announcements. All Twilio mutations throw on API failure (no false-success DB updates).
- **Auto Recall.ai** (`deployRecallBot`): When a bridge event has `externalSources` URLs, auto-deploys Recall.ai bots and creates a linked Shadow Mode session for full AI intelligence pipeline.
- **Post-Call Package** (`getPostCallPackage`): Returns event details, conference timing, full attendance roster, recordings with URLs, Q&A summary (answered/dismissed/pending counts + questions), operator action log, and linked Shadow Mode report. `exportAttendanceCsv` generates downloadable CSV.
- **Webhook Routes**: All registered at `/api/bridge/*` — inbound IVR, access-code validation, name/org capture, transcription callbacks, DTMF handler, conference-status, call-status, admit-to-conference TwiML.

### Live Q&A (P1 Enhancements)
- **Duplicate Detection**: Jaccard word-overlap similarity (threshold 0.55) auto-detects duplicate questions on submission, storing `duplicate_of_id`. Duplicates get `triage_classification: "duplicate"` and priority reduced by 20.
- **Legal Review**: Distinct from `flagged` status — stored in `legal_review_reason` column. Modal requires reason text. `setLegalReview` procedure sets status to `flagged` + populates reason.
- **AI Draft Responses**: `generateContextDraft` includes transcript context. Drafts stored in `ai_draft_text`/`ai_draft_reasoning` DB columns. Frontend auto-loads into textarea when card expanded; never auto-sent.
- **Enhanced Filters**: 10-tab filter bar (All, Unanswered, High Priority, Legal Review, Duplicates, Approved, Answered, Rejected, Flagged, Sent to Speaker) with sort controls (Priority/Time/Compliance) and order toggle.
- **Keyboard Shortcuts**: 1-6 = filter tabs, P/T/C = sort mode, O = toggle sort order, ? = shortcut help panel.
- **Bulk Actions**: Checkbox selection on question cards with bulk approve/reject for selected questions.
- **Idempotent Counters**: Status transitions correctly increment/decrement `total_approved`/`total_rejected` without inflation.
- **Export Integration**: Handoff package and CSV/JSON/PDF exports include Q&A questions with dedup groups and legal review items.
- **DB Columns**: `duplicate_of_id`, `legal_review_reason`, `ai_draft_text`, `ai_draft_reasoning` added via startup migration `ensureLiveQaP1Columns`.
- **rawSql Epoch Caveat**: `rawSql()` auto-converts numbers between 1e12–1e13 to `Date` objects. For bigint timestamp columns, pass epoch values as strings to avoid conversion.