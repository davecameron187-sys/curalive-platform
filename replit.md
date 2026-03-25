# CuraLive Platform

## Overview

A real-time investor events platform providing live transcription, sentiment analysis, smart Q&A, and AI summaries for earnings calls, board briefings, and webcasts. Imported from GitHub: https://github.com/davecameron187-sys/curalive-platform

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS 4 + tRPC client
- **Backend**: Express + tRPC server (`server/_core/index.ts`)
- **Database**: PostgreSQL via Drizzle ORM + `pg` driver
- **Build system**: pnpm + tsx (dev), esbuild (prod)
- **Package manager**: pnpm

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
│   └── webphone/            # Twilio/Telnyx telephony
├── shared/                  # Shared types and constants
├── drizzle/                 # DB schema and migrations
├── scripts/                 # Utility scripts
├── public/                  # Static assets
└── attached_assets/         # Uploaded assets
```

## Key Scripts

- `pnpm run dev` — Start development server (tsx watch)
- `pnpm run build` — Production build (Vite + esbuild)
- `pnpm run start` — Start production server
- `pnpm run db:push` — Run database migrations (drizzle-kit)

## UI Pages

- **`/`** — Unified Operator Dashboard with tabs: Overview, Shadow Mode, OCC, Partners, Settings
- **`/intelligence-suite`** — Intelligence Suite with 11 AI algorithms
- **`/live/:token`** — Client-facing live dashboard (read-only)
- **`/qa/:accessCode`** — Attendee webphone page for Live Q&A

## Key Integrations

- **Twilio/Telnyx** — Telephony and WebRTC
- **Ably** — Real-time pub/sub messaging
- **Mux** — Video streaming
- **OpenAI** — AI analysis and transcription
- **Stripe** — Billing
- **Resend** — Email
- **AWS S3** — Object storage
- **Recall.ai** — Meeting bot deployment

## Environment Variables

The app requires various API keys for full functionality. Core variables:
- `DATABASE_URL` / `PG*` — PostgreSQL connection (auto-provisioned by Replit)
- `OAUTH_SERVER_URL` — OAuth server URL
- `RECALL_AI_API_KEY` — Recall.ai for bot deployment
- `ABLY_API_KEY` — Real-time messaging
- `OPENAI_API_KEY` — AI features
- `TWILIO_*` / `TELNYX_*` — Telephony
- `STRIPE_SECRET_KEY` — Billing
- `RESEND_API_KEY` — Email
- `AWS_*` / `S3_*` — Object storage
- `MUX_*` — Video streaming

## Dev Server

The dev server runs on port 3000 using `tsx watch`. In development, Vite middleware serves the frontend through the Express server.
