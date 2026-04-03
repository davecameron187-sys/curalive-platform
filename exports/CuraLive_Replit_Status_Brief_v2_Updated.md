# CURALIVE — Comprehensive Replit Brief

**Current Status · Outstanding Items · Coding Rules · April 2026**

---

**Document purpose:** Single reference for Replit — confirmed live, outstanding items, exact actions, coding rules.

**Platform:** 110 routers · 208 tables · 211 pages · 7 background services · Health Guardian 100%

**Date:** April 2026

**Published URL:** https://curalive-platform.replit.app

**Priority:** Demo readiness for Lumi Global meeting — week of 7 April 2026

---

> ⚠ **Critical rule before any change:**
> Every new tRPC router MUST be registered in BOTH `server/routers.eager.ts` AND `server/routers.ts`. Missing from one file = silent runtime failure.

---

## Section 1 — Coding Rules (Every Change)

These rules apply to every file touched. No exceptions.

| Rule | Detail |
|------|--------|
| tRPC routers — BOTH files | Register every new router in BOTH `server/routers.eager.ts` AND `server/routers.ts`. Missing from one causes silent runtime errors. |
| tRPC imports | Always use `"../_core/trpc"` for tRPC imports. |
| Toast notifications | Only use `sonner`. No other toast library. |
| rawSql() behaviour | `rawSql()` auto-appends `RETURNING id` and translates `?` to `$1/$2`. Do not manually add RETURNING id. |
| camelCase columns | Double-quote camelCase column names in raw SQL. Example: `"createdAt"` not `createdAt`. |
| Schema migrations | Always use `drizzle-kit push --force`. Never `pnpm run db:push`. |
| Recall.ai webhook order | Recall.ai webhook middleware MUST be registered before `express.json()`. If `express.json()` runs first, HMAC verification hangs. |
| NUMERIC wrapping | Wrap PostgreSQL `NUMERIC` from `rawSql()` in `Number()` before arithmetic. |
| Bigint timestamps | `rawSql()` auto-converts numbers 1e12–1e13 to `Date` objects. Pass epoch values as strings. |
| Production build | Rebuild `dist/` with esbuild before publishing. Do not publish without rebuilding. |
| Replit config | Do not modify the `.replit` file directly. Use the Replit UI. |
| Vendor names on client pages | NEVER show on `/live/:token`, `/report/:token`, `/presenter/:token`: Whisper, Recall.ai, GPT-4o, OpenAI, Gemini, Ably, Twilio, Mux, Resend. Use: "CuraLive Intelligence Agent", "AI transcription", "CuraLive AI". |
| health_checks tables | Created via raw SQL. Timestamp columns must be `TIMESTAMP` type, not bigint. |
| ai_am_audit_log | `ai_am_audit_log.timestamp` is `bigint` (epoch ms). Do not treat as a date column. |

---

## Section 2 — Confirmed Live (Do Not Modify)

Everything below is confirmed working as of April 2026.

### 2.1 Platform Scale

| Asset | Count |
|-------|-------|
| tRPC Routers | 110 |
| Database Tables | 208 |
| Frontend Pages | 211 |
| UI Components | 81 |
| Backend Services | 61 |
| App Routes | 141 |
| Background Schedulers | 7 |
| Health Guardian score | 100% — 6 services monitored |
| Completed test sessions | 10 — no failed test data |

### 2.2 Background Services (Auto-Start at Boot)

1. **HealthGuardian** — 30s infrastructure monitoring + AI root cause analysis
2. **ComplianceEngine** — 300s regulatory compliance scanning
3. **ComplianceDeadlineMonitor** — 15 min deadline checks + escalation emails
4. **BriefingScheduler** — 5 min pre-event briefing dispatch (auto-sends at T-60 min)
5. **ShadowWatchdog** — 60s zombie session detection and crash recovery
6. **ReminderScheduler** — 300s event reminder dispatch
7. **ConferenceDialoutService** — Conference call orchestration

