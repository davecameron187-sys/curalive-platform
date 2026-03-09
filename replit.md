# CuraLive

A real-time investor events platform providing live transcription, sentiment analysis, smart Q&A, and AI summaries for earnings calls, board briefings, and webcasts.

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS 4 + tRPC client, served via Express middleware in dev
- **Backend**: Express + tRPC server (`server/_core/index.ts`)
- **Database**: MySQL via Drizzle ORM (requires external MySQL `DATABASE_URL`)
- **Build system**: pnpm + tsx (dev), esbuild (prod)
- **Package manager**: pnpm 10.4.1

## Project Structure

```
client/          React frontend (Vite root)
server/          Express backend
  _core/         Server entry, OAuth, Vite middleware, env config
  routers/       tRPC routers
  webphone/      Twilio/Telnyx voice integration
  drizzle/       Drizzle schema + migrations
shared/          Shared types/constants between client and server
drizzle/         SQL migration files
```

## Running the App

The development server runs both the frontend (Vite) and backend (Express/tRPC) on port 5000.

```bash
pnpm dev
```

## Environment Variables

Key variables needed:
- `DATABASE_URL` — MySQL connection string (app runs without it but DB features are disabled)
- `PORT` — Set to `5000`
- `VITE_OAUTH_PORTAL_URL` — OAuth portal URL (optional; falls back to `/login`)
- `VITE_APP_ID` — Application ID for OAuth
- `JWT_SECRET` — Session cookie signing secret
- `OAUTH_SERVER_URL` — OAuth server URL
- `OWNER_OPEN_ID` — OpenID of the admin user

## Deployment

- **Target**: Autoscale
- **Build**: `pnpm run build`
- **Run**: `node dist/index.js`

## Key Features

- Live webcast platform with real-time transcription
- OCC (Operator Control Center) for event management — professional conference control centre
- Training Mode Console — isolated operator training environment (`/training-mode`)
- Operator Analytics dashboard with performance scoring (`/operator/analytics`)
- Development Dashboard with feature status & platform testing tools (`/dev-dashboard`)
- AI Features Status overview of all intelligence capabilities (`/ai-features`)
- WebRTC webphone with Twilio/Telnyx integration
- Multi-language translation (8 languages)
- **Post-Event AI Report** — comprehensive AI intelligence report per event (`/post-event/:eventId`)
- **Complete AI Transcription** — Forge AI live + OpenAI Whisper post-event; `TranscriptViewer` component
- **Live Polling & Audience Interaction** — real-time polls with Ably; `PollWidget` (attendee) + `PollManager` (moderator)
- **Event Scheduling & Calendar** — scheduler form, month/list calendar view, templates, resource allocation (`/events/schedule`, `/events/calendar`)
- **Attendee Mobile Experience** — mobile-first swipeable room with video/transcript/Q&A/polls tabs (`/m/:eventId`)
- **White-Label Client Portal** — multi-tenant branded event portals; admin management (`/portal/:clientSlug`, `/admin/clients`)
- Recall.ai integration for Zoom/Teams/Webex bots
- Billing and PDF generation

## OCC (Operator Console) — `/occ`

The OCC is a world-class conference control centre built to the technical brief. Key areas:

- **Left sidebar navigation** (80px): Running Calls, Post Event, Simulate Call, Settings, Op Settings tabs
- **Metrics strip**: 8 live metrics across the top (Live, Pending, Completed, Lounge, Requests, Participants, CCP, Bridge)
- **Conference Overview (left panel)**: Running / Pending / Completed / Alarms tabs with call list
- **Control Panel (CCP)**: Full call controls (REC, Lock, Mute Parts, Mute All, Terminate, Dial Out)
- **Participant table**: 12-column table with Sentiment scores (0–100, color-coded, live-drifting every 5s)
- **Sub-tabs**: Monitoring (call quality metrics), Connection (IP/codec/encryption/NAT + dial-out), History, Audio, Chat, Notes, Q&A, Direct
- **Monitoring tab**: Bandwidth, Latency, Jitter, Packet Loss, MOS Score with color-coded thresholds
- **Q&A Queue tab**: Submitted text questions with approve/reject/pin/answer moderation + raised hands panel
- **Actions sidebar**: Call, Op Join, Join, Hold, TL/Mon, Disconnect, Voting, Q&A
- **Dev auth bypass**: `DEV_BYPASS = true` in `server/_core/trpc.ts` when `NODE_ENV=development` — disable before production

## Ably Integration

- Ably token auth is served at `GET /api/ably-token` (plain REST endpoint in `server/_core/index.ts`)
- Uses the Ably JS SDK (`new Ably.Rest(apiKey).auth.createTokenRequest(...)`) to generate signed token requests — avoids manual HMAC signing issues
- Capability grants `occ:*`, `curalive-event-*`, and `*` channel access
- OCC.tsx uses `authUrl: "/api/ably-token"` for both Ably client instances
- The old tRPC `ably.tokenRequest` procedure (in `server/routers.ts`) is still present but not used by OCC — it required tRPC input format which Ably SDK cannot send

## OCC Audio Library

- Audio files table: `occ_audio_files` (conferenceId, name, fileUrl, fileKey, durationSeconds, isPlaying)
- Upload endpoint: `POST /api/upload-audio` (multipart, accepts MP3/WAV/OGG/WebM, max 20MB)
- tRPC procedures: `occ.getAudioFiles`, `occ.addAudioFile`, `occ.deleteAudioFile`, `occ.setAudioPlayState`
- Frontend: Audio tab in OCC.tsx reads from DB, supports upload/play/pause/delete with HTML5 Audio API

## Training Mode System

- 6 dedicated DB tables: `training_mode_sessions`, `training_conferences`, `training_participants`, `training_lounge`, `training_call_logs`, `training_performance_metrics`
- tRPC router at `server/routers/trainingMode.ts` — 8 procedures: `createSession`, `startConference`, `logCall`, `recordMetrics`, `completeSession`, `getSessionMetrics`, `getOperatorSessions`, `getActiveSessions`
- All training data is isolated — zero production data is read or written
- Frontend at `client/src/pages/TrainingModeConsole.tsx` — 3 tabs: My Sessions, New Session, Performance
- Performance scoring 0–5 across 5 dimensions; mentor notes; ready-for-production flag
- 11 vitest unit tests in `server/trainingMode.test.ts`

## Database (MySQL via Drizzle)

- `DATABASE_URL` secret is set and the schema is fully pushed — all tables exist
- Demo data seeded: conference CC-9921 (Q4 2025 Earnings Call) with 10 participants
- All training tables created and verified
- `pnpm db:push` runs `drizzle-kit generate && drizzle-kit migrate` if schema changes are needed
- **New tables (from 6 Manus specs)**: `post_event_reports`, `transcription_jobs`, `polls`, `poll_options`, `poll_votes`, `event_schedules`, `operator_availability`, `resource_allocations`, `event_templates`, `clients`, `client_portals` — all created directly via SQL (migration system in mixed state; use direct SQL CREATE TABLE IF NOT EXISTS for new tables)

## Auth

- Dev: `NODE_ENV=development` (set in dev workflow) bypasses all auth — intentional for testing
- Production: `AUTH_BYPASS=false` set as production env var — full JWT auth enforced on deployment
- Controlled by `const DEV_BYPASS = process.env.AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'development'` in `server/_core/trpc.ts`
