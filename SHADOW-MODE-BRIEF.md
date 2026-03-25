# CuraLive Shadow Mode — Complete Technical Brief

## What Shadow Mode Is

Shadow Mode is CuraLive's core intelligence feature. It allows CuraLive to silently join any investor event (earnings calls, AGMs, roadshows, etc.) running on external platforms (Teams, Zoom, Webex, Google Meet, Chorus Call) and capture real-time transcription, sentiment, compliance signals, and AI-powered intelligence — without disrupting the meeting.

CuraLive operates as an intelligence layer alongside the meeting platform. It does not replace Teams/Zoom/Webex — it augments them.

---

## Architecture Overview

```
User creates Shadow Mode session
        │
        ▼
┌─────────────────────────────┐
│  Platform Detection         │
│  (Zoom/Teams/Meet/Webex     │
│   vs Chorus Call/Other)     │
└──────────┬──────────────────┘
           │
     ┌─────┴──────┐
     │             │
     ▼             ▼
┌─────────┐  ┌──────────────┐
│ Recall.ai│  │ Local Audio  │
│ Bot Mode │  │ Capture Mode │
│ (auto)   │  │ (manual)     │
└────┬─────┘  └──────┬───────┘
     │               │
     ▼               ▼
┌────────────────────────────┐
│  Real-time Transcript      │
│  → Ably WebSocket stream   │
│  → Stored in DB            │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│  Session End → Processing  │
│  1. Tagged Metrics         │
│  2. Compliance Scan        │
│  3. Sentiment Scoring      │
│  4. Full AI Report (16 mod)│
│  5. Crisis Prediction      │
│  6. Disclosure Certificate │
│  7. Valuation Impact       │
│  8. AGM Governance (if AGM)│
│  9. Archive to DB          │
└────────────────────────────┘
```

---

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `server/routers/shadowModeRouter.ts` | 989 | All server-side Shadow Mode logic |
| `client/src/pages/ShadowMode.tsx` | 3676 | Full Shadow Mode UI (sessions, live view, archive, reports, AI dashboard) |
| `drizzle/schema.ts` (shadow_sessions table) | ~25 lines | Database schema for sessions |
| `server/_core/index.ts` | Webhook endpoints | `/api/recall/webhook` for Recall.ai callbacks |

---

## Database Schema — `shadow_sessions` table

```
id                    serial PRIMARY KEY
client_name           varchar(255) NOT NULL
event_name            varchar(255) NOT NULL
event_type            varchar(64) NOT NULL
platform              varchar(64) DEFAULT 'zoom'
meeting_url           varchar(1000) NOT NULL
recall_bot_id         varchar(255) — Recall.ai bot ID (null for local capture)
ably_channel          varchar(255) — Real-time streaming channel
local_transcript_json text — Stored transcript for local capture mode
local_recording_path  varchar(1000) — Path to local recording file
status                varchar(64) DEFAULT 'pending'
transcript_segments   integer DEFAULT 0
sentiment_avg         real
compliance_flags      integer DEFAULT 0
tagged_metrics_generated integer DEFAULT 0
notes                 text
started_at            bigint (epoch ms)
ended_at              bigint (epoch ms)
created_at            timestamp DEFAULT now()
```

Session statuses: `pending` → `bot_joining` → `live` → `processing` → `completed` (or `failed`)

---

## Two Capture Modes

### 1. Recall.ai Bot Mode (Zoom, Teams, Meet, Webex)

- CuraLive deploys a Recall.ai bot that joins the meeting as a participant named "CuraLive Intelligence"
- The bot captures real-time transcript via Recall.ai's streaming API
- Transcript segments are pushed via webhook to `/api/recall/webhook`
- Webhook broadcasts segments to Ably for real-time UI updates
- Bot auto-leaves after: 10 min waiting room timeout, 5 min if nobody joins, 1 min after everyone leaves
- Requires `RECALL_AI_API_KEY` environment secret
- Has auto-retry (up to 3 attempts) if bot deployment fails

### 2. Local Audio Capture Mode (Chorus Call, Other)

- For platforms Recall.ai doesn't support (e.g., Chorus Call phone-based conferences)
- User clicks "Start Local Audio Capture" which uses browser's MediaRecorder API
- Captures audio from the browser tab (tab share)
- Audio chunks are sent to server for Whisper transcription
- Transcript segments are stored in `local_transcript_json` column
- Segments are broadcast via Ably REST API for real-time UI updates
- Component: `client/src/components/LocalAudioCapture.tsx`

---

## tRPC Router Procedures (`shadowModeRouter`)

| Procedure | Type | Purpose |
|-----------|------|---------|
| `startSession` | mutation | Creates session, deploys Recall bot or starts local capture |
| `endSession` | mutation | Stops bot, processes transcript, generates metrics + AI report |
| `listSessions` | query | Lists last 50 sessions ordered by creation date |
| `getSession` | query | Full session detail including transcript, AI report, recording URL |
| `updateStatus` | mutation | Updates session status (used by webhook callbacks) |
| `retrySession` | mutation | Retries a failed session with new bot deployment |
| `pushTranscriptSegment` | mutation | Accepts local audio capture transcript segments |
| `deleteSession` | mutation | Deletes session + associated metrics, bot records, AGM sessions, recordings |
| `deleteSessions` | mutation | Bulk delete (up to 100 sessions) |
| `createFromCalendar` | mutation | Pre-creates sessions from calendar events |
| `pipeAgmGovernance` | mutation | Pipes transcript to AGM governance AI for AGM event types |

---

## What Happens When a Session Ends

When `endSession` is called, a cascade of processing occurs:

