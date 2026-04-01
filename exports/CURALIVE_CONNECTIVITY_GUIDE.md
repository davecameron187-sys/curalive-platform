# CuraLive — Complete Connectivity & Configuration Guide

This document contains every environment variable, API endpoint, webhook URL, and service configuration required to run CuraLive on a new deployment.

---

## 1. ENVIRONMENT VARIABLES — COMPLETE LIST

All of these must be set as environment variables on the Manus server. They are grouped by service.

### 1.1 Database

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `DATABASE_URL` | **YES** | PostgreSQL connection string | `postgresql://user:password@host:5432/curalive?sslmode=require` |

**Setup:** Create a PostgreSQL database, then run schema push:
```bash
npx drizzle-kit push
```

### 1.2 Authentication & Security

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `JWT_SECRET` | **YES** | Secret key for signing JWT session tokens | Any random 64-char string: `openssl rand -hex 32` |
| `AUTH_BYPASS` | Optional | Set to `true` in development to skip auth | `true` |
| `NODE_ENV` | Recommended | `development` or `production` | `production` |

### 1.3 Ably (Real-Time Messaging)

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `ABLY_API_KEY` | **YES** | Ably API key for pub/sub messaging | https://ably.com/accounts → App → API Keys |

**Format:** `appId.keyId:keySecret` (e.g., `xVLyHw.DQEYxQ:abcdef123456`)

**What it powers:**
- Live transcript streaming to operator consoles
- Multi-operator conference sync (mute/unmute/lock events)
- Real-time notifications and alerts
- Shadow Mode live intelligence feed

**Ably channels used by the app:**
- `occ:conference:{conferenceId}` — OCC conference events
- `shadow-{sessionId}` — Shadow Mode live transcript
- `user:{userId}` — Per-user notifications
- `webphone:{operatorId}` — Webphone call state

### 1.4 Recall.ai (AI Meeting Bot / Transcription)

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `RECALL_AI_API_KEY` | **YES** | API key for deploying meeting bots | https://recall.ai/dashboard → API Keys |
| `RECALL_AI_WEBHOOK_SECRET` | Recommended | HMAC-SHA256 secret for verifying webhooks | Set in Recall.ai dashboard under Webhooks |
| `RECALL_AI_BASE_URL` | Optional | API base URL (defaults to EU region) | Default: `https://eu-central-1.recall.ai/api/v1` |
| `RECALL_WEBHOOK_BASE_URL` | Optional | Override public URL for webhooks | Your public HTTPS domain |

**What it powers:**
- Deploys AI bots to join Zoom/Teams/Webex/Google Meet calls
- Captures real-time audio and transcription
- Sends transcription segments via webhook to CuraLive

**Webhook configuration in Recall.ai dashboard:**
- Webhook URL: `https://YOUR_PUBLIC_DOMAIN/api/recall/webhook`
- Events to subscribe: `bot.status_change`, `bot.transcription`
- Signing secret: Set and copy to `RECALL_AI_WEBHOOK_SECRET`

**CRITICAL:** The Recall webhook route MUST be registered BEFORE `express.json()` middleware because it needs the raw body for HMAC-SHA256 signature verification.

### 1.5 Twilio (Primary Voice/Telephony Carrier)

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `TWILIO_ACCOUNT_SID` | For telephony | Account SID | https://console.twilio.com → Dashboard |
| `TWILIO_AUTH_TOKEN` | For telephony | Auth token | https://console.twilio.com → Dashboard |
| `TWILIO_API_KEY` | For WebRTC | API Key SID | https://console.twilio.com → API Keys |
| `TWILIO_API_SECRET` | For WebRTC | API Key Secret | Created with API Key |
| `TWILIO_CALLER_ID` | For dial-out | Default outbound phone number | Your Twilio phone number (E.164 format) |
| `TWILIO_TWIML_APP_SID` | For webphone | TwiML App SID | https://console.twilio.com → TwiML Apps |

**Twilio webhook URLs to configure:**

In Twilio Console → Phone Number → Voice Configuration:
- **Incoming call webhook:** `https://YOUR_PUBLIC_DOMAIN/api/webphone/inbound` (POST)
- **Status callback:** `https://YOUR_PUBLIC_DOMAIN/api/webphone/recording-status` (POST)

In Twilio Console → TwiML App:
- **Voice URL:** `https://YOUR_PUBLIC_DOMAIN/api/webphone/twiml` (POST)
- **Status callback:** `https://YOUR_PUBLIC_DOMAIN/api/conference-dialout/status` (POST)

### 1.6 Telnyx (Backup Voice Carrier — Failover)

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `TELNYX_API_KEY` | Optional | API key for backup carrier | https://portal.telnyx.com → API Keys |
| `TELNYX_SIP_CONNECTION_ID` | Optional | SIP connection for WebRTC | https://portal.telnyx.com → SIP Connections |