### 2.3 Shadow Mode — 11 Confirmed Tabs

| Tab | Status | Contents |
|-----|--------|----------|
| Live Intelligence | ● LIVE | Transcript, sentiment, compliance, rolling AI summary. ConsoleModeSwitcher (Monitor / Active / Review). |
| Archives & Reports | ● LIVE | Session browser, search, filters, bulk operations, client delivery status. |
| AI Dashboard | ● LIVE | Consolidated AI module outputs, session selector, tier presets. |
| Live Q&A | ● LIVE | AI triage (1,225 lines). Jaccard duplicate detection, legal review modal, AI draft answers, 10-tab filter, keyboard shortcuts, bulk approve/reject, Send to Speaker. |
| Board Compass | ● LIVE | Governance scoring, prior commitment audits, director liability mapping. |
| Pre-Event Intel | ● LIVE | Pre-event briefing viewer. Analyst consensus, predicted Q&A, compliance hotspots, readiness score. |
| Compliance Monitor | ● LIVE | Real-time regulatory dashboard. JSE/SEC/FCA/ASIC/SGX/HKEX. Deadline tracking. |
| System Diagnostics | ● LIVE | Health Guardian: 6 services, 30s polling, AI root cause analysis. |
| Intelligence Suite | ● LIVE | Advanced AI analysis tools. |
| Operator Tools | ● LIVE | Session management and operational controls. |
| Settings | ● LIVE | Configuration and preferences. |

### 2.4 Operator Console Additions — All Live

| Component | Status | Detail |
|-----------|--------|--------|
| TranscriptFlagTimeline | ● LIVE | 5 flag types: Notable / Compliance / Forward Guidance / Tone Shift / Action Required. Colour-coded timeline. Feeds post-event report. |
| CollapsibleBottomTray | ● LIVE | 4 tabs: Flags, Messages, Team, Live Stats. Collapses to thin bar. Auto-opens on compliance flag. |
| TeamCoordinationPanel | ● LIVE | Multi-operator: join/leave, operator list, handoff initiation, internal team chat via Ably. |
| ConsoleModeSwitcher | ● LIVE | Three states: Monitor (read-only) / Active (full controls) / Review (post-session). Drives conditional rendering. |
| SessionSetupPanel | ● LIVE | Tier selection, recipient management (name/email/role/toggles), partner assignment, readiness check. |
| SessionScheduler | ● LIVE | Event scheduling with meeting URL. Auto-triggers pre-event briefing. Calendar view. |
| ClientMessagePanel | ● LIVE | Floating chat on client dashboard. Token-authenticated. Real-time bidirectional via Ably. |

### 2.5 Client-Facing Pages — All Live

| Route | Status | Detail |
|-------|--------|--------|
| `/live/:token` | ● LIVE | 5 tabs: Live Feed, Sentiment, Compliance, Q&A, AI Summary. Partner branded. ClientMessagePanel chat. 5-second polling. |
| `/report/:token` | ● LIVE | 10 tabs: Executive Summary, Financial Metrics, Compliance Flags, Management Tone, Q&A Log, Full Transcript, Action Items, Social Media Pack, SENS/RNS Draft, Blockchain Certificate. Client view logging. Star rating feedback. |
| `/presenter/:token` | ● LIVE | Full-screen Q&A display. Large-font active question. Asker firm shown. AI talking points (toggle). 3 up-next questions queued. |
| `/qa/:accessCode` | ● LIVE | Attendee webphone. Webcast attendees submit questions here. Feeds Live Q&A console. |
| `/live-video/webcast/demo?simulate=1` | ● LIVE | Full Demo Studio. Goldman Sachs, JP Morgan, Morgan Stanley mock Q&A. Up to 1,200 simulated attendees. Use in every demo meeting. |
| `/virtual-studio` | ● LIVE | AI-enhanced virtual broadcast studio. |
| `/feature-map` | ● LIVE | Platform feature map and capability explorer. |

