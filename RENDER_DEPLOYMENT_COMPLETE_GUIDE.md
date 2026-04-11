# CuraLive Replit → Render Migration — Complete Deployment Guide
## Phase 7-9: Database Migration, Verification, and Webhooks
### April 2026 — Confidential

---

## Overview

This guide covers the final three phases of the CuraLive migration:
- **Phase 7:** Database migration from Replit to Render
- **Phase 8:** Platform verification on Render
- **Phase 9:** External webhook updates and DNS cutover

**Prerequisites:**
- ✅ Python dependencies fixed (requirements.txt updated)
- ✅ Node build verified
- ✅ Code pushed to RenderMigration branch on GitHub
- ✅ Database backup available (curalive_db_backup.sql, 5.6MB)

---

## Phase 7: Database Migration

### 7.1 Export Database from Replit

**In Replit terminal, run:**

```bash
# Export the entire database to SQL file
pg_dump $DATABASE_URL > curalive_db_backup.sql

# Verify the backup was created
ls -lh curalive_db_backup.sql
```

**Expected output:**
```
-rw-r--r-- 1 ubuntu ubuntu 5.6M Apr 11 12:34 curalive_db_backup.sql
```

**The backup contains:**
- 222 tables (full schema)
- All data from 16 shadow_sessions, 10 transcription segments, 6 regulatory flags, etc.
- All indexes and constraints

### 7.2 Download Backup to Local Machine

**Option A: Download from Replit file browser**
1. In Replit, open the file browser on the left
2. Find `curalive_db_backup.sql`
3. Right-click → Download

**Option B: Push to GitHub and pull locally**
```bash
# In Replit
git add curalive_db_backup.sql
git commit -m "Database backup for Render migration"
git push origin RenderMigration

# On your local machine
git clone https://github.com/davecameron187-sys/curalive-platform.git
cd curalive-platform
git checkout RenderMigration
# curalive_db_backup.sql is now available locally
```

### 7.3 Create PostgreSQL Database on Render

**In Render dashboard:**

1. Click **New** → **PostgreSQL**
2. Configure:
   - **Name:** `curalive-postgres`
   - **Database:** `curalive`
   - **User:** `curalive_user`
   - **Region:** Oregon (US West) — same as Node/Python services
   - **Plan:** Standard (minimum 256MB for production)
3. Click **Create Database**
4. Wait for database to be available (status = "Available")

**After creation:**
- Copy the **External Database URL** (for import)
- Copy the **Internal Database URL** (for env vars on services)

### 7.4 Import Database to Render

**On your local machine with psql installed:**

```bash
# Import the backup using the External Database URL
psql <RENDER_EXTERNAL_DATABASE_URL> < curalive_db_backup.sql

# Expected output:
# CREATE SCHEMA
# CREATE TABLE
# CREATE INDEX
# ... (many more tables/indexes)
# COPY ... (data import)
```

**If psql is not installed:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
Download from https://www.postgresql.org/download/windows/
```

### 7.5 Verify Database Import

**Connect to the Render database and verify:**

```bash
# Connect to the imported database
psql <RENDER_EXTERNAL_DATABASE_URL>

# In psql, run:
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';

# Expected: 222 tables

# Verify key tables and row counts
SELECT 'shadow_sessions' as table_name, COUNT(*) as rows FROM shadow_sessions
UNION ALL
SELECT 'occ_transcription_segments', COUNT(*) FROM occ_transcription_segments
UNION ALL
SELECT 'regulatory_flags', COUNT(*) FROM regulatory_flags
UNION ALL
SELECT 'approved_questions_queue', COUNT(*) FROM approved_questions_queue
UNION ALL
SELECT 'historical_commitments', COUNT(*) FROM historical_commitments
UNION ALL
SELECT 'board_members', COUNT(*) FROM board_members
UNION ALL
SELECT 'client_tokens', COUNT(*) FROM client_tokens
UNION ALL
SELECT 'scheduled_sessions', COUNT(*) FROM scheduled_sessions;

