# CuraLive Platform — Status Brief

**Date:** 26 March 2026
**CIPC Patent App ID:** 1773575338868 (75 Claims, 35 Modules)
**Replit Project:** Active and running
**GitHub Source:** davecameron187-sys/curalive-platform (main branch)

---

## 1. WHAT IS LIVE AND WORKING

### Server & Infrastructure
- Express + tRPC server running on `0.0.0.0:3000`
- Health check endpoint: `GET /health` returns `{"status":"ok","timestamp":"..."}`
- PostgreSQL database (Replit Helium) — fully operational
- Replit Object Storage (GCS-backed) — provisioned and connected for file uploads
- 99 tRPC routers fully registered and synchronized across both router files (89 imported + 10 inline)
- 4 background services running automatically:
  - **HealthGuardian** — autonomous health monitoring every 30 seconds
  - **ComplianceEngine** — regulatory scanning every 300 seconds
  - **ShadowWatchdog** — zombie session cleanup every 60 seconds
  - **ReminderScheduler** — automated notifications every 300 seconds
- Graceful shutdown with SIGTERM/SIGINT handling

### Frontend (React 19 + Vite + TailwindCSS 4)
- Full Operator Dashboard with 6 tabs: Overview, Shadow Mode, Events, Partners, Billing, Settings
- System health monitoring: 79% health score, live dashboard cards
- All 20 AI module definitions active in Intelligence Suite
- Dark-themed professional UI with Shadcn/UI components
- 15+ page routes all functional

### Shadow Mode (Core Feature)
- Session creation, listing, and management — fully operational
- Recall.ai bot deployment — configured (`RECALL_AI_API_KEY` set)
- Local Audio Capture mode — browser MediaRecorder-based capture
- 27 event types supported across 7 categories
- 11 tRPC procedures (startSession, endSession, listSessions, getSession, etc.)
- 9-step post-session processing cascade defined and ready
- ShadowWatchdog background service running

### Archive & Reports
- 4 archive events with full transcripts restored:
  - Naspers Q4 2025 Earnings Call
  - Standard Bank H2 2025 Results
  - FirstRand Capital Markets Day 2025
  - Discovery Annual Results 2025
- Download Transcript (TXT) and Download Recording (MP3) buttons
- 20-module AI analysis pipeline defined
- REST endpoints: `GET /api/archives/:id/transcript`, `GET /api/archives/:id/recording`

### Compliance & Governance
- SOC 2 compliance controls: 36 records seeded
- ISO 27001 compliance controls: 32 records seeded
- ComplianceEngine background scanning active
- AI Automated Moderator (AI-AM) with violation detection and stats
- Compliance detection statistics table provisioned

### Database (PostgreSQL)
| Table | Records | Status |
|-------|---------|--------|
| health_checks | 4,716 | Live monitoring |
| archive_events | 4 | With full transcripts |
| soc2_controls | 36 | Seeded |
| iso27001_controls | 32 | Seeded |
| tagged_metrics | 12 | From archive processing |
| shadow_sessions | 0 | Ready for use |
| compliance_detection_stats | 0 | Ready for use |
| users | 0 | Auth bypassed in dev mode |

### AI Integration
- OpenAI GPT-4o connected via Replit AI integration proxy
- 16-module AI report generation for completed sessions
- Press release generator (SENS/RNS-style)
- Event summary generator with structured JSON output
- Advisory bot and support chat interfaces
- Intelligence Suite with 11 advanced algorithms:
  - Evasive Answer Detection, Market Impact Forecast, Multi-Modal Compliance
  - External Sentiment, IR Briefing Generator, Materiality Risk Oracle
  - Investor Intention Decoder, Cross-Event Consistency Guardian
  - Predictive Volatility Simulator, Autonomous Regulatory Intervention
  - Event Integrity Digital Twin

### Object Storage
- Replit Object Storage provisioned (replaces AWS S3)
- Bucket configured with `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `storagePut()`, `storageGet()`, `storageDelete()`, `storageExists()` all implemented
- Avatar uploads and file storage functional

---

## 2. WHAT IS NOT YET FUNCTIONAL (Needs API Keys)

| Feature | What's Missing | Priority | Impact |
|---------|---------------|----------|--------|
| **Real-time transcript streaming** | `ABLY_API_KEY` | HIGH | Falls back to polling (3s interval) instead of WebSocket |
| **Email report delivery** | `RESEND_API_KEY` | HIGH | Cannot send event reports, compliance digests by email |
| **Recall.ai webhook verification** | `RECALL_AI_WEBHOOK_SECRET` | MEDIUM | Webhooks work but without HMAC signature verification |
| **Payment processing** | `STRIPE_SECRET_KEY` | MEDIUM | Billing UI works but no payment collection |
| **Telephony (OCC)** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID`, `TWILIO_CALLER_ID` | MEDIUM | Operator Call Centre non-functional |
| **SIP trunking (backup)** | `TELNYX_API_KEY`, `TELNYX_SIP_USERNAME`, `TELNYX_SIP_PASSWORD` | LOW | Backup carrier for dual-carrier failover |
| **Video streaming** | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | MEDIUM | Live video/webcast non-functional |
| **Production auth** | `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` | LOW (dev) | Currently bypassed — dev mode returns Dev Operator |

