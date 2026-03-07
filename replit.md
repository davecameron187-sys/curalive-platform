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
- OCC (Operator Control Center) for event management
- WebRTC webphone with Twilio/Telnyx integration
- Multi-language translation (8 languages)
- AI-powered post-event reports
- Recall.ai integration for Zoom/Teams/Webex bots
- Billing and PDF generation
