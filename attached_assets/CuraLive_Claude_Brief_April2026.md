# CuraLive — Technical Architecture Brief for Claude
# Updated: 5 April 2026 (post-verification test)
# Published: https://curalive-platform.replit.app

---

# 1. PLATFORM OVERVIEW

CuraLive is a real-time investor events intelligence platform built for the JSE (Johannesburg Stock Exchange) market. It provides live event monitoring, AI-powered compliance detection, investor Q&A management, and post-event intelligence reporting — all delivered through a white-label partner model.

**Stack:** React 19 + Vite (client) · Express + tRPC (server) · PostgreSQL + Drizzle ORM · Ably (realtime) · Twilio/Telnyx (telephony) · OpenAI/Gemini (AI) · Recall.ai (meeting bots)

**Monorepo:** pnpm workspace. Root `package.json` at `/home/runner/workspace/`.

---

# 2. PROJECT STRUCTURE

```
/home/runner/workspace/
├── server/
│   ├── _core/           # Infrastructure: index.ts, trpc.ts, llm.ts, email.ts, ably.ts, oauth.ts, etc.
│   ├── routers/          # 100+ tRPC router files
│   ├── services/         # 63 service files (business logic)
│   ├── routes/           # REST endpoints (systemStatus, etc.)
│   ├── webhooks/         # External callbacks (recall.ts)
│   ├── webphone/         # Twilio/Telnyx telephony
│   ├── emails/           # templates.ts — HTML email builders
│   ├── middleware/        # brandConfig.ts
│   └── db.ts             # Database connection, rawSql(), user helpers
├── client/
│   └── src/
│       ├── App.tsx        # Router (wouter) — 100+ routes
│       ├── pages/         # 211 page components
│       ├── components/    # 82 components + ui/ subdirectory (shadcn)
│       ├── hooks/         # useAuth, useAblyChannel, useBrandConfig, etc.
│       ├── contexts/      # AblyContext, ThemeContext
│       └── lib/           # trpc.ts (client), utils
├── drizzle/
│   ├── schema.ts          # Main schema (~3800 lines, 100+ tables)
│   ├── gaps.schema.ts     # Sprint 1 gap tables (14 tables)
│   ├── partners.schema.ts # Partner/white-label tables (4 tables)
│   └── relations.ts       # Drizzle relations
├── shared/                # Shared TypeScript types
├── docs/                  # Technical specs, architecture docs
└── artifacts/             # Replit artifact configs
```

---

# 3. DATABASE — CRITICAL REFERENCE

## 3.1 Connection
PostgreSQL via `DATABASE_URL` env var. Connection in `server/db.ts`.

## 3.2 rawSql() — THE ONLY WAY TO RUN RAW QUERIES

```typescript
import { rawSql } from "../db";

// SIGNATURE: returns [rows, fields] tuple — ALWAYS destructure
const [rows] = await rawSql(
  `SELECT * FROM table_name WHERE id = $1`,
  [someId]
);

// NEVER do: const rows = await rawSql(...)  — this gives you [rows, fields], not rows
```

**rawSql() behaviors:**
- Returns `[rows, fields]` tuple — ALWAYS use `const [rows] = await rawSql(...)`
- Auto-appends `RETURNING id` to INSERT statements — NEVER add it manually
- Translates `?` placeholders to `$1/$2/$3` — use either `?` or `$N` syntax
- Converts MySQL syntax to PostgreSQL (backticks → quotes, IFNULL → COALESCE, etc.)
- Large numbers (>1 trillion) auto-converted to Date objects

## 3.3 Drizzle ORM
Also available via `getDb()`:
```typescript
import { getDb } from "../db";
const db = await getDb();
// Use drizzle query builder: db.select().from(table).where(...)
```

## 3.4 ACTUAL DATABASE COLUMN NAMES (snake_case throughout)

