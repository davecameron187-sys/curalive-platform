# CuraLive Render Migration — Deliverables Report

## Phase 1: Python AI Core Deployment — FIXED

### Task 1.1: Python Import Audit

All imports found in `curalive_ai_core/`:

```
fastapi
uvicorn
pydantic
pydantic_settings (BaseSettings, SettingsConfigDict)
sqlalchemy (create_engine, ORM, dialects.postgresql)
psycopg (via postgresql+psycopg:// driver string)
dataclasses
logging
os
re
time
uuid
collections (Counter, OrderedDict)
contextlib
enum
typing
datetime
```

### Task 1.2: Updated requirements.txt

```
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
pydantic-settings==2.13.1
sqlalchemy==2.0.49
psycopg[binary]==3.3.3
```

`pip install -r requirements.txt` completes without errors.

### Task 1.3: Python Start Command — VERIFIED

```bash
cd curalive_ai_core
uvicorn app.main:app --host 0.0.0.0 --port 10000
```

Result: Starts successfully, `/health` returns `{"status":"ok"}`.

---

## Phase 2: Node → Python Service Communication — DOCUMENTED

### Task 2.1: Where Node Calls Python

**File:** `server/services/AICoreClient.ts`
**Line 1:** `const AI_CORE_BASE_URL = process.env.AI_CORE_URL ?? "http://localhost:5000";`

### Task 2.2: Configuration Details

| Question | Answer |
|----------|--------|
| Current Python service URL | `http://localhost:5000` (default) |
| Configurable via env var? | Yes |
| Environment variable name | `AI_CORE_URL` |
| Endpoints called by Node | See list below |

**Endpoints called on Python service:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/analysis/run` | Run analysis job |
| GET | `/api/analysis/jobs/:id` | Get job summary |
| GET | `/api/analysis/jobs/:id/results` | Get job results |
| POST | `/api/drift/run` | Run drift analysis |
| POST | `/api/stakeholder/ingest` | Ingest stakeholder signals |
| POST | `/api/briefing/generate` | Generate briefing |
| GET | `/api/briefing/:id` | Get briefing |
| POST | `/api/governance/generate` | Generate governance record |
| GET | `/api/governance/:id` | Get governance record |
| POST | `/api/profile/update` | Update org profile |
| GET | `/api/profile/:orgId` | Get org profile |
| GET | `/api/profile/:orgId/summary` | Get profile summary |
| POST | `/api/benchmark/build` | Build benchmark |
| GET | `/api/benchmark/list` | List benchmarks |
| GET | `/api/benchmark/:key` | Get benchmark |
| POST | `/api/benchmark/enrich-sector` | Enrich sector data |

### Task 2.3: Environment Variable

Already exists: `AI_CORE_URL` in `server/services/AICoreClient.ts`.

For Render, set: `AI_CORE_URL=http://curalive-ai-core:10000`

---

## Phase 3: Environment Variable Audit — COMPLETE

### Critical Variables for Render

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | YES |
| `NODE_ENV` | Set to `production` | YES |
| `PORT` | Node service port (10000 on Render) | YES |
| `OPENAI_API_KEY` | LLM API key (direct OpenAI, not Replit proxy) | YES |
| `JWT_SECRET` | Session signing | YES |
| `ABLY_API_KEY` | Real-time messaging | YES |
| `RECALL_AI_API_KEY` | Transcript bot | YES |
| `RECALL_AI_WEBHOOK_SECRET` | Webhook security | YES |
| `RESEND_API_KEY` | Email delivery | YES |
| `TWILIO_ACCOUNT_SID` | Voice calls | Optional |
| `TWILIO_AUTH_TOKEN` | Voice calls | Optional |
| `TWILIO_API_KEY` | Voice SDK tokens | Optional |
| `TWILIO_API_SECRET` | Voice SDK tokens | Optional |
| `TWILIO_CALLER_ID` | Outbound caller ID | Optional |
| `TELNYX_API_KEY` | Voice failover | Optional |
| `TELNYX_CALLER_ID` | Telnyx caller ID | Optional |
| `TELNYX_CONNECTION_ID` | Telnyx SIP connection | Optional |
| `MUX_TOKEN_ID` | Video streaming | Optional |
| `MUX_TOKEN_SECRET` | Video streaming | Optional |
| `MUX_WEBHOOK_SECRET` | Mux webhooks | Optional |
| `STRIPE_SECRET_KEY` | Billing | Optional |
| `AI_CORE_URL` | Python AI service URL | YES (set to internal Render URL) |
| `APP_ORIGIN` | Public app URL (replaces REPLIT_DEPLOYMENT_URL) | YES |

