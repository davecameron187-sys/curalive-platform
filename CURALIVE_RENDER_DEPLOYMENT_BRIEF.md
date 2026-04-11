# CuraLive — Render Migration Technical Audit

**Audit Date:** 11 April 2026  
**Audited From:** Live codebase on Replit (verified against running server)  
**Repository:** `https://github.com/davecameron187-sys/curalive-platform.git`

---

## A. Current Architecture

```
┌─────────────────────────────────────────────┐
│              React 19 SPA (Vite)             │
│      Served as static files by Node          │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│         Node.js Web Service                  │
│    Express + tRPC + Drizzle ORM              │
│    110+ tRPC routers, webhooks, voice,       │
│    email, real-time (Ably), scheduling       │
│    Port: from $PORT env (default 3000)       │
└──────────────────┬──────────────────────────┘
                   │ HTTP (internal)
┌──────────────────▼──────────────────────────┐
│        Python AI Core (FastAPI)              │
│    SQLAlchemy + psycopg v3                   │
│    Analysis, drift, governance, briefing     │
│    Port: from $PORT env                      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          PostgreSQL 16                       │
│    221 tables (Drizzle-managed + AI Core)    │
└─────────────────────────────────────────────┘
```

Both Node and Python share the same PostgreSQL database.

---

## B. Canonical Deployment Branch

| Item | Value | Confirmed |
|------|-------|-----------|
| Current active branch | `RenderMigration` | Yes — `git branch` shows `* RenderMigration` |
| Pushed to GitHub | `remotes/github/RenderMigration` | Yes |
| `main` branch | Exists locally but `RenderMigration` is the deployment target | Yes |

**Recommendation:** Deploy from `RenderMigration`. Do not use `main` — it may be behind.

### Stale/deprecated files to ignore

| File/Directory | Status |
|----------------|--------|
| `_build/` | Intermediate build directory — do not deploy directly |
| `render.yaml` | Does NOT exist in repo — must be created if using Render Blueprint |
| `Dockerfile` | Does NOT exist — not needed (Render native runtimes) |
| `.replit` | Replit-only — ignored on Render |
| `CURALIVE_RENDER_DEPLOYMENT_BRIEF.md` (previous version) | Replaced by this audit |

---

## C. Node Service Deployment Settings

### Build

| Setting | Value | Confirmed In |
|---------|-------|-------------|
| Build command | `npm install && npm run build` | `package.json` scripts.build |
| What `npm run build` does | 1. `vite build` → React SPA to `_build/public/` | vite.config.ts line 24 |
| | 2. `esbuild` → Server bundle to `_build/index.js` | package.json scripts.build |
| | 3. `rm -rf dist && cp -r _build dist` → Final output in `dist/` | package.json scripts.build |
| Final output | `dist/index.js` (server) + `dist/public/` (SPA) | Verified by build test |

### Start

| Setting | Value | Confirmed In |
|---------|-------|-------------|
| Start command | `NODE_ENV=production node dist/index.js` | package.json scripts.start |
| Health check path | `/health` | server/_core/index.ts line 153 |
| Port binding | `process.env.PORT \|\| 3000`, binds `0.0.0.0` | server/_core/index.ts line 1048, 1055 |

### Static file serving (production)

In production, the server resolves the SPA path as:
```
path.resolve(import.meta.dirname, "public")
```
Since the server runs from `dist/index.js`, this resolves to `dist/public/`. This is where Vite outputs the built React app.

**Verified:** Production build test returns HTTP 200 at `/` with `X-Served-By: curalive-spa` header.

### CRITICAL FIX APPLIED IN THIS AUDIT

The previous build had a path conflict:
- Vite output to `dist/public/` → then `rm -rf dist` deleted it before copying `_build/`
- Result: server bundle existed but SPA files were destroyed

**Fix:** Changed `vite.config.ts` outDir from `dist/public` to `_build/public` so the copy step preserves both server and SPA. Also fixed `package.json` start script from `node _build/index.js` to `node dist/index.js`.

### In-process schedulers (start automatically)

| Scheduler | Interval | Source |
|-----------|----------|--------|
| HealthGuardian | 30s | server/services/HealthGuardianService.ts |
| ComplianceEngine | 300s | server/services/ComplianceEngineService.ts |
| ComplianceDeadlineMonitor | 15 min | server/services/ComplianceDeadlineService.ts |
| BriefingScheduler | 5 min | server/services/PreEventBriefingService.ts |
| SubscriptionBilling | 1st of month 08:00 | server/services/SubscriptionBillingService.ts |
| ShadowWatchdog | 60s | server/services/ShadowModeGuardianService.ts |
| ReminderScheduler | 300s | server/reminderScheduler.ts |
| ComplianceDigest | Daily | server/complianceDigestScheduler.ts |