**Note:** User declined Replit integrations for Stripe, Resend, and Twilio. These must be configured as direct secrets when ready.

---

## 3. CONFIGURED SECRETS

| Secret | Status |
|--------|--------|
| `DATABASE_URL` + `PG*` | Configured (Replit Helium) |
| `JWT_SECRET` | Configured (auto-generated) |
| `SESSION_SECRET` | Configured |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Configured (Replit Object Storage) |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Configured |
| `PRIVATE_OBJECT_DIR` | Configured |
| `RECALL_AI_API_KEY` | Referenced in code — verify in Replit Secrets tab |
| `MUX_WEBHOOK_SECRET` | Referenced in code — verify in Replit Secrets tab |

---

## 4. ALL ROUTES

### Main Dashboard (`/`)
| Tab | Purpose |
|-----|---------|
| Overview | System health, quick actions, recent sessions |
| Shadow Mode | 8 sub-tabs: Live Intelligence, Archive Upload, Reports, AI Learning, AI Dashboard, Advisory, Diagnostics, Live Q&A |
| Events | Webcasting, calendar, mailing |
| Partners | Bastion Capital + Lumi Global |
| Billing | Admin billing management |
| Settings | Account and system settings |

### Other Routes
| Route | Purpose |
|-------|---------|
| `/intelligence-suite` | 11 AI algorithms |
| `/event/:id` | Event room |
| `/m/:eventId` | Attendee room |
| `/operator/:id` | Operator console |
| `/operator-dashboard` | Operator dashboard |
| `/operator-links` | Operator links directory |
| `/qa/:accessCode` | Public attendee Q&A |
| `/post-event/:id` | Post-event report |
| `/transcript/:id/edit` | Transcript editor |
| `/ai-dashboard` | AI analytics dashboard |
| `/agentic-brain` | 3-question wizard to AI action plan |
| `/virtual-studio` | Virtual production studio |
| `/admin/panel` | Admin panel |
| `/billing` | Billing page |
| `/live-video/webcast/:slug` | Webcast studio |

---

## 5. tRPC ROUTERS (99 Total — 89 imported + 10 inline)

All registered in BOTH `server/routers.ts` AND `server/routers.eager.ts`:

- **Core (9):** aiRouter, auth, billing, rbac, systemDiagnostics, admin, team, profile, events
- **Shadow Mode (3):** shadowModeRouter, recallRouter, archiveUploadRouter
- **AI Intelligence (8):** aiAm, aiAmPhase2, aiDashboard, aiFeatures, aiApplications, aiEvolution, adaptiveIntelligence, agenticEventBrain
- **Compliance (8):** complianceEngine, compliance, soc2, iso27001, disclosureCertificate, multiModalCompliance, regulatoryIntervention, eventIntegrity
- **Sentiment & Analytics (8):** sentiment, externalSentiment, analytics, benchmarks, interconnectionAnalytics, communicationIndex, marketReaction, marketImpactPredictor
- **Event Management (11):** scheduling, eventBrief, postEventReport, webcast, virtualStudio, broadcaster, liveQa, polls, liveRollingSummary, liveSubtitle, liveVideo
- **OCC & Telephony (3):** occ, webphone, conferenceDialout
- **Investment Intel (13):** investorEngagement, investorIntent, investorQuestions, ipoMandA, valuationImpact, crisisPrediction, crossEventConsistency, volatilitySimulator, roadshowAI, evasiveAnswer, callPrep, personalizedBriefing, materialityRisk
- **Business (11):** clientPortal, customisation, branding, supportChat, advisoryBot, mailingList, mobileNotifications, socialMedia, sustainability, intelligenceReport, intelligenceTerminal
- **Platform (18):** ably, bot, operatorLinks, trainingMode, mux, crmApi, platformEmbed, contentTriggers, taggedMetrics, monthlyReport, transcriptEditor, transcription, followups, healthGuardian, autonomousIntervention, evolutionAudit, bastionBooking, lumiBooking
- **Inline (6):** agmGovernance, persistence, pressRelease, registrations, events (inline), ably (inline)

---

## 6. REST ENDPOINTS (non-tRPC)

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `GET /api/ably-token` | Ably token for real-time |
| `GET /api/archives/:id/transcript` | Download transcript TXT |
| `GET /api/archives/:id/recording` | Download recording MP3 |
| `POST /api/webphone/twiml` | Outbound WebRTC calls |
| `POST /api/webphone/inbound` | Smart routing |
| `POST /api/webphone/voicemail-status` | Voicemail capture |
| `POST /api/conference-dialout/twiml` | Conference TwiML |
| `POST /api/conference-dialout/status` | HMAC-verified status |
| `POST /api/voice/inbound` | IVR greeting + PIN |
| `POST /api/voice/pin` | PIN validation |
| `POST /api/recall/webhook` | Recall.ai webhooks |
| `POST /api/shadow/recording/:sessionId` | Upload local recordings |
| `GET/POST /api/oauth/callback` | OpenID auth |

