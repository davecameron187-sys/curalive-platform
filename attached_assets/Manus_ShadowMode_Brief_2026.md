# CuraLive Shadow Mode — Manus Alignment Brief
**For:** Manus AI  
**From:** CuraLive Engineering (Replit)  
**Date:** March 2026  
**Purpose:** Ensure full alignment on what Shadow Mode is, what has been built, and what the development priorities are going forward.

---

## What Shadow Mode Is

Shadow Mode is a live intelligence collection feature built inside the CuraLive platform. It allows an operator to silently deploy an AI bot into any Zoom, Teams, Google Meet, or Webex meeting. The bot joins as a named participant ("CuraLive Intelligence"), transcribes the entire event in real time, scores investor sentiment automatically, detects compliance keyword risks, and stores all findings in the CuraLive database — without any visible change to the client's event.

This feature was designed specifically for Bastion Group's existing webcast operations. Bastion Group manages audio and video webcasting for corporate clients (investor earnings calls, AGMs, capital markets days, CEO town halls). Shadow Mode allows CuraLive to run invisibly on every Bastion event, building a proprietary intelligence dataset from real live events.

---

## What Has Already Been Built (Do Not Rebuild)

The following is fully live and production-ready in the Replit environment:

### Infrastructure Already in Place
- **Recall.ai bot deployment** — `recallRouter.ts` handles deploying, monitoring, and stopping meeting bots. The `RECALL_AI_API_KEY` is already configured in environment secrets.
- **Real-time transcription** — `recallWebhook.ts` receives transcript chunks from Recall.ai, appends them to the database, and publishes them via Ably in real time.
- **Sentiment scoring** — `scoreSentiment()` runs automatically every 5 transcript segments via `aiAnalysis.ts`.
- **Rolling summary** — `generateRollingSummary()` runs every 10 segments.
- **Ably real-time channels** — live data streams to the frontend automatically.
- **`recall_bots` database table** — stores all bot records.

### Shadow Mode Layer (Newly Built)
- **`shadow_sessions` database table** — stores each Bastion Group event session: client name, event name, type, platform, meeting URL, bot ID, status, transcript segment count, sentiment average, compliance flags, metrics generated.
- **`shadowModeRouter.ts`** — tRPC procedures: `startSession`, `endSession`, `listSessions`, `getSession`, `updateStatus`.
- **`ShadowMode.tsx`** — full operator-facing UI at `/shadow-mode`: session form, live transcript feed, status monitoring, end session with auto-generation of tagged metrics.
- **`tagged_metrics` database table** — receives 4 structured intelligence records at the end of every shadow session: sentiment tag, engagement tag, compliance tag, intervention tag.
- **Tagged Metrics Dashboard** at `/tagged-metrics` — queryable view of all stored intelligence records across all events.

---

## How It Works End to End

1. Bastion Group operator opens `/shadow-mode` in CuraLive
2. Clicks **New Session**, fills in: client name, event name, event type, platform, meeting URL
3. Clicks **Start Shadow Intelligence** — `shadowModeRouter.startSession` deploys a Recall.ai bot to the meeting URL
4. Bot joins as "CuraLive Intelligence" within 30–60 seconds
5. `recallWebhook.ts` receives real-time transcript chunks → stores in `recall_bots.transcriptJson` → publishes to Ably → displayed on session screen
6. Every 5 segments, `scoreSentiment()` scores the last 5 segments and publishes a sentiment update
7. Operator clicks **End Session** → `shadowModeRouter.endSession` runs:
   - Stops the Recall.ai bot
   - Reads full transcript from `recall_bots`
   - Scores sentiment, scans for compliance keywords, calculates engagement
   - Inserts 4 tagged metric records into `tagged_metrics`
   - Updates `shadow_sessions` status to "completed"
8. Operator checks `/tagged-metrics` to verify records were created

---

## Database Tables (MySQL via Drizzle ORM)

```
shadow_sessions
  id, client_name, event_name, event_type, platform, meeting_url,
  recall_bot_id, ably_channel, status, transcript_segments,
  sentiment_avg, compliance_flags, tagged_metrics_generated,
  notes, started_at, ended_at, created_at

tagged_metrics
  id, event_id, event_title, tag_type, metric_value, label,
  detail, bundle, severity, source, created_at

recall_bots (existing)
  recall_bot_id, meeting_url, bot_name, event_id, meeting_id,
  status, ably_channel, transcript_json, summary, recording_url,
  joined_at, left_at
```

---

## What Manus Should NOT Do

- **Do not rebuild the Recall.ai bot deployment.** It is fully working.
- **Do not create a new transcription service.** `recallWebhook.ts` handles this.
- **Do not create new database tables** for this feature without first checking `drizzle/schema.ts`.
- **Do not modify `recallRouter.ts` or `recallWebhook.ts`** — these serve multiple features and changes will break other parts of the platform.
- **Do not reference Nuance, Peer5, or VideoSurf** as these are third-party platforms owned by competitors (Microsoft, Akamai) and are not appropriate positioning for CuraLive.

---

## What Manus Can Help With

### Immediate Priority
- **Customer-facing proposal template** — A branded one-page document Bastion Group can send to clients before activating Shadow Mode, explaining the service in plain language.
- **Post-event intelligence report template** — A formatted PDF-style report layout showing how a completed shadow session's findings would be presented to a client (sentiment chart, compliance summary, transcript highlights, engagement score).

### Next Development Phase (Bring Ideas, Replit Will Build)
- **Automated post-event email** — After a shadow session ends, auto-send a formatted intelligence summary to the client's IR contact.
- **Investor Persona Profiles** — After 5+ events per client, aggregate their sentiment patterns, compliance history, and engagement scores into a per-client profile card.
- **Predictive Pre-Event Scoring** — Before a session starts, the system predicts expected sentiment range and compliance risk based on historical data for that client and event type.

---

## Architecture Rules (Always Apply)

- **Database:** MySQL via Drizzle ORM. Always use `int("id").autoincrement().primaryKey()` — never `serial()`.
- **Toast notifications:** `sonner` library only — `toast.success("msg")` / `toast.error("msg")`.
- **LLM calls:** `invokeLLM()` from `server/_core/llm.ts` — never call OpenAI directly.
- **Back navigation:** `useSmartBack(defaultPath)` from `@/lib/useSmartBack`.
- **No mocked data in production** — all features must connect to real database queries.

---

## Platform URLs (Current Development Environment)

| Page | URL |
|---|---|
| Operator Platform Links | `/operator-links` |
| Shadow Mode | `/shadow-mode` |
| Tagged Metrics Dashboard | `/tagged-metrics` |
| Agentic Event Brain | `/agentic-brain` |
| Autonomous Intervention Engine | `/autonomous-intervention` |
| Operator Console (OCC) | `/occ` |

---

## Branch Structure on GitHub

| Branch | Purpose |
|---|---|
| `main` | All platform development — features, UI, database, routers |
| `patent-ip-strategy` | Patent brief documents, IP strategy, CIPC filing preparation. No code. |
| `manus-demo` | Demo-specific content for investor/acquisition presentations |

**Important:** Patent and IP strategy documents belong on `patent-ip-strategy` branch only. Keep them separate from platform development on `main`.

---

*Brief prepared by: CuraLive Engineering (Replit) | March 2026*  
*For questions about what is already built, check `drizzle/schema.ts`, `server/routers.ts`, and the relevant router files before proposing new structures.*