**No external cron jobs are needed.** All scheduling is in-process.

---

## D. Python AI Core Service Deployment Settings

| Setting | Value | Confirmed In |
|---------|-------|-------------|
| Root directory | `curalive_ai_core/` | Filesystem |
| Build command | `pip install -r requirements.txt` | curalive_ai_core/requirements.txt |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | Standard FastAPI |
| Health check path | `/health` | curalive_ai_core/app/main.py |
| Python version | 3.12 | Verified: `Python 3.12.12` |
| Requirements file | `curalive_ai_core/requirements.txt` | Verified |

### Dependencies (requirements.txt)

```
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
pydantic-settings==2.13.1
sqlalchemy==2.0.49
psycopg[binary]==3.3.3
```

### Database connection model

The Python service uses `DATABASE_URL` via pydantic-settings:

```python
database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/curalive"
```

It has a `model_validator` that auto-converts `postgresql://` → `postgresql+psycopg://`, so passing Render's standard `DATABASE_URL` works directly.

**Startup behavior:** On startup, `Base.metadata.create_all(bind=engine)` runs — this creates/verifies the Python service's own tables. It touches the database immediately at boot.

### LLM configuration

The Python config accepts `LLM_API_KEY` (env var name, maps to `llm_api_key` setting). This is separate from the Node service's `OPENAI_API_KEY`.

| Setting | Default | Env Var |
|---------|---------|---------|
| llm_provider | `openai` | `LLM_PROVIDER` |
| llm_model | `gpt-4.1-mini` | `LLM_MODEL` |
| llm_api_key | None | `LLM_API_KEY` |

**On Render:** Set `LLM_API_KEY` to your OpenAI API key value. This is the same key as `OPENAI_API_KEY` but the Python service reads it under a different env var name.

---

## E. Database Deployment/Import Settings

| Setting | Value |
|---------|-------|
| Database type | PostgreSQL 16 |
| Shared by both services | Yes — Node (Drizzle) and Python (SQLAlchemy) use the same DB |
| Total tables | 221 |
| Backup file | `curalive_db_backup.sql` (5.6MB) in repo root |
| Backup format | `pg_dump --no-owner --no-privileges --format=plain` |

### Import method

```bash
psql <RENDER_EXTERNAL_DATABASE_URL> < curalive_db_backup.sql
```

### Startup requirements

- Node service: Requires pre-existing tables (Drizzle schema). The backup provides these.
- Python service: Runs `create_all()` at startup — creates its own tables if missing. Safe with or without backup.
- Both services will start successfully after importing the backup.

### Validation queries after import

```sql
-- Table count (expect 221+)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Key row counts
SELECT 'shadow_sessions', COUNT(*) FROM shadow_sessions
UNION ALL SELECT 'organisations', COUNT(*) FROM organisations
UNION ALL SELECT 'partners', COUNT(*) FROM partners
UNION ALL SELECT 'client_tokens', COUNT(*) FROM client_tokens
UNION ALL SELECT 'archive_events', COUNT(*) FROM archive_events
UNION ALL SELECT 'scheduled_sessions', COUNT(*) FROM scheduled_sessions
UNION ALL SELECT 'billing_invoices', COUNT(*) FROM billing_invoices;
```

Expected:

| Table | Rows |
|-------|------|
| shadow_sessions | 16 |
| organisations | 5 |
| partners | 2 |
| client_tokens | 5 |
| archive_events | 26 |
| scheduled_sessions | 2 |
| billing_invoices | 2 |

---

## F. Minimum Required Environment Variables

### Node service — REQUIRED for first boot

| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | Render DB Internal URL |
| `NODE_ENV` | Must be `production` | Set to `production` |
| `PORT` | Server port | Auto-set by Render (10000) |
| `JWT_SECRET` | Session/token signing | Your secret |
| `OPENAI_API_KEY` | LLM calls (direct to OpenAI) | Your OpenAI key |
| `AI_CORE_URL` | Node→Python communication | `http://curalive-ai-core:10000` |
| `APP_ORIGIN` | Public URL for webhooks, emails, links | `https://curalive-node.onrender.com` |

### Node service — REQUIRED for full functionality