### 2.6 Six New Routers — All Live

| Router file | What it handles |
|-------------|-----------------|
| `partnerRouter.ts` | Partner CRUD, brand config by domain/slug, token generation and validation. |
| `sessionConfigRouter.ts` | Tier config, partner assignment, recipient management, scheduling, readiness check, send live links. |
| `sessionMessagesRouter.ts` | Bidirectional operator-client messaging. sendFromClient (public, token-auth), sendFromOperator (protected), resolve message. |
| `speakerQueueRouter.ts` | Queue approved questions for presenter: queueForSpeaker, getSpeakerQueue, sendToSpeaker, markAnswered, skipQuestion. |
| `agmIntelligenceRouter.ts` | AGM resolutions, dissent signal analysis, proxy advisor detection (ISS, Glass Lewis, Hermes, Sustainalytics, PIRC), post-AGM dissent report. |
| `operationsRouter.ts` | Operator handoff, multi-operator sessions, client feedback, historical commitments, board profiles, resend report link, client access log, jurisdiction detection, transcript flagging. |

### 2.7 New Database Tables — All Live (19 tables verified)

| Group | Tables |
|-------|--------|
| Session Operations | session_messages, session_handoffs, session_operators, session_markers, session_readiness_checks, scheduled_sessions |
| Client Delivery | client_tokens, client_report_access, client_report_feedback, client_report_view_log |
| Partners | partners (Lumi and Bastion seeded), partner_events |
| AGM Intelligence | agm_resolutions, agm_shareholder_signals, agm_governance_scores |
| Q&A System | approved_questions_queue |
| Compliance | compliance_deadlines, historical_commitments, board_members |
| shadow_sessions — 7 new columns | tier, partner_id, recipients (jsonb), scheduled_at, pre_brief_sent_at, live_links_sent_at, report_links_sent_at |

### 2.8 Intelligence Tiers — Live

| Tier | Pricing | Live dashboard | Post-event report |
|------|---------|----------------|-------------------|
| Essential | Per event | Transcript · 4 sentiment metrics · Compliance flags · AI summary · Q&A queue | 5 core AI modules + blockchain certificate |
| Intelligence | Per event or retainer | All Essential + Speaker scorecards · Evasion index · Crisis prediction · Valuation oracle · M&A signals | Full 20 modules + SENS/RNS draft + social media pack |
| Enterprise | Annual licence | All Intelligence + Cross-event benchmarking · Analyst identity · Briefing accuracy · Board commitment monitor | All 20 modules + Board Intelligence + RBAC + white label |
| AGM | Per AGM (Enterprise add-on) | All Enterprise + Resolution tracking · Dissent detection · Proxy advisor monitoring (ISS, Glass Lewis) | All 20 modules + post-AGM dissent report + resolution analysis |

### 2.9 White-Label Partners — Configured and Ready

| Partner | Configuration status |
|---------|---------------------|
| Lumi Global | Seeded (slug: `lumi`). Colours set. Revenue share model. Custom domain field ready for `intelligence.lumigroup.com`. Sending email field ready for `noreply@lumigroup.com`. **ACTIVATION:** One SQL update + 3 Lumi DNS records. |
| Bastion Group | Seeded (slug: `bastion`). Revenue share model. Ready to configure logo and colours. |

### 2.10 New Services — All Live

| Service | What it does |
|---------|-------------|
| `ClientDeliveryService.ts` | Generates tokenised links. Sends live dashboard invite emails. Sends post-event report emails. White-label aware — reads partner brand config automatically. |
| `ComplianceDeadlineService.ts` | Creates compliance deadlines on flag detection. Monitors every 15 min. Sends reminder at T-24h, escalation at T-2h. Sends compliance-only email within 2 min of session close when flags exist. |
| `PreEventBriefingService.ts` | BriefingScheduler checks every 5 min. Auto-sends pre-event briefing 60 min before scheduled session. Calculates briefing accuracy post-session. |
| `brandConfig.ts` middleware | Reads incoming domain on every request. Determines partner branding. Caches 5 min. Serves CuraLive defaults for all non-partner domains. |