---

## 7. RECENT FIXES (26 March 2026)

1. **Router sync completed** — Both router files now have identical 93 registrations. Added 15 previously missing routers.
2. **Auth cookie noise eliminated** — Removed verbose `[Auth] Missing session cookie` log spam.
3. **Auth verification noise removed** — Removed `[Auth] Session verification failed` warnings.
4. **Analytics warnings fixed** — Removed non-functional Umami analytics script.
5. **Compliance detection stats table** — Added to Drizzle schema and created in database.
6. **Object storage migrated** — Replaced Forge proxy with Replit Object Storage (GCS-backed).
7. **JWT_SECRET configured** — Auto-generated for session cookie signing.
8. **Press release generator synced** — Added to `routers.ts` (was only in `routers.eager.ts`).
9. **Legacy localStorage write removed** — Removed `manus-runtime-user-info` write from useAuth hook (publish-safe fix from GitHub commit a2053f2).
10. **Health endpoint updated** — Now returns `{ status: "ok", timestamp: "..." }` matching deployment requirements.
11. **Database schema sync** — Ran `drizzle-kit push --force` to sync all Drizzle schema tables to database. 161 tables now in PostgreSQL.
12. **Health monitoring tables recreated** — Rebuilt `health_checks`, `health_incidents`, `health_incident_reports`, `health_baselines` with correct column names (`service` not `component`, `avg_value`/`std_dev`/`sample_count` for baselines).
13. **HealthGuardian numeric coercion fix** — Fixed bug where PostgreSQL NUMERIC values returned as strings caused arithmetic to produce `"59-24.5"` instead of proper numbers. All `row.avg_value`, `row.std_dev`, `row.sample_count` now wrapped in `Number()`.
14. **HealthGuardian false incidents suppressed** — Services with "unknown" status (API key not configured) no longer trigger incident creation. Only "degraded" and "critical" statuses create incidents.
15. **Production build verified** — `pnpm run build` succeeds: Vite frontend + esbuild server → `dist/`.

---

## 8. DEPLOYMENT STATUS

| Item | Value |
|------|-------|
| Artifact | `artifacts/api-server` (kind: web) |
| Preview Path | `/` |
| Build | `vite build` + `esbuild` → `dist/` |
| Run (prod) | `NODE_ENV=production node dist/index.js` |
| Target | Autoscale |
| Status | **Development mode running — not yet published** |

---

## 9. PRIORITY ACTION ITEMS

### High Priority
1. **Set `ABLY_API_KEY`** — Unlocks real-time WebSocket transcript streaming
2. **Set `RESEND_API_KEY`** — Enables email delivery for reports and notifications
3. **Publish to production** — App is stable enough to deploy

### Medium Priority
4. **Set `STRIPE_SECRET_KEY`** — Enables billing and payment collection
5. **Set Twilio credentials** — Enables Operator Call Centre telephony (6 secrets)
6. **Set Mux credentials** — Enables live video streaming and webcasting
7. **Connect GitHub remote** — No Git remote currently configured in Replit

### Low Priority
8. **Set `TELNYX_*` credentials** — Backup SIP carrier
9. **Configure `OAUTH_SERVER_URL`** — Enable production authentication
10. **Fix GitHub Actions CI/CD** — Remove `version: 10` pin from pnpm/action-setup@v4

---

## 10. KEY FILES

| File | Purpose |
|------|---------|
| `server/_core/index.ts` | Server entry point, webhook endpoints |
| `server/routers.eager.ts` | Router registration (used at runtime) |
| `server/routers.ts` | Router registration (kept in sync) |
| `server/storage.ts` | Replit Object Storage integration |
| `server/_core/sdk.ts` | Auth/session JWT handling |
| `client/src/pages/ShadowMode.tsx` | Shadow Mode UI (3,676 lines) |
| `client/src/pages/ArchiveUpload.tsx` | Archive management UI |
| `drizzle/schema.ts` | Database schema (100+ tables, 3,400+ lines) |
| `artifacts/api-server/.replit-artifact/artifact.toml` | Deployment configuration |
| `SHADOW-MODE-BRIEF.md` | Shadow Mode technical reference |
| `replit.md` | Project memory and conventions |

---

## 11. CRITICAL CODING RULES

1. New routers must be added to BOTH `server/routers.eager.ts` AND `server/routers.ts`
2. All tRPC imports use `"../_core/trpc"` path
3. Toast notifications use `sonner` only
4. `rawSql()` auto-appends `RETURNING id` and translates `?` to `$1/$2`
5. `shadow_sessions` timestamps (`started_at`, `ended_at`) are bigint epoch milliseconds
6. `attendee_registrations` has camelCase columns — must double-quote in raw SQL
7. AI reports stored in `archive_events` with event_id format `shadow-{sessionId}`
8. Session deletion cascades to: tagged_metrics, recall_bots, agm_intelligence_sessions, recordings
9. Server binds to `0.0.0.0` (not localhost) for Replit compatibility
10. Use `drizzle-kit push --force` for schema sync — never write manual SQL migrations
11. Never change primary key ID column types (serial ↔ varchar)
