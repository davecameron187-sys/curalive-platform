# CuraLive Shadow Mode — Live Intelligence Technical Brief

**Document:** Deep Technical Reference for Porting Shadow Mode  
**Audience:** Manus engineering team  
**Generated:** 30 March 2026  
**Source:** Complete source code audit of production Replit codebase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [tRPC Router — All 18 Procedures](#3-trpc-router--all-18-procedures)
4. [Session Lifecycle & State Machine](#4-session-lifecycle--state-machine)
5. [Platform Routing — Dual Capture Modes](#5-platform-routing--dual-capture-modes)
6. [Recall.ai Bot Integration](#6-recallai-bot-integration)
7. [Recall Webhook Handler](#7-recall-webhook-handler)
8. [Local Audio Capture (Browser-Side)](#8-local-audio-capture-browser-side)
9. [Real-Time Ably Pub/Sub](#9-real-time-ably-pubsub)
10. [AI Analysis Pipeline (Live)](#10-ai-analysis-pipeline-live)
11. [Post-Session AI Pipeline (CIP4)](#11-post-session-ai-pipeline-cip4)
12. [Tagged Metrics Generation](#12-tagged-metrics-generation)
13. [Guardian Service & Watchdog](#13-guardian-service--watchdog)
14. [AGM Governance Integration](#14-agm-governance-integration)
15. [Notes, Operator Actions & Audit Log](#15-notes-operator-actions--audit-log)
16. [Session Export (CSV / JSON / PDF)](#16-session-export-csv--json--pdf)
17. [Handoff Package](#17-handoff-package)
18. [Environment Variables & Secrets](#18-environment-variables--secrets)
19. [API Types & Interfaces](#19-api-types--interfaces)
20. [Known Gotchas & Critical Notes](#20-known-gotchas--critical-notes)

---

## 1. Architecture Overview

Shadow Mode is CuraLive's autonomous live-event intelligence engine. It silently monitors investor webcasts, earnings calls, AGMs, and capital markets events — capturing real-time transcripts, scoring sentiment, flagging compliance risks, and generating 20-module AI reports on session end.

### Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `server/routers/shadowModeRouter.ts` | 1,386 | All 18 tRPC procedures |
| `server/recallWebhook.ts` | 324 | Recall.ai webhook handler (raw body HMAC) |
| `server/aiAnalysis.ts` | ~650 | Live sentiment, rolling summary, Q&A triage, pace analysis |
| `server/services/ShadowModeGuardianService.ts` | 153 | Reconciliation + 60s watchdog |
| `client/src/components/LocalAudioCapture.tsx` | ~600 | Browser-side tab/mic capture for non-Recall platforms |
| `server/routers/archiveUploadRouter.ts` | 1,512 | `generateFullAiReport()` + `AiReport` type |
| `drizzle/schema.ts` | Lines 2422-2445 | `shadow_sessions` table definition |

### Data Flow

```
User clicks "Start Session"
      │
      ├─ Platform = zoom/teams/meet/webex
      │     └─ Deploy Recall.ai bot → status: bot_joining
      │           └─ Recall webhook → transcript.data → DB + Ably
      │
      └─ Platform = choruscall/other
            └─ status: live (immediate)
                  └─ LocalAudioCapture.tsx → pushTranscriptSegment → DB + Ably
                        ├─ Tab Audio: getDisplayMedia + Whisper AI
                        └─ Mic Audio: Web Speech API (SpeechRecognition)

All paths → endSession:
      ├─ Generate 4 tagged metrics (sentiment, engagement, compliance, intervention)
      ├─ Write anonymized aggregate record
      └─ Background: autoGenerateAiReport (20 modules + CIP4 pipeline)
```

---

## 2. Database Schema

### Table: `shadow_sessions`

```typescript
export const shadowSessions = pgTable("shadow_sessions", {
  id:                    serial("id").primaryKey(),
  clientName:            varchar("client_name", { length: 255 }).notNull(),
  eventName:             varchar("event_name", { length: 255 }).notNull(),
  eventType:             varchar("event_type", { length: 64 }).notNull(),
  platform:              varchar("platform", { length: 64 }).default("zoom").notNull(),
  meetingUrl:            varchar("meeting_url", { length: 1000 }).notNull(),
  recallBotId:           varchar("recall_bot_id", { length: 255 }),        // null for local capture
  ablyChannel:           varchar("ably_channel", { length: 255 }),
  localTranscriptJson:   text("local_transcript_json"),                     // JSON array of segments
  localRecordingPath:    varchar("local_recording_path", { length: 1000 }),
  status:                varchar("status", { length: 64 }).default("pending").notNull(),
  transcriptSegments:    integer("transcript_segments").default(0),
  sentimentAvg:          real("sentiment_avg"),
  complianceFlags:       integer("compliance_flags").default(0),
  taggedMetricsGenerated: integer("tagged_metrics_generated").default(0),
  notes:                 text("notes"),                                     // JSON array of {id, text, createdAt}
  startedAt:             bigint("started_at", { mode: "number" }),          // epoch ms
  endedAt:               bigint("ended_at", { mode: "number" }),            // epoch ms
  createdAt:             timestamp("created_at").defaultNow().notNull(),
});
```

### Related Tables

| Table | Relationship |
|-------|-------------|
| `recall_bots` | Linked by `recallBotId` — stores transcript JSON, recording URL, bot status |
| `tagged_metrics` | Linked by `eventId = "shadow-{sessionId}"` — 4 metrics per session |
| `operator_actions` | Linked by `sessionId` — full audit log |
| `archive_events` | Linked by `event_id = "shadow-{sessionId}"` — AI report storage |
| `agm_intelligence_sessions` | Linked by `shadowSessionId` — AGM governance data |
| `live_qa_questions` / `live_qa_sessions` | Linked by `shadow_session_id` on `live_qa_sessions` |

### Event Types Enum (27 types)

```
earnings_call, interim_results, annual_results, results_call, media_call, analyst_call,
agm, capital_markets_day, ceo_town_hall, board_meeting, webcast,
investor_day, roadshow, special_call,
ipo_roadshow, ipo_listing, pre_ipo,
manda_call, takeover_announcement, merger_announcement, scheme_of_arrangement,
credit_rating_call, bondholder_meeting, debt_restructuring,
proxy_contest, activist_meeting, extraordinary_general_meeting,
other
```

### Platform Enum

```
zoom, teams, meet, webex, choruscall, other
```

### Status Enum

```
pending, bot_joining, live, processing, completed, failed
```

---

## 3. tRPC Router — All 18 Procedures

Router name: **`shadowMode`** (client calls `trpc.shadowMode.*`)

### Procedure Reference Table

| # | Name | Type | Auth | Input | Returns |
|---|------|------|------|-------|---------|
| 1 | `startSession` | mutation | operator | clientName, eventName, eventType, platform, meetingUrl, webhookBaseUrl?, notes? | sessionId, botId, ablyChannel, status, agmSessionId, manualCapture, retriesUsed, message |
| 2 | `endSession` | mutation | operator | sessionId | success, transcriptSegments, taggedMetricsGenerated, message |
| 3 | `listSessions` | query | protected | (none) | ShadowSession[] (limit 50, ordered by createdAt DESC) |
| 4 | `getSession` | query | protected | sessionId | session + transcriptSegments + agmSessionId + recordingUrl + botStatus + aiReport |
| 5 | `updateStatus` | mutation | operator | sessionId, status, sentimentAvg?, transcriptSegments? | success |
| 6 | `retrySession` | mutation | operator | sessionId | sessionId, botId, ablyChannel, status, message |
| 7 | `pushTranscriptSegment` | mutation | operator | sessionId, speaker, text, timestamp, timeLabel? | success, segmentCount |
| 8 | `deleteSession` | mutation | operator | sessionId | success, message |
| 9 | `deleteSessions` | mutation | operator | sessionIds (1-100) | success, deleted, message |
| 10 | `createFromCalendar` | mutation | operator | clientName, eventName, eventType, platform, meetingUrl, scheduledStart, calendarEventId?, notes? | sessionId, alreadyExists, status, message |
| 11 | `pipeAgmGovernance` | mutation | operator | sessionId, transcriptSegments[] | agmSessionId, results |
| 12 | `addNote` | mutation | operator | sessionId, text (1-5000 chars) | success, noteId, noteCount |
| 13 | `deleteNote` | mutation | operator | sessionId, noteId | success |
| 14 | `getNotes` | query | operator | sessionId | Array<{id, text, createdAt}> |
| 15 | `getActionLog` | query | operator | sessionId?, limit? (default 100) | OperatorAction[] |
| 16 | `qaAction` | mutation | operator | sessionId, questionId, action, questionText? | success, action, message |
| 17 | `getHandoffPackage` | query | operator | sessionId | Full session bundle (see Section 17) |
| 18 | `exportSession` | query | operator | sessionId, format ("csv"\|"json"\|"pdf") | content, filename, contentType |

---

### 3.1 startSession — Detailed Logic

```
Input validation (Zod):
  clientName: string.min(1)
  eventName: string.min(1)
  eventType: enum (27 values)
  platform: enum (6 values, default "zoom")
  meetingUrl: string.url()
  webhookBaseUrl: string.url().optional()
  notes: string.optional()

Steps:
  1. Insert row into shadow_sessions (status: "pending")
  2. Generate ablyChannel = `shadow-{sessionId}-{Date.now()}`
  3. If eventType === "agm" && userId != null:
       → Auto-create agm_intelligence_sessions row (jurisdiction: "south_africa", status: "live")
  4. Branch on platform:

  PATH A — Non-Recall (choruscall/other):
    → Set status = "live", startedAt = Date.now()
    → Return { manualCapture: true, botId: null }
    → Client renders LocalAudioCapture component

  PATH B — Recall-supported (zoom/teams/meet/webex):
    → Require RECALL_AI_API_KEY
    → Resolve webhook URL: webhookBaseUrl > RECALL_WEBHOOK_BASE_URL > REPLIT_DEPLOYMENT_URL > REPLIT_DEV_DOMAIN > PUBLIC_URL > APP_URL
    → Deploy bot with up to 3 attempts (0, 2s, 4s backoff):
        POST {RECALL_BASE_URL}/bot/
        Body: {
          meeting_url, bot_name: "CuraLive Intelligence",
          recording_config: {
            transcript: { provider: { recallai_streaming: {} } },
            realtime_endpoints: [{ type: "webhook", url, events: ["transcript.data"] }]
          },
          webhook_url,
          metadata: { ablyChannel, shadowSessionId },
          automatic_leave: {
            waiting_room_timeout: 600,   // 10 min
            noone_joined_timeout: 300,   // 5 min
            everyone_left_timeout: 60    // 1 min
          }
        }
    → Update shadow_sessions: recallBotId, ablyChannel, status: "bot_joining", startedAt
    → Insert recall_bots row: recallBotId, meetingUrl, botName, status, ablyChannel, transcriptJson: "[]"
    → Return { manualCapture: false, botId, retriesUsed }
    → On all retries fail: set status = "failed", throw

  Auth header for Recall.ai API:
    Authorization: Token {RECALL_AI_API_KEY}
    Content-Type: application/json
    Base URL: RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1"
```

### 3.2 endSession — Detailed Logic

```
1. Fetch session row
2. Branch:

   PATH A — Has recallBotId:
     → POST /bot/{botId}/leave_call/ (fire-and-forget, catches errors)
     → Fetch transcript from recall_bots table (JSON.parse bot.transcriptJson)
     → Set status = "processing", endedAt = Date.now()
     → Generate 4 tagged metrics
     → Set status = "completed" with segment count + metrics count
     → Scan compliance keywords in full text
     → writeAnonymizedRecord (aggregate intelligence)
     → BACKGROUND (fire-and-forget): autoGenerateAiReport
     → Log operator action

   PATH B — Has localTranscriptJson (local capture):
     → Same as PATH A but transcript comes from session.localTranscriptJson
     → Identical metrics generation + AI report pipeline

   PATH C — No transcript:
     → Set status = "completed", endedAt = Date.now()
     → Return { transcriptSegments: 0, taggedMetricsGenerated: 0 }

   Bundle mapping for tagged metrics:
     earnings_call | capital_markets_day → "Investor Relations"
     agm | board_meeting → "Compliance & Risk"
     everything else → "Webcasting"
```

### 3.3 pushTranscriptSegment — Detailed Logic

```
Used by LocalAudioCapture for non-Recall platforms.

1. Validate session exists and status is "live" or "bot_joining"
2. Build segment object:
   {
     speaker: input.speaker (default "Speaker"),
     text: input.text,
     timestamp: input.timestamp,
     timeLabel: input.timeLabel ?? new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
   }
3. Parse existing localTranscriptJson (or []), append segment
4. Update shadow_sessions: transcriptSegments = count, localTranscriptJson = JSON.stringify
5. If session has ablyChannel:
   → POST https://rest.ably.io/channels/{channel}/messages
     Authorization: Basic base64(ABLY_API_KEY)
     Body: { name: "curalive", data: JSON.stringify({ type: "transcript.segment", data: segment }) }
6. Return { success, segmentCount }
```

### 3.4 getSession — Detailed Logic

```
1. Fetch session row
2. If recallBotId → fetch from recall_bots: transcriptJson, recordingUrl, status
3. Fallback: parse session.localTranscriptJson if recall transcript is empty
4. If eventType === "agm" → check agm_intelligence_sessions for linked agmSessionId
5. Build localRecordingUrl: /api/shadow/recording/{sessionId} (if localRecordingPath exists)
6. Fetch AI report from archive_events WHERE event_id = "shadow-{sessionId}"
7. Return merged object: session fields + transcriptSegments + agmSessionId + recordingUrl + botStatus + aiReport
```

### 3.5 retrySession

```
Only works on failed sessions with a meetingUrl.
Deploys a fresh Recall.ai bot, creates new ablyChannel, resets to bot_joining.
Same bot config as startSession.
```

### 3.6 deleteSession / deleteSessions

```
Guards: cannot delete active sessions (live or bot_joining).
Cascade cleanup:
  → Delete from tagged_metrics WHERE eventId = "shadow-{id}"
  → Delete from recall_bots WHERE recallBotId matches
  → Delete from agm_intelligence_sessions WHERE shadowSessionId matches (if AGM)
  → Delete local recording file from disk (unlinkSync)
  → Delete from shadow_sessions

Bulk delete: max 100 sessions per call. Filters to deletable only.
```

### 3.7 createFromCalendar

```
Pre-creates a session in "pending" status for calendar integration.
Deduplication: checks if notes column contains "calendar:{calendarEventId}" via LIKE query.
Stores: "calendar:{calendarEventId} | Scheduled: {scheduledStart} | {notes}" in notes column.
Returns { sessionId, alreadyExists: boolean }.
```

### 3.8 qaAction

```
Supported actions:
  approve, reject, hold, legal_review, send_to_speaker, answered,
  bulk_approve, bulk_reject, generate_draft, link_duplicate, unlink_duplicate

Logs to operator_actions with actionType = "question_{action}".
```

---

## 4. Session Lifecycle & State Machine

```
                          ┌──────────────────────────────────────┐
                          │  createFromCalendar                  │
                          │  (pre-stage with status: "pending")  │
                          └──────────┬───────────────────────────┘
                                     │
                                     ▼
┌──────────┐         ┌──────────────────────────────┐
│ pending   │────────►│  startSession                │
└──────────┘         └──────────────────────────────┘
                          │                    │
            Recall bot    │                    │  Local (choruscall/other)
                          ▼                    ▼
                    ┌─────────────┐     ┌──────────┐
                    │ bot_joining  │     │  live     │◄── Immediate
                    └──────┬──────┘     └──────────┘
                           │                    │
               Bot joins   │    pushTranscriptSegment
               call        │    (from LocalAudioCapture)
                           ▼                    │
                    ┌──────────┐                │
                    │  live     │                │
                    └──────┬───┘                │
                           │                    │
                           └────────┬───────────┘
                                    │
                              endSession
                                    │
                                    ▼
                           ┌──────────────┐
                           │ processing   │  (generating metrics + AI report)
                           └──────┬───────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │ completed    │
                           └──────────────┘

                    ┌──────────────┐
                    │   failed      │◄── Bot deploy fails / Guardian timeout / Watchdog
                    └──────┬───────┘
                           │
                     retrySession
                           │
                           ▼
                    ┌─────────────┐
                    │ bot_joining  │  (new bot deployed)
                    └─────────────┘
```

---

## 5. Platform Routing — Dual Capture Modes

| Platform | Capture Mode | Status on Start | Transcript Storage | Bot Name |
|----------|-------------|-----------------|-------------------|----------|
| `zoom` | Recall.ai bot | `bot_joining` | `recall_bots.transcriptJson` | "CuraLive Intelligence" |
| `teams` | Recall.ai bot | `bot_joining` | `recall_bots.transcriptJson` | "CuraLive Intelligence" |
| `meet` | Recall.ai bot | `bot_joining` | `recall_bots.transcriptJson` | "CuraLive Intelligence" |
| `webex` | Recall.ai bot | `bot_joining` | `recall_bots.transcriptJson` | "CuraLive Intelligence" |
| `choruscall` | Local Audio Capture | `live` | `shadow_sessions.localTranscriptJson` | N/A |
| `other` | Local Audio Capture | `live` | `shadow_sessions.localTranscriptJson` | N/A |

The routing decision is a simple `Set.has()` check:

```typescript
const RECALL_SUPPORTED = new Set(["zoom", "teams", "meet", "webex"]);
const isRecallSupported = RECALL_SUPPORTED.has(input.platform);
```

---

## 6. Recall.ai Bot Integration

### Bot Deployment Config

```json
{
  "meeting_url": "<from input>",
  "bot_name": "CuraLive Intelligence",
  "recording_config": {
    "transcript": {
      "provider": { "recallai_streaming": {} }
    },
    "realtime_endpoints": [{
      "type": "webhook",
      "url": "<webhookUrl>/api/recall/webhook",
      "events": ["transcript.data"]
    }]
  },
  "webhook_url": "<webhookUrl>/api/recall/webhook",
  "metadata": {
    "ablyChannel": "shadow-{sessionId}-{timestamp}",
    "shadowSessionId": "{sessionId}"
  },
  "automatic_leave": {
    "waiting_room_timeout": 600,
    "noone_joined_timeout": 300,
    "everyone_left_timeout": 60
  }
}
```

### API Authentication

```
Base URL: process.env.RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1"
Auth header: Authorization: Token {RECALL_AI_API_KEY}
Content-Type: application/json
```

### Retry Logic

- 3 total attempts (initial + 2 retries)
- Backoff: `2000 * attempt` ms (0s, 2s, 4s)
- On all fail: session marked `failed`

### Bot Leave on endSession

```typescript
await recallFetch(`/bot/${session.recallBotId}/leave_call/`, { method: "POST" });
```
Fire-and-forget — catches errors silently (bot may have already left).

---

## 7. Recall Webhook Handler

**File:** `server/recallWebhook.ts`  
**Route:** `POST /api/recall/webhook`

### CRITICAL: Raw Body for HMAC

The webhook route uses its own raw body middleware — it does NOT use `express.json()`. The route collects the raw request body via `req.on("data")` events and attaches it as `req.rawBody`.

### HMAC-SHA256 Signature Verification

```typescript
function verifyRecallSignature(rawBody: string, signature: string | undefined): boolean {
  // In dev without secret: allow unsigned
  // In production without secret: reject
  const expected = crypto.createHmac("sha256", RECALL_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)  // Header: x-recall-signature
  );
}
```

- Header: `x-recall-signature`
- Format: `sha256={hex_digest}`
- Uses `crypto.timingSafeEqual` for constant-time comparison
- In dev mode without `RECALL_AI_WEBHOOK_SECRET`: allows unsigned webhooks
- In production without secret: REJECTS all webhooks

### Response Pattern

```typescript
// Acknowledge IMMEDIATELY — Recall.ai expects 200 within 5 seconds
res.status(200).json({ received: true });
// Then process asynchronously (no await before response)
```

### Event Handlers

#### `bot.status_change`

```
Payload shape:
{
  event: "bot.status_change",
  data: {
    data: { code: string, sub_code: string | null, updated_at: string },
    bot: { id: string, metadata?: Record<string, string> }
  }
}

Processing:
1. Update recall_bots.status
2. If code is "in_call_recording" or "in_call_not_recording" → set joinedAt
3. If code is "done" or "call_ended" or "fatal" → set leftAt
4. Publish to Ably: { type: "bot.status", data: { status, recallBotId } }
```

#### `transcript.data`

```
Payload shape:
{
  event: "transcript.data",
  data: {
    data: {
      words: Array<{
        text: string,
        start_timestamp: { relative: number },  // seconds from call start
        end_timestamp: { relative: number }
      }>,
      participant: {
        id: number,
        name: string,
        is_host: boolean,
        email: string | null
      }
    },
    bot: { id: string, metadata?: Record<string, string> }
  }
}

Processing:
1. Build segment: text = words.map(w => w.text).join(" ").trim()
2. Create segment ID: `{recallBotId}-{startTime}`
3. timeLabel: formatTime(startTime) → "M:SS" format
4. Append to recall_bots.transcriptJson (JSON parse → push → stringify → update)
5. Publish to Ably: { type: "transcript.segment", data: segment }
6. Every 5 segments → background AI analysis:
   a. scoreSentiment(last 5 segments' text) → publish { type: "sentiment.update", data }
   b. Every 10 segments → generateRollingSummary(last 20 segments) → publish { type: "rolling.summary", data }
```

#### `recording.done`

```
Payload shape:
{
  bot: { id: string },
  data: { recording_url?: string }
}

Processing:
→ Update recall_bots.recordingUrl
```

---

## 8. Local Audio Capture (Browser-Side)

**File:** `client/src/components/LocalAudioCapture.tsx`

### Dual Capture Modes

#### Mode 1: Tab/Window Audio (getDisplayMedia + Whisper AI)

```
Technology: navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
Engine: OpenAI Whisper API via POST /api/transcribe-audio
Chunk interval: 15 seconds
Min chunk size: 1000 bytes
Audio format: audio/webm

Flow:
1. User clicks "Start Tab Audio Capture"
2. Browser shows screen/tab share picker
3. getDisplayMedia provides MediaStream with audio
4. MediaRecorder chunks every 15s
5. Each chunk (if > 1000 bytes) → FormData → POST /api/transcribe-audio
6. Response contains { text } → trpc.shadowMode.pushTranscriptSegment.mutate(...)
7. Speaker label: "Tab Audio"
```

#### Mode 2: Microphone (Web Speech API)

```
Technology: window.SpeechRecognition || window.webkitSpeechRecognition
Config: continuous = true, interimResults = false, lang = "en-US"
No server-side processing — runs entirely in browser

Flow:
1. User clicks "Start Microphone"
2. SpeechRecognition.onresult fires with transcript
3. Each final result → trpc.shadowMode.pushTranscriptSegment.mutate(...)
4. Speaker label: "Microphone"
5. SpeechRecognition.onend → auto-restart (keeps running until user stops)
```

### Data Path for Both Modes

```
Browser capture → pushTranscriptSegment (tRPC mutation)
  → Appends to shadow_sessions.localTranscriptJson
  → Publishes to Ably channel (if configured)
  → Returns { success, segmentCount }
```

---

## 9. Real-Time Ably Pub/Sub

### Channel Naming

```
Pattern: shadow-{sessionId}-{timestamp}
Example: shadow-42-1711800000000
```

Each session start generates a unique channel name using `Date.now()` to avoid collisions.

### Server-Side Publishing (No SDK)

CuraLive uses the Ably REST API directly — no Ably SDK dependency.

```typescript
async function ablyPublish(channel: string, name: string, data: unknown) {
  const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
  const body = JSON.stringify({ name, data: JSON.stringify(data) });
  const auth = Buffer.from(ABLY_API_KEY).toString("base64");

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body,
  });
}
```

### Message Types Published

| Type | Source | Payload Shape |
|------|--------|--------------|
| `transcript.segment` | Recall webhook + pushTranscriptSegment | `{ id, speaker, text, timestamp, timeLabel }` |
| `bot.status` | Recall webhook (bot.status_change) | `{ status, recallBotId }` |
| `sentiment.update` | Recall webhook (every 5 segments) | `SentimentResult { score, label, keywords, timestamp }` |
| `rolling.summary` | Recall webhook (every 10 segments) | `RollingSummary { text, timestamp, segmentCount }` |

### Message Envelope

All messages are published with:
- `name: "curalive"`
- `data: JSON.stringify({ type: "...", data: ... })` — note the double-stringification

For pushTranscriptSegment (local capture), the same envelope is used:

```typescript
{
  name: "curalive",
  data: JSON.stringify({ type: "transcript.segment", data: segment })
}
```

---

## 10. AI Analysis Pipeline (Live)

**File:** `server/aiAnalysis.ts`

### Live Sentiment Scoring

```typescript
export async function scoreSentiment(recentText: string): Promise<SentimentResult>

SentimentResult = {
  score: number;          // 0–100
  label: "Positive" | "Neutral" | "Cautious" | "Negative";
  keywords: string[];     // top 3 sentiment-driving keywords
  timestamp: number;
}
```

- Triggered every **5 transcript segments** in the webhook handler
- Input: concatenated text from last 5 segments (truncated to 1500 chars)
- Uses `response_format: { type: "json_schema" }` for structured output
- Fallback on error: `{ score: 65, label: "Neutral", keywords: [], timestamp: Date.now() }`

### Rolling Summary

```typescript
export async function generateRollingSummary(
  segments: Array<{ speaker: string; text: string }>,
  eventTitle: string
): Promise<RollingSummary>

RollingSummary = {
  text: string;           // 2–3 sentence "what you missed" summary
  timestamp: number;
  segmentCount: number;
}
```

- Triggered every **10 transcript segments**
- Input: last 20 segments formatted as `"Speaker: text"`
- System prompt: "You are a live event summariser for investor webcasts"
- Fallback: "The event is in progress. Transcript is being captured."

### Q&A Triage

```typescript
export async function triageQuestion(
  question: string,
  existingQuestions: string[]
): Promise<QATriage>

QATriage = {
  classification: "approved" | "duplicate" | "off-topic" | "sensitive" | "compliance";
  confidence: number;     // 0–100
  reason: string;
}
```

### Additional AI Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `generateEventBrief()` | Pre-event talking points from press release | Event setup |
| `generatePressRelease()` | Post-event SENS/RNS-style press release | Archive |
| `generateEnhancedSummary()` | Comprehensive post-event analysis | Archive |
| `translateText()` | Multi-language transcript translation | Attendee Event Room |
| `analyzeSpeakingPace()` | Per-speaker WPM, filler words, coaching tips | Post-event |

---

## 11. Post-Session AI Pipeline (CIP4)

When `endSession` is called, a background fire-and-forget pipeline runs:

```
autoGenerateAiReport(sessionId, clientName, eventName, eventType, transcript, sentimentAvg, complianceFlags)
  │
  ├─ 1. generateFullAiReport(transcriptText, ...)
  │     → 20-module AI report (see below)
  │     → Chunks at 12,000 chars if transcript > 15,600 chars
  │     → Stores in archive_events.ai_report as JSON
  │
  ├─ 2. runMetaObserver(aiReport, "live_session", sessionId, ...)
  │     → AiEvolution meta-analysis
  │     → runAccumulationEngine() in background
  │
  ├─ 3. analyzeCrisisRisk(fullText, clientName, ...)
  │     → Crisis prediction with sentiment trajectory
  │
  ├─ 4. generateDisclosureCertificate({ eventId: "shadow-{id}", ... })
  │     → JSE disclosure compliance certificate
  │     → jurisdictions: ["JSE"]
  │
  └─ 5. analyzeValuationImpact(fullText, clientName, ...)
        → Valuation impact scoring
```

### AiReport Type (20 Modules)

```typescript
export type AiReport = {
  executiveSummary: string;
  sentimentAnalysis: {
    score: number;
    narrative: string;
    keyDrivers: string[];
  };
  complianceReview: {
    riskLevel: string;           // "Low" | "Moderate" | "High" | "Critical"
    flaggedPhrases: string[];
    recommendations: string[];
  };
  keyTopics: {
    topic: string;
    sentiment: string;           // "Positive" | "Neutral" | "Negative"
    detail: string;
  }[];
  speakerAnalysis: {
    speaker: string;
    role: string;                // "CEO" | "CFO" | "Analyst" etc.
    keyPoints: string[];
  }[];
  questionsAsked: {
    question: string;
    askedBy: string;
    quality: string;             // "Insightful" | "Routine" | "Challenging"
  }[];
  actionItems: {
    item: string;
    owner: string;
    deadline: string;
  }[];
  investorSignals: {
    signal: string;
    interpretation: string;
    severity: string;            // "Positive" | "Neutral" | "Concerning" | "Critical"
  }[];
  communicationScore: {
    score: number;               // 0-100
    clarity: number;             // 0-100
    transparency: number;        // 0-100
    narrative: string;
  };
  riskFactors: {
    factor: string;
    impact: string;              // "High" | "Medium" | "Low"
    likelihood: string;          // "High" | "Medium" | "Low"
  }[];
  competitiveIntelligence: {
    mention: string;
    context: string;
  }[];
  recommendations: string[];
  speakingPaceAnalysis: {
    overallWpm: number;
    paceLabel: string;           // "Slow" | "Normal" | "Fast" | "Rushed"
    fillerWords: { word: string; count: number }[];
    deliveryScore: number;       // 0-100
    coachingTips: string[];
  };
  toxicityScreen: {
    overallRisk: string;         // "Clean" | "Low" | "Moderate" | "High"
    flaggedContent: {
      phrase: string;
      issue: string;
      severity: string;          // "Low" | "Medium" | "High"
    }[];
    priceSensitive: boolean;
    legalRisk: boolean;
  };
  sentimentArc: {
    opening: number;             // 0-100
    midpoint: number;            // 0-100
    closing: number;             // 0-100
    trend: string;               // "Improving" | "Stable" | "Declining" | "Volatile"
    narrative: string;
  };
  financialHighlights: {
    metric: string;              // "Revenue" | "EBITDA" | "EPS" etc.
    value: string;               // "R2.3bn"
    context: string;
    yoyChange: string;           // "+12% YoY"
  }[];
  esgMentions: {
    topic: string;               // "carbon" | "diversity" | "governance" etc.
    commitment: string;
    sentiment: string;           // "Positive" | "Neutral" | "Negative"
  }[];
  pressReleaseDraft: string;
  socialMediaContent: {
    platform: string;            // "LinkedIn" | "Twitter" | "General"
    content: string;
  }[];
  boardReadySummary: {
    verdict: string;             // "Strong" | "Satisfactory" | "Concerning" | "Critical"
    keyRisks: string[];
    keyOpportunities: string[];
    recommendedActions: string[];
  };
  modulesGenerated: number;
};
```

### Transcript Chunking Strategy

```typescript
const CHUNK_SIZE = 12000;
const needsChunking = transcriptText.length > CHUNK_SIZE * 1.3;  // > 15,600 chars

if (needsChunking) {
  // Split into 12k-char chunks
  // Summarize each chunk with gpt-4o-mini (parallel)
  // Concatenate summaries as analysis input
}
```

### Archive Storage

AI reports are stored in `archive_events` table:

```sql
INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text,
  word_count, segment_count, sentiment_avg, compliance_flags, status, ai_report, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', $10, 'Auto-generated from Shadow Mode session')
ON CONFLICT (event_id) DO UPDATE SET ai_report = EXCLUDED.ai_report, status = 'completed'
```

`event_id` format: `"shadow-{sessionId}"`

---

## 12. Tagged Metrics Generation

On `endSession`, 4 metrics are inserted into `tagged_metrics`:

### 1. Sentiment Metric

```typescript
{
  eventId: "shadow-{sessionId}",
  eventTitle: "{clientName} — {eventName}",
  tagType: "sentiment",
  metricValue: sentimentAvg,         // real, 0-100
  label: sentimentAvg >= 70 ? "Positive Sentiment Session"
       : sentimentAvg >= 50 ? "Neutral Sentiment Session"
       : "Low Sentiment Session",
  severity: sentimentAvg >= 70 ? "positive"
          : sentimentAvg >= 50 ? "neutral"
          : "negative",
  source: "shadow-mode",
  bundle: <computed>
}
```

### 2. Engagement Metric

```typescript
{
  tagType: "engagement",
  metricValue: transcript.length,    // segment count
  label: "{N} Transcript Segments Captured",
  severity: segments > 20 ? "positive" : segments > 5 ? "neutral" : "negative",
}
```

### 3. Compliance Metric

```typescript
{
  tagType: "compliance",
  metricValue: flagCount / totalKeywords,   // ratio 0.0–1.0
  label: flagCount > 2 ? "Compliance Flags Detected" : "Low Compliance Risk",
  severity: flagCount > 3 ? "critical" : flagCount > 1 ? "negative" : "positive",
}

// Keywords scanned:
["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"]
```

### 4. Intervention Metric

```typescript
{
  tagType: "intervention",
  metricValue: 0,                    // always 0 (shadow mode = no human intervention)
  label: "Shadow Mode Session Completed",
  detail: "CuraLive ran silently in the background. No human intervention required.",
  severity: "positive",
}
```

### Bundle Assignment

```
earnings_call | capital_markets_day → "Investor Relations"
agm | board_meeting → "Compliance & Risk"
all other event types → "Webcasting"
```

---

## 13. Guardian Service & Watchdog

**File:** `server/services/ShadowModeGuardianService.ts`

### reconcileShadowSessions() — Runs on Server Startup

Queries all sessions with status IN `('live', 'bot_joining', 'processing')`:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| status = "processing" AND age > 15 min | `PROCESSING_TIMEOUT_MS = 15 * 60 * 1000` | Mark `failed` |
| status IN ("live", "bot_joining") AND age > 30 min AND has transcript | `STALE_THRESHOLD_MS = 30 * 60 * 1000` | Mark `completed` (recovered) |
| status IN ("live", "bot_joining") AND age > 30 min AND no transcript | `STALE_THRESHOLD_MS` | Mark `failed` |

Each action appends a note: `[Guardian] ...reason... at {timestamp}`

### startShadowWatchdog() — Runs Every 60 Seconds

```
Interval: WATCHDOG_INTERVAL_MS = 60 * 1000 (1 minute)
```

| Condition | Threshold | Action |
|-----------|-----------|--------|
| status = "bot_joining" AND age > 10 min | `10 * 60 * 1000` | Mark `failed` + note `[Watchdog] Bot never joined` |
| status = "live" AND age > 6 hours | `6 * 60 * 60 * 1000` | Mark `completed` + note `[Watchdog] Session exceeded 6h max` |

### gracefulShutdown(signal)

```typescript
export async function gracefulShutdown(signal: string) {
  stopShadowWatchdog();
  // Annotate all active sessions with shutdown note
  UPDATE shadow_sessions SET notes = CONCAT(notes, '[Guardian] Server shutting down...')
    WHERE status IN ('live', 'bot_joining', 'processing')
}
```

---

## 14. AGM Governance Integration

### Auto-Creation

When `startSession` is called with `eventType === "agm"`:
- Auto-creates an `agm_intelligence_sessions` row
- Links via `shadowSessionId`
- Sets `jurisdiction: "south_africa"`, `status: "live"`

### pipeAgmGovernance Procedure

```typescript
Input: { sessionId, transcriptSegments: Array<{ speaker, text, timestamp }> }

1. Find or create agm_intelligence_sessions row
2. Import AgmGovernanceAiService
3. Run triageGovernanceQuestions(userId, agmSessionId, segments)
4. Run scanRegulatoryCompliance(userId, agmSessionId, segments)
5. Return { agmSessionId, results: { governanceQuestions, regulatoryCompliance } }
```

---

## 15. Notes, Operator Actions & Audit Log

### Notes (stored on shadow_sessions)

Notes are stored as a JSON array in `shadow_sessions.notes`:

```typescript
type Note = { id: string; text: string; createdAt: string };
// id format: "note-{Date.now()}-{random4chars}"
// text: 1-5000 chars
```

Operations: `addNote`, `deleteNote`, `getNotes`

### Operator Actions (operator_actions table)

Every significant action is logged:

```typescript
logOperatorAction({
  sessionId?: number,
  archiveId?: number,
  actionType: string,          // "session_started", "session_ended", "note_created", "question_approve", etc.
  detail?: string,
  operatorName?: string,       // defaults to "Operator"
  metadata?: Record<string, unknown>,
})
```

Queried by `getActionLog`: supports filtering by sessionId, limit (default 100), ordered by createdAt DESC.

---

## 16. Session Export (CSV / JSON / PDF)

### exportSession Procedure

```
Input: { sessionId, format: "csv" | "json" | "pdf" }
Auth: operator
```

All formats include:
- Session metadata (clientName, eventName, eventType, platform, status, duration)
- Full transcript (from recall_bots OR localTranscriptJson)
- Notes
- Action log (limit 500)
- AI report (from archive_events)
- Q&A questions (from live_qa_questions + live_qa_sessions)
- Recording URL

### CSV Format

```
Columns: Section, Timestamp, Speaker, Content, Metadata

Sections:
  "Event Info" — session metadata rows
  "Transcript" — one row per segment
  "Note" — operator notes
  "Action" — audit log entries
  "AI Report" — key AI report fields (executiveSummary, sentiment, compliance, keyTopics, riskFactors, actionItems)
  "Compliance" — if no AI report: "No AI report generated"
  "Q&A" — one row per question with status, triage, duplicate links, legal flags

CSV injection protection: prefixes =, +, -, @, tab, CR with single quote
```

### JSON Format

```json
{
  "session": { "id", "clientName", "eventName", "eventType", "platform", "status", "startedAt", "endedAt", "duration", "durationMs", "meetingUrl", "recordingUrl", "exportedAt" },
  "transcript": [...segments],
  "notes": [...notes],
  "actionLog": [...actions],
  "aiReport": { ...AiReport or null },
  "qa": {
    "questions": [...qaData],
    "dedupGroups": { "origId": [dupId1, dupId2] },
    "legalReviewItems": [{ id, text, reason }]
  }
}
```

### PDF Format

Returns the same JSON structure as JSON format but with `contentType: "application/pdf"` and `pdfData: true` flag for client-side PDF generation.

---

## 17. Handoff Package

The `getHandoffPackage` procedure returns a comprehensive bundle for post-event handoff:

```typescript
return {
  session: {
    id, clientName, eventName, eventType, platform, status,
    startedAt, endedAt, duration (seconds)
  },
  transcript: {
    segments: Array<{ speaker, text, timestamp }>,
    wordCount: number
  },
  recording: { url: string | null },
  notes: Array<{ id, text, createdAt }>,
  actionLog: OperatorAction[] (limit 200),
  qaSummary: {
    total, approved, rejected, held, legalReview, sentToSpeaker,
    questions (count), duplicateGroups (count), legalReviewPending (count)
  },
  qaQuestions: raw Q&A data from live_qa_questions,
  dedupGroups: { originalQuestionId: [duplicateId1, ...] },
  legalReviewItems: [{ id, text, reason, status }],
  aiReport: AiReport | null,
  readiness: {
    hasTranscript: boolean,
    hasRecording: boolean,
    hasAiReport: boolean,
    hasNotes: boolean,
    hasActions: boolean,
    score: 0-4,               // count of true values
    maxScore: 4
  }
};
```

---

## 18. Environment Variables & Secrets

| Variable | Required | Purpose |
|----------|----------|---------|
| `RECALL_AI_API_KEY` | Yes (for Recall platforms) | Authenticates with Recall.ai API |
| `RECALL_AI_BASE_URL` | No | Default: `https://eu-central-1.recall.ai/api/v1` |
| `RECALL_AI_WEBHOOK_SECRET` | Yes (production) | HMAC-SHA256 signature verification |
| `RECALL_WEBHOOK_BASE_URL` | No | Override webhook URL sent to Recall |
| `ABLY_API_KEY` | Yes (for real-time) | Server-side Ably REST publish |
| `JWT_SECRET` | Yes | tRPC auth middleware |
| `DATABASE_URL` | Yes | PostgreSQL connection |

### Webhook URL Resolution Order

```
1. webhookBaseUrl (from startSession input)
2. RECALL_WEBHOOK_BASE_URL (env)
3. REPLIT_DEPLOYMENT_URL (auto-set by Replit in production)
4. REPLIT_DEV_DOMAIN (auto-set by Replit in dev)
5. PUBLIC_URL (env)
6. APP_URL (env)
```

---

## 19. API Types & Interfaces

### SentimentResult

```typescript
{
  score: number;          // 0–100
  label: "Positive" | "Neutral" | "Cautious" | "Negative";
  keywords: string[];
  timestamp: number;
}
```

### RollingSummary

```typescript
{
  text: string;
  timestamp: number;
  segmentCount: number;
}
```

### QATriage

```typescript
{
  classification: "approved" | "duplicate" | "off-topic" | "sensitive" | "compliance";
  confidence: number;     // 0–100
  reason: string;
}
```

### EventBrief

```typescript
{
  headline: string;
  keyMessages: string[];
  talkingPoints: string[];
  anticipatedQuestions: string[];
  disclaimer: string;
}
```

### PressReleaseDraft

```typescript
{
  headline: string;
  subheadline: string;
  body: string;
  boilerplate: string;
}
```

### EnhancedSummary

```typescript
{
  executiveSummary: string;
  financialHighlights: string[];
  forwardLookingStatements: string[];
  riskFactors: string[];
  keyTopics: string[];
  actionItems: string[];
  sentiment: "Positive" | "Neutral" | "Cautious" | "Negative";
  sentimentScore: number;
}
```

### TranscriptSegment (Recall bot)

```typescript
{
  id: string;           // "{recallBotId}-{startTime}"
  speaker: string;
  text: string;
  timestamp: number;     // Date.now() at receipt
  timeLabel: string;     // "M:SS" format
}
```

### TranscriptSegment (Local capture)

```typescript
{
  speaker: string;       // "Tab Audio" or "Microphone" or "Speaker"
  text: string;
  timestamp: number;
  timeLabel: string;     // "HH:MM" en-GB format
}
```

---

## 20. Known Gotchas & Critical Notes

### 1. Webhook Registration Order

The Recall webhook route **MUST** be registered before `express.json()` middleware. It uses its own raw body collection middleware for HMAC signature verification. If `express.json()` parses the body first, the raw body is consumed and signature verification fails.

### 2. Double JSON Stringification in Ably

Ably messages use double stringification:
```typescript
data: JSON.stringify({ type: "transcript.segment", data: segment })
```
The `data` field is already stringified when passed to the Ably REST API's `data` parameter. Client must `JSON.parse(message.data)` to get the inner object.

### 3. Router Name

The tRPC router is named `shadowMode` (camelCase), NOT `shadow`. Client calls use `trpc.shadowMode.*`.

### 4. connectionQuality Enum

Only `"excellent" | "good" | "fair" | "poor"` — NEVER `"degraded"`.

### 5. Transcript Source Priority

When fetching transcript (in getSession, endSession, getHandoffPackage, exportSession):
1. First try `recall_bots.transcriptJson` (if session has `recallBotId`)
2. Fallback to `shadow_sessions.localTranscriptJson` (only if recall transcript is empty)

### 6. Notes Column is JSON Text

The `notes` column on `shadow_sessions` stores a JSON array as text:
```typescript
Array<{ id: string; text: string; createdAt: string }>
```
But it can also contain plain text (e.g., from `createFromCalendar` or Guardian annotations). The code handles both with try-catch JSON.parse fallbacks.

### 7. AI Report Minimum Transcript Length

`autoGenerateAiReport` skips if full text < 50 chars. The `generateFullAiReport` function uses gpt-4o-mini for chunk summarization.

### 8. Bot Deploy Retries

3 total attempts (initial + 2 retries) with exponential backoff (0s, 2s, 4s). All failures → session marked `failed`.

### 9. Recall.ai Webhook Response Time

Recall.ai expects a 200 response within 5 seconds. The webhook handler sends `res.status(200).json({ received: true })` immediately, then processes events asynchronously (background tasks not awaited).

### 10. Watchdog Timers

| Timer | Interval | Purpose |
|-------|----------|---------|
| Watchdog | 60s | Check for zombie bot_joining (>10min) and over-long live (>6h) |
| Reconciliation | On startup | Recover stale sessions from before server restart |

### 11. Fire-and-Forget Patterns

Several background tasks use fire-and-forget (`.catch()` only):
- AI report generation on endSession
- AI sentiment + summary in webhook (void IIFE)
- AiEvolution accumulation engine

### 12. CSV Injection Protection

The CSV export sanitizes cell values: any cell starting with `=`, `+`, `-`, `@`, tab, or CR is prefixed with a single quote.

### 13. Tagged Metrics eventId Format

All tagged metrics for shadow sessions use `eventId = "shadow-{sessionId}"`. This same format is used to look up AI reports in `archive_events.event_id`.

### 14. AGM Auto-Creation Requires userId

The AGM intelligence session auto-creation in `startSession` only fires when `ctx.user?.id` is available. If auth context is missing, the AGM session is silently skipped.

### 15. Local Recording Endpoint

Local recordings are served at: `GET /api/shadow/recording/{sessionId}` — this maps to the file at `session.localRecordingPath` on disk.

---

*End of Shadow Mode Live Intelligence Technical Brief*