---

## Section 3 — Outstanding Items

Prioritised in order of commercial impact.

### 3.1 Priority 1 — Demo Readiness (Before Lumi Meeting)

> **URGENT — Complete before the demo.**
> Without real demo tokens, the three client pages (`/live/:token`, `/report/:token`, `/presenter/:token`) open as empty authenticated routes. The demo will fail.

| # | Task | Exact action required | Est. time |
|---|------|----------------------|-----------|
| D1 | Generate demo tokens for all 3 client pages | 1. Find the best completed session (use SQL query in Section 5). 2. Call `trpc.partners.generateClientToken` for that sessionId — three times with accessType: "live", "report", "presenter". 3. Note the three token strings. Share with Dave Cameron for the rollout document. | 30 min |
| D2 | Verify all 3 client pages load with real data | Open `/live/[token]`, `/report/[token]`, `/presenter/[token]` in browser. Confirm each loads correctly with real session data. Check all tabs render. Fix any empty states or broken queries before the demo date. | 1 hour |
| D3 | Provide Replit app URL to Dave Cameron | Share the full Replit app URL: `https://curalive-platform.replit.app`. Claude will rebuild the Rollout Roadmap document with all links live and working once the URL is received. | 2 min |

### 3.2 Priority 2 — Session Close Pipeline Verification

> **Verify end-to-end before demo.**

Run this test:
1. Create a test session with a real recipient email address you can access.
2. Paste a short transcript containing forward-looking language — e.g. "we expect margins to be in the range of 20 to 22 percent next quarter".
3. Close the session.
4. Confirm within 2 minutes: compliance-only email arrives in recipient inbox listing the flag and a 48-hour JSE deadline.
5. Confirm within 5 minutes: post-event report email arrives with a working `/report/:token` link.
6. Confirm in database: a `compliance_deadlines` row was created for the session.
7. If any of these fail: check the session close handler in `shadowModeRouter.ts` against Section 10 of the Master Integration Brief v2.

### 3.3 Priority 3 — Platform Gaps (Next Sprint After Demo)

| # | Gap | What needs building | Priority |
|---|-----|---------------------|----------|
| G1 | Live Q&A analytics during session (Gap 7.2) | Pattern detection live: which firm is submitting the most questions, coordinated questioning detection, escalation alert when multiple risk-flagged questions arrive from same firm. Add as "Patterns" sub-panel in Live Q&A tab. Query: group `approved_questions_queue` by `asker_firm`. | High |
| G2 | Board Intelligence auto-populate (Gap 9.1) | Wire Board Intelligence into session close pipeline. After AI report generates, extract board commitments mentioned, governance topics, and auto-score against prior commitments. Feed into `board_intelligence_compass` table. | Medium |
| G3 | Cross-event comparison (Gap 3.3) | Add Compare button in Archives & Reports. Opens side-by-side view of two sessions. Show delta on: confidence score, compliance flag count, Q&A risk ratio, sentiment trend. Key for Enterprise tier clients. | Medium |
| G4 | Batch archive upload (Gap 2.3) | Queue-based batch upload for onboarding clients with multiple historical recordings. Currently one upload at a time. Add batch button accepting multiple files with sequential processing and progress tracking. | Lower |

---

## Section 4 — Verification Checklist

Run through every item before the Lumi demo. Tick when confirmed working.

### 4.1 System Health
- □ Health Guardian: 100% score, 6 services green
- □ All 7 background services running (check server startup logs)
- □ 10 completed sessions, no failed test data
- □ Server running clean on port 3000

