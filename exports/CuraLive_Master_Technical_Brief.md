# CuraLive Platform - Master Technical Brief

**Date:** 8 April 2026
**Version:** 2.0 - Post AI Report Pipeline Sprint
**Platform:** https://curalive-platform.replit.app
**Stack:** React 19 + Vite 7 + Express + tRPC 11 + PostgreSQL + Drizzle ORM

---

## 1. WHAT IS CURALIVE

CuraLive is a patented, real-time investor events intelligence platform. It monitors live corporate events (earnings calls, AGMs, capital raises, investor roadshows), transcribes them in real time, runs regulatory compliance analysis, generates AI intelligence reports, and delivers actionable intelligence to IR teams, compliance officers, and board members.

**Core value proposition:** Make regulated corporate communication events intelligent before they start, compliant while they run, and actionable immediately after they end.

**Target acquirers:** Microsoft, Bloomberg, Nasdaq, Lumi Global, Broadridge.
**Channel partners:** Lumi Global and Bastion Group (thousands of events annually).
**Revenue model:** Tiered intelligence subscriptions (Essential, Intelligence, Enterprise, AGM).

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

### 2.1 Monorepo Structure

```
/home/runner/workspace/
  artifacts/api-server/         # Artifact config (Replit deployment)
  client/src/                   # React 19 frontend (Vite)
    pages/                      # All route pages
    components/                 # Reusable UI components
    hooks/                      # Custom React hooks
    lib/                        # tRPC client, utilities
  server/                       # Express + tRPC backend
    _core/                      # Core services (index.ts, trpc.ts, llm.ts, email.ts, env.ts)
    routers/                    # 111 tRPC routers
    services/                   # 64 backend services
    middleware/                 # Express middleware (brandConfig.ts)
    emails/                     # HTML email templates
  drizzle/                      # Database schema (Drizzle ORM)
    schema.ts                   # Master schema barrel export
    gaps.schema.ts              # 15 tables (sessions, compliance, governance)
    partners.schema.ts          # 4 tables (partners, tokens, access)
  exports/                      # Generated documents (this file)
```

### 2.2 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19.2.1 |
| Build tool | Vite | 7.3.1 |
| CSS | TailwindCSS | 4.1.14 |
| Animation | Framer Motion | 12.23.22 |
| State management | TanStack React Query | 5.90.2 |
| API layer | tRPC | 11.6.0 |
| Routing | Wouter | 3.3.5 |
| Backend | Express | 4.21.2 |
| Database | PostgreSQL | (Replit managed) |
| ORM | Drizzle | 0.44.5 |
| Auth | JWT cookie sessions | Custom |
| AI | OpenAI GPT-4o + Whisper | Via proxy |
| Real-time | Ably | Pub/sub channels |
| Video | Mux | RTMP/HLS |
| Telephony | Twilio + Telnyx | SIP/WebRTC/PSTN |
| Email | Resend | Transactional |
| Bot deployment | Recall.ai | Meeting bots |

### 2.3 Database Scale

- **208 tables** managed by Drizzle ORM
- Primary schemas: `drizzle/schema.ts` barrel exports from multiple schema files
- Key schema files: `gaps.schema.ts` (15 tables), `partners.schema.ts` (4 tables)

---

## 3. AUTHENTICATION & AUTHORIZATION

### 3.1 How It Works

Authentication uses **JWT cookie sessions** via an `app_session_id` HTTP-only cookie.

**File:** `server/_core/trpc.ts`

Four procedure levels control access:
- `publicProcedure` - No auth required (report pages, token validation)
- `protectedProcedure` - Requires valid JWT session
- `operatorProcedure` - Requires operator or admin role
- `adminProcedure` - Requires admin role

### 3.2 Client-facing token access

Client pages (`/live/:token`, `/report/:token`, `/presenter/:token`) use **cryptographic access tokens** instead of user auth:

1. **Token generation:** `crypto.randomBytes(32).toString("hex")` produces 64-char hex tokens
2. **Token storage:** `client_tokens` table stores token, session_id, recipient info, access_type, expiry
3. **Token validation:** `partners.validateToken` tRPC procedure checks validity and expiry
4. **Token types:** `live` (7-day expiry), `report` (30-day expiry)

---

## 4. THE tRPC ROUTER SYSTEM

### 4.1 Critical Rule

**Every new tRPC router MUST be registered in BOTH files:**
- `server/routers.eager.ts`
- `server/routers.ts`

Missing either file will cause the router to be invisible in certain build modes.

### 4.2 Router Registration Pattern

```typescript
// In server/routers.ts and server/routers.eager.ts:
import { partnerRouter } from "./routers/partnerRouter";

export const appRouter = router({
  // ... other routers
  partners: partnerRouter,
  // ... other routers
});
```

### 4.3 Complete Router List (110 routers)

The platform has 110 registered routers. Key ones relevant to the intelligence pipeline:

| Router Key | File | Purpose |
|-----------|------|---------|
| `shadowMode` | `shadowModeRouter.ts` | Session lifecycle (create, start, end, manage) |
| `partners` | `partnerRouter.ts` | Partner management + public report/token access |
| `occ` | `occRouter.ts` | Operator Console operations |
| `compliance` | `complianceRouter.ts` | Regulatory compliance monitoring |
| `complianceEngine` | `complianceEngineRouter.ts` | Core regulatory logic engine |
| `transcription` | `transcriptionRouter.ts` | Live and recorded transcription |
| `boardIntelligence` | `boardIntelligenceRouter.ts` | Board-level summary reports |
| `agmGovernance` | `agmGovernanceRouter.ts` | AGM-specific legal governance |
| `postEventReport` | `postEventReportRouter.ts` | Post-event analytics |
| `sentiment` | `sentimentRouter.ts` | Real-time sentiment analysis |
| `ai` | `aiRouter.ts` | General AI utilities |
| `scheduling` | `schedulingRouter.ts` | Event scheduling |
| `liveQa` | `liveQaRouter.ts` | Live Q&A moderation |
| `archive` | `archiveRouter.ts` | Event archiving and retrieval |
| `sessionConfig` | `sessionConfigRouter.ts` | Dynamic session configuration |
| `sessionMessages` | `sessionMessagesRouter.ts` | Real-time message log |
| `speakerQueue` | `speakerQueueRouter.ts` | Speaker queue management |
| `agmIntelligence` | `agmIntelligenceRouter.ts` | AGM intelligence |
| `operations` | `operationsRouter.ts` | Platform operations (client view logging) |

### 4.4 tRPC Import Rule

Always import tRPC primitives from the centralized core file:

```typescript
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
```

---

## 5. DATABASE SCHEMA - KEY TABLES

### 5.1 Core Session Tables

**`shadow_sessions`** - The central session table
- `id` (serial PK)
- `company`, `event_name`, `event_type`, `jurisdiction`
- `platform` (zoom, teams, webex, other)
- `recipients` (JSON array of {name, email, role, sendLive, sendReport})
- `tier` (essential, intelligence, enterprise, agm)
- `partner_id` (FK to partners)
- `status` (draft, live, processing, completed, failed)
- `created_at`, `started_at`, `ended_at`
- `bot_id`, `recall_bot_id` (Recall.ai integration)
- `local_transcript_json` (fallback transcript storage)
- `report_links_sent_at`

**`occ_transcription_segments`** - Live transcript segments
- `id` (serial PK)
- `conference_id` (FK to shadow_sessions.id) - **NOT** `session_id`
- `text` - **NOT** `content`
- `speaker_name`, `speaker_role`
- `start_time`, `end_time`

**`regulatory_flags`** - Compliance flags detected during sessions
- `id` (serial PK)
- `monitor_id` (FK to shadow_sessions.id) - **NOT** `session_id`
- `flag_type`, `severity` (critical, high, medium, low)
- `statement`, `rule_basis`, `speaker`
- `jurisdiction`, `segment_timestamp`

### 5.2 Intelligence & Governance Tables (from gaps.schema.ts)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `scheduled_sessions` | Pre-scheduled events | `event_name`, `scheduled_at`, `partner_id` |
| `approved_questions_queue` | Live Q&A management | `session_id`, `question_text`, `status` |
| `compliance_deadlines` | Regulatory deadline tracking | `session_id`, `action`, `deadline_at`, `jurisdiction`, `priority`, `status` |
| `historical_commitments` | Management promise tracking | `company`, `commitment`, `committed_by`, `deadline`, `status` |
| `agm_governance_scores` | NOT a table in gaps.schema | Calculated and stored by BoardIntelligenceService |
| `board_members` | Board member registry | `company`, `name` |
| `briefing_accuracy_scores` | Pre-event briefing accuracy | `session_id` |
| `session_markers` | Operator-flagged moments | `session_id`, `segment_text` |
| `session_readiness_checks` | Pre-session validation | `session_id`, `check_name` |
| `session_messages` | Internal team messages | `session_id`, `from_role`, `message` |
| `client_report_view_log` | Report access analytics | `token`, `session_id` |
| `client_report_feedback` | Client feedback on reports | `session_id`, `token` |
| `agm_resolutions` | AGM resolution tracking | `session_id`, `title` |
| `agm_shareholder_signals` | Shareholder sentiment | `session_id`, `signal_type` |
| `session_handoffs` | Operator handoff log | `session_id`, `from_operator_id`, `to_operator_id` |
| `session_operators` | Multi-operator assignment | `session_id`, `operator_id` |

### 5.3 Partner & Token Tables (from partners.schema.ts)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `partners` | White-label partner config | `slug` (unique), `name`, `display_name`, `logo_url`, `primary_color`, `accent_color`, `font_family`, `active` |
| `client_tokens` | Secure access tokens | `token` (unique, 64-char hex), `session_id`, `partner_id`, `recipient_email`, `access_type` (live/report), `expires_at` |
| `client_report_access` | Multi-report token mapping | `token_id`, `session_id` |
| `partner_events` | Partner event association | `partner_id`, `session_id` |

### 5.4 Archive & Report Storage

**`archive_events`** - Intelligence report storage
- `event_id` (unique, format: `shadow-{sessionId}`)
- `client_name`, `event_name`, `event_type` (all NOT NULL)
- `transcript_text` (NOT NULL - full transcript text)
- `word_count` (computed from transcript)
- `status` (completed)
- `ai_report` (JSON column - the full 10-module AI report)
- `notes`

### 5.5 SQL Conventions (Critical)