# Expected row counts:
# shadow_sessions: 16
# occ_transcription_segments: 10
# regulatory_flags: 6
# approved_questions_queue: 0
# historical_commitments: 18
# board_members: 0
# client_tokens: 5
# scheduled_sessions: 2
```

---

## Phase 8: Create Render Services

### 8.1 Create Python AI Core Service

**In Render dashboard:**

1. Click **New** → **Web Service**
2. Connect your GitHub repository: `davecameron187-sys/curalive-platform`
3. Configure:
   - **Name:** `curalive-ai-core`
   - **Branch:** `RenderMigration`
   - **Root Directory:** `curalive_ai_core`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Starter (for testing) or Standard (for production)
   - **Region:** Oregon (US West)
4. Click **Create Web Service**

**Environment Variables for Python service:**
```
PORT=10000
PYTHON_VERSION=3.12.3
```

**Wait for deployment to complete** (status = "Live")

### 8.2 Create Node Service

**In Render dashboard:**

1. Click **New** → **Web Service**
2. Connect your GitHub repository: `davecameron187-sys/curalive-platform`
3. Configure:
   - **Name:** `curalive-node`
   - **Branch:** `RenderMigration`
   - **Root Directory:** (leave empty — repo root)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** Starter (for testing) or Standard (for production)
   - **Region:** Oregon (US West)
4. Click **Create Web Service**

**Environment Variables for Node service:**

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render will assign this |
| `DATABASE_URL` | `<RENDER_INTERNAL_DATABASE_URL>` | From PostgreSQL service Info tab |
| `AI_CORE_URL` | `http://curalive-ai-core:10000` | Internal service URL |
| `APP_ORIGIN` | `https://curalive-node.onrender.com` | Or your custom domain |
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `JWT_SECRET` | `<your-jwt-secret>` | Session signing key |
| `ABLY_API_KEY` | `<your-ably-key>` | Real-time messaging |
| `RECALL_AI_API_KEY` | `<your-recall-key>` | Transcript bot |
| `RECALL_AI_WEBHOOK_SECRET` | `<your-webhook-secret>` | Webhook security |
| `RESEND_API_KEY` | `<your-resend-key>` | Email delivery |
| `TWILIO_ACCOUNT_SID` | `<optional>` | Voice calls |
| `TWILIO_AUTH_TOKEN` | `<optional>` | Voice calls |
| `TELNYX_API_KEY` | `<optional>` | Voice failover |
| `MUX_TOKEN_ID` | `<optional>` | Video streaming |
| `MUX_TOKEN_SECRET` | `<optional>` | Video streaming |
| `STRIPE_SECRET_KEY` | `<optional>` | Billing |

**Wait for deployment to complete** (status = "Live")

---

## Phase 8: Verification

### 8.1 Health Checks

**Test Python AI Core service:**
```bash
curl https://curalive-ai-core.onrender.com/health
# Expected: {"status":"ok"}
```

**Test Node service:**
```bash
curl https://curalive-node.onrender.com/health
# Expected: {"ok":true}
```

### 8.2 Frontend Verification

**Open in browser:**
```
https://curalive-node.onrender.com/
```

Expected: SPA HTML loads, no 404 errors

### 8.3 Demo Token Routes

**Test all three demo token routes:**

```bash
# Live view
curl https://curalive-node.onrender.com/live/demo-live-001

# Report view
curl https://curalive-node.onrender.com/report/demo-report-001

# Presenter view
curl https://curalive-node.onrender.com/presenter/demo-presenter-001
```

Expected: All return HTTP 200 with HTML content

### 8.4 Database Connectivity

**From Node service logs, verify:**
```
✓ Database connected
✓ All tables accessible
✓ No connection errors
```

### 8.5 End-to-End Shadow Mode Test

**In the Node service:**

1. Create a test session
2. Add a transcript with forward guidance: "margins to be in the range of 20 to 22 percent"
3. Close the session
4. Verify:
   - Compliance email arrives within 2 minutes
   - AI report generates within 5 minutes
   - Report link email arrives
   - All 10 report tabs load with data

### 8.6 Email Delivery Test

**Test RESEND_API_KEY:**

```bash
curl -X POST https://api.resend.com/emails \
  -H 'Authorization: Bearer <RESEND_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@curalive.onrender.com",
    "to": "test@example.com",
    "subject": "CuraLive Render Test",
    "html": "<p>Migration successful!</p>"
  }'

# Expected: {"id":"<email_id>","from":"noreply@curalive.onrender.com","to":"test@example.com","created_at":"..."}
```

---

## Phase 9: External Webhooks & DNS Cutover

### 9.1 Update Recall.ai Webhook URL

**In Recall.ai dashboard:**

1. Go to **Settings** → **Webhooks**
2. Update webhook URL from:
   ```
   https://curalive.replit.dev/api/webhooks/recall
   ```
   to:
   ```
   https://curalive-node.onrender.com/api/webhooks/recall
   ```
