# CURALIVE SHADOW MODE — COMPLETE PLATFORM BRIEF

**Date:** 2026-03-29
**Total Source Lines:** ~10,500 across 15 files
**Stack:** React 19 + Vite + Express + tRPC + PostgreSQL + Drizzle ORM + Ably + Recall.ai

---

## TABLE OF CONTENTS

1. Platform Overview
2. Architecture & File Map
3. Database Schema (4 tables)
4. Session Lifecycle & State Machine
5. tRPC Router — All Procedures
6. Recall.ai Bot Integration
7. Local Audio Capture (Chorus Call / Other)
8. Ably Real-Time Pub/Sub
9. Shadow Guardian Service (Watchdog)
10. AI Pipeline (Post-Session)
11. Tagged Metrics Engine
12. Live Q&A System
13. UI Tab System (8 tabs)
14. Component Inventory (13 components)
15. Keyboard Shortcuts
16. Session Auto-Save
17. System Diagnostics Console
18. Recall.ai Webhook Handler (AI-AM)
19. Design System & Tokens
20. Auth & Procedures
21. Environment Variables & Secrets
22. Critical Gotchas for Porting
23. Full Source Code (all files)

---

## 1. PLATFORM OVERVIEW

Shadow Mode is CuraLive's live-event intelligence dashboard. An operator creates a session for a corporate event (earnings call, AGM, investor day, etc.), and CuraLive either deploys a Recall.ai bot into the meeting or captures audio locally via the browser. During the session, CuraLive transcribes in real-time, runs sentiment analysis, flags compliance keywords, and streams everything to the operator dashboard via Ably pub/sub. When the session ends, a full AI report is generated (executive summary, sentiment, compliance, key topics, risk factors, action items), tagged metrics are written to the intelligence database, crisis prediction runs, disclosure certificates are generated, and valuation impact is analyzed.

The operator works across 8 tabs: Live (active session + transcript), Archive (completed sessions), Reports (AI reports), AI Learning (corrections & adaptive thresholds), AI Dashboard (CIP4 analytics), Advisory (chat), Diagnostics (system health), and Live Q&A (audience question management).

---

## 2. ARCHITECTURE & FILE MAP

### Backend (server/)

| File | Lines | Purpose |
|------|-------|---------|
| `server/routers/shadowModeRouter.ts` | 1,386 | Core Shadow Mode tRPC router — 18 procedures |
| `server/routers/systemDiagnosticsRouter.ts` | 155 | System health check — 15 diagnostic tests |
| `server/routers/liveQaRouter.ts` | ~650 | Live Q&A tRPC router — question triage, answers, compliance |
| `server/services/ShadowModeGuardianService.ts` | 153 | Watchdog + reconciliation + graceful shutdown |
| `server/webhooks/aiAmRecall.ts` | 286 | Recall.ai webhook handler for AI-AM compliance |
| `server/routers.eager.ts` | — | Router registration (shadowMode, systemDiagnostics, liveQa) |
| `server/routers.ts` | — | Duplicate router registration |

### Frontend (client/src/)

| File | Lines | Purpose |
|------|-------|---------|
| `pages/ShadowMode.tsx` | 4,221 | Main page — all 8 tabs, session management, archive, reports |
| `components/LiveSessionPanel.tsx` | 552 | Live transcript viewer + controls |
| `components/LocalAudioCapture.tsx` | 616 | Browser-based audio capture for non-Recall platforms |
| `components/AIDashboard.tsx` | 1,189 | CIP4 intelligence analytics dashboard |
| `components/LiveQaDashboard.tsx` | 1,224 | Live Q&A management (triage, answers, compliance flags) |
| `components/SystemDiagnostics.tsx` | 152 | One-click platform health check |
| `components/WebPhoneCallManager.tsx` | 285 | WebRTC phone dial-in management |
| `components/WebPhoneJoinInstructions.tsx` | 217 | Join-by-phone instructions modal |
| `components/ProviderStateIndicator.tsx` | 160 | Provider connection status display |

### Hooks & Services

| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useAblySessions.ts` | 164 | Ably channel subscription for real-time transcript |
| `hooks/useKeyboardShortcuts.ts` | 94 | Global keyboard shortcuts (Ctrl+E, Ctrl+S, etc.) |
| `services/sessionAutoSave.ts` | 104 | localStorage auto-save/recovery for session forms |

### Schema

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` (lines 2422–2494) | 4 tables: shadow_sessions, operator_actions, operator_corrections, adaptive_thresholds |

---

## 3. DATABASE SCHEMA

### shadow_sessions

```sql
CREATE TABLE shadow_sessions (
  id              SERIAL PRIMARY KEY,
  client_name     VARCHAR(255) NOT NULL,
  event_name      VARCHAR(255) NOT NULL,
  event_type      VARCHAR(64) NOT NULL,
  platform        VARCHAR(64) NOT NULL DEFAULT 'zoom',
  meeting_url     VARCHAR(1000) NOT NULL,
  recall_bot_id   VARCHAR(255),
  ably_channel    VARCHAR(255),
  local_transcript_json TEXT,
  local_recording_path  VARCHAR(1000),
  status          VARCHAR(64) NOT NULL DEFAULT 'pending',
  transcript_segments   INTEGER DEFAULT 0,
  sentiment_avg   REAL,
  compliance_flags INTEGER DEFAULT 0,
  tagged_metrics_generated INTEGER DEFAULT 0,
  notes           TEXT,
  started_at      BIGINT,
  ended_at        BIGINT,
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### operator_actions

```sql
CREATE TABLE operator_actions (
  id             SERIAL PRIMARY KEY,
  session_id     INTEGER,
  archive_id     INTEGER,
  action_type    VARCHAR(64) NOT NULL,
  detail         TEXT,
  operator_id    INTEGER,
  operator_name  VARCHAR(255),
  metadata       TEXT,
  created_at     TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### operator_corrections

```sql
CREATE TABLE operator_corrections (
  id               SERIAL PRIMARY KEY,
  event_id         VARCHAR(255) NOT NULL,
  event_title      VARCHAR(255),
  metric_id        INTEGER,
  correction_type  VARCHAR(64) NOT NULL,
  original_value   REAL,
  corrected_value  REAL,
  original_label   VARCHAR(255),
  corrected_label  VARCHAR(255),
  reason           TEXT,
  event_type       VARCHAR(64),
  client_name      VARCHAR(255),
  operator_id      VARCHAR(255) DEFAULT 'operator',
  applied_to_model SMALLINT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### adaptive_thresholds

```sql
CREATE TABLE adaptive_thresholds (
  id               SERIAL PRIMARY KEY,
  threshold_key    VARCHAR(255) NOT NULL,
  event_type       VARCHAR(64),
  sector           VARCHAR(64),
  metric_type      VARCHAR(64) NOT NULL,
  default_value    REAL NOT NULL,
  learned_value    REAL NOT NULL,
  sample_count     INTEGER DEFAULT 0,
  last_correction_at TIMESTAMP DEFAULT NOW(),
  created_at       TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## 4. SESSION LIFECYCLE & STATE MACHINE

```
pending → bot_joining → live → processing → completed
                                          ↘ failed
pending → live (Local Audio Capture — no bot_joining step)
```

| Status | Meaning | Trigger |
|--------|---------|---------|
| `pending` | Session created, no bot deployed | `startSession` or `createFromCalendar` |
| `bot_joining` | Recall.ai bot created, joining meeting | Recall.ai API returns bot ID |
| `live` | Bot in meeting OR local capture active | Recall webhook confirms join / local audio starts |
| `processing` | Session ended, AI report generating | `endSession` called |
| `completed` | All processing done | AI report + metrics complete |
| `failed` | Bot deploy failed or session timed out | API error, Guardian timeout, or manual |

---

## 5. tRPC ROUTER — ALL 18 PROCEDURES

Router name: `shadowMode` → client calls `trpc.shadowMode.*`

| # | Procedure | Type | Auth | Input | Purpose |
|---|-----------|------|------|-------|---------|
| 1 | `startSession` | mutation | operator | clientName, eventName, eventType, platform, meetingUrl, webhookBaseUrl?, notes? | Create session + deploy Recall bot or start local capture |
| 2 | `endSession` | mutation | operator | sessionId | Stop bot, generate metrics + AI report, mark completed |
| 3 | `listSessions` | query | protected | — | Return last 50 sessions ordered by createdAt desc |
| 4 | `getSession` | query | protected | sessionId | Full session with transcript, recording URL, AI report, AGM session ID |
| 5 | `updateStatus` | mutation | operator | sessionId, status, sentimentAvg?, transcriptSegments? | Update session status + optional metrics |
| 6 | `retrySession` | mutation | operator | sessionId | Retry failed session with new bot deploy |
| 7 | `pushTranscriptSegment` | mutation | operator | sessionId, speaker, text, timestamp, timeLabel? | Push local audio transcript segment + broadcast via Ably |
| 8 | `deleteSession` | mutation | operator | sessionId | Delete single session + related data (metrics, bot, AGM, recording) |
| 9 | `deleteSessions` | mutation | operator | sessionIds[] | Bulk delete up to 100 sessions |
| 10 | `createFromCalendar` | mutation | operator | clientName, eventName, eventType, platform, meetingUrl, scheduledStart, calendarEventId?, notes? | Pre-create session from calendar (deduplicates by calendarEventId) |
| 11 | `pipeAgmGovernance` | mutation | operator | sessionId, transcriptSegments[] | Send transcript to AGM Governance AI for triage + compliance scan |
| 12 | `addNote` | mutation | operator | sessionId, text | Add operator note (stored as JSON array in notes column) |
| 13 | `deleteNote` | mutation | operator | sessionId, noteId | Remove specific note by ID |
| 14 | `getNotes` | query | operator | sessionId | Get parsed notes array |
| 15 | `getActionLog` | query | operator | sessionId?, limit? | Get operator action history |
| 16 | `qaAction` | mutation | operator | sessionId, questionId, action, questionText? | Log Q&A operator action (approve/reject/hold/legal_review/etc.) |
| 17 | `getHandoffPackage` | query | operator | sessionId | Full session package for handoff (transcript, recording, notes, actions, AI report, Q&A data, readiness score) |
| 18 | `exportSession` | query | operator | sessionId, format (csv/json/pdf) | Export full session data in specified format |

### Event Types (28 total)

```typescript
z.enum([
  "earnings_call", "interim_results", "annual_results", "results_call",
  "media_call", "analyst_call", "agm", "capital_markets_day",
  "ceo_town_hall", "board_meeting", "webcast", "investor_day",
  "roadshow", "special_call", "ipo_roadshow", "ipo_listing", "pre_ipo",
  "manda_call", "takeover_announcement", "merger_announcement",
  "scheme_of_arrangement", "credit_rating_call", "bondholder_meeting",
  "debt_restructuring", "proxy_contest", "activist_meeting",
  "extraordinary_general_meeting", "other",
])
```

### Platforms (6 total)

```typescript
z.enum(["zoom", "teams", "meet", "webex", "choruscall", "other"])
```

Recall.ai supported: zoom, teams, meet, webex
Local Audio Capture: choruscall, other

---

## 6. RECALL.AI BOT INTEGRATION

**Base URL:** `https://eu-central-1.recall.ai/api/v1` (configurable via `RECALL_AI_BASE_URL`)
**Auth:** `Token ${RECALL_AI_API_KEY}` header

### Bot Deploy Payload

```json
{
  "meeting_url": "<zoom/teams/meet/webex URL>",
  "bot_name": "CuraLive Intelligence",
  "recording_config": {
    "transcript": { "provider": { "recallai_streaming": {} } },
    "realtime_endpoints": [{
      "type": "webhook",
      "url": "<webhookBaseUrl>/api/recall/webhook",
      "events": ["transcript.data"]
    }]
  },
  "webhook_url": "<webhookBaseUrl>/api/recall/webhook",
  "metadata": { "ablyChannel": "<channel>", "shadowSessionId": "<id>" },
  "automatic_leave": {
    "waiting_room_timeout": 600,
    "noone_joined_timeout": 300,
    "everyone_left_timeout": 60
  }
}
```

### Retry Logic

- Max 2 retries (3 total attempts)
- Exponential backoff: 2s × attempt number
- On final failure: session marked `failed`

### Webhook URL Resolution Priority

1. `webhookBaseUrl` (input parameter)
2. `RECALL_WEBHOOK_BASE_URL` env var
3. `REPLIT_DEPLOYMENT_URL`
4. `REPLIT_DEV_DOMAIN`
5. `PUBLIC_URL`
6. `APP_URL`

---

## 7. LOCAL AUDIO CAPTURE

For platforms not supported by Recall.ai (choruscall, other), CuraLive uses browser-based audio capture.

**Component:** `LocalAudioCapture.tsx` (616 lines)

### How It Works

1. Operator starts session — router detects non-Recall platform
2. Session goes directly to `live` status (no `bot_joining` step)
3. Component uses `navigator.mediaDevices.getDisplayMedia()` to capture tab audio
4. MediaRecorder records audio chunks
5. Web Speech API (`SpeechRecognition`) provides real-time transcription
6. Each transcript segment is pushed to server via `trpc.shadowMode.pushTranscriptSegment`
7. Server stores in `local_transcript_json` column and broadcasts via Ably
8. On end, recording blob is uploaded as WAV file

### Audio Constraints

```typescript
{
  audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
  video: false
}
```

### Connection Quality States

```typescript
type ConnectionQuality = "excellent" | "good" | "fair" | "poor";
```

**IMPORTANT:** NEVER use `"degraded"` — only these 4 values.

---

## 8. ABLY REAL-TIME PUB/SUB

**Hook:** `useAblySessions.ts` (164 lines)

### Channel Naming

```
shadow-{sessionId}-{timestamp}
```

### Message Format

```typescript
interface AblyMessage {
  name: "curalive";
  data: string; // JSON.stringify({ type, data })
}
```

### Message Types

| Type | Payload | Source |
|------|---------|--------|
| `transcript.segment` | `{ speaker, text, timestamp, timeLabel }` | Recall webhook or pushTranscriptSegment |
| `transcript.data` | `{ segments: [...] }` | Recall realtime endpoint |

### Subscription Pattern

```typescript
const channel = ably.channels.get(channelName);
channel.subscribe("curalive", (message) => {
  const parsed = JSON.parse(message.data);
  // Handle based on parsed.type
});
```

### Fallback

If Ably subscription fails, the UI falls back to polling via `trpc.shadowMode.getSession` with `refetchInterval`.

---

## 9. SHADOW GUARDIAN SERVICE

**File:** `server/services/ShadowModeGuardianService.ts` (153 lines)

### Three Functions

#### 1. `reconcileShadowSessions()` — called on startup + from diagnostics

Scans all sessions in `live`, `bot_joining`, or `processing` status:

| Condition | Action |
|-----------|--------|
| `processing` + age > 15 minutes | Mark `failed` |
| `live`/`bot_joining` + age > 30 minutes + has transcript | Mark `completed` (auto-recovered) |
| `live`/`bot_joining` + age > 30 minutes + no transcript | Mark `failed` |

#### 2. `watchdogCheck()` — runs every 60 seconds via `startShadowWatchdog()`

| Condition | Action |
|-----------|--------|
| `bot_joining` + age > 10 minutes | Mark `failed` (bot never joined) |
| `live` + age > 6 hours | Mark `completed` (max duration exceeded) |

#### 3. `gracefulShutdown(signal)` — called on SIGTERM/SIGINT

Annotates all active sessions with shutdown timestamp for recovery on restart.

### Thresholds

| Constant | Value |
|----------|-------|
| `STALE_THRESHOLD_MS` | 30 minutes |
| `PROCESSING_TIMEOUT_MS` | 15 minutes |
| `WATCHDOG_INTERVAL_MS` | 60 seconds |
| Bot joining timeout | 10 minutes |
| Max session duration | 6 hours |

---

## 10. AI PIPELINE (POST-SESSION)

When `endSession` is called, the following pipeline runs:

### Step 1: Tagged Metrics Generation

`generateTaggedMetricsFromSession()` creates 4 tagged_metrics records:
- Sentiment metric (positive/neutral/negative)
- Engagement metric (segment count)
- Compliance metric (keyword scan)
- Intervention metric (shadow mode completion)

### Step 2: Anonymized Intelligence Record

`writeAnonymizedRecord()` — writes to aggregate intelligence database.

### Step 3: AI Report Generation (async, in background)

`autoGenerateAiReport()` calls `generateFullAiReport()` which produces:
- Executive Summary
- Sentiment Analysis (score/100 + narrative)
- Compliance Review (risk level + flagged phrases)
- Key Topics
- Risk Factors
- Action Items
- Speaker Analysis

Report is stored in `archive_events.ai_report` as JSON, keyed by `event_id = "shadow-{sessionId}"`.

### Step 4: Meta-Observer (AI Evolution)

`runMetaObserver()` — feeds report into AI self-improvement pipeline.

### Step 5: Crisis Prediction

`analyzeCrisisRisk()` — CIP4 crisis prediction engine.

### Step 6: Disclosure Certificate

`generateDisclosureCertificate()` — regulatory compliance certificate.

### Step 7: Valuation Impact

`analyzeValuationImpact()` — financial impact analysis.

### AGM Special Case

If `eventType === "agm"`, an `agm_intelligence_sessions` record is auto-created, and governance AI algorithms are activated (`pipeAgmGovernance` can be called separately for live piping).

---

## 11. TAGGED METRICS ENGINE

`generateTaggedMetricsFromSession()` produces 4 records per session:

| Tag Type | Metric Value | Severity Logic |
|----------|-------------|----------------|
| `sentiment` | sentimentAvg (0–100) | ≥70 positive, ≥50 neutral, <50 negative |
| `engagement` | transcript segment count | >20 positive, >5 neutral, ≤5 negative |
| `compliance` | flagCount / keywordCount ratio | >3 flags critical, >1 negative, ≤1 positive |
| `intervention` | 0 (no human intervention) | Always positive |

### Compliance Keywords Scanned

```
forward-looking, guidance, forecast, predict, expect, material, non-public, insider
```

### Bundle Assignment

| Event Types | Bundle |
|-------------|--------|
| earnings_call, capital_markets_day | "Investor Relations" |
| agm, board_meeting | "Compliance & Risk" |
| Everything else | "Webcasting" |

---

## 12. LIVE Q&A SYSTEM

### Architecture

- **Router:** `liveQaRouter.ts` (~650 lines) — registered as `trpc.liveQa.*`
- **Frontend:** `LiveQaDashboard.tsx` (1,224 lines) — operator-facing Q&A management
- **Public access:** Attendees join via 8-character session code (e.g., `ABCD1234`)

### Session Flow

1. Operator creates Q&A session (linked to shadow session via `shadowSessionId`)
2. 8-character alphanumeric code generated (excludes ambiguous chars: I, O, 0, 1)
3. Attendees submit questions via public endpoint (no auth required)
4. AI triage runs on each question: category, priority score, compliance risk, classification
5. Duplicate detection via Jaccard similarity (threshold: 0.55)
6. Operator reviews: approve, reject, hold, flag for legal, send to speaker, generate AI draft
7. Real-time updates via Ably channel `curalive-qa-{sessionId}`

### Question Statuses

```
pending → triaged → approved → answered
                  ↘ rejected
                  ↘ flagged (compliance risk > 70)
```

### Key Procedures

| Procedure | Auth | Purpose |
|-----------|------|---------|
| `createSession` | operator | Create Q&A session with code |
| `getSessionByCode` | public | Attendee lookup by code |
| `submitQuestion` | public | Attendee submits question (AI triaged) |
| `listQuestions` | operator | List with filters (all/unanswered/high_priority/legal_review/duplicates/sent_to_speaker) |
| `listQuestionsPublic` | public | Attendee-visible questions (triaged/approved/answered only) |
| `upvoteQuestion` | public | Rate-limited upvoting (10s cooldown per fingerprint) |
| `updateQuestionStatus` | operator | Change status |
| `generateDraft` | operator | AI-generated answer draft |
| `submitAnswer` | operator | Submit final answer |
| `sendToSpeaker` | operator | Queue question for speaker |
| `setLegalReview` | operator | Flag for legal review |
| `broadcastToTeam` | operator | Send message to IR team |
| `postIrChatMessage` | operator | Internal team chat |
| `resolveComplianceFlag` | operator | Mark compliance flag resolved |
| `getAttendeeAblyToken` | public | Get scoped Ably token for attendee (subscribe-only, 15min TTL) |

---

## 13. UI TAB SYSTEM

8 tabs in ShadowMode.tsx, stored as `activeTab` state:

| Tab ID | Label | Component / Section |
|--------|-------|---------------------|
| `live` | Live | Inline — session creation form + LiveSessionPanel + LocalAudioCapture |
| `archive` | Archive | Inline — completed session list with bulk actions |
| `reports` | Reports | Inline — AI report viewer (expandable sections) |
| `ailearning` | AI Learning | Inline — operator corrections + adaptive thresholds |
| `aidashboard` | AI Dashboard | `<AIDashboard />` |
| `advisory` | Advisory | Inline — advisory chat interface |
| `diagnostics` | Console | `<SystemDiagnostics />` |
| `liveqa` | Live Q&A | `<LiveQaDashboard />` |

### Valid Tabs Array

```typescript
const validTabs = ["live", "archive", "reports", "ailearning", "aidashboard", "advisory", "diagnostics", "liveqa"] as const;
```

---

## 14. COMPONENT INVENTORY

### LiveSessionPanel.tsx (552 lines)

Real-time transcript viewer during live sessions. Shows:
- Connection status indicator
- Transcript segments with speaker labels and timestamps
- Auto-scroll with manual override
- Segment count and duration
- Copy transcript button

### LocalAudioCapture.tsx (616 lines)

Browser-based audio capture for non-Recall platforms:
- `getDisplayMedia()` for tab audio capture
- `MediaRecorder` for audio recording
- `SpeechRecognition` for real-time transcription
- Connection quality indicator (excellent/good/fair/poor)
- Audio level meter
- Recording upload on session end

### AIDashboard.tsx (1,189 lines)

CIP4 intelligence analytics:
- Crisis predictions list
- Valuation impact analyses
- Disclosure certificates
- Evolution audit trail
- Monthly reports
- Cross-event metrics
- Tabbed sub-navigation

### LiveQaDashboard.tsx (1,224 lines)

Operator Q&A management:
- Session creation/management
- Question list with filters and sorting
- Triage classifications (high_priority, standard, informational, duplicate)
- Compliance flags panel
- AI draft generation
- Send-to-speaker queue
- Legal review workflow
- Duplicate detection display
- Team broadcast
- IR chat
- Attendee view link with QR code

### SystemDiagnostics.tsx (152 lines)

One-click health check:
- 15 diagnostic tests
- Status: HEALTHY / DEGRADED / CRITICAL
- Tests: DB, all CIP4 tables, Guardian, Recall.ai key, OpenAI, router registry, AI pipeline

### WebPhoneCallManager.tsx (285 lines)

WebRTC phone management:
- Participant list
- Call controls (mute, hold, transfer)
- Connection state display

### WebPhoneJoinInstructions.tsx (217 lines)

Phone dial-in instructions:
- Step-by-step join guide
- Phone number display
- PIN/access code

### ProviderStateIndicator.tsx (160 lines)

Provider connection status:
- Recall.ai connection state
- Ably connection state
- Visual indicators (connected/connecting/disconnected/error)

---

## 15. KEYBOARD SHORTCUTS

**Hook:** `useKeyboardShortcuts.ts` (94 lines)

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | End session |
| `Ctrl+S` | Save/export |
| `Ctrl+R` | Refresh session data |
| `Escape` | Close modal/panel |

Registered via `useEffect` on `keydown` event. Checks `activeElement` to avoid firing in inputs/textareas.

---

## 16. SESSION AUTO-SAVE

**Service:** `sessionAutoSave.ts` (104 lines)

### Purpose

Saves session creation form state to `localStorage` so operators don't lose their work on page reload.

### Storage Key

```
curalive_shadow_session_draft
```

### Saved Fields

```typescript
interface SessionRecoveryData {
  clientName: string;
  eventName: string;
  eventType: string;
  platform: string;
  meetingUrl: string;
  notes: string;
  savedAt: number;
}
```

### Expiry

Draft expires after 24 hours (`86400000` ms). Expired drafts are auto-cleaned.

### API

```typescript
saveSessionDraft(data: SessionRecoveryData): void
loadSessionDraft(): SessionRecoveryData | null
clearSessionDraft(): void
hasSessionDraft(): boolean
```

---

## 17. SYSTEM DIAGNOSTICS CONSOLE

**Frontend:** `SystemDiagnostics.tsx` — **Backend:** `systemDiagnosticsRouter.ts`

### 15 Diagnostic Tests

| # | Test | What It Checks |
|---|------|----------------|
| 1 | Database Connection | `SELECT 1` — Postgres alive |
| 2 | Shadow Sessions Table | Count total/completed/live/failed |
| 3 | Archive Events Table | Count total + with AI reports |
| 4 | Crisis Prediction Table | Count predictions |
| 5 | Valuation Impact Table | Count analyses |
| 6 | Disclosure Certificates | Count certificates |
| 7 | Evolution Audit Trail | Count audit entries |
| 8 | Advisory Bot Messages | Count messages |
| 9 | Monthly Reports Table | Count reports |
| 10 | Tagged Metrics | Count intelligence records |
| 11 | Shadow Guardian | Run reconciliation, report in-flight/recovered/failed/active |
| 12 | Recall.ai API Key | Check env var exists |
| 13 | OpenAI Integration | Send test prompt, validate "SYSTEM_OK" response |
| 14 | tRPC Router Registry | Verify all 6 CIP4 routers registered |
| 15 | AI Report Pipeline | Verify `generateFullAiReport` function accessible |

### Response

```typescript
{
  timestamp: string;
  summary: {
    total: 15,
    passed: number,
    failed: number,
    warned: number,
    overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL",
    totalDurationMs: number,
  };
  results: Array<{ name: string; status: "pass" | "fail" | "warn"; detail: string; durationMs: number }>;
}
```

Status logic: `failed === 0` → HEALTHY, `failed <= 2` → DEGRADED, `failed > 2` → CRITICAL

---

## 18. RECALL.AI WEBHOOK HANDLER (AI-AM)

**File:** `server/webhooks/aiAmRecall.ts` (286 lines)
**Endpoint:** `POST /api/webhooks/recall/ai-am`

### Event Types Handled

| Event | Handler |
|-------|---------|
| `transcript_segment` | Detect compliance violations, create alerts, publish to Ably |
| `transcript_complete` | Generate violation summary, publish to Ably |
| `bot_status_update` | Log status changes, publish errors to Ably |

### Webhook Signature Verification

- Header: `x-recall-signature` or `x-webhook-signature`
- HMAC SHA-256 with `MUX_WEBHOOK_SECRET`
- Timing-safe comparison
- In dev mode: allows unsigned requests

### Important

`registerRecallWebhookRoute(app)` MUST be registered BEFORE `express.json()` middleware.

---

## 19. DESIGN SYSTEM & TOKENS

### Theme

Dark theme with slate/violet/emerald palette.

### Core Tokens

| Element | Tailwind Classes |
|---------|-----------------|
| Page background | `bg-[#0a0a0f]` or `bg-slate-950` |
| Card | `bg-white/[0.02] border border-white/10 rounded-2xl` |
| Card hover | `hover:bg-white/[0.04]` |
| Selected card | `border-violet-500/50 bg-violet-500/10` |
| Primary text | `text-slate-200` |
| Secondary text | `text-slate-500` |
| Muted text | `text-slate-600` |
| Primary accent | Violet (`bg-violet-500/20 text-violet-300`) |
| Success | Emerald (`text-emerald-400 bg-emerald-500/10`) |
| Warning | Amber (`text-amber-400 bg-amber-500/10`) |
| Error | Red (`text-red-400 bg-red-500/10`) |
| Info | Indigo (`text-indigo-400 bg-indigo-500/10`) |
| Active | Blue (`text-blue-400 bg-blue-500/10`) |

### Status Colors

| Status | Dot | Badge |
|--------|-----|-------|
| pending | `bg-slate-400` | `text-slate-400 bg-slate-400/10 border-slate-400/20` |
| bot_joining | `bg-amber-400 animate-pulse` | `text-amber-400 bg-amber-400/10 border-amber-400/20` |
| live | `bg-emerald-400 animate-pulse` | `text-emerald-400 bg-emerald-400/10 border-emerald-400/20` |
| processing | `bg-blue-400 animate-pulse` | `text-blue-400 bg-blue-400/10 border-blue-400/20` |
| completed | `bg-violet-400` | `text-violet-400 bg-violet-400/10 border-violet-400/20` |
| failed | `bg-red-400` | `text-red-400 bg-red-400/10 border-red-400/20` |

### Button Patterns

```
Primary: bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/20
Danger:  bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20
Success: bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20
Neutral: bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10
```

### Typography

- Headings: `text-lg font-semibold text-slate-200`
- Subheadings: `text-sm font-medium text-slate-300`
- Body: `text-sm text-slate-400`
- Labels: `text-xs text-slate-500`
- Mono: `font-mono text-xs`

### Icons

All from `lucide-react`. Key mappings:
- Live: `Radio` (emerald, animate-pulse when live)
- Pending: `Clock` (slate)
- Processing: `Loader2` (blue, animate-spin)
- Completed: `CheckCircle2` (violet)
- Failed: `AlertTriangle` (red)
- Bot Joining: `Loader2` (amber, animate-spin)

---

## 20. AUTH & PROCEDURES

### Procedure Types

| Procedure | Who Can Call | Dev Mode |
|-----------|-------------|----------|
| `publicProcedure` | Anyone (no auth) | Same |
| `protectedProcedure` | Authenticated users | Auto-auth |
| `operatorProcedure` | Operators only | Auto-auth as "Dev Operator" |
| `adminProcedure` | Admins only | Auto-auth |

### DEV_BYPASS

In development mode, `operatorProcedure` auto-authenticates as `Dev Operator` — no login required. This means all Shadow Mode procedures work immediately in dev.

### Router Registration

The `shadowModeRouter` is registered in BOTH:
- `server/routers.eager.ts` — import + `shadowMode: shadowModeRouter`
- `server/routers.ts` — import + `shadowMode: shadowModeRouter`

Both files must have the registration or the router won't load.

---

## 21. ENVIRONMENT VARIABLES & SECRETS

| Variable | Required | Purpose |
|----------|----------|---------|
| `RECALL_AI_API_KEY` | Yes (for Recall platforms) | Recall.ai API authentication |
| `RECALL_AI_BASE_URL` | No (default: eu-central-1) | Recall.ai API base URL |
| `RECALL_WEBHOOK_BASE_URL` | No | Override webhook URL for Recall |
| `ABLY_API_KEY` | Yes | Ably pub/sub authentication |
| `MUX_WEBHOOK_SECRET` | No | Recall webhook signature verification |
| `RECALL_AI_WEBHOOK_SECRET` | No | Alternative webhook secret |
| `JWT_SECRET` | Yes | JWT token signing |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

---

## 22. CRITICAL GOTCHAS FOR PORTING

1. **Router name:** `shadowMode` not `shadow` — client uses `trpc.shadowMode.*`
2. **Dual registration:** Router must be in BOTH `routers.eager.ts` AND `routers.ts`
3. **connectionQuality enum:** ONLY `"excellent" | "good" | "fair" | "poor"` — NEVER `"degraded"`
4. **SQL placeholders:** `rawSql()` uses `?`; direct `db.execute()` uses `$1`
5. **DEV_BYPASS:** `operatorProcedure` auto-authenticates in dev mode
6. **Recall webhook:** Must be registered BEFORE `express.json()` middleware
7. **Handoff operator selector:** NOT implemented — `handoffTargetId` never populated, always alerts
8. **Session lifecycle:** `pending → bot_joining → live → processing → completed/failed`
9. **Local Audio path:** choruscall/other → no `bot_joining` step, goes straight to `live`
10. **Ably channel format:** `shadow-{sessionId}-{timestamp}` — timestamp ensures uniqueness on retry
11. **Notes storage:** JSON array in text column, not separate table
12. **AI report storage:** In `archive_events.ai_report` column, keyed by `event_id = "shadow-{sessionId}"`
13. **AGM auto-creation:** When `eventType === "agm"`, an `agm_intelligence_sessions` record is auto-created
14. **Transcript source priority:** Recall bot transcript > local transcript (checked in that order)
15. **Background AI report:** `autoGenerateAiReport()` runs `.catch()` — fire-and-forget, does not block `endSession` response
16. **Q&A session code:** 8 chars, excludes I/O/0/1 to avoid ambiguity
17. **Duplicate detection:** Jaccard similarity ≥ 0.55 = duplicate
18. **Upvote rate limit:** 10s cooldown per fingerprint per question (in-memory, resets on restart)

---

## 23. FULL SOURCE CODE

All source files follow below, each in a fenced code block with full file path.


---

### shadowModeRouter.ts (1385 lines)
File: `server/routers/shadowModeRouter.ts`

```typescript
// @ts-nocheck
import { z } from "zod";
import { router, operatorProcedure, protectedProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { shadowSessions, taggedMetrics, recallBots, agmIntelligenceSessions, operatorActions } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";
import { generateFullAiReport } from "./archiveUploadRouter";
import type { AiReport } from "./archiveUploadRouter";

async function logOperatorAction(opts: {
  sessionId?: number | null;
  archiveId?: number | null;
  actionType: string;
  detail?: string | null;
  operatorName?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const db = await getDb();
    await db.insert(operatorActions).values({
      sessionId: opts.sessionId ?? null,
      archiveId: opts.archiveId ?? null,
      actionType: opts.actionType,
      detail: opts.detail ?? null,
      operatorName: opts.operatorName ?? "Operator",
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    });
  } catch (err) {
    console.warn("[OperatorAction] Failed to log action:", opts.actionType, err);
  }
}

async function autoGenerateAiReport(
  sessionId: number,
  clientName: string,
  eventName: string,
  eventType: string,
  transcript: Array<{ speaker: string; text: string; timestamp: number }>,
  sentimentAvg: number | null,
  complianceFlags: number
) {
  try {
    const fullText = transcript.map(s => `[${s.speaker}]: ${s.text}`).join("\n");
    if (fullText.length < 50) {
      console.log(`[Shadow] Skipping AI report for session ${sessionId} — transcript too short (${fullText.length} chars)`);
      return;
    }

    console.log(`[Shadow] Auto-generating AI report for session ${sessionId} (${fullText.length} chars)...`);

    const aiReport = await generateFullAiReport(
      fullText,
      clientName,
      eventName,
      eventType,
      sentimentAvg ?? 50,
      complianceFlags
    );

    const db = await getDb();
    const eventId = `shadow-${sessionId}`;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    await rawSql(
      `INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text, word_count, segment_count, sentiment_avg, compliance_flags, status, ai_report, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', $10, 'Auto-generated from Shadow Mode session')
       ON CONFLICT (event_id) DO UPDATE SET ai_report = EXCLUDED.ai_report, status = 'completed'`,
      [eventId, clientName, eventName, eventType, fullText, wordCount, transcript.length, sentimentAvg ?? 50, complianceFlags, JSON.stringify(aiReport)]
    );

    try {
      const { runMetaObserver, runAccumulationEngine } = await import("../services/AiEvolutionService");
      await runMetaObserver(aiReport, "live_session", sessionId, eventType, clientName, fullText.length);
      runAccumulationEngine().catch(err => console.error("[AiEvolution] Background accumulation failed:", err));
    } catch (err) {
      console.error("[AiEvolution] Meta-observer hook failed:", err);
    }

    try {
      const { analyzeCrisisRisk } = await import("./crisisPredictionRouter");
      const sentimentTrajectory = transcript.map((_, i) => (sentimentAvg ?? 50) + (Math.random() * 10 - 5) * (i / Math.max(transcript.length, 1)));
      await analyzeCrisisRisk(fullText, clientName, eventName, eventType, sentimentTrajectory, sessionId);
      console.log(`[Shadow] Crisis prediction completed for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Crisis prediction failed:", err);
    }

    try {
      const { generateDisclosureCertificate } = await import("./disclosureCertificateRouter");
      await generateDisclosureCertificate({
        eventId: `shadow-${sessionId}`,
        sessionId,
        clientName,
        eventName,
        eventType,
        transcriptText: fullText,
        aiReportJson: JSON.stringify(aiReport),
        complianceFlags,
        jurisdictions: ["JSE"],
      });
      console.log(`[Shadow] Disclosure certificate generated for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Disclosure certificate failed:", err);
    }

    try {
      const { analyzeValuationImpact } = await import("./valuationImpactRouter");
      await analyzeValuationImpact(fullText, clientName, eventName, eventType, sentimentAvg ?? 50, `shadow-${sessionId}`);
      console.log(`[Shadow] Valuation impact analysis completed for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Valuation impact analysis failed:", err);
    }

    console.log(`[Shadow] AI report generated for session ${sessionId} — ${aiReport.modulesGenerated} modules`);
  } catch (err) {
    console.error(`[Shadow] Auto AI report generation failed for session ${sessionId}:`, err);
  }
}

const RECALL_BASE_URL = process.env.RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1";
const RECALL_API_KEY = process.env.RECALL_AI_API_KEY ?? "";

function normalizeBaseUrl(url: string): string {
  // Remove trailing slashes and whitespace
  return url.trim().replace(/\/+$/, "");
}

function getWebhookBaseUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.trim()) {
    return normalizeBaseUrl(overrideUrl);
  }
  if (process.env.RECALL_WEBHOOK_BASE_URL) return normalizeBaseUrl(process.env.RECALL_WEBHOOK_BASE_URL);
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.PUBLIC_URL) return normalizeBaseUrl(process.env.PUBLIC_URL);
  if (process.env.APP_URL) return normalizeBaseUrl(process.env.APP_URL);

  throw new Error(
    "Cannot determine webhook URL. Set RECALL_WEBHOOK_BASE_URL or APP_URL, or ensure REPLIT_DEV_DOMAIN / REPLIT_DEPLOYMENT_URL is available."
  );
}

async function recallFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${RECALL_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Token ${RECALL_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Recall.ai ${res.status}: ${body}`);
  }
  return res.json();
}

async function generateTaggedMetricsFromSession(
  sessionId: number,
  eventId: string,
  eventTitle: string,
  bundle: string,
  transcript: Array<{ speaker: string; text: string; timestamp: number }>,
  sentimentAvg: number | null
) {
  const db = await getDb();
  const metricsToInsert = [];

  if (sentimentAvg != null) {
    metricsToInsert.push({
      eventId, eventTitle,
      tagType: "sentiment" as const,
      metricValue: sentimentAvg,
      label: sentimentAvg >= 70 ? "Positive Sentiment Session" : sentimentAvg >= 50 ? "Neutral Sentiment Session" : "Low Sentiment Session",
      detail: `Average sentiment across ${transcript.length} transcript segments captured during live session.`,
      bundle,
      severity: sentimentAvg >= 70 ? "positive" as const : sentimentAvg >= 50 ? "neutral" as const : "negative" as const,
      source: "shadow-mode",
    });
  }

  metricsToInsert.push({
    eventId, eventTitle,
    tagType: "engagement" as const,
    metricValue: transcript.length,
    label: `${transcript.length} Transcript Segments Captured`,
    detail: `Shadow Mode bot captured ${transcript.length} real-time transcript segments. Active speaker participation recorded.`,
    bundle,
    severity: transcript.length > 20 ? "positive" as const : transcript.length > 5 ? "neutral" as const : "negative" as const,
    source: "shadow-mode",
  });

  if (transcript.length > 0) {
    const fullText = transcript.map(s => s.text).join(" ");
    const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
    const flagCount = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

    metricsToInsert.push({
      eventId, eventTitle,
      tagType: "compliance" as const,
      metricValue: parseFloat((flagCount / complianceKeywords.length).toFixed(2)),
      label: flagCount > 2 ? "Compliance Flags Detected" : "Low Compliance Risk",
      detail: `Automated scan found ${flagCount} compliance keyword(s) across transcript. Keywords checked: ${complianceKeywords.join(", ")}.`,
      bundle,
      severity: flagCount > 3 ? "critical" as const : flagCount > 1 ? "negative" as const : "positive" as const,
      source: "shadow-mode",
    });
  }

  metricsToInsert.push({
    eventId, eventTitle,
    tagType: "intervention" as const,
    metricValue: 0,
    label: "Shadow Mode Session Completed",
    detail: `CuraLive ran silently in the background. No human intervention required. Intelligence dataset updated with ${metricsToInsert.length + 1} tagged records.`,
    bundle,
    severity: "positive" as const,
    source: "shadow-mode",
  });

  if (metricsToInsert.length > 0) {
    await db.insert(taggedMetrics).values(metricsToInsert);
  }

  await db.update(shadowSessions)
    .set({ taggedMetricsGenerated: metricsToInsert.length })
    .where(eq(shadowSessions.id, sessionId));

  return metricsToInsert.length;
}

export const shadowModeRouter = router({

  startSession: operatorProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventName: z.string().min(1),
      eventType: z.enum([
        "earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call",
        "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast",
        "investor_day", "roadshow", "special_call",
        "ipo_roadshow", "ipo_listing", "pre_ipo",
        "manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement",
        "credit_rating_call", "bondholder_meeting", "debt_restructuring",
        "proxy_contest", "activist_meeting", "extraordinary_general_meeting",
        "other",
      ]),
      platform: z.enum(["zoom", "teams", "meet", "webex", "choruscall", "other"]).default("zoom"),
      meetingUrl: z.string().url(),
      webhookBaseUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user?.id ?? null;

      const RECALL_SUPPORTED = new Set(["zoom", "teams", "meet", "webex"]);
      const isRecallSupported = RECALL_SUPPORTED.has(input.platform);

      const [inserted] = await db.insert(shadowSessions).values({
        clientName: input.clientName,
        eventName: input.eventName,
        eventType: input.eventType,
        platform: input.platform,
        meetingUrl: input.meetingUrl,
        status: "pending",
        notes: input.notes ?? null,
      }).returning();

      const sessionId = inserted.id;
      const ablyChannel = `shadow-${sessionId}-${Date.now()}`;

      let agmSessionId: number | null = null;
      if (input.eventType === "agm" && userId != null) {
        try {
          const [agmInserted] = await db.insert(agmIntelligenceSessions).values({
            userId,
            shadowSessionId: sessionId,
            clientName: input.clientName,
            agmTitle: input.eventName,
            jurisdiction: "south_africa",
            status: "live",
          }).returning();
          agmSessionId = agmInserted.id;
          console.log(`[Shadow] AGM Intelligence session ${agmSessionId} auto-created for shadow session ${sessionId}`);
        } catch (err) {
          console.error("[Shadow] Failed to auto-create AGM session:", err);
        }
      }

      if (!isRecallSupported) {
        const platformName = input.platform === "choruscall" ? "Chorus Call" : input.platform;
        console.log(`[Shadow] Session ${sessionId}: ${platformName} detected — starting Local Audio Capture mode (no Recall.ai bot)`);

        await db.update(shadowSessions)
          .set({
            ablyChannel,
            status: "live",
            startedAt: Date.now(),
          })
          .where(eq(shadowSessions.id, sessionId));

        await logOperatorAction({ sessionId, actionType: "session_started", detail: `${input.clientName} — ${input.eventName} (Local Audio Capture)`, metadata: { platform: input.platform, eventType: input.eventType } });

        return {
          sessionId,
          botId: null,
          ablyChannel,
          status: "live" as const,
          agmSessionId,
          manualCapture: true,
          message: `Session started — click "Start Local Audio Capture" and share the tab with the call. CuraLive will transcribe and record in real-time.`,
        };
      }

      if (!RECALL_API_KEY) {
        await db.update(shadowSessions)
          .set({ status: "failed" })
          .where(eq(shadowSessions.id, sessionId));
        throw new Error("RECALL_AI_API_KEY is not configured. Please add it to environment secrets.");
      }

      const resolvedBase = getWebhookBaseUrl(input.webhookBaseUrl);
      const webhookUrl = `${resolvedBase}/api/recall/webhook`;

      console.log(`[Shadow] Session ${sessionId}: webhook URL → ${webhookUrl}`);

      const MAX_RETRIES = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[Shadow] Auto-retry attempt ${attempt}/${MAX_RETRIES} for session ${sessionId}...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }

          const bot = await recallFetch("/bot/", {
            method: "POST",
            body: JSON.stringify({
              meeting_url: input.meetingUrl,
              bot_name: "CuraLive Intelligence",
              recording_config: {
                transcript: { provider: { recallai_streaming: {} } },
                realtime_endpoints: [{
                  type: "webhook",
                  url: webhookUrl,
                  events: ["transcript.data"],
                }],
              },
              webhook_url: webhookUrl,
              metadata: { ablyChannel, shadowSessionId: String(sessionId) },
              automatic_leave: {
                waiting_room_timeout: 600,
                noone_joined_timeout: 300,
                everyone_left_timeout: 60,
              },
            }),
          });

          await db.update(shadowSessions)
            .set({
              recallBotId: bot.id,
              ablyChannel,
              status: "bot_joining",
              startedAt: Date.now(),
            })
            .where(eq(shadowSessions.id, sessionId));

          await db.insert(recallBots).values({
            recallBotId: bot.id,
            meetingUrl: input.meetingUrl,
            botName: "CuraLive Intelligence",
            eventId: null,
            meetingId: null,
            status: bot.status_code ?? "created",
            ablyChannel,
            transcriptJson: JSON.stringify([]),
          });

          await logOperatorAction({ sessionId, actionType: "session_started", detail: `${input.clientName} — ${input.eventName} (Recall.ai bot)`, metadata: { platform: input.platform, eventType: input.eventType, botId: bot.id } });

          return {
            sessionId,
            botId: bot.id,
            ablyChannel,
            status: "bot_joining",
            agmSessionId,
            manualCapture: false,
            retriesUsed: attempt,
            message: input.eventType === "agm"
              ? "CuraLive Intelligence bot is joining the AGM. Governance AI algorithms activated automatically."
              : attempt > 0
                ? `CuraLive Intelligence bot is joining the meeting (succeeded on retry ${attempt}).`
                : "CuraLive Intelligence bot is joining the meeting. It will appear as a participant within 30–60 seconds.",
          };

        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`[Shadow] Bot deploy attempt ${attempt + 1} failed for session ${sessionId}:`, lastError.message);
        }
      }

      await db.update(shadowSessions)
        .set({ status: "failed" })
        .where(eq(shadowSessions.id, sessionId));
      throw new Error(`Failed to deploy bot after ${MAX_RETRIES + 1} attempts: ${lastError?.message ?? "Unknown error"}`);
    }),

  endSession: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");

      if (session.recallBotId) {
        try {
          await recallFetch(`/bot/${session.recallBotId}/leave_call/`, { method: "POST" });
        } catch { /* bot may have already left */ }

        const [botRecord] = await db
          .select()
          .from(recallBots)
          .where(eq(recallBots.recallBotId, session.recallBotId))
          .limit(1);

        const transcript: Array<{ speaker: string; text: string; timestamp: number }> =
          botRecord?.transcriptJson ? JSON.parse(botRecord.transcriptJson) : [];

        const sentimentAvg = session.sentimentAvg;
        const bundle = session.eventType === "earnings_call" || session.eventType === "capital_markets_day"
          ? "Investor Relations" : session.eventType === "agm" || session.eventType === "board_meeting"
          ? "Compliance & Risk" : "Webcasting";

        const eventId = `shadow-${session.id}`;
        const eventTitle = `${session.clientName} — ${session.eventName}`;

        await db.update(shadowSessions)
          .set({ status: "processing", endedAt: Date.now() })
          .where(eq(shadowSessions.id, input.sessionId));

        const metricsCount = await generateTaggedMetricsFromSession(
          input.sessionId,
          eventId,
          eventTitle,
          bundle,
          transcript,
          sentimentAvg
        );

        await db.update(shadowSessions)
          .set({
            status: "completed",
            transcriptSegments: transcript.length,
            taggedMetricsGenerated: metricsCount,
          })
          .where(eq(shadowSessions.id, input.sessionId));

        const fullText = transcript.map(s => s.text).join(" ");
        const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
        const liveComplianceFlags = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

        await writeAnonymizedRecord({
          eventType: session.eventType ?? "other",
          sentimentScore: session.sentimentAvg ?? null,
          segmentCount: transcript.length,
          complianceFlags: liveComplianceFlags,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
          eventDate: null,
          sourceType: "live_session",
        });

        autoGenerateAiReport(
          input.sessionId,
          session.clientName,
          session.eventName,
          session.eventType ?? "other",
          transcript,
          sentimentAvg ?? null,
          liveComplianceFlags
        ).catch(err => console.error("[Shadow] Background AI report failed:", err));

        await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: `${transcript.length} transcript segments, ${metricsCount} metrics generated`, metadata: { transcriptSegments: transcript.length, metricsCount } });

        return {
          success: true,
          transcriptSegments: transcript.length,
          taggedMetricsGenerated: metricsCount,
          message: `Session complete. ${metricsCount} intelligence records added. AI report generating in background.`,
        };
      }

      const localTranscript: Array<{ speaker: string; text: string; timestamp: number }> =
        session.localTranscriptJson ? JSON.parse(session.localTranscriptJson as string) : [];

      if (localTranscript.length > 0) {
        const sentimentAvg = session.sentimentAvg;
        const bundle = session.eventType === "earnings_call" || session.eventType === "capital_markets_day"
          ? "Investor Relations" : session.eventType === "agm" || session.eventType === "board_meeting"
          ? "Compliance & Risk" : "Webcasting";

        const eventId = `shadow-${session.id}`;
        const eventTitle = `${session.clientName} — ${session.eventName}`;

        await db.update(shadowSessions)
          .set({ status: "processing", endedAt: Date.now() })
          .where(eq(shadowSessions.id, input.sessionId));

        const metricsCount = await generateTaggedMetricsFromSession(
          input.sessionId,
          eventId,
          eventTitle,
          bundle,
          localTranscript,
          sentimentAvg
        );

        await db.update(shadowSessions)
          .set({
            status: "completed",
            transcriptSegments: localTranscript.length,
            taggedMetricsGenerated: metricsCount,
          })
          .where(eq(shadowSessions.id, input.sessionId));

        const fullText = localTranscript.map(s => s.text).join(" ");
        const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
        const liveComplianceFlags = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

        await writeAnonymizedRecord({
          eventType: session.eventType ?? "other",
          sentimentScore: session.sentimentAvg ?? null,
          segmentCount: localTranscript.length,
          complianceFlags: liveComplianceFlags,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
          eventDate: null,
          sourceType: "live_session",
        });

        autoGenerateAiReport(
          input.sessionId,
          session.clientName,
          session.eventName,
          session.eventType ?? "other",
          localTranscript,
          sentimentAvg ?? null,
          liveComplianceFlags
        ).catch(err => console.error("[Shadow] Background AI report failed:", err));

        await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: `${localTranscript.length} local transcript segments, ${metricsCount} metrics generated`, metadata: { transcriptSegments: localTranscript.length, metricsCount } });

        return {
          success: true,
          transcriptSegments: localTranscript.length,
          taggedMetricsGenerated: metricsCount,
          message: `Session complete. ${metricsCount} intelligence records added. AI report generating in background.`,
        };
      }

      await db.update(shadowSessions)
        .set({ status: "completed", endedAt: Date.now() })
        .where(eq(shadowSessions.id, input.sessionId));

      await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: "Session closed (no transcript captured)" });

      return { success: true, transcriptSegments: 0, taggedMetricsGenerated: 0, message: "Session closed." };
    }),

  listSessions: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      return db.select().from(shadowSessions).orderBy(desc(shadowSessions.createdAt)).limit(50);
    } catch { return []; }
  }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");

      let transcriptSegments: Array<{ speaker: string; text: string; timestamp: number; timeLabel?: string }> = [];
      let recordingUrl: string | null = null;
      let botStatus: string | null = null;

      if (session.recallBotId) {
        const [bot] = await db
          .select()
          .from(recallBots)
          .where(eq(recallBots.recallBotId, session.recallBotId))
          .limit(1);
        if (bot?.transcriptJson) {
          transcriptSegments = JSON.parse(bot.transcriptJson);
        }
        if (bot?.recordingUrl) {
          recordingUrl = bot.recordingUrl;
        }
        if (bot?.status) {
          botStatus = bot.status;
        }
      }

      if (session.localTranscriptJson && transcriptSegments.length === 0) {
        try {
          transcriptSegments = JSON.parse(session.localTranscriptJson as string);
        } catch {}
      }

      let agmSessionId: number | null = null;
      if (session.eventType === "agm") {
        const [agmSession] = await db.select({ id: agmIntelligenceSessions.id })
          .from(agmIntelligenceSessions)
          .where(eq(agmIntelligenceSessions.shadowSessionId, session.id))
          .limit(1);
        if (agmSession) agmSessionId = agmSession.id;
      }

      const localRecordingUrl = session.localRecordingPath
        ? `/api/shadow/recording/${session.id}`
        : null;

      let aiReport: AiReport | null = null;
      try {
        const eventId = `shadow-${session.id}`;
    const [rows] = await rawSql(
          `SELECT ai_report FROM archive_events WHERE event_id = $1 LIMIT 1`,
          [eventId]
        );
        if (rows?.[0]?.ai_report) {
          aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
        }
      } catch {}

      return { ...session, transcriptSegments, agmSessionId, recordingUrl: recordingUrl || localRecordingUrl, botStatus, aiReport };
    }),

  updateStatus: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      status: z.enum(["pending", "bot_joining", "live", "processing", "completed", "failed"]),
      sentimentAvg: z.number().optional(),
      transcriptSegments: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: Record<string, unknown> = { status: input.status };
      if (input.sentimentAvg != null) updates.sentimentAvg = input.sentimentAvg;
      if (input.transcriptSegments != null) updates.transcriptSegments = input.transcriptSegments;
      await db.update(shadowSessions).set(updates).where(eq(shadowSessions.id, input.sessionId));
      return { success: true };
    }),

  retrySession: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status !== "failed") throw new Error("Only failed sessions can be retried");
      if (!session.meetingUrl) throw new Error("Session has no meeting URL to retry");

      if (!RECALL_API_KEY) {
        throw new Error("RECALL_AI_API_KEY is not configured. Please add it to environment secrets.");
      }

      const resolvedBase = getWebhookBaseUrl();
      const ablyChannel = `shadow-${session.id}-${Date.now()}`;
      const webhookUrl = `${resolvedBase}/api/recall/webhook`;

      console.log(`[Shadow] Retry session ${session.id}: webhook URL → ${webhookUrl}`);

      try {
        const bot = await recallFetch("/bot/", {
          method: "POST",
          body: JSON.stringify({
            meeting_url: session.meetingUrl,
            bot_name: "CuraLive Intelligence",
            recording_config: {
              transcript: { provider: { recallai_streaming: {} } },
              realtime_endpoints: [{
                type: "webhook",
                url: webhookUrl,
                events: ["transcript.data"],
              }],
            },
            webhook_url: webhookUrl,
            metadata: { ablyChannel, shadowSessionId: String(session.id) },
            automatic_leave: {
              waiting_room_timeout: 600,
              noone_joined_timeout: 300,
              everyone_left_timeout: 60,
            },
          }),
        });

        await db.update(shadowSessions)
          .set({
            recallBotId: bot.id,
            ablyChannel,
            status: "bot_joining",
            startedAt: Date.now(),
          })
          .where(eq(shadowSessions.id, session.id));

        await db.insert(recallBots).values({
          recallBotId: bot.id,
          meetingUrl: session.meetingUrl,
          botName: "CuraLive Intelligence",
          eventId: null,
          meetingId: null,
          status: bot.status_code ?? "created",
          ablyChannel,
          transcriptJson: JSON.stringify([]),
        });

        return {
          sessionId: session.id,
          botId: bot.id,
          ablyChannel,
          status: "bot_joining",
          message: "Retrying — CuraLive Intelligence bot is joining the meeting.",
        };

      } catch (err) {
        throw new Error(`Retry failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  pushTranscriptSegment: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      speaker: z.string().default("Speaker"),
      text: z.string().min(1),
      timestamp: z.number(),
      timeLabel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status !== "live" && session.status !== "bot_joining") {
        throw new Error("Session is not active");
      }

      const segment = {
        speaker: input.speaker,
        text: input.text,
        timestamp: input.timestamp,
        timeLabel: input.timeLabel ?? new Date(input.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };

      const existingTranscript: Array<{ speaker: string; text: string; timestamp: number; timeLabel?: string }> =
        session.localTranscriptJson ? JSON.parse(session.localTranscriptJson as string) : [];
      existingTranscript.push(segment);

      await db.update(shadowSessions)
        .set({
          transcriptSegments: existingTranscript.length,
          localTranscriptJson: JSON.stringify(existingTranscript),
        })
        .where(eq(shadowSessions.id, input.sessionId));

      if (session.ablyChannel) {
        const ABLY_API_KEY = process.env.ABLY_API_KEY ?? "";
        if (ABLY_API_KEY) {
          const url = `https://rest.ably.io/channels/${encodeURIComponent(session.ablyChannel)}/messages`;
          const body = JSON.stringify({
            name: "curalive",
            data: JSON.stringify({ type: "transcript.segment", data: segment }),
          });
          try {
            await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(ABLY_API_KEY).toString("base64")}`,
                "Content-Type": "application/json",
              },
              body,
            });
          } catch (err) {
            console.warn("[Shadow] Ably publish for local segment failed:", err);
          }
        }
      }

      return { success: true, segmentCount: existingTranscript.length };
    }),

  deleteSession: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status === "live" || session.status === "bot_joining") {
        throw new Error("Cannot delete an active session. End it first.");
      }

      const eventId = `shadow-${session.id}`;
      await db.delete(taggedMetrics).where(eq(taggedMetrics.eventId, eventId));

      if (session.recallBotId) {
        try {
          await db.delete(recallBots).where(eq(recallBots.recallBotId, session.recallBotId));
        } catch {}
      }

      if (session.eventType === "agm") {
        try {
          await db.delete(agmIntelligenceSessions).where(eq(agmIntelligenceSessions.shadowSessionId, session.id));
        } catch {}
      }

      if (session.localRecordingPath) {
        try {
          const { unlinkSync } = await import("fs");
          const { join } = await import("path");
          unlinkSync(join(process.cwd(), session.localRecordingPath));
        } catch {}
      }

      await db.delete(shadowSessions).where(eq(shadowSessions.id, input.sessionId));

      console.log(`[Shadow] Session ${input.sessionId} deleted`);
      return { success: true, message: "Session deleted" };
    }),

  deleteSessions: operatorProcedure
    .input(z.object({ sessionIds: z.array(z.number()).min(1).max(100) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const sessions = await db
        .select()
        .from(shadowSessions)
        .where(inArray(shadowSessions.id, input.sessionIds));

      const deletable = sessions.filter(
        (s) => s.status !== "live" && s.status !== "bot_joining"
      );
      if (deletable.length === 0) {
        throw new Error("No deletable sessions found (active sessions cannot be deleted).");
      }

      const ids = deletable.map((s) => s.id);
      const eventIds = ids.map((id) => `shadow-${id}`);

      await db.delete(taggedMetrics).where(inArray(taggedMetrics.eventId, eventIds));

      const recallBotIds = deletable
        .map((s) => s.recallBotId)
        .filter(Boolean) as string[];
      if (recallBotIds.length > 0) {
        try {
          await db.delete(recallBots).where(inArray(recallBots.recallBotId, recallBotIds));
        } catch {}
      }

      const agmIds = deletable
        .filter((s) => s.eventType === "agm")
        .map((s) => s.id);
      if (agmIds.length > 0) {
        try {
          await db.delete(agmIntelligenceSessions).where(inArray(agmIntelligenceSessions.shadowSessionId, agmIds));
        } catch {}
      }

      for (const s of deletable) {
        if (s.localRecordingPath) {
          try {
            const { unlinkSync } = await import("fs");
            const { join } = await import("path");
            unlinkSync(join(process.cwd(), s.localRecordingPath));
          } catch {}
        }
      }

      await db.delete(shadowSessions).where(inArray(shadowSessions.id, ids));

      console.log(`[Shadow] Bulk deleted ${ids.length} sessions: ${ids.join(", ")}`);
      return { success: true, deleted: ids.length, message: `${ids.length} session${ids.length > 1 ? "s" : ""} deleted` };
    }),

  createFromCalendar: operatorProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventName: z.string().min(1),
      eventType: z.enum([
        "earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call",
        "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast",
        "investor_day", "roadshow", "special_call",
        "ipo_roadshow", "ipo_listing", "pre_ipo",
        "manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement",
        "credit_rating_call", "bondholder_meeting", "debt_restructuring",
        "proxy_contest", "activist_meeting", "extraordinary_general_meeting",
        "other",
      ]),
      platform: z.enum(["zoom", "teams", "meet", "webex", "choruscall", "other"]).default("zoom"),
      meetingUrl: z.string().url(),
      scheduledStart: z.string(),
      calendarEventId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (input.calendarEventId) {
        const [existing] = await rawSql(
          `SELECT id FROM shadow_sessions WHERE notes LIKE ? LIMIT 1`,
          [`%calendar:${input.calendarEventId}%`]
        );
        if ((existing as any[]).length > 0) {
          return { sessionId: (existing as any[])[0].id, alreadyExists: true, message: "Session already exists for this calendar event." };
        }
      }

      const calendarNote = input.calendarEventId
        ? `calendar:${input.calendarEventId} | Scheduled: ${input.scheduledStart}${input.notes ? ` | ${input.notes}` : ""}`
        : `Calendar-created | Scheduled: ${input.scheduledStart}${input.notes ? ` | ${input.notes}` : ""}`;

      const [inserted] = await db.insert(shadowSessions).values({
        clientName: input.clientName,
        eventName: input.eventName,
        eventType: input.eventType,
        platform: input.platform,
        meetingUrl: input.meetingUrl,
        status: "pending",
        notes: calendarNote,
      }).returning();

      const sessionId = inserted.id;

      console.log(`[Shadow] Calendar auto-session created: ${sessionId} for ${input.eventName} @ ${input.scheduledStart}`);

      return {
        sessionId,
        alreadyExists: false,
        status: "pending",
        message: `Shadow Mode session pre-created for ${input.eventName}. Will activate automatically when the meeting starts.`,
      };
    }),

  pipeAgmGovernance: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      transcriptSegments: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
        timestamp: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId)).limit(1);

      if (!session) throw new Error("Session not found");

      const [agmRow] = await db.select().from(agmIntelligenceSessions)
        .where(eq(agmIntelligenceSessions.shadowSessionId, input.sessionId)).limit(1);

      let agmSessionId = agmRow?.id ?? null;

      if (!agmSessionId) {
        const [agmInserted] = await db.insert(agmIntelligenceSessions).values({
          userId: 1,
          shadowSessionId: input.sessionId,
          clientName: session.clientName,
          agmTitle: session.eventName,
          jurisdiction: "south_africa",
          status: "live",
        }).returning();
        agmSessionId = agmInserted.id;
      }

      const results: any = {};

      try {
        const { triageGovernanceQuestions, scanRegulatoryCompliance } = await import("../services/AgmGovernanceAiService");

        const triageResult = await triageGovernanceQuestions(1, agmSessionId, input.transcriptSegments);
        results.governanceQuestions = triageResult;

        const complianceResult = await scanRegulatoryCompliance(1, agmSessionId, input.transcriptSegments);
        results.regulatoryCompliance = complianceResult;
      } catch (err) {
        console.error("[Shadow] AGM governance piping failed:", err);
        results.error = String(err);
      }

      return { agmSessionId, results };
    }),

  addNote: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      text: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      const existingNotes: Array<{ id: string; text: string; createdAt: string }> = session.notes ? (() => { try { return JSON.parse(session.notes as string); } catch { return []; } })() : [];
      const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      existingNotes.push({ id: noteId, text: input.text, createdAt: new Date().toISOString() });

      await db.update(shadowSessions).set({ notes: JSON.stringify(existingNotes) }).where(eq(shadowSessions.id, input.sessionId));
      await logOperatorAction({ sessionId: input.sessionId, actionType: "note_created", detail: input.text.slice(0, 200) });

      return { success: true, noteId, noteCount: existingNotes.length };
    }),

  deleteNote: operatorProcedure
    .input(z.object({ sessionId: z.number(), noteId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}
      notes = notes.filter(n => n.id !== input.noteId);

      await db.update(shadowSessions).set({ notes: JSON.stringify(notes) }).where(eq(shadowSessions.id, input.sessionId));
      await logOperatorAction({ sessionId: input.sessionId, actionType: "note_deleted", detail: `Note ${input.noteId} removed` });

      return { success: true };
    }),

  getNotes: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select({ notes: shadowSessions.notes }).from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) return [];
      try { return session.notes ? JSON.parse(session.notes as string) : []; } catch { return []; }
    }),

  getActionLog: operatorProcedure
    .input(z.object({ sessionId: z.number().optional(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (input.sessionId) {
        return db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(input.limit);
      }
      return db.select().from(operatorActions).orderBy(desc(operatorActions.createdAt)).limit(input.limit);
    }),

  qaAction: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      questionId: z.string(),
      action: z.enum(["approve", "reject", "hold", "legal_review", "send_to_speaker", "answered", "bulk_approve", "bulk_reject", "generate_draft", "link_duplicate", "unlink_duplicate"]),
      questionText: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const actionLabels: Record<string, string> = {
        approve: "Question approved for live display",
        reject: "Question rejected/dismissed",
        hold: "Question placed on hold",
        legal_review: "Question flagged for legal review",
        send_to_speaker: "Question sent to speaker queue",
        answered: "Question marked as answered",
        bulk_approve: "Question bulk-approved",
        bulk_reject: "Question bulk-rejected",
        generate_draft: "AI draft generated",
        link_duplicate: "Question linked as duplicate",
        unlink_duplicate: "Question unlinked from duplicate",
      };

      await logOperatorAction({
        sessionId: input.sessionId,
        actionType: `question_${input.action}`,
        detail: `${actionLabels[input.action]}${input.questionText ? `: "${input.questionText.slice(0, 100)}"` : ""}`,
        metadata: { questionId: input.questionId, action: input.action },
      });

      return { success: true, action: input.action, message: actionLabels[input.action] };
    }),

  getHandoffPackage: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let transcript: Array<{ speaker: string; text: string; timestamp: number }> = [];
      let recordingUrl: string | null = null;

      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.transcriptJson) transcript = JSON.parse(bot.transcriptJson);
        if (bot?.recordingUrl) recordingUrl = bot.recordingUrl;
      }
      if (session.localTranscriptJson && transcript.length === 0) {
        try { transcript = JSON.parse(session.localTranscriptJson as string); } catch {}
      }
      if (session.localRecordingPath) recordingUrl = `/api/shadow/recording/${session.id}`;

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}

      const actions = await db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(200);

      let aiReport: AiReport | null = null;
      try {
        const [rows] = await rawSql(`SELECT ai_report FROM archive_events WHERE event_id = ? LIMIT 1`, [`shadow-${session.id}`]);
        if (rows?.[0]?.ai_report) aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
      } catch {}

      const fullText = transcript.map(s => `[${s.speaker}]: ${s.text}`).join("\n");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const qaActions = actions.filter(a => a.actionType.startsWith("question_"));
      const duration = session.startedAt && session.endedAt ? Math.round((session.endedAt - session.startedAt) / 1000) : null;

      let qaData: any[] = [];
      let dedupGroups: Record<number, number[]> = {};
      let legalReviewItems: any[] = [];
      try {
        const [qaRows] = await rawSql(
          `SELECT q.id, q.question_text, q.question_status, q.triage_classification, q.priority_score,
                  q.duplicate_of_id, q.legal_review_reason, q.ai_draft_text, q.submitter_name, q.submitter_company
           FROM live_qa_questions q
           JOIN live_qa_sessions s ON s.id = q.session_id
           WHERE s.shadow_session_id = ?
           ORDER BY q.priority_score DESC`, [input.sessionId]);
        qaData = qaRows || [];
        for (const q of qaData) {
          if (q.duplicate_of_id) {
            if (!dedupGroups[q.duplicate_of_id]) dedupGroups[q.duplicate_of_id] = [];
            dedupGroups[q.duplicate_of_id].push(q.id);
          }
          if (q.legal_review_reason) legalReviewItems.push({ id: q.id, text: q.question_text, reason: q.legal_review_reason, status: q.question_status });
        }
      } catch {}

      const readiness = {
        hasTranscript: transcript.length > 0,
        hasRecording: !!recordingUrl,
        hasAiReport: !!aiReport,
        hasNotes: notes.length > 0,
        hasActions: actions.length > 0,
        score: [transcript.length > 0, !!recordingUrl, !!aiReport, notes.length > 0].filter(Boolean).length,
        maxScore: 4,
      };

      return {
        session: {
          id: session.id,
          clientName: session.clientName,
          eventName: session.eventName,
          eventType: session.eventType,
          platform: session.platform,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration,
        },
        transcript: { segments: transcript, wordCount },
        recording: { url: recordingUrl },
        notes,
        actionLog: actions,
        qaSummary: {
          total: qaActions.length,
          approved: qaActions.filter(a => a.actionType === "question_approve").length,
          rejected: qaActions.filter(a => a.actionType === "question_reject").length,
          held: qaActions.filter(a => a.actionType === "question_hold").length,
          legalReview: qaActions.filter(a => a.actionType === "question_legal_review").length,
          sentToSpeaker: qaActions.filter(a => a.actionType === "question_send_to_speaker").length,
          questions: qaData.length,
          duplicateGroups: Object.keys(dedupGroups).length,
          legalReviewPending: legalReviewItems.length,
        },
        qaQuestions: qaData,
        dedupGroups,
        legalReviewItems,
        aiReport,
        readiness,
      };
    }),

  exportSession: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      format: z.enum(["csv", "json", "pdf"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let transcript: Array<{ speaker: string; text: string; timestamp: number }> = [];
      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.transcriptJson) transcript = JSON.parse(bot.transcriptJson);
      }
      if (session.localTranscriptJson && transcript.length === 0) {
        try { transcript = JSON.parse(session.localTranscriptJson as string); } catch {}
      }

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}

      const actions = await db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(500);

      let aiReport: AiReport | null = null;
      try {
        const [rows] = await rawSql(`SELECT ai_report FROM archive_events WHERE event_id = ? LIMIT 1`, [`shadow-${session.id}`]);
        if (rows?.[0]?.ai_report) aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
      } catch {}

      let recordingUrl: string | null = null;
      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.recordingUrl) recordingUrl = bot.recordingUrl;
      }
      if (!recordingUrl && session.localRecordingPath) recordingUrl = `/api/shadow/recording/${session.id}`;

      const startTime = session.startedAt ? new Date(session.startedAt) : null;
      const endTime = session.endedAt ? new Date(session.endedAt) : null;
      const durationMs = startTime && endTime ? endTime.getTime() - startTime.getTime() : null;
      const durationFormatted = durationMs ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s` : "N/A";

      const exportedAt = new Date().toISOString();

      let qaData: any[] = [];
      try {
        const [qaRows] = await rawSql(
          `SELECT q.id, q.question_text, q.question_status, q.triage_classification, q.priority_score,
                  q.duplicate_of_id, q.legal_review_reason, q.ai_draft_text, q.submitter_name, q.submitter_company
           FROM live_qa_questions q
           JOIN live_qa_sessions s ON s.id = q.session_id
           WHERE s.shadow_session_id = ?
           ORDER BY q.priority_score DESC`, [input.sessionId]);
        qaData = qaRows || [];
      } catch {}

      await logOperatorAction({ sessionId: input.sessionId, actionType: "export_generated", detail: `${input.format.toUpperCase()} export generated` });

      if (input.format === "csv") {
        const csvSafe = (val: string): string => {
          if (!val) return '""';
          let s = val.replace(/\r?\n/g, " ");
          if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
          return `"${s.replace(/"/g, '""')}"`;
        };

        const csvRows: string[] = [];
        csvRows.push("Section,Timestamp,Speaker,Content,Metadata");

        csvRows.push(`Event Info,,,${csvSafe(`${session.clientName} — ${session.eventName}`)},${csvSafe(`Type: ${session.eventType}, Platform: ${session.platform}, Status: ${session.status}`)}`);
        if (startTime) csvRows.push(`Event Info,${startTime.toISOString()},,${csvSafe("Session Started")},`);
        if (endTime) csvRows.push(`Event Info,${endTime.toISOString()},,${csvSafe("Session Ended")},`);
        csvRows.push(`Event Info,,,${csvSafe(`Duration: ${durationFormatted}`)},`);
        if (session.meetingUrl) csvRows.push(`Event Info,,,${csvSafe(`Meeting URL: ${session.meetingUrl}`)},`);
        if (recordingUrl) csvRows.push(`Event Info,,,${csvSafe(`Recording: ${recordingUrl}`)},has_recording`);
        csvRows.push(`Event Info,${exportedAt},,${csvSafe("Export Generated")},export_timestamp`);

        for (const seg of transcript) {
          csvRows.push(`Transcript,${seg.timestamp},${csvSafe(seg.speaker)},${csvSafe(seg.text)},`);
        }

        for (const note of notes) {
          csvRows.push(`Note,${note.createdAt},,${csvSafe(note.text)},`);
        }

        for (const act of actions) {
          csvRows.push(`Action,${act.createdAt.toISOString()},${csvSafe(act.operatorName ?? "")},${csvSafe(act.detail ?? act.actionType)},${csvSafe(act.actionType)}`);
        }

        if (aiReport?.executiveSummary) {
          csvRows.push(`AI Report,,,${csvSafe(aiReport.executiveSummary)},executive_summary`);
        }
        if (aiReport?.sentimentAnalysis) {
          csvRows.push(`AI Report,,,${csvSafe(`Sentiment: ${aiReport.sentimentAnalysis.score}/100 — ${aiReport.sentimentAnalysis.narrative?.slice(0, 200) ?? ""}`)},sentiment`);
        }
        if (aiReport?.complianceReview) {
          csvRows.push(`AI Report,,,${csvSafe(`Risk: ${aiReport.complianceReview.riskLevel}${aiReport.complianceReview.flaggedPhrases?.length ? ` — Flags: ${aiReport.complianceReview.flaggedPhrases.join(", ")}` : ""}`)},compliance`);
        }
        if (aiReport?.keyTopics) {
          const topics = Array.isArray(aiReport.keyTopics)
            ? aiReport.keyTopics.map((t: any) => typeof t === "string" ? t : (t?.topic || t?.name || JSON.stringify(t))).join("; ")
            : String(aiReport.keyTopics);
          csvRows.push(`AI Report,,,${csvSafe(topics)},key_topics`);
        }
        if (aiReport?.riskFactors) {
          const risks = Array.isArray(aiReport.riskFactors)
            ? aiReport.riskFactors.map((r: any) => typeof r === "string" ? r : (r?.factor || r?.description || r?.name || JSON.stringify(r))).join("; ")
            : String(aiReport.riskFactors);
          csvRows.push(`AI Report,,,${csvSafe(risks)},risk_factors`);
        }
        if (aiReport?.actionItems) {
          const items = Array.isArray(aiReport.actionItems)
            ? aiReport.actionItems.map((a: any) => typeof a === "string" ? a : (a?.action || a?.description || a?.item || JSON.stringify(a))).join("; ")
            : String(aiReport.actionItems);
          csvRows.push(`AI Report,,,${csvSafe(items)},action_items`);
        }

        if (!aiReport) {
          csvRows.push(`Compliance,,,${csvSafe("No AI report generated — compliance review not available")},no_report`);
        }

        for (const q of qaData) {
          const dupLabel = q.duplicate_of_id ? `DUP of Q#${q.duplicate_of_id}` : "";
          const legalLabel = q.legal_review_reason ? `LEGAL: ${q.legal_review_reason}` : "";
          const meta = [q.question_status, q.triage_classification, dupLabel, legalLabel].filter(Boolean).join(" | ");
          csvRows.push(`Q&A,Q#${q.id},${csvSafe(q.submitter_name || "Anonymous")},${csvSafe(q.question_text)},${csvSafe(meta)}`);
        }

        return { content: csvRows.join("\n"), filename: `curalive-session-${session.id}.csv`, contentType: "text/csv" };
      }

      const sessionMeta = {
        id: session.id,
        clientName: session.clientName,
        eventName: session.eventName,
        eventType: session.eventType,
        platform: session.platform,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: durationFormatted,
        durationMs,
        meetingUrl: session.meetingUrl ?? null,
        recordingUrl,
        exportedAt,
      };

      const dedupGroups: Record<number, number[]> = {};
      const legalReviewItems: any[] = [];
      for (const q of qaData) {
        if (q.duplicate_of_id) {
          if (!dedupGroups[q.duplicate_of_id]) dedupGroups[q.duplicate_of_id] = [];
          dedupGroups[q.duplicate_of_id].push(q.id);
        }
        if (q.legal_review_reason) legalReviewItems.push({ id: q.id, text: q.question_text, reason: q.legal_review_reason });
      }
      const qaExport = { questions: qaData, dedupGroups, legalReviewItems };

      if (input.format === "pdf") {
        return {
          content: JSON.stringify({ session: sessionMeta, transcript, notes, actionLog: actions, aiReport, qa: qaExport }),
          filename: `curalive-session-${session.id}.pdf`,
          contentType: "application/pdf",
          pdfData: true,
        };
      }

      return {
        content: JSON.stringify({ session: sessionMeta, transcript, notes, actionLog: actions, aiReport, qa: qaExport }, null, 2),
        filename: `curalive-session-${session.id}.json`,
        contentType: "application/json",
      };
    }),

});

```

---

### systemDiagnosticsRouter.ts (155 lines)
File: `server/routers/systemDiagnosticsRouter.ts`

```typescript
// @ts-nocheck
import { router, adminProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";

interface DiagnosticResult {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  durationMs: number;
}

async function runDiagnostic(name: string, fn: () => Promise<string>): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, status: "pass", detail, durationMs: Date.now() - start };
  } catch (err: any) {
    return { name, status: "fail", detail: err.message ?? String(err), durationMs: Date.now() - start };
  }
}

export const systemDiagnosticsRouter = router({
  runFullDiagnostic: adminProcedure.mutation(async () => {
    const results: DiagnosticResult[] = [];

    results.push(await runDiagnostic("Database Connection", async () => {
      const db = await getDb();
    const [rows] = await rawSql("SELECT 1 AS ok");
      if (!(rows as any[])[0]?.ok) throw new Error("SELECT 1 returned no result");
      return "Connected and responsive";
    }));

    results.push(await runDiagnostic("Shadow Sessions Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM shadow_sessions`
      );
      const r = (rows as any[])[0];
      return `${r.total} sessions (${r.completed} completed, ${r.live} live, ${r.failed} failed)`;
    }));

    results.push(await runDiagnostic("Archive Events Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN ai_report IS NOT NULL THEN 1 ELSE 0 END) as with_report
         FROM archive_events`
      );
      const r = (rows as any[])[0];
      return `${r.total} archives (${r.with_report} with AI reports)`;
    }));

    results.push(await runDiagnostic("Crisis Prediction Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM crisis_predictions`);
      return `${(rows as any[])[0].total} predictions stored`;
    }));

    results.push(await runDiagnostic("Valuation Impact Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM valuation_impacts`);
      return `${(rows as any[])[0].total} analyses stored`;
    }));

    results.push(await runDiagnostic("Disclosure Certificates Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM disclosure_certificates`);
      return `${(rows as any[])[0].total} certificates stored`;
    }));

    results.push(await runDiagnostic("Evolution Audit Trail", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM evolution_audit_log`);
      return `${(rows as any[])[0].total} audit entries`;
    }));

    results.push(await runDiagnostic("Advisory Bot Messages", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM advisory_chat_messages`);
      return `${(rows as any[])[0].total} messages stored`;
    }));

    results.push(await runDiagnostic("Monthly Reports Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM monthly_reports`);
      return `${(rows as any[])[0].total} reports generated`;
    }));

    results.push(await runDiagnostic("Tagged Metrics", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM tagged_metrics`);
      return `${(rows as any[])[0].total} intelligence records`;
    }));

    results.push(await runDiagnostic("Shadow Guardian Service", async () => {
      const { reconcileShadowSessions } = await import("../services/ShadowModeGuardianService");
      const result = await reconcileShadowSessions();
      return `Reconciliation check: ${result.total} in-flight, ${result.recovered} recovered, ${result.failed} failed, ${result.active} active`;
    }));

    results.push(await runDiagnostic("Recall.ai API Key", async () => {
      if (!process.env.RECALL_AI_API_KEY) throw new Error("RECALL_AI_API_KEY not configured");
      return "Configured";
    }));

    results.push(await runDiagnostic("OpenAI Integration", async () => {
      const { invokeLLM } = await import("../_core/llm");
      const resp = await invokeLLM({
        messages: [{ role: "user", content: "Reply with exactly: SYSTEM_OK" }],
        model: "gpt-4o-mini",
        max_tokens: 10,
      });
      const reply = resp.choices?.[0]?.message?.content?.trim() ?? "";
      if (!reply.includes("SYSTEM_OK")) throw new Error(`Unexpected reply: ${reply}`);
      return "GPT-4o-mini responding correctly";
    }));

    results.push(await runDiagnostic("tRPC Router Registry", async () => {
      const { appRouter } = await import("../routers.eager");
      const procedures = Object.keys((appRouter as any)._def.procedures ?? {});
      const cip4Routers = ["crisisPrediction", "valuationImpact", "disclosureCertificate", "monthlyReport", "advisoryBot", "evolutionAudit"];
      const missing = cip4Routers.filter(r => !procedures.some(p => p.startsWith(r + ".")));
      if (missing.length > 0) throw new Error(`Missing CIP4 routers: ${missing.join(", ")}`);
      return `${procedures.length} procedures registered, all 6 CIP4 routers present`;
    }));

    results.push(await runDiagnostic("AI Report Pipeline (dry check)", async () => {
      const { generateFullAiReport } = await import("./archiveUploadRouter");
      if (typeof generateFullAiReport !== "function") throw new Error("generateFullAiReport not exported");
      return "Pipeline function accessible";
    }));

    const passed = results.filter(r => r.status === "pass").length;
    const failed = results.filter(r => r.status === "fail").length;
    const warned = results.filter(r => r.status === "warn").length;
    const totalDuration = results.reduce((s, r) => s + r.durationMs, 0);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed,
        failed,
        warned,
        overallStatus: failed === 0 ? "HEALTHY" : failed <= 2 ? "DEGRADED" : "CRITICAL",
        totalDurationMs: totalDuration,
      },
      results,
    };
  }),
});

```

---

### liveQaRouter.ts (892 lines)
File: `server/routers/liveQaRouter.ts`

```typescript
// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { liveQaSessions, liveQaQuestions, liveQaAnswers, liveQaComplianceFlags, shadowSessions } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAblyClient } from "../_core/ably";
import { triageQuestion, generateAutoDraft, authoriseGoLive } from "../services/LiveQaTriageService";
import { publishToChannel } from "../_core/ably";
import { generateAutonomousTools } from "../services/AgiToolGeneratorService";
import { predictiveRiskAnalysis } from "../services/AgiComplianceService";
import { createHash } from "crypto";

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const DUPLICATE_THRESHOLD = 0.55;

function findDuplicate(newQuestion: string, existingQuestions: Array<{ id: number; text: string }>): { id: number; similarity: number } | null {
  let bestMatch: { id: number; similarity: number } | null = null;
  for (const eq of existingQuestions) {
    const sim = jaccardSimilarity(newQuestion, eq.text);
    if (sim >= DUPLICATE_THRESHOLD && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { id: eq.id, similarity: sim };
    }
  }
  return bestMatch;
}

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const upvoteTracker = new Map<string, number>();
const UPVOTE_COOLDOWN_MS = 10_000;

export const liveQaRouter = router({
  createSession: operatorProcedure
    .input(z.object({
      eventName: z.string().min(1),
      clientName: z.string().optional(),
      shadowSessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const sessionCode = generateSessionCode();
      await db.insert(liveQaSessions).values({
        sessionCode,
        eventName: input.eventName,
        clientName: input.clientName || null,
        shadowSessionId: input.shadowSessionId || null,
      });
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, sessionCode));
      return session;
    }),

  getSession: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.id, input.sessionId));
      return session || null;
    }),

  getSessionByCode: publicProcedure
    .input(z.object({ accessCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.accessCode.toUpperCase()));
      if (!session) return null;

      let ablyChannel: string | null = null;
      let shadowStatus: string | null = null;
      if (session.shadowSessionId) {
        const [shadow] = await db
          .select({ ablyChannel: shadowSessions.ablyChannel, status: shadowSessions.status })
          .from(shadowSessions)
          .where(eq(shadowSessions.id, session.shadowSessionId));
        if (shadow) {
          ablyChannel = shadow.ablyChannel;
          shadowStatus = shadow.status;
        }
      }

      return {
        id: session.id,
        sessionCode: session.sessionCode,
        eventName: session.eventName,
        clientName: session.clientName,
        status: session.status,
        totalQuestions: session.totalQuestions,
        ablyChannel,
        isLiveStreaming: shadowStatus === "live" || shadowStatus === "bot_joining",
      };
    }),

  getAttendeeAblyToken: publicProcedure
    .input(z.object({ accessCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.accessCode.toUpperCase()));
      if (!session || !session.shadowSessionId) return { tokenRequest: null };
      if (session.status === "closed") return { tokenRequest: null };

      const [shadow] = await db
        .select({ ablyChannel: shadowSessions.ablyChannel, status: shadowSessions.status })
        .from(shadowSessions)
        .where(eq(shadowSessions.id, session.shadowSessionId));
      if (!shadow?.ablyChannel) return { tokenRequest: null };
      if (shadow.status !== "live" && shadow.status !== "bot_joining") return { tokenRequest: null };

      try {
        const client = await getAblyClient();
        if (!client) return { tokenRequest: null };
        const tokenRequest = await client.auth.createTokenRequest({
          clientId: `attendee-${input.accessCode}-${Date.now()}`,
          ttl: 900000,
          capability: JSON.stringify({
            [shadow.ablyChannel]: ["subscribe"],
          }),
        });
        return { tokenRequest, channel: shadow.ablyChannel };
      } catch (err) {
        console.error("[LiveQA] Failed to generate attendee Ably token:", err);
        return { tokenRequest: null };
      }
    }),

  getSessionByShadow: operatorProcedure
    .input(z.object({ shadowSessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.shadowSessionId, input.shadowSessionId));
      return session || null;
    }),

  updateSessionStatus: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      status: z.enum(["active", "paused", "closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: any = { status: input.status };
      if (input.status === "closed") updates.closedAt = new Date();
      await db.update(liveQaSessions).set(updates).where(eq(liveQaSessions.id, input.sessionId));
      return { success: true };
    }),

  submitQuestion: publicProcedure
    .input(z.object({
      sessionCode: z.string(),
      questionText: z.string().min(5).max(2000),
      submitterName: z.string().optional(),
      submitterEmail: z.string().email().optional(),
      submitterCompany: z.string().optional(),
      isAnonymous: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.sessionCode.toUpperCase()));
      if (!session) throw new Error("Q&A session not found");
      if (session.status === "closed") throw new Error("Q&A session is closed");
      if (session.status === "paused") throw new Error("Q&A session is paused");

      const existingQs = await db
        .select({ id: liveQaQuestions.id, text: liveQaQuestions.questionText })
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, session.id))
        .limit(200);

      const triage = await triageQuestion(
        input.questionText,
        session.eventName,
        session.clientName || "",
        existingQs.map(q => q.text)
      );

      const duplicateMatch = findDuplicate(input.questionText, existingQs.map(q => ({ id: q.id, text: q.text })));
      const isDuplicate = !!duplicateMatch;
      const effectiveClassification = isDuplicate ? "duplicate" : triage.triageClassification;
      const effectiveStatus = triage.complianceRiskScore > 70 ? "flagged" : "triaged";

      const nowEpoch = String(Date.now());
    const [insertResult] = await rawSql(
        `INSERT INTO live_qa_questions (session_id, question_text, submitter_name, submitter_email, submitter_company, question_category, question_status, upvotes, triage_score, triage_classification, triage_reason, compliance_risk_score, priority_score, is_anonymous, duplicate_of_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          input.questionText,
          input.isAnonymous ? null : (input.submitterName || null),
          input.isAnonymous ? null : (input.submitterEmail || null),
          input.isAnonymous ? null : (input.submitterCompany || null),
          triage.category,
          effectiveStatus,
          triage.triageScore,
          effectiveClassification,
          isDuplicate ? `Possible duplicate of Q#${duplicateMatch!.id} (${Math.round(duplicateMatch!.similarity * 100)}% match). ${triage.triageReason}` : triage.triageReason,
          triage.complianceRiskScore,
          isDuplicate ? Math.max(0, triage.priorityScore - 20) : triage.priorityScore,
          input.isAnonymous ? 1 : 0,
          duplicateMatch?.id || null,
          nowEpoch,
          nowEpoch,
        ]
      );

      const questionId = insertResult.insertId;

      if (triage.complianceFlags.length > 0 && questionId) {
        for (const flag of triage.complianceFlags) {
          await db.insert(liveQaComplianceFlags).values({
            questionId,
            jurisdiction: flag.jurisdiction || "global",
            riskScore: flag.riskScore || 0,
            riskType: flag.riskType || "unknown",
            riskDescription: flag.riskDescription || "",
            recommendedAction: flag.recommendedAction || "forward",
            autoRemediationSuggestion: flag.autoRemediationSuggestion || "",
          });
        }
      }

      await db.update(liveQaSessions)
        .set({ totalQuestions: sql`total_questions + 1` })
        .where(eq(liveQaSessions.id, session.id));

      publishToChannel(`curalive-qa-${session.id}`, "qa.submitted", {
        questionId,
        questionText: input.questionText,
        category: triage.category,
        triageClassification: triage.triageClassification,
        triageScore: triage.triageScore,
        priorityScore: triage.priorityScore,
        complianceRiskScore: triage.complianceRiskScore,
        status: triage.complianceRiskScore > 70 ? "flagged" : "triaged",
        timestamp: Date.now(),
      }).catch(() => {});

      return {
        questionId,
        category: triage.category,
        triageClassification: triage.triageClassification,
        status: triage.complianceRiskScore > 70 ? "flagged" : "triaged",
      };
    }),

  listQuestions: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      statusFilter: z.string().optional(),
      sortBy: z.enum(["priority", "time", "compliance"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
    let query = `SELECT q.*, 
        (SELECT COUNT(*) FROM live_qa_answers a WHERE a.question_id = q.id) as answer_count,
        (SELECT COUNT(*) FROM live_qa_compliance_flags f WHERE f.question_id = q.id AND f.resolved = false) as unresolved_flags,
        (SELECT COUNT(*) FROM live_qa_questions d WHERE d.duplicate_of_id = q.id) as duplicate_count
        FROM live_qa_questions q WHERE q.session_id = ?`;
      const params: any[] = [input.sessionId];

      const filter = input.statusFilter || "all";
      if (filter === "legal_review") {
        query += ` AND q.legal_review_reason IS NOT NULL`;
      } else if (filter === "duplicates") {
        query += ` AND q.duplicate_of_id IS NOT NULL`;
      } else if (filter === "unanswered") {
        query += ` AND q.question_status NOT IN ('answered', 'rejected')`;
      } else if (filter === "high_priority") {
        query += ` AND (q.triage_classification = 'high_priority' OR q.compliance_risk_score > 60)`;
      } else if (filter === "sent_to_speaker") {
        query += ` AND q.operator_notes LIKE '%Sent to speaker%'`;
      } else if (filter !== "all") {
        query += ` AND q.question_status = ?`;
        params.push(filter);
      }

      const sortBy = input.sortBy || "priority";
      const sortOrder = (input.sortOrder || "desc").toUpperCase();
      if (sortBy === "compliance") {
        query += ` ORDER BY q.compliance_risk_score ${sortOrder}, q.priority_score DESC`;
      } else if (sortBy === "time") {
        query += ` ORDER BY q.created_at ${sortOrder}`;
      } else {
        query += ` ORDER BY q.priority_score ${sortOrder}, q.created_at DESC`;
      }

      const [rows] = await rawSql(query, params);
      return rows || [];
    }),

  listQuestionsPublic: publicProcedure
    .input(z.object({ sessionCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.sessionCode.toUpperCase()));
      if (!session) return [];
    const [rows] = await rawSql(
        `SELECT id, question_text, question_category as category, question_status as status, 
                upvotes, submitter_name, submitter_company, is_anonymous, created_at
         FROM live_qa_questions 
         WHERE session_id = ? AND question_status IN ('triaged','approved','answered')
         ORDER BY upvotes DESC, created_at DESC`,
        [session.id]
      );
      return (rows || []).map((r: any) => ({
        ...r,
        submitterName: r.is_anonymous ? "Anonymous" : r.submitter_name,
        submitterCompany: r.is_anonymous ? null : r.submitter_company,
      }));
    }),

  upvoteQuestion: publicProcedure
    .input(z.object({
      questionId: z.number(),
      fingerprint: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => {
      const key = `${input.fingerprint || "anon"}-${input.questionId}`;
      const lastVote = upvoteTracker.get(key);
      if (lastVote && Date.now() - lastVote < UPVOTE_COOLDOWN_MS) {
        throw new Error("Please wait before voting again");
      }
      upvoteTracker.set(key, Date.now());

      if (upvoteTracker.size > 10000) {
        const cutoff = Date.now() - 3600_000;
        for (const [k, v] of upvoteTracker) {
          if (v < cutoff) upvoteTracker.delete(k);
        }
      }

      const db = await getDb();
      await db.update(liveQaQuestions)
        .set({ upvotes: sql`upvotes + 1` })
        .where(eq(liveQaQuestions.id, input.questionId));
      return { success: true };
    }),

  updateQuestionStatus: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      status: z.enum(["pending", "triaged", "approved", "answered", "rejected", "flagged"]),
      operatorNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [existing] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!existing) throw new Error("Question not found");

      const oldStatus = existing.questionStatus;
      if (oldStatus === input.status && !input.operatorNotes) return { success: true };

      const nowEpoch = String(Date.now());
      const updates: any = { status: input.status, updatedAt: nowEpoch };
      if (input.operatorNotes !== undefined) updates.operatorNotes = input.operatorNotes;
      await db.update(liveQaQuestions).set(updates).where(eq(liveQaQuestions.id, input.questionId));

      if (oldStatus !== input.status) {
        const wasApproved = oldStatus === "approved";
        const wasRejected = oldStatus === "rejected";
        const isApproved = input.status === "approved";
        const isRejected = input.status === "rejected";
        if (wasApproved && !isApproved) await rawSql(`UPDATE live_qa_sessions SET total_approved = GREATEST(0, total_approved - 1) WHERE id = ?`, [existing.sessionId]);
        if (wasRejected && !isRejected) await rawSql(`UPDATE live_qa_sessions SET total_rejected = GREATEST(0, total_rejected - 1) WHERE id = ?`, [existing.sessionId]);
        if (!wasApproved && isApproved) await rawSql(`UPDATE live_qa_sessions SET total_approved = total_approved + 1 WHERE id = ?`, [existing.sessionId]);
        if (!wasRejected && isRejected) await rawSql(`UPDATE live_qa_sessions SET total_rejected = total_rejected + 1 WHERE id = ?`, [existing.sessionId]);
      }

      publishToChannel(`curalive-qa-${existing.sessionId}`, "qa.statusChanged", {
        questionId: input.questionId,
        newStatus: input.status,
        operatorNotes: input.operatorNotes || null,
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true };
    }),

  generateDraft: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, q.sessionId));
      if (!session) throw new Error("Session not found");

      const draft = await generateAutoDraft(
        q.questionText,
        session.eventName,
        session.clientName || "",
        q.category
      );

      await db.insert(liveQaAnswers).values({
        questionId: input.questionId,
        answerText: draft.answerText,
        isAutoDraft: true,
        autoDraftReasoning: draft.reasoning,
        approvedByOperator: false,
      });

      return draft;
    }),

  submitAnswer: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      answerText: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(liveQaAnswers).values({
        questionId: input.questionId,
        answerText: input.answerText,
        isAutoDraft: false,
        approvedByOperator: true,
      });
      await db.update(liveQaQuestions)
        .set({ status: "answered", updatedAt: Date.now() })
        .where(eq(liveQaQuestions.id, input.questionId));

      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (q) {
        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "answered",
          timestamp: Date.now(),
        }).catch(() => {});
      }

      return { success: true };
    }),

  getAnswers: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(liveQaAnswers).where(eq(liveQaAnswers.questionId, input.questionId));
    }),

  getComplianceFlags: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(liveQaComplianceFlags).where(eq(liveQaComplianceFlags.questionId, input.questionId));
    }),

  resolveComplianceFlag: operatorProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(liveQaComplianceFlags)
        .set({ resolved: true })
        .where(eq(liveQaComplianceFlags.id, input.flagId));
      return { success: true };
    }),

  listSessions: operatorProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(liveQaSessions).orderBy(desc(liveQaSessions.createdAt));
  }),

  sendToSpeaker: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      speakerNote: z.string().optional(),
      suggestedAnswer: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      await db.update(liveQaQuestions)
        .set({ status: "approved", operatorNotes: input.speakerNote || "Sent to speaker", updatedAt: Date.now() })
        .where(eq(liveQaQuestions.id, input.questionId));

      publishToChannel(`curalive-qa-${q.sessionId}`, "qa.sentToSpeaker", {
        questionId: input.questionId,
        questionText: q.questionText,
        speakerNote: input.speakerNote || null,
        suggestedAnswer: input.suggestedAnswer || null,
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true };
    }),

  broadcastToTeam: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
      priority: z.enum(["normal", "urgent"]).optional(),
    }))
    .mutation(async ({ input }) => {
      publishToChannel(`curalive-qa-${input.sessionId}`, "qa.teamBroadcast", {
        message: input.message,
        priority: input.priority || "normal",
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true, broadcastedAt: Date.now() };
    }),

  postIrChatMessage: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
      senderRole: z.enum(["operator", "ir_team", "legal", "speaker"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const messageId = Date.now();

      publishToChannel(`curalive-qa-${input.sessionId}`, "qa.irChat", {
        id: messageId,
        message: input.message,
        senderRole: input.senderRole || "operator",
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true, messageId };
    }),

  setLegalReview: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      reason: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(liveQaQuestions)
        .set({
          status: "flagged",
          operatorNotes: `Legal Review: ${input.reason}`,
          updatedAt: Date.now(),
        })
        .where(eq(liveQaQuestions.id, input.questionId));
      await rawSql(`UPDATE live_qa_questions SET legal_review_reason = ? WHERE id = ?`, [input.reason, input.questionId]);
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (q) {
        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "flagged",
          legalReview: true,
          reason: input.reason,
          timestamp: Date.now(),
        }).catch(() => {});
      }
      return { success: true };
    }),

  clearLegalReview: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET legal_review_reason = NULL WHERE id = ?`, [input.questionId]);
      return { success: true };
    }),

  getDuplicatesOf: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT id, question_text, submitter_name, submitter_company, question_status, created_at
         FROM live_qa_questions WHERE duplicate_of_id = ?
         ORDER BY created_at DESC`,
        [input.questionId]
      );
      return rows || [];
    }),

  unlinkDuplicate: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET duplicate_of_id = NULL, triage_classification = 'standard' WHERE id = ?`, [input.questionId]);
      return { success: true };
    }),

  linkDuplicate: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      duplicateOfId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET duplicate_of_id = ?, triage_classification = 'duplicate' WHERE id = ?`, [input.duplicateOfId, input.questionId]);
      return { success: true };
    }),

  generateContextDraft: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      includeTranscript: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, q.sessionId));
      if (!session) throw new Error("Session not found");

      let transcriptContext = "";
      if (input.includeTranscript && session.shadowSessionId) {
        try {
          const [transcriptRows] = await rawSql(
            `SELECT transcript_json FROM recall_bots WHERE recall_bot_id = (SELECT recall_bot_id FROM shadow_sessions WHERE id = ?)`,
            [session.shadowSessionId]
          );
          if (transcriptRows?.[0]?.transcript_json) {
            const segments = JSON.parse(transcriptRows[0].transcript_json);
            const recentSegments = segments.slice(-20);
            transcriptContext = recentSegments.map((s: any) => `${s.speaker || "Speaker"}: ${s.text}`).join("\n");
          }
        } catch {}
      }

      const draft = await generateAutoDraft(
        q.questionText + (transcriptContext ? `\n\nRecent transcript context:\n${transcriptContext}` : ""),
        session.eventName,
        session.clientName || "",
        q.category
      );

      await rawSql(
        `UPDATE live_qa_questions SET ai_draft_text = ?, ai_draft_reasoning = ? WHERE id = ?`,
        [draft.answerText, draft.reasoning, input.questionId]
      );

      return draft;
    }),

  bulkAction: operatorProcedure
    .input(z.object({
      questionIds: z.array(z.number()).min(1).max(50),
      action: z.enum(["approve", "reject", "flagged", "legal_review"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      let processed = 0;
      for (const qId of input.questionIds) {
        try {
          if (input.action === "legal_review") {
            await db.update(liveQaQuestions)
              .set({ status: "flagged", operatorNotes: `Legal Review: ${input.reason || "Bulk escalation"}`, updatedAt: Date.now() })
              .where(eq(liveQaQuestions.id, qId));
            await rawSql(`UPDATE live_qa_questions SET legal_review_reason = ? WHERE id = ?`, [input.reason || "Bulk escalation", qId]);
          } else {
            const notes = input.action === "approve" ? "Bulk approved" : input.action === "reject" ? "Bulk rejected" : "Bulk flagged";
            await db.update(liveQaQuestions)
              .set({ status: input.action, operatorNotes: notes, updatedAt: Date.now() })
              .where(eq(liveQaQuestions.id, qId));
          }
          processed++;
        } catch {}
      }
      return { success: true, processed, total: input.questionIds.length };
    }),

  generateQaCertificate: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId))
        .orderBy(liveQaQuestions.createdAt);

      const answers = await db.select().from(liveQaAnswers)
        .where(sql`${liveQaAnswers.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      const flags = await db.select().from(liveQaComplianceFlags)
        .where(sql`${liveQaComplianceFlags.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      let previousHash = "GENESIS";
      const hashChain: Array<{ index: number; hash: string; previousHash: string; type: string; summary: string }> = [];

      const sessionPayload = JSON.stringify({
        sessionId: session.id,
        eventName: session.eventName,
        clientName: session.clientName,
        sessionCode: session.sessionCode,
        startedAt: session.createdAt,
        previousHash,
      });
      const sessionHash = createHash("sha256").update(sessionPayload).digest("hex");
      hashChain.push({ index: 0, hash: sessionHash, previousHash, type: "session_genesis", summary: `Session created: ${session.eventName}` });
      previousHash = sessionHash;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qPayload = JSON.stringify({
          questionId: q.id,
          text: q.questionText,
          category: q.category,
          status: q.status,
          triageScore: q.triageScore,
          complianceRiskScore: q.complianceRiskScore,
          createdAt: q.createdAt,
          previousHash,
        });
        const qHash = createHash("sha256").update(qPayload).digest("hex");
        hashChain.push({ index: i + 1, hash: qHash, previousHash, type: "question", summary: `Q${i + 1}: ${q.questionText?.slice(0, 60)}...` });
        previousHash = qHash;
      }

      const certificateHash = createHash("sha256").update(JSON.stringify(hashChain)).digest("hex");

      const totalAnswered = answers.filter(a => !a.isAutoDraft || a.approvedByOperator).length;
      const unresolvedFlags = flags.filter(f => !f.resolved).length;
      const complianceClean = unresolvedFlags === 0;

      const certificate = {
        certificateId: `CDC-QA-${session.sessionCode}-${Date.now()}`,
        type: "Clean Disclosure Certificate — Live Q&A Session",
        eventName: session.eventName,
        clientName: session.clientName,
        sessionCode: session.sessionCode,
        issuedAt: new Date().toISOString(),
        metrics: {
          totalQuestions: questions.length,
          totalAnswered,
          totalFlagged: flags.length,
          unresolvedFlags,
          responseRate: questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0,
        },
        complianceStatus: complianceClean ? "CLEAN" : "FLAGS_OUTSTANDING",
        certificateGrade: complianceClean
          ? (questions.length > 0 && totalAnswered / questions.length > 0.8 ? "AAA" : "AA")
          : (unresolvedFlags > 3 ? "B" : "BBB"),
        hashChain,
        certificateHash,
        chainLength: hashChain.length,
        verificationInstructions: "To verify: recompute SHA-256 hash chain from genesis block through each question segment. Final certificate hash must match.",
        disclaimer: "This certificate attests that all Q&A interactions during the specified session were processed through CuraLive's compliance screening engine. It does not constitute legal advice.",
        cipcPatent: "CIPC Patent App ID 1773575338868 | CIP5 | Claims 46-55",
      };

      return certificate;
    }),

  generateAgiTools: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId));

      const categories: Record<string, number> = {};
      let totalRisk = 0;
      const themes: string[] = [];
      questions.forEach(q => {
        categories[q.category] = (categories[q.category] || 0) + 1;
        totalRisk += q.complianceRiskScore || 0;
        if (q.triageClassification === "high_priority") themes.push(q.questionText?.slice(0, 50) || "");
      });

      return generateAutonomousTools({
        eventName: session.eventName,
        clientName: session.clientName || "",
        totalQuestions: questions.length,
        categories,
        avgComplianceRisk: questions.length > 0 ? totalRisk / questions.length : 0,
        flaggedCount: questions.filter(q => q.status === "flagged").length,
        topThemes: themes.slice(0, 5),
      });
    }),

  goLive: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      minimumThreshold: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const authorisation = authoriseGoLive(
        q.triageScore || 0,
        q.complianceRiskScore || 0,
        input.minimumThreshold
      );

      if (authorisation.authorised) {
        await db.update(liveQaQuestions)
          .set({ status: "approved", operatorNotes: `Go Live authorised: ${authorisation.reason}`, updatedAt: Date.now() })
          .where(eq(liveQaQuestions.id, input.questionId));
    await rawSql(`UPDATE live_qa_sessions SET total_approved = total_approved + 1 WHERE id = ?`, [q.sessionId]);

        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "approved",
          operatorNotes: `Go Live authorised: ${authorisation.reason}`,
          timestamp: Date.now(),
        }).catch(() => {});

        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.goLive", {
          questionId: input.questionId,
          questionText: q.questionText,
          submitterName: q.submitterName,
          submitterCompany: q.submitterCompany,
          triageScore: q.triageScore,
          authorisation,
          timestamp: Date.now(),
        }).catch(() => {});
      }

      return authorisation;
    }),

  predictiveRisk: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId));

      const flags = await db.select().from(liveQaComplianceFlags)
        .where(sql`${liveQaComplianceFlags.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      return predictiveRiskAnalysis({
        eventName: session.eventName,
        clientName: session.clientName || "",
        questions: questions.map(q => ({
          text: q.questionText,
          category: q.category,
          complianceRiskScore: q.complianceRiskScore || 0,
          status: q.status,
        })),
        existingFlags: flags.map(f => ({
          jurisdiction: f.jurisdiction,
          riskType: f.riskType,
          riskScore: f.riskScore || 0,
        })),
      });
    }),
});

```

---

### ShadowModeGuardianService.ts (152 lines)
File: `server/services/ShadowModeGuardianService.ts`

```typescript
// @ts-nocheck
import {getDb, rawSql } from "../db";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;
const WATCHDOG_INTERVAL_MS = 60 * 1000;

let watchdogTimer: ReturnType<typeof setInterval> | null = null;

export async function reconcileShadowSessions() {
  try {
    const db = await getDb();
    const now = Date.now();

    const [liveRows] = await rawSql(
      `SELECT id, client_name, event_name, status, started_at, ended_at, created_at
       FROM shadow_sessions
       WHERE status IN ('live', 'bot_joining', 'processing')
       ORDER BY created_at DESC`
    );

    let recovered = 0;
    let failed = 0;

    for (const session of liveRows as any[]) {
      const startedAt = session.started_at ? Number(session.started_at) : new Date(session.created_at).getTime();
      const age = now - startedAt;

      if (session.status === "processing" && age > PROCESSING_TIMEOUT_MS) {
        await rawSql(
          `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Processing timed out after restart — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
          [session.id]
        );
        failed++;
        console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) stuck in processing — marked failed`);
        continue;
      }

      if ((session.status === "live" || session.status === "bot_joining") && age > STALE_THRESHOLD_MS) {
        const [botRows] = await rawSql(
          `SELECT id, transcript_json FROM recall_bots WHERE event_id = ? ORDER BY created_at DESC LIMIT 1`,
          [session.id]
        );

        const bot = (botRows as any[])[0];
        const hasTranscript = bot?.transcript_json && JSON.parse(bot.transcript_json || "[]").length > 0;

        if (hasTranscript) {
          await rawSql(
            `UPDATE shadow_sessions SET status = 'completed', ended_at = ?, notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Auto-recovered after server restart at ${new Date().toISOString()}') WHERE id = ?`,
            [now, session.id]
          );
          recovered++;
          console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) had transcript — auto-recovered to completed`);
        } else {
          await rawSql(
            `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Stale session with no transcript — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
            [session.id]
          );
          failed++;
          console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) stale with no data — marked failed`);
        }
      }
    }

    const active = (liveRows as any[]).length - recovered - failed;
    if ((liveRows as any[]).length > 0) {
      console.log(`[ShadowGuardian] Reconciliation: ${recovered} recovered, ${failed} marked failed, ${active} still active`);
    }

    return { total: (liveRows as any[]).length, recovered, failed, active };
  } catch (err) {
    console.error("[ShadowGuardian] Reconciliation failed:", err);
    return { total: 0, recovered: 0, failed: 0, active: 0 };
  }
}

async function watchdogCheck() {
  try {
    const db = await getDb();
    const now = Date.now();

    const [liveSessions] = await rawSql(
      `SELECT s.id, s.client_name, s.event_name, s.status, s.started_at, s.created_at,
              b.id as bot_id, b.created_at as bot_created_at
       FROM shadow_sessions s
       LEFT JOIN recall_bots b ON b.event_id = s.id
       WHERE s.status IN ('live', 'bot_joining')
       ORDER BY s.created_at DESC`
    );

    for (const session of liveSessions as any[]) {
      const startedAt = session.started_at ? Number(session.started_at) : new Date(session.created_at).getTime();
      const age = now - startedAt;

      if (session.status === "bot_joining" && age > 10 * 60 * 1000) {
        await rawSql(
          `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Watchdog] Bot never joined after 10min — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
          [session.id]
        );
        console.warn(`[ShadowWatchdog] Session ${session.id} (${session.event_name}) bot_joining timeout — marked failed`);
      }

      if (session.status === "live" && age > 6 * 60 * 60 * 1000) {
        await rawSql(
          `UPDATE shadow_sessions SET status = 'completed', ended_at = ?, notes = CONCAT(COALESCE(notes, ''), '\n[Watchdog] Session exceeded 6h max duration — auto-completed at ${new Date().toISOString()}') WHERE id = ?`,
          [now, session.id]
        );
        console.warn(`[ShadowWatchdog] Session ${session.id} (${session.event_name}) exceeded 6h — auto-completed`);
      }
    }
  } catch (err) {
    console.error("[ShadowWatchdog] Check failed:", err);
  }
}

export function startShadowWatchdog() {
  if (watchdogTimer) return;
  watchdogTimer = setInterval(watchdogCheck, WATCHDOG_INTERVAL_MS);
  console.log("[ShadowWatchdog] Started — checking every 60s for zombie sessions");
}

export function stopShadowWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

export async function gracefulShutdown(signal: string) {
  console.log(`[ShadowGuardian] Received ${signal} — starting graceful shutdown...`);
  stopShadowWatchdog();

  try {
    const db = await getDb();
    const now = Date.now();

    const [activeSessions] = await rawSql(
      `SELECT id, event_name, status FROM shadow_sessions WHERE status IN ('live', 'bot_joining', 'processing')`
    );

    const count = (activeSessions as any[]).length;
    if (count > 0) {
      await rawSql(
        `UPDATE shadow_sessions SET notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Server shutting down (${signal}) at ${new Date().toISOString()} — session will be reconciled on restart') WHERE status IN ('live', 'bot_joining', 'processing')`
      );
      console.log(`[ShadowGuardian] Marked ${count} active session(s) for recovery on restart`);
    }
  } catch (err) {
    console.error("[ShadowGuardian] Shutdown annotation failed:", err);
  }
}

```

---

### aiAmRecall.ts (285 lines)
File: `server/webhooks/aiAmRecall.ts`

```typescript
import { Router, Request, Response } from "express";
import {getDb, rawSql } from "../db";
import { complianceViolations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { detectViolation, createViolationAlert } from "../_core/compliance";
import { publishAlertToAbly } from "../_core/aiAmAblyChannels";
import { isDuplicate, cacheViolation } from "../_core/aiAmDeduplication";

const router = Router();

/**
 * Recall.ai Webhook Handler for AI-AM
 * Processes transcript segments in real-time and detects compliance violations
 */

interface RecallTranscriptSegment {
  id: string;
  speaker_name?: string;
  speaker_role?: string;
  text: string;
  start_time_ms?: number;
  end_time_ms?: number;
  confidence?: number;
  language?: string;
}

interface RecallWebhookPayload {
  event_type: "transcript_segment" | "transcript_complete" | "bot_status_update";
  bot_id: string;
  meeting_id: string;
  meeting_url?: string;
  timestamp: string;
  data: {
    segment?: RecallTranscriptSegment;
    segments?: RecallTranscriptSegment[];
    status?: string;
    error?: string;
  };
}

/**
 * POST /api/webhooks/recall/ai-am
 * Receive transcript segments from Recall.ai and process for compliance violations
 */
router.post("/api/webhooks/recall/ai-am", async (req: Request, res: Response) => {
  try {
    const payload: RecallWebhookPayload = req.body;

    console.log("[AI-AM Recall Webhook] Received event:", {
      eventType: payload.event_type,
      botId: payload.bot_id,
      meetingId: payload.meeting_id,
      timestamp: payload.timestamp,
    });

    const isValid = verifyRecallWebhookSignature(req);
    if (!isValid) {
      console.warn("[AI-AM Recall Webhook] Invalid signature — rejecting request");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Get event ID from Recall bot ID
    const eventId = await getEventIdFromRecallBot(payload.bot_id);
    if (!eventId) {
      console.warn("[AI-AM Recall Webhook] No event found for bot:", payload.bot_id);
      return res.status(404).json({ error: "Event not found" });
    }

    // Handle different event types
    switch (payload.event_type) {
      case "transcript_segment":
        await handleTranscriptSegment(payload, eventId);
        break;

      case "transcript_complete":
        await handleTranscriptComplete(payload, eventId);
        break;

      case "bot_status_update":
        await handleBotStatusUpdate(payload, eventId);
        break;

      default:
        console.warn("[AI-AM Recall Webhook] Unknown event type:", payload.event_type);
    }

    // Return 200 OK to acknowledge receipt
    res.json({ success: true, processed: true });
  } catch (error) {
    console.error("[AI-AM Recall Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle individual transcript segment
 */
async function handleTranscriptSegment(payload: RecallWebhookPayload, eventId: string) {
  const segment = payload.data.segment;
  if (!segment) return;

  console.log("[AI-AM] Processing transcript segment:", {
    speaker: segment.speaker_name,
    textLength: segment.text.length,
  });

  try {
    // Detect violations in the segment
    const violation = await detectViolation(
      segment.text,
      segment.speaker_name,
      segment.speaker_role
    );

    if (!violation) {
      console.log("[AI-AM] No violations detected in segment");
      return;
    }

    // Check for duplicates
    if (isDuplicate(eventId, segment.speaker_name || "Unknown", violation.violationType, segment.text)) {
      console.log("[AI-AM] Duplicate violation detected, skipping");
      return;
    }

    // Create violation record
    const violationRecord = await createViolationAlert(
      eventId,
      undefined, // conferenceId not available from Recall webhook
      violation,
      segment.speaker_name,
      segment.speaker_role,
      segment.text,
      segment.start_time_ms,
      segment.end_time_ms
    );

    // Cache for deduplication
    cacheViolation(
      eventId,
      violationRecord.id,
      segment.speaker_name || "Unknown",
      violation.violationType,
      segment.text
    );

    // Publish to Ably for real-time updates
    await publishAlertToAbly({
      violationId: violationRecord.id,
      eventId,
      conferenceId: payload.meeting_id,
      violationType: violation.violationType,
      severity: violation.severity,
      confidenceScore: violation.confidenceScore,
      speakerName: segment.speaker_name,
      speakerRole: segment.speaker_role,
      transcriptExcerpt: segment.text,
      startTimeMs: segment.start_time_ms,
      endTimeMs: segment.end_time_ms,
      detectedAt: new Date().toISOString(),
    });

    console.log("[AI-AM] Violation detected and published:", {
      violationId: violationRecord.id,
      type: violation.violationType,
      severity: violation.severity,
    });
  } catch (error) {
    console.error("[AI-AM] Error processing transcript segment:", error);
  }
}

/**
 * Handle transcript completion
 */
async function handleTranscriptComplete(payload: RecallWebhookPayload, eventId: string) {
  console.log("[AI-AM] Transcript complete for event:", eventId);

  try {
    const db = await getDb();
    if (!db) {
      console.error("[AI-AM] Database unavailable for transcript complete");
      return;
    }
    // Get all violations for this event
    const violations = await db.select().from(complianceViolations).where(eq(complianceViolations.eventId, eventId));

    // Generate summary
    const summary = {
      totalViolations: violations.length,
      unreviewed: violations.filter((v: any) => !v.reviewedAt).length,
      bySeverity: {
        high: violations.filter((v: any) => v.severity === "high").length,
        medium: violations.filter((v: any) => v.severity === "medium").length,
        low: violations.filter((v: any) => v.severity === "low").length,
      },
    };

    console.log("[AI-AM] Transcript summary:", summary);

    // Publish summary to Ably
    await publishAlertToAbly({
      violationId: 0,
      eventId,
      violationType: "system",
      severity: "low",
      confidenceScore: 1.0,
      transcriptExcerpt: JSON.stringify(summary),
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI-AM] Error handling transcript complete:", error);
  }
}

/**
 * Handle bot status updates
 */
async function handleBotStatusUpdate(payload: RecallWebhookPayload, eventId: string) {
  console.log("[AI-AM] Bot status update:", {
    status: payload.data.status,
    error: payload.data.error,
  });

  if (payload.data.error) {
    console.error("[AI-AM] Bot error:", payload.data.error);
    // Publish error to Ably
    await publishAlertToAbly({
      violationId: 0,
      eventId,
      violationType: "system_error",
      severity: "high",
      confidenceScore: 1.0,
      transcriptExcerpt: payload.data.error,
      detectedAt: new Date().toISOString(),
    });
  }
}

async function getEventIdFromRecallBot(botId: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const { recallBots, shadowSessions } = await import("../../drizzle/schema");
    const [bot] = await db.select({ id: recallBots.id }).from(recallBots).where(eq(recallBots.recallBotId, botId)).limit(1);
    if (!bot) return null;
    const { sql: sqlHelper } = await import("drizzle-orm");
    const [rows] = await rawSql(
      `SELECT id FROM shadow_sessions WHERE recall_bot_id = ? LIMIT 1`,
      [botId]
    );
    const row = (rows as any[])?.[0];
    return row ? `shadow-${row.id}` : null;
  } catch (error) {
    console.error("[AI-AM] Error getting event ID from bot:", error);
    return null;
  }
}

function verifyRecallWebhookSignature(req: Request): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[AI-AM Recall Webhook] No webhook secret configured — allowing request in dev mode");
    return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  }

  const signature = req.headers["x-recall-signature"] || req.headers["x-webhook-signature"];
  if (!signature) {
    console.warn("[AI-AM Recall Webhook] No signature header present");
    return false;
  }

  try {
    const crypto = require("crypto");
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const provided = Array.isArray(signature) ? signature[0] : signature;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch (err) {
    console.error("[AI-AM Recall Webhook] Signature verification error:", err);
    return false;
  }
}

export default router;

```

---

### ShadowMode.tsx (4220 lines)
File: `client/src/pages/ShadowMode.tsx`

```typescript
// @ts-nocheck
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import {
  Radio, Play, Square, Eye, EyeOff,
  Activity, Shield, Users, MessageSquare, Tag,
  CheckCircle2, AlertTriangle, Clock, Loader2,
  Building2, RefreshCw, BarChart3, FileText,
  Upload, Database, ChevronRight, BarChart2,
  Mic, FileAudio, Globe, Copy,
  Info,
  Sparkles, Target, UserCheck, HelpCircle, ListChecks,
  TrendingUp, Swords, Lightbulb, ChevronDown, ChevronUp,
  Brain, Gauge, ShieldAlert, LineChart, Banknote, Leaf,
  Newspaper, Share2, Briefcase, Send,
  Zap, Network, Download, Video, ExternalLink, Trash2,
  FolderOpen, FolderClosed, CheckSquare, MessageCircle,
} from "lucide-react";
import LocalAudioCapture from "@/components/LocalAudioCapture";
import AIDashboard from "@/components/AIDashboard";
import SystemDiagnostics from "@/components/SystemDiagnostics";
import LiveQaDashboard from "@/components/LiveQaDashboard";
import LiveSessionPanel from "@/components/LiveSessionPanel";

const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom", teams: "Microsoft Teams", meet: "Google Meet", webex: "Cisco Webex", choruscall: "Chorus Call", other: "Other",
};

const RECALL_SUPPORTED_PLATFORMS = new Set(["zoom", "teams", "meet", "webex"]);

function detectPlatformFromUrl(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("choruscall.com")) return "choruscall";
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) return "zoom";
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) return "teams";
  if (lower.includes("meet.google.com")) return "meet";
  if (lower.includes("webex.com")) return "webex";
  return null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  earnings_call: "Earnings Call", interim_results: "Interim Results", annual_results: "Annual Results", results_call: "Results Call", media_call: "Media Call", analyst_call: "Analyst Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
  ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast",
  investor_day: "Investor Day", roadshow: "Roadshow", special_call: "Special Call",
  ipo_roadshow: "IPO Roadshow", ipo_listing: "IPO Listing", pre_ipo: "Pre-IPO",
  manda_call: "M&A Deal Call", takeover_announcement: "Takeover Announcement", merger_announcement: "Merger Announcement", scheme_of_arrangement: "Scheme of Arrangement",
  credit_rating_call: "Credit Rating Call", bondholder_meeting: "Bondholder Meeting", debt_restructuring: "Debt Restructuring",
  proxy_contest: "Proxy Contest", activist_meeting: "Activist Meeting", extraordinary_general_meeting: "Extraordinary General Meeting",
  other: "Other",
};

const ARCHIVE_PLATFORMS = ["Zoom", "Microsoft Teams", "Google Meet", "Webex", "In-Person", "Audio", "Other"];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",     color: "text-slate-400 bg-slate-400/10 border-slate-400/20",      dot: "bg-slate-400",                      icon: Clock },
  bot_joining: { label: "Bot Joining", color: "text-amber-400 bg-amber-400/10 border-amber-400/20",      dot: "bg-amber-400 animate-pulse",        icon: Loader2 },
  live:        { label: "Live",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400 animate-pulse",      icon: Radio },
  processing:  { label: "Processing",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",         dot: "bg-blue-400 animate-pulse",          icon: Loader2 },
  completed:   { label: "Completed",   color: "text-violet-400 bg-violet-400/10 border-violet-400/20",   dot: "bg-violet-400",                     icon: CheckCircle2 },
  failed:      { label: "Failed",      color: "text-red-400 bg-red-400/10 border-red-400/20",            dot: "bg-red-400",                        icon: AlertTriangle },
};

type SessionStatus = "pending" | "bot_joining" | "live" | "processing" | "completed" | "failed";

function SessionCard({ session, onSelect, isSelected }: {
  session: { id: number; clientName: string; eventName: string; eventType: string; platform: string; status: string; transcriptSegments: number | null; taggedMetricsGenerated: number | null; sentimentAvg: number | null; createdAt: Date };
  onSelect: () => void;
  isSelected: boolean;
}) {
  const s = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
  return (
    <button onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
        ? "border-violet-500/50 bg-violet-500/10"
        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{session.eventName}</div>
          <div className="text-xs text-slate-500 truncate">{session.clientName}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${s.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span>{EVENT_TYPE_LABELS[session.eventType] ?? session.eventType}</span>
        <span>·</span>
        <span>{PLATFORM_LABELS[session.platform] ?? session.platform}</span>
        {session.taggedMetricsGenerated != null && session.taggedMetricsGenerated > 0 && (
          <><span>·</span><span className="text-violet-400">{session.taggedMetricsGenerated} metrics</span></>
        )}
      </div>
    </button>
  );
}

type ArchiveResult = {
  archiveId: number;
  eventId: string;
  eventTitle: string;
  wordCount: number;
  segmentCount: number;
  sentimentAvg: number;
  complianceFlags: number;
  metricsGenerated: number;
  message: string;
};

function OperatorNotesPanel({ sessionId }: { sessionId: number }) {
  const [noteText, setNoteText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const notesQuery = trpc.shadowMode.getNotes.useQuery({ sessionId });
  const addNote = trpc.shadowMode.addNote.useMutation({
    onSuccess: () => { notesQuery.refetch(); setNoteText(""); setIsAdding(false); toast.success("Note saved"); },
    onError: (err: any) => toast.error("Failed to save note: " + err.message),
  });
  const deleteNote = trpc.shadowMode.deleteNote.useMutation({
    onSuccess: () => { notesQuery.refetch(); toast.success("Note removed"); },
  });

  const notes: Array<{ id: string; text: string; createdAt: string }> = notesQuery.data ?? [];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Operator Notes</span>
          {notes.length > 0 && <span className="text-xs text-slate-500">({notes.length})</span>}
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors">
          {isAdding ? "Cancel" : "+ Add Note"}
        </button>
      </div>
      {isAdding && (
        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add operator observation, flag, or instruction..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-amber-500/30" rows={3} />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => addNote.mutate({ sessionId, text: noteText })} disabled={!noteText.trim() || addNote.isPending} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30">
              {addNote.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
              Save Note
            </Button>
          </div>
        </div>
      )}
      {notes.length === 0 && !isAdding ? (
        <div className="p-6 text-center text-slate-600 text-sm">No notes yet — add observations during the session</div>
      ) : (
        <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
          {notes.map(note => (
            <div key={note.id} className="px-5 py-3 flex items-start gap-3 group">
              <div className="flex-1">
                <p className="text-sm text-slate-300">{note.text}</p>
                <span className="text-xs text-slate-600">{new Date(note.createdAt).toLocaleTimeString()}</span>
              </div>
              <button onClick={() => deleteNote.mutate({ sessionId, noteId: note.id })} aria-label={`Delete note ${note.id}`} className="opacity-40 hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OperatorActionLogPanel({ sessionId }: { sessionId: number }) {
  const [expanded, setExpanded] = useState(false);
  const actionLog = trpc.shadowMode.getActionLog.useQuery({ sessionId, limit: 50 }, { refetchInterval: 5000 });

  const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    session_started: { icon: Play, color: "text-emerald-400" },
    session_ended: { icon: Square, color: "text-red-400" },
    note_created: { icon: FileText, color: "text-amber-400" },
    note_deleted: { icon: Trash2, color: "text-slate-500" },
    question_approve: { icon: CheckCircle2, color: "text-emerald-400" },
    question_reject: { icon: AlertTriangle, color: "text-red-400" },
    question_hold: { icon: Clock, color: "text-amber-400" },
    question_legal_review: { icon: Shield, color: "text-orange-400" },
    question_send_to_speaker: { icon: Send, color: "text-blue-400" },
    question_answered: { icon: MessageCircle, color: "text-violet-400" },
    export_generated: { icon: Download, color: "text-blue-400" },
  };

  const actions = actionLog.data ?? [];
  const visibleActions = expanded ? actions : actions.slice(0, 5);

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-slate-200">Action Log</span>
        {actions.length > 0 && <span className="text-xs text-slate-500">({actions.length})</span>}
      </div>
      {actions.length === 0 ? (
        <div className="p-6 text-center text-slate-600 text-sm">
          {actionLog.isLoading ? "Loading..." : "No actions recorded yet"}
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {visibleActions.map((action: any) => {
              const cfg = ACTION_ICONS[action.actionType] ?? { icon: Zap, color: "text-slate-400" };
              const Icon = cfg.icon;
              return (
                <div key={action.id} className="px-5 py-2.5 flex items-start gap-3">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{action.detail || action.actionType.replace(/_/g, " ")}</p>
                    <span className="text-xs text-slate-600">{new Date(action.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {actions.length > 5 && (
            <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-white/5 flex items-center justify-center gap-1 transition-colors">
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show {actions.length - 5} more</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SessionHandoffPanel({ sessionId, clientName, eventName }: { sessionId: number; clientName: string; eventName: string }) {
  const handoff = trpc.shadowMode.getHandoffPackage.useQuery({ sessionId });
  const exportCsv = trpc.shadowMode.exportSession.useQuery({ sessionId, format: "csv" }, { enabled: false });
  const exportJson = trpc.shadowMode.exportSession.useQuery({ sessionId, format: "json" }, { enabled: false });
  const exportPdf = trpc.shadowMode.exportSession.useQuery({ sessionId, format: "pdf" }, { enabled: false });

  const generatePdfHtml = (data: any): string => {
    const d = JSON.parse(data.content);
    const s = d.session;
    const escHtml = (t: string) => t?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "";
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CuraLive Session Report</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:40px;color:#1a1a2e;line-height:1.6}
h1{color:#6d28d9;font-size:22px;margin-bottom:4px}h2{color:#4c1d95;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:28px}
.meta{color:#6b7280;font-size:13px;margin-bottom:20px}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.badge-green{background:#d1fae5;color:#065f46}.badge-amber{background:#fef3c7;color:#92400e}.badge-red{background:#fee2e2;color:#991b1b}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}th{background:#f3f4f6;text-align:left;padding:8px 10px;border:1px solid #e5e7eb}
td{padding:8px 10px;border:1px solid #e5e7eb;vertical-align:top}.section{margin-bottom:24px}
.compliance-flag{background:#fef2f2;border-left:3px solid #ef4444;padding:8px 12px;margin:4px 0;font-size:13px}
.summary-box{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:12px 0}
@media print{body{margin:20px}}</style></head><body>`;
    html += `<h1>CuraLive Session Report</h1>`;
    html += `<div class="meta">${escHtml(s.clientName)} — ${escHtml(s.eventName)}<br>`;
    html += `Type: ${escHtml(s.eventType)} | Platform: ${escHtml(s.platform)} | Status: <span class="badge ${s.status === "completed" ? "badge-green" : "badge-amber"}">${escHtml(s.status)}</span><br>`;
    if (s.startedAt) html += `Started: ${new Date(s.startedAt).toLocaleString()} | `;
    if (s.endedAt) html += `Ended: ${new Date(s.endedAt).toLocaleString()} | `;
    html += `Duration: ${escHtml(s.duration)}<br>`;
    if (s.meetingUrl) html += `Meeting: <a href="${escHtml(s.meetingUrl)}">${escHtml(s.meetingUrl)}</a><br>`;
    if (s.recordingUrl) html += `Recording: <a href="${escHtml(s.recordingUrl)}">Download</a><br>`;
    html += `Exported: ${new Date(s.exportedAt).toLocaleString()}</div>`;

    if (d.aiReport?.executiveSummary) {
      html += `<h2>Executive Summary</h2><div class="summary-box">${escHtml(d.aiReport.executiveSummary)}</div>`;
    }
    if (d.aiReport?.sentimentAnalysis) {
      const sa = d.aiReport.sentimentAnalysis;
      html += `<h2>Sentiment Analysis</h2><p><strong>Score:</strong> ${sa.score ?? "N/A"}/100</p>`;
      if (sa.narrative) html += `<p>${escHtml(sa.narrative)}</p>`;
    }
    if (d.aiReport?.complianceReview) {
      const cr = d.aiReport.complianceReview;
      html += `<h2>Compliance Review</h2><p><strong>Risk Level:</strong> <span class="badge ${cr.riskLevel === "low" ? "badge-green" : cr.riskLevel === "high" ? "badge-red" : "badge-amber"}">${escHtml(cr.riskLevel)}</span></p>`;
      if (cr.flaggedPhrases?.length) {
        html += cr.flaggedPhrases.map((f: string) => `<div class="compliance-flag">${escHtml(f)}</div>`).join("");
      }
    }
    if (d.aiReport?.keyTopics) {
      html += `<h2>Key Topics</h2><ul>`;
      const topics = Array.isArray(d.aiReport.keyTopics) ? d.aiReport.keyTopics : [d.aiReport.keyTopics];
      topics.forEach((t: any) => { html += `<li>${escHtml(typeof t === "string" ? t : JSON.stringify(t))}</li>`; });
      html += `</ul>`;
    }
    if (d.aiReport?.riskFactors) {
      html += `<h2>Risk Factors</h2><ul>`;
      const risks = Array.isArray(d.aiReport.riskFactors) ? d.aiReport.riskFactors : [d.aiReport.riskFactors];
      risks.forEach((r: any) => { html += `<li>${escHtml(typeof r === "string" ? r : JSON.stringify(r))}</li>`; });
      html += `</ul>`;
    }
    if (d.aiReport?.actionItems) {
      html += `<h2>Action Items</h2><ul>`;
      const items = Array.isArray(d.aiReport.actionItems) ? d.aiReport.actionItems : [d.aiReport.actionItems];
      items.forEach((a: any) => { html += `<li>${escHtml(typeof a === "string" ? a : JSON.stringify(a))}</li>`; });
      html += `</ul>`;
    }

    if (d.transcript?.length) {
      html += `<h2>Transcript (${d.transcript.length} segments)</h2><table><tr><th style="width:60px">Time</th><th style="width:100px">Speaker</th><th>Content</th></tr>`;
      d.transcript.forEach((seg: any) => {
        const mins = Math.floor((seg.timestamp || 0) / 60);
        const secs = Math.floor((seg.timestamp || 0) % 60);
        html += `<tr><td>${mins}:${String(secs).padStart(2, "0")}</td><td>${escHtml(seg.speaker)}</td><td>${escHtml(seg.text)}</td></tr>`;
      });
      html += `</table>`;
    }

    if (d.notes?.length) {
      html += `<h2>Operator Notes (${d.notes.length})</h2><table><tr><th style="width:160px">Time</th><th>Note</th></tr>`;
      d.notes.forEach((n: any) => {
        html += `<tr><td>${new Date(n.createdAt).toLocaleString()}</td><td>${escHtml(n.text)}</td></tr>`;
      });
      html += `</table>`;
    }

    if (d.actionLog?.length) {
      html += `<h2>Action Log (${d.actionLog.length} entries)</h2><table><tr><th style="width:160px">Time</th><th style="width:100px">Operator</th><th style="width:120px">Action</th><th>Detail</th></tr>`;
      d.actionLog.forEach((a: any) => {
        html += `<tr><td>${new Date(a.createdAt).toLocaleString()}</td><td>${escHtml(a.operatorName || "")}</td><td>${escHtml(a.actionType)}</td><td>${escHtml(a.detail || "")}</td></tr>`;
      });
      html += `</table>`;
    }

    if (!d.aiReport) {
      html += `<h2>Compliance Review</h2><div class="summary-box" style="background:#fef2f2;border-color:#fca5a5">No AI report was generated for this session. Compliance review is not available. Re-run the intelligence pipeline when transcript data is available.</div>`;
    }

    html += `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;text-align:center">Generated by CuraLive Operator Console</div>`;
    html += `</body></html>`;
    return html;
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    try {
      const result = format === "csv" ? await exportCsv.refetch() : format === "json" ? await exportJson.refetch() : await exportPdf.refetch();
      if (result.data) {
        if (format === "pdf") {
          const pdfHtml = generatePdfHtml(result.data);
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(pdfHtml);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
            toast.success("PDF report opened — use Print > Save as PDF");
          } else {
            const blob = new Blob([pdfHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = result.data.filename.replace(".pdf", ".html");
            a.click();
            URL.revokeObjectURL(url);
            toast.success("HTML report downloaded — open and print to PDF");
          }
        } else {
          const blob = new Blob([result.data.content], { type: result.data.contentType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.data.filename;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`${format.toUpperCase()} exported`);
        }
      }
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const pkg = handoff.data;

  if (handoff.isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Building handoff package...</p>
      </div>
    );
  }

  if (!pkg) return null;

  const readinessPercent = Math.round((pkg.readiness.score / pkg.readiness.maxScore) * 100);

  return (
    <div className="bg-white/[0.02] border border-violet-500/20 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Briefcase className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">Session Handoff Package</div>
            <div className="text-xs text-slate-500">{clientName} — {eventName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-1 rounded-lg border ${readinessPercent >= 75 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : readinessPercent >= 50 ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
            {readinessPercent}% ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
        <ReadinessItem label="Transcript" ready={pkg.readiness.hasTranscript} detail={`${pkg.transcript.wordCount} words`} />
        <ReadinessItem label="Recording" ready={pkg.readiness.hasRecording} />
        <ReadinessItem label="AI Report" ready={pkg.readiness.hasAiReport} />
        <ReadinessItem label="Notes" ready={pkg.readiness.hasNotes} detail={`${pkg.notes.length} notes`} />
      </div>

      {pkg.aiReport?.executiveSummary && (
        <div className="px-5 pb-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Executive Summary</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{pkg.aiReport.executiveSummary}</p>
          </div>
        </div>
      )}

      {pkg.qaSummary.total > 0 && (
        <div className="px-5 pb-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Q&A Summary</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-400">{pkg.qaSummary.approved} approved</span>
              <span className="text-red-400">{pkg.qaSummary.rejected} rejected</span>
              <span className="text-amber-400">{pkg.qaSummary.held} held</span>
              {pkg.qaSummary.legalReview > 0 && <span className="text-orange-400">{pkg.qaSummary.legalReview} legal</span>}
              {pkg.qaSummary.sentToSpeaker > 0 && <span className="text-blue-400">{pkg.qaSummary.sentToSpeaker} to speaker</span>}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 border-t border-white/5 flex flex-wrap gap-2">
        <button onClick={() => handleExport("csv")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors">
          <Download className="w-3 h-3" /> Export CSV
        </button>
        <button onClick={() => handleExport("json")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors">
          <Download className="w-3 h-3" /> Export JSON
        </button>
        <button onClick={() => handleExport("pdf")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors">
          <FileText className="w-3 h-3" /> Export PDF
        </button>
        {pkg.recording.url && (
          <a href={pkg.recording.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 transition-colors">
            <Video className="w-3 h-3" /> Download Recording
          </a>
        )}
      </div>
    </div>
  );
}

function ReadinessItem({ label, ready, detail }: { label: string; ready: boolean; detail?: string }) {
  return (
    <div className={`p-3 rounded-lg border ${ready ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.02] border-white/10"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {ready ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-slate-500" />}
        <span className={`text-xs font-medium ${ready ? "text-emerald-300" : "text-slate-500"}`}>{label}</span>
      </div>
      {detail && <span className="text-xs text-slate-600">{detail}</span>}
    </div>
  );
}

export default function ShadowMode({ embedded }: { embedded?: boolean } = {}) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (embedded) return;
    window.history.pushState(null, "", "/shadow-mode");
    const handlePopState = () => {
      navigate("/shadow-mode");
      window.history.pushState(null, "", "/shadow-mode");
    };
    window.addEventListener("popstate", handlePopState, true);
    return () => window.removeEventListener("popstate", handlePopState, true);
  }, [embedded]);

  // Tab state — support ?tab= URL param for direct linking
  const validTabs = ["live", "archive", "reports", "ailearning", "aidashboard", "advisory", "diagnostics", "liveqa"] as const;
  type TabType = typeof validTabs[number];
  const urlTab = new URLSearchParams(window.location.search).get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(urlTab && validTabs.includes(urlTab) ? urlTab : "live");


  // ── Live Intelligence state ────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [showLiveConsole, setShowLiveConsole] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [form, setForm] = useState({
    clientName: "", eventName: "",
    eventType: "earnings_call" as const,
    platform: "zoom" as const,
    meetingUrl: "", notes: "",
  });

  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 5000 });
  const activeSession = trpc.shadowMode.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: activeSessionId != null, refetchInterval: 3000 }
  );

  const startSession = trpc.shadowMode.startSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveSessionId(data.sessionId);
      setShowForm(false);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const retrySession = trpc.shadowMode.retrySession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessions.refetch();
      activeSession.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSession = trpc.shadowMode.deleteSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveSessionId(null);
      setConfirmDeleteId(null);
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  const deleteSessions = trpc.shadowMode.deleteSessions.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedSessionIds(new Set());
      setConfirmBulkDelete(false);
      if (activeSessionId && selectedSessionIds.has(activeSessionId)) {
        setActiveSessionId(null);
      }
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleSessionSelect = useCallback((id: number) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const groupedSessions = useMemo(() => {
    if (!sessions.data) return { active: [], completed: [], failed: [] };
    const active: typeof sessions.data = [];
    const completed: typeof sessions.data = [];
    const failed: typeof sessions.data = [];
    for (const s of sessions.data) {
      if (s.status === "live" || s.status === "bot_joining" || s.status === "pending" || s.status === "processing") {
        active.push(s);
      } else if (s.status === "completed") {
        completed.push(s);
      } else {
        failed.push(s);
      }
    }
    return { active, completed, failed };
  }, [sessions.data]);

  const liveSession = activeSession.data;
  const isLive = liveSession?.status === "live" || liveSession?.status === "bot_joining";

  const [realtimeSegments, setRealtimeSegments] = useState<Array<{ id?: string; speaker: string; text: string; timestamp: number; timeLabel?: string }>>([]);
  const ablyChannel = liveSession?.ablyChannel ?? "";

  useEffect(() => {
    setRealtimeSegments([]);
  }, [activeSessionId]);

  useEffect(() => {
    if (!ablyChannel || !isLive) return;
    let cancelled = false;
    let ablyClient: any = null;

    const connectAbly = async () => {
      try {
        const tokenRes = await fetch("/api/ably-token");
        if (!tokenRes.ok || cancelled) return;
        const tokenRequest = await tokenRes.json();
        if (cancelled) return;

        const { Realtime } = await import("ably");
        if (cancelled) return;

        ablyClient = new Realtime({ authCallback: (_data, cb) => cb(null, tokenRequest), autoConnect: true });
        const channel = ablyClient.channels.get(ablyChannel);
        channel.subscribe("curalive", (msg: any) => {
          try {
            const parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
            if (parsed.type === "transcript.segment" && parsed.data) {
              setRealtimeSegments(prev => [...prev, parsed.data]);
            }
          } catch {}
        });
      } catch (err) {
        console.warn("[Shadow] Ably subscription failed (falling back to polling):", err);
      }
    };

    connectAbly();
    return () => {
      cancelled = true;
      if (ablyClient) {
        try { ablyClient.close(); } catch {}
      }
    };
  }, [ablyChannel, isLive]);

  const polledSegments = liveSession?.transcriptSegments ?? [];
  const transcript = (() => {
    if (!Array.isArray(polledSegments)) return realtimeSegments;
    if (realtimeSegments.length > polledSegments.length) return realtimeSegments;
    return polledSegments;
  })();

  // ── Archive Upload state ───────────────────────────────────────────────────
  const [archiveForm, setArchiveForm] = useState({
    clientName: "", eventName: "", eventType: "", eventDate: "",
    platform: "", notes: "", transcriptText: "",
  });
  const [archiveInputMode, setArchiveInputMode] = useState<"paste" | "file" | "recording">("paste");
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null);
  const [archiveRecFile, setArchiveRecFile] = useState<File | null>(null);
  const [archiveTranscribing, setArchiveTranscribing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const archiveAudioRef = useRef<HTMLInputElement>(null);

  const processTranscript = trpc.archiveUpload.processTranscript.useMutation({
    onSuccess: (data) => {
      setArchiveResult(data);
      toast.success(data.message);
      archives.refetch();
    },
    onError: (err) => toast.error(err.message ?? "Processing failed. Please try again."),
  });

  const archives = trpc.archiveUpload.listArchives.useQuery();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchiveFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setArchiveForm(f => ({ ...f, transcriptText: (ev.target?.result as string) ?? "" }));
    };
    reader.readAsText(file);
  }

  function handleArchiveAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setArchiveRecFile(f);
      setArchiveFileName(f.name);
    }
  }

  async function handleArchiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!archiveForm.clientName.trim() || !archiveForm.eventName.trim() || !archiveForm.eventType) {
      toast.error("Please fill in Client Name, Event Name, and Event Type.");
      return;
    }

    let transcript = archiveForm.transcriptText.trim();
    let savedRecPath: string | null = null;

    let transcriptionStatus: "completed" | "quota_exceeded" | "failed" | undefined;
    let transcriptionError: string | undefined;

    if (archiveInputMode === "recording") {
      if (!archiveRecFile) {
        toast.error("Please select an audio or video recording to upload.");
        return;
      }
      setArchiveTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("file", archiveRecFile);
        toast.success("Uploading recording to Whisper AI for transcription...");
        const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          savedRecPath = data.savedRecordingPath || null;
          if (data.transcriptionStatus === "quota_exceeded" || !data.transcript?.trim()) {
            transcriptionStatus = "quota_exceeded" as const;
            transcriptionError = data.transcriptionError || "Transcription quota exceeded";
            transcript = "";
            toast.success("Recording saved. Transcription quota exceeded — you can retry later.");
          } else {
            transcript = data.transcript;
            transcriptionStatus = "completed" as const;
            setArchiveForm(f => ({ ...f, transcriptText: data.transcript }));
            toast.success(`Transcription complete — ${data.transcript.split(/\s+/).filter(Boolean).length.toLocaleString()} words`);
          }
        } else {
          const data = await res.json().catch(() => ({ error: "Transcription failed" }));
          const isQuota = res.status === 429 || data.code === "QUOTA_EXCEEDED";
          savedRecPath = data.savedRecordingPath || null;
          if (isQuota && savedRecPath) {
            transcriptionStatus = "quota_exceeded" as const;
            transcriptionError = data.error || "Transcription quota exceeded";
            transcript = "";
            toast.success("Recording saved. Transcription quota exceeded — you can retry later.");
          } else {
            throw new Error(isQuota
              ? "AI transcription quota exceeded. Please paste the transcript text manually, or retry later."
              : (data.error ?? "Transcription failed"));
          }
        }
      } catch (err: any) {
        toast.error(err.message ?? "Transcription failed");
        setArchiveTranscribing(false);
        return;
      }
      setArchiveTranscribing(false);
    }

    if (!transcript && !transcriptionStatus) {
      toast.error("No transcript available. Please paste text, upload a .txt file, or upload a recording.");
      return;
    }

    processTranscript.mutate({
      clientName: archiveForm.clientName.trim(),
      eventName: archiveForm.eventName.trim(),
      eventType: archiveForm.eventType as any,
      eventDate: archiveForm.eventDate || undefined,
      platform: archiveForm.platform || undefined,
      transcriptText: transcript,
      notes: archiveForm.notes || undefined,
      savedRecordingPath: savedRecPath || undefined,
      transcriptionStatus,
      transcriptionError,
    });
  }

  function resetArchive() {
    setArchiveResult(null);
    setArchiveForm({ clientName: "", eventName: "", eventType: "", eventDate: "", platform: "", notes: "", transcriptText: "" });
    setArchiveFileName(null);
    setArchiveRecFile(null);
    setArchiveTranscribing(false);
  }

  const archiveWordCount = archiveForm.transcriptText.trim().split(/\s+/).filter(Boolean).length;

  // ── Archives & Reports state ─────────────────────────────────────────────────
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(null);
  const [emailModalArchiveId, setEmailModalArchiveId] = useState<number | null>(null);
  const [emailForm, setEmailForm] = useState({ recipientEmail: "", recipientName: "" });
  const [checkedArchiveIds, setCheckedArchiveIds] = useState<Set<number>>(new Set());
  const toggleArchiveCheck = (id: number) => setCheckedArchiveIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAllArchives = (allIds: number[]) => setCheckedArchiveIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: selectedArchiveId! },
    { enabled: selectedArchiveId != null }
  );

  const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setEmailModalArchiveId(null);
        setEmailForm({ recipientEmail: "", recipientName: "" });
      } else {
        toast.error(data.message);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const generateReport = trpc.archiveUpload.generateReport.useMutation({
    onSuccess: () => {
      toast.success("AI report generated successfully");
      archiveDetail.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const ALL_REPORT_MODULES = [
    { id: "executiveSummary", label: "Executive Summary", icon: Sparkles },
    { id: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity },
    { id: "complianceReview", label: "Compliance Review", icon: Shield },
    { id: "keyTopics", label: "Key Topics", icon: Tag },
    { id: "speakerAnalysis", label: "Speaker Analysis", icon: UserCheck },
    { id: "questionsAsked", label: "Q&A Analysis", icon: HelpCircle },
    { id: "actionItems", label: "Action Items", icon: ListChecks },
    { id: "investorSignals", label: "Investor Signals", icon: Target },
    { id: "communicationScore", label: "Communication Score", icon: MessageSquare },
    { id: "riskFactors", label: "Risk Factors", icon: AlertTriangle },
    { id: "competitiveIntelligence", label: "Competitive Intel", icon: Swords },
    { id: "recommendations", label: "AI Recommendations", icon: Lightbulb },
    { id: "speakingPaceAnalysis", label: "Speaking Pace Coach", icon: Gauge },
    { id: "toxicityScreen", label: "Toxicity & Language Risk", icon: ShieldAlert },
    { id: "sentimentArc", label: "Sentiment Arc", icon: LineChart },
    { id: "financialHighlights", label: "Financial Highlights", icon: Banknote },
    { id: "esgMentions", label: "ESG & Sustainability", icon: Leaf },
    { id: "pressReleaseDraft", label: "Press Release Draft", icon: Newspaper },
    { id: "socialMediaContent", label: "Social Media Content", icon: Share2 },
    { id: "boardReadySummary", label: "Board-Ready Summary", icon: Briefcase },
  ];

  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set(ALL_REPORT_MODULES.map(m => m.id)));
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const toggleModule = (id: string) => setSelectedModules(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // ── Event Recording state ──────────────────────────────────────────────────
  const [recForm, setRecForm] = useState({
    clientName: "", eventName: "",
    eventType: "earnings_call",
    eventDate: "", notes: "",
  });
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recStatus, setRecStatus] = useState<"idle" | "transcribing" | "processing" | "done" | "error">("idle");
  const [recResult, setRecResult] = useState<ArchiveResult | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setRecFile(f);
  }

  function handleAudioDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setRecFile(f);
  }

  const [dragOver, setDragOver] = useState(false);

  async function handleRecordingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recForm.clientName.trim() || !recForm.eventName.trim() || !recForm.eventType || !recFile) {
      toast.error("Please fill in all required fields and select an audio file.");
      return;
    }
    setRecStatus("transcribing");
    setRecError(null);
    try {
      const fd = new FormData();
      fd.append("file", recFile);
      const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
      let transcriptText = "";
      let savedRecordingPath: string | undefined;
      let tStatus: string | undefined;
      let tError: string | undefined;

      if (res.ok) {
        const data = await res.json();
        savedRecordingPath = data.savedRecordingPath || undefined;
        if (data.transcriptionStatus === "quota_exceeded" || !data.transcript?.trim()) {
          tStatus = "quota_exceeded";
          tError = data.transcriptionError || "Transcription quota exceeded";
          transcriptText = "";
          toast.success("Recording saved. Transcription quota exceeded — you can retry later.");
        } else {
          transcriptText = data.transcript;
          tStatus = "completed";
        }
      } else {
        const data = await res.json().catch(() => ({ error: "Transcription failed" }));
        const isQuota = res.status === 429 || data.code === "QUOTA_EXCEEDED";
        savedRecordingPath = data.savedRecordingPath || undefined;
        if (isQuota && savedRecordingPath) {
          tStatus = "quota_exceeded";
          tError = data.error || "Transcription quota exceeded";
          transcriptText = "";
          toast.success("Recording saved. Transcription quota exceeded — you can retry later.");
        } else {
          throw new Error(isQuota
            ? "AI transcription quota exceeded. Please try again later or upload a text transcript instead."
            : (data.error ?? "Transcription failed"));
        }
      }

      setRecStatus("processing");
      processTranscript.mutate({
        clientName: recForm.clientName.trim(),
        eventName: recForm.eventName.trim(),
        eventType: recForm.eventType as any,
        eventDate: recForm.eventDate || undefined,
        transcriptText,
        notes: recForm.notes || undefined,
        savedRecordingPath,
        transcriptionStatus: tStatus as any,
        transcriptionError: tError,
      }, {
        onSuccess: (data) => {
          setRecResult(data);
          setRecStatus("done");
          if (tStatus === "quota_exceeded") {
            toast.success("Recording saved — transcription can be retried later");
          } else {
            toast.success("Recording transcribed and processed successfully");
          }
          archives.refetch();
        },
        onError: (err) => {
          setRecError(err.message ?? "Processing failed");
          setRecStatus("error");
          toast.error(err.message ?? "Processing failed");
        },
      });
    } catch (err: any) {
      setRecError(err.message ?? "Transcription failed");
      setRecStatus("error");
      toast.error(err.message ?? "Transcription failed");
    }
  }

  function resetRecording() {
    setRecResult(null);
    setRecStatus("idle");
    setRecError(null);
    setRecFile(null);
    setRecForm({ clientName: "", eventName: "", eventType: "earnings_call", eventDate: "", notes: "" });
  }

  return (
    <div className={embedded ? "bg-[#0a0a0f] text-white" : "min-h-screen bg-[#0a0a0f] text-white"}>

      {/* Live Session Alert Banner — only shows when real live session exists (BUG-LC1 fix) */}
      {!showLiveConsole && liveSession && (liveSession.status === "live" || liveSession.status === "bot_joining") && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-400">
              Live Session Active — {liveSession.eventName} • {liveSession.attendeeCount ?? 0} attendees
            </span>
          </div>
          <Button
            onClick={() => setShowLiveConsole(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            Open Live Console
          </Button>
        </div>
      )}

      {/* Live Console Modal */}
      {showLiveConsole && (
        <LiveSessionPanel
          session={liveSession ? {
            id: liveSession.id,
            eventName: liveSession.eventName,
            status: liveSession.status === "bot_joining" ? "live" : (liveSession.status === "completed" || liveSession.status === "failed" ? "ended" : liveSession.status as "live" | "scheduled" | "ended"),
            startedAt: liveSession.startedAt ?? Date.now(),
            duration: liveSession.startedAt ? Math.floor((Date.now() - liveSession.startedAt) / 1000) : 0,
            attendeeCount: liveSession.attendeeCount ?? 0,
            connectivityProvider: (liveSession.connectivityProvider as any) ?? "webphone",
            providerStatus: "active",
          } : undefined}
          onClose={() => setShowLiveConsole(false)}
        />
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d14]">
        {!embedded && (
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h1 className="text-lg font-semibold">Shadow Mode</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Background Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                CuraLive runs silently — clients see nothing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => {
              if (activeTab !== "live") setActiveTab("live");
              setShowForm(true);
            }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-sm font-semibold px-5">
              <Play className="w-4 h-4" />
              New Live Event
            </Button>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "live"
                  ? "border-emerald-400 text-emerald-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Radio className="w-4 h-4" />
              Live Intelligence
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "archive"
                  ? "border-violet-400 text-violet-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Upload className="w-4 h-4" />
              Archive Upload
              {archives.data && archives.data.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                  {archives.data.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "reports"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <BarChart3 className="w-4 h-4" />
              Archives &amp; Reports
              {archives.data && archives.data.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                  {archives.data.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("aidashboard")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "aidashboard"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Brain className="w-4 h-4" />
              AI Dashboard
            </button>
            <button
              onClick={() => setActiveTab("ailearning")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "ailearning"
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Activity className="w-4 h-4" />
              AI Learning
            </button>
            <button
              onClick={() => setActiveTab("advisory")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "advisory"
                  ? "border-rose-400 text-rose-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <MessageCircle className="w-4 h-4" />
              AI Advisory
            </button>
            <button
              onClick={() => setActiveTab("liveqa")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "liveqa"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <MessageCircle className="w-4 h-4" />
              Live Q&A
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "diagnostics"
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <Shield className="w-4 h-4" />
              System Test
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════
            LIVE INTELLIGENCE TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "live" && (
          <>
            {!showForm && (
              <div className="bg-gradient-to-br from-emerald-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <EyeOff className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-slate-200">How do you want to capture this event?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setShowForm(true); }}
                    className="group bg-white/[0.02] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                        <Radio className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Join Live Event</div>
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Free — no call charges</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Paste a Zoom, Teams, or Meet link. An AI bot joins the meeting silently, transcribes in real time, and runs the full intelligence pipeline.
                    </p>
                    <div className="text-xs text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center gap-1">
                      <Play className="w-3 h-3" /> Start a new live session
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("archive"); setArchiveInputMode("recording" as any); }}
                    className="group bg-white/[0.02] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20">
                        <Mic className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Upload Recording</div>
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Audio or video file</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Upload an MP3, WAV, M4A, MP4, or MOV recording of a past event. Whisper AI transcribes, then the full 20-module AI report runs.
                    </p>
                    <div className="text-xs text-blue-400 font-medium group-hover:text-blue-300 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload a recording
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("archive"); setArchiveInputMode("paste" as any); }}
                    className="group bg-white/[0.02] hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 rounded-xl p-5 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/20">
                        <FileText className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Paste Transcript</div>
                        <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Text or .txt file</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Paste raw transcript text or upload a .txt file from any source. Runs sentiment analysis, compliance scanning, and the full AI report.
                    </p>
                    <div className="text-xs text-violet-400 font-medium group-hover:text-violet-300 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Submit a transcript
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-4 text-center">
                  Every input path runs all 20 AI modules and stores the intelligence in your database — building your data asset for every event.
                </p>
              </div>
            )}

            {/* New session form */}
            {showForm && (
              <div className="bg-white/[0.03] border border-emerald-500/20 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-slate-200 mb-5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" /> Start a New Shadow Intelligence Session
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      placeholder="e.g. Anglo American Platinum"
                      value={form.clientName}
                      onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      placeholder="e.g. Q4 2025 Earnings Call"
                      value={form.eventName}
                      onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      value={form.eventType}
                      onChange={e => setForm(f => ({ ...f, eventType: e.target.value as typeof form.eventType }))}>
                      {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Platform *</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PLATFORM_LABELS).map(([v, l]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, platform: v as typeof form.platform }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            form.platform === v
                              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200 hover:border-white/20"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Meeting URL * (Zoom / Teams / Meet / Webex / Chorus Call)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                      placeholder="https://zoom.us/j/... or https://hdeu.choruscall.com/..."
                      value={form.meetingUrl}
                      onChange={e => {
                        const url = e.target.value;
                        const detected = detectPlatformFromUrl(url);
                        setForm(f => ({
                          ...f,
                          meetingUrl: url,
                          ...(detected ? { platform: detected as typeof f.platform } : {}),
                        }));
                      }}
                    />
                    {form.platform && !RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <p className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>CuraLive will use <strong>Local Audio Capture</strong> — once the session starts, click "Start Local Audio Capture" and share the tab with the call. CuraLive transcribes and records everything in real-time.</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-1.5">The bot joins this meeting link as "CuraLive Intelligence" — a regular participant. No software needed on the client's side.</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1.5">Notes (optional)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      placeholder="Any context about this event..."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <Button
                    onClick={() => startSession.mutate({
                      ...form,
                      webhookBaseUrl: window.location.origin,
                    })}
                    disabled={startSession.isPending || !form.clientName || !form.eventName || !form.meetingUrl}
                    className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                    {startSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {startSession.isPending
                      ? (RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? "Deploying bot..." : "Starting session...")
                      : (RECALL_SUPPORTED_PLATFORMS.has(form.platform) ? "Start Shadow Intelligence" : "Start Local Capture Session")}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Session list — grouped into folders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Sessions ({sessions.data?.length ?? 0})
                  </h2>
                  {selectedSessionIds.size > 0 && (
                    <div className="flex items-center gap-1.5">
                      {confirmBulkDelete ? (
                        <>
                          <Button size="sm"
                            onClick={() => deleteSessions.mutate({ sessionIds: Array.from(selectedSessionIds) })}
                            disabled={deleteSessions.isPending}
                            className="bg-red-600 hover:bg-red-500 text-white gap-1 text-xs h-7 px-2">
                            {deleteSessions.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete {selectedSessionIds.size}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmBulkDelete(false)} className="text-slate-400 text-xs h-7 px-2">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost"
                            onClick={() => setConfirmBulkDelete(true)}
                            className="text-red-400 hover:text-red-300 gap-1 text-xs h-7 px-2">
                            <Trash2 className="w-3 h-3" />
                            Delete ({selectedSessionIds.size})
                          </Button>
                          <Button size="sm" variant="ghost"
                            onClick={() => setSelectedSessionIds(new Set())}
                            className="text-slate-500 text-xs h-7 px-2">
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {sessions.isLoading && <div className="text-slate-500 text-sm">Loading sessions...</div>}
                {sessions.data?.length === 0 && !sessions.isLoading && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center">
                    <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-sm text-slate-500">No sessions yet</div>
                    <div className="text-xs text-slate-600 mt-1">Start your first shadow session above</div>
                  </div>
                )}

                {[
                  { key: "active", label: "Active", sessions: groupedSessions.active, color: "text-emerald-400", dotColor: "bg-emerald-400", icon: Radio, canSelect: false },
                  { key: "completed", label: "Completed", sessions: groupedSessions.completed, color: "text-violet-400", dotColor: "bg-violet-400", icon: CheckCircle2, canSelect: true },
                  { key: "failed", label: "Failed", sessions: groupedSessions.failed, color: "text-red-400", dotColor: "bg-red-400", icon: AlertTriangle, canSelect: true },
                ].map(group => {
                  if (group.sessions.length === 0) return null;
                  const isCollapsed = collapsedGroups.has(group.key);
                  const GroupIcon = group.icon;
                  const allSelected = group.canSelect && group.sessions.every(s => selectedSessionIds.has(s.id));
                  const someSelected = group.canSelect && group.sessions.some(s => selectedSessionIds.has(s.id));

                  return (
                    <div key={group.key} className="space-y-1.5">
                      <button
                        onClick={() => toggleGroup(group.key)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                      >
                        {isCollapsed
                          ? <FolderClosed className={`w-4 h-4 ${group.color}`} />
                          : <FolderOpen className={`w-4 h-4 ${group.color}`} />
                        }
                        <span className={`text-xs font-semibold uppercase tracking-wider ${group.color}`}>
                          {group.label}
                        </span>
                        <span className="text-xs text-slate-600">({group.sessions.length})</span>
                        <div className="flex-1" />
                        {group.canSelect && !isCollapsed && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionIds(prev => {
                                const next = new Set(prev);
                                if (allSelected) {
                                  group.sessions.forEach(s => next.delete(s.id));
                                } else {
                                  group.sessions.forEach(s => next.add(s.id));
                                }
                                return next;
                              });
                            }}
                            className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                            title={allSelected ? "Deselect all" : "Select all"}
                          >
                            {allSelected
                              ? <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                              : someSelected
                                ? <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                                : <Square className="w-3.5 h-3.5" />
                            }
                          </span>
                        )}
                        {isCollapsed
                          ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                        }
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1.5 pl-1">
                          {group.sessions.map(session => (
                            <div key={session.id} className="flex items-start gap-1.5">
                              {group.canSelect && (
                                <button
                                  onClick={() => toggleSessionSelect(session.id)}
                                  className="mt-4 shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                  {selectedSessionIds.has(session.id)
                                    ? <CheckSquare className="w-4 h-4 text-violet-400" />
                                    : <Square className="w-4 h-4" />
                                  }
                                </button>
                              )}
                              <div className="flex-1">
                                <SessionCard
                                  session={session}
                                  onSelect={() => setActiveSessionId(session.id)}
                                  isSelected={activeSessionId === session.id}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active session detail */}
              <div className="lg:col-span-2">
                {activeSessionId == null ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <div className="text-slate-500 text-sm">Select a session to view live intelligence</div>
                    <div className="text-slate-600 text-xs mt-1">Or start a new session to begin collecting data</div>
                  </div>
                ) : activeSession.isLoading ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-spin" />
                    <div className="text-slate-500 text-sm">Loading session...</div>
                  </div>
                ) : liveSession ? (() => {
                  const s = STATUS_CONFIG[liveSession.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = s.icon;
                  const isActive = liveSession.status === "live" || liveSession.status === "bot_joining";
                  const duration = liveSession.startedAt
                    ? Math.floor((Date.now() - liveSession.startedAt) / 1000 / 60)
                    : 0;

                  return (
                    <div className="space-y-4">
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h2 className="text-base font-semibold text-slate-200">{liveSession.eventName}</h2>
                              <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${s.color}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{liveSession.clientName}</span>
                              <span>·</span>
                              <span>{EVENT_TYPE_LABELS[liveSession.eventType]}</span>
                              <span>·</span>
                              <span>{PLATFORM_LABELS[liveSession.platform]}</span>
                              {liveSession.startedAt && (
                                <><span>·</span><span>{duration}m elapsed</span></>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="sm"
                              onClick={() => activeSession.refetch()}
                              className="text-slate-400 hover:text-white">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            {isActive && (
                              <Button size="sm"
                                onClick={() => endSession.mutate({ sessionId: liveSession.id })}
                                disabled={endSession.isPending}
                                className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/20 gap-1.5">
                                {endSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                                End Session
                              </Button>
                            )}
                            {liveSession.status === "failed" && RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) && (
                              <Button size="sm"
                                onClick={() => retrySession.mutate({ sessionId: liveSession.id })}
                                disabled={retrySession.isPending}
                                className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/20 gap-1.5">
                                {retrySession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                                {retrySession.isPending ? "Retrying..." : "Retry Bot Join"}
                              </Button>
                            )}
                            {(liveSession.status === "completed" || liveSession.status === "failed") && (
                              confirmDeleteId === liveSession.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm"
                                    onClick={() => deleteSession.mutate({ sessionId: liveSession.id })}
                                    disabled={deleteSession.isPending}
                                    className="bg-red-600 hover:bg-red-500 text-white gap-1.5">
                                    {deleteSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Confirm Delete
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="text-slate-400">
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost"
                                  onClick={() => setConfirmDeleteId(liveSession.id)}
                                  className="text-slate-500 hover:text-red-400 gap-1.5">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Transcript Segments", value: Array.isArray(liveSession.transcriptSegments) ? liveSession.transcriptSegments.length : ((liveSession.transcriptSegments as unknown as number) ?? 0), icon: MessageSquare, color: "text-blue-400" },
                          { label: "Avg Sentiment", value: liveSession.sentimentAvg != null ? `${Math.round(liveSession.sentimentAvg)}%` : "—", icon: Activity, color: "text-emerald-400" },
                          { label: "Compliance Flags", value: liveSession.complianceFlags ?? 0, icon: Shield, color: "text-amber-400" },
                          { label: "Metrics Generated", value: liveSession.taggedMetricsGenerated ?? 0, icon: Tag, color: "text-violet-400" },
                        ].map(stat => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                              <Icon className={`w-4 h-4 ${stat.color} mb-2`} />
                              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                              <div className="text-xs text-slate-600 mt-0.5">{stat.label}</div>
                            </div>
                          );
                        })}
                      </div>

                      {liveSession.status === "bot_joining" && (
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-amber-300">CuraLive Intelligence is joining the meeting</div>
                            <div className="text-xs text-slate-500 mt-0.5">The bot will appear as a participant within 30–60 seconds. Transcription starts automatically once it joins.</div>
                          </div>
                        </div>
                      )}

                      {liveSession.status === "failed" && (
                        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-red-300">
                              {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) ? "Bot failed to join the meeting" : "Session failed to start"}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform)
                                ? "The meeting may have ended, the URL may be invalid, or the bot was blocked. You can retry if the meeting is still active."
                                : "Something went wrong starting this session. Please create a new session to try again."}
                            </div>
                          </div>
                          {RECALL_SUPPORTED_PLATFORMS.has(liveSession.platform) && (
                            <Button size="sm"
                              onClick={() => retrySession.mutate({ sessionId: liveSession.id })}
                              disabled={retrySession.isPending}
                              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/20 gap-1.5 shrink-0">
                              {retrySession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                              {retrySession.isPending ? "Retrying..." : "Retry"}
                            </Button>
                          )}
                        </div>
                      )}

                      {liveSession.status === "completed" && liveSession.taggedMetricsGenerated != null && liveSession.taggedMetricsGenerated > 0 && (
                        <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-violet-300">Intelligence collection complete</div>
                            <div className="text-xs text-slate-500 mt-0.5">{liveSession.taggedMetricsGenerated} records added to your Tagged Metrics database.</div>
                          </div>
                        </div>
                      )}

                      {liveSession.status === "completed" && (() => {
                        const report = (liveSession as any).aiReport;
                        if (!report) {
                          return (
                            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Brain className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm text-slate-400">No AI report generated yet</span>
                                </div>
                                <span className="text-xs text-slate-600">AI report is generated automatically when transcript data is available</span>
                              </div>
                            </div>
                          );
                        }

                        const reportSections = [
                          { key: "executiveSummary", label: "Executive Summary", icon: FileText },
                          { key: "complianceReview", label: "Compliance Review", icon: Shield },
                          { key: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity },
                          { key: "keyTopics", label: "Key Topics", icon: Tag },
                          { key: "questionAnalysis", label: "Question Analysis", icon: MessageSquare },
                          { key: "riskFactors", label: "Risk Factors", icon: AlertTriangle },
                          { key: "actionItems", label: "Action Items", icon: CheckCircle2 },
                          { key: "investorInsights", label: "Investor Insights", icon: BarChart3 },
                        ].filter(s => report[s.key]);

                        const downloadReport = () => {
                          let text = `AI INTELLIGENCE REPORT\n${liveSession.clientName} — ${liveSession.eventName}\nGenerated: ${new Date().toLocaleString()}\n${"=".repeat(60)}\n\n`;
                          for (const section of reportSections) {
                            const content = report[section.key];
                            text += `\n${"─".repeat(40)}\n${section.label.toUpperCase()}\n${"─".repeat(40)}\n`;
                            if (typeof content === "string") {
                              text += content + "\n";
                            } else if (Array.isArray(content)) {
                              content.forEach((item: any, i: number) => {
                                text += typeof item === "string" ? `  ${i + 1}. ${item}\n` : `  ${i + 1}. ${JSON.stringify(item)}\n`;
                              });
                            } else if (typeof content === "object") {
                              text += JSON.stringify(content, null, 2) + "\n";
                            }
                          }
                          const blob = new Blob([text], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${liveSession.clientName}_${liveSession.eventName}_AI_Report.txt`.replace(/\s+/g, "_");
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("AI Report downloaded");
                        };

                        const downloadJson = () => {
                          const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${liveSession.clientName}_${liveSession.eventName}_AI_Report.json`.replace(/\s+/g, "_");
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("AI Report JSON downloaded");
                        };

                        return (
                          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-violet-400" />
                                <span className="text-sm text-slate-300 font-medium">AI Intelligence Report</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">{reportSections.length} sections</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={downloadReport}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors">
                                  <Download className="w-3 h-3" />
                                  Download .txt
                                </button>
                                <button onClick={downloadJson}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors">
                                  <Download className="w-3 h-3" />
                                  Download .json
                                </button>
                              </div>
                            </div>
                            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                              {reportSections.map(section => {
                                const Icon = section.icon;
                                const content = report[section.key];
                                return (
                                  <details key={section.key} className="group">
                                    <summary className="px-5 py-3 flex items-center gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors">
                                      <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                      <span className="text-sm text-slate-300">{section.label}</span>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-600 ml-auto group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                                      {typeof content === "string" ? content
                                        : Array.isArray(content) ? content.map((item: any, i: number) => (
                                          <div key={i} className="flex gap-2 mb-1">
                                            <span className="text-slate-600 shrink-0">{i + 1}.</span>
                                            <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
                                          </div>
                                        ))
                                        : <pre className="text-xs font-mono text-slate-500">{JSON.stringify(content, null, 2)}</pre>
                                      }
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const recUrl = (liveSession as any).recordingUrl;
                        const bStatus = (liveSession as any).botStatus;
                        const isCompleted = liveSession.status === "completed" || liveSession.status === "processing";
                        const isRecording = bStatus === "in_call" || liveSession.status === "live";
                        const isLocalRecording = recUrl && recUrl.startsWith("/api/shadow/recording/");

                        if (!recUrl && !isRecording && !isCompleted) return null;

                        return (
                          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-slate-300 font-medium">Event Recording</span>
                                {isRecording && !recUrl && (
                                  <span className="flex items-center gap-1 text-xs text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Recording
                                  </span>
                                )}
                              </div>
                              {recUrl && (
                                <div className="flex items-center gap-2">
                                  {!isLocalRecording && (
                                    <a href={recUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 transition-colors">
                                      <ExternalLink className="w-3 h-3" />
                                      Open
                                    </a>
                                  )}
                                  <a href={recUrl} download
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 transition-colors">
                                    <Download className="w-3 h-3" />
                                    {isLocalRecording ? "Download Recording" : "Download MP4"}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              {recUrl ? (
                                <div className="space-y-3">
                                  {isLocalRecording ? (
                                    <audio
                                      ref={(el) => { mediaRef.current = el; }}
                                      src={recUrl}
                                      controls
                                      preload="metadata"
                                      className="w-full"
                                      onTimeUpdate={(e) => setPlaybackTime((e.target as HTMLAudioElement).currentTime)}
                                      onPlay={() => setIsPlaying(true)}
                                      onPause={() => setIsPlaying(false)}
                                      onEnded={() => setIsPlaying(false)}
                                    />
                                  ) : (
                                    <video
                                      ref={(el) => { mediaRef.current = el; }}
                                      src={recUrl}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="w-full rounded-lg bg-black/50 max-h-[400px]"
                                      onTimeUpdate={(e) => setPlaybackTime((e.target as HTMLVideoElement).currentTime)}
                                      onPlay={() => setIsPlaying(true)}
                                      onPause={() => setIsPlaying(false)}
                                      onEnded={() => setIsPlaying(false)}
                                    >
                                      Your browser does not support video playback.
                                    </video>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>{isLocalRecording
                                      ? "Recording captured via Local Audio Capture — available for download and replay"
                                      : "Recording captured by Recall AI — available for download and replay"
                                    }</span>
                                  </div>
                                </div>
                              ) : isRecording ? (
                                <div className="flex items-center gap-3 py-4">
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                      <Video className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-300">Recording in progress</div>
                                    <div className="text-xs text-slate-500 mt-0.5">The meeting is being recorded. The recording will be available once the session ends.</div>
                                  </div>
                                </div>
                              ) : liveSession.status === "processing" ? (
                                <div className="flex items-center gap-3 py-4">
                                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin shrink-0" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-400">Saving recording...</div>
                                    <div className="text-xs text-slate-600 mt-0.5">The recording is being saved. This usually takes a few seconds.</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 py-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-400">No recording available</div>
                                    <div className="text-xs text-slate-600 mt-0.5">Start Local Audio Capture before the session to record the event.</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <LocalAudioCapture
                        sessionId={liveSession.id}
                        isActive={isActive}
                        onSegment={(seg) => {
                          setRealtimeSegments(prev => [...prev, seg]);
                        }}
                      />

                      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300 font-medium">Live Transcript</span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">{transcript.length} segments</span>
                            {transcript.length > 0 && (
                              <button
                                onClick={() => {
                                  const text = transcript.map(s =>
                                    `${(s as any).timeLabel ?? ""} ${s.speaker}: ${s.text}`
                                  ).join("\n\n");
                                  const blob = new Blob([text], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${liveSession.clientName}_${liveSession.eventName}_transcript.txt`.replace(/\s+/g, "_");
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  toast.success("Transcript downloaded");
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Export .txt
                              </button>
                            )}
                          </div>
                        </div>
                        <div ref={transcriptContainerRef} className="max-h-72 overflow-y-auto">
                          {transcript.length === 0 ? (
                            <div className="p-8 text-center text-slate-600 text-sm">
                              {isActive ? "Waiting for speech..." : "No transcript captured"}
                            </div>
                          ) : (
                            <div className="divide-y divide-white/5">
                              {(() => {
                                const hasRecording = !!(liveSession as any).recordingUrl;
                                const sessionStartMs = liveSession.startedAt ? new Date(liveSession.startedAt).getTime() : 0;
                                const reversedSegs = [...transcript].reverse().slice(0, 30);

                                return reversedSegs.map((seg, i) => {
                                  const rawTs = seg.timestamp ?? 0;
                                  const isEpochMs = rawTs > 1e12;
                                  const offsetSec = isEpochMs && sessionStartMs
                                    ? Math.max(0, (rawTs - sessionStartMs) / 1000)
                                    : isEpochMs ? 0 : rawTs;
                                  const canSeek = hasRecording && offsetSec > 0;
                                  const isActiveSeg = hasRecording && isPlaying && offsetSec > 0 &&
                                    Math.abs(playbackTime - offsetSec) < 5;
                                  const timeLabel = offsetSec > 0
                                    ? `${Math.floor(offsetSec / 60)}:${String(Math.floor(offsetSec % 60)).padStart(2, "0")}`
                                    : ((seg as any).timeLabel ?? "—");

                                  return (
                                    <div
                                      key={i}
                                      data-seg-time={offsetSec}
                                      className={`px-5 py-3 flex items-start gap-3 transition-colors ${
                                        isActiveSeg
                                          ? "bg-violet-500/10 border-l-2 border-violet-400"
                                          : canSeek
                                            ? "cursor-pointer hover:bg-white/[0.04]"
                                            : ""
                                      }`}
                                      onClick={() => {
                                        if (!canSeek || !mediaRef.current) return;
                                        mediaRef.current.currentTime = offsetSec;
                                        if (mediaRef.current.paused) mediaRef.current.play();
                                      }}
                                      title={canSeek ? `Click to jump to ${timeLabel}` : undefined}
                                    >
                                      <div className={`text-xs font-mono shrink-0 pt-0.5 w-10 ${isActiveSeg ? "text-violet-400" : canSeek ? "text-cyan-600" : "text-slate-600"}`}>
                                        {timeLabel}
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-xs font-semibold text-violet-300 mr-2">{seg.speaker}</span>
                                        <span className={`text-sm ${isActiveSeg ? "text-slate-200" : "text-slate-300"}`}>{seg.text}</span>
                                      </div>
                                      {canSeek && (
                                        <Play className={`w-3 h-3 shrink-0 mt-1 ${isActiveSeg ? "text-violet-400" : "text-slate-700"}`} />
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      <OperatorNotesPanel sessionId={liveSession.id} />

                      <OperatorActionLogPanel sessionId={liveSession.id} />

                      {(liveSession.status === "completed" || liveSession.status === "failed") && (
                        <SessionHandoffPanel sessionId={liveSession.id} clientName={liveSession.clientName} eventName={liveSession.eventName} />
                      )}
                    </div>
                  );
                })() : null}
              </div>
            </div>

            {/* Bottom explainer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: EyeOff, color: "text-emerald-400", title: "Invisible to clients", desc: "The bot joins as 'CuraLive Intelligence' — a standard named participant. Your clients see a normal event with a regular participant name." },
                { icon: Activity, color: "text-blue-400", title: "Real-time analysis", desc: "Sentiment scored every 5 transcript segments. Compliance keywords flagged automatically. All data flows into your database." },
                { icon: Tag, color: "text-violet-400", title: "Database compounds", desc: "Every session adds structured intelligence records. After 10 events, you have baselines. After 50, you have investor profiles." },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                    <Icon className={`w-5 h-5 ${card.color} mb-3`} />
                    <div className="text-sm font-semibold text-slate-300 mb-1">{card.title}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            ARCHIVE UPLOAD TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "archive" && (
          <>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
                <Upload className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">Archive Upload — build your database retroactively</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Upload any past event — earnings calls, AGMs, town halls — and CuraLive will process it through the same intelligence pipeline as a live Shadow Mode session. Paste a transcript, upload a .txt file, or upload an audio/video recording (CuraLive transcribes it automatically via Whisper AI). Each archive generates 4 tagged intelligence records in your database.
                </p>
              </div>
            </div>

            {archiveResult ? (
              /* ── Results ── */
              <div className="space-y-6">
                <div className="bg-white/[0.03] border border-violet-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-violet-400" />
                    <div>
                      <h2 className="font-semibold text-slate-200">Archive Processed Successfully</h2>
                      <p className="text-sm text-slate-500">{archiveResult.eventTitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Words Processed", value: archiveResult.wordCount.toLocaleString(), color: "text-violet-400" },
                      { label: "Segments", value: archiveResult.segmentCount, color: "text-blue-400" },
                      {
                        label: "Sentiment Score",
                        value: archiveResult.sentimentAvg,
                        color: archiveResult.sentimentAvg >= 70 ? "text-emerald-400" : archiveResult.sentimentAvg >= 50 ? "text-amber-400" : "text-red-400",
                      },
                      {
                        label: "Compliance Flags",
                        value: archiveResult.complianceFlags,
                        color: archiveResult.complianceFlags > 3 ? "text-red-400" : archiveResult.complianceFlags > 1 ? "text-amber-400" : "text-emerald-400",
                      },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className="text-xs text-slate-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-slate-200">{archiveResult.metricsGenerated} intelligence records added to database</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      {["Sentiment score tagged", "Engagement score tagged", "Compliance risk tagged", "Archive session confirmed"].map(l => (
                        <div key={l} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-violet-400" />
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="/tagged-metrics"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors">
                      <Database className="w-4 h-4" />
                      View Tagged Metrics Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </a>
                    <button onClick={resetArchive}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Another Archive
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleArchiveSubmit} className="space-y-5">

                {/* Event details */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Event Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Client Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="e.g. Anglo American Platinum"
                        value={archiveForm.clientName}
                        onChange={e => setArchiveForm(f => ({ ...f, clientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="e.g. Q4 2024 Earnings Call"
                        value={archiveForm.eventName}
                        onChange={e => setArchiveForm(f => ({ ...f, eventName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Type *</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.eventType}
                        onChange={e => setArchiveForm(f => ({ ...f, eventType: e.target.value }))}
                        required>
                        <option value="">Select type...</option>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Event Date</label>
                      <input
                        type="date"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.eventDate}
                        onChange={e => setArchiveForm(f => ({ ...f, eventDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Platform</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                        value={archiveForm.platform}
                        onChange={e => setArchiveForm(f => ({ ...f, platform: e.target.value }))}>
                        <option value="">Select platform...</option>
                        {ARCHIVE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Notes</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
                        placeholder="Any context about this event..."
                        value={archiveForm.notes}
                        onChange={e => setArchiveForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Transcript input */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4">
                    Transcript Source <span className="text-red-400">*</span>
                  </h2>
                  <div className="flex gap-2 mb-4">
                    {([
                      { key: "paste", label: "Paste Text" },
                      { key: "file", label: "Upload .txt File" },
                      { key: "recording", label: "Upload Recording" },
                    ] as const).map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => setArchiveInputMode(key as any)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          archiveInputMode === key
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {archiveInputMode === "paste" ? (
                    <div>
                      <textarea
                        value={archiveForm.transcriptText}
                        onChange={e => setArchiveForm(f => ({ ...f, transcriptText: e.target.value }))}
                        placeholder="Paste the full event transcript here. Speaker labels, timestamps, Q&A sections — paste it as-is."
                        rows={14}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-y"
                        required
                      />
                      {archiveForm.transcriptText && (
                        <p className="text-xs text-slate-600 mt-2">{archiveWordCount.toLocaleString()} words detected</p>
                      )}
                    </div>
                  ) : archiveInputMode === "file" ? (
                    <div>
                      <div
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        onClick={() => fileRef.current?.click()}>
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        {archiveFileName ? (
                          <div>
                            <p className="font-medium text-sm text-slate-200">{archiveFileName}</p>
                            <p className="text-xs text-slate-500 mt-1">{archiveWordCount.toLocaleString()} words loaded</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-slate-300 mb-1">Click to upload a .txt file</p>
                            <p className="text-xs text-slate-600">Plain text transcripts only. Up to 500,000 characters.</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept=".txt,text/plain" onChange={handleFileChange} className="hidden" />
                      {archiveForm.transcriptText && (
                        <div className="mt-3 p-3 bg-white/[0.02] rounded-lg border border-white/10">
                          <p className="text-xs text-slate-600 font-mono line-clamp-2">{archiveForm.transcriptText.slice(0, 200)}...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        onClick={() => archiveAudioRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const f = e.dataTransfer.files?.[0];
                          if (f) {
                            setArchiveRecFile(f);
                            setArchiveFileName(f.name);
                          }
                        }}>
                        <Mic className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        {archiveRecFile ? (
                          <div>
                            <p className="font-medium text-sm text-slate-200">{archiveRecFile.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {(archiveRecFile.size / 1024 / 1024).toFixed(1)} MB
                              {archiveRecFile.size > 20 * 1024 * 1024 && (
                                <span className="text-amber-400 ml-2">· Large file — auto-compressed on server, allow 5–10 min</span>
                              )}
                            </p>
                            {archiveForm.transcriptText && (
                              <p className="text-xs text-emerald-400 mt-1">{archiveWordCount.toLocaleString()} words transcribed</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-slate-300 mb-1">Click to select or drag & drop a recording</p>
                            <p className="text-xs text-slate-600">MP3, MP4, WAV, M4A, WebM, MOV, AVI &nbsp;·&nbsp; Up to 500MB</p>
                            <p className="text-xs text-slate-700 mt-1">CuraLive will transcribe the audio first, then run the full intelligence pipeline</p>
                          </div>
                        )}
                      </div>
                      <input ref={archiveAudioRef} type="file" accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm,.mov,.avi,.ogg,.flac" onChange={handleArchiveAudioChange} className="hidden" />
                      {archiveTranscribing && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-violet-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Transcribing audio with Whisper AI — this may take a few minutes for large files...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* What happens */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">What CuraLive will do with this transcript</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: BarChart2, label: "Score sentiment", desc: "AI scores 0–100" },
                      { icon: Users, label: "Measure engagement", desc: "Segment & word count" },
                      { icon: Shield, label: "Scan compliance", desc: "10 keyword checks" },
                      { icon: Database, label: "Tag 4 records", desc: "Added to database" },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="text-center">
                        <div className="p-2 rounded-lg bg-violet-500/10 w-fit mx-auto mb-2">
                          <Icon className="w-4 h-4 text-violet-400" />
                        </div>
                        <p className="text-xs font-medium text-slate-300">{label}</p>
                        <p className="text-xs text-slate-600">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={processTranscript.isPending || archiveTranscribing}
                  className="w-full bg-violet-600 hover:bg-violet-500 gap-2 py-5">
                  {archiveTranscribing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing recording with Whisper AI...</>
                  ) : processTranscript.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing archive...</>
                  ) : archiveInputMode === "recording" ? (
                    <><Mic className="w-4 h-4" /> Transcribe Recording &amp; Generate Intelligence</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Process Archive &amp; Generate Intelligence</>
                  )}
                </Button>
              </form>
            )}

            {/* Previous archives */}
            {archives.data && archives.data.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Previously Uploaded Archives ({archives.data.length})
                </h3>
                <div className="space-y-3">
                  {archives.data.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{a.client_name} — {a.event_name}</div>
                        <div className="text-xs text-slate-600">
                          {a.event_date ?? "No date"} &nbsp;·&nbsp;
                          {a.word_count.toLocaleString()} words &nbsp;·&nbsp;
                          {a.tagged_metrics_generated} intelligence records
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.status === "completed"
                          ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
                          : "text-slate-500 bg-white/5 border-white/10"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            ARCHIVES & REPORTS TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 mb-1">Archives &amp; Reports</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Browse all events processed through CuraLive. Each event gets a comprehensive AI intelligence report with 12 analysis modules — executive summary, sentiment analysis, compliance review, key topics, speaker analysis, Q&A breakdown, action items, investor signals, communication scoring, risk factors, competitive intelligence, and strategic recommendations.
                </p>
              </div>
            </div>

            {/* Email Modal */}
            {emailModalArchiveId != null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Email Intelligence Report
                  </h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!emailForm.recipientEmail.trim() || !emailForm.recipientName.trim()) {
                      toast.error("Please fill in both fields");
                      return;
                    }
                    emailReport.mutate({
                      archiveId: emailModalArchiveId,
                      recipientEmail: emailForm.recipientEmail.trim(),
                      recipientName: emailForm.recipientName.trim(),
                    });
                  }} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Recipient Name *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. John Smith"
                        value={emailForm.recipientName}
                        onChange={e => setEmailForm(f => ({ ...f, recipientName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. john@company.com"
                        value={emailForm.recipientEmail}
                        onChange={e => setEmailForm(f => ({ ...f, recipientEmail: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => { setEmailModalArchiveId(null); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                        className="flex-1 border-white/10 text-slate-400 hover:text-white">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={emailReport.isPending}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 gap-2">
                        {emailReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Send Report
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Archive list */}
              <div className="lg:col-span-1 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-300">Past Events</h3>
                    {archives.data && archives.data.length > 0 && (
                      <button onClick={() => toggleAllArchives(archives.data.map((a: any) => a.id))}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        {checkedArchiveIds.size === archives.data.length ? "Deselect all" : "Select all"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a href={checkedArchiveIds.size > 0 ? `/api/archives/download-all?ids=${Array.from(checkedArchiveIds).join(",")}` : "/api/archives/download-all"} download>
                      <Button size="sm" variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1">
                        <Download className="w-3 h-3" /> {checkedArchiveIds.size > 0 ? `Download (${checkedArchiveIds.size})` : "Download All"}
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={() => archives.refetch()}
                      className="border-white/10 text-slate-400 hover:text-white gap-1">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </Button>
                  </div>
                </div>
                {(!archives.data || archives.data.length === 0) ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
                    <Database className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No archive events yet</p>
                    <p className="text-xs text-slate-600 mt-1">Process events via Archive Upload or Event Recording</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {archives.data.map((a: any) => {
                      const isSelected = selectedArchiveId === a.id;
                      const isChecked = checkedArchiveIds.has(a.id);
                      const sentColor = (a.sentiment_avg ?? 50) >= 70 ? "text-emerald-400" : (a.sentiment_avg ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                      return (
                        <div key={a.id} className={`flex items-start gap-2 p-4 rounded-xl border transition-all ${isSelected
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleArchiveCheck(a.id)}
                            className="mt-1 shrink-0 w-4 h-4 rounded border-white/20 bg-white/5 accent-emerald-500 cursor-pointer" />
                          <button onClick={() => setSelectedArchiveId(a.id)} className="w-full text-left min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{a.event_name}</div>
                                <div className="text-xs text-slate-500 truncate">{a.client_name}</div>
                              </div>
                              <span className={`text-xs font-bold ${sentColor}`}>{a.sentiment_avg ?? "—"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              <span>{EVENT_TYPE_LABELS[a.event_type] ?? a.event_type}</span>
                              {a.event_date && <><span>·</span><span>{a.event_date}</span></>}
                              <span>·</span>
                              <span>{a.word_count?.toLocaleString()} words</span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Detail panel */}
              <div className="lg:col-span-2">
                {selectedArchiveId == null ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Select an event to view stats</p>
                    <p className="text-xs text-slate-600 mt-1">Click any event on the left to see the full breakdown</p>
                  </div>
                ) : archiveDetail.isLoading ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  </div>
                ) : archiveDetail.data ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-white/[0.03] border border-cyan-500/20 rounded-xl p-5">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-slate-200">{archiveDetail.data.event_name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{archiveDetail.data.client_name} · {EVENT_TYPE_LABELS[archiveDetail.data.event_type] ?? archiveDetail.data.event_type}{archiveDetail.data.event_date ? ` · ${archiveDetail.data.event_date}` : ""}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {!archiveDetail.data.ai_report && (
                          <Button size="sm" onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                            disabled={generateReport.isPending}
                            className="bg-violet-600 hover:bg-violet-500 gap-2">
                            {generateReport.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                            Generate AI Report
                          </Button>
                        )}
                        <Button size="sm" onClick={() => { setEmailModalArchiveId(selectedArchiveId); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                          className="bg-cyan-600 hover:bg-cyan-500 gap-2">
                          <FileText className="w-3.5 h-3.5" /> Email Report
                        </Button>
                        <a
                          href={archiveDetail.data?.has_recording ? `/api/archives/${selectedArchiveId}/recording` : undefined}
                          download
                          onClick={(e) => { if (!archiveDetail.data?.has_recording) { e.preventDefault(); toast.info("No recording available for this event. Recordings are stored when events are captured via live session or uploaded with audio."); } }}
                        >
                          <Button size="sm" type="button" className={`gap-2 ${
                            archiveDetail.data?.has_recording
                              ? "bg-emerald-600 hover:bg-emerald-500"
                              : "bg-slate-700 hover:bg-slate-600 opacity-60"
                          }`}>
                            <Mic className="w-3.5 h-3.5" /> Download Recording
                          </Button>
                        </a>
                        <a
                          href={archiveDetail.data?.has_transcript ? `/api/archives/${selectedArchiveId}/transcript` : undefined}
                          download
                          onClick={(e) => { if (!archiveDetail.data?.has_transcript) { e.preventDefault(); toast.info("No transcript available for this event."); } }}
                        >
                          <Button size="sm" type="button" className={`gap-2 ${
                            archiveDetail.data?.has_transcript
                              ? "bg-blue-600 hover:bg-blue-500"
                              : "bg-slate-700 hover:bg-slate-600 opacity-60"
                          }`}>
                            <Download className="w-3.5 h-3.5" /> Download Transcript
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {(() => {
                        const d = archiveDetail.data;
                        const r = d.ai_report;
                        const sentColor = (d.sentiment_avg ?? 50) >= 70 ? "text-emerald-400" : (d.sentiment_avg ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                        const compColor = d.compliance_flags > 3 ? "text-red-400" : d.compliance_flags > 1 ? "text-amber-400" : "text-emerald-400";
                        const commScore = r?.communicationScore?.score;
                        const commColor = (commScore ?? 50) >= 70 ? "text-emerald-400" : (commScore ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                        return [
                          { label: "Sentiment", value: `${d.sentiment_avg ?? "N/A"}`, sub: "/100", color: sentColor },
                          { label: "Compliance", value: `${d.compliance_flags}`, sub: d.compliance_flags > 3 ? "High Risk" : d.compliance_flags > 1 ? "Moderate" : "Low Risk", color: compColor },
                          { label: "Comm. Score", value: commScore != null ? `${commScore}` : "—", sub: commScore != null ? "/100" : "", color: commColor },
                          { label: "Words", value: d.word_count?.toLocaleString(), sub: "", color: "text-blue-400" },
                          { label: "Segments", value: `${d.segment_count}`, sub: "", color: "text-blue-400" },
                        ].map(({ label, value, sub, color }) => (
                          <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center">
                            <div className={`text-xl font-bold ${color}`}>{value}<span className="text-xs text-slate-600 ml-0.5">{sub}</span></div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {archiveDetail.data.ai_report ? (() => {
                      const r = archiveDetail.data.ai_report;
                      const severityColor = (s: string) =>
                        s === "Positive" || s === "Low" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        s === "Neutral" || s === "Medium" || s === "Routine" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        "text-red-400 bg-red-500/10 border-red-500/20";

                      const ReportSection = ({ id, icon: Icon, title, iconColor, count, children }: any) => {
                        const isOpen = expandedSections[id] !== false;
                        return (
                          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                            <button onClick={() => toggleSection(id)}
                              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${iconColor.replace("text-", "bg-").replace("400", "500/10")} border ${iconColor.replace("text-", "border-").replace("400", "500/20")}`}>
                                  <Icon className={`w-4 h-4 ${iconColor}`} />
                                </div>
                                <span className="text-sm font-semibold text-slate-200">{title}</span>
                                {count != null && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">{count}</span>}
                              </div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                            </button>
                            {isOpen && <div className="px-5 pb-4 border-t border-white/5 pt-3">{children}</div>}
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-3">
                          {r.executiveSummary && (
                            <div className="bg-gradient-to-r from-cyan-500/5 to-violet-500/5 border border-cyan-500/20 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Executive Summary</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{r.executiveSummary}</p>
                            </div>
                          )}

                          <ReportSection id="sentiment" icon={Activity} title="Sentiment Analysis" iconColor="text-emerald-400">
                            <p className="text-sm text-slate-400 leading-relaxed mb-3">{r.sentimentAnalysis?.narrative}</p>
                            {r.sentimentAnalysis?.keyDrivers?.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Key Drivers</p>
                                {r.sentimentAnalysis.keyDrivers.map((d: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                    <span>{d}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ReportSection>

                          <ReportSection id="compliance" icon={Shield} title="Compliance Review" iconColor="text-amber-400"
                            count={r.complianceReview?.flaggedPhrases?.length || 0}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-slate-500">Risk Level:</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityColor(r.complianceReview?.riskLevel === "Low" ? "Positive" : r.complianceReview?.riskLevel === "High" || r.complianceReview?.riskLevel === "Critical" ? "Critical" : "Neutral")}`}>
                                {r.complianceReview?.riskLevel}
                              </span>
                            </div>
                            {r.complianceReview?.flaggedPhrases?.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Flagged Phrases</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {r.complianceReview.flaggedPhrases.map((p: string, i: number) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">{p}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {r.complianceReview?.recommendations?.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Recommendations</p>
                                {r.complianceReview.recommendations.map((rec: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ReportSection>

                          <ReportSection id="topics" icon={Tag} title="Key Topics Discussed" iconColor="text-violet-400"
                            count={r.keyTopics?.length || 0}>
                            <div className="space-y-2">
                              {(r.keyTopics || []).map((t: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-200">{t.topic}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(t.sentiment)}`}>{t.sentiment}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed">{t.detail}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="speakers" icon={UserCheck} title="Speaker Analysis" iconColor="text-blue-400"
                            count={r.speakerAnalysis?.length || 0}>
                            <div className="space-y-3">
                              {(r.speakerAnalysis || []).map((s: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-200">{s.speaker}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{s.role}</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {(s.keyPoints || []).map((p: string, j: number) => (
                                      <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                        <ChevronRight className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="questions" icon={HelpCircle} title="Q&A Analysis" iconColor="text-cyan-400"
                            count={r.questionsAsked?.length || 0}>
                            <div className="space-y-2">
                              {(r.questionsAsked || []).map((q: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <p className="text-sm text-slate-200 mb-1.5">"{q.question}"</p>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>Asked by: <span className="text-slate-400">{q.askedBy}</span></span>
                                    <span className={`px-2 py-0.5 rounded-full border ${severityColor(q.quality)}`}>{q.quality}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="signals" icon={Target} title="Investor Signals" iconColor="text-orange-400"
                            count={r.investorSignals?.length || 0}>
                            <div className="space-y-2">
                              {(r.investorSignals || []).map((s: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-200">{s.signal}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(s.severity)}`}>{s.severity}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{s.interpretation}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="actions" icon={ListChecks} title="Action Items" iconColor="text-green-400"
                            count={r.actionItems?.length || 0}>
                            <div className="space-y-2">
                              {(r.actionItems || []).map((a: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-slate-200">{a.item}</p>
                                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                      <span>Owner: <span className="text-slate-400">{a.owner}</span></span>
                                      {a.deadline && a.deadline !== "Not mentioned" && <span>Deadline: <span className="text-slate-400">{a.deadline}</span></span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="communication" icon={MessageSquare} title="Communication Assessment" iconColor="text-indigo-400">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              {[
                                { label: "Overall", value: r.communicationScore?.score },
                                { label: "Clarity", value: r.communicationScore?.clarity },
                                { label: "Transparency", value: r.communicationScore?.transparency },
                              ].map(({ label, value }) => {
                                const c = (value ?? 50) >= 70 ? "text-emerald-400" : (value ?? 50) >= 50 ? "text-amber-400" : "text-red-400";
                                return (
                                  <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                    <div className={`text-lg font-bold ${c}`}>{value ?? "—"}<span className="text-xs text-slate-600">/100</span></div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{r.communicationScore?.narrative}</p>
                          </ReportSection>

                          <ReportSection id="risks" icon={AlertTriangle} title="Risk Factors" iconColor="text-red-400"
                            count={r.riskFactors?.length || 0}>
                            <div className="space-y-2">
                              {(r.riskFactors || []).map((rf: any, i: number) => (
                                <div key={i} className="flex items-start justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <span className="text-sm text-slate-200">{rf.factor}</span>
                                  <div className="flex gap-2 shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(rf.impact === "High" ? "Critical" : rf.impact === "Low" ? "Positive" : "Neutral")}`}>
                                      Impact: {rf.impact}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(rf.likelihood === "High" ? "Critical" : rf.likelihood === "Low" ? "Positive" : "Neutral")}`}>
                                      Likelihood: {rf.likelihood}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          <ReportSection id="competitive" icon={Swords} title="Competitive Intelligence" iconColor="text-pink-400"
                            count={r.competitiveIntelligence?.length || 0}>
                            <div className="space-y-2">
                              {(r.competitiveIntelligence || []).map((c: any, i: number) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                  <p className="text-sm font-medium text-slate-200 mb-1">{c.mention}</p>
                                  <p className="text-xs text-slate-400">{c.context}</p>
                                </div>
                              ))}
                            </div>
                          </ReportSection>

                          {r.recommendations?.length > 0 && (
                            <ReportSection id="recommendations" icon={Lightbulb} title="AI Recommendations" iconColor="text-yellow-400"
                              count={r.recommendations.length}>
                              <div className="space-y-2">
                                {r.recommendations.map((rec: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.speakingPaceAnalysis && (
                            <ReportSection id="speakingPace" icon={Gauge} title="Speaking Pace Coach" iconColor="text-teal-400">
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                {[
                                  { label: "WPM", value: r.speakingPaceAnalysis.overallWpm, color: r.speakingPaceAnalysis.overallWpm >= 130 && r.speakingPaceAnalysis.overallWpm <= 160 ? "text-emerald-400" : "text-amber-400" },
                                  { label: "Pace", value: r.speakingPaceAnalysis.paceLabel, color: r.speakingPaceAnalysis.paceLabel === "Normal" ? "text-emerald-400" : "text-amber-400" },
                                  { label: "Delivery", value: `${r.speakingPaceAnalysis.deliveryScore}/100`, color: r.speakingPaceAnalysis.deliveryScore >= 70 ? "text-emerald-400" : "text-amber-400" },
                                ].map(({ label, value, color }) => (
                                  <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                  </div>
                                ))}
                              </div>
                              {r.speakingPaceAnalysis.fillerWords?.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Filler Words Detected</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {r.speakingPaceAnalysis.fillerWords.map((fw: any, i: number) => (
                                      <span key={i} className="text-xs px-2 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">"{fw.word}" x{fw.count}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {r.speakingPaceAnalysis.coachingTips?.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Coaching Tips</p>
                                  {r.speakingPaceAnalysis.coachingTips.map((tip: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300 mb-1">
                                      <Lightbulb className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                                      <span>{tip}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ReportSection>
                          )}

                          {r.toxicityScreen && (
                            <ReportSection id="toxicity" icon={ShieldAlert} title="Toxicity & Language Risk" iconColor="text-rose-400"
                              count={r.toxicityScreen.flaggedContent?.length || 0}>
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-medium text-slate-500">Overall Risk:</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  r.toxicityScreen.overallRisk === "Clean" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.toxicityScreen.overallRisk === "Low" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.toxicityScreen.overallRisk}</span>
                                {r.toxicityScreen.priceSensitive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">Price Sensitive</span>}
                                {r.toxicityScreen.legalRisk && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">Legal Risk</span>}
                              </div>
                              {r.toxicityScreen.flaggedContent?.length > 0 && (
                                <div className="space-y-2">
                                  {r.toxicityScreen.flaggedContent.map((fc: any, i: number) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                      <p className="text-sm text-slate-200 mb-1">"{fc.phrase}"</p>
                                      <div className="flex gap-2 text-xs text-slate-500">
                                        <span>{fc.issue}</span>
                                        <span className={`px-2 py-0.5 rounded-full border ${severityColor(fc.severity === "Low" ? "Positive" : fc.severity === "High" ? "Critical" : "Neutral")}`}>{fc.severity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ReportSection>
                          )}

                          {r.sentimentArc && (
                            <ReportSection id="sentimentArc" icon={LineChart} title="Sentiment Arc" iconColor="text-purple-400">
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                {[
                                  { label: "Opening", value: r.sentimentArc.opening },
                                  { label: "Midpoint", value: r.sentimentArc.midpoint },
                                  { label: "Closing", value: r.sentimentArc.closing },
                                ].map(({ label, value }) => {
                                  const c = value >= 70 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-red-400";
                                  return (
                                    <div key={label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-center">
                                      <div className={`text-lg font-bold ${c}`}>{value}<span className="text-xs text-slate-600">/100</span></div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-slate-500">Trend:</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  r.sentimentArc.trend === "Improving" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.sentimentArc.trend === "Stable" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.sentimentArc.trend}</span>
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed">{r.sentimentArc.narrative}</p>
                            </ReportSection>
                          )}

                          {r.financialHighlights?.length > 0 && (
                            <ReportSection id="financials" icon={Banknote} title="Financial Highlights" iconColor="text-green-400"
                              count={r.financialHighlights.length}>
                              <div className="space-y-2">
                                {r.financialHighlights.map((fh: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-200">{fh.metric}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-400">{fh.value}</span>
                                        {fh.yoyChange && <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                          fh.yoyChange.startsWith("+") ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                          fh.yoyChange.startsWith("-") ? "text-red-400 bg-red-500/10 border-red-500/20" :
                                          "text-slate-400 bg-white/5 border-white/10"
                                        }`}>{fh.yoyChange}</span>}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-400">{fh.context}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.esgMentions?.length > 0 && (
                            <ReportSection id="esg" icon={Leaf} title="ESG & Sustainability" iconColor="text-lime-400"
                              count={r.esgMentions.length}>
                              <div className="space-y-2">
                                {r.esgMentions.map((e: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-200">{e.topic}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(e.sentiment)}`}>{e.sentiment}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{e.commitment}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.pressReleaseDraft && (
                            <ReportSection id="pressRelease" icon={Newspaper} title="Press Release Draft" iconColor="text-sky-400">
                              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{r.pressReleaseDraft}</p>
                              </div>
                              <Button size="sm" variant="outline" className="mt-3 border-white/10 text-slate-400 hover:text-white gap-2"
                                onClick={() => { navigator.clipboard.writeText(r.pressReleaseDraft); toast.success("Press release copied to clipboard"); }}>
                                <Copy className="w-3.5 h-3.5" /> Copy to Clipboard
                              </Button>
                            </ReportSection>
                          )}

                          {r.socialMediaContent?.length > 0 && (
                            <ReportSection id="social" icon={Share2} title="Social Media Content" iconColor="text-blue-400"
                              count={r.socialMediaContent.length}>
                              <div className="space-y-3">
                                {r.socialMediaContent.map((sc: any, i: number) => (
                                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{sc.platform}</span>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-500 hover:text-white gap-1"
                                        onClick={() => { navigator.clipboard.writeText(sc.content); toast.success(`${sc.platform} post copied`); }}>
                                        <Copy className="w-3 h-3" /> Copy
                                      </Button>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{sc.content}</p>
                                  </div>
                                ))}
                              </div>
                            </ReportSection>
                          )}

                          {r.boardReadySummary && (
                            <ReportSection id="board" icon={Briefcase} title="Board-Ready Summary" iconColor="text-amber-400">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-medium text-slate-500">Board Verdict:</span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                                  r.boardReadySummary.verdict === "Strong" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  r.boardReadySummary.verdict === "Satisfactory" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                  r.boardReadySummary.verdict === "Concerning" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                  "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>{r.boardReadySummary.verdict}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Key Risks</p>
                                  {(r.boardReadySummary.keyRisks || []).map((risk: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-red-300 mb-1">
                                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{risk}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Opportunities</p>
                                  {(r.boardReadySummary.keyOpportunities || []).map((opp: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-300 mb-1">
                                      <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{opp}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Recommended Actions</p>
                                  {(r.boardReadySummary.recommendedActions || []).map((act: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-blue-300 mb-1">
                                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </ReportSection>
                          )}

                          {r.modulesGenerated && (
                            <div className="bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-violet-400" />
                                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">{r.modulesGenerated} AI Modules Processed</span>
                              </div>
                              <span className="text-xs text-slate-500">All modules run on every event — select which to include in reports</span>
                            </div>
                          )}

                          {(archiveDetail.data as any).specialised_algorithms_run > 0 && (() => {
                            const sa = (archiveDetail.data as any).specialised_analysis;
                            const sessionType = (archiveDetail.data as any).specialised_session_type;
                            const algCount = (archiveDetail.data as any).specialised_algorithms_run;
                            if (!sa) return null;

                            const isBastion = sessionType === "bastion";
                            const gradientClass = isBastion
                              ? "from-amber-500/5 to-orange-500/5 border-amber-500/20"
                              : "from-emerald-500/5 to-cyan-500/5 border-emerald-500/20";
                            const accentColor = isBastion ? "text-amber-400" : "text-emerald-400";
                            const labelColor = isBastion ? "text-amber-300" : "text-emerald-300";

                            return (
                              <div className="space-y-3 mt-2">
                                <div className={`bg-gradient-to-r ${gradientClass} border rounded-xl p-4`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Brain className={`w-4 h-4 ${accentColor}`} />
                                    <span className={`text-xs font-semibold ${labelColor} uppercase tracking-wider`}>
                                      {algCount} Specialised {isBastion ? "Investor Intelligence" : "Governance"} Algorithms Run
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {isBastion && sa.earningsSentiment && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Spin Index</div>
                                        <div className={`text-lg font-bold ${sa.earningsSentiment.spinIndex > 30 ? "text-red-400" : "text-emerald-400"}`}>
                                          {sa.earningsSentiment.spinIndex}<span className="text-xs text-slate-600">/100</span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">Tone: {sa.earningsSentiment.managementToneScore} | Substance: {sa.earningsSentiment.substanceScore}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.forwardGuidance && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Forward Guidance</div>
                                        <div className="text-lg font-bold text-blue-400">{sa.forwardGuidance.guidanceItems}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                          {sa.forwardGuidance.raised > 0 && <span className="text-emerald-400">{sa.forwardGuidance.raised} raised </span>}
                                          {sa.forwardGuidance.lowered > 0 && <span className="text-red-400">{sa.forwardGuidance.lowered} lowered </span>}
                                          {sa.forwardGuidance.newGuidance > 0 && <span className="text-cyan-400">{sa.forwardGuidance.newGuidance} new</span>}
                                        </div>
                                      </div>
                                    )}
                                    {isBastion && sa.analystQuestions && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Analyst Q&A</div>
                                        <div className="text-lg font-bold text-violet-400">{sa.analystQuestions.totalQuestions}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                          {sa.analystQuestions.hostileCount > 0 && <span className="text-red-400">{sa.analystQuestions.hostileCount} hostile </span>}
                                          {(sa.analystQuestions.topThemes || []).slice(0, 2).join(", ")}
                                        </div>
                                      </div>
                                    )}
                                    {isBastion && sa.credibility && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Credibility</div>
                                        <div className={`text-lg font-bold ${sa.credibility.credibilityScore >= 70 ? "text-emerald-400" : sa.credibility.credibilityScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                                          {sa.credibility.credibilityScore}<span className="text-xs text-slate-600">/100</span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.credibility.consistencyRating}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.marketMoving && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Market-Moving</div>
                                        <div className={`text-lg font-bold ${sa.marketMoving.marketMovingCount > 0 ? "text-orange-400" : "text-slate-500"}`}>
                                          {sa.marketMoving.marketMovingCount}
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">Impact: {sa.marketMoving.overallImpact}</div>
                                      </div>
                                    )}
                                    {isBastion && sa.investmentBrief && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recommendation</div>
                                        <div className={`text-sm font-bold ${
                                          sa.investmentBrief.overallRating === "overweight" ? "text-emerald-400" :
                                          sa.investmentBrief.overallRating === "underweight" ? "text-red-400" : "text-blue-400"
                                        }`}>
                                          {(sa.investmentBrief.overallRating ?? "").replace(/_/g, " ").toUpperCase()}
                                        </div>
                                      </div>
                                    )}
                                    {!isBastion && sa.regulatoryCompliance && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Regulatory Alerts</div>
                                        <div className={`text-lg font-bold ${(sa.regulatoryCompliance.alerts?.length ?? 0) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                          {sa.regulatoryCompliance.alerts?.length ?? 0}
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.regulatoryCompliance.overallRisk ?? "N/A"} risk</div>
                                      </div>
                                    )}
                                    {!isBastion && sa.dissentPatterns && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Dissent Patterns</div>
                                        <div className="text-lg font-bold text-amber-400">{sa.dissentPatterns.patternsFound}</div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">{sa.dissentPatterns.riskLevel ?? "N/A"} risk</div>
                                      </div>
                                    )}
                                    {!isBastion && sa.governanceQuestions && (
                                      <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Governance Q&A</div>
                                        <div className="text-lg font-bold text-cyan-400">{sa.governanceQuestions.governanceQuestionCount ?? 0}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })() : (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
                        <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 mb-1">No AI report generated yet</p>
                        <p className="text-xs text-slate-600 mb-4">This archive was processed before the AI report feature was added.</p>
                        <Button onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                          disabled={generateReport.isPending}
                          className="bg-violet-600 hover:bg-violet-500 gap-2">
                          {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                          {generateReport.isPending ? "Generating AI Report..." : "Generate Full AI Report"}
                        </Button>
                      </div>
                    )}

                    {archiveDetail.data.ai_report && (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setShowModuleSelector(!showModuleSelector)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Send className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold text-slate-200">Select Modules for Client Report</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                              {selectedModules.size}/{ALL_REPORT_MODULES.length} selected
                            </span>
                          </div>
                          {showModuleSelector ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </button>
                        {showModuleSelector && (
                          <div className="px-5 pb-4 border-t border-white/5">
                            <div className="flex items-center justify-between py-3 mb-2">
                              <p className="text-xs text-slate-500">Choose which AI modules to include when sending this report to the client. All modules are always processed and stored.</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 hover:text-white h-7 px-2"
                                  onClick={() => setSelectedModules(new Set(ALL_REPORT_MODULES.map(m => m.id)))}>Select All</Button>
                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 hover:text-white h-7 px-2"
                                  onClick={() => setSelectedModules(new Set())}>Clear All</Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {ALL_REPORT_MODULES.map(({ id, label, icon: ModIcon }) => {
                                const checked = selectedModules.has(id);
                                return (
                                  <button key={id} onClick={() => toggleModule(id)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                                      checked ? "bg-violet-500/10 border border-violet-500/20" : "bg-white/[0.01] border border-white/5 hover:border-white/10"
                                    }`}>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                      checked ? "bg-violet-500 text-white" : "bg-white/5 border border-white/20"
                                    }`}>
                                      {checked && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <ModIcon className={`w-3.5 h-3.5 ${checked ? "text-violet-300" : "text-slate-600"}`} />
                                    <span className={`text-xs font-medium ${checked ? "text-slate-200" : "text-slate-500"}`}>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-xs text-slate-600">Selected modules will be included when emailing this report to clients</span>
                              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 gap-2 h-8">
                                <Send className="w-3.5 h-3.5" />
                                Preview Client Report ({selectedModules.size} modules)
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detail rows */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl divide-y divide-white/5">
                      {[
                        { label: "Intelligence Records Generated", value: `${archiveDetail.data.tagged_metrics_generated} tagged records` },
                        { label: "Platform", value: archiveDetail.data.platform ?? "Not specified" },
                        { label: "Status", value: archiveDetail.data.status },
                        { label: "Processed On", value: new Date(archiveDetail.data.created_at).toLocaleString() },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-5 py-3">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className="text-sm text-slate-300 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {archiveDetail.data.notes && (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{archiveDetail.data.notes}</p>
                      </div>
                    )}

                    <OperatorCorrectionPanel
                      eventId={`archive-${archiveDetail.data.id}`}
                      eventTitle={`${archiveDetail.data.client_name} — ${archiveDetail.data.event_name}`}
                      eventType={archiveDetail.data.event_type}
                      clientName={archiveDetail.data.client_name}
                      sentimentAvg={archiveDetail.data.sentiment_avg}
                      complianceFlags={archiveDetail.data.compliance_flags}
                    />

                    <div className="flex gap-3 flex-wrap">
                      {archiveDetail.data.ai_report && (
                        <Button size="sm" variant="outline" onClick={() => generateReport.mutate({ archiveId: selectedArchiveId! })}
                          disabled={generateReport.isPending}
                          className="border-white/10 text-slate-400 hover:text-white gap-2">
                          {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Regenerate Report
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => window.location.href = "/tagged-metrics"}
                        className="border-white/10 text-slate-400 hover:text-white gap-2">
                        <Database className="w-4 h-4" /> View Intelligence Database
                      </Button>
                      <Button onClick={() => { setEmailModalArchiveId(selectedArchiveId); setEmailForm({ recipientEmail: "", recipientName: "" }); }}
                        className="bg-cyan-600 hover:bg-cyan-500 gap-2">
                        <FileText className="w-4 h-4" /> Email Report
                      </Button>
                      <a
                        href={archiveDetail.data?.has_recording ? `/api/archives/${selectedArchiveId}/recording` : undefined}
                        download
                        onClick={(e) => { if (!archiveDetail.data?.has_recording) { e.preventDefault(); toast.info("No recording available for this event. Recordings are stored when events are captured via live session or uploaded with audio."); } }}
                      >
                        <Button type="button" className={`gap-2 ${
                          archiveDetail.data?.has_recording
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : "bg-slate-700 hover:bg-slate-600 opacity-60"
                        }`}>
                          <Mic className="w-4 h-4" /> Download Recording
                        </Button>
                      </a>
                      <a
                        href={archiveDetail.data?.has_transcript ? `/api/archives/${selectedArchiveId}/transcript` : undefined}
                        download
                        onClick={(e) => { if (!archiveDetail.data?.has_transcript) { e.preventDefault(); toast.info("No transcript available for this event."); } }}
                      >
                        <Button type="button" className={`gap-2 ${
                          archiveDetail.data?.has_transcript
                            ? "bg-blue-600 hover:bg-blue-500"
                            : "bg-slate-700 hover:bg-slate-600 opacity-60"
                        }`}>
                          <Download className="w-4 h-4" /> Download Transcript
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">Failed to load archive details</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            AI DASHBOARD TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "aidashboard" && (
          <AIDashboard sessions={sessions.data ?? []} />
        )}

        {/* ══════════════════════════════════════════════════
            AI LEARNING TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "ailearning" && (
          <AILearningDashboard />
        )}

        {/* ══════════════════════════════════════════════════
            AI ADVISORY BOT TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "advisory" && (
          <AdvisoryBotPanel />
        )}

        {/* ══════════════════════════════════════════════════
            LIVE Q&A TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "liveqa" && (
          <LiveQaDashboard
            shadowSessionId={activeSessionId || undefined}
            eventName={sessions.data?.find((s: any) => s.id === activeSessionId)?.eventName || "Live Event"}
            clientName={sessions.data?.find((s: any) => s.id === activeSessionId)?.clientName || ""}
          />
        )}

        {/* ══════════════════════════════════════════════════
            SYSTEM DIAGNOSTICS TAB
        ══════════════════════════════════════════════════ */}
        {activeTab === "diagnostics" && (
          <SystemDiagnostics />
        )}

      </div>
    </div>
  );
}

function OperatorCorrectionPanel({ eventId, eventTitle, eventType, clientName, sentimentAvg, complianceFlags }: {
  eventId: string; eventTitle: string; eventType: string; clientName: string;
  sentimentAvg: number | null; complianceFlags: number;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [sentimentOverride, setSentimentOverride] = useState(sentimentAvg ?? 50);
  const [correctionReason, setCorrectionReason] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const submitCorrection = trpc.adaptiveIntelligence.submitCorrection.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCorrectionReason("");
      setNewKeyword("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="bg-white/[0.02] border border-purple-500/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setShowCorrection(!showCorrection)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-200">Correct AI Analysis</div>
            <div className="text-xs text-slate-500">Your corrections train the AI to be more accurate</div>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showCorrection ? "rotate-90" : ""}`} />
      </button>

      {showCorrection && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Sentiment Score Override</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0" max="100"
                  value={sentimentOverride}
                  onChange={(e) => setSentimentOverride(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className={`text-lg font-bold min-w-[3ch] text-right ${
                  sentimentOverride >= 70 ? "text-emerald-400" : sentimentOverride >= 50 ? "text-amber-400" : "text-red-400"
                }`}>{sentimentOverride}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-600">AI scored: {sentimentAvg ?? "N/A"}</span>
                <span className="text-xs text-slate-600">Your correction: {sentimentOverride}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Reason for correction</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                placeholder="e.g. Mining sector calls are naturally more cautious"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              disabled={submitCorrection.isPending || sentimentOverride === (sentimentAvg ?? 50)}
              onClick={() => submitCorrection.mutate({
                eventId,
                eventTitle,
                correctionType: "sentiment_override",
                originalValue: sentimentAvg ?? 50,
                correctedValue: sentimentOverride,
                originalLabel: `AI Score: ${sentimentAvg ?? 50}`,
                correctedLabel: `Operator Override: ${sentimentOverride}`,
                reason: correctionReason || undefined,
                eventType,
                clientName,
              })}
              className="bg-purple-600 hover:bg-purple-500 gap-2"
            >
              {submitCorrection.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Submit Sentiment Correction
            </Button>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Compliance Actions</label>
              <div className="flex gap-2">
                {complianceFlags > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitCorrection.isPending}
                    onClick={() => submitCorrection.mutate({
                      eventId,
                      eventTitle,
                      correctionType: "compliance_dismiss",
                      originalValue: complianceFlags,
                      correctedValue: 0,
                      originalLabel: `${complianceFlags} flags`,
                      correctedLabel: "Dismissed by operator",
                      reason: correctionReason || "False positive — operator reviewed",
                      eventType,
                      clientName,
                      dismissedKeywords: ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"].slice(0, complianceFlags),
                    })}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" /> Dismiss {complianceFlags} Flag{complianceFlags !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Add Compliance Keyword</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. restructuring, dividend cut"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!newKeyword.trim() || submitCorrection.isPending}
                  onClick={() => submitCorrection.mutate({
                    eventId,
                    eventTitle,
                    correctionType: "compliance_add",
                    correctedLabel: newKeyword.trim(),
                    reason: `Operator added keyword: ${newKeyword.trim()}`,
                    eventType,
                    clientName,
                  })}
                  className="bg-purple-600 hover:bg-purple-500 gap-1.5 shrink-0"
                >
                  <Tag className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Every correction you submit trains CuraLive's AI. Over time, sentiment thresholds adapt to your sector, compliance scanning learns which keywords matter, and false positives decrease. This is the self-improving feedback loop described in the patent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function AILearningDashboard() {
  const learningStats = trpc.adaptiveIntelligence.getLearningStats.useQuery();
  const thresholds = trpc.adaptiveIntelligence.getAdaptiveThresholds.useQuery();
  const vocabulary = trpc.adaptiveIntelligence.getComplianceVocabulary.useQuery();
  const corrections = trpc.adaptiveIntelligence.getCorrections.useQuery({ limit: 20 });
  const evolution = trpc.aiEvolution.getDashboard.useQuery(undefined, { refetchInterval: 30000 });
  const runAccumulation = trpc.aiEvolution.runAccumulation.useMutation({
    onSuccess: (data) => {
      toast.success(`Accumulation: ${data.proposalsCreated} new, ${data.proposalsUpdated} updated, ${data.promoted.length} promoted`);
      evolution.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateProposalStatus = trpc.aiEvolution.updateProposalStatus.useMutation({
    onSuccess: () => { toast.success("Proposal updated"); evolution.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [newKeyword, setNewKeyword] = useState("");
  const addKeyword = trpc.adaptiveIntelligence.addComplianceKeyword.useMutation({
    onSuccess: (data) => { toast.success(data.message); setNewKeyword(""); vocabulary.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const toggleKeyword = trpc.adaptiveIntelligence.toggleComplianceKeyword.useMutation({
    onSuccess: () => vocabulary.refetch(),
  });

  const stats = learningStats.data;

  const maturityColors: Record<string, string> = {
    "Initialising": "text-slate-400 bg-slate-400/10 border-slate-400/20",
    "Learning": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    "Adapting": "text-blue-400 bg-blue-400/10 border-blue-400/20",
    "Calibrated": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    "Self-Evolving": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };

  return (
    <>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200 mb-1">AI Learning Engine</div>
          <p className="text-sm text-slate-400 leading-relaxed">
            CuraLive's AI improves with every operator correction. When you override a sentiment score, dismiss a false compliance flag, or add a new keyword, those corrections become training signals that calibrate future analysis. This dashboard shows how the AI is learning and evolving.
          </p>
        </div>
      </div>

      {stats && (
        <>
          {/* Maturity header */}
          <div className="bg-white/[0.03] border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-slate-200">AI Maturity Level</div>
                <p className="text-sm text-slate-500 mt-0.5">Based on {stats.totalCorrections} operator corrections</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${maturityColors[stats.maturityLevel] ?? maturityColors["Initialising"]}`}>
                {stats.maturityLevel}
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700"
                style={{ width: `${stats.maturityScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-600">
              <span>Initialising</span>
              <span>Learning</span>
              <span>Adapting</span>
              <span>Calibrated</span>
              <span>Self-Evolving</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Corrections", value: stats.totalCorrections, color: "text-purple-400" },
              { label: "Sentiment Overrides", value: stats.correctionsByType?.sentiment_override ?? 0, color: "text-emerald-400" },
              { label: "Compliance Adjustments", value: (stats.correctionsByType?.compliance_dismiss ?? 0) + (stats.correctionsByType?.compliance_add ?? 0), color: "text-amber-400" },
              { label: "Adapted Thresholds", value: stats.adaptedThresholds, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adaptive Thresholds */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Adaptive Thresholds
          </h3>
          {thresholds.data?.learned && thresholds.data.learned.length > 0 ? (
            <div className="space-y-3">
              {thresholds.data.summary.map((t: any) => (
                <div key={t.key} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-medium">{t.key.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-600">{t.samples} samples</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Default:</span>
                      <span className="text-slate-400 font-medium">{t.default}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Learned:</span>
                      <span className="text-purple-400 font-bold">{t.learned}</span>
                    </div>
                    <span className={`text-xs font-medium ml-auto ${Number(t.driftPercent) > 0 ? "text-emerald-400" : Number(t.driftPercent) < 0 ? "text-red-400" : "text-slate-500"}`}>
                      {t.driftPercent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No thresholds adapted yet</p>
              <p className="text-xs text-slate-600 mt-1">Submit sentiment corrections from event reports to begin threshold learning</p>
            </div>
          )}
        </div>

        {/* Compliance Vocabulary */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Compliance Vocabulary
            {stats && <span className="text-xs text-slate-600 ml-auto">{stats.vocabularyStats.totalKeywords} keywords</span>}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
              placeholder="Add new compliance keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newKeyword.trim()) addKeyword.mutate({ keyword: newKeyword.trim() }); }}
            />
            <Button size="sm" disabled={!newKeyword.trim() || addKeyword.isPending}
              onClick={() => addKeyword.mutate({ keyword: newKeyword.trim() })}
              className="bg-purple-600 hover:bg-purple-500 gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          {vocabulary.data && vocabulary.data.length > 0 ? (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {vocabulary.data.map((kw: any) => (
                <div key={kw.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${kw.active ? "border-white/5 bg-white/[0.01]" : "border-white/5 bg-white/[0.005] opacity-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => toggleKeyword.mutate({ id: kw.id, active: !kw.active })}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${kw.active ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "border-white/20"}`}>
                      {kw.active && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <span className="text-sm text-slate-300 truncate">{kw.keyword}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${kw.source === "operator" ? "bg-purple-500/20 text-purple-400" : kw.source === "learned" ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400"}`}>
                      {kw.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-600" title="Effective weight">
                      w:{(kw.effective_weight ?? kw.effectiveWeight ?? 1).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-600">
                      {kw.times_flagged ?? kw.timesFlagged ?? 0}F / {kw.times_dismissed ?? kw.timesDismissed ?? 0}D
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading vocabulary...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Corrections */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Recent Corrections (Training Signals)
        </h3>
        {corrections.data && corrections.data.length > 0 ? (
          <div className="space-y-2">
            {corrections.data.map((c: any) => {
              const typeColors: Record<string, string> = {
                sentiment_override: "text-emerald-400 bg-emerald-500/10",
                compliance_dismiss: "text-amber-400 bg-amber-500/10",
                compliance_add: "text-purple-400 bg-purple-500/10",
                severity_change: "text-blue-400 bg-blue-500/10",
                threshold_adjust: "text-cyan-400 bg-cyan-500/10",
              };
              const typeLabels: Record<string, string> = {
                sentiment_override: "Sentiment Override",
                compliance_dismiss: "Compliance Dismissed",
                compliance_add: "Keyword Added",
                severity_change: "Severity Changed",
                threshold_adjust: "Threshold Adjusted",
              };
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3 bg-white/[0.01] border border-white/5 rounded-lg">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 mt-0.5 ${typeColors[c.correctionType ?? c.correction_type] ?? "text-slate-400 bg-slate-500/10"}`}>
                    {typeLabels[c.correctionType ?? c.correction_type] ?? c.correctionType ?? c.correction_type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-300 truncate">{c.eventTitle ?? c.event_title ?? c.eventId ?? c.event_id}</div>
                    {(c.originalValue != null || c.original_value != null) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {c.originalValue ?? c.original_value} → {c.correctedValue ?? c.corrected_value}
                        {(c.reason || c.correctedLabel || c.corrected_label) && (
                          <span className="text-slate-600"> · {c.reason ?? c.correctedLabel ?? c.corrected_label}</span>
                        )}
                      </div>
                    )}
                    {!(c.originalValue != null || c.original_value != null) && (c.reason || c.correctedLabel || c.corrected_label) && (
                      <div className="text-xs text-slate-500 mt-0.5">{c.reason ?? c.correctedLabel ?? c.corrected_label}</div>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{new Date(c.createdAt ?? c.created_at).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No corrections recorded yet</p>
            <p className="text-xs text-slate-600 mt-1">Go to Archives & Reports, select an event, and use "Correct AI Analysis" to submit your first training signal</p>
          </div>
        )}
      </div>

      {/* ═══ Autonomous Evolution Dashboard ═══ */}
      <div className="border-t border-purple-500/20 pt-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Autonomous Evolution Engine</h2>
              <p className="text-xs text-slate-500">Self-observing AI that detects gaps, proposes new tools, and auto-promotes based on evidence</p>
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={runAccumulation.isPending}
            onClick={() => runAccumulation.mutate()}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${runAccumulation.isPending ? "animate-spin" : ""}`} />
            Run Accumulation
          </Button>
        </div>

        {evolution.data && (
          <>
            {/* Evolution velocity stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {[
                { label: "Events Analyzed", value: evolution.data.eventsAnalyzed, color: "text-indigo-400" },
                { label: "Observations", value: evolution.data.totalObservations, color: "text-purple-400" },
                { label: "Tool Proposals", value: evolution.data.proposals?.length ?? 0, color: "text-cyan-400" },
                { label: "Last 7 Days", value: evolution.data.velocity?.last7days ?? 0, color: "text-emerald-400" },
                { label: "Last 30 Days", value: evolution.data.velocity?.last30days ?? 0, color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Observation type breakdown */}
            {evolution.data.observationsByType && Object.keys(evolution.data.observationsByType).length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Observation Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(evolution.data.observationsByType).map(([type, count]) => {
                    const typeColors: Record<string, string> = {
                      weak_module: "bg-red-500/10 text-red-400 border-red-500/20",
                      missing_capability: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      repeated_pattern: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      data_gap: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      cross_event_trend: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      operator_friction: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    };
                    return (
                      <span key={type} className={`px-3 py-1.5 rounded-full border text-xs font-medium ${typeColors[type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {type.replace(/_/g, " ")}: {count as number}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Gap Detection Matrix */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-400" /> Module Gap Matrix
                </h3>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {(evolution.data.gapMatrix ?? []).slice(0, 10).map((g: any) => (
                    <div key={g.module} className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.01] rounded-lg">
                      <span className="text-xs text-slate-400 w-36 truncate">{g.module}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${Math.min(100, g.gapScore * 200)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{(g.failRate * 100).toFixed(0)}% fail</span>
                    </div>
                  ))}
                  {(evolution.data.gapMatrix ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No gap data yet — process events to build the matrix</p>
                  )}
                </div>
              </div>

              {/* Cross-Event Patterns */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" /> Cross-Event Patterns
                </h3>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {(evolution.data.crossEventPatterns ?? []).map((p: any, i: number) => (
                    <div key={i} className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                      <div className="text-xs text-slate-300 font-medium mb-1 truncate">{p.pattern}</div>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>{p.frequency}x seen</span>
                        <span>{p.clientCount} clients</span>
                        <span>{p.eventTypeCount} event types</span>
                        <span className="ml-auto text-cyan-400 font-medium">{(p.breadthScore * 100).toFixed(0)}% breadth</span>
                      </div>
                    </div>
                  ))}
                  {(evolution.data.crossEventPatterns ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Patterns emerge after analyzing multiple events across different clients</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tool Proposals */}
            <div className="bg-white/[0.02] border border-indigo-500/20 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Autonomous Tool Proposals
                </h3>
                {evolution.data.proposalsByStatus && (
                  <div className="flex gap-2">
                    {Object.entries(evolution.data.proposalsByStatus).map(([status, ct]) => {
                      const sColors: Record<string, string> = {
                        emerging: "text-slate-400 bg-slate-500/10",
                        proposed: "text-amber-400 bg-amber-500/10",
                        approved: "text-emerald-400 bg-emerald-500/10",
                        building: "text-blue-400 bg-blue-500/10",
                        live: "text-purple-400 bg-purple-500/10",
                        rejected: "text-red-400 bg-red-500/10",
                      };
                      return (
                        <span key={status} className={`text-xs px-2 py-0.5 rounded-full ${sColors[status] ?? "text-slate-400 bg-slate-500/10"}`}>
                          {status}: {ct as number}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {(evolution.data.proposals ?? []).map((p: any) => {
                  const statusColors: Record<string, string> = {
                    emerging: "border-slate-500/30 bg-white/[0.01]",
                    proposed: "border-amber-500/30 bg-amber-500/[0.03]",
                    approved: "border-emerald-500/30 bg-emerald-500/[0.03]",
                    building: "border-blue-500/30 bg-blue-500/[0.03]",
                    live: "border-purple-500/30 bg-purple-500/[0.03]",
                    rejected: "border-red-500/20 bg-red-500/[0.02] opacity-50",
                  };
                  const impactColors: Record<string, string> = {
                    low: "text-slate-400", medium: "text-amber-400", high: "text-orange-400", transformative: "text-red-400",
                  };
                  return (
                    <div key={p.id} className={`border rounded-lg p-3 ${statusColors[p.status] ?? "border-white/10"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-200">{p.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              p.status === "emerging" ? "bg-slate-500/20 text-slate-400" :
                              p.status === "proposed" ? "bg-amber-500/20 text-amber-400" :
                              p.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                              p.status === "building" ? "bg-blue-500/20 text-blue-400" :
                              p.status === "live" ? "bg-purple-500/20 text-purple-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {p.status}
                            </span>
                            {p.estimatedImpact && (
                              <span className={`text-xs font-medium ${impactColors[p.estimatedImpact] ?? "text-slate-400"}`}>
                                {p.estimatedImpact} impact
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                          <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                            <span>{p.evidenceCount} evidence</span>
                            <span>Confidence: {((p.avgConfidence ?? 0) * 100).toFixed(0)}%</span>
                            <span className="text-slate-600">{p.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {p.status === "emerging" && (
                            <Button size="sm" variant="ghost" className="text-xs h-7 text-amber-400 hover:bg-amber-500/10"
                              onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "proposed" })}>
                              Propose
                            </Button>
                          )}
                          {p.status === "proposed" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "approved" })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:bg-red-500/10"
                                onClick={() => updateProposalStatus.mutate({ proposalId: p.id, status: "rejected" })}>
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(evolution.data.proposals ?? []).length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No tool proposals yet</p>
                    <p className="text-xs text-slate-600 mt-1">Process events through Shadow Mode — the AI will observe its own outputs and propose new tools</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Observations */}
            {(evolution.data.recentObservations ?? []).length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" /> Recent Observations
                </h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {(evolution.data.recentObservations ?? []).slice(0, 15).map((o: any) => {
                    const tColors: Record<string, string> = {
                      weak_module: "text-red-400 bg-red-500/10",
                      missing_capability: "text-amber-400 bg-amber-500/10",
                      repeated_pattern: "text-blue-400 bg-blue-500/10",
                      data_gap: "text-purple-400 bg-purple-500/10",
                      cross_event_trend: "text-emerald-400 bg-emerald-500/10",
                    };
                    return (
                      <div key={o.id} className="flex items-start gap-2 px-3 py-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${tColors[o.observationType] ?? "text-slate-400 bg-slate-500/10"}`}>
                          {(o.observationType ?? "").replace(/_/g, " ")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-300 line-clamp-1">{o.observation}</p>
                          <div className="flex gap-2 mt-0.5 text-xs text-slate-600">
                            {o.clientName && <span>{o.clientName}</span>}
                            {o.eventType && <span>{o.eventType}</span>}
                            <span>Conf: {((o.confidence ?? 0) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Algorithm stats card */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">Autonomous Evolution Algorithms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                <div>
                  <p className="text-slate-300 font-medium mb-1">Module Quality Scoring</p>
                  <p>Weighted depth/breadth/specificity analysis per module. Detects generic output vs transcript-specific intelligence.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Evidence Decay (14-day half-life)</p>
                  <p>Recent observations weighted exponentially higher. Proposals must sustain evidence to promote — stale gaps decay away.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Cross-Event Correlation</p>
                  <p>Detects patterns spanning multiple clients and event types. High-breadth gaps auto-promote to proposed tools.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 mt-4">
                <div>
                  <p className="text-slate-300 font-medium mb-1">Autonomous Promotion</p>
                  <p>Tools auto-promote: emerging (5+ evidence, 55%+ score) → proposed → approved (12+ evidence, 70%+ score).</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Gap Detection Matrix</p>
                  <p>Importance × failure_rate × (1-quality) × breadth. Systematically identifies blind spots across the 20-module grid.</p>
                </div>
                <div>
                  <p className="text-slate-300 font-medium mb-1">Impact Estimation</p>
                  <p>Frequency × breadth × severity × urgency composite. Each proposed tool gets a live impact score that evolves with data.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!evolution.data && !evolution.isLoading && (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Evolution engine not initialized</p>
            <p className="text-xs text-slate-600 mt-1">Process events through Shadow Mode to start the autonomous evolution cycle</p>
          </div>
        )}

        {evolution.isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-slate-500">Loading evolution data...</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-purple-300 mb-3">How the Self-Improving Loop Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs text-slate-400">
          {[
            { step: "1", title: "AI Observes", desc: "Every report is auto-scored for depth, breadth, and specificity across all 20 modules." },
            { step: "2", title: "Gaps Detected", desc: "Weak modules and missing capabilities are logged as observations with confidence scores." },
            { step: "3", title: "Patterns Cluster", desc: "The accumulation engine groups observations into tool proposals using cross-event correlation." },
            { step: "4", title: "Evidence Builds", desc: "Proposals gain evidence over time. Recent data weighted higher (14-day half-life decay)." },
            { step: "5", title: "Auto-Promote", desc: "Tools with sufficient evidence auto-promote: emerging → proposed → approved → built → live." },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mb-2">{step}</div>
              <p className="text-slate-300 font-medium mb-1">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdvisoryBotPanel() {
  const [sessionKey] = useState(() => `advisory-${Date.now()}`);
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const history = trpc.advisoryBot.getHistory.useQuery({ sessionKey }, {
    refetchInterval: false,
  });

  const chatMutation = trpc.advisoryBot.chat.useMutation({
    onSuccess: () => {
      history.refetch();
      setIsStreaming(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsStreaming(false);
    },
  });

  const clearMutation = trpc.advisoryBot.clearHistory.useMutation({
    onSuccess: () => {
      history.refetch();
      toast.success("Chat history cleared");
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;
    setIsStreaming(true);
    setMessage("");
    chatMutation.mutate({ sessionKey, message: trimmed });
  }, [message, isStreaming, sessionKey, chatMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.data]);

  const messages = history.data ?? [];

  const suggestedQuestions = [
    "What are the top risks across all recent events?",
    "Which client has the lowest sentiment trend?",
    "Summarize compliance flags from the past month",
    "What key topics were discussed most frequently?",
    "Are there any early warning signs of crisis?",
  ];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10">
            <MessageCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Private AI Advisory Bot</h2>
            <p className="text-xs text-slate-500">Query across all captured event intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate({ sessionKey })}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 mb-4">
              <Brain className="w-10 h-10 text-rose-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Ask anything about your events</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              The advisory bot has access to all your captured event data, AI reports,
              sentiment analysis, and compliance reviews. Ask strategic questions to get actionable insights.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(q);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-xs px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-rose-500/10 border border-rose-500/20 text-slate-200"
                : "bg-white/[0.03] border border-white/10 text-slate-300"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-medium text-rose-400/70">CuraLive Advisory</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="text-[10px] text-slate-600 mt-1.5">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-medium text-rose-400/70">CuraLive Advisory</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                <span className="text-sm text-slate-400">Analyzing your event data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about events, sentiment, compliance, risks..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/30 focus:ring-1 focus:ring-rose-500/20 transition-colors"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isStreaming}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 rounded-xl px-4 py-3 h-auto"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

```

---

### LiveSessionPanel.tsx (552 lines)
File: `client/src/components/LiveSessionPanel.tsx`

```typescript
import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Signal,
  Users,
  Clock,
  Activity,
  Settings,
  Send,
  Loader2,
  Download,
  Share2,
  Zap,
  HelpCircle,
} from "lucide-react";
import { WebPhoneCallManager } from "@/components/WebPhoneCallManager";
import ProviderStateIndicator, { ProviderState } from "@/components/ProviderStateIndicator";
import { useAblySessions } from "@/hooks/useAblySessions";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { SessionAutoSave } from "@/services/sessionAutoSave";

export interface LiveSession {
  id: string;
  eventName: string;
  status: "live" | "scheduled" | "ended";
  startedAt: number;
  duration: number;
  attendeeCount: number;
  connectivityProvider: "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
  providerStatus: "active" | "degraded" | "fallback" | "failed";
  fallbackReason?: string;
}

export interface LiveSessionPanelProps {
  session?: LiveSession;
  onClose?: () => void;
  isMinimized?: boolean;
}

export default function LiveSessionPanel({
  session: sessionProp,
  onClose,
  isMinimized = false,
}: LiveSessionPanelProps) {
  const defaultSession: LiveSession = {
    id: "live-session-default",
    eventName: "Live Session",
    status: "live",
    startedAt: Date.now() - 3600000,
    duration: 3600,
    attendeeCount: 0,
    connectivityProvider: "webphone",
    providerStatus: "active",
  };

  const session = sessionProp || defaultSession;

  const [activeTab, setActiveTab] = useState<"webphone" | "qa" | "transcript" | "notes">("webphone");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [handoffTargetId, setHandoffTargetId] = useState("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [recoveryPromptVisible, setRecoveryPromptVisible] = useState(false);
  const [sessionAutoSave, setSessionAutoSave] = useState<SessionAutoSave | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const { isConnected: ablyConnected, qaUpdates, transcriptUpdates, publishUpdate } = useAblySessions(session.id);

  const { data: qaData, isLoading: qaLoading, refetch: refetchQA } = trpc.session.getLiveQA.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id && !ablyConnected, refetchInterval: 3000 }
  );

  const { data: transcriptData, isLoading: transcriptLoading } = trpc.session.getLiveTranscript.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id && !ablyConnected, refetchInterval: 2000 }
  );

  const { data: notesData } = trpc.session.getNotes.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id }
  );

  const { data: analyticsData } = trpc.analytics.getSessionEventAnalytics.useQuery(
    { sessionId: session.id },
    { enabled: !!session.id, refetchInterval: 5000 }
  );

  const approveQuestionMutation = trpc.session.approveQuestion.useMutation({
    onSuccess: () => {
      refetchQA();
      publishUpdate({ action: "qa-approved", data: {} });
    },
  });

  const rejectQuestionMutation = trpc.session.rejectQuestion.useMutation({
    onSuccess: () => {
      refetchQA();
      publishUpdate({ action: "qa-rejected", data: {} });
    },
  });

  const saveNotesMutation = trpc.session.saveNotes.useMutation();

  const exportSessionMutation = trpc.session.exportSession.useMutation({
    onSuccess: (data) => {
      if (data.format === "json") {
        const blob = new Blob([data.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
  });

  const handoffSessionMutation = trpc.session.handoffSession.useMutation({
    onSuccess: () => {
      alert("Session handed off successfully");
      onClose?.();
    },
  });

  useEffect(() => {
    const autoSave = new SessionAutoSave(session.id);
    autoSave.start();
    setSessionAutoSave(autoSave);

    if (autoSave.hasRecoveryData()) {
      setRecoveryPromptVisible(true);
    }

    return () => {
      autoSave.destroy();
    };
  }, [session.id]);

  useEffect(() => {
    if (notesData?.notes) {
      setNotes(notesData.notes);
    }
  }, [notesData]);

  useEffect(() => {
    if (sessionAutoSave) {
      sessionAutoSave.update({
        notes,
        activeTab,
      });
    }
  }, [notes, activeTab, sessionAutoSave]);

  useEffect(() => {
    if (analyticsData) {
      setAnalytics(analyticsData);
    }
  }, [analyticsData]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await saveNotesMutation.mutateAsync({
        sessionId: session.id,
        notes,
      });
      if (sessionAutoSave) {
        sessionAutoSave.save();
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleExport = async (format: "json" | "pdf") => {
    setIsExporting(true);
    try {
      await exportSessionMutation.mutateAsync({
        sessionId: session.id,
        format,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export session");
    } finally {
      setIsExporting(false);
    }
  };

  const handleHandoff = async () => {
    if (!handoffTargetId) {
      alert("Please select a target operator");
      return;
    }
    setIsHandingOff(true);
    try {
      await handoffSessionMutation.mutateAsync({
        sessionId: session.id,
        targetOperatorId: handoffTargetId,
        handoffNotes: notes,
      });
    } catch (error) {
      console.error("Handoff failed:", error);
      alert("Failed to handoff session");
    } finally {
      setIsHandingOff(false);
    }
  };

  useKeyboardShortcuts({
    onMuteAll: () => {
      console.log("[Shortcuts] Mute all triggered");
    },
    onApproveQA: () => {
      if (pendingQuestions.length > 0) {
        handleApproveQuestion((pendingQuestions[0] as any).id);
      }
    },
    onRejectQA: () => {
      if (pendingQuestions.length > 0) {
        handleRejectQuestion((pendingQuestions[0] as any).id);
      }
    },
    onSaveNotes: handleSaveNotes,
    onExport: () => handleExport("json"),
    onHandoff: () => {
      if (handoffTargetId) {
        handleHandoff();
      }
    },
    onShowHelp: () => setShowShortcutsHelp(true),
  });

  const qaPending = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "new").length : qaData?.pendingCount || 0;
  const qaApproved = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "approved").length : qaData?.approvedCount || 0;
  const pendingQuestions = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "new").map(u => u.data) : qaData?.pending || [];
  const approvedQuestions = ablyConnected && qaUpdates.length > 0 ? qaUpdates.filter(u => u.action === "approved").map(u => u.data) : qaData?.approved || [];

  const liveTranscript = ablyConnected && transcriptUpdates.length > 0 ? transcriptUpdates.map(u => u.data) : transcriptData || [];

  const providerState: ProviderState = {
    provider: session.connectivityProvider,
    status: session.providerStatus,
    fallbackReason: session.fallbackReason,
    connectionQuality: ablyConnected ? "excellent" : "fair",
    latency: ablyConnected ? 45 : 200,
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handleApproveQuestion = (questionId: string) => {
    approveQuestionMutation.mutate({
      questionId,
      sessionId: session.id,
    });
  };

  const handleRejectQuestion = (questionId: string) => {
    rejectQuestionMutation.mutate({
      questionId,
      sessionId: session.id,
    });
  };

  const handleRecovery = () => {
    if (sessionAutoSave?.hasRecoveryData()) {
      const recovered = sessionAutoSave.getRecoveryData();
      setNotes(recovered.notes);
      setActiveTab(recovered.activeTab as any);
      setRecoveryPromptVisible(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${session.status === "live" ? "bg-red-600 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-sm font-semibold">{session.eventName}</span>
          {ablyConnected && <Badge className="bg-green-600 text-white text-xs">Live</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h2 className="text-lg font-bold">{session.eventName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.duration)}</span>
                <Users className="w-4 h-4" />
                <span>{session.attendeeCount} attendees</span>
              </div>
            </div>
          </div>

          {analytics && (
            <div className="flex items-center gap-4 px-4 border-l border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.engagementScore || 0}</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.qaMetrics?.approvalRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Q&A Approval</div>
              </div>
            </div>
          )}

          <div className="px-4 border-l border-border">
            <ProviderStateIndicator state={providerState} compact />
          </div>

          <div className="px-4 border-l border-border">
            <Badge className={ablyConnected ? "bg-green-600" : "bg-yellow-600"}>
              <Signal className="w-3 h-3 mr-1" />
              {ablyConnected ? "Live" : "Polling"}
            </Badge>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {recoveryPromptVisible && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-900">Session recovery data found. Restore your previous state?</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRecoveryPromptVisible(false)}>
                Discard
              </Button>
              <Button size="sm" onClick={handleRecovery}>
                Restore
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-muted/50 px-4">
              <TabsTrigger value="webphone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WebPhone
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Q&A <Badge variant="outline" className="ml-1">{qaPending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webphone" className="flex-1 overflow-auto p-4">
              <WebPhoneCallManager sessionId={session.id} />
            </TabsContent>

            <TabsContent value="qa" className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Pending Questions ({qaPending})</h3>
                {pendingQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending questions</p>
                ) : (
                  <div className="space-y-2">
                    {pendingQuestions.map((q: any) => (
                      <Card key={q.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.question}</p>
                            <p className="text-xs text-muted-foreground mt-1">From: {q.askerName}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveQuestion(q.id)}
                              disabled={approveQuestionMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectQuestion(q.id)}
                              disabled={rejectQuestionMutation.isPending}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Approved Questions ({qaApproved})</h3>
                {approvedQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved questions</p>
                ) : (
                  <div className="space-y-2">
                    {approvedQuestions.map((q: any) => (
                      <Card key={q.id} className="p-3 bg-green-50">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">From: {q.askerName}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {liveTranscript.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transcript yet</p>
                ) : (
                  liveTranscript.map((entry: any, idx: number) => (
                    <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-1">
                      <span className="font-medium">{entry.speaker}:</span> {entry.text}
                      <span className="text-xs text-muted-foreground ml-2">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-auto p-4 flex flex-col">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add operator notes here..."
                className="flex-1 resize-none"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-2 w-full"
              >
                {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Save Notes
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-card border-t border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Shortcuts (?)
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleHandoff}
              disabled={isHandingOff}
            >
              {isHandingOff ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              Handoff
            </Button>
          </div>
        </div>

        {showShortcutsHelp && (
          <div className="absolute bottom-20 right-4 bg-card border border-border rounded-lg p-4 shadow-lg w-80 z-50">
            <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-mono bg-muted px-2 py-1 rounded">{shortcut.key}</span>
                  <span className="text-muted-foreground">{shortcut.action}</span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setShowShortcutsHelp(false)}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { LiveSessionPanel };

```

---

### LocalAudioCapture.tsx (616 lines)
File: `client/src/components/LocalAudioCapture.tsx`

```typescript
// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic, MicOff, Radio, Square, Volume2, VolumeX,
  Monitor, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";

type CaptureMode = "mic" | "tab" | "system";

interface LocalAudioCaptureProps {
  sessionId: number;
  isActive: boolean;
  onSegment?: (segment: { speaker: string; text: string; timestamp: number; timeLabel: string }) => void;
}

const WHISPER_CHUNK_INTERVAL_MS = 15000;

export default function LocalAudioCapture({ sessionId, isActive, onSegment }: LocalAudioCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>("tab");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentCount, setSegmentCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const interimRef = useRef<string>("");

  const whisperRecorderRef = useRef<MediaRecorder | null>(null);
  const whisperChunksRef = useRef<Blob[]>([]);
  const whisperIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whisperActiveRef = useRef(false);
  const captureModeRef = useRef<CaptureMode>(captureMode);

  useEffect(() => {
    captureModeRef.current = captureMode;
  }, [captureMode]);

  const pushSegment = trpc.shadowMode.pushTranscriptSegment.useMutation();

  const sendSegment = useCallback((text: string, speaker?: string) => {
    if (!text.trim() || text.trim().length < 2) return;
    const now = Date.now();
    const timeLabel = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const segment = { speaker: speaker || "Call Audio", text: text.trim(), timestamp: now, timeLabel };

    setSegmentCount(c => c + 1);
    onSegment?.(segment);

    pushSegment.mutate({
      sessionId,
      speaker: segment.speaker,
      text: segment.text,
      timestamp: segment.timestamp,
      timeLabel: segment.timeLabel,
    });
  }, [sessionId, onSegment, pushSegment]);

  const [chunksSent, setChunksSent] = useState(0);
  const [lastChunkSize, setLastChunkSize] = useState(0);
  const [lastChunkStatus, setLastChunkStatus] = useState<string>("");

  const sendWhisperChunk = useCallback(async () => {
    const chunkCount = whisperChunksRef.current.length;
    if (chunkCount === 0) {
      console.log("[LocalAudio] sendWhisperChunk: no chunks collected yet");
      return;
    }

    const blob = new Blob(whisperChunksRef.current, { type: "audio/webm;codecs=opus" });
    whisperChunksRef.current = [];

    console.log(`[LocalAudio] sendWhisperChunk: ${chunkCount} sub-chunks, blob size=${blob.size} bytes`);
    setLastChunkSize(blob.size);

    if (blob.size < 1000) {
      console.log("[LocalAudio] Chunk too small, skipping (< 1000 bytes — likely silence)");
      setLastChunkStatus("too small (silence?)");
      return;
    }

    setIsTranscribing(true);
    setLastChunkStatus("sending...");
    try {
      const fd = new FormData();
      fd.append("file", blob, "chunk.webm");
      const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
      const statusCode = res.status;
      if (res.ok) {
        const data = await res.json();
        const transcript = data.transcript;
        console.log(`[LocalAudio] Whisper response OK: "${transcript?.slice(0, 80)}..." (${transcript?.length || 0} chars)`);
        setChunksSent(c => c + 1);
        if (transcript && transcript.trim().length > 1) {
          sendSegment(transcript, "Call Audio");
          setLastChunkStatus(`transcribed (${transcript.trim().split(/\s+/).length} words)`);
        } else {
          setLastChunkStatus("empty transcript returned");
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[LocalAudio] Whisper failed (${statusCode}):`, errText.slice(0, 200));
        setLastChunkStatus(`failed (${statusCode})`);
      }
    } catch (err: any) {
      console.warn("[LocalAudio] Whisper chunk error:", err);
      setLastChunkStatus(`error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [sendSegment]);

  const startWhisperTranscription = useCallback((stream: MediaStream) => {
    try {
      const audioStream = new MediaStream(stream.getAudioTracks());
      const recorder = new MediaRecorder(audioStream, { mimeType: "audio/webm;codecs=opus" });
      whisperChunksRef.current = [];
      whisperActiveRef.current = true;

      let subChunkCount = 0;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          whisperChunksRef.current.push(e.data);
          subChunkCount++;
          if (subChunkCount <= 3 || subChunkCount % 10 === 0) {
            console.log(`[LocalAudio] Recorder data: sub-chunk #${subChunkCount}, size=${e.data.size} bytes, total buffered=${whisperChunksRef.current.length}`);
          }
        }
      };

      recorder.onerror = (e: any) => {
        console.error("[LocalAudio] MediaRecorder error:", e.error || e);
      };

      recorder.start(1000);
      whisperRecorderRef.current = recorder;
      console.log(`[LocalAudio] MediaRecorder state: ${recorder.state}, mimeType: ${recorder.mimeType}`);

      whisperIntervalRef.current = setInterval(() => {
        if (whisperActiveRef.current) {
          sendWhisperChunk();
        }
      }, WHISPER_CHUNK_INTERVAL_MS);

      console.log("[LocalAudio] Whisper chunked transcription started (output audio)");
    } catch (err) {
      console.warn("[LocalAudio] Failed to start Whisper transcription:", err);
    }
  }, [sendWhisperChunk]);

  const stopWhisperTranscription = useCallback(() => {
    whisperActiveRef.current = false;
    if (whisperIntervalRef.current) {
      clearInterval(whisperIntervalRef.current);
      whisperIntervalRef.current = null;
    }
    if (whisperRecorderRef.current && whisperRecorderRef.current.state !== "inactive") {
      try {
        whisperRecorderRef.current.onstop = () => {
          sendWhisperChunk();
        };
        whisperRecorderRef.current.stop();
      } catch {
        sendWhisperChunk();
      }
    } else {
      sendWhisperChunk();
    }
    whisperRecorderRef.current = null;
  }, [sendWhisperChunk]);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        sendSegment(finalTranscript, "Microphone");
        interimRef.current = "";
      } else {
        interimRef.current = interimTranscript;
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn("[LocalAudio] Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access and try again.");
        stopCapture();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isCapturing && !isPaused) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {}
      }
    };

    return recognition;
  }, [sendSegment, isCapturing, isPaused]);

  const startAudioLevelMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);

    try {
      let stream: MediaStream;

      if (captureMode === "tab" || captureMode === "system") {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });

          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = false;
          });
        } catch (err: any) {
          if (err.name === "NotAllowedError") {
            setError("Screen sharing was cancelled. You need to share a tab/window and check 'Share audio' to capture the call audio.");
            return;
          }
          throw err;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          stream.getTracks().forEach(t => t.stop());
          setError("No audio track found. When sharing, make sure to check 'Share tab audio' or 'Share system audio' at the bottom of the dialog.");
          return;
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      stream.getTracks().forEach(track => {
        track.onended = () => {
          stopCapture();
          toast.info("Audio capture stopped — the shared tab or audio source was closed.");
        };
      });

      startAudioLevelMonitor(stream);

      try {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start(5000);
        mediaRecorderRef.current = recorder;
      } catch {}

      if (captureMode === "tab" || captureMode === "system") {
        startWhisperTranscription(stream);
        setIsListening(true);
      } else {
        const recognition = startSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
          setIsListening(true);
        }
      }

      setIsCapturing(true);
      setIsPaused(false);
      toast.success(
        captureMode === "tab" || captureMode === "system"
          ? "Capturing call audio — transcribing output via Whisper AI"
          : "Local audio capture started — CuraLive is now listening"
      );
    } catch (err: any) {
      console.error("[LocalAudio] Start failed:", err);
      setError(`Failed to start audio capture: ${err.message}`);
    }
  }, [captureMode, startSpeechRecognition, startAudioLevelMonitor, startWhisperTranscription]);

  const saveRecording = useCallback(async () => {
    if (chunksRef.current.length === 0) return;
    setIsSavingRecording(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      const formData = new FormData();
      formData.append("recording", blob, `shadow-${sessionId}.webm`);

      const res = await fetch(`/api/shadow/recording/${sessionId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setRecordingSaved(true);
        toast.success("Recording saved — available for download in the session");
      } else {
        toast.error("Failed to save recording");
      }
    } catch (err) {
      console.error("[LocalAudio] Recording save failed:", err);
      toast.error("Failed to save recording");
    } finally {
      setIsSavingRecording(false);
      chunksRef.current = [];
    }
  }, [sessionId]);

  const stopCapture = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    stopWhisperTranscription();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.onstop = () => {
          saveRecording();
        };
        mediaRecorderRef.current.stop();
      } catch {
        saveRecording();
      }
    } else {
      saveRecording();
    }
    mediaRecorderRef.current = null;

    setIsCapturing(false);
    setIsPaused(false);
    setAudioLevel(0);
    setIsListening(false);
  }, [saveRecording, stopWhisperTranscription]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      if (captureModeRef.current === "mic" && recognitionRef.current) {
        try { recognitionRef.current.start(); setIsListening(true); } catch {}
      }
      if (captureModeRef.current === "tab" || captureModeRef.current === "system") {
        whisperActiveRef.current = true;
        setIsListening(true);
      }
      setIsPaused(false);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      whisperActiveRef.current = false;
      setIsPaused(true);
      setIsListening(false);
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  useEffect(() => {
    if (!isActive && isCapturing) {
      stopCapture();
    }
  }, [isActive]);

  if (!isActive && !isSavingRecording) return null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-300 font-medium">Local Audio Capture</span>
          {isCapturing && !isPaused && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {captureModeRef.current === "mic" ? "Listening" : "Capturing Output"}
            </span>
          )}
          {isPaused && (
            <span className="text-xs text-amber-400">Paused</span>
          )}
        </div>
        {isCapturing && (
          <span className="text-xs text-slate-500">{segmentCount} segments captured</span>
        )}
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {isSavingRecording && (
          <div className="mb-4 p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <p className="text-xs text-cyan-300">Saving recording...</p>
          </div>
        )}

        {recordingSaved && !isCapturing && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">Recording saved — you can download it from the Event Recording section above after ending the session.</p>
          </div>
        )}

        {!isCapturing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Audio Source</label>
              <div className="flex gap-2">
                {[
                  { mode: "tab" as CaptureMode, label: "Tab / Window Audio", icon: Monitor, desc: "Captures and transcribes the call audio output (what participants are saying)" },
                  { mode: "mic" as CaptureMode, label: "Microphone", icon: Mic, desc: "Captures audio from your device microphone (speakerphone mode)" },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setCaptureMode(mode)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      captureMode === mode
                        ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                {captureMode === "tab"
                  ? "Share the tab with the call — CuraLive captures the call's audio output and transcribes what participants are saying via Whisper AI. Transcription updates every ~15 seconds."
                  : "Uses your device microphone — put the call on speaker or use a speakerphone. Works with any audio source."}
              </p>
            </div>

            <Button
              onClick={startCapture}
              className="bg-cyan-600 hover:bg-cyan-500 gap-2 w-full"
            >
              <Radio className="w-4 h-4" />
              Start Local Audio Capture
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500">Audio Level</span>
                  {audioLevel > 5 ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${audioLevel}%`,
                      backgroundColor: audioLevel > 60 ? "#10b981" : audioLevel > 20 ? "#06b6d4" : "#64748b",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePause}
                  className={isPaused ? "text-amber-400 hover:text-amber-300" : "text-slate-400 hover:text-white"}
                >
                  {isPaused ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  size="sm"
                  onClick={stopCapture}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/20 gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </Button>
              </div>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {captureModeRef.current === "mic"
                    ? "Speech recognition active — transcribing microphone input in real-time"
                    : "Whisper AI active — transcribing call output audio every ~15 seconds"}
                </span>
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing audio chunk with Whisper AI...</span>
              </div>
            )}

            {(chunksSent > 0 || lastChunkStatus) && (
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Chunks sent: <strong className="text-slate-300">{chunksSent}</strong></span>
                  {lastChunkSize > 0 && <span>Last size: <strong className="text-slate-300">{(lastChunkSize / 1024).toFixed(1)}KB</strong></span>}
                  {lastChunkStatus && <span>Status: <strong className={lastChunkStatus.includes("transcribed") ? "text-emerald-400" : lastChunkStatus.includes("fail") || lastChunkStatus.includes("error") ? "text-red-400" : "text-amber-400"}>{lastChunkStatus}</strong></span>}
                </div>
              </div>
            )}

            {captureModeRef.current === "mic" && interimRef.current && (
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-600 italic">{interimRef.current}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-cyan-900/10 border border-cyan-500/10">
              <p className="text-[11px] text-cyan-300/70">
                {captureModeRef.current === "tab"
                  ? "Capturing and transcribing the call's audio output. Whisper AI processes chunks every ~15 seconds. Keep the shared tab open. The transcript appears in the Live Transcript panel above."
                  : "Capturing audio from your microphone. Speak clearly or place your device near the audio source. The transcript appears in the Live Transcript panel above."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

---

### AIDashboard.tsx (1189 lines)
File: `client/src/components/AIDashboard.tsx`

```typescript
// @ts-nocheck
import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brain, ChevronDown, ChevronRight, Search, Download, FileText,
  Activity, Shield, Users, MessageSquare, Target, Zap, Lightbulb,
  BarChart3, AlertTriangle, Swords, Gauge, Mic, TrendingUp,
  Banknote, Leaf, Newspaper, Share2, Briefcase, CheckCircle2,
  Loader2, Eye, EyeOff, Volume2, Clock, Tag, Play,
  Settings, Package, Crown, Star, Mail, Save, Upload,
  ChevronUp, Cpu, FileAudio, SquareCheck, Square, PlayCircle,
  Flame, DollarSign, ShieldCheck, Map, ScrollText,
} from "lucide-react";

const AI_SERVICES = [
  { key: "recording", label: "Audio / Video Recording", icon: Volume2, color: "text-cyan-400", category: "capture", description: "Upload and store event recordings with playback" },
  { key: "transcription", label: "AI Transcription (Whisper)", icon: FileText, color: "text-violet-400", category: "capture", description: "Convert audio/video to searchable text via OpenAI Whisper" },
  { key: "executiveSummary", label: "Executive Summary", icon: FileText, color: "text-blue-400", category: "essential", description: "3-5 sentence high-level overview of the event" },
  { key: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity, color: "text-emerald-400", category: "essential", description: "0-100 score with narrative and key sentiment drivers" },
  { key: "complianceReview", label: "Compliance Review", icon: Shield, color: "text-amber-400", category: "essential", description: "Risk level assessment with flagged phrases" },
  { key: "keyTopics", label: "Key Topics", icon: Tag, color: "text-violet-400", category: "essential", description: "Categorized topics with sentiment and detail" },
  { key: "speakerAnalysis", label: "Speaker Analysis", icon: Users, color: "text-cyan-400", category: "professional", description: "Breakdown by speaker with role and key points" },
  { key: "questionsAsked", label: "Q&A Analysis", icon: MessageSquare, color: "text-blue-300", category: "professional", description: "Questions asked, who asked them, and quality rating" },
  { key: "actionItems", label: "Action Items", icon: Target, color: "text-orange-400", category: "professional", description: "Tasks identified with owners and deadlines" },
  { key: "investorSignals", label: "Investor Signals", icon: Zap, color: "text-yellow-400", category: "professional", description: "Commitment or concern signals with interpretation" },
  { key: "communicationScore", label: "Communication Score", icon: Gauge, color: "text-teal-400", category: "professional", description: "Clarity, transparency, and quality assessment" },
  { key: "riskFactors", label: "Risk Factors", icon: AlertTriangle, color: "text-red-400", category: "professional", description: "Identified risks with impact and likelihood" },
  { key: "competitiveIntelligence", label: "Competitive Intelligence", icon: Swords, color: "text-pink-400", category: "enterprise", description: "Competitor mentions and market references" },
  { key: "recommendations", label: "Strategic Recommendations", icon: Lightbulb, color: "text-amber-300", category: "enterprise", description: "Actionable advice based on event outcomes" },
  { key: "speakingPaceAnalysis", label: "Speaking Pace Coaching", icon: Mic, color: "text-indigo-400", category: "enterprise", description: "WPM analysis, filler words, delivery score" },
  { key: "toxicityScreen", label: "Toxicity & Language Risk", icon: Shield, color: "text-rose-400", category: "enterprise", description: "Inappropriate content, price-sensitive info detection" },
  { key: "sentimentArc", label: "Sentiment Arc", icon: TrendingUp, color: "text-green-400", category: "enterprise", description: "Sentiment trajectory from opening to closing" },
  { key: "financialHighlights", label: "Financial Highlights", icon: Banknote, color: "text-emerald-300", category: "enterprise", description: "Key metrics with YoY change analysis" },
  { key: "esgMentions", label: "ESG & Sustainability", icon: Leaf, color: "text-lime-400", category: "enterprise", description: "Environmental, social, governance commitments" },
  { key: "pressReleaseDraft", label: "Press Release Draft", icon: Newspaper, color: "text-sky-400", category: "enterprise", description: "Auto-generated SENS/RNS-style summary" },
  { key: "socialMediaContent", label: "Social Media Content", icon: Share2, color: "text-fuchsia-400", category: "enterprise", description: "Ready-to-post content for LinkedIn/Twitter" },
  { key: "boardReadySummary", label: "Board-Ready Summary", icon: Briefcase, color: "text-purple-400", category: "enterprise", description: "High-level verdict with risks and opportunities" },
  { key: "crisisPrediction", label: "Crisis Prediction Engine", icon: Flame, color: "text-red-500", category: "strategic", description: "Predictive crisis detection from communication signal trajectories" },
  { key: "valuationImpact", label: "Valuation Impact Oracle", icon: DollarSign, color: "text-emerald-500", category: "strategic", description: "Model effect on fair value from material disclosures and guidance" },
  { key: "disclosureCertificate", label: "Clean Disclosure Certificate", icon: ShieldCheck, color: "text-teal-400", category: "strategic", description: "SHA-256 hash-chain compliance attestation per event" },
  { key: "monthlyReport", label: "Monthly Intelligence Report", icon: ScrollText, color: "text-sky-400", category: "strategic", description: "Aggregate monthly executive intelligence brief" },
  { key: "evolutionAudit", label: "Evolution Audit Trail", icon: Map, color: "text-orange-400", category: "strategic", description: "Blockchain-style audit trail of autonomous AI evolution decisions" },
];

const CATEGORIES = [
  { key: "capture", label: "Capture & Transcription", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "essential", label: "Essential Intelligence", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "professional", label: "Professional Analytics", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { key: "enterprise", label: "Enterprise Suite", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "strategic", label: "Strategic Intelligence (CIP 4)", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

const TIER_PRESETS = {
  essential: { label: "Essential", count: 6, icon: Star, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    keys: new Set(["recording", "transcription", "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics"]) },
  professional: { label: "Professional", count: 12, icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    keys: new Set(["recording", "transcription", "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics",
      "speakerAnalysis", "questionsAsked", "actionItems", "investorSignals", "communicationScore", "riskFactors"]) },
  enterprise: { label: "Enterprise", count: AI_SERVICES.length, icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
    keys: new Set(AI_SERVICES.map(s => s.key)) },
};

type Tier = keyof typeof TIER_PRESETS;

interface AIDashboardProps {
  sessions: Array<{
    id: number;
    clientName: string;
    eventName: string;
    eventType: string;
    platform: string;
    status: string;
    transcriptSegments: number | null;
    taggedMetricsGenerated: number | null;
    sentimentAvg: number | null;
    createdAt: Date;
  }>;
}

function ModuleDataRenderer({ moduleKey, data }: { moduleKey: string; data: any }) {
  if (!data) return <span className="text-slate-600 italic">No data available</span>;

  if (typeof data === "string") {
    return <p className="leading-relaxed whitespace-pre-wrap">{data}</p>;
  }

  if (moduleKey === "sentimentAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${data.score >= 70 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {data.score}/100
          </div>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{data.narrative}</p>
        {data.keyDrivers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.keyDrivers.map((d: string, i: number) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{d}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "complianceReview" && typeof data === "object") {
    const riskColors: Record<string, string> = { Low: "text-emerald-400", Moderate: "text-amber-400", High: "text-orange-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <span className={`text-sm font-semibold ${riskColors[data.riskLevel] || "text-slate-400"}`}>Risk Level: {data.riskLevel}</span>
        {data.flaggedPhrases?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Flagged Phrases:</div>
            <ul className="space-y-0.5">{data.flaggedPhrases.map((p: string, i: number) => <li key={i} className="text-xs text-red-300">• {p}</li>)}</ul>
          </div>
        )}
        {data.recommendations?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Recommendations:</div>
            <ul className="space-y-0.5">{data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "communicationScore" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Overall", value: data.score },
            { label: "Clarity", value: data.clarity },
            { label: "Transparency", value: data.transparency },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-lg p-2 text-center">
              <div className={`text-lg font-bold ${(s.value ?? 0) >= 70 ? "text-emerald-400" : (s.value ?? 0) >= 50 ? "text-amber-400" : "text-red-400"}`}>{s.value ?? "—"}</div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
        {data.narrative && <p className="text-xs text-slate-400 leading-relaxed">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "sentimentArc" && typeof data === "object") {
    const trendColors: Record<string, string> = { Improving: "text-emerald-400", Stable: "text-blue-400", Declining: "text-red-400", Volatile: "text-amber-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Opening</span><span>Midpoint</span><span>Closing</span>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[data.opening, data.midpoint, data.closing].map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium text-slate-300 mb-0.5">{v}</div>
                  <div className={`w-full rounded-t ${v >= 70 ? "bg-emerald-500/40" : v >= 50 ? "bg-amber-500/40" : "bg-red-500/40"}`} style={{ height: `${Math.max(4, (v / 100) * 48)}px` }} />
                </div>
              ))}
            </div>
          </div>
          <span className={`text-sm font-semibold ${trendColors[data.trend] || "text-slate-400"}`}>{data.trend}</span>
        </div>
        {data.narrative && <p className="text-xs text-slate-400">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "speakingPaceAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-indigo-400">{data.overallWpm ?? "—"}</div>
            <div className="text-[10px] text-slate-600">WPM</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-300">{data.paceLabel ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Pace</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{data.deliveryScore ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Delivery</div>
          </div>
        </div>
        {data.coachingTips?.length > 0 && (
          <ul className="space-y-0.5">{data.coachingTips.map((t: string, i: number) => <li key={i} className="text-xs text-slate-400">• {t}</li>)}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "toxicityScreen" && typeof data === "object") {
    const riskColors: Record<string, string> = { Clean: "text-emerald-400", Low: "text-blue-400", Moderate: "text-amber-400", High: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${riskColors[data.overallRisk] || "text-slate-400"}`}>{data.overallRisk}</span>
          {data.priceSensitive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Price Sensitive</span>}
          {data.legalRisk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Legal Risk</span>}
        </div>
        {data.flaggedContent?.length > 0 && (
          <ul className="space-y-1">{data.flaggedContent.map((f: any, i: number) => (
            <li key={i} className="text-xs"><span className="text-red-300">"{f.phrase}"</span> <span className="text-slate-600">— {f.issue} ({f.severity})</span></li>
          ))}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "boardReadySummary" && typeof data === "object") {
    const verdictColors: Record<string, string> = { Strong: "text-emerald-400", Satisfactory: "text-blue-400", Concerning: "text-amber-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className={`text-lg font-bold ${verdictColors[data.verdict] || "text-slate-400"}`}>{data.verdict}</div>
        {data.keyRisks?.length > 0 && (
          <div><div className="text-xs text-red-400/70 mb-0.5">Risks</div><ul>{data.keyRisks.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul></div>
        )}
        {data.keyOpportunities?.length > 0 && (
          <div><div className="text-xs text-emerald-400/70 mb-0.5">Opportunities</div><ul>{data.keyOpportunities.map((o: string, i: number) => <li key={i} className="text-xs text-slate-400">• {o}</li>)}</ul></div>
        )}
        {data.recommendedActions?.length > 0 && (
          <div><div className="text-xs text-blue-400/70 mb-0.5">Actions</div><ul>{data.recommendedActions.map((a: string, i: number) => <li key={i} className="text-xs text-slate-400">• {a}</li>)}</ul></div>
        )}
      </div>
    );
  }

  if (moduleKey === "crisisPrediction" && typeof data === "object") {
    const levelColors: Record<string, string> = { low: "text-emerald-400", moderate: "text-amber-400", elevated: "text-orange-400", high: "text-red-400", critical: "text-red-500" };
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${levelColors[data.riskLevel] || "text-slate-400"}`}>{data.riskScore ?? "—"}/100</div>
          <span className={`text-sm font-semibold uppercase ${levelColors[data.riskLevel] || "text-slate-400"}`}>{data.riskLevel}</span>
          {data.predictedCrisisType && data.predictedCrisisType !== "none" && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{data.predictedCrisisType}</span>
          )}
        </div>
        {data.earlyWarnings?.length > 0 && (
          <div><div className="text-xs text-amber-400/70 mb-1">Early Warnings</div>
            <ul className="space-y-0.5">{data.earlyWarnings.map((w: string, i: number) => <li key={i} className="text-xs text-slate-400">⚠ {w}</li>)}</ul>
          </div>
        )}
        {data.indicators?.length > 0 && (
          <div><div className="text-xs text-slate-500 mb-1">Risk Indicators</div>
            <ul className="space-y-1">{data.indicators.slice(0, 5).map((ind: any, i: number) => (
              <li key={i} className="text-xs"><span className={ind.severity === "high" ? "text-red-300" : ind.severity === "medium" ? "text-amber-300" : "text-slate-300"}>{ind.signal}</span></li>
            ))}</ul>
          </div>
        )}
        {data.holdingStatement && (
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <div className="text-xs text-red-400/70 mb-1">Draft Holding Statement</div>
            <p className="text-xs text-slate-300 leading-relaxed">{data.holdingStatement}</p>
          </div>
        )}
        {data.recommendedActions?.length > 0 && (
          <div><div className="text-xs text-blue-400/70 mb-1">Recommended Actions</div>
            <ul className="space-y-0.5">{data.recommendedActions.map((a: string, i: number) => <li key={i} className="text-xs text-slate-400">• {a}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "valuationImpact" && typeof data === "object") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-300">{data.priorSentiment ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Pre-Event</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-300">{data.postSentiment ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Post-Event</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className={`text-lg font-bold ${(data.sentimentDelta ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{(data.sentimentDelta ?? 0) >= 0 ? "+" : ""}{data.sentimentDelta ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Delta</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">Predicted Impact:</span>
          <span className={`text-sm font-bold ${String(data.predictedShareImpact ?? "").startsWith("+") ? "text-emerald-400" : String(data.predictedShareImpact ?? "").startsWith("-") ? "text-red-400" : "text-slate-400"}`}>{data.predictedShareImpact ?? "—"}</span>
        </div>
        {data.materialDisclosures?.length > 0 && (
          <div><div className="text-xs text-slate-500 mb-1">Material Disclosures</div>
            <ul className="space-y-1">{data.materialDisclosures.slice(0, 5).map((d: any, i: number) => (
              <li key={i} className="text-xs"><span className={d.impact === "positive" ? "text-emerald-300" : d.impact === "negative" ? "text-red-300" : "text-slate-300"}>{d.disclosure}</span> <span className="text-slate-600">({d.magnitude})</span></li>
            ))}</ul>
          </div>
        )}
        {data.marketReactionPrediction && <p className="text-xs text-slate-400 leading-relaxed italic">{data.marketReactionPrediction}</p>}
      </div>
    );
  }

  if (moduleKey === "disclosureCertificate" && typeof data === "object") {
    const statusColors: Record<string, string> = { clean: "text-emerald-400", flagged: "text-amber-400", review_required: "text-red-400" };
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-6 h-6 ${statusColors[data.complianceStatus] || "text-slate-400"}`} />
          <span className={`text-sm font-semibold uppercase ${statusColors[data.complianceStatus] || "text-slate-400"}`}>{(data.complianceStatus ?? "unknown").replace("_", " ")}</span>
          {data.jurisdictions?.length > 0 && data.jurisdictions.map((j: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">{j}</span>
          ))}
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-600">Certificate Hash</div>
          <div className="text-xs text-teal-300 font-mono break-all">{data.certificateHash ?? "—"}</div>
        </div>
        {data.hashChain?.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Hash Chain ({data.hashChain.length} steps)</div>
            {data.hashChain.map((step: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="text-teal-400">{i + 1}.</span>
                <span className="text-slate-400">{step.step}</span>
                <span className="text-slate-600 font-mono truncate flex-1">{step.hash?.slice(0, 16)}...</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "monthlyReport" && typeof data === "object") {
    return (
      <div className="space-y-3">
        {data.headline && <div className="text-sm font-medium text-slate-200">{data.headline}</div>}
        {data.communicationHealthScore != null && (
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${data.communicationHealthScore >= 70 ? "text-emerald-400" : data.communicationHealthScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{data.communicationHealthScore}/100</div>
            <span className="text-xs text-slate-500">Communication Health</span>
            {data.sentimentTrend && <span className={`text-xs px-2 py-0.5 rounded ${data.sentimentTrend === "improving" ? "bg-emerald-500/10 text-emerald-400" : data.sentimentTrend === "declining" ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-400"}`}>{data.sentimentTrend}</span>}
          </div>
        )}
        {data.executiveSummary && <p className="text-xs text-slate-400 leading-relaxed">{data.executiveSummary}</p>}
        {data.topRisks?.length > 0 && (
          <div><div className="text-xs text-red-400/70 mb-1">Top Risks</div>
            <ul className="space-y-0.5">{data.topRisks.map((r: any, i: number) => <li key={i} className="text-xs text-slate-400">• {r.risk} <span className="text-slate-600">({r.severity})</span></li>)}</ul>
          </div>
        )}
        {data.recommendations?.length > 0 && (
          <div><div className="text-xs text-blue-400/70 mb-1">Recommendations</div>
            <ul className="space-y-0.5">{data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "evolutionAudit" && typeof data === "object") {
    return (
      <div className="space-y-2">
        {data.totalEntries != null && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">{data.totalEntries} audit entries</span>
            <span className={`text-xs px-2 py-0.5 rounded ${data.valid ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{data.valid ? "Chain Intact" : "Chain Broken"}</span>
          </div>
        )}
        {Array.isArray(data) && data.slice(0, 10).map((entry: any, i: number) => (
          <div key={i} className="bg-white/[0.03] rounded-lg p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-medium">{entry.actionType}</span>
              <span className="text-slate-500">{entry.proposalTitle}</span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono mt-0.5">{entry.blockchainHash?.slice(0, 24)}...</div>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-600 italic text-xs">No items</span>;
    return (
      <div className="space-y-1.5">
        {data.slice(0, 10).map((item, i) => (
          <div key={i} className="bg-white/[0.02] rounded-lg px-3 py-2 text-xs">
            {typeof item === "string" ? (
              <span className="text-slate-300">• {item}</span>
            ) : typeof item === "object" ? (
              <div className="space-y-0.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}><span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}: </span><span className="text-slate-300">{String(v)}</span></div>
                ))}
              </div>
            ) : <span className="text-slate-300">{String(item)}</span>}
          </div>
        ))}
        {data.length > 10 && <div className="text-xs text-slate-600">+ {data.length - 10} more items</div>}
      </div>
    );
  }

  return <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
}

export default function AIDashboard({ sessions }: AIDashboardProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(() => new Set(AI_SERVICES.map(s => s.key)));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailName, setEmailName] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recDragOver, setRecDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "transcribing" | "done" | "error">("idle");
  const recFileRef = useRef<HTMLInputElement>(null);

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === "completed").sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [sessions]);

  const sessionDetail = trpc.shadowMode.getSession.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: selectedSessionId != null }
  );

  const archives = trpc.archiveUpload.listArchives.useQuery();
  const processTranscript = trpc.archiveUpload.processTranscript.useMutation();
  const emailReport = trpc.archiveUpload.emailArchiveReport.useMutation();

  const selectedArchive = useMemo(() => {
    if (!selectedSessionId || !archives.data) return null;
    const eventId = `shadow-${selectedSessionId}`;
    return archives.data.find((a: any) => a.event_id === eventId) ?? null;
  }, [selectedSessionId, archives.data]);

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: selectedArchive?.id! },
    { enabled: selectedArchive?.id != null }
  );

  const aiReport = useMemo(() => {
    if (archiveDetail.data?.ai_report) return archiveDetail.data.ai_report;
    return null;
  }, [archiveDetail.data]);

  const session = sessionDetail.data;
  const hasReport = aiReport != null;

  const toggleService = useCallback((key: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const applyTier = useCallback((tier: Tier) => {
    setSelectedServices(new Set(TIER_PRESETS[tier].keys));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedServices(new Set(AI_SERVICES.map(s => s.key)));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedServices(new Set());
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return AI_SERVICES;
    const q = searchQuery.toLowerCase();
    return AI_SERVICES.filter(s => s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.includes(q));
  }, [searchQuery]);

  const runServices = useCallback(async () => {
    if (!session) return;
    if (selectedServices.size === 0) {
      toast.error("Select at least one service to run");
      return;
    }

    const transcript = Array.isArray(session.transcriptSegments) ? session.transcriptSegments : [];
    if (transcript.length === 0) {
      toast.error("No transcript available for this session — record or transcribe first");
      return;
    }

    setIsRunning(true);
    try {
      const transcriptText = transcript.map((s: any) => `${s.speaker}: ${s.text}`).join("\n");
      const sessionData = sessions.find(s => s.id === selectedSessionId);

      processTranscript.mutate({
        clientName: sessionData?.clientName ?? session.clientName ?? "Unknown",
        eventName: sessionData?.eventName ?? session.eventName ?? "Unknown",
        eventType: (sessionData?.eventType ?? session.eventType ?? "other") as any,
        transcriptText,
        notes: `Auto-processed from Shadow Mode session #${selectedSessionId}`,
        selectedModules: Array.from(selectedServices),
      }, {
        onSuccess: () => {
          toast.success("All selected AI services completed successfully");
          archives.refetch();
          archiveDetail.refetch();
          setIsRunning(false);
        },
        onError: (err) => {
          toast.error(err.message ?? "Failed to run AI services");
          setIsRunning(false);
        },
      });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to run AI services");
      setIsRunning(false);
    }
  }, [session, selectedSessionId, selectedServices, sessions]);

  const uploadRecording = useCallback(async () => {
    if (!recFile || !selectedSessionId) return;
    setIsUploading(true);
    setUploadStatus("transcribing");
    try {
      const formData = new FormData();
      formData.append("recording", recFile);
      const uploadRes = await fetch(`/api/shadow/recording/${selectedSessionId}`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload recording");

      if (selectedServices.has("transcription")) {
        const fd2 = new FormData();
        fd2.append("file", recFile);
        const transRes = await fetch("/api/transcribe-audio", { method: "POST", body: fd2 });
        if (transRes.ok) {
          const transData = await transRes.json();
          const sessionData = sessions.find(s => s.id === selectedSessionId);

          if (transData.transcriptionStatus === "quota_exceeded" || !transData.transcript?.trim()) {
            processTranscript.mutate({
              clientName: sessionData?.clientName ?? "Unknown",
              eventName: sessionData?.eventName ?? "Unknown",
              eventType: (sessionData?.eventType ?? "other") as any,
              transcriptText: "",
              notes: `Auto-processed from AI Dashboard — session #${selectedSessionId}`,
              savedRecordingPath: transData.savedRecordingPath,
              transcriptionStatus: "quota_exceeded" as const,
              transcriptionError: transData.transcriptionError,
            }, {
              onSuccess: () => {
                toast.success("Recording saved. Transcription quota exceeded — you can retry later.");
                archives.refetch();
                sessionDetail.refetch();
                setUploadStatus("done");
                setRecFile(null);
                setIsUploading(false);
              },
              onError: () => {
                toast.error("Recording saved but archive creation failed");
                sessionDetail.refetch();
                setUploadStatus("done");
                setRecFile(null);
                setIsUploading(false);
              },
            });
            return;
          }

          processTranscript.mutate({
            clientName: sessionData?.clientName ?? "Unknown",
            eventName: sessionData?.eventName ?? "Unknown",
            eventType: (sessionData?.eventType ?? "other") as any,
            transcriptText: transData.transcript,
            notes: `Auto-processed from AI Dashboard — session #${selectedSessionId}`,
            selectedModules: Array.from(selectedServices),
            savedRecordingPath: transData.savedRecordingPath,
          }, {
            onSuccess: () => {
              toast.success("Recording uploaded and transcribed — AI report generated");
              archives.refetch();
              sessionDetail.refetch();
              setUploadStatus("done");
              setRecFile(null);
              setIsUploading(false);
            },
            onError: () => {
              toast.success("Recording uploaded but AI report failed — you can retry");
              sessionDetail.refetch();
              setUploadStatus("done");
              setRecFile(null);
              setIsUploading(false);
            },
          });
          return;
        } else {
          const errData = await transRes.json().catch(() => ({}));
          if (transRes.status === 429 || errData.code === "QUOTA_EXCEEDED") {
            if (errData.savedRecordingPath) {
              const sessionData = sessions.find(s => s.id === selectedSessionId);
              processTranscript.mutate({
                clientName: sessionData?.clientName ?? "Unknown",
                eventName: sessionData?.eventName ?? "Unknown",
                eventType: (sessionData?.eventType ?? "other") as any,
                transcriptText: "",
                savedRecordingPath: errData.savedRecordingPath,
                transcriptionStatus: "quota_exceeded" as const,
                transcriptionError: errData.error,
              });
            }
            toast.error("Recording saved but transcription quota exceeded — you can retry transcription later from the archive");
          } else {
            toast.error("Recording saved but transcription failed — you can retry later");
          }
          sessionDetail.refetch();
          setUploadStatus("done");
          setRecFile(null);
          setIsUploading(false);
          return;
        }
      }

      toast.success("Recording uploaded successfully");
      sessionDetail.refetch();
      setUploadStatus("done");
      setRecFile(null);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  }, [recFile, selectedSessionId, selectedServices, sessions]);

  const exportReport = useCallback(() => {
    if (!session || !aiReport) return;
    const lines: string[] = [];
    lines.push(`CuraLive AI Intelligence Report`);
    lines.push(`${"=".repeat(50)}`);
    lines.push(`Client: ${session.clientName}`);
    lines.push(`Event: ${session.eventName}`);
    lines.push(`Date: ${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`Services Run: ${selectedServices.size} of ${AI_SERVICES.length}`);
    lines.push("");

    for (const svc of AI_SERVICES) {
      if (!selectedServices.has(svc.key)) continue;
      if (svc.key === "recording" || svc.key === "transcription") continue;
      const data = aiReport[svc.key];
      if (!data) continue;
      lines.push(`\n${"─".repeat(40)}`);
      lines.push(`${svc.label.toUpperCase()}`);
      lines.push(`${"─".repeat(40)}`);
      if (typeof data === "string") {
        lines.push(data);
      } else {
        lines.push(JSON.stringify(data, null, 2));
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.clientName}_${session.eventName}_AI_Report.txt`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report saved to file");
  }, [session, aiReport, selectedServices]);

  const sendEmail = useCallback(() => {
    if (!selectedArchive || !emailTo.trim() || !emailName.trim()) {
      toast.error("Enter recipient name and email");
      return;
    }
    emailReport.mutate({
      archiveId: selectedArchive.id,
      recipientEmail: emailTo.trim(),
      recipientName: emailName.trim(),
    }, {
      onSuccess: (res) => {
        toast.success(res.message);
        setShowEmailForm(false);
        setEmailTo("");
        setEmailName("");
      },
      onError: (err) => toast.error(err.message ?? "Failed to send email"),
    });
  }, [selectedArchive, emailTo, emailName]);

  const selectedCount = selectedServices.size;
  const aiModuleCount = AI_SERVICES.filter(s => s.category !== "capture").length;
  const selectedAiCount = AI_SERVICES.filter(s => s.category !== "capture" && selectedServices.has(s.key)).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-200">AI Services Dashboard</h2>
              <p className="text-xs text-slate-500">Select services, run analysis, save or email results</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{selectedCount} of {AI_SERVICES.length} selected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Select Session</label>
            <select
              value={selectedSessionId ?? ""}
              onChange={(e) => {
                setSelectedSessionId(e.target.value ? Number(e.target.value) : null);
                setExpandedResults(new Set());
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Choose a completed session...</option>
              {completedSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.eventName} — {s.clientName} ({new Date(s.createdAt).toLocaleDateString("en-GB")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Quick Tier Presets</label>
            <div className="flex gap-2">
              {(Object.entries(TIER_PRESETS) as [Tier, typeof TIER_PRESETS.essential][]).map(([tier, config]) => {
                const TierIcon = config.icon;
                const isActive = [...config.keys].every(k => selectedServices.has(k)) && selectedServices.size === config.keys.size;
                return (
                  <button
                    key={tier}
                    onClick={() => applyTier(tier)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex-1 justify-center ${
                      isActive
                        ? `${config.bg} ${config.color}`
                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                    }`}
                  >
                    <TierIcon className="w-3.5 h-3.5" />
                    {config.label}
                    <span className="text-[10px] opacity-60">({config.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200">AI Services</h3>
            <span className="text-xs text-slate-600">{selectedCount} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 w-44"
              />
            </div>
            <button onClick={selectAll} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              Select All
            </button>
            <button onClick={clearAll} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              Clear All
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {CATEGORIES.map(cat => {
            const catServices = filteredServices.filter(s => s.category === cat.key);
            if (catServices.length === 0) return null;
            const isCollapsed = collapsedCategories.has(cat.key);
            const selectedInCat = catServices.filter(s => selectedServices.has(s.key)).length;

            return (
              <div key={cat.key}>
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                    <span className="text-[10px] text-slate-600">{selectedInCat}/{catServices.length}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const allSelected = catServices.every(s => selectedServices.has(s.key));
                      setSelectedServices(prev => {
                        const next = new Set(prev);
                        catServices.forEach(s => allSelected ? next.delete(s.key) : next.add(s.key));
                        return next;
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-colors"
                  >
                    {catServices.every(s => selectedServices.has(s.key)) ? "Deselect" : "Select"} All
                  </button>
                </button>
                {!isCollapsed && (
                  <div className="px-3 pb-3 space-y-1">
                    {catServices.map(svc => {
                      const Icon = svc.icon;
                      const isSelected = selectedServices.has(svc.key);
                      const hasData = aiReport?.[svc.key] != null;
                      const isExpanded = expandedResults.has(svc.key);

                      return (
                        <div key={svc.key} className={`rounded-xl border transition-all ${
                          isSelected
                            ? "bg-white/[0.03] border-white/10"
                            : "bg-white/[0.01] border-white/5 opacity-60"
                        }`}>
                          <div className="px-4 py-3 flex items-center gap-3">
                            <button
                              onClick={() => toggleService(svc.key)}
                              className="shrink-0"
                            >
                              {isSelected
                                ? <SquareCheck className="w-5 h-5 text-amber-400" />
                                : <Square className="w-5 h-5 text-slate-600" />
                              }
                            </button>
                            <Icon className={`w-4 h-4 ${svc.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-200">{svc.label}</div>
                              <div className="text-[11px] text-slate-600 truncate">{svc.description}</div>
                            </div>
                            {hasData && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                Ready
                              </span>
                            )}
                            {hasData && isSelected && (
                              <button
                                onClick={() => {
                                  setExpandedResults(prev => {
                                    const next = new Set(prev);
                                    if (next.has(svc.key)) next.delete(svc.key); else next.add(svc.key);
                                    return next;
                                  });
                                }}
                                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          {isExpanded && hasData && isSelected && (
                            <div className="px-4 pb-4 border-t border-white/5">
                              <div className="mt-3 text-sm text-slate-300 space-y-2">
                                <ModuleDataRenderer moduleKey={svc.key} data={aiReport[svc.key]} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSessionId && session && (
        <div className="space-y-4">
          {hasReport && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-emerald-300">AI Report Available</div>
                <div className="text-xs text-slate-500">All {AI_SERVICES.filter(s => s.category !== "capture" && s.category !== "strategic").length} AI modules have been processed for this session. Strategic modules run independently via dedicated engines.</div>
              </div>
            </div>
          )}

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {!hasReport && (
                  <Button
                    onClick={runServices}
                    disabled={isRunning || selectedCount === 0}
                    className="bg-amber-600 hover:bg-amber-500 gap-2 text-sm"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running {selectedCount} services...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Run {selectedCount} Selected Services
                      </>
                    )}
                  </Button>
                )}

                {hasReport && (
                  <>
                    <Button
                      onClick={exportReport}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Report
                    </Button>

                    <Button
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Email Report
                    </Button>

                    <Button
                      onClick={runServices}
                      disabled={isRunning}
                      variant="outline"
                      className="border-white/10 text-slate-400 hover:text-white gap-2 text-sm"
                    >
                      {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                      Regenerate
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>{selectedAiCount} AI modules</span>
                <span>•</span>
                <span>{selectedServices.has("recording") ? "Recording" : "No recording"}</span>
                <span>•</span>
                <span>{selectedServices.has("transcription") ? "Transcription" : "No transcription"}</span>
              </div>
            </div>

            {showEmailForm && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Recipient Name</label>
                  <input
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                  <input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="john@company.com"
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <Button
                  onClick={sendEmail}
                  disabled={emailReport.isPending}
                  className="bg-blue-600 hover:bg-blue-500 gap-2"
                >
                  {emailReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send
                </Button>
              </div>
            )}
          </div>

          {selectedServices.has("recording") && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-200">Recording</span>
                </div>
                {session.recordingUrl && (
                  <a href={session.recordingUrl} download
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 transition-colors">
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                )}
              </div>

              {session.recordingUrl ? (
                <>
                  {session.recordingUrl.startsWith("/api/shadow/recording/") ? (
                    <audio src={session.recordingUrl} controls preload="metadata" className="w-full" />
                  ) : (
                    <video src={session.recordingUrl} controls playsInline preload="metadata" className="w-full rounded-lg bg-black/50 max-h-[250px]" />
                  )}
                </>
              ) : isUploading ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-sm font-medium text-slate-300">
                    {uploadStatus === "transcribing" ? "Uploading & transcribing..." : "Processing..."}
                  </div>
                  <p className="text-xs text-slate-600">
                    {selectedServices.has("transcription")
                      ? "Uploading recording, transcribing with Whisper AI, then running full intelligence pipeline. Large files may take 3-10 minutes."
                      : "Uploading and saving recording to the session."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      recDragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    }`}
                    onClick={() => recFileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setRecDragOver(true); }}
                    onDragLeave={e => { e.preventDefault(); setRecDragOver(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRecDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) setRecFile(f);
                    }}
                  >
                    {recDragOver ? (
                      <div>
                        <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-medium text-cyan-300">Drop your recording here</p>
                      </div>
                    ) : recFile ? (
                      <div>
                        <FileAudio className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-200">{recFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(recFile.size / 1024 / 1024).toFixed(1)} MB
                          {recFile.size > 20 * 1024 * 1024 && (
                            <span className="text-amber-400 ml-2">· Large file — allow 5-10 min for processing</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-300">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-600 mt-1">MP3, MP4, WAV, M4A, WebM, OGG, MOV · Up to 500MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={recFileRef}
                    type="file"
                    accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm,.mov,.avi,.ogg,.flac"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setRecFile(f); }}
                    className="hidden"
                  />
                  {recFile && (
                    <Button
                      onClick={uploadRecording}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Recording{selectedServices.has("transcription") ? " & Transcribe" : ""}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedServices.has("transcription") && Array.isArray(session.transcriptSegments) && session.transcriptSegments.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-200">Transcript</span>
                  <span className="text-xs text-slate-600">({session.transcriptSegments.length} segments)</span>
                </div>
                <button
                  onClick={() => {
                    const text = session.transcriptSegments.map((s: any) =>
                      `${s.timeLabel ?? ""} ${s.speaker}: ${s.text}`
                    ).join("\n\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${session.clientName}_${session.eventName}_transcript.txt`.replace(/\s+/g, "_");
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Transcript exported");
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-0 divide-y divide-white/5 rounded-lg bg-white/[0.02]">
                {session.transcriptSegments.map((seg: any, i: number) => (
                  <div key={i} className="px-3 py-2 flex items-start gap-2">
                    <div className="text-[10px] text-slate-600 font-mono shrink-0 pt-0.5 w-10">
                      {seg.timeLabel ?? "—"}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-violet-300 mr-1.5">{seg.speaker}</span>
                      <span className="text-xs text-slate-300">{seg.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Session", value: session.eventName, sub: session.clientName, color: "text-slate-300" },
              { label: "Sentiment", value: session.sentimentAvg != null ? `${Math.round(session.sentimentAvg)}%` : "—", sub: "Average score", color: session.sentimentAvg != null && session.sentimentAvg >= 70 ? "text-emerald-400" : session.sentimentAvg != null && session.sentimentAvg >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "Metrics", value: session.taggedMetricsGenerated ?? 0, sub: "Tagged records", color: "text-violet-400" },
              { label: "AI Report", value: hasReport ? "Complete" : "Pending", sub: hasReport ? `${AI_SERVICES.filter(s => s.category !== "capture" && s.category !== "strategic").length} modules` : "Run to generate", color: hasReport ? "text-emerald-400" : "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-600 mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color} truncate`}>{stat.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5 truncate">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedSessionId && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">Select a completed session above to get started</div>
          <div className="text-slate-600 text-xs mt-1">Choose your services, run the analysis, then save or email the results</div>
          {completedSessions.length === 0 && (
            <div className="mt-4 text-xs text-amber-400/70">No completed sessions yet — complete a live session first</div>
          )}
        </div>
      )}

      {selectedSessionId && sessionDetail.isLoading && (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
          <div className="text-slate-400 text-sm">Loading session data...</div>
        </div>
      )}
    </div>
  );
}

```

---

### LiveQaDashboard.tsx (1224 lines)
File: `client/src/components/LiveQaDashboard.tsx`

```typescript
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  MessageCircle, Shield, Brain, ChevronDown, ChevronUp,
  Copy, Check, Pause, Play, StopCircle, AlertTriangle,
  ThumbsUp, ThumbsDown, Zap, Send, ExternalLink, Bot,
  Scale, TrendingUp, Eye, Clock, Users, BarChart3,
  Share2, Code2, FileText, Download, Radio, Hash,
  Megaphone, Lock, Wrench, ArrowUpDown, Filter,
  Layers, Unlink, Link2, Sparkles, Gavel,
  ChevronRight, X,
} from "lucide-react";

interface Props {
  shadowSessionId?: number;
  eventName?: string;
  clientName?: string;
}

type StatusFilter = "all" | "pending" | "triaged" | "approved" | "answered" | "rejected" | "flagged" | "legal_review" | "duplicates" | "unanswered" | "high_priority" | "sent_to_speaker";
type SortBy = "priority" | "time" | "compliance";
type SortOrder = "asc" | "desc";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  pending: { color: "#94a3b8", bg: "#94a3b822", label: "Pending", icon: "⏳" },
  triaged: { color: "#818cf8", bg: "#818cf822", label: "Triaged", icon: "🔍" },
  approved: { color: "#22c55e", bg: "#22c55e22", label: "Approved", icon: "✓" },
  answered: { color: "#3b82f6", bg: "#3b82f622", label: "Answered", icon: "💬" },
  rejected: { color: "#ef4444", bg: "#ef444422", label: "Rejected", icon: "✗" },
  flagged: { color: "#f59e0b", bg: "#f59e0b22", label: "Flagged", icon: "⚠" },
  active: { color: "#22c55e", bg: "#22c55e22", label: "Active", icon: "●" },
  paused: { color: "#f59e0b", bg: "#f59e0b22", label: "Paused", icon: "⏸" },
  closed: { color: "#ef4444", bg: "#ef444422", label: "Closed", icon: "■" },
};

const CATEGORY_COLORS: Record<string, string> = {
  financial: "#3b82f6", operational: "#8b5cf6", esg: "#10b981",
  governance: "#f59e0b", strategy: "#ec4899", general: "#6b7280",
};

const TRIAGE_LABELS: Record<string, { label: string; color: string }> = {
  high_priority: { label: "HIGH", color: "#ef4444" },
  standard: { label: "MED", color: "#f59e0b" },
  low_priority: { label: "LOW", color: "#22c55e" },
  duplicate: { label: "DUP", color: "#6b7280" },
  hostile: { label: "HOSTILE", color: "#dc2626" },
};

function ComplianceIndicator({ score }: { score: number }) {
  const color = score > 70 ? "#ef4444" : score > 40 ? "#f59e0b" : "#22c55e";
  const label = score > 70 ? "HIGH RISK" : score > 40 ? "MEDIUM" : "CLEAR";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold" style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
      <Shield className="w-3 h-3" /> {label}
    </span>
  );
}

function QuestionCard({
  q, onApprove, onReject, onFlag, onRouteBot, onLegalReview, onDraft, onAnswer, onSendToSpeaker,
  expanded, onToggle, draftText, onDraftChange, isGeneratingDraft, onUnlinkDuplicate,
  isSelected, onSelect,
}: {
  q: any; onApprove: () => void; onReject: () => void; onFlag: () => void;
  onRouteBot: () => void; onLegalReview: () => void;
  onDraft: () => void; onAnswer: () => void; onSendToSpeaker: () => void;
  expanded: boolean; onToggle: () => void;
  draftText: string; onDraftChange: (t: string) => void;
  isGeneratingDraft?: boolean;
  onUnlinkDuplicate?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const statusCfg = STATUS_CONFIG[q.question_status] || STATUS_CONFIG.pending;
  const triageCfg = TRIAGE_LABELS[q.triage_classification] || TRIAGE_LABELS.standard;
  const catColor = CATEGORY_COLORS[q.question_category] || "#6b7280";
  const complianceScore = q.compliance_risk_score || 0;
  const isDuplicate = !!q.duplicate_of_id;
  const isLegalReview = !!q.legal_review_reason;
  const hasDuplicates = (q.duplicate_count || 0) > 0;
  const hasAiDraft = !!q.ai_draft_text;
  const borderColor = isLegalReview ? "border-red-500/40" : isDuplicate ? "border-slate-600/40" : "border-[#1e1e3a]";

  return (
    <div className={`bg-[#0d0d20] border ${borderColor} rounded-xl overflow-hidden transition-all hover:border-[#2a2a5a] ${isSelected ? "ring-2 ring-indigo-500/50" : ""}`}>
      {isLegalReview && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <Gavel className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Legal Review Required</span>
          <span className="text-xs text-red-300/70 ml-2 truncate flex-1">{q.legal_review_reason}</span>
        </div>
      )}
      {isDuplicate && (
        <div className="bg-slate-500/10 border-b border-slate-500/20 px-4 py-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Possible Duplicate</span>
          <span className="text-xs text-slate-500">of Q#{q.duplicate_of_id}</span>
          {onUnlinkDuplicate && (
            <button onClick={onUnlinkDuplicate} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <Unlink className="w-3 h-3" /> Not a duplicate
            </button>
          )}
        </div>
      )}
      {hasDuplicates && (
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-4 py-2 flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400">{q.duplicate_count} duplicate{q.duplicate_count > 1 ? "s" : ""} grouped here</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 accent-indigo-500 mb-1 cursor-pointer"
              />
            )}
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: triageCfg.color + "22", color: triageCfg.color, border: `1px solid ${triageCfg.color}44` }}>
              {triageCfg.label}
            </span>
            <span className="text-[0.65rem] text-slate-500">{Math.round(q.priority_score || 0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-[0.92rem] leading-relaxed mb-2 ${isDuplicate ? "text-slate-400" : "text-slate-200"}`}>{q.question_text}</p>

            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}44` }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-semibold" style={{ background: catColor + "22", color: catColor }}>
                {q.question_category}
              </span>
              <ComplianceIndicator score={complianceScore} />
              {hasAiDraft && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Sparkles className="w-3 h-3" /> AI Draft Ready
                </span>
              )}
              {q.upvotes > 0 && (
                <span className="inline-flex items-center gap-1 text-[0.65rem] text-slate-500">
                  <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                </span>
              )}
              {q.unresolved_flags > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> {q.unresolved_flags} flag{q.unresolved_flags > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {q.submitter_name && (
              <div className="flex items-center gap-2 text-[0.7rem] text-slate-500">
                <Users className="w-3 h-3" />
                <span>{q.submitter_name}</span>
                {q.submitter_company && <span className="text-slate-600">· {q.submitter_company}</span>}
              </div>
            )}
            {q.triage_reason && (
              <p className="text-[0.7rem] text-indigo-400/70 mt-1 italic flex items-center gap-1">
                <Brain className="w-3 h-3 flex-shrink-0" /> {q.triage_reason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {q.question_status !== "approved" && q.question_status !== "answered" && (
              <button onClick={onApprove} title="Approve (A)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            )}
            <button onClick={onSendToSpeaker} title="Send to Speaker (S)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
              <Radio className="w-3.5 h-3.5" /> Speaker
            </button>
            <button onClick={onRouteBot} title="Route to Bot (B)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors">
              <Bot className="w-3.5 h-3.5" /> Bot
            </button>
            <button onClick={onLegalReview} title="Legal Review (L)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
              <Gavel className="w-3.5 h-3.5" /> Legal
            </button>
            {q.question_status !== "rejected" && (
              <button onClick={onReject} title="Reject (R)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" /> Reject
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e1e3a] px-4 py-2 flex items-center justify-between bg-[#0a0a18]">
        <button onClick={onDraft} disabled={isGeneratingDraft} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium disabled:opacity-50">
          {isGeneratingDraft ? (
            <><div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> {hasAiDraft ? "Regenerate AI Draft" : "Generate AI Draft"}</>
          )}
        </button>
        <button onClick={onToggle} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Collapse" : "Respond"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#1e1e3a] p-4 bg-[#080816]">
          {hasAiDraft && draftText === q.ai_draft_text && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-violet-400">AI-Generated Draft</span>
              <span className="text-xs text-violet-300/60 ml-1">— Review and edit before sending. This draft is never auto-sent.</span>
            </div>
          )}
          {q.ai_draft_reasoning && draftText === q.ai_draft_text && (
            <div className="mb-3 px-3 py-2 bg-[#0d0d20] border border-[#1e1e3a] rounded-lg">
              <p className="text-[0.7rem] text-slate-500 flex items-center gap-1"><Brain className="w-3 h-3" /> {q.ai_draft_reasoning}</p>
            </div>
          )}
          <textarea
            value={draftText}
            onChange={e => onDraftChange(e.target.value)}
            placeholder="Type or edit the response to forward to the speaker..."
            className="w-full min-h-[80px] bg-[#0d0d20] border border-[#1e1e3a] rounded-lg text-slate-200 text-sm p-3 outline-none resize-y placeholder:text-slate-600 focus:border-indigo-500/50"
          />
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              {draftText !== (q.ai_draft_text || "") && draftText.trim() && (
                <span className="text-[0.65rem] text-amber-400/70 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Edited from AI draft
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onToggle} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 border border-[#2a2a4a] hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={onAnswer} disabled={!draftText.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                <Send className="w-3.5 h-3.5" /> Submit & Mark Answered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PredictiveSidebar({ questions, sessionId }: { questions: any[]; sessionId: number }) {
  const anticipatedQuestions = useMemo(() => [
    "What is your forward guidance for next quarter?",
    "Can you comment on the margin compression trend?",
    "What ESG targets are you committing to this year?",
    "How will recent regulatory changes impact operations?",
    "What's the capital allocation strategy going forward?",
  ], []);

  const totalQs = questions.length;
  const approved = questions.filter((q: any) => q.question_status === "approved").length;
  const flagged = questions.filter((q: any) => q.question_status === "flagged").length;
  const avgCompliance = totalQs > 0 ? Math.round(questions.reduce((s: number, q: any) => s + (q.compliance_risk_score || 0), 0) / totalQs) : 0;
  const avgTriage = totalQs > 0 ? Math.round(questions.reduce((s: number, q: any) => s + (q.triage_score || 50), 0) / totalQs) : 0;

  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    questions.forEach((q: any) => { dist[q.question_category] = (dist[q.question_category] || 0) + 1; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  const sentimentLevel = avgCompliance > 50 ? "Cautious" : avgCompliance > 25 ? "Neutral" : "Positive";
  const sentimentColor = avgCompliance > 50 ? "#ef4444" : avgCompliance > 25 ? "#f59e0b" : "#22c55e";

  return (
    <div className="space-y-4">
      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Session Analytics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalQs}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Total</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{approved}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Approved</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{flagged}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Flagged</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: sentimentColor }}>{avgTriage}</p>
            <p className="text-[0.65rem] text-slate-500 uppercase">Avg Triage</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Live Sentiment
        </h4>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: sentimentColor }} />
          <span className="text-sm font-semibold" style={{ color: sentimentColor }}>{sentimentLevel}</span>
          <span className="text-xs text-slate-500">Compliance Risk: {avgCompliance}%</span>
        </div>
        <div className="mt-3 h-2 bg-[#1e1e3a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, avgCompliance)}%`, background: sentimentColor }} />
        </div>
      </div>

      {categoryDistribution.length > 0 && (
        <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-violet-400" /> Materiality Heatmap
          </h4>
          <div className="space-y-2">
            {categoryDistribution.map(([cat, count]) => {
              const pct = Math.round((count / totalQs) * 100);
              const color = CATEGORY_COLORS[cat] || "#6b7280";
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-[0.7rem] text-slate-400 w-20 truncate capitalize">{cat}</span>
                  <div className="flex-1 h-2 bg-[#1e1e3a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[0.65rem] text-slate-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-amber-400" /> Anticipated Questions
        </h4>
        <div className="space-y-2">
          {anticipatedQuestions.map((q, i) => {
            const matched = questions.some((asked: any) =>
              asked.question_text?.toLowerCase().includes(q.split(" ").slice(2, 5).join(" ").toLowerCase())
            );
            return (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${matched ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#0a0a18]"}`}>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${matched ? "bg-emerald-500/30 text-emerald-400" : "bg-[#1e1e3a] text-slate-500"}`}>
                  {matched ? "✓" : i + 1}
                </span>
                <span className={matched ? "text-emerald-400/80 line-through" : "text-slate-400"}>{q}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LiveQaDashboard({ shadowSessionId, eventName, clientName }: Props) {
  const [qaSessionId, setQaSessionId] = useState<number | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<"active" | "paused" | "closed">("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<Record<number, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPlatformPanel, setShowPlatformPanel] = useState(false);
  const [showEmbedPanel, setShowEmbedPanel] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [embedWhiteLabel, setEmbedWhiteLabel] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [generatingDraftFor, setGeneratingDraftFor] = useState<number | null>(null);
  const [legalReviewModalQ, setLegalReviewModalQ] = useState<number | null>(null);
  const [legalReviewReason, setLegalReviewReason] = useState("");
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedBrandName, setEmbedBrandName] = useState("");
  const [embedBrandColor, setEmbedBrandColor] = useState("#6366f1");
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showIrChat, setShowIrChat] = useState(false);
  const [irChatMessage, setIrChatMessage] = useState("");
  const [irChatMessages, setIrChatMessages] = useState<Array<{ message: string; senderRole: string; timestamp: number }>>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showCertPanel, setShowCertPanel] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [certGenerating, setCertGenerating] = useState(false);

  const logQaAction = trpc.shadowMode.qaAction.useMutation();

  const sessionByShadow = trpc.liveQa.getSessionByShadow.useQuery(
    { shadowSessionId: shadowSessionId || 0 },
    { enabled: !!shadowSessionId }
  );

  const sessionsList = trpc.liveQa.listSessions.useQuery();

  const questionsQuery = trpc.liveQa.listQuestions.useQuery(
    { sessionId: qaSessionId || 0, statusFilter, sortBy, sortOrder },
    { enabled: !!qaSessionId, refetchInterval: 3000 }
  );

  const createSession = trpc.liveQa.createSession.useMutation();
  const updateStatus = trpc.liveQa.updateQuestionStatus.useMutation();
  const submitAnswer = trpc.liveQa.submitAnswer.useMutation();
  const generateDraftMut = trpc.liveQa.generateDraft.useMutation();
  const updateSessionStatus = trpc.liveQa.updateSessionStatus.useMutation();
  const generateShareLinkMut = trpc.platformEmbed.generateShareLink.useMutation();
  const sendToSpeakerMut = trpc.liveQa.sendToSpeaker.useMutation();
  const broadcastToTeamMut = trpc.liveQa.broadcastToTeam.useMutation();
  const postIrChatMut = trpc.liveQa.postIrChatMessage.useMutation();
  const generateCertMut = trpc.liveQa.generateQaCertificate.useMutation();
  const setLegalReviewMut = trpc.liveQa.setLegalReview.useMutation();
  const unlinkDuplicateMut = trpc.liveQa.unlinkDuplicate.useMutation();
  const generateContextDraftMut = trpc.liveQa.generateContextDraft.useMutation();
  const bulkActionMut = trpc.liveQa.bulkAction.useMutation();
  const eventSummaryQuery = trpc.platformEmbed.getEventSummary.useQuery(
    { sessionId: qaSessionId || 0 },
    { enabled: !!qaSessionId && showReportPanel }
  );

  useEffect(() => {
    if (sessionByShadow.data) {
      setQaSessionId(sessionByShadow.data.id);
      setSessionCode(sessionByShadow.data.sessionCode);
      setSessionStatus(sessionByShadow.data.status as any);
    }
  }, [sessionByShadow.data]);

  const handleCreateSession = useCallback(async () => {
    if (!eventName) { toast.error("Event name required"); return; }
    setCreating(true);
    try {
      const s = await createSession.mutateAsync({
        eventName: eventName || "Live Event",
        clientName: clientName || undefined,
        shadowSessionId: shadowSessionId || undefined,
      });
      setQaSessionId(s.id);
      setSessionCode(s.sessionCode);
      setSessionStatus("active");
      toast.success("Live Q&A session created!");
      sessionsList.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  }, [eventName, clientName, shadowSessionId]);

  const handleStatusUpdate = useCallback(async (questionId: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ questionId, status: status as any });
      questionsQuery.refetch();
      const labels: Record<string, string> = {
        approved: "Question approved — ready for speaker",
        rejected: "Question rejected",
        flagged: "Question flagged for review",
      };
      toast.success(labels[status] || `Question ${status}`);
      if (shadowSessionId) {
        const actionMap: Record<string, string> = { approved: "approve", rejected: "reject", flagged: "hold" };
        logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: (actionMap[status] || status) as any });
      }
    } catch { toast.error("Failed to update status"); }
  }, [updateStatus, questionsQuery, shadowSessionId, logQaAction]);

  const handleRouteBot = useCallback(async (questionId: number) => {
    try {
      const draft = await generateDraftMut.mutateAsync({ questionId });
      setDraftAnswer(prev => ({ ...prev, [questionId]: draft.answerText }));
      await updateStatus.mutateAsync({ questionId, status: "approved", operatorNotes: "Routed to AI Bot — auto-draft generated" });
      questionsQuery.refetch();
      toast.success("AI Bot generated response — review in answer panel");
      setExpandedQ(questionId);
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "approve", questionText: "Routed to AI Bot" });
    } catch { toast.error("Failed to generate bot response"); }
  }, [updateStatus, questionsQuery, generateDraftMut, shadowSessionId, logQaAction]);

  const handleLegalReview = useCallback((questionId: number) => {
    setLegalReviewModalQ(questionId);
    setLegalReviewReason("");
  }, []);

  const handleSubmitLegalReview = useCallback(async () => {
    if (!legalReviewModalQ || !legalReviewReason.trim()) { toast.error("Please provide a reason for legal review"); return; }
    try {
      await setLegalReviewMut.mutateAsync({ questionId: legalReviewModalQ, reason: legalReviewReason.trim() });
      questionsQuery.refetch();
      toast.success("Question escalated for legal review with reason attached");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(legalReviewModalQ), action: "legal_review", questionText: legalReviewReason.trim() });
      setLegalReviewModalQ(null);
      setLegalReviewReason("");
    } catch { toast.error("Failed to flag for review"); }
  }, [legalReviewModalQ, legalReviewReason, setLegalReviewMut, questionsQuery, shadowSessionId, logQaAction]);

  const handleGenerateDraft = useCallback(async (questionId: number) => {
    setGeneratingDraftFor(questionId);
    try {
      const draft = await generateContextDraftMut.mutateAsync({ questionId, includeTranscript: true });
      setDraftAnswer(prev => ({ ...prev, [questionId]: draft.answerText }));
      setExpandedQ(questionId);
      questionsQuery.refetch();
      toast.success("AI draft generated — review and edit before sending");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "generate_draft" });
    } catch { toast.error("Draft generation failed — compose response manually"); }
    finally { setGeneratingDraftFor(null); }
  }, [generateContextDraftMut, questionsQuery, shadowSessionId, logQaAction]);

  const handleSubmitAnswer = useCallback(async (questionId: number) => {
    const text = draftAnswer[questionId];
    if (!text?.trim()) { toast.error("Please enter an answer"); return; }
    try {
      await submitAnswer.mutateAsync({ questionId, answerText: text.trim() });
      setDraftAnswer(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      setExpandedQ(null);
      questionsQuery.refetch();
      toast.success("Answer submitted & question marked answered");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "answered" });
    } catch { toast.error("Failed to submit answer"); }
  }, [draftAnswer, submitAnswer, questionsQuery, shadowSessionId, logQaAction]);

  const handleSessionStatusChange = useCallback(async (status: "active" | "paused" | "closed") => {
    if (!qaSessionId) return;
    try {
      await updateSessionStatus.mutateAsync({ sessionId: qaSessionId, status });
      setSessionStatus(status);
      sessionByShadow.refetch();
      const msgs: Record<string, string> = {
        active: "Q&A submissions resumed",
        paused: "Q&A submissions paused",
        closed: "Q&A session ended — no new submissions",
      };
      toast.success(msgs[status]);
    } catch { toast.error("Failed to update session"); }
  }, [qaSessionId, updateSessionStatus, sessionByShadow]);

  const copyShareLink = useCallback(() => {
    const link = `${window.location.origin}/qa/${sessionCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Webphone Q&A link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  }, [sessionCode]);

  const handlePlatformShare = useCallback(async (platform: "zoom" | "teams" | "webex" | "meet" | "generic") => {
    if (!qaSessionId) return;
    try {
      const result = await generateShareLinkMut.mutateAsync({ sessionId: qaSessionId, sessionCode, platform });
      navigator.clipboard.writeText(result.chatMessage);
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} message copied — paste into meeting chat`);
    } catch { toast.error("Failed to generate share link"); }
  }, [qaSessionId, sessionCode, generateShareLinkMut]);

  const handleSendToSpeaker = useCallback(async (questionId: number) => {
    try {
      const suggestedAnswer = draftAnswer[questionId] || undefined;
      await sendToSpeakerMut.mutateAsync({ questionId, suggestedAnswer });
      questionsQuery.refetch();
      toast.success("Question sent to speaker with AI-suggested response");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "send_to_speaker" });
    } catch { toast.error("Failed to send to speaker"); }
  }, [sendToSpeakerMut, questionsQuery, draftAnswer, shadowSessionId, logQaAction]);

  const handleBroadcast = useCallback(async () => {
    if (!qaSessionId || !broadcastMessage.trim()) return;
    try {
      await broadcastToTeamMut.mutateAsync({ sessionId: qaSessionId, message: broadcastMessage.trim(), priority: "urgent" });
      setBroadcastMessage("");
      toast.success("Broadcast sent to IR team & speaker");
    } catch { toast.error("Broadcast failed"); }
  }, [qaSessionId, broadcastMessage, broadcastToTeamMut]);

  const handlePostIrChat = useCallback(async () => {
    if (!qaSessionId || !irChatMessage.trim()) return;
    try {
      await postIrChatMut.mutateAsync({ sessionId: qaSessionId, message: irChatMessage.trim() });
      setIrChatMessages(prev => [...prev, { message: irChatMessage.trim(), senderRole: "operator", timestamp: Date.now() }]);
      setIrChatMessage("");
    } catch { toast.error("Failed to send message"); }
  }, [qaSessionId, irChatMessage, postIrChatMut]);

  const handleGenerateCertificate = useCallback(async () => {
    if (!qaSessionId) return;
    setCertGenerating(true);
    try {
      const cert = await generateCertMut.mutateAsync({ sessionId: qaSessionId });
      setCertificate(cert);
      setShowCertPanel(true);
      toast.success("Blockchain-certified Clean Disclosure Certificate generated");
    } catch { toast.error("Failed to generate certificate"); }
    finally { setCertGenerating(false); }
  }, [qaSessionId, generateCertMut]);

  const handleUnlinkDuplicate = useCallback(async (questionId: number) => {
    try {
      await unlinkDuplicateMut.mutateAsync({ questionId });
      questionsQuery.refetch();
      toast.success("Question unlinked from duplicate group");
      if (shadowSessionId) logQaAction.mutate({ sessionId: shadowSessionId, questionId: String(questionId), action: "unlink_duplicate" });
    } catch { toast.error("Failed to unlink duplicate"); }
  }, [unlinkDuplicateMut, questionsQuery, shadowSessionId, logQaAction]);

  const handleBulkAction = useCallback(async (action: "approve" | "reject" | "flagged") => {
    if (selectedQuestions.size === 0) { toast.error("Select questions first"); return; }
    try {
      const result = await bulkActionMut.mutateAsync({ questionIds: Array.from(selectedQuestions), action });
      questionsQuery.refetch();
      setSelectedQuestions(new Set());
      toast.success(`Bulk ${action}: ${result.processed}/${result.total} processed`);
      if (shadowSessionId) {
        const bulkAction = action === "approve" ? "bulk_approve" : "bulk_reject";
        logQaAction.mutate({ sessionId: shadowSessionId, questionId: Array.from(selectedQuestions).join(","), action: bulkAction as any });
      }
    } catch { toast.error("Bulk action failed"); }
  }, [selectedQuestions, bulkActionMut, questionsQuery, shadowSessionId, logQaAction]);

  const toggleQuestionSelection = useCallback((questionId: number) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const questionsData = questionsQuery.data || [];
  const selectAllQuestions = useCallback(() => {
    if (selectedQuestions.size === questionsData.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questionsData.map((q: any) => q.id)));
    }
  }, [questionsData, selectedQuestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!qaSessionId) return;

      if (e.key === "?") { setShowShortcutHelp(prev => !prev); e.preventDefault(); return; }

      const filterKeys: Record<string, StatusFilter> = {
        "1": "all", "2": "unanswered", "3": "high_priority",
        "4": "legal_review", "5": "duplicates", "6": "approved",
      };
      if (filterKeys[e.key]) { setStatusFilter(filterKeys[e.key]); e.preventDefault(); return; }

      if (e.key === "p") { setSortBy("priority"); e.preventDefault(); return; }
      if (e.key === "t") { setSortBy("time"); e.preventDefault(); return; }
      if (e.key === "c") { setSortBy("compliance"); e.preventDefault(); return; }
      if (e.key === "o") { setSortOrder(prev => prev === "desc" ? "asc" : "desc"); e.preventDefault(); return; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [qaSessionId]);

  const downloadCertificate = useCallback(() => {
    if (!certificate) return;
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificate.certificateId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded");
  }, [certificate]);

  const copyEmbedCode = useCallback(() => {
    const params = new URLSearchParams();
    if (embedWhiteLabel) params.set("theme", "platform");
    if (embedBrandName) params.set("brandName", embedBrandName);
    if (embedBrandColor && embedBrandColor !== "#6366f1") params.set("brandColor", embedBrandColor);
    const qs = params.toString();
    const url = `${window.location.origin}/embed/qa/${sessionCode}${qs ? `?${qs}` : ""}`;
    const code = `<iframe\n  src="${url}"\n  width="400"\n  height="640"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius: 12px; border: 1px solid #2a2a4a;"\n></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    toast.success("Embed code copied to clipboard");
    setTimeout(() => setCopiedEmbed(false), 2000);
  }, [sessionCode, embedWhiteLabel, embedBrandName, embedBrandColor]);

  const downloadReport = useCallback(() => {
    if (!eventSummaryQuery.data) return;
    const blob = new Blob([JSON.stringify(eventSummaryQuery.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curalive-qa-report-${sessionCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  }, [eventSummaryQuery.data, sessionCode]);

  const questions = questionsData;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q: any) => { counts[q.question_status || "pending"] = (counts[q.question_status || "pending"] || 0) + 1; });
    return counts;
  }, [questions]);

  if (!qaSessionId) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Q&A Intelligence Engine</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Launch a Live Q&A session for attendees to submit questions in real-time.
              AI triage automatically categorises, scores compliance risks, and generates draft responses.
            </p>
            <button
              onClick={handleCreateSession}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {creating ? "Launching..." : "Launch Live Q&A Session"}
            </button>

            {(sessionsList.data?.length || 0) > 0 && (
              <div className="mt-8 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Previous Sessions</h4>
                <div className="space-y-2">
                  {sessionsList.data?.slice(0, 5).map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => { setQaSessionId(s.id); setSessionCode(s.sessionCode); setSessionStatus(s.status); }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a18] border border-[#1e1e3a] cursor-pointer hover:border-indigo-500/30 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-white">{s.eventName}</span>
                        <span className="text-xs text-slate-500 ml-3 font-mono">{s.sessionCode}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                        background: STATUS_CONFIG[s.status]?.bg || "#33333322",
                        color: STATUS_CONFIG[s.status]?.color || "#888",
                      }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-r from-[#0d0d20] to-[#111130] border border-[#1e1e3a] rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sessionStatus === "active" ? "bg-emerald-400 animate-pulse" : sessionStatus === "paused" ? "bg-amber-400" : "bg-red-400"}`} />
              <h3 className="text-lg font-bold text-white">Live Q&A Management</h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-[#0a0a18] px-2 py-1 rounded">{sessionCode}</span>
            <span className="text-xs text-slate-400">{eventName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2 bg-[#0a0a18] rounded-lg px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300 font-semibold">{questions.length}</span>
              <span className="text-xs text-slate-500">questions</span>
            </div>
            <button onClick={copyShareLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors">
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Webphone Link"}
            </button>
            {sessionStatus === "active" ? (
              <button onClick={() => handleSessionStatusChange("paused")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
                <Pause className="w-3.5 h-3.5" /> Pause Q&A
              </button>
            ) : sessionStatus === "paused" ? (
              <button onClick={() => handleSessionStatusChange("active")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                <Play className="w-3.5 h-3.5" /> Resume Q&A
              </button>
            ) : null}
            {sessionStatus !== "closed" && (
              <button onClick={() => handleSessionStatusChange("closed")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
                <StopCircle className="w-3.5 h-3.5" /> End Q&A
              </button>
            )}
            <button onClick={() => setShowPlatformPanel(!showPlatformPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Platform Share
            </button>
            <button onClick={() => setShowEmbedPanel(!showEmbedPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors">
              <Code2 className="w-3.5 h-3.5" /> Embed
            </button>
            <button onClick={() => setShowIrChat(!showIrChat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
              <Megaphone className="w-3.5 h-3.5" /> IR Chat
            </button>
            <button onClick={() => setShowReportPanel(!showReportPanel)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Report
            </button>
            <button onClick={handleGenerateCertificate} disabled={certGenerating} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50">
              <Hash className="w-3.5 h-3.5" /> {certGenerating ? "Generating..." : "Certificate"}
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a0a18] text-slate-400 border border-[#1e1e3a] hover:text-slate-200 transition-colors">
              <BarChart3 className="w-3.5 h-3.5" /> {showSidebar ? "Hide" : "Show"} Insights
            </button>
          </div>
        </div>
      </div>

      {showPlatformPanel && (
        <div className="bg-[#0d0d20] border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400" /> Share to Platform Chat</h4>
            <button onClick={() => setShowPlatformPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Generate a platform-optimized share message. Click to copy, then paste into your meeting chat.</p>
          <div className="flex flex-wrap gap-2">
            {([
              { platform: "zoom" as const, label: "Zoom", color: "#2d8cff" },
              { platform: "teams" as const, label: "Teams", color: "#6264a7" },
              { platform: "webex" as const, label: "Webex", color: "#07c160" },
              { platform: "meet" as const, label: "Google Meet", color: "#00897b" },
              { platform: "generic" as const, label: "Other", color: "#6366f1" },
            ]).map(({ platform, label, color }) => (
              <button
                key={platform}
                onClick={() => handlePlatformShare(platform)}
                disabled={generateShareLinkMut.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ background: color }}
              >
                <ExternalLink className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showEmbedPanel && (
        <div className="bg-[#0d0d20] border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-violet-400" /> Embeddable Widget</h4>
            <button onClick={() => setShowEmbedPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Embed this Q&A widget directly inside any platform or website. One line of code.</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={embedWhiteLabel} onChange={e => setEmbedWhiteLabel(e.target.checked)} className="accent-violet-500" />
              White-label mode
            </label>
            {embedWhiteLabel && (
              <>
                <input value={embedBrandName} onChange={e => setEmbedBrandName(e.target.value)} placeholder="Brand name" className="bg-[#0a0a18] border border-[#2a2a4a] rounded-lg px-2 py-1 text-xs text-white w-32 outline-none" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Color:</span>
                  <input type="color" value={embedBrandColor} onChange={e => setEmbedBrandColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </>
            )}
          </div>
          <div className="bg-[#0a0a18] border border-[#1e1e3a] rounded-lg p-3 mb-3">
            <code className="text-xs text-emerald-400 whitespace-pre-wrap break-all">
              {`<iframe src="${window.location.origin}/embed/qa/${sessionCode}${embedWhiteLabel ? `?theme=platform${embedBrandName ? `&brandName=${encodeURIComponent(embedBrandName)}` : ""}${embedBrandColor !== "#6366f1" ? `&brandColor=${encodeURIComponent(embedBrandColor)}` : ""}` : ""}" width="400" height="640" frameborder="0"></iframe>`}
            </code>
          </div>
          <div className="flex gap-2">
            <button onClick={copyEmbedCode} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 transition-colors">
              {copiedEmbed ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedEmbed ? "Copied!" : "Copy Embed Code"}
            </button>
            <a href={`/embed/qa/${sessionCode}${embedWhiteLabel ? `?theme=platform${embedBrandName ? `&brandName=${encodeURIComponent(embedBrandName)}` : ""}${embedBrandColor !== "#6366f1" ? `&brandColor=${encodeURIComponent(embedBrandColor)}` : ""}` : ""}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e1e3a] text-slate-300 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Preview Widget
            </a>
          </div>
        </div>
      )}

      {showIrChat && (
        <div className="bg-[#0d0d20] border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-cyan-400" /> IR Team Chat & Broadcast</h4>
            <button onClick={() => setShowIrChat(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-bold text-slate-400 mb-2">Team Chat</h5>
              <div className="bg-[#0a0a18] border border-[#1e1e3a] rounded-lg p-3 h-40 overflow-y-auto mb-2 space-y-2">
                {irChatMessages.length === 0 && <p className="text-xs text-slate-600 text-center pt-6">No messages yet</p>}
                {irChatMessages.map((m, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-semibold text-cyan-400">{m.senderRole}:</span>{" "}
                    <span className="text-slate-300">{m.message}</span>
                    <span className="text-slate-600 ml-2 text-[0.6rem]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={irChatMessage}
                  onChange={e => setIrChatMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePostIrChat()}
                  placeholder="Message IR team..."
                  className="flex-1 bg-[#0a0a18] border border-[#2a2a4a] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <button onClick={handlePostIrChat} disabled={!irChatMessage.trim()} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-400 mb-2">Broadcast to All</h5>
              <p className="text-xs text-slate-500 mb-2">Send an urgent message to speaker, IR team, and legal via real-time channel.</p>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Type broadcast message..."
                className="w-full h-24 bg-[#0a0a18] border border-[#2a2a4a] rounded-lg text-xs text-white p-3 outline-none resize-none"
              />
              <button onClick={handleBroadcast} disabled={!broadcastMessage.trim() || broadcastToTeamMut.isPending} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-400 transition-colors disabled:opacity-50 w-full justify-center">
                <Megaphone className="w-3 h-3" /> Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertPanel && certificate && (
        <div className="bg-[#0d0d20] border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Hash className="w-4 h-4 text-amber-400" /> Clean Disclosure Certificate</h4>
            <div className="flex items-center gap-2">
              <button onClick={downloadCertificate} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
              <button onClick={() => setShowCertPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-400">{certificate.certificateGrade}</p>
              <p className="text-[0.65rem] text-slate-500">Grade</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold" style={{ color: certificate.complianceStatus === "CLEAN" ? "#22c55e" : "#f59e0b" }}>{certificate.complianceStatus === "CLEAN" ? "CLEAN" : "FLAGS"}</p>
              <p className="text-[0.65rem] text-slate-500">Status</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-indigo-400">{certificate.chainLength}</p>
              <p className="text-[0.65rem] text-slate-500">Chain Blocks</p>
            </div>
            <div className="bg-[#0a0a18] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{certificate.metrics.responseRate}%</p>
              <p className="text-[0.65rem] text-slate-500">Response Rate</p>
            </div>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 mb-3">
            <h5 className="text-xs font-bold text-slate-400 mb-1">Certificate ID</h5>
            <p className="text-xs text-amber-400 font-mono">{certificate.certificateId}</p>
          </div>
          <div className="bg-[#0a0a18] rounded-lg p-3 mb-3">
            <h5 className="text-xs font-bold text-slate-400 mb-1">Certificate Hash (SHA-256)</h5>
            <p className="text-[0.6rem] text-emerald-400 font-mono break-all">{certificate.certificateHash}</p>
          </div>
          <p className="text-[0.6rem] text-slate-600 italic">{certificate.disclaimer}</p>
          <p className="text-[0.6rem] text-slate-600 mt-1">{certificate.cipcPatent}</p>
        </div>
      )}

      {showReportPanel && (
        <div className="bg-[#0d0d20] border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /> Post-Event Intelligence Report</h4>
            <div className="flex items-center gap-2">
              <button onClick={downloadReport} disabled={!eventSummaryQuery.data} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
                <Download className="w-3 h-3" /> Export JSON
              </button>
              <button onClick={() => setShowReportPanel(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
            </div>
          </div>
          {eventSummaryQuery.isLoading ? (
            <div className="text-center py-6"><p className="text-slate-400 text-sm">Generating report...</p></div>
          ) : eventSummaryQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Questions", value: eventSummaryQuery.data.metrics.totalQuestions, color: "#818cf8" },
                  { label: "Answered", value: eventSummaryQuery.data.metrics.totalAnswered, color: "#22c55e" },
                  { label: "Response Rate", value: `${eventSummaryQuery.data.metrics.responseRate}%`, color: "#3b82f6" },
                  { label: "Sentiment", value: eventSummaryQuery.data.metrics.overallSentiment, color: eventSummaryQuery.data.metrics.overallSentiment === "Positive" ? "#22c55e" : eventSummaryQuery.data.metrics.overallSentiment === "Cautious" ? "#f59e0b" : "#818cf8" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0a0a18] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                    <p className="text-[0.65rem] text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Category Breakdown</h5>
                  {Object.entries(eventSummaryQuery.data.categoryBreakdown).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 capitalize">{cat}</span>
                      <span className="text-slate-500">{count as number}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Compliance Summary</h5>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Total Flags</span><span className="text-slate-500">{eventSummaryQuery.data.compliance.totalFlags}</span></div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Unresolved</span><span className="text-amber-400">{eventSummaryQuery.data.compliance.unresolvedFlags}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-300">High Risk</span><span className="text-red-400">{eventSummaryQuery.data.compliance.highRiskFlags.length}</span></div>
                </div>
              </div>
              {eventSummaryQuery.data.topQuestions.length > 0 && (
                <div className="bg-[#0a0a18] rounded-lg p-3">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">Top Questions by Upvotes</h5>
                  {eventSummaryQuery.data.topQuestions.slice(0, 5).map((q: any) => (
                    <div key={q.id} className="flex items-start gap-2 text-xs mb-2 last:mb-0">
                      <span className="text-indigo-400 font-mono min-w-[2rem] text-right">{q.upvotes}▲</span>
                      <span className="text-slate-300 flex-1">{q.text.length > 120 ? q.text.slice(0, 120) + "..." : q.text}</span>
                      <span className="text-slate-500 capitalize whitespace-nowrap">{q.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">No data available yet.</p>
          )}
        </div>
      )}

      <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0a0a18] rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              {(["priority", "time", "compliance"] as SortBy[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-0.5 rounded text-[0.65rem] font-semibold transition-colors ${sortBy === s ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="px-1.5 py-0.5 rounded text-[0.65rem] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                title={`Sort ${sortOrder === "desc" ? "ascending" : "descending"} (O)`}
              >
                {sortOrder === "desc" ? "↓" : "↑"}
              </button>
            </div>
            <button
              onClick={() => setShowShortcutHelp(prev => !prev)}
              className="px-2 py-1 rounded text-[0.65rem] font-semibold text-slate-500 hover:text-slate-300 bg-[#0a0a18] transition-colors"
              title="Keyboard shortcuts (?)"
            >
              ⌨ ?
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "all" as StatusFilter, label: "All", color: "#818cf8", shortcut: "1" },
            { key: "unanswered" as StatusFilter, label: "Unanswered", color: "#f59e0b", shortcut: "2" },
            { key: "high_priority" as StatusFilter, label: "High Priority", color: "#ef4444", shortcut: "3" },
            { key: "legal_review" as StatusFilter, label: "Legal Review", color: "#dc2626", shortcut: "4" },
            { key: "duplicates" as StatusFilter, label: "Duplicates", color: "#6b7280", shortcut: "5" },
            { key: "approved" as StatusFilter, label: "Approved", color: "#22c55e", shortcut: "6" },
            { key: "answered" as StatusFilter, label: "Answered", color: "#3b82f6" },
            { key: "rejected" as StatusFilter, label: "Rejected", color: "#ef4444" },
            { key: "flagged" as StatusFilter, label: "Flagged", color: "#f59e0b" },
            { key: "sent_to_speaker" as StatusFilter, label: "Sent to Speaker", color: "#3b82f6" },
          ]).map(({ key, label, color, shortcut }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                title={shortcut ? `Shortcut: ${shortcut}` : undefined}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold transition-all ${
                  isActive
                    ? "border-2 shadow-md"
                    : "border border-[#1e1e3a] text-slate-500 hover:text-slate-300 hover:border-[#2a2a5a]"
                }`}
                style={isActive ? { background: color + "22", color, borderColor: color + "66" } : undefined}
              >
                {label}
                {shortcut && <span className="text-[0.55rem] opacity-40 ml-0.5">{shortcut}</span>}
              </button>
            );
          })}
        </div>
        {selectedQuestions.size > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e1e3a]">
            <span className="text-xs text-indigo-400 font-semibold">{selectedQuestions.size} selected</span>
            <button onClick={() => handleBulkAction("approve")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
              <Check className="w-3 h-3" /> Approve All
            </button>
            <button onClick={() => handleBulkAction("reject")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors">
              <ThumbsDown className="w-3 h-3" /> Reject All
            </button>
            <button onClick={selectAllQuestions} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-400 border border-[#2a2a4a] hover:text-slate-200 transition-colors">
              {selectedQuestions.size === questions.length ? "Deselect All" : "Select All"}
            </button>
            <button onClick={() => setSelectedQuestions(new Set())} className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {showShortcutHelp && (
        <div className="bg-[#0d0d20] border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">⌨ Keyboard Shortcuts</h4>
            <button onClick={() => setShowShortcutHelp(false)} className="text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">1-6</span> <span className="text-slate-400 ml-1">Switch filter tabs</span></div>
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">P</span> <span className="text-slate-400 ml-1">Sort by priority</span></div>
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">T</span> <span className="text-slate-400 ml-1">Sort by time</span></div>
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">C</span> <span className="text-slate-400 ml-1">Sort by compliance</span></div>
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">O</span> <span className="text-slate-400 ml-1">Toggle sort order</span></div>
            <div><span className="text-indigo-400 font-mono bg-[#1e1e3a] px-1.5 py-0.5 rounded">?</span> <span className="text-slate-400 ml-1">Toggle this help</span></div>
          </div>
        </div>
      )}

      {legalReviewModalQ && (
        <div className="bg-[#0d0d20] border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gavel className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-bold text-white">Escalate to Legal Review</h4>
            <button onClick={() => setLegalReviewModalQ(null)} className="ml-auto text-slate-500 text-xs hover:text-slate-300">&times;</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Provide a reason for legal review. This will be visible to the legal team and recorded in the audit trail.</p>
          <textarea
            value={legalReviewReason}
            onChange={e => setLegalReviewReason(e.target.value)}
            placeholder="Describe the legal risk or concern..."
            className="w-full min-h-[80px] bg-[#0a0a18] border border-[#2a2a4a] rounded-lg text-slate-200 text-sm p-3 outline-none resize-y placeholder:text-slate-600 focus:border-red-500/50"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setLegalReviewModalQ(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 border border-[#2a2a4a] hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmitLegalReview}
              disabled={!legalReviewReason.trim() || setLegalReviewMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Gavel className="w-3.5 h-3.5" /> {setLegalReviewMut.isPending ? "Submitting..." : "Escalate for Legal Review"}
            </button>
          </div>
        </div>
      )}

      <div className={`flex gap-4 ${showSidebar ? "" : ""}`}>
        <div className={`flex-1 space-y-3 ${showSidebar ? "min-w-0" : ""}`}>
          {questions.length === 0 && (
            <div className="bg-[#0d0d20] border border-[#1e1e3a] rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#1e1e3a] flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No questions yet.</p>
              <p className="text-slate-500 text-xs mt-1">Share the webphone link with attendees — they'll see the live transcript and submit questions from their browser. No dial-in required.</p>
            </div>
          )}

          {questions.map((q: any) => (
            <QuestionCard
              key={q.id}
              q={q}
              onApprove={() => handleStatusUpdate(q.id, "approved")}
              onReject={() => handleStatusUpdate(q.id, "rejected")}
              onFlag={() => handleStatusUpdate(q.id, "flagged")}
              onRouteBot={() => handleRouteBot(q.id)}
              onLegalReview={() => handleLegalReview(q.id)}
              onSendToSpeaker={() => handleSendToSpeaker(q.id)}
              onDraft={() => handleGenerateDraft(q.id)}
              onAnswer={() => handleSubmitAnswer(q.id)}
              expanded={expandedQ === q.id}
              onToggle={() => {
                setExpandedQ(expandedQ === q.id ? null : q.id);
                if (expandedQ !== q.id && q.ai_draft_text && !draftAnswer[q.id]) {
                  setDraftAnswer(prev => ({ ...prev, [q.id]: q.ai_draft_text }));
                }
              }}
              draftText={draftAnswer[q.id] || ""}
              onDraftChange={(t) => setDraftAnswer(prev => ({ ...prev, [q.id]: t }))}
              isGeneratingDraft={generatingDraftFor === q.id}
              onUnlinkDuplicate={q.duplicate_of_id ? () => handleUnlinkDuplicate(q.id) : undefined}
              isSelected={selectedQuestions.has(q.id)}
              onSelect={() => toggleQuestionSelection(q.id)}
            />
          ))}
        </div>

        {showSidebar && (
          <div className="w-72 flex-shrink-0">
            <PredictiveSidebar questions={questions} sessionId={qaSessionId} />
          </div>
        )}
      </div>
    </div>
  );
}

```

---

### SystemDiagnostics.tsx (152 lines)
File: `client/src/components/SystemDiagnostics.tsx`

```typescript
// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Database, Shield, Brain, Clock, Zap, Server,
} from "lucide-react";

export default function SystemDiagnostics() {
  const [results, setResults] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runDiagnostic = trpc.systemDiagnostics.runFullDiagnostic.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setRunning(false);
    },
    onError: (err) => {
      setResults({ error: err.message });
      setRunning(false);
    },
  });

  const handleRun = () => {
    setRunning(true);
    setResults(null);
    runDiagnostic.mutate();
  };

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  };

  const overallColor = (status: string) => {
    if (status === "HEALTHY") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "DEGRADED") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Server className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">System Diagnostics</h2>
              <p className="text-sm text-slate-500">Full platform health check — database, AI pipeline, CIP4 modules, Guardian</p>
            </div>
          </div>
          <Button
            onClick={handleRun}
            disabled={running}
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Full Diagnostic
              </>
            )}
          </Button>
        </div>

        {!results && !running && (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Click "Run Full Diagnostic" to test all system components</p>
            <p className="text-xs text-slate-600 mt-1">Tests database, AI pipeline, CIP4 modules, Guardian service, and router registry</p>
          </div>
        )}

        {running && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-slate-400">Running 15 diagnostic checks...</p>
            <p className="text-xs text-slate-600 mt-1">Testing database, OpenAI, Shadow Guardian, CIP4 tables, and router registry</p>
          </div>
        )}

        {results?.error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">Diagnostic failed: {results.error}</span>
            </div>
          </div>
        )}

        {results?.summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className={`rounded-xl p-4 text-center border ${overallColor(results.summary.overallStatus)}`}>
                <div className="text-xl font-bold">{results.summary.overallStatus}</div>
                <div className="text-[10px] opacity-70">Overall Status</div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-emerald-400">{results.summary.passed}</div>
                <div className="text-[10px] text-slate-500">Passed</div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-red-400">{results.summary.failed}</div>
                <div className="text-[10px] text-slate-500">Failed</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-amber-400">{results.summary.warned}</div>
                <div className="text-[10px] text-slate-500">Warnings</div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-slate-300">{(results.summary.totalDurationMs / 1000).toFixed(1)}s</div>
                <div className="text-[10px] text-slate-500">Total Time</div>
              </div>
            </div>

            <div className="space-y-2">
              {results.results.map((r: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  r.status === "pass" ? "bg-emerald-500/[0.03] border-emerald-500/10" :
                  r.status === "fail" ? "bg-red-500/[0.03] border-red-500/10" :
                  "bg-amber-500/[0.03] border-amber-500/10"
                }`}>
                  <div className="flex items-center gap-3">
                    {statusIcon(r.status)}
                    <div>
                      <div className="text-sm font-medium text-slate-200">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.detail}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-mono">{r.durationMs}ms</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-slate-600 text-right">
              Completed at {new Date(results.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

```

---

### WebPhoneCallManager.tsx (285 lines)
File: `client/src/components/WebPhoneCallManager.tsx`

```typescript
import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Volume2, Mic, MicOff, Users, Signal, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface WebPhoneParticipant {
  id: string;
  name: string;
  phoneNumber?: string;
  joinedAt: Date;
  isMuted: boolean;
  audioLevel: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export interface WebPhoneCall {
  id: string;
  sessionId: string;
  startedAt: Date;
  duration: number;
  participants: WebPhoneParticipant[];
  isActive: boolean;
  callQuality: "excellent" | "good" | "fair" | "poor";
  averageLatency: number;
}

export interface WebPhoneCallManagerProps {
  sessionId: string;
  call?: WebPhoneCall;
  isLoading?: boolean;
  onEndCall?: () => void;
  onMuteParticipant?: (participantId: string) => void;
  onAdmitParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
}

const ConnectionQualityBadge: React.FC<{ quality: string }> = ({ quality }) => {
  const colors: Record<string, string> = {
    excellent: "bg-green-500/20 text-green-700 border-green-200",
    good: "bg-blue-500/20 text-blue-700 border-blue-200",
    fair: "bg-yellow-500/20 text-yellow-700 border-yellow-200",
    poor: "bg-red-500/20 text-red-700 border-red-200",
  };

  const icons: Record<string, React.ReactNode> = {
    excellent: <CheckCircle className="w-3 h-3" />,
    good: <Signal className="w-3 h-3" />,
    fair: <AlertCircle className="w-3 h-3" />,
    poor: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colors[quality] || colors.fair}`}>
      {icons[quality]}
      {quality.charAt(0).toUpperCase() + quality.slice(1)}
    </div>
  );
};

const ParticipantCard: React.FC<{
  participant: WebPhoneParticipant;
  onMute?: () => void;
  onRemove?: () => void;
}> = ({ participant, onMute, onRemove }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">{participant.name}</p>
          {participant.phoneNumber && (
            <p className="text-xs text-muted-foreground">{participant.phoneNumber}</p>
          )}
        </div>
        <ConnectionQualityBadge quality={participant.connectionQuality} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Audio Level</span>
          <span className="font-mono">{participant.audioLevel}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${participant.audioLevel}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onMute}
        >
          {participant.isMuted ? (
            <>
              <MicOff className="w-3 h-3 mr-1" /> Unmute
            </>
          ) : (
            <>
              <Mic className="w-3 h-3 mr-1" /> Mute
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={onRemove}
        >
          <PhoneOff className="w-3 h-3 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
};

export const WebPhoneCallManager: React.FC<WebPhoneCallManagerProps> = ({
  sessionId,
  call,
  isLoading,
  onEndCall,
  onMuteParticipant,
  onAdmitParticipant,
  onRemoveParticipant,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!call?.isActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call?.isActive]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!call) {
    return (
      <Card className="p-6 text-center">
        <Phone className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No active WebPhone call</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold">WebPhone Call Active</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">
              {formatDuration(call.duration + elapsedTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {call.participants.length} participant{call.participants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Call Quality</p>
            <ConnectionQualityBadge quality={call.callQuality} />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Latency</p>
            <p className="font-mono text-sm font-semibold">{call.averageLatency}ms</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Participants</p>
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{call.participants.length}</span>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={onEndCall}
          disabled={isLoading}
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" />
          <h3 className="font-semibold">Participants</h3>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
            {call.participants.length}
          </span>
        </div>

        {call.participants.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No participants in this call</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {call.participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onMute={() => onMuteParticipant?.(participant.id)}
                onRemove={() => onRemoveParticipant?.(participant.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-sm">Call Statistics</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Average Audio Level</p>
            <p className="font-semibold">
              {call.participants.length > 0
                ? Math.round(
                    call.participants.reduce((sum, p) => sum + p.audioLevel, 0) /
                      call.participants.length
                  )
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Muted Participants</p>
            <p className="font-semibold">
              {call.participants.filter((p) => p.isMuted).length}/{call.participants.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Excellent Quality</p>
            <p className="font-semibold">
              {call.participants.filter((p) => p.connectionQuality === "excellent").length}/
              {call.participants.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Network Latency</p>
            <p className="font-semibold">{call.averageLatency}ms</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-blue-500/10 border-blue-200">
        <div className="flex gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Auto-Admit Enabled</p>
            <p className="text-xs text-blue-700 mt-1">
              Participants can join directly without operator approval
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WebPhoneCallManager;

```

---

### WebPhoneJoinInstructions.tsx (217 lines)
File: `client/src/components/WebPhoneJoinInstructions.tsx`

```typescript
import React, { useState } from "react";
import { Phone, Globe, Headphones, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface JoinConfig {
  webPhoneUrl: string;
  dialInNumbers?: { country: string; number: string; toll: boolean }[];
  sipUri?: string;
  accessCode?: string;
  eventName: string;
  scheduledTime?: string;
}

export interface WebPhoneJoinInstructionsProps {
  config: JoinConfig;
  compact?: boolean;
}

export function WebPhoneJoinInstructions({ config, compact = false }: WebPhoneJoinInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Join via WebPhone</span>
          </div>
          <Badge className="bg-blue-600 text-white">Recommended</Badge>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono truncate">
            {config.webPhoneUrl}
          </code>
          <CopyButton text={config.webPhoneUrl} field="webphone-url" />
          <Button size="sm" variant="outline" asChild>
            <a href={config.webPhoneUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
        {config.accessCode && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>Access Code:</span>
            <code className="font-mono bg-muted px-2 py-1 rounded">{config.accessCode}</code>
            <CopyButton text={config.accessCode} field="access-code" />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <h3 className="font-semibold text-lg">{config.eventName}</h3>
        {config.scheduledTime && (
          <p className="text-sm text-muted-foreground mt-1">{config.scheduledTime}</p>
        )}
      </div>

      <Tabs defaultValue="webphone" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="webphone" className="flex-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            WebPhone
          </TabsTrigger>
          <TabsTrigger value="dialin" className="flex-1 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Dial-In
          </TabsTrigger>
          <TabsTrigger value="sip" className="flex-1 flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            SIP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webphone" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white">Recommended</Badge>
            <span className="text-xs text-muted-foreground">Best quality, no software needed</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">WebPhone Link</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono truncate">
                  {config.webPhoneUrl}
                </code>
                <CopyButton text={config.webPhoneUrl} field="webphone-url-full" />
              </div>
            </div>

            {config.accessCode && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Code</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-3 py-2 rounded font-mono">
                    {config.accessCode}
                  </code>
                  <CopyButton text={config.accessCode} field="access-code-full" />
                </div>
              </div>
            )}

            <Button className="w-full" asChild>
              <a href={config.webPhoneUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Join via WebPhone
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="dialin" className="mt-4 space-y-4">
          {config.dialInNumbers && config.dialInNumbers.length > 0 ? (
            <div className="space-y-2">
              {config.dialInNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{num.country}</span>
                    {!num.toll && (
                      <Badge variant="outline" className="ml-2 text-xs">Toll-Free</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{num.number}</code>
                    <CopyButton text={num.number} field={`dialin-${idx}`} />
                  </div>
                </div>
              ))}
              {config.accessCode && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Access Code</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold">{config.accessCode}</code>
                      <CopyButton text={config.accessCode} field="dialin-access" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No dial-in numbers available for this event
            </p>
          )}
        </TabsContent>

        <TabsContent value="sip" className="mt-4 space-y-4">
          {config.sipUri ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">SIP URI</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono truncate">
                    {config.sipUri}
                  </code>
                  <CopyButton text={config.sipUri} field="sip-uri" />
                </div>
              </div>
              {config.accessCode && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Code</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-3 py-2 rounded font-mono">
                      {config.accessCode}
                    </code>
                    <CopyButton text={config.accessCode} field="sip-access" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              SIP connection not available for this event
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default WebPhoneJoinInstructions;

```

---

### ProviderStateIndicator.tsx (160 lines)
File: `client/src/components/ProviderStateIndicator.tsx`

```typescript
import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Signal, Phone, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ProviderType = "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
export type ProviderStatus = "active" | "degraded" | "fallback" | "failed";

export interface ProviderState {
  provider: ProviderType;
  status: ProviderStatus;
  fallbackReason?: string;
  previousProvider?: ProviderType;
  switchedAt?: Date;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
  latency?: number;
}

export interface ProviderStateIndicatorProps {
  state: ProviderState;
  compact?: boolean;
  showNotification?: boolean;
  onDismissNotification?: () => void;
}

const ProviderStateIndicator: React.FC<ProviderStateIndicatorProps> = ({
  state,
  compact = false,
  showNotification = true,
  onDismissNotification,
}) => {
  const [showFallbackAlert, setShowFallbackAlert] = useState(showNotification && state.status === "fallback");

  useEffect(() => {
    if (state.status === "fallback" && showNotification) {
      setShowFallbackAlert(true);
    }
  }, [state.status, showNotification]);

  const providerColors: Record<ProviderType, string> = {
    webphone: "bg-blue-600",
    teams: "bg-purple-600",
    zoom: "bg-cyan-600",
    webex: "bg-green-600",
    rtmp: "bg-orange-600",
    pstn: "bg-gray-600",
  };

  const statusIcons: Record<ProviderStatus, React.ReactNode> = {
    active: <CheckCircle className="w-4 h-4 text-green-600" />,
    degraded: <AlertCircle className="w-4 h-4 text-yellow-600" />,
    fallback: <Signal className="w-4 h-4 text-orange-600" />,
    failed: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const statusLabels: Record<ProviderStatus, string> = {
    active: "Connected",
    degraded: "Degraded",
    fallback: "Fallback Active",
    failed: "Failed",
  };

  const statusColors: Record<ProviderStatus, string> = {
    active: "text-green-600",
    degraded: "text-yellow-600",
    fallback: "text-orange-600",
    failed: "text-red-600",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${providerColors[state.provider]} text-white`}>
          {state.provider.toUpperCase()}
        </Badge>
        <div className={`flex items-center gap-1 ${statusColors[state.status]}`}>
          {statusIcons[state.status]}
          <span className="text-xs font-medium">{statusLabels[state.status]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-card border border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Connectivity Provider</p>
              <p className="text-xs text-muted-foreground">Current connection status</p>
            </div>
          </div>
          <Badge className={`${providerColors[state.provider]} text-white`}>
            {state.provider.toUpperCase()}
          </Badge>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${statusColors[state.status]} bg-opacity-10`}>
          {statusIcons[state.status]}
          <div>
            <p className="font-medium text-sm">{statusLabels[state.status]}</p>
            {state.connectionQuality && (
              <p className="text-xs text-muted-foreground">
                Quality: {state.connectionQuality.charAt(0).toUpperCase() + state.connectionQuality.slice(1)}
                {state.latency && ` • Latency: ${state.latency}ms`}
              </p>
            )}
          </div>
        </div>
      </Card>

      {showFallbackAlert && state.status === "fallback" && state.fallbackReason && (
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900">Fallback Activated</p>
              <p className="text-sm text-amber-800 mt-1">{state.fallbackReason}</p>
              {state.previousProvider && (
                <p className="text-xs text-amber-700 mt-2">
                  Switched from {state.previousProvider.toUpperCase()} to {state.provider.toUpperCase()}
                  {state.switchedAt && ` at ${new Date(state.switchedAt).toLocaleTimeString()}`}
                </p>
              )}
            </div>
            {onDismissNotification && (
              <button
                onClick={() => {
                  setShowFallbackAlert(false);
                  onDismissNotification();
                }}
                className="text-amber-600 hover:text-amber-900 text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </Card>
      )}

      {state.status === "failed" && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-900">Connection Failed</p>
              <p className="text-sm text-red-800 mt-1">
                {state.fallbackReason || "Unable to establish connection. Please check your settings."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProviderStateIndicator;

```

---

### useAblySessions.ts (164 lines)
File: `client/src/hooks/useAblySessions.ts`

```typescript
import { useEffect, useState, useCallback } from "react";
import * as Ably from "ably";

export interface AblyMessage {
  type: "qa" | "transcript" | "provider" | "participant";
  action: "new" | "updated" | "deleted" | "approved" | "rejected";
  data: Record<string, unknown>;
  timestamp: number;
}

export const useAblySessions = (sessionId: string) => {
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [qaUpdates, setQaUpdates] = useState<AblyMessage[]>([]);
  const [transcriptUpdates, setTranscriptUpdates] = useState<AblyMessage[]>([]);
  const [providerUpdates, setProviderUpdates] = useState<AblyMessage[]>([]);
  const [participantUpdates, setParticipantUpdates] = useState<AblyMessage[]>([]);

  useEffect(() => {
    const initializeAbly = async () => {
      try {
        const tokenResponse = await fetch("/api/ably/token");
        const { token } = await tokenResponse.json();

        const client = new Ably.Realtime({
          token,
          autoConnect: true,
        });

        client.connection.on("connected", () => {
          setIsConnected(true);
          console.log("[Ably] Connected");
        });

        client.connection.on("disconnected", () => {
          setIsConnected(false);
          console.log("[Ably] Disconnected");
        });

        setAblyClient(client);
      } catch (error) {
        console.error("[Ably] Failed to initialize:", error);
      }
    };

    initializeAbly();

    return () => {
      ablyClient?.close();
    };
  }, []);

  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const qaChannel = ablyClient.channels.get(`session:${sessionId}:qa`);

    qaChannel.subscribe("qa-update", (message: any) => {
      const update: AblyMessage = {
        type: "qa",
        action: message.data.action || "new",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setQaUpdates((prev) => [update, ...prev.slice(0, 99)]);
      console.log("[Ably] Q&A Update:", update);
    });

    return () => {
      qaChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const transcriptChannel = ablyClient.channels.get(`session:${sessionId}:transcript`);

    transcriptChannel.subscribe("transcript-update", (message: any) => {
      const update: AblyMessage = {
        type: "transcript",
        action: message.data.action || "new",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setTranscriptUpdates((prev) => [update, ...prev.slice(0, 999)]);
      console.log("[Ably] Transcript Update:", update);
    });

    return () => {
      transcriptChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const providerChannel = ablyClient.channels.get(`session:${sessionId}:provider`);

    providerChannel.subscribe("provider-update", (message: any) => {
      const update: AblyMessage = {
        type: "provider",
        action: message.data.action || "updated",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setProviderUpdates((prev) => [update, ...prev.slice(0, 49)]);
      console.log("[Ably] Provider Update:", update);
    });

    return () => {
      providerChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const participantChannel = ablyClient.channels.get(`session:${sessionId}:participants`);

    participantChannel.subscribe("participant-update", (message: any) => {
      const update: AblyMessage = {
        type: "participant",
        action: message.data.action || "updated",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setParticipantUpdates((prev) => [update, ...prev.slice(0, 99)]);
      console.log("[Ably] Participant Update:", update);
    });

    return () => {
      participantChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  const publishUpdate = useCallback(
    async (update: { action: string; data: Record<string, unknown> }) => {
      if (!ablyClient || !isConnected) {
        console.error("[Ably] Not connected");
        return;
      }

      try {
        const channelName = `session:${sessionId}:qa`;
        const ablyChannel = ablyClient.channels.get(channelName);
        await ablyChannel.publish("qa-update", update);
        console.log(`[Ably] Published to ${channelName}:`, update);
      } catch (error) {
        console.error("[Ably] Publish failed:", error);
      }
    },
    [ablyClient, isConnected, sessionId]
  );

  return {
    isConnected,
    qaUpdates,
    transcriptUpdates,
    providerUpdates,
    participantUpdates,
    publishUpdate,
  };
};

```

---

### useKeyboardShortcuts.ts (94 lines)
File: `client/src/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onMuteAll?: () => void;
  onApproveQA?: () => void;
  onRejectQA?: () => void;
  onSaveNotes?: () => void;
  onExport?: () => void;
  onHandoff?: () => void;
  onShowHelp?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isInputElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          handlers.onMuteAll?.();
          console.log("[Shortcuts] Mute All triggered");
          break;

        case "a":
          event.preventDefault();
          handlers.onApproveQA?.();
          console.log("[Shortcuts] Approve Q&A triggered");
          break;

        case "r":
          event.preventDefault();
          handlers.onRejectQA?.();
          console.log("[Shortcuts] Reject Q&A triggered");
          break;

        case "s":
          event.preventDefault();
          handlers.onSaveNotes?.();
          console.log("[Shortcuts] Save Notes triggered");
          break;

        case "e":
          event.preventDefault();
          handlers.onExport?.();
          console.log("[Shortcuts] Export triggered");
          break;

        case "h":
          event.preventDefault();
          handlers.onHandoff?.();
          console.log("[Shortcuts] Handoff triggered");
          break;

        case "?":
          event.preventDefault();
          handlers.onShowHelp?.();
          console.log("[Shortcuts] Show Help triggered");
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: "M", action: "Mute all participants" },
  { key: "A", action: "Approve next pending Q&A" },
  { key: "R", action: "Reject next pending Q&A" },
  { key: "S", action: "Save notes" },
  { key: "E", action: "Export session" },
  { key: "H", action: "Handoff session" },
  { key: "?", action: "Show this help dialog" },
];

```

---

### sessionAutoSave.ts (104 lines)
File: `client/src/services/sessionAutoSave.ts`

```typescript
export interface SessionRecoveryData {
  sessionId: string;
  notes: string;
  activeTab: string;
  timestamp: number;
  qaApprovals: string[];
  qaRejections: string[];
}

const STORAGE_KEY = "session_recovery";
const AUTO_SAVE_INTERVAL = 30000;

export class SessionAutoSave {
  private sessionId: string;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private recoveryData: SessionRecoveryData;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.recoveryData = {
      sessionId,
      notes: "",
      activeTab: "webphone",
      timestamp: Date.now(),
      qaApprovals: [],
      qaRejections: [],
    };
    this.loadRecoveryData();
  }

  start() {
    this.autoSaveTimer = setInterval(() => {
      this.save();
    }, AUTO_SAVE_INTERVAL);
    console.log("[SessionAutoSave] Auto-save started");
  }

  stop() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log("[SessionAutoSave] Auto-save stopped");
    }
  }

  update(data: Partial<SessionRecoveryData>) {
    this.recoveryData = {
      ...this.recoveryData,
      ...data,
      timestamp: Date.now(),
    };
  }

  save() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.setItem(key, JSON.stringify(this.recoveryData));
      console.log("[SessionAutoSave] Saved recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to save:", error);
    }
  }

  loadRecoveryData() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        this.recoveryData = JSON.parse(stored);
        console.log("[SessionAutoSave] Loaded recovery data");
      }
    } catch (error) {
      console.error("[SessionAutoSave] Failed to load:", error);
    }
  }

  getRecoveryData(): SessionRecoveryData {
    return this.recoveryData;
  }

  hasRecoveryData(): boolean {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  clear() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.removeItem(key);
      console.log("[SessionAutoSave] Cleared recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to clear:", error);
    }
  }

  destroy() {
    this.stop();
    this.save();
  }
}

```

---

### Schema Definitions (from drizzle/schema.ts)

```typescript
export const shadowSessions = pgTable("shadow_sessions", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  meetingUrl: varchar("meeting_url", { length: 1000 }).notNull(),
  recallBotId: varchar("recall_bot_id", { length: 255 }),
  ablyChannel: varchar("ably_channel", { length: 255 }),
  localTranscriptJson: text("local_transcript_json"),
  localRecordingPath: varchar("local_recording_path", { length: 1000 }),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  transcriptSegments: integer("transcript_segments").default(0),
  sentimentAvg: real("sentiment_avg"),
  complianceFlags: integer("compliance_flags").default(0),
  taggedMetricsGenerated: integer("tagged_metrics_generated").default(0),
  notes: text("notes"),
  startedAt: bigint("started_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShadowSession = typeof shadowSessions.$inferSelect;
export type InsertShadowSession = typeof shadowSessions.$inferInsert;

export const operatorActions = pgTable("operator_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  archiveId: integer("archive_id"),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  detail: text("detail"),
  operatorId: integer("operator_id"),
  operatorName: varchar("operator_name", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OperatorAction = typeof operatorActions.$inferSelect;

// ─── Operator Corrections (Self-Improving AI Loop) ───────────────────────────
export const operatorCorrections = pgTable("operator_corrections", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }),
  metricId: integer("metric_id"),
  correctionType: varchar("correction_type", { length: 64 }).notNull(),
  originalValue: real("original_value"),
  correctedValue: real("corrected_value"),
  originalLabel: varchar("original_label", { length: 255 }),
  correctedLabel: varchar("corrected_label", { length: 255 }),
  reason: text("reason"),
  eventType: varchar("event_type", { length: 64 }),
  clientName: varchar("client_name", { length: 255 }),
  operatorId: varchar("operator_id", { length: 255 }).default("operator"),
  appliedToModel: smallint("applied_to_model").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OperatorCorrection = typeof operatorCorrections.$inferSelect;
export type InsertOperatorCorrection = typeof operatorCorrections.$inferInsert;

export const adaptiveThresholds = pgTable("adaptive_thresholds", {
  id: serial("id").primaryKey(),
  thresholdKey: varchar("threshold_key", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }),
  sector: varchar("sector", { length: 64 }),
  metricType: varchar("metric_type", { length: 64 }).notNull(),
  defaultValue: real("default_value").notNull(),
  learnedValue: real("learned_value").notNull(),
  sampleCount: integer("sample_count").default(0),
  lastCorrectionAt: timestamp("last_correction_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdaptiveThreshold = typeof adaptiveThresholds.$inferSelect;

```

---

### END OF COMPLETE SHADOW MODE PLATFORM BRIEF
Total files: 17 source files + schema definitions