```typescript
// rawSql() returns a [rows, fields] tuple - ALWAYS destructure:
const [rows] = await rawSql(`SELECT * FROM table WHERE id = $1`, [id]);

// rawSql() auto-translates ? to $1/$2 - you can use either syntax
// rawSql() auto-appends RETURNING id on INSERT - never add it manually

// camelCase column names must be double-quoted in raw SQL:
await rawSql(`SELECT "createdAt" FROM table`);

// NUMERIC columns from rawSql() must be wrapped in Number():
const score = Number(row.overall_score);
```

---

## 6. THE AI INTELLIGENCE PIPELINE

This is the core value engine of CuraLive. It runs automatically when a session ends.

### 6.1 Pipeline Trigger Flow

```
User clicks "End Session" in Operator Console
        |
        v
shadowModeRouter.ts → endSession mutation
        |
        |- Mark session status = 'processing'
        |- Command Recall.ai bot to leave (if applicable)
        |- Retrieve + parse transcript
        |- Generate tagged metrics (sentiment, engagement, compliance risk)
        |- Write anonymized record to global intelligence dataset
        |
        v
runSessionClosePipeline(sessionId) [async, non-blocking]
```

**File:** `server/routers/shadowModeRouter.ts` - `endSession` mutation

### 6.2 SessionClosePipeline (Orchestrator)

**File:** `server/services/SessionClosePipeline.ts` (209 lines)

This is the central orchestrator. It runs 5 stages in sequence:

```
Stage 1: Load session data + partner branding (LEFT JOIN partners)
        |
Stage 2: COMPLIANCE DEADLINES
        |- Query regulatory_flags for this session
        |- For each flag: INSERT into compliance_deadlines (48hr deadline)
        |- Send compliance alert email to all recipients
        |
Stage 3: AI REPORT GENERATION
        |- Call generateAIReport() from AIReportPipeline.ts
        |- 10 LLM modules run in parallel batches
        |- Report saved to archive_events.ai_report
        |
Stage 4: CLIENT DELIVERY
        |- Generate secure 64-char report tokens
        |- Store in client_tokens table (30-day expiry)
        |- Email report links to all recipients
        |
Stage 5: BOARD INTELLIGENCE
        |- Extract new management commitments
        |- Verify prior open commitments against current transcript
        |- Log board member speaking activity
        |- Calculate and store governance score
        |
Final: Mark session report_links_sent_at, log completion time
```

### 6.3 AIReportPipeline - The 10-Module Report Generator

**File:** `server/services/AIReportPipeline.ts` (520 lines)

This is the AI brain. It generates a comprehensive intelligence report with 10 modules.

**Step 1: Data Collection**
```typescript
// Load transcript segments from occ_transcription_segments
const transcript = await loadTranscript(sessionId);
// Fallback: shadow_sessions.local_transcript_json

// Load compliance flags
const [flagRows] = await rawSql(
  `SELECT id, flag_type, severity, statement, rule_basis, speaker, segment_timestamp
   FROM regulatory_flags WHERE monitor_id = $1
   ORDER BY severity DESC`, [sessionId]
);

// Load Q&A submissions
const [qaRows] = await rawSql(
  `SELECT question_text, asker_name, asker_firm, status, ai_suggested_answer
   FROM approved_questions_queue WHERE session_id = $1
   ORDER BY created_at ASC`, [sessionId]
);
```

**Step 2: Build Report Context**
```typescript
const ctx: ReportContext = {
  sessionId,
  company:      session.company,
  eventName:    session.event_name,
  eventType:    session.event_type,
  jurisdiction: session.jurisdiction,
  transcript:   transcriptText,      // Full formatted transcript
  flags:        flagRows,            // Compliance flags array
  qa:           qaRows,              // Q&A submissions array
  tier:         session.tier,
};
```

**Step 3: Run 10 LLM Modules (Two Parallel Batches)**

Batch 1 (priority modules):
```typescript
const [executiveSummary, complianceFlags, managementTone] = await Promise.all([
  runModule("executiveSummary", ctx),
  runModule("complianceFlags", ctx),
  runModule("managementTone", ctx),
]);
```

Batch 2 (remaining modules):
```typescript
const [financialMetrics, qaQuality, boardActions, socialMediaPack, sensRnsDraft, boardIntelligence, criticalActions] = await Promise.all([
  runModule("financialMetrics", ctx),
  runModule("qaQuality", ctx),
  runModule("boardActions", ctx),
  runModule("socialMediaPack", ctx),
  runModule("sensRnsDraft", ctx),
  runModule("boardIntelligence", ctx),
  runModule("criticalActions", ctx),
]);
```

**Step 4: LLM Invocation Pattern (Critical)**

```typescript
async function runModule(module: ModuleName, ctx: ReportContext): Promise<any> {
  const prompt = buildPrompt(module, ctx);
  const result = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 1200,
  });
  // CORRECT way to extract content:
  const rawText = result.choices?.[0]?.message?.content ?? "";
  const text = typeof rawText === "string" ? rawText : JSON.stringify(rawText);
  const cleaned = text.replace(/```json|```/g, "").trim();

  // Parse JSON for structured modules, return text for narrative modules
  const jsonModules = ["executiveSummary", "complianceFlags", "criticalActions", "boardIntelligence"];
  if (jsonModules.includes(module)) {
    try { return JSON.parse(cleaned); }
    catch { return cleaned; }
  }
  return cleaned;
}
```

