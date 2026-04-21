# SHADOW MODE — TECHNICAL ARCHITECTURE
**Last Updated: April 21 2026**
**Last Commit: 3d0aa70**

## Current State — Phase 2 Active
ai_core_results confirmed populating on production via Recall bot path.
Session 90: 396 words, 4 AI modules complete, results persisted.
Branch consolidated to main. Render deploys from main.

## Pipeline Flow
```
Meeting URL
    ↓
Recall Bot (joins automatically)
    ↓
transcript.data webhook → server/recallWebhook.ts
    ↓
recall_bots.transcript_json (written per segment)
    ↓
endSession triggered → polling loop (5s intervals, 60s max)
    ↓
AICorePayloadMapper (reads recall_bots via recall_bot_id)
    ↓
AICoreClient → Python AI Core (curalive-platform-1)
    ↓
ai_core_results persisted to shadow_sessions
    ↓
AIReportPipeline → archive_events
    ↓
BoardIntelligenceService → historical_commitments
```

## Key Files
| File | Purpose | Status |
|------|---------|--------|
| server/services/AICorePayloadMapper.ts | Builds transcript payload | ✅ Fixed |
| server/services/SessionClosePipeline.ts | Post-session orchestrator | ✅ Working |
| server/services/AICoreClient.ts | Calls Python AI Core | ✅ Working |
| server/recallWebhook.ts | Active Shadow Mode webhook handler | ✅ Working |
| server/routers/shadowModeRouter.ts | Session start/end mutations | ✅ Working |
| client/src/pages/ShadowMode.tsx | Frontend operator console | ✅ Working |
| server/webhooks/aiAmRecall.ts | AI-AM webhook — quarantined, inert | ⛔ Do not delete |
| curalive_ai_core/ | Python AI Core service | ✅ Deployed |

## Critical Fixes Applied

### Fix — snake_case/camelCase mismatch (commit 5923e0e)
`AICorePayloadMapper` `SessionData` interface now includes both `recallBotId` and `recall_bot_id`. Guard condition checks both.

### Fix — SessionClosePipeline transcript fallback (commit 2d5d670)
`getTranscriptText` JOINs `recall_bots` and reads `recall_transcript_json` before `local_transcript_json`.

### Fix — Transcript timing polling (commit 7dc6c99)
`endSession` Recall branch polls `recall_bots.transcript_json` every 5s up to 60s before firing pipeline.

### Fix — LocalAudioCapture removed (commit b607277)
Browser audio capture removed entirely from Shadow Mode. Recall bot handles all audio.

### Fix — Session form simplified (commit 3d0aa70)
Platform selector removed. Form fields: Client Name, Event Name, Event Type, Meeting URL, Notes. `platform: "zoom"` hardcoded in mutation — always routes through Recall bot path.

### Fix — Session list UI (commit 3d0aa70)
Client name displayed above event name. Timestamps formatted (DD Mon YYYY, HH:MM). Duplicate END SESSION button removed from list row. `formatSessionTime` helper added.

### Fix — Webhook consolidation (Fix 4 — closed)
`server/webhooks/recall.ts` never existed. `server/recallWebhook.ts` is the canonical active handler. `server/webhooks/aiAmRecall.ts` is quarantined — AI-AM feature, unmounted, inert.

## Watchdog System
Located in: `server/routers/shadowModeRouter.ts`

- Starts when bot is deployed
- 90 second timer per session
- If no `transcript.data` webhook arrives → fires `bot.failover` via Ably
- Updates `shadow_sessions.status` to `recall_failed`
- Watchdog cleared when first transcript chunk arrives via `server/recallWebhook.ts`

## Database Schema — Production (Render)

### shadow_sessions — Key Columns
- `recall_bot_id` — links to recall_bots table
- `ai_core_status` — running/complete/failed
- `ai_core_job_id` — AI Core job reference
- `ai_core_results` — JSON of AI outputs
- `ai_drift_status/results` — drift detection
- `ai_profile_version/summary` — org profile
- `ai_governance_id/results` — governance record
- `report_links_sent_at` — report delivery timestamp
- `ai_pipeline_trace` — full pipeline trace JSON

### recall_bots — Key Columns
- `recall_bot_id` — UUID from Recall.ai API
- `transcript_json` — array of transcript segments
- `status` — currently all stuck at 'created' (backlog)
- `ably_channel` — real-time channel reference

## Redundancy Architecture

### Three-Tier Model
- Tier 1: Recall bot (primary, always deployed via meeting URL)
- Tier 2: Server-side transcript buffer — backlog
- Tier 3: Twilio dial-in — Phase 2 cold standby

### Failure Detection
- Watchdog: 90s no transcript → `bot.failover` event
- Bot status stuck at `created` — webhook not updating (backlog)

## AI-AM Feature — Important Note
AI-AM (AI Automated Moderator) is a separate, partially-built product feature — real-time compliance violation detection and auto-muting. tRPC routers (`aiAm`, `aiAmPhase2`) are live and mounted. Webhook handler (`server/webhooks/aiAmRecall.ts`) is unmounted and quarantined — do not delete, do not absorb into Shadow Mode. Revisit when AI-AM webhook work is prioritised.

## Render Environment Variables Required
| Variable | Purpose |
|----------|---------|
| RECALL_AI_API_KEY | Recall bot deployment |
| RECALL_WEBHOOK_BASE_URL | https://curalive-node.onrender.com |
| AI_CORE_URL | https://curalive-platform-1.onrender.com |
| OPENAI_API_KEY | Whisper + GPT-4o |
| ABLY_API_KEY | Real-time messaging |
| DATABASE_URL | PostgreSQL connection |

## Known Issues / Backlog
- Bot status stuck at 'created' — `handleBotStatusChange` not updating correctly
- Session list — history tab needs further UI consistency work
- Shadow Mode UI — inconsistent with rest of platform
- Tier 2 standby — needs proper server-side implementation
- Fix 3 — WebM — low priority
- `createScheduledSession` mutation — uses `?` placeholder instead of `$1` (PostgreSQL bug — fix separately)
- `!isRecallSupported` branch in `startSession` — dead code, safe to remove in Phase 2 cleanup

## Scaling Backlog
1. Recall.ai plan — check concurrent bot limit
2. AI Core — add workers for parallel processing
3. Render instance — upgrade when needed

## AI Redundancy Backlog
1. Get Gemini API key → add to Render → transcription fallback active
2. Multi-provider fallback in Python AI Core — Phase 2
3. Anthropic API for analysis layer — Phase 3