| Variable | Purpose |
|----------|---------|
| `ABLY_API_KEY` | Real-time event streaming |
| `RECALL_AI_API_KEY` | Recall.ai transcript bot |
| `RECALL_AI_WEBHOOK_SECRET` | Recall webhook verification |
| `RESEND_API_KEY` | Email delivery |
| `TWILIO_ACCOUNT_SID` | Voice/telephony |
| `TWILIO_AUTH_TOKEN` | Voice/telephony |
| `TWILIO_API_KEY` | Voice SDK tokens |
| `TWILIO_API_SECRET` | Voice SDK tokens |
| `TWILIO_CALLER_ID` | Outbound caller ID |
| `TWILIO_TWIML_APP_SID` | TwiML app routing |

### Node service — OPTIONAL (enable when ready)

| Variable | Purpose |
|----------|---------|
| `MUX_TOKEN_ID` | Video streaming |
| `MUX_TOKEN_SECRET` | Video streaming |
| `MUX_WEBHOOK_SECRET` | Mux webhook verification |
| `STRIPE_SECRET_KEY` | Payment processing |
| `TELNYX_API_KEY` | Voice failover |
| `TELNYX_CALLER_ID` | Telnyx caller ID |
| `TELNYX_CONNECTION_ID` | Telnyx SIP |

### Python service — REQUIRED for first boot

| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | Render DB Internal URL (same as Node) |
| `LLM_API_KEY` | OpenAI API key for AI analysis | Your OpenAI key (same value as OPENAI_API_KEY) |

### Python service — OPTIONAL

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_MODEL` | `gpt-4.1-mini` | Override LLM model |
| `LLM_PROVIDER` | `openai` | Override LLM provider |
| `ENVIRONMENT` | `development` | Set to `production` |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

---

## G. Replit-Only Variables to IGNORE on Render

These exist in the codebase but are **Replit platform-specific**. Do NOT set them on Render:

| Variable | Why it exists | What replaces it on Render |
|----------|---------------|---------------------------|
| `REPLIT_DEV_DOMAIN` | Replit dev preview URL | `APP_ORIGIN` |
| `REPLIT_DEPLOYMENT_URL` | Replit production URL | `APP_ORIGIN` |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit OpenAI proxy | Direct `OPENAI_API_KEY` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit proxy key | Direct `OPENAI_API_KEY` |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Replit Gemini proxy | Not needed |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Replit Gemini proxy | Not needed |
| `BUILT_IN_FORGE_API_KEY` | Replit Forge LLM | Direct `OPENAI_API_KEY` |
| `BUILT_IN_FORGE_API_URL` | Replit Forge endpoint | Not needed |
| `OWNER_OPEN_ID` | Replit user identity | Not needed |
| `APP_ID` | Replit app identifier | Not needed |
| `OAUTH_SERVER_URL` | Replit OAuth | Not needed (auth uses JWT) |
| `SESSION_SECRET` | Duplicates `JWT_SECRET` | Use `JWT_SECRET` only |

### How the LLM routing works (server/_core/llm.ts)

Priority order:
1. `AI_INTEGRATIONS_OPENAI_BASE_URL` → Replit proxy (skip on Render)
2. `BUILT_IN_FORGE_API_URL` → Replit Forge (skip on Render)
3. `OPENAI_API_KEY` → Direct `https://api.openai.com/v1/chat/completions` with `gpt-4o`

**On Render:** Only set `OPENAI_API_KEY`. The system falls through to option 3 automatically.

---

## H. External Webhook/Services to Update

After deploying to Render, update webhook URLs in these external dashboards:

| Service | Webhook URL on Render | Where to configure |
|---------|----------------------|-------------------|
| Recall.ai | `https://<your-domain>/api/recall/webhook` | Recall.ai dashboard |
| Mux | `https://<your-domain>/api/mux/webhook` | Mux dashboard |
| Twilio | `https://<your-domain>/api/webphone/inbound` | Twilio TwiML App → Voice URL |
| Stripe | `https://<your-domain>/api/stripe/webhook` | Stripe Dashboard → Webhooks |
| Telnyx | `https://<your-domain>/api/bridge/telnyx-status` | Telnyx Mission Control |

### Integrations actually used in code (confirmed by grep)

| Service | Used? | Env Vars |
|---------|-------|----------|
| OpenAI | Yes | `OPENAI_API_KEY` (Node), `LLM_API_KEY` (Python) |
| Ably | Yes | `ABLY_API_KEY` |
| Recall.ai | Yes | `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` |
| Resend | Yes | `RESEND_API_KEY` |
| Twilio | Yes | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_CALLER_ID`, `TWILIO_TWIML_APP_SID` |
| Telnyx | Yes (voice failover) | `TELNYX_API_KEY`, `TELNYX_CALLER_ID`, `TELNYX_CONNECTION_ID` |
| Mux | Yes (video) | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` |
| Stripe | Yes (billing) | `STRIPE_SECRET_KEY` |