**WRONG invokeLLM pattern (will silently fail):**
```typescript
// NEVER use these - they return undefined:
result.content
(result as any)?.content
result.text
```

### 6.4 The 10 Report Modules - Prompts & Output Formats

#### Module 1: Executive Summary (`executiveSummary`)
- **Prompt role:** Senior investor relations analyst
- **Output:** JSON `{ verdict: string, metrics: [{value, label}] }`
- **Metrics:** Management confidence (%), Compliance risk (/10), Session duration, Flags raised
- **Transcript input:** Full (up to 6000 chars)

#### Module 2: Critical Actions (`criticalActions`)
- **Prompt role:** Compliance officer
- **Output:** JSON array `[{ title, detail, priority: "urgent"|"high" }]`
- **Focus:** Regulatory filing obligations, disclosure requirements, remediation
- **Max items:** 5

#### Module 3: Compliance Flags (`complianceFlags`)
- **Prompt role:** Regulatory compliance specialist for [jurisdiction]-listed companies
- **Output:** JSON array `[{ title, description, action, severity, ruleRef, deadline }]`
- **Severity levels:** critical, warning, info
- **Input:** Detected flags + transcript excerpt (3000 chars)

#### Module 4: Financial Metrics (`financialMetrics`)
- **Prompt role:** Financial analyst
- **Output:** Free-text analyst briefing note (paragraphs, no bullet points)
- **Coverage:** Revenue/earnings, margins, capital allocation, guidance ranges, risk factors
- **Transcript input:** Full

#### Module 5: Management Tone (`managementTone`)
- **Prompt role:** Behavioural analyst specialising in executive communication
- **Output:** Free-text professional briefing note for a board member
- **Coverage:** Confidence trajectory, hedging language, deflection topics, sentiment by topic
- **Transcript input:** Full

#### Module 6: Q&A Quality (`qaQuality`)
- **Prompt role:** Investor relations analyst
- **Output:** Free-text professional briefing
- **Coverage:** Analyst firm engagement, question quality, disclosure risk, intelligence signals
- **Input:** Q&A submissions + transcript (3000 chars)

#### Module 7: Board Actions (`boardActions`)
- **Prompt role:** Company secretary advising the board
- **Output:** Free-text action register
- **Coverage:** Commitments, disclosures, regulatory filings, IR follow-up, governance risks
- **Input:** Flags + Q&A + transcript (2000 chars)

#### Module 8: Social Media Pack (`socialMediaPack`)
- **Prompt role:** Corporate communications specialist
- **Output:** Free-text with sections
- **Sections:** LinkedIn post (150-200 words), JSE SENS social announcement (100 words), Internal stakeholder summary (200 words), Key messages (5 bullets)

#### Module 9: SENS/RNS Draft (`sensRnsDraft`)
- **Prompt role:** JSE SENS regulatory announcement specialist
- **Output:** Free-text in JSE SENS format with [PLACEHOLDER] markers
- **Format:** Full SENS announcement with issuer name, announcement type, headline, body, contacts

#### Module 10: Board Intelligence (`boardIntelligence`)
- **Prompt role:** Corporate governance specialist
- **Output:** JSON `{ governanceScore: number, scoreSummary: string, commitments: [...], riskAreas: [...], boardReadiness: string }`
- **Score guide:** 85-100 excellent, 70-84 good, 55-69 moderate, <55 concerns

### 6.5 Report Storage (saveReport)

```typescript
async function saveReport(sessionId: number, session: any, report: any): Promise<void> {
  const reportJson = JSON.stringify(report);
  const eventId = `shadow-${sessionId}`;

  await rawSql(
    `INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text, word_count, status, ai_report, notes)
     VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, 'Generated by AI Report Pipeline')
     ON CONFLICT (event_id) DO UPDATE SET ai_report = $7, status = 'completed'`,
    [eventId, clientName, eventName, eventType, transcriptText, wordCount, reportJson]
  );
}
```

**Critical:** `archive_events` has NOT NULL constraints on `id, client_name, event_name, event_type, transcript_text, status, created_at`. The `saveReport()` function MUST include `transcript_text` and `word_count`.

---

## 7. SESSION CLOSE PIPELINE - DETAILED WALKTHROUGH

**File:** `server/services/SessionClosePipeline.ts`

### 7.1 Entry Point

```typescript
export async function runSessionClosePipeline(sessionId: number): Promise<void> {
```

Called from `shadowModeRouter.ts` endSession mutation, runs asynchronously.

### 7.2 Step A: Load Session + Partner Data

```sql
SELECT s.*, p.sending_name, p.sending_email, p.logo_url, p.primary_color
FROM shadow_sessions s
LEFT JOIN partners p ON p.id = s.partner_id
WHERE s.id = $1
```

The LEFT JOIN fetches partner branding so emails can be white-labeled.

### 7.3 Step B: Parse Recipients

```typescript
const recipients = typeof session.recipients === 'string'
  ? JSON.parse(session.recipients)
  : (session.recipients ?? []);
```

Recipients are stored as a JSON array in `shadow_sessions.recipients`:
```json
[
  { "name": "Dave Cameron", "email": "dave@curalive.cc", "role": "compliance", "sendLive": true, "sendReport": true },
  { "name": "Jane Analyst", "email": "jane@fund.com", "role": "viewer", "sendReport": true }
]
```