1. **Tagged Metrics Generated** — Sentiment, engagement, compliance, and intervention metrics are inserted into `tagged_metrics` table
2. **Anonymized Intelligence Record** — Written to aggregate intelligence for cross-event analysis
3. **Full AI Report** (background, non-blocking) — 16-module report generated via OpenAI:
   - Executive Summary, Sentiment Analysis, Compliance Flags, Key Topics
   - Speaker Analysis, Investor Signals, Q&A Highlights, Action Items
   - Communication Score, Risk Factors, Financial Mentions, Sentiment Arc
   - ESG Indicators, Competitive Intelligence, Board Summary, Recommendations
4. **Archive Created** — Report stored in `archive_events` table with event_id `shadow-{sessionId}`
5. **Crisis Prediction** — Sentiment trajectory analyzed for crisis risk signals
6. **Disclosure Certificate** — Automated JSE compliance certificate generated
7. **Valuation Impact Analysis** — AI analyzes potential market impact
8. **AGM Governance** (if event type is AGM) — Governance questions triaged and regulatory compliance scanned
9. **AI Evolution Meta-Observer** — Observes the AI's own output quality for self-improvement

---

## Frontend UI Tabs (ShadowMode.tsx)

The Shadow Mode page has 8 tabs:

| Tab | Purpose |
|-----|---------|
| **Live Intelligence** | Create sessions, view live transcript stream, manage active sessions |
| **Archive Upload** | Upload historical transcripts for analysis (separate from live sessions) |
| **Reports** | View generated AI reports for completed sessions |
| **AI Learning** | AI evolution observations and self-improvement data |
| **AI Dashboard** | Full AI analytics dashboard component |
| **Advisory** | Advisory/support chat interface |
| **Diagnostics** | System diagnostics and health checks |
| **Live Q&A** | Live Q&A dashboard for active sessions |

---

## Supported Event Types (27 types)

**Core:** earnings_call, interim_results, annual_results, results_call, media_call, analyst_call, agm, capital_markets_day, ceo_town_hall, board_meeting, webcast, investor_day, roadshow, special_call

**IPO:** ipo_roadshow, ipo_listing, pre_ipo

**M&A:** manda_call, takeover_announcement, merger_announcement, scheme_of_arrangement

**Credit:** credit_rating_call, bondholder_meeting, debt_restructuring

**Activist:** proxy_contest, activist_meeting, extraordinary_general_meeting

**Other:** other

---

## Supported Platforms

| Platform | Capture Method | Recall.ai Supported |
|----------|---------------|-------------------|
| Zoom | Recall.ai bot | Yes |
| Microsoft Teams | Recall.ai bot | Yes |
| Google Meet | Recall.ai bot | Yes |
| Cisco Webex | Recall.ai bot | Yes |
| Chorus Call | Local Audio Capture | No |
| Other | Local Audio Capture | No |

---

## Webhook URL Resolution

The bot needs a webhook URL for Recall.ai to send transcript data back. Resolution order:

1. `webhookBaseUrl` passed from client (preferred)
2. `RECALL_WEBHOOK_BASE_URL` environment variable
3. `REPLIT_DEPLOYMENT_URL` (production Replit)
4. `REPLIT_DEV_DOMAIN` (development Replit)
5. `PUBLIC_URL` environment variable
6. `APP_URL` environment variable

Webhook endpoint: `{baseUrl}/api/recall/webhook`

---

## Real-time Streaming (Ably)

- Each session gets a unique Ably channel: `shadow-{sessionId}-{timestamp}`
- Transcript segments are published as `curalive` events with payload `{ type: "transcript.segment", data: segment }`
- Client subscribes via Ably Realtime SDK with token auth (`/api/ably-token`)
- Falls back to polling (3-second refetch interval on `getSession`) if Ably connection fails
- Requires `ABLY_API_KEY` environment secret for real-time streaming

---

## Environment Secrets Required

| Secret | Purpose | Required? |
|--------|---------|-----------|
| `RECALL_AI_API_KEY` | Recall.ai bot deployment | Yes (for Zoom/Teams/Meet/Webex) |
| `ABLY_API_KEY` | Real-time transcript streaming | Recommended (falls back to polling) |
| `OPENAI_API_KEY` | AI report generation | Yes (via integration) |
| `RECALL_WEBHOOK_BASE_URL` | Override webhook URL | Optional |

---

## Calendar Integration

`createFromCalendar` allows pre-creating Shadow Mode sessions from calendar events:
- Checks for duplicate calendar events by `calendarEventId`
- Creates session in `pending` status
- Stores calendar metadata in notes field
- Session activates when user manually starts it at meeting time

---

## Key Fixes Made (March 2026)

1. **Webhook URL handling** — Client now passes `webhookBaseUrl` to `startSession`, with multiple fallback options
2. **ComplianceEngine** — Fixed PostgreSQL camelCase column name quoting
3. **Timestamp comparisons** — Fixed bigint epoch millisecond comparisons
4. **Event type column** — Changed from enum to text for flexibility
5. **Local Audio Capture** — Removed webm format dependency, improved browser compatibility
6. **Auto-retry** — Bot deployment retries up to 3 times with exponential backoff
7. **Bulk operations** — Added bulk delete for session management

---

## Important Rules for Modifying Shadow Mode

1. Router is registered in BOTH `server/routers.eager.ts` AND `server/routers.ts`
2. All tRPC imports use `"../_core/trpc"` path
3. Toast notifications use `sonner` only
4. `rawSql()` auto-appends `RETURNING id` to INSERTs and translates `?` to `$1/$2`
5. `shadow_sessions` timestamps (`started_at`, `ended_at`) are bigint epoch milliseconds
6. AI reports are stored in `archive_events` with event_id format `shadow-{sessionId}`
7. Session deletion cascades to: tagged_metrics, recall_bots, agm_intelligence_sessions, local recording files
