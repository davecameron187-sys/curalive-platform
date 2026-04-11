# CuraLive — Render Deployment Technical Brief

**Version:** 1.0  
**Date:** April 2026  
**Branch:** `RenderMigration`  
**Repository:** `https://github.com/davecameron187-sys/curalive-platform.git`

---

## 1. Architecture Overview

CuraLive is a real-time investor events intelligence platform with two backend services and one frontend SPA:

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│          React 19 + Vite (SPA)               │
│     Served as static files by Node service   │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│            Node.js Service                   │
│     Express + tRPC + Drizzle ORM             │
│     Port: 10000 (Render default)             │
│     110 tRPC routers                         │
│     Webhooks, email, voice, real-time        │
└──────────────────┬──────────────────────────┘
                   │ HTTP (internal)
┌──────────────────▼──────────────────────────┐
│         Python AI Core Service               │
│     FastAPI + SQLAlchemy + psycopg           │
│     Port: 10000 (separate Render service)    │
│     Analysis, drift, governance, briefing    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          PostgreSQL Database                 │
│     221 tables, Drizzle-managed schema       │
└─────────────────────────────────────────────┘
```

---

## 2. Render Services to Create

### Service 1: curalive-node (Web Service)

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Name** | `curalive-node` |
| **Runtime** | Node |
| **Branch** | `RenderMigration` |
| **Root Directory** | _(leave blank — repo root)_ |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `NODE_ENV=production node dist/index.js` |
| **Health Check Path** | `/health` |
| **Plan** | Starter or Standard |

### Service 2: curalive-ai-core (Web Service)

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Name** | `curalive-ai-core` |
| **Runtime** | Python 3.12 |
| **Branch** | `RenderMigration` |
| **Root Directory** | `curalive_ai_core` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |
| **Plan** | Starter |

### Service 3: curalive-db (PostgreSQL)

| Setting | Value |
|---------|-------|
| **Type** | PostgreSQL |
| **Name** | `curalive-db` |
| **PostgreSQL Version** | 16 |
| **Plan** | Starter or Standard |

---

## 3. Build Commands — Detailed

### Node Build (`npm run build`)

This executes two steps defined in `package.json`:

```bash
# Step 1: Vite builds the React frontend into dist/public/
NODE_OPTIONS='--max-old-space-size=4096' vite build --logLevel warn

# Step 2: esbuild bundles the Express server into dist/index.js
esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

Output structure:
```
dist/
├── index.js          # Bundled Express + tRPC server (2.2MB)
└── public/
    ├── index.html    # React SPA entry point
    └── assets/
        ├── index.js  # React app bundle
        └── ...       # CSS, fonts, images
```

### Python Build (`pip install -r requirements.txt`)

Dependencies in `curalive_ai_core/requirements.txt`:
```
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
pydantic-settings==2.13.1
sqlalchemy==2.0.49
psycopg[binary]==3.3.3
```

---

## 4. Environment Variables

### Node Service (curalive-node)

**Required:**

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | _(from Render PostgreSQL Internal URL)_ | Must use internal URL |
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render default, auto-set |
| `OPENAI_API_KEY` | _(your OpenAI key)_ | Direct API, no proxy |
| `JWT_SECRET` | _(your secret)_ | Session signing |
| `ABLY_API_KEY` | _(your Ably key)_ | Real-time messaging |
| `RECALL_AI_API_KEY` | _(your key)_ | Transcript bot integration |
| `RECALL_AI_WEBHOOK_SECRET` | _(your secret)_ | Webhook verification |
| `RESEND_API_KEY` | _(your key)_ | Email delivery |
| `AI_CORE_URL` | `http://curalive-ai-core:10000` | Internal Python service URL |
| `APP_ORIGIN` | `https://curalive-node.onrender.com` | Public URL (or custom domain) |

**Optional (enable when ready):**