**ALL PostgreSQL columns use snake_case.** The Drizzle schema maps camelCase JS properties to snake_case DB columns. When writing rawSql(), ALWAYS use the actual snake_case column names.

### shadow_sessions
`id, client_name, event_name, event_type, platform, meeting_url, recall_bot_id, ably_channel, local_transcript_json, local_recording_path, status, transcript_segments, sentiment_avg, compliance_flags, tagged_metrics_generated, notes, started_at (bigint), ended_at (bigint), created_at, tier, partner_id, recipients (jsonb), scheduled_at, pre_brief_sent_at, live_links_sent_at, report_links_sent_at, company, jurisdiction`

### regulatory_flags
`id, monitor_id, flag_type, jurisdiction, rule_set, severity, statement, speaker, segment_timestamp, rule_basis, created_at`
- **monitor_id** links to session — NOT session_id
- **statement** = the flagged text — NOT title, NOT description
- **rule_basis** = the rule reference — NOT rule_reference

### compliance_deadlines
`id, session_id, action, jurisdiction, deadline_at, priority, assigned_to, status, escalated_at, completed_at, created_at, flag_id`
- **deadline_at** — NOT deadline

### historical_commitments
`id, company, commitment, made_at, deadline, session_id, status, verified_at, notes, created_at, event_type, event_date, committed_by, verified_in_session_id, imported_at, imported_by`

### board_members
`id, company, name, role, committee, appointed_at, bio, linkedin_url, active, created_at, notes, tenure_start, shareholding, independent_ned`

### agm_governance_scores
`id, session_id, company, overall_score, calculated_at`
- All snake_case — NOT overallScore, NOT calculatedAt

### approved_questions_queue
`id, session_id, question_id, question_text, asker_name, asker_firm, ai_suggested_answer, status, queued_at, answered_at, operator_id, queue_position, sent_to_speaker_at, created_at`
- **session_id** — NOT sessionId (no quotes needed in rawSql)

### occ_transcription_segments
`id, conference_id, speaker_name, speaker_role, text, start_time, end_time, confidence, created_at`
- Table name is **occ_transcription_segments** — NOT transcript_segments
- Uses **conference_id** — NOT session_id
- Text column is **text** — NOT content

### client_tokens
`id, token, session_id, partner_id, recipient_name, recipient_email, recipient_role, access_type, expires_at, last_accessed_at, created_at`

### partners
`id, slug, name, display_name, logo_url, primary_color, accent_color, font_family, model, revenue_share_pct, custom_domain, custom_domain_verified, sending_domain, sending_name, sending_email, active, created_at`

### scheduled_sessions
`id, event_name, company, event_type, scheduled_at, tier, partner_id, recipients (jsonb), meeting_url, pre_brief_sent_at, session_created_id, created_by, created_at`
- Has NO `status` column — do NOT filter by status
- Has NO `title` column — use `event_name`
- Has NO `jurisdiction` column

### briefing_accuracy_scores
`id, session_id, overall_score, topics_covered, topics_missed, sentiment_accuracy, key_metrics_accuracy, scored_at, detail (json)`
- Has NO `briefingId`, `predictedQaCount`, `actualQaCount`, `topicsCorrect`, `topicsTotal`, `complianceHotspotsHit`, `complianceHotspotsTotal`, `overallAccuracyPct` columns

### session_markers
`id, session_id, segment_text, operator_note, flag_type, speaker, event_timestamp, created_at`

**Total tables in database: 209**

---

# 4. LLM MODULE — invokeLLM()

```typescript
import { invokeLLM } from "../_core/llm";

// SIGNATURE
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult>;

// InvokeParams
type InvokeParams = {
  messages: Message[];        // Required: [{role: "user"|"system"|"assistant", content: string}]
  tools?: Tool[];
  toolChoice?: ToolChoice;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
};

// InvokeResult — OpenAI chat completion format
type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};
```

