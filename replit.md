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
7. **Schema sync**: Use `drizzle-kit push --force` (NOT `pnpm run db:push` — migration files have MySQL syntax)
8. **Health monitoring tables** (`health_checks`, `health_incidents`, `health_incident_reports`, `health_baselines`): Created via raw SQL, not in Drizzle schema. Timestamp columns must be `TIMESTAMP` type (the rawSql layer converts to Date strings)

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

## UI Pages

- **`/`** — Unified Operator Dashboard with tabs: Overview, Shadow Mode, OCC, Partners, Settings
- **`/intelligence-suite`** — Intelligence Suite with 11 AI algorithms
- **`/live/:token`** — Client-facing live dashboard (read-only)
- **`/qa/:accessCode`** — Attendee webphone page for Live Q&A

## Key Integrations

- **Twilio/Telnyx** — Telephony and WebRTC
- **Ably** — Real-time pub/sub messaging
- **Mux** — Video streaming
- **OpenAI** — AI analysis and transcription (via Replit AI integrations proxy)
- **Stripe** — Billing
- **Resend** — Email
- **AWS S3** — Object storage
- **Recall.ai** — Meeting bot deployment

## Environment Variables

Core (auto-provisioned by Replit):
- `DATABASE_URL` / `PG*` — PostgreSQL connection

Configured secrets:
- `RECALL_AI_API_KEY` — Recall.ai for bot deployment
- `MUX_WEBHOOK_SECRET` — Mux webhook verification

Optional (not yet configured, non-critical for app loading):
- `OAUTH_SERVER_URL` — OAuth server URL
- `ABLY_API_KEY` — Real-time messaging
- `TWILIO_*` / `TELNYX_*` — Telephony
- `STRIPE_SECRET_KEY` — Billing
- `RESEND_API_KEY` — Email
- `AWS_*` / `S3_*` — Object storage

## Deployment

- **Artifact**: `artifacts/api-server` (kind: web, previewPath: `/`)
- **Build**: `vite build` + `esbuild` → `dist/`
- **Run**: `NODE_ENV=production node dist/index.js`
- **Target**: Autoscale
- **Health check**: `GET /health` returns `{ status: "ok" }` (registered early, before heavy middleware)
- Server listens on `0.0.0.0:PORT`

## Database Backup

`database-backup.json` in the repo contains data from the previous project. Can be restored when needed.