| Variable | Value | Notes |
|----------|-------|-------|
| `TWILIO_ACCOUNT_SID` | _(your SID)_ | Voice calls |
| `TWILIO_AUTH_TOKEN` | _(your token)_ | Voice calls |
| `TWILIO_API_KEY` | _(your key)_ | Voice SDK tokens |
| `TWILIO_API_SECRET` | _(your secret)_ | Voice SDK tokens |
| `TWILIO_CALLER_ID` | _(phone number)_ | Outbound caller ID |
| `TELNYX_API_KEY` | _(your key)_ | Voice failover |
| `TELNYX_CALLER_ID` | _(phone number)_ | Telnyx caller ID |
| `TELNYX_CONNECTION_ID` | _(connection ID)_ | Telnyx SIP |
| `MUX_TOKEN_ID` | _(your ID)_ | Video streaming |
| `MUX_TOKEN_SECRET` | _(your secret)_ | Video streaming |
| `MUX_WEBHOOK_SECRET` | _(your secret)_ | Mux webhooks |
| `STRIPE_SECRET_KEY` | _(your key)_ | Billing |

**Do NOT set (Replit-only, not needed on Render):**

- `REPLIT_DEPLOYMENT_URL` — replaced by `APP_ORIGIN`
- `REPLIT_DEV_DOMAIN` — replaced by `APP_ORIGIN`
- `AI_INTEGRATIONS_OPENAI_API_KEY` — replaced by `OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — not needed
- `BUILT_IN_FORGE_API_KEY` — Replit-only
- `BUILT_IN_FORGE_API_URL` — Replit-only

### Python Service (curalive-ai-core)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | _(from Render PostgreSQL Internal URL)_ | Same database as Node |
| `PORT` | `10000` | Auto-set by Render |

---

## 5. Database Migration

### Step 1: Create the Render PostgreSQL database

Create it in the Render dashboard. Copy the **External Database URL**.

### Step 2: Import the backup

From your local machine or any environment with `psql`:

```bash
psql <RENDER_EXTERNAL_DATABASE_URL> < curalive_db_backup.sql
```

The backup file `curalive_db_backup.sql` (5.6MB, 222 tables) is in the repository root.

### Step 3: Verify the import

```bash
psql <RENDER_EXTERNAL_DATABASE_URL> -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected: `221` (plus system tables).

### Step 4: Verify key row counts

```sql
SELECT 'shadow_sessions', COUNT(*) FROM shadow_sessions
UNION ALL SELECT 'partners', COUNT(*) FROM partners
UNION ALL SELECT 'client_tokens', COUNT(*) FROM client_tokens
UNION ALL SELECT 'historical_commitments', COUNT(*) FROM historical_commitments;
```

Expected: shadow_sessions=16, partners=2, client_tokens=5, historical_commitments=18.

---

## 6. Node → Python Communication

The Node service calls the Python AI Core via HTTP. All calls go through `server/services/AICoreClient.ts`:

```typescript
const AI_CORE_BASE_URL = process.env.AI_CORE_URL ?? "http://localhost:5000";
```

On Render, set `AI_CORE_URL=http://curalive-ai-core:10000` on the Node service.

### Endpoints Called

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/analysis/run` | Run analysis on event transcript |
| GET | `/api/analysis/jobs/:id` | Get analysis job status |
| GET | `/api/analysis/jobs/:id/results` | Get analysis results |
| POST | `/api/drift/run` | Run commitment drift analysis |
| POST | `/api/stakeholder/ingest` | Ingest stakeholder signals |
| POST | `/api/briefing/generate` | Generate pre-event briefing |
| GET | `/api/briefing/:id` | Get briefing |
| POST | `/api/governance/generate` | Generate governance record |
| GET | `/api/governance/:id` | Get governance record |
| POST | `/api/profile/update` | Update organisation profile |
| GET | `/api/profile/:orgId` | Get organisation profile |
| GET | `/api/profile/:orgId/summary` | Get profile summary |
| POST | `/api/benchmark/build` | Build sector benchmark |
| GET | `/api/benchmark/list` | List benchmarks |
| GET | `/api/benchmark/:key` | Get specific benchmark |
| POST | `/api/benchmark/enrich-sector` | Enrich sector data |

---

## 7. LLM Configuration

The `invokeLLM` function in `server/_core/llm.ts` resolves the API endpoint in this priority:

1. `AI_INTEGRATIONS_OPENAI_BASE_URL` → Replit proxy (skip on Render)
2. `BUILT_IN_FORGE_API_URL` → Replit Forge (skip on Render)
3. `OPENAI_API_KEY` → `https://api.openai.com/v1/chat/completions` (use this on Render)