**CORRECT usage (VERIFIED — all live files now use this pattern):**
```typescript
const result = await invokeLLM({
  messages: [{ role: "user", content: "Your prompt here" }]
});
const rawText = result.choices?.[0]?.message?.content ?? "";
const text = typeof rawText === "string" ? rawText : JSON.stringify(rawText);
const cleaned = text.replace(/```json|```/g, "").trim();
// Then JSON.parse(cleaned) if expecting JSON
```

**WRONG — common mistakes:**
```typescript
// WRONG: result.content does not exist on InvokeResult
const text = result.content;

// WRONG: (result as any)?.content — same problem
const text = (result as any)?.content;

// WRONG: invokeLLM does not return a string
const text = await invokeLLM({...});
JSON.parse(text);

// WRONG: llm.complete() does not exist
const result = await llm.complete({...});
```

---

# 5. EMAIL MODULE

```typescript
import { sendEmail } from "../_core/email";

await sendEmail({
  to: "recipient@example.com",
  subject: "Subject line",
  html: "<h1>HTML content</h1>",
});
```

**Email template builders** (in `server/emails/templates.ts`):
- `buildLiveDashboardEmail(opts)` — live link delivery
- `buildReportEmail(opts)` — post-event report link
- `buildComplianceCloseEmail(opts)` — compliance action alert
- `buildPreBriefingEmail(opts)` — pre-event intelligence briefing

**NEVER use Resend directly.** Always use `sendEmail()` from `server/_core/email.ts`. The email module handles API keys and delivery internally.

**Resend domain limitation:** The current Resend account requires domain verification at resend.com/domains before sending to external recipients. Without a verified domain, emails can only be sent to the account owner's email address.

---

# 6. tRPC ARCHITECTURE

## 6.1 Procedure Types
```typescript
import { router, publicProcedure, protectedProcedure, operatorProcedure, adminProcedure } from "../_core/trpc";
```

## 6.2 Router Registration — MUST register in BOTH files
Every new router MUST be added to:
1. `server/routers.ts` — `export const appRouter = router({ ..., myRouter: myRouter, ... })`
2. `server/routers.eager.ts` — identical registration

Failure to register in both files causes server errors.

## 6.3 Key Routers (Sprint 1 additions)
- `partnerRouter` — partner CRUD, branding
- `sessionConfigRouter` — session setup, scheduling
- `sessionMessagesRouter` — internal team messaging
- `speakerQueueRouter` — Q&A speaker management
- `agmIntelligenceRouter` — AGM governance intelligence
- `operationsRouter` — operational dashboard
- `qaAnalyticsRouter` — live Q&A pattern analysis
- `shadowModeRouter` — core session management (existing, enhanced)

## 6.4 Key shadowModeRouter Procedures
- `startSession` — creates session, deploys Recall bot or starts local capture
- `endSession` — closes session, triggers `runSessionClosePipeline(sessionId)`
- Both require `operatorProcedure` (auth)

---

# 7. BACKEND SERVICES

## 7.1 Background Services (started on server boot)
These start automatically in `server/_core/index.ts`:
1. **ReminderScheduler** — session reminders (300s interval)
2. **HealthGuardian** — system health monitoring (30s interval)
3. **ComplianceEngine** — regulatory scanning (300s interval)
4. **ComplianceDeadlineMonitor** — deadline escalation (15min interval)
5. **BriefingScheduler** — pre-event briefing auto-send (5min interval)
6. **ShadowWatchdog** — zombie session cleanup (60s interval)
7. **ShadowModeGuardian** — session reconciliation (on startup)

## 7.2 Sprint 1 Service Files

### ClientDeliveryService.ts
- `sendLiveDashboardLinks(opts)` — generates tokens, sends live URLs
- `sendReportLinks(opts)` — generates tokens, sends report URLs