---

## I. Known Outdated Assumptions to Discard

| Outdated Assumption | Actual Truth |
|---------------------|-------------|
| "Build outputs to `dist/public/`" | **Fixed in this audit.** Vite now outputs to `_build/public/`, then the build script copies `_build/` → `dist/`. Final output: `dist/index.js` + `dist/public/` |
| "Start command is `node _build/index.js`" | **Fixed in this audit.** Start command is now `node dist/index.js` |
| "`render.yaml` exists in the repo" | It does NOT exist. Must be created manually or services set up via Render dashboard |
| "Python needs `OPENAI_API_KEY`" | Python reads `LLM_API_KEY` (not `OPENAI_API_KEY`). Same key value, different env var name |
| "Python uses psycopg2" | Python uses psycopg v3 (`psycopg[binary]==3.3.3`). Connection string driver: `postgresql+psycopg://` |
| "Python needs explicit PGHOST/PGPORT/etc" | Python uses `DATABASE_URL` only. The `model_validator` auto-converts `postgresql://` to `postgresql+psycopg://` |
| "External cron jobs needed" | All scheduling is in-process. No Render Cron Jobs needed |
| "Multiple databases needed" | Both services share one PostgreSQL database |
| "Auth requires OAUTH_SERVER_URL" | On Render, auth uses JWT only. `OAUTH_SERVER_URL` is Replit-specific |
| "Need `RECALL_WEBHOOK_BASE_URL` or `APP_URL`" | These are fallbacks. The webhook URL builder checks `APP_ORIGIN` first (set this on Render) |
| "`main` branch is the deployment branch" | `RenderMigration` is the canonical deployment branch |

---

## J. Recommended Deployment Order on Render

### Step 1: Create PostgreSQL Database

- Name: `curalive-db`
- PostgreSQL version: 16
- Plan: Starter or Standard
- Copy the **Internal Database URL** and **External Database URL**

### Step 2: Import Database Backup

```bash
psql <RENDER_EXTERNAL_DATABASE_URL> < curalive_db_backup.sql
```

Run validation queries from Section E.

### Step 3: Deploy Python AI Core

| Setting | Value |
|---------|-------|
| Name | `curalive-ai-core` |
| Type | Web Service |
| Runtime | Python 3.12 |
| Branch | `RenderMigration` |
| Root Directory | `curalive_ai_core` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Env vars:
```
DATABASE_URL=<Render Internal Database URL>
LLM_API_KEY=<your OpenAI API key>
```

Verify: `GET /health` → `{"status":"ok"}`

### Step 4: Deploy Node Service

| Setting | Value |
|---------|-------|
| Name | `curalive-node` |
| Type | Web Service |
| Runtime | Node |
| Branch | `RenderMigration` |
| Root Directory | _(leave blank)_ |
| Build Command | `npm install && npm run build` |
| Start Command | `NODE_ENV=production node dist/index.js` |
| Health Check Path | `/health` |

Minimum env vars for first boot:
```
DATABASE_URL=<Render Internal Database URL>
NODE_ENV=production
JWT_SECRET=<your secret>
OPENAI_API_KEY=<your OpenAI API key>
AI_CORE_URL=http://curalive-ai-core:10000
APP_ORIGIN=https://curalive-node.onrender.com
```

Add remaining env vars (Ably, Recall, Twilio, Resend, etc.) for full functionality.

Verify:
- `GET /health` → `{"ok":true, ...}`
- `GET /` → HTTP 200, loads React SPA

### Step 5: Update External Webhook URLs

Update Recall.ai, Mux, Twilio, Stripe, Telnyx dashboards with new Render URLs (see Section H).

### Step 6: Test Demo Tokens

| Token | URL |
|-------|-----|
| `demo-live-001` | `https://<domain>/live/demo-live-001` |
| `demo-report-001` | `https://<domain>/report/demo-report-001` |
| `demo-presenter-001` | `https://<domain>/presenter/demo-presenter-001` |

---

## Post-Deployment Checklist

- [ ] PostgreSQL database created and backup imported (221 tables)
- [ ] Python service deployed and `/health` returns `{"status":"ok"}`
- [ ] Node service deployed and `/health` returns `{"ok":true}`
- [ ] Root URL `/` loads the React SPA
- [ ] Demo tokens load correct views
- [ ] Webhook URLs updated in external dashboards
- [ ] Custom domain configured (if applicable)