### Replit-Specific Variables to Replace

| Replit Variable | Render Replacement |
|----------------|-------------------|
| `REPLIT_DEPLOYMENT_URL` | Use `APP_ORIGIN` instead (e.g., `https://curalive.onrender.com`) |
| `REPLIT_DEV_DOMAIN` | Use `APP_ORIGIN` instead |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Use `OPENAI_API_KEY` directly |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Not needed — will use `https://api.openai.com/v1/chat/completions` |
| `BUILT_IN_FORGE_API_KEY` | Not needed — Replit-only |
| `BUILT_IN_FORGE_API_URL` | Not needed — Replit-only |

### LLM Configuration on Render

The `invokeLLM` function in `server/_core/llm.ts` resolves the API endpoint in this order:
1. `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit proxy — skip on Render)
2. `BUILT_IN_FORGE_API_URL` (Replit Forge — skip on Render)
3. `OPENAI_API_KEY` → calls `https://api.openai.com/v1/chat/completions` directly

**On Render:** Set only `OPENAI_API_KEY`. The function will automatically use OpenAI directly with model `gpt-4o`.

---

## Phase 4: Database Schema Verification — COMPLETE

### Task 4.1: Key Tables Confirmed

All 8 key tables exist with correct columns:

- `shadow_sessions` — 37 columns (id, client_name, event_name, status, recall_bot_id, ai_core_*, etc.)
- `occ_transcription_segments` — 9 columns (id, conference_id, speaker_name, text, etc.)
- `regulatory_flags` — 11 columns (id, monitor_id, flag_type, severity, statement, etc.)
- `approved_questions_queue` — 14 columns (id, session_id, question_text, status, etc.)
- `historical_commitments` — 16 columns (id, company, commitment, status, etc.)
- `board_members` — 14 columns (id, company, name, role, committee, etc.)
- `client_tokens` — 11 columns (id, token, session_id, recipient_email, etc.)
- `scheduled_sessions` — 16 columns (id, event_name, company, scheduled_at, etc.)

### Task 4.2: Row Counts

| Table | Row Count |
|-------|-----------|
| shadow_sessions | 16 |
| occ_transcription_segments | 10 |
| regulatory_flags | 6 |
| approved_questions_queue | 0 |
| historical_commitments | 18 |
| board_members | 0 |
| client_tokens | 5 |
| scheduled_sessions | 2 |
| partners | 2 |

**Total tables in database: 221**

---

## Phase 5: Build Verification — COMPLETE

### Task 5.1: Node Build — PASSED

```bash
npm run build
```

Output:
- Vite builds React frontend → `dist/public/` (index.html + assets)
- esbuild bundles Node server → `dist/index.js` (2.2MB)
- No errors

### Task 5.2: Node Start — PASSED

```bash
NODE_ENV=production PORT=10000 node dist/index.js
```

Results:
- Server starts on port 10000, binds to 0.0.0.0
- Connects to database successfully
- `/health` → HTTP 200, `{"ok":true}`
- `/` → HTTP 200, serves SPA HTML (963 bytes), `X-Served-By: curalive-spa`
- No errors

### Task 5.3: Python Build and Start — PASSED

```bash
cd curalive_ai_core
pip install -r requirements.txt  # Completes without errors
uvicorn app.main:app --host 0.0.0.0 --port 10000
```

Results:
- Starts without ModuleNotFoundError
- `/health` → HTTP 200, `{"status":"ok"}`
- Database tables created/verified
- No errors

---

## Phase 6: Commit and Push

Changes made:
- Updated `curalive_ai_core/requirements.txt` with all production dependencies
- Restored `vite.config.ts` output path to `dist/public` (original working config)
- Restored `server/_core/vite.ts` static path resolution to `dist/public` (original working config)

Ready for commit and push to `RenderMigration` branch.

---

## Summary

| Deliverable | Status |
|------------|--------|
| Updated requirements.txt | COMPLETE |
| Python service URL configuration | `AI_CORE_URL` in `server/services/AICoreClient.ts` |
| Environment variable mapping | See Phase 3 tables |
| Database row counts | See Phase 4 table |
| Node build verification | PASSED |
| Node start verification | PASSED |
| Python service verification | PASSED |
| Cron jobs needed on Render | NONE (all scheduling is request-driven) |