### ComplianceDeadlineService.ts
```typescript
sendComplianceCloseEmail({
  sessionId: number,
  companyName: string,
  eventName: string,
  flags: { title: string; body: string; severity: string }[],
  deadlines: { action: string; hours: number; jurisdiction: string }[], // hours: number, NOT deadline: Date
  recipients: { name: string; email: string }[],
})
```
- `createComplianceDeadline(opts)` — writes deadline row
- `startComplianceDeadlineMonitor()` — background escalation loop

### PreEventBriefingService.ts
- `startBriefingScheduler()` — checks every 5 min for upcoming sessions
- `calculateBriefingAccuracy(sessionId: number)` — post-session accuracy scoring
  - Takes a single `sessionId` number, NOT an object

### SessionClosePipeline.ts
`runSessionClosePipeline(sessionId: number)` — orchestrates:
1. Load session + partner data
2. Load regulatory flags (from `regulatory_flags` WHERE `monitor_id = $1`)
3. Create compliance deadlines (in `compliance_deadlines` with `deadline_at`)
4. Send compliance email
5. Generate AI report (placeholder — returns `{}`)
6. Send report links
7. Run Board Intelligence update (non-blocking)
8. Score briefing accuracy (non-blocking)

### BoardIntelligenceService.ts
`runBoardIntelligenceUpdate(opts)` — non-blocking post-session:
1. Extract new commitments from Module 08 report (invokeLLM — FIXED)
2. Verify prior open commitments against transcript (invokeLLM — FIXED)
3. Log board member activity
4. Update governance score

---

# 8. CLIENT ARCHITECTURE

## 8.1 Routing (wouter)
Key Sprint 1 routes:
- `/live/:token` — Client live dashboard (no auth required, token-based)
- `/report/:token` — Client post-event report (no auth required, token-based)
- `/presenter/:token` — Presenter screen (no auth required, token-based)
- `/shadow-mode` — Operator console (auth required)

## 8.2 Key Sprint 1 Components
- `QAPatternPanel.tsx` — Live Q&A pattern analysis (polling, 15s refresh)
- `ClientMessagePanel.tsx` — Internal team messaging
- `SessionSetupPanel.tsx` — Session configuration
- `SessionScheduler.tsx` — Future session scheduling
- `CollapsibleBottomTray.tsx` — Bottom tray for flags/alerts

## 8.3 Brand Configuration Hook
```typescript
import { useBrandConfig } from "../hooks/useBrandConfig";
const brand = useBrandConfig(token);
// Returns: { displayName, logoUrl, primaryColor, accentColor, fontFamily, loading }
```

## 8.4 tRPC Client
```typescript
import { trpc } from "../lib/trpc";
const { data } = trpc.routerName.procedureName.useQuery({ ... });
const mutation = trpc.routerName.procedureName.useMutation();
```

---

# 9. ENVIRONMENT VARIABLES

## 9.1 Set (confirmed working)
- `DATABASE_URL` — PostgreSQL connection
- `ABLY_API_KEY` — Realtime messaging
- `OPENAI_API_KEY` — AI/LLM (via Forge proxy)
- `JWT_SECRET` — Authentication
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID` — Telephony
- `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` — Meeting bots
- `MUX_WEBHOOK_SECRET` — Video streaming webhooks
- `APP_URL` = `https://curalive-platform.replit.app` — Used for tokenized email links
- `RESEND_API_KEY` — Email delivery (NOW SET — requires domain verification in Resend dashboard)

## 9.2 Optional (disabled services)
- `TELNYX_API_KEY` — Telnyx telephony
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` — Mux video
- `STRIPE_SECRET_KEY` — Payments
- `OAUTH_SERVER_URL` — OAuth provider

---

# 10. VENDOR NAME RULES

**NEVER expose vendor names on client-facing pages:**
- `/live/:token`, `/report/:token`, `/presenter/:token` must NOT show: Recall.ai, OpenAI, Ably, Twilio, Resend
- Use generic terms: "AI analysis", "real-time updates", "communication system"

---

# 11. MIDDLEWARE

### brandConfigMiddleware (server/middleware/brandConfig.ts)
Applied globally. Reads partner branding from `partners` table based on token or partner_id and attaches it to the request for white-label rendering.

---

# 12. COMMON PATTERNS — DO AND DON'T

## DO:
```typescript
// rawSql tuple destructuring
const [rows] = await rawSql(`SELECT * FROM table WHERE id = $1`, [id]);

