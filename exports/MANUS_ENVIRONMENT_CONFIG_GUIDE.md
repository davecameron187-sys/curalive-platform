# CuraLive — Environment Configuration Guide for Manus Deployment

**Purpose:** Complete list of every environment variable referenced in the CuraLive codebase, with descriptions, required status, and where to obtain credentials.  
**Generated:** 30 March 2026  
**Action Required:** Fill in the VALUE column from Replit Secrets panel, then configure in your production environment.

---

## How to Get Your Values from Replit

1. Open your CuraLive Replit project
2. Click **Tools** (bottom-left) → **Secrets**
3. Each secret is listed with its name — click to reveal and copy the value
4. Paste each value into the corresponding row below, or enter them directly into your production environment

---

## CRITICAL SECRETS (Required for Core Functionality)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 1 | `DATABASE_URL` | PostgreSQL connection string. Format: `postgresql://user:pass@host:port/dbname` | Replit provides this automatically. For Manus production, use your own PostgreSQL instance. | YES |
| 2 | `JWT_SECRET` | Signs and verifies JWT auth tokens. Any long random string (64+ chars recommended). | Copy from Replit Secrets, or generate a new one for production. | YES |
| 3 | `SESSION_SECRET` | Express session signing key. | Copy from Replit Secrets. | YES |
| 4 | `ABLY_API_KEY` | Real-time pub/sub for live transcripts, sentiment updates, chat. Format: `appId.keyId:keySecret` | Ably Dashboard → Your App → API Keys. https://ably.com/accounts | YES |
| 5 | `RECALL_AI_API_KEY` | Recall.ai bot deployment for Zoom/Teams/Meet/Webex capture. | Recall.ai Dashboard → API Keys. https://recall.ai | YES |
| 6 | `RECALL_AI_WEBHOOK_SECRET` | HMAC-SHA256 signature verification for Recall.ai webhooks. | Recall.ai Dashboard → Webhook Settings. | YES |

---

## AI / LLM Services (Required for AI Features)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 7 | `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (used for AI reports, sentiment, summaries, transcription via Whisper). | Replit provides this via AI Integrations. For standalone: https://platform.openai.com/api-keys | YES |
| 8 | `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL. Default: `https://api.openai.com` | Replit sets this automatically. Use `https://api.openai.com` for direct OpenAI. | YES |
| 9 | `AI_INTEGRATIONS_GEMINI_API_KEY` | Google Gemini API key (used as fallback for audio transcription). | Replit AI Integrations, or: https://aistudio.google.com/app/apikey | YES |
| 10 | `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini API base URL. | Replit sets this automatically. | YES |

**Alternative (if not using Replit AI Integrations):**

| # | Variable Name | Description |
|---|--------------|-------------|
| — | `OPENAI_API_KEY` | Direct OpenAI key (fallback if AI_INTEGRATIONS version not set) |
| — | `BUILT_IN_FORGE_API_KEY` | Replit's built-in AI key (Replit-only, won't work outside Replit) |
| — | `BUILT_IN_FORGE_API_URL` | Replit's built-in AI URL (Replit-only) |

---

## Video Encoding (Mux)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 11 | `MUX_TOKEN_ID` | Mux video encoding token ID. | Mux Dashboard → Settings → API Access Tokens. https://dashboard.mux.com | NOT SET (referenced in code) |
| 12 | `MUX_TOKEN_SECRET` | Mux video encoding token secret. | Same as above. | NOT SET |
| 13 | `MUX_WEBHOOK_SECRET` | Mux webhook signature verification. | Mux Dashboard → Webhooks. | YES |

---

## Telephony / Webphone (Optional)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 14 | `TWILIO_ACCOUNT_SID` | Twilio account identifier. | Twilio Console → Dashboard. https://console.twilio.com | NOT SET |
| 15 | `TWILIO_AUTH_TOKEN` | Twilio auth token. | Twilio Console → Dashboard. | NOT SET |
| 16 | `TWILIO_API_KEY` | Twilio API key (for token generation). | Twilio Console → API Keys. | NOT SET |
| 17 | `TWILIO_API_SECRET` | Twilio API secret. | Twilio Console → API Keys. | NOT SET |
| 18 | `TWILIO_TWIML_APP_SID` | Twilio TwiML application SID. | Twilio Console → TwiML Apps. | NOT SET |
| 19 | `TWILIO_CALLER_ID` | Default outbound caller ID (phone number). | Your Twilio phone number. | NOT SET |
| 20 | `TELNYX_API_KEY` | Telnyx API key (alternative telephony provider). | https://portal.telnyx.com | NOT SET |
| 21 | `TELNYX_SIP_USERNAME` | Telnyx SIP credential username. | Telnyx Portal → SIP Connections. | NOT SET |
| 22 | `TELNYX_SIP_PASSWORD` | Telnyx SIP credential password. | Same as above. | NOT SET |
| 23 | `TELNYX_SIP_CONNECTION_ID` | Telnyx SIP connection identifier. | Same as above. | NOT SET |

---

## Object Storage

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 24 | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Replit Object Storage bucket ID for file uploads. | Replit-managed. For Manus: use S3 or equivalent and update storage code. | YES |
| 25 | `PRIVATE_OBJECT_DIR` | Private object storage directory path. | Replit-managed. | YES |
| 26 | `PUBLIC_OBJECT_SEARCH_PATHS` | Public object storage search paths. | Replit-managed. | YES |

**Note:** Object storage uses Replit's built-in system. For Manus production, you'll likely need to swap this for AWS S3, GCS, or similar. The relevant code is in the object storage service files.

---

## Email (Optional)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 27 | `RESEND_API_KEY` | Resend email service API key. | https://resend.com/api-keys | NOT SET (referenced in tests) |

---

## OAuth / Authentication (Optional)

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 28 | `OAUTH_SERVER_URL` | OAuth server URL (if using external OAuth). | Your OAuth provider. | NOT SET |
| 29 | `VITE_APP_ID` | Application ID for OAuth/webphone config. | Your app registration. | NOT SET |
| 30 | `AUTH_BYPASS` | Set to `"true"` in dev to skip auth checks. | Manual — dev only, never in production. | NOT SET |

---

## URL / Routing Configuration

| # | Variable Name | Description | Where to Get It | Currently Set in Replit? |
|---|--------------|-------------|-----------------|------------------------|
| 31 | `RECALL_AI_BASE_URL` | Recall.ai API base URL. Default: `https://eu-central-1.recall.ai/api/v1` | Only set if using a different Recall.ai region. | NOT SET (uses default) |
| 32 | `RECALL_WEBHOOK_BASE_URL` | Public URL where Recall.ai sends webhooks. Must be HTTPS and publicly accessible. | Your production domain, e.g. `https://curalive.yourdomain.com` | NOT SET |
| 33 | `APP_URL` | Fallback public URL for the application. | Your production domain. | NOT SET |
| 34 | `PUBLIC_URL` | Another fallback for public URL resolution. | Your production domain. | NOT SET |
| 35 | `NODE_ENV` | Set to `"production"` for production deployment. | Manual. | NOT SET (defaults to development) |
| 36 | `PORT` | Server port. | Set by your hosting platform, or default 3000. | Auto-set by Replit |