### 4.2 Demo Studio
- □ `/live-video/webcast/demo?simulate=1` opens and runs the full simulation
- □ Transcript streams with speaker labels
- □ Sentiment bars animate
- □ At least one compliance flag fires
- □ Q&A queue fills with institutional analyst questions

### 4.3 Client Pages With Real Tokens
- □ `/live/[real-token]` opens, all 5 tabs show real session data
- □ `/report/[real-token]` opens, all 10 tabs load correctly
- □ `/presenter/[real-token]` opens, shows speaker Q&A display
- □ All three pages show correct partner branding for the token owner

### 4.4 Session Lifecycle
- □ Create session → tier selection saves to `shadow_sessions.tier`
- □ Add recipients → saved to `shadow_sessions.recipients` JSON
- □ Select partner → `session.partner_id` populated
- □ Run readiness check → 6 items evaluated and displayed
- □ Schedule session → appears in upcoming sessions list
- □ At T-60 minutes → pre-event briefing email auto-sends
- □ Session goes live → live dashboard link emails send to recipients
- □ Session closes → compliance email sends within 2 minutes (if flags exist)
- □ Session closes → full report email sends within 5 minutes
- □ Compliance deadlines created in database for critical flags

### 4.5 Q&A Pipeline
- □ Approve question in Live Q&A console
- □ Click Send to Speaker → appears on `/presenter/:token`
- □ AI talking points toggle works on presenter screen
- □ Mark answered → question clears

### 4.6 Operator-Client Messaging
- □ Open `/live/:token` → floating chat button visible
- □ Send message from client → badge appears in operator console
- □ Operator reply → appears on client dashboard in real time

### 4.7 AGM Intelligence
- □ Create session with event_type = agm → AGM tier auto-selected
- □ Paste segment containing "ISS" or "vote against" → signal detected
- □ `agmIntelligence.getAgmDashboard` returns resolutions, signals, summary

### 4.8 White Label
- □ Generate token for Lumi-tagged session
- □ Open `/live/[token]` → Lumi branding applied throughout
- □ No CuraLive branding visible anywhere on the page

---

## Section 5 — SQL Quick Reference

Ready-to-run queries for verification and demo preparation.

### Verify all 19 new tables exist
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'session_messages', 'session_handoffs', 'session_operators',
  'session_markers', 'session_readiness_checks', 'scheduled_sessions',
  'client_tokens', 'client_report_access', 'client_report_feedback',
  'client_report_view_log', 'partners', 'partner_events',
  'agm_resolutions', 'agm_shareholder_signals', 'agm_governance_scores',
  'approved_questions_queue', 'compliance_deadlines',
  'historical_commitments', 'board_members'
) ORDER BY table_name;
-- Expected: 19 rows
```

### Verify shadow_sessions has all 7 new columns
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'shadow_sessions'
  AND column_name IN (
    'tier', 'partner_id', 'recipients',
    'scheduled_at', 'pre_brief_sent_at',
    'live_links_sent_at', 'report_links_sent_at'
  )
ORDER BY column_name;
-- Expected: 7 rows
```

### Find best session for demo tokens (most compliance flags)
```sql
SELECT s.id, s.event_name, s.company, s.status,
  COUNT(rf.id) AS flag_count,
  s.created_at
FROM shadow_sessions s
LEFT JOIN regulatory_flags rf ON rf.session_id = s.id
WHERE s.status = 'completed'
GROUP BY s.id, s.event_name, s.company, s.status, s.created_at
ORDER BY flag_count DESC, s.created_at DESC
LIMIT 5;
```

### Generate demo tokens (replace SESSION_ID with actual id)
```sql
INSERT INTO client_tokens
  (token, session_id, recipient_name, recipient_email, access_type, expires_at)
VALUES
  ('demo-live-001',      SESSION_ID, 'Demo User', 'demo@example.com', 'live',      NOW() + INTERVAL '30 days'),
  ('demo-report-001',    SESSION_ID, 'Demo User', 'demo@example.com', 'report',    NOW() + INTERVAL '30 days'),
  ('demo-presenter-001', SESSION_ID, 'Demo User', 'demo@example.com', 'presenter', NOW() + INTERVAL '30 days');

-- Demo links then become:
-- https://curalive-platform.replit.app/live/demo-live-001
-- https://curalive-platform.replit.app/report/demo-report-001
-- https://curalive-platform.replit.app/presenter/demo-presenter-001
```