// LLM response extraction (verified correct pattern)
const result = await invokeLLM({ messages: [{role: "user", content: prompt}] });
const rawText = result.choices?.[0]?.message?.content ?? "";
const text = typeof rawText === "string" ? rawText : JSON.stringify(rawText);
const cleaned = text.replace(/```json|```/g, "").trim();

// Email sending
const { sendEmail } = await import("../_core/email");
await sendEmail({ to, subject, html });

// Compliance deadlines with hours
deadlines: flagRows.map(f => ({ action: f.statement, hours: 48, jurisdiction: "JSE" }))

// Correct table for transcripts
`SELECT text FROM occ_transcription_segments WHERE conference_id = $1`

// Correct column for regulatory flags link to session
`SELECT * FROM regulatory_flags WHERE monitor_id = $1`

// compliance_deadlines deadline column
`INSERT INTO compliance_deadlines (..., deadline_at, ...) VALUES (..., NOW() + ($1 || ' hours')::interval, ...)`
```

## DON'T:
```typescript
// WRONG: no destructuring
const rows = await rawSql(...);

// WRONG: .content doesn't exist on InvokeResult
const text = result.content;

// WRONG: (result as any)?.content — same broken pattern
const text = (result as any)?.content;

// WRONG: Resend directly
import { Resend } from "resend";

// WRONG: deadline expects Date
deadlines: [{ deadline: new Date(...) }]

// WRONG: table doesn't exist
`SELECT * FROM transcript_segments WHERE session_id = $1`

// WRONG: column doesn't exist
`SELECT * FROM regulatory_flags WHERE session_id = $1`

// WRONG: column name
`INSERT INTO compliance_deadlines (..., deadline, ...)`

// WRONG: camelCase in raw SQL
`SELECT "overallScore" FROM agm_governance_scores`  // Use overall_score

// WRONG: SQL placeholder bugs
`WHERE $1_session_id_placeholder = $1`  // Use: WHERE session_id = $1