### 7.4 Step C: Compliance Deadlines + Alert Email

For each compliance flag detected during the session:

```typescript
await rawSql(
  `INSERT INTO compliance_deadlines
     (session_id, flag_id, action, deadline_at, jurisdiction, priority, status, assigned_to)
   VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval, $5, $6, 'open', $7)`,
  [sessionId, flag.id, flag.statement, deadlineHours, jurisdiction, priority, email]
);
```

Then sends a compliance alert email via `ComplianceDeadlineService.ts`:

```typescript
await sendComplianceCloseEmail({
  sessionId,
  companyName,
  eventName,
  flags: flagRows.map(f => ({ title, body, severity })),
  deadlines: flagRows.map(f => ({ action, hours: 48, jurisdiction })),
  recipients: complianceRecipients.map(r => ({ name, email })),
});
```

### 7.5 Step D: AI Report Generation

```typescript
reportModules = await generateAIReportWrapper(sessionId, session);
```

The wrapper:
1. Sets session status to `processing`
2. Dynamically imports `AIReportPipeline.ts`
3. Calls `generateAIReport(sessionId, session)`
4. Returns module keys for downstream use
5. On failure: marks session `completed` anyway (graceful degradation)

### 7.6 Step E: Client Report Delivery

```typescript
await sendReportLinks({
  sessionId, eventName, companyName, eventDate,
  reportModules: Object.keys(reportModules).length,
  complianceFlags: flagRows.length,
  sessionDuration: calculateDuration(session),
  recipients: reportRecipients.map(r => ({ name, email })),
  partnerId: session.partner_id,
});
```

**ClientDeliveryService.ts** does:
1. Generates a new 64-char hex token per recipient
2. Inserts into `client_tokens` (30-day expiry, access_type = 'report')
3. Builds the report URL: `{APP_URL}/report/{token}`
4. Sends branded HTML email with report link

### 7.7 Step F: Board Intelligence Update

```typescript
runBoardIntelligenceUpdate({
  sessionId, company, eventType,
  reportModules: { module08, module07, module05, module19 },
  transcriptText,
}).catch(e => ERR('Board Intelligence update failed', e));
```

**BoardIntelligenceService.ts** runs 4 sub-tasks:

1. **Extract new commitments** - Parses module08 (Board Intelligence) for forward guidance, inserts into `historical_commitments`
2. **Verify prior commitments** - Loads open commitments for this company, uses LLM to check if they were addressed (met, partial, at_risk)
3. **Log board member activity** - Updates `board_members` with speaking stats
4. **Calculate governance score** - Computes and stores score in `agm_governance_scores`

### 7.8 Step G: Briefing Accuracy Score

```typescript
scoreBriefingAccuracy(sessionId).catch(...)
```

If a pre-event briefing was sent, compares its predictions against actual session content to score accuracy.

---

## 8. CLIENT-FACING PAGES

### 8.1 Report Page (`/report/:token`)

**File:** `client/src/pages/ClientReport.tsx` (334 lines)

**Data flow:**
1. Extract token from URL: `useRoute("/report/:token")`
2. Validate token: `trpc.partners.validateToken.useQuery({ token })`
3. Load partner brand: `useBrandConfig(tokenData?.partnerId)`
4. Fetch report: `trpc.partners.getReportByToken.useQuery({ token })`
5. Log view: `trpc.operations.logClientView.useMutation()`

**10 tabs rendered:**
| Tab ID | Label | Data Source | Format |
|--------|-------|------------|--------|
| `summary` | Executive Summary | `report.executiveSummary` | JSON (verdict + metrics cards) |
| `financials` | Financial Metrics | `report.financialMetrics` | Free text (paragraphs) |
| `compliance` | Compliance Flags | `report.complianceFlags` | JSON array (severity-coded cards) |
| `tone` | Management Tone | `report.managementTone` | Free text (paragraphs) |
| `qa` | Q&A Log | `report.qaQuality` | Free text |
| `transcript` | Full Transcript | `report._transcriptText` | Raw transcript |
| `actions` | Action Items | `report.criticalActions` | JSON array (priority badges) |
| `social` | Social Media Pack | `report.socialMediaPack` | Free text (sectioned) |
| `sens` | SENS/RNS Draft | `report.sensRnsDraft` | Free text (SENS format) |
| `certificate` | Certificate | `report.boardIntelligence` | JSON (governance score + commitments) |

### 8.2 Live Dashboard (`/live/:token`)

**File:** `client/src/pages/ClientLive.tsx`

Real-time intelligence dashboard during active sessions. Receives live data via Ably real-time channels. Shows live transcript, sentiment, compliance flags, and session status.

### 8.3 Presenter Screen (`/presenter/:token`)

**File:** `client/src/pages/PresenterScreen.tsx`

Teleprompter-style display for presenters. Shows approved Q&A questions, timing, and session flow.

### 8.4 Branding Rule

**NEVER show vendor names** on `/live/:token`, `/report/:token`, `/presenter/:token`:
- Banned: Whisper, Recall.ai, GPT-4o, OpenAI, Gemini, Ably, Twilio, Mux, Resend
- Use instead: "CuraLive Intelligence Agent", "AI transcription", "CuraLive AI"

---

## 9. tRPC PROCEDURES FOR REPORT ACCESS