3. Verify webhook secret matches `RECALL_AI_WEBHOOK_SECRET` env var

### 9.2 Update Mux Webhook URL

**In Mux dashboard:**

1. Go to **Settings** → **Webhooks**
2. Update webhook URL from:
   ```
   https://curalive.replit.dev/api/webhooks/mux
   ```
   to:
   ```
   https://curalive-node.onrender.com/api/webhooks/mux
   ```
3. Verify webhook secret matches `MUX_WEBHOOK_SECRET` env var

### 9.3 Update Twilio/Telnyx Webhook URLs

**In Twilio dashboard:**

1. Go to **Phone Numbers** → **Manage Numbers**
2. For each number, update:
   - **Messaging webhook:** `https://curalive-node.onrender.com/api/webhooks/twilio/sms`
   - **Voice webhook:** `https://curalive-node.onrender.com/api/webhooks/twilio/voice`

**In Telnyx dashboard:**

1. Go to **Messaging Profiles** or **Voice Profiles**
2. Update webhook URL from:
   ```
   https://curalive.replit.dev/api/webhooks/telnyx
   ```
   to:
   ```
   https://curalive-node.onrender.com/api/webhooks/telnyx
   ```

### 9.4 DNS Cutover for Lumi Global (LAST STEP)

**⚠️ CRITICAL: Do this LAST, after all verification is complete**

**In Lumi Global domain registrar:**

1. Go to **DNS Settings** for `intelligence.lumigroup.com`
2. Update CNAME record from:
   ```
   CNAME: curalive.replit.dev
   ```
   to:
   ```
   CNAME: curalive-node.onrender.com
   ```
3. Wait 5-15 minutes for DNS propagation
4. Verify: `https://intelligence.lumigroup.com/` loads the CuraLive app

**Parallel: Update Bastion Group domain (if applicable)**

---

## Rollback Plan (If Needed)

If Render deployment fails at any point:

1. **Keep Replit running** — Do not shut down until Render is verified stable
2. **Revert DNS** — Point Lumi domain back to Replit
3. **Investigate logs** — Check Render service logs for errors
4. **Fix and redeploy** — Push fixes to RenderMigration, Render auto-redeploys

---

## Verification Checklist

Before final DNS cutover, verify all items:

- [ ] Python AI Core service is Live and /health returns {"status":"ok"}
- [ ] Node service is Live and /health returns {"ok":true}
- [ ] Database imported successfully, row counts verified
- [ ] Frontend loads at https://curalive-node.onrender.com/
- [ ] All three demo token routes work (/live/, /report/, /presenter/)
- [ ] End-to-end Shadow Mode test passed (email delivery, AI report, report links)
- [ ] Email delivery test passed (RESEND_API_KEY working)
- [ ] All webhooks updated (Recall.ai, Mux, Twilio, Telnyx)
- [ ] Replit still running as backup
- [ ] DNS cutover ready for Lumi Global

---

## Support & Troubleshooting

### Python Service Won't Start

**Error:** `ModuleNotFoundError: No module named 'sqlalchemy'`

**Fix:** Verify requirements.txt has all 6 dependencies:
```
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
pydantic-settings==2.13.1
sqlalchemy==2.0.49
psycopg[binary]==3.3.3
```

### Node Service 404 Errors

**Error:** All routes return 404

**Fix:** Verify `npm run build` completed successfully and `dist/` folder exists with:
- `dist/public/index.html` (React frontend)
- `dist/index.js` (Node server)

### Database Connection Errors

**Error:** `Error: connect ECONNREFUSED`

**Fix:** Verify `DATABASE_URL` env var uses the **Internal** database URL (not External)

### Webhooks Not Firing

**Error:** Webhook endpoints not receiving POST requests

**Fix:** Verify webhook URLs are updated in all external services and webhook secrets match env vars

---

## Next Steps After Successful Migration

1. **Monitor Render services** for 24-48 hours
2. **Keep Replit running** as a backup
3. **Gradual traffic shift** — Route 10% → 50% → 100% to Render
4. **Decommission Replit** — After 1 week of stable Render operation
5. **Archive database backup** — Store curalive_db_backup.sql securely

---

## Contact & Support

For issues during migration, contact Render support at https://render.com/support

For CuraLive-specific issues, refer to the Handoff Brief and Replit Status Brief.