// WRONG: aliasing text as content
`SELECT content as text FROM occ_transcription_segments`  // Just use: SELECT text
```

---

# 13. DRIZZLE SCHEMA FILES — KEY EXPORTS

## drizzle/schema.ts (main)
Exports 100+ tables including: `users, events, shadowSessions, occConferences, occParticipants, occTranscriptionSegments, billingClients, billingQuotes, agenticAnalyses, bridgeEvents, regulatoryFlags` (as `complianceFlags`), etc.

## drizzle/gaps.schema.ts
Exports: `sessionReadinessChecks, sessionMessages, approvedQuestionsQueue, clientReportViewLog, clientReportFeedback, scheduledSessions, sessionHandoffs, sessionOperators, agmResolutions, agmShareholderSignals, historicalCommitments, boardMembers, complianceDeadlines, briefingAccuracyScores, sessionMarkers`

## drizzle/partners.schema.ts
Exports: `partners, clientTokens, clientReportAccess, partnerEvents`

---

# 14. VERIFICATION TEST RESULTS (5 April 2026)

Pipeline test run against session 21 (TestCorp Q1 2026 Results):

| # | Check | Result |
|---|-------|--------|
| 1 | Server starts clean, 7 background services | PASS |
| 2 | `[SessionClose]` log lines appear | PASS — full pipeline in 540ms |
| 3 | `compliance_deadlines` row created | PASS — deadline_at=2026-04-07, priority=high, status=open |
| 4 | `client_tokens` report token generated | PASS — expires 2026-05-05, access_type=report |
| 5 | Board Intelligence ran | PASS — completed in 22ms |
| 6 | `deadline_at` used (not `deadline`) | PASS |
| 7 | `hours: number` passed (not `deadline: Date`) | PASS |
| 8 | `calculateBriefingAccuracy(sessionId)` — number only | PASS |
| 9 | All `rawSql()` destructured as `const [rows]` | PASS |
| 10 | `invokeLLM` uses `choices[0].message.content` | PASS |
| 11 | Compliance email delivery | FAIL — Resend domain not verified |
| 12 | Report link email delivery | FAIL — Resend domain not verified |

**Email failure root cause:** Resend account requires domain verification at resend.com/domains. Not a code bug — pipeline, token generation, and DB writes all succeeded.

---

# 15. KNOWN BUGS / TECH DEBT (updated)

1. ~~**BoardIntelligenceService.ts invokeLLM extraction**~~ — **FIXED.** Both LLM calls now use `result.choices?.[0]?.message?.content` with JSON cleaning.

2. ~~**SessionClosePipeline.ts `content` column alias**~~ — **FIXED.** `getTranscriptText()` now uses `SELECT text FROM occ_transcription_segments`.

3. **AI Report Generation (SessionClosePipeline.ts):** The `generateAIReport()` function is still a placeholder — sets status to 'processing' then immediately to 'completed' and returns `{}`. The actual 20-module AI report pipeline is not yet wired. This is a separate sprint item.

4. **Resend domain verification:** Email delivery requires a verified sending domain in the Resend dashboard. Until verified, emails can only be sent to the Resend account owner's email.

5. **Governance Score ON CONFLICT:** The `agm_governance_scores` table may not have a unique constraint on `company`, causing the ON CONFLICT in BoardIntelligenceService to fail silently.

6. **PreEventBriefingService.ts `scheduledSessions` query:** The `startBriefingScheduler` currently filters by columns that may not exist on the `scheduled_sessions` table (`status`, `title`, `jurisdiction`). The scheduler starts but the query may return no results.

---

# 16. SERVER STARTUP SEQUENCE

1. Environment validation (`enforceEnvOrExit`)
2. Database migrations (non-blocking ALTER TABLEs)
3. Middleware: trust proxy → rate limiting → body parsing → brandConfig
4. Webhook routes (Recall.ai, Twilio — before body parsers for raw signature verification)
5. Feature routes (OAuth, uploads, billing PDFs, bridge webhooks)
6. Static/document download routes
7. Ably token endpoint
8. tRPC handler (`/api/trpc`)
9. Vite dev server (development) or static files (production)
10. Background services start (7 services)
11. Graceful shutdown handlers (SIGTERM/SIGINT)

---

# 17. TESTING / VERIFICATION

## Quick health check
```
curl https://curalive-platform.replit.app/health
```

## Session close verification
1. Create a test session via `shadowMode.startSession` (requires operator auth)
2. Add recipients to session (SQL: UPDATE shadow_sessions SET recipients = '...')
3. Add regulatory flags (SQL: INSERT INTO regulatory_flags ...)
4. Close session via `shadowMode.endSession` — triggers `runSessionClosePipeline`
5. Check server logs for `[SessionClose]` lines
6. Verify: `SELECT * FROM compliance_deadlines ORDER BY created_at DESC LIMIT 3`
7. Verify: `SELECT * FROM client_tokens ORDER BY created_at DESC LIMIT 3`

## Database verification queries
```sql
SELECT COUNT(*) FROM shadow_sessions;
SELECT * FROM partners;
SELECT * FROM client_tokens ORDER BY created_at DESC LIMIT 5;
SELECT * FROM compliance_deadlines ORDER BY created_at DESC LIMIT 5;
SELECT * FROM briefing_accuracy_scores ORDER BY scored_at DESC LIMIT 5;
SELECT * FROM regulatory_flags ORDER BY created_at DESC LIMIT 5;
```