### 9.1 Token Validation

**File:** `server/routers/partnerRouter.ts`

```typescript
validateToken: publicProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    const [rows] = await rawSql(
      `SELECT ct.session_id, ct.partner_id, ct.recipient_name, ct.recipient_email,
              ct.access_type, ct.expires_at, p.display_name, p.logo_url
       FROM client_tokens ct
       LEFT JOIN partners p ON p.id = ct.partner_id
       WHERE ct.token = $1 AND ct.expires_at > NOW()`,
      [input.token]
    );
    if (!rows.length) return { valid: false };
    return { valid: true, ...rows[0] };
  })
```

### 9.2 Report Data Retrieval

```typescript
getReportByToken: publicProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    // 1. Validate token
    const [tokenRows] = await rawSql(
      `SELECT session_id FROM client_tokens WHERE token = $1 AND expires_at > NOW()`,
      [input.token]
    );
    if (!tokenRows.length) return null;

    // 2. Load report from archive_events
    const eventId = `shadow-${tokenRows[0].session_id}`;
    const [reportRows] = await rawSql(
      `SELECT ai_report FROM archive_events WHERE event_id = $1`,
      [eventId]
    );
    if (!reportRows.length || !reportRows[0].ai_report) return null;

    // 3. Return parsed report
    return typeof reportRows[0].ai_report === 'string'
      ? JSON.parse(reportRows[0].ai_report)
      : reportRows[0].ai_report;
  })
```

---

## 10. EMAIL SYSTEM

### 10.1 Core Email Function

**File:** `server/_core/email.ts`

```typescript
import { Resend } from "resend";

const FROM_ADDRESS = "CuraLive <noreply@curalive.cc>";
const FROM_ADDRESS_FALLBACK = "CuraLive <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }>
```

**Rule:** Always import `sendEmail` from `server/_core/email.ts`. Never import Resend directly.

**Current state:** Using `onboarding@resend.dev` (Resend test domain). For external delivery, verify `curalive.cc` at resend.com/domains.

### 10.2 Email Templates

**File:** `server/emails/templates.ts` (145 lines)

All templates use a shared `baseLayout()` that applies partner branding (logo, colors, fonts).

| Template Function | Subject Line | Trigger |
|------------------|-------------|---------|
| `buildLiveDashboardEmail()` | "Live Intelligence Dashboard - {event}" | Session start |
| `buildReportEmail()` | "Intelligence Report Ready - {event}" | Session close pipeline |
| `buildComplianceCloseEmail()` | "COMPLIANCE ALERT - {event} - Immediate Action Required" | Session close (if flags) |
| `buildPreBriefingEmail()` | "Pre-Event Intelligence Briefing - {event}" | 65 min before scheduled event |

---

## 11. BACKGROUND SERVICES

Seven services start automatically on server boot from `server/_core/index.ts`:

### 11.1 Service List

| Service | File | Interval | Purpose |
|---------|------|----------|---------|
| **ReminderScheduler** | `server/reminderScheduler.ts` | 5 min | Sends 24h and 1h email reminders to webcast registrants |
| **HealthGuardian** | `server/services/HealthGuardianService.ts` | 30 sec | Monitors DB, Twilio, OpenAI, Ably, Recall.ai latency; creates incidents |
| **ComplianceEngine** | `server/services/ComplianceEngineService.ts` | 5 min | Scans for security threats, ISO 27001/SOC 2 compliance monitoring |
| **ComplianceDeadlineMonitor** | `server/services/ComplianceDeadlineService.ts` | 15 min | Escalates overdue compliance deadlines |
| **BriefingScheduler** | `server/services/PreEventBriefingService.ts` | 5 min | Generates and sends AI pre-event briefings 65 min before events |
| **ShadowWatchdog** | `server/services/ShadowModeGuardianService.ts` | 60 sec | Cleans up zombie sessions (stuck live >6h, bot never joined >10m) |
| **ComplianceDigest** | `server/complianceDigestScheduler.ts` | 1 hour | Weekly Monday 08:00 UTC SOC 2/ISO 27001 readiness report |

### 11.2 Startup Sequence (in index.ts)

```typescript
startReminderScheduler(origin);
startHealthGuardian();
startComplianceEngine();
startComplianceDeadlineMonitor();
startBriefingScheduler();
reconcileShadowSessions();   // One-time cleanup on boot
startShadowWatchdog();
startComplianceDigestScheduler();
```

---

## 12. WHITE-LABEL PARTNER SYSTEM

### 12.1 How It Works

**File:** `server/middleware/brandConfig.ts`

Middleware reads the incoming request domain/origin and looks up partner configuration from the `partners` table. Partner branding flows through to:
- Email templates (logo, colors, fonts)
- Client-facing pages (header, theme)
- Report URLs

### 12.2 Partner Data Structure

```sql
partners table:
  slug (unique) - URL-safe identifier
  name - Internal name
  display_name - Client-facing name
  logo_url - Partner logo URL
  primary_color - Header/accent color
  accent_color - Button/link color
  font_family - CSS font stack
  active (boolean)
  sending_name - Email "from" display name
  sending_email - Email "from" address
```

### 12.3 Client-Side Brand Hook

**File:** `client/src/hooks/useBrandConfig.ts`