**Telnyx webhook URL:**
- `https://YOUR_PUBLIC_DOMAIN/api/webphone/telnyx` (POST, raw JSON body)

### 1.7 Mux (Video Streaming)

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `MUX_TOKEN_ID` | For video | API Token ID | https://dashboard.mux.com → Settings → API Access Tokens |
| `MUX_TOKEN_SECRET` | For video | API Token Secret | Created with Token ID |
| `MUX_WEBHOOK_SECRET` | For video | Webhook signing secret | https://dashboard.mux.com → Settings → Webhooks |

**Mux webhook URL:**
- `https://YOUR_PUBLIC_DOMAIN/api/mux/webhook` (POST)
- Events: `video.live_stream.active`, `video.live_stream.idle`, `video.asset.ready`

### 1.8 OpenAI / AI Integrations

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | For AI features | OpenAI API key | https://platform.openai.com/api-keys |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Optional | Custom base URL (for proxy) | Default: `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | Fallback | Alternative env var name for OpenAI | Same as above |

**What it powers:**
- Real-time sentiment analysis during calls
- Automated moderation (toxicity, compliance)
- Post-event summarisation and report generation
- AI Advisory Bot responses
- Chat translation

### 1.9 Application Config

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `PORT` | **YES** | Port the server listens on | `3000` |
| `PUBLIC_URL` | Recommended | Your public HTTPS URL | `https://curalive-mdu4k2ib.manus.space` |
| `APP_URL` | Alternative | Same as PUBLIC_URL | `https://curalive-mdu4k2ib.manus.space` |
| `VITE_APP_ID` | Optional | Application identifier | `curalive` |

---

## 2. ALL API ENDPOINTS

### 2.1 tRPC API (Primary)

**Base URL:** `https://YOUR_DOMAIN/api/trpc`

All tRPC calls go through this single endpoint. The client uses `httpBatchLink` with `superjson` transformer. Every query/mutation is type-safe.

**Key tRPC routers available:**

| Router | Prefix | Purpose |
|--------|--------|---------|
| `occ` | `trpc.occ.*` | Operator Call Centre — conference management |
| `shadowMode` | `trpc.shadowMode.*` | Shadow Mode — live intelligence sessions |
| `archiveUpload` | `trpc.archiveUpload.*` | Archive upload and processing |
| `webphone` | `trpc.webphone.*` | Browser-based webphone |
| `liveQa` | `trpc.liveQa.*` | Live Q&A moderation |
| `aiAm` | `trpc.aiAm.*` | AI automated moderator |
| `aiEvolution` | `trpc.aiEvolution.*` | Self-improving AI engine |
| `advisoryBot` | `trpc.advisoryBot.*` | AI advisory chatbot |
| `adaptiveIntelligence` | `trpc.adaptiveIntelligence.*` | Adaptive AI thresholds |
| `mux` | `trpc.mux.*` | Live streaming management |
| `recall` | `trpc.recall.*` | Recall.ai bot management |
| `sentiment` | `trpc.sentiment.*` | Sentiment analysis |
| `billing` | `trpc.billing.*` | Billing and invoicing |
| `platformEmbed` | `trpc.platformEmbed.*` | Platform embedding |
| `systemDiagnostics` | `trpc.systemDiagnostics.*` | System health checks |

### 2.2 Webhook Endpoints (Inbound — External services call these)

| Endpoint | Method | Source | Body Type | Auth |
|----------|--------|--------|-----------|------|
| `/api/recall/webhook` | POST | Recall.ai | Raw body (HMAC) | HMAC-SHA256 signature header |
| `/api/webphone/inbound` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/webphone/twiml` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/webphone/telnyx` | POST | Telnyx | Raw JSON | Telnyx signature |
| `/api/webphone/recording-status` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/webphone/voicemail-fallback` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/webphone/voicemail-status` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/conference-dialout/twiml` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/conference-dialout/status` | POST | Twilio | URL-encoded | Twilio request validation |
| `/api/voice/inbound` | POST | Twilio | URL-encoded | Twilio DTMF gather |
| `/api/voice/pin` | POST | Twilio | URL-encoded | PIN validation |

### 2.3 REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check — returns 200 if server is running |
| `/api/billing/pdf/quote/:token` | GET | Download quote PDF |
| `/api/billing/pdf/invoice/:token` | GET | Download invoice PDF |
| `/api/billing/pdf/invoices/bulk-zip` | GET | Bulk download invoices as ZIP |
| `/api/archives/:id/transcript` | GET | Download session transcript |
| `/api/archives/:id/recording` | GET | Download session recording |
| `/api/generate-image` | POST | AI image generation |

---

## 3. AUTHENTICATION FLOW