**On Render:** Set only `OPENAI_API_KEY`. The system automatically calls OpenAI directly using model `gpt-4o`.

---

## 8. Webhook URLs to Update

After deploying to Render, update these external service webhook URLs:

| Service | Webhook URL | Where to Update |
|---------|-------------|-----------------|
| Recall.ai | `https://<your-render-domain>/api/recall/webhook` | Recall.ai dashboard |
| Mux | `https://<your-render-domain>/api/mux/webhook` | Mux dashboard |
| Twilio | `https://<your-render-domain>/api/webphone/inbound` | Twilio TwiML App settings |
| Stripe | `https://<your-render-domain>/api/stripe/webhook` | Stripe dashboard |

---

## 9. Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Node | `GET /health` | `{"ok":true, "version":"2025.04.10-C", ...}` |
| Python | `GET /health` | `{"status":"ok"}` |

---

## 10. Demo Tokens (for testing after deployment)

| Token | URL Path | Purpose |
|-------|----------|---------|
| `demo-live-001` | `/live/demo-live-001` | Live event viewer |
| `demo-report-001` | `/report/demo-report-001` | Post-event report |
| `demo-presenter-001` | `/presenter/demo-presenter-001` | Presenter view |

---

## 11. Cron Jobs

**None required.** All scheduling in CuraLive is request-driven or runs on in-process intervals when the Node server starts. There are no external cron jobs needed.

In-process schedulers (start automatically with the Node server):
- HealthGuardian — monitoring every 30s
- ComplianceEngine — scanning every 300s
- ComplianceDeadlineMonitor — checking every 15 minutes
- BriefingScheduler — checking every 5 minutes
- SubscriptionBilling — runs on 1st of each month
- ShadowWatchdog — checking every 60s
- ReminderScheduler — checking every 300s

---

## 12. Deployment Order

1. **Create PostgreSQL database** on Render
2. **Import database** using `curalive_db_backup.sql`
3. **Deploy Python AI Core** (`curalive-ai-core`) — needs `DATABASE_URL` only
4. **Deploy Node service** (`curalive-node`) — needs all env vars including `AI_CORE_URL` pointing to Python service
5. **Verify health endpoints** on both services
6. **Update webhook URLs** in Recall.ai, Mux, Twilio, Stripe dashboards
7. **Test demo tokens** to confirm end-to-end functionality

---

## 13. Render Blueprint (render.yaml)

Place this in the repository root if you want automated Render setup:

```yaml
databases:
  - name: curalive-db
    plan: starter
    databaseName: curalive
    postgresMajorVersion: "16"

services:
  - type: web
    name: curalive-node
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: NODE_ENV=production node dist/index.js
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: curalive-db
          property: connectionString
      - key: NODE_ENV
        value: production
      - key: AI_CORE_URL
        fromService:
          type: web
          name: curalive-ai-core
          property: hostport
      - key: APP_ORIGIN
        value: https://curalive-node.onrender.com
      - key: OPENAI_API_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ABLY_API_KEY
        sync: false
      - key: RECALL_AI_API_KEY
        sync: false
      - key: RECALL_AI_WEBHOOK_SECRET
        sync: false
      - key: RESEND_API_KEY
        sync: false

  - type: web
    name: curalive-ai-core
    runtime: python
    plan: starter
    rootDir: curalive_ai_core
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: curalive-db
          property: connectionString
```

---

## 14. Post-Deployment Checklist

- [ ] PostgreSQL database created and backup imported
- [ ] Python service deployed and `/health` returns `{"status":"ok"}`
- [ ] Node service deployed and `/health` returns `{"ok":true}`
- [ ] Root URL `/` loads the React SPA
- [ ] `/live/demo-live-001` loads live event viewer
- [ ] `/report/demo-report-001` loads post-event report
- [ ] `/presenter/demo-presenter-001` loads presenter view
- [ ] Webhook URLs updated in Recall.ai, Mux, Twilio, Stripe
- [ ] Custom domain configured (if applicable)