```typescript
const brand = useBrandConfig(partnerId);
// Returns: { displayName, logoUrl, primaryColor, accentColor, fontFamily }
// Defaults to CuraLive branding when no partner
```

---

## 13. ENVIRONMENT VARIABLES & SECRETS

### 13.1 Required for Core Operation

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `JWT_SECRET` | Session token signing |
| `OPENAI_API_KEY` | GPT-4o for AI analysis, Whisper for transcription |
| `ABLY_API_KEY` | Real-time pub/sub messaging |
| `RESEND_API_KEY` | Transactional email sending |
| `APP_URL` | Public URL for email links (https://curalive-platform.replit.app) |

### 13.2 Optional (Feature-Gated)

| Variable | Feature | Behaviour if Missing |
|----------|---------|---------------------|
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID` | Telephony | Telephony disabled |
| `RECALL_AI_API_KEY`, `RECALL_AI_WEBHOOK_SECRET` | Meeting bot | Manual transcript mode only |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` | Video streaming | Video disabled |
| `STRIPE_SECRET_KEY` | Payments | Billing disabled |
| `TELNYX_API_KEY` | Failover carrier | No failover |

---

## 14. VERIFIED END-TO-END TEST RESULTS (Pick n Pay)

This test was executed on 8 April 2026 using session ID 22.

### 14.1 Test Configuration

| Parameter | Value |
|-----------|-------|
| Session ID | 22 |
| Company | Pick n Pay Group |
| Event | H1 FY26 Results Presentation |
| Jurisdiction | JSE |
| Platform | other (local audio capture) |
| Transcript | 12,769 characters, 28 segments |
| Compliance flags | 5 (selective disclosure, forward-looking statements) |
| Recipients | Dave Cameron (davecameron187@gmail.com), test@curalive.cc |

### 14.2 Pipeline Results

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Session creation | ID assigned | Session 22 created | PASS |
| Transcript injection | Segments stored | 28 segments, 12,769 chars | PASS |
| Flag insertion | 5 regulatory flags | 5 flags inserted | PASS |
| Pipeline trigger | endSession succeeds | Completed in 35,664ms | PASS |
| Report generation | 10-module report | 31,832 chars, all 10 modules populated | PASS |
| Compliance deadlines | Rows created | 5 deadlines (48hr, JSE, high priority) | PASS |
| Token generation | Report token created | 64-char hex token, 30-day expiry | PASS |
| Governance score | Score calculated | 70/100 | PASS |
| Commitments | Extracted and stored | 2 new commitments saved | PASS |
| Prior verification | Checked open commitments | 1 prior commitment verified | PASS |
| Report page render | All 10 tabs show content | All tabs populated with PnP-specific AI content | PASS |
| Email delivery | Emails attempted | Sent (blocked by Resend domain verification) | PARTIAL |

### 14.3 Report Content Verification

| Module | Content Size | First Line |
|--------|-------------|------------|
| Executive Summary | JSON object | "The H1 FY26 Results Presentation for Pick n Pay Group featured a cautious but forward-looking tone..." |
| Critical Actions | 5 items | "Review Selective Disclosure Practices" |
| Compliance Flags | 5 items | "Formal cash burn guidance not provided..." |
| Financial Metrics | 3,894 chars | "As a financial analyst reviewing the transcript from Pick n Pay Group's H1 FY26 Results Presentation..." |
| Management Tone | 4,684 chars | "Analysis of Management Tone in Pick n Pay Group's H1 FY26 Results Presentation" |
| Q&A Quality | 3,885 chars | "Analysis of Q&A Session for Pick n Pay Group's H1 FY26 Results Presentation" |
| Board Actions | 5,872 chars | "ACTION REGISTER: H1 FY26 Results Presentation -- Pick n Pay Group" |
| Social Media Pack | 4,189 chars | "Pick n Pay Group Announces H1 FY26 Interim Results" |
| SENS/RNS Draft | 2,522 chars | "CURALIVE INTELLIGENCE PLATFORM -- RESULTS ANNOUNCEMENT, Pick n Pay Group" |
| Board Intelligence | JSON object | governanceScore: 70, "The governance score reflects solid delivery on commitments..." |

---

## 15. HOW TO REPRODUCE THE END-TO-END TEST

### Step 1: Create a Session

```bash
curl -s "https://$REPLIT_DEV_DOMAIN/api/trpc/shadowMode.createSession" \
  -X POST -H "Content-Type: application/json" \
  -H "Cookie: app_session_id=YOUR_JWT" \
  -d '{"json":{"platform":"other","meetingUrl":""}}'
```

### Step 2: Configure Session

```sql
UPDATE shadow_sessions
SET company = 'Pick n Pay Group',
    event_name = 'H1 FY26 Results Presentation',
    event_type = 'earnings_call',
    jurisdiction = 'JSE',
    recipients = '[{"name":"Dave Cameron","email":"dave@curalive.cc","role":"compliance","sendLive":true,"sendReport":true}]'
WHERE id = YOUR_SESSION_ID;
```

### Step 3: Inject Transcript

```sql
INSERT INTO occ_transcription_segments (conference_id, speaker_name, speaker_role, text, start_time)
VALUES
  (SESSION_ID, 'Pieter Boone', 'CEO', 'Good morning everyone. Welcome to our H1 FY26 Results Presentation.', 0),
  (SESSION_ID, 'Pieter Boone', 'CEO', 'Revenue grew to R22.5 billion...', 15),
  -- ... additional segments
```

### Step 4: Insert Compliance Flags

```sql
INSERT INTO regulatory_flags (monitor_id, flag_type, severity, statement, rule_basis, jurisdiction, speaker)
VALUES
  (SESSION_ID, 'selective_disclosure', 'high', 'Revenue grew to R22.5 billion...', 'JSE Listings Requirements 3.4', 'JSE', 'CEO'),
  -- ... additional flags
```

### Step 5: End Session (Triggers Pipeline)

```bash
curl -s "https://$REPLIT_DEV_DOMAIN/api/trpc/shadowMode.endSession" \
  -X POST -H "Content-Type: application/json" \
  -H "Cookie: app_session_id=YOUR_JWT" \
  -d '{"json":{"sessionId":SESSION_ID,"status":"completed"}}'
```

### Step 6: Verify Database

```sql
-- Check report was saved
SELECT event_id, client_name, length(ai_report::text) as report_chars
FROM archive_events WHERE event_id = 'shadow-SESSION_ID';

-- Check compliance deadlines
SELECT action, deadline_at, jurisdiction, priority, status
FROM compliance_deadlines WHERE session_id = SESSION_ID;

-- Check tokens generated
SELECT token, recipient_email, access_type, expires_at
FROM client_tokens WHERE session_id = SESSION_ID;

-- Check governance score
SELECT company, overall_score FROM agm_governance_scores
WHERE company = 'Pick n Pay Group';
```

### Step 7: View Report

Open: `https://curalive-platform.replit.app/report/TOKEN_FROM_STEP_6`

All 10 tabs should show company-specific AI-generated content.

---

## 16. KNOWN ISSUES & REMAINING WORK

### 16.1 Resend Domain Verification

External email delivery is blocked because `curalive.cc` is not verified at resend.com/domains. Currently using `onboarding@resend.dev` fallback which only delivers to the Resend account owner's email.

**Fix:** Go to resend.com/domains, add `curalive.cc`, add the DNS records (MX, TXT, DKIM), then change `FROM_ADDRESS_FALLBACK` to `FROM_ADDRESS` in `server/_core/email.ts`.

### 16.2 OAuth Not Configured

`OAUTH_SERVER_URL` is not set. OAuth-based authentication is disabled. JWT cookie sessions work independently.

### 16.3 Session Plan T001-T006

The session plan in the context tracks tasks T001-T006 (Schema files, Backend services, Routers, Client pages, Wiring, Operator Console additions). All 6 tasks are COMPLETED.

---

## 17. FILE INDEX - CRITICAL FILES

| File | Lines | Purpose |
|------|-------|---------|
| `server/_core/index.ts` | ~1100 | Server entry point, middleware, service startup |
| `server/_core/trpc.ts` | ~80 | tRPC initialization, procedure definitions |
| `server/_core/llm.ts` | ~60 | invokeLLM wrapper around OpenAI |
| `server/_core/email.ts` | 495 | sendEmail via Resend, all email helpers |
| `server/_core/env.ts` | ~100 | Environment variable validation |
| `server/routers.ts` | ~550 | Main router registration (110 routers) |
| `server/routers.eager.ts` | ~550 | Eager-loaded router registration |
| `server/routers/shadowModeRouter.ts` | ~800 | Session lifecycle (create, start, end) |
| `server/routers/partnerRouter.ts` | 145 | Partner management + public report access |
| `server/services/AIReportPipeline.ts` | 520 | 10-module AI report generator |
| `server/services/SessionClosePipeline.ts` | 209 | Post-session orchestrator |
| `server/services/BoardIntelligenceService.ts` | 338 | Commitment tracking + governance scoring |
| `server/services/ClientDeliveryService.ts` | 127 | Token generation + email delivery |
| `server/services/ComplianceDeadlineService.ts` | 87 | Deadline creation + escalation monitor |
| `server/services/PreEventBriefingService.ts` | 151 | AI pre-event briefing generator |
| `server/middleware/brandConfig.ts` | ~60 | White-label partner middleware |
| `server/emails/templates.ts` | 145 | HTML email templates (4 types) |
| `client/src/pages/ClientReport.tsx` | 334 | Report page (10-tab intelligence report) |
| `client/src/pages/ClientLive.tsx` | ~300 | Live dashboard page |
| `client/src/pages/PresenterScreen.tsx` | ~200 | Presenter teleprompter page |
| `client/src/hooks/useBrandConfig.ts` | ~30 | Partner branding hook |
| `drizzle/schema.ts` | ~20 | Barrel export for all schema files |
| `drizzle/gaps.schema.ts` | ~300 | 15 tables (sessions, compliance, governance) |
| `drizzle/partners.schema.ts` | ~120 | 4 tables (partners, tokens, access) |

---

## 18. DEPLOYMENT

**Published at:** https://curalive-platform.replit.app
**Build command:** esbuild bundles server to `dist/`, Vite builds client to `dist/public/`
**Runtime:** Node.js 20+
**Database:** Replit-managed PostgreSQL (same instance for dev and prod)
**Port:** Reads from `PORT` environment variable

---

*This brief was generated on 8 April 2026 and reflects the state of the CuraLive platform after the AI Report Pipeline sprint completion and successful Pick n Pay end-to-end pipeline test.*