---

## Replit-Specific (Will NOT Work Outside Replit)

These are auto-set by Replit and should NOT be copied. They need Manus equivalents:

| Variable | Manus Equivalent |
|----------|-----------------|
| `REPLIT_DEV_DOMAIN` | Your production domain |
| `REPLIT_DEPLOYMENT_URL` | Your production domain |
| `REPLIT_DB_URL` | Your PostgreSQL DATABASE_URL |
| `REPLIT_DOMAINS` | Your production domain |
| `PGDATABASE` / `PGPORT` | Included in your DATABASE_URL |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Your S3 bucket or equivalent |

---

## Streaming Platform Keys (NOT Currently in Replit)

These were mentioned in the Manus request but are **not configured** in the current Replit project:

| Service | Status |
|---------|--------|
| YouTube Live API Key / OAuth | NOT in codebase |
| LinkedIn OAuth | NOT in codebase |
| Facebook Page Access Token / App Secret | NOT in codebase |
| Webex OAuth Client ID/Secret | NOT in codebase (Webex uses Recall.ai bot, not direct OAuth) |
| AWS S3 credentials | NOT in codebase (uses Replit Object Storage) |
| Sentry DSN | NOT in codebase |
| SendGrid API Key | NOT in codebase (uses Resend) |

---

## Quick Start Checklist for Manus

### Minimum Required (app will start):
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `JWT_SECRET` — any random 64-char string
- [ ] `SESSION_SECRET` — any random 64-char string
- [ ] `NODE_ENV=production`

### Required for Shadow Mode:
- [ ] `ABLY_API_KEY` — real-time transcript streaming
- [ ] `RECALL_AI_API_KEY` — bot deployment for Zoom/Teams/Meet/Webex
- [ ] `RECALL_AI_WEBHOOK_SECRET` — webhook signature verification
- [ ] `RECALL_WEBHOOK_BASE_URL` — your public HTTPS domain

### Required for AI Features:
- [ ] `AI_INTEGRATIONS_OPENAI_API_KEY` (or `OPENAI_API_KEY`) — AI reports, sentiment, transcription
- [ ] `AI_INTEGRATIONS_OPENAI_BASE_URL` — set to `https://api.openai.com` if using direct OpenAI

### Optional Enhancements:
- [ ] `AI_INTEGRATIONS_GEMINI_API_KEY` — fallback audio transcription
- [ ] `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` — video encoding
- [ ] `TWILIO_*` variables — webphone functionality
- [ ] `RESEND_API_KEY` — email notifications

---

## Security Reminders

1. **Never commit secrets to Git** — use environment variables or a secrets manager
2. **Generate new values for production** — don't reuse development JWT_SECRET or SESSION_SECRET
3. **RECALL_AI_WEBHOOK_SECRET is critical** — without it, production webhooks are rejected (HMAC verification fails)
4. **Set NODE_ENV=production** — this enables security checks (webhook signature enforcement, etc.)

---

*End of Environment Configuration Guide*