CuraLive uses **OpenID Connect with PKCE** (via Replit Auth on Replit, configurable for other providers).

**OAuth endpoints on the server:**
- `/api/oauth/login` — Initiates OAuth flow
- `/api/oauth/callback` — Handles OAuth redirect
- `/api/auth/session` — Returns current session
- `/api/auth/logout` — Destroys session

**For Manus deployment:** If not using Replit Auth, set `AUTH_BYPASS=true` during development, or implement a compatible OAuth provider.

**Session tokens:** JWT signed with `JWT_SECRET`, stored in HTTP-only cookies.

---

## 4. EXTERNAL SERVICE SETUP CHECKLIST

### 4.1 Ably Setup
1. Create account at https://ably.com
2. Create new app
3. Copy API key (format: `appId.keyId:keySecret`)
4. Set `ABLY_API_KEY` environment variable
5. No webhook configuration needed — CuraLive uses server-side SDK to publish

### 4.2 Recall.ai Setup
1. Create account at https://recall.ai
2. Get API key from dashboard
3. Set `RECALL_AI_API_KEY` environment variable
4. In Recall.ai dashboard, add webhook:
   - URL: `https://YOUR_PUBLIC_DOMAIN/api/recall/webhook`
   - Set signing secret, copy to `RECALL_AI_WEBHOOK_SECRET`
5. Select region: EU (`https://eu-central-1.recall.ai/api/v1`) or US

### 4.3 Twilio Setup
1. Create account at https://twilio.com
2. From Console dashboard, copy `Account SID` and `Auth Token`
3. Buy a phone number (UK: +44 number)
4. Create an API Key (for WebRTC): Console → API Keys → Create
5. Create a TwiML App: Console → TwiML Apps → Create
   - Voice URL: `https://YOUR_PUBLIC_DOMAIN/api/webphone/twiml`
6. Configure phone number webhooks:
   - Voice incoming: `https://YOUR_PUBLIC_DOMAIN/api/webphone/inbound`
7. Set all env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_CALLER_ID`, `TWILIO_TWIML_APP_SID`

### 4.4 Mux Setup (Optional — for video streaming)
1. Create account at https://mux.com
2. Create API Access Token in Settings
3. Set `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`
4. Add webhook in Settings → Webhooks:
   - URL: `https://YOUR_PUBLIC_DOMAIN/api/mux/webhook`
   - Copy signing secret to `MUX_WEBHOOK_SECRET`

### 4.5 OpenAI Setup
1. Get API key from https://platform.openai.com/api-keys
2. Set `AI_INTEGRATIONS_OPENAI_API_KEY` environment variable
3. Optionally set `AI_INTEGRATIONS_OPENAI_BASE_URL` if using a proxy

---

## 5. DATABASE SCHEMA SETUP

After setting `DATABASE_URL`, run:

```bash
npx drizzle-kit push
```

This creates all 100+ tables automatically from the Drizzle schema. Key table groups:

- **Core:** `users`, `events`, `attendee_registrations`
- **OCC:** `occ_conferences`, `occ_participants`, `occ_lounge`, `occ_operator_sessions`
- **Intelligence:** `shadow_sessions`, `bastion_intelligence_sessions`, `agm_intelligence_sessions`
- **AI:** `agentic_analyses`, `autonomous_interventions`, `adaptive_thresholds`, `operator_corrections`
- **Q&A:** `live_qa_sessions`, `live_qa_questions`
- **Billing:** `billing_clients`, `billing_quotes`, `billing_invoices`, `billing_line_items`
- **Compliance:** `compliance_certificates`, `disclosure_certificates`
- **Metrics:** `tagged_metrics`

---

## 6. STARTUP COMMAND

```bash
# Development
NODE_ENV=development npx tsx server/index.ts

# Production (after building)
npm run build
NODE_ENV=production node dist/server/index.js
```

The server starts on the port specified by the `PORT` environment variable (defaults to 3000).

---

## 7. MINIMUM VIABLE CONFIGURATION

To get Shadow Mode rendering with basic functionality, you need AT MINIMUM:

```env
DATABASE_URL=postgresql://user:pass@host:5432/curalive
JWT_SECRET=your-random-64-char-secret-here
PORT=3000
NODE_ENV=development
AUTH_BYPASS=true
```

To add real-time features, add:
```env
ABLY_API_KEY=your-ably-key
```

To add AI transcription, add:
```env
RECALL_AI_API_KEY=your-recall-key
RECALL_AI_WEBHOOK_SECRET=your-webhook-secret
```

To add telephony, add:
```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_API_KEY=your-api-key
TWILIO_API_SECRET=your-api-secret
TWILIO_CALLER_ID=+44xxxxxxxxxx
TWILIO_TWIML_APP_SID=your-twiml-app-sid
```

To add AI analysis features, add:
```env
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-key
```