### Activate Lumi white label (when they provide brand assets)
```sql
UPDATE partners SET
  logo_url               = 'https://[lumi-logo-cdn-url]',
  primary_color          = '#[lumi-primary-hex]',
  accent_color           = '#[lumi-secondary-hex]',
  custom_domain          = 'intelligence.lumigroup.com',
  custom_domain_verified = true,
  sending_domain         = 'lumigroup.com',
  sending_name           = 'Lumi Intelligence',
  sending_email          = 'noreply@lumigroup.com'
WHERE slug = 'lumi';

-- Lumi IT adds 3 DNS records:
-- CNAME  intelligence.lumigroup.com  →  curalive-platform.replit.app
-- TXT    lumigroup.com               →  Resend SPF record
-- CNAME  resend._domainkey.[...]     →  Resend DKIM record
```

### Check compliance deadlines created correctly
```sql
SELECT cd.id, cd.action, cd.deadline, cd.status, cd.jurisdiction, s.event_name
FROM compliance_deadlines cd
JOIN shadow_sessions s ON s.id = cd.session_id
ORDER BY cd.created_at DESC LIMIT 10;
```

### Check client tokens and email delivery status
```sql
SELECT ct.token, ct.recipient_email, ct.access_type,
  ct.email_sent_at, ct.use_count, s.event_name
FROM client_tokens ct
JOIN shadow_sessions s ON s.id = ct.session_id
ORDER BY ct.created_at DESC LIMIT 20;
```

---

## Section 6 — Architecture Reference

### Frontend
- **Framework**: React 19.2.1 + Vite 7.3.1 + TypeScript 5.9.3
- **Styling**: TailwindCSS 4.1.14, Framer Motion 12.23.22, Radix UI
- **State**: TanStack React Query 5.90.2, tRPC React Query 11.6.0
- **Routing**: Wouter 3.3.5
- **Toasts**: Sonner 2.0.7 (only — no other toast library)

### Backend
- **Runtime**: Node.js 20+, Express 4.21.2, tRPC Server 11.6.0
- **ORM**: Drizzle ORM 0.44.5 with PostgreSQL (208 tables)
- **Build**: pnpm monorepo, tsx (dev), esbuild (production)
- **Auth**: JWT cookie sessions (`app_session_id`), role hierarchy: viewer < operator < admin

### External Integrations
| Service | Purpose | Env Vars |
|---------|---------|----------|
| PostgreSQL | Primary database | `DATABASE_URL` |
| Ably | Real-time pub/sub | `ABLY_API_KEY` |
| Recall.ai | AI bot deployment | `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` |
| Mux | Video streaming | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` |
| OpenAI | GPT-4o + Whisper | `OPENAI_API_KEY` |
| Twilio | Telephony | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID` |

### Key File Locations
| Category | Path |
|----------|------|
| tRPC Router Registration | `server/routers.eager.ts` AND `server/routers.ts` |
| Schema Files | `drizzle/gaps.schema.ts`, `drizzle/partners.schema.ts`, `drizzle/schema.ts` |
| Background Services | `server/services/` |
| Brand Config Middleware | `server/middleware/brandConfig.ts` |
| Client Pages | `client/src/pages/ClientLive.tsx`, `ClientReport.tsx`, `PresenterScreen.tsx` |
| Shadow Mode Console | `client/src/pages/ShadowMode.tsx` |
| Server Entry | `server/_core/index.ts` |
| Email Templates | `server/emails/templates.ts` |
| Downloads/Exports | `exports/` directory |
