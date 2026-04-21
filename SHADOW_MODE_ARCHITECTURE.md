# SHADOW MODE — TECHNICAL ARCHITECTURE
**Last Updated: April 21 2026**
**Last Commit: 9b280c5**

## Current State — Phase 1 Complete
ai_core_results confirmed populating on production via Recall bot path.
Session 90: 396 words, 4 AI modules complete, results persisted.

## Pipeline Flow
```
Meeting URL
    ↓
Recall Bot (joins automatically)
    ↓
transcript.data webhook → recallWebhook.ts
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
| server/recallWebhook.ts | Handles Recall webhooks | ✅ Working |
| server/routers/shadowModeRouter.ts | Session start/end mutations | ✅ Working |
| client/src/pages/ShadowMode.tsx | Frontend operator console | ✅ Working |
| curalive_ai_core/ | Python AI Core service | ✅ Deployed |

## Critical Fixes Applied

### Fix — snake_case/camelCase mismatch (commit 5923e0e)
`AICorePayloadMapper` `SessionData` interface now includes both `recallBotId` and `recall_bot_id`. Guard condition checks both. This was silently blocking all Recall transcript reads.

### Fix — SessionClosePipeline transcript fallback (commit 2d5d670)
`getTranscriptText` JOINs `recall_bots` and reads `recall_transcript_json` before `local_transcript_json`.

### Fix — Transcript timing polling (commit 7dc6c99)
`endSession` Recall branch polls `recall_bots.transcript_json` every 5s up to 60s before firing pipeline.

### Fix — LocalAudioCapture removed (commit b607277)
Browser audio capture removed entirely from Shadow Mode. Recall bot handles all audio.

### Fix — AI Core deployed
Python service at `https://curalive-platform-1.onrender.com`. Starter tier — no sleeping.

## Watchdog System
Located in: `server/routers/shadowModeRouter.ts`

- Starts when bot is deployed
- 90 second timer per session
- If no `transcript.data` webhook arrives → fires `bot.failover` via Ably
- Updates `shadow_sessions.status` to `recall_failed`
- Watchdog cleared when first transcript chunk arrives via `recallWebhook.ts`

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
- `status` — currently all stuck at 'created' (Fix 4 backlog)
- `ably_channel` — real-time channel reference

## Redundancy Architecture

### Three-Tier Model
- Tier 1: Recall bot (primary, always deployed via meeting URL)
- Tier 2: Server-side transcript buffer — backlog, implement server-side not frontend
- Tier 3: Twilio dial-in — Phase 2 cold standby

### Failure Detection
- Watchdog: 90s no transcript → `bot.failover` event
- Bot status stuck at `created` — webhook not updating (Fix 4 backlog)
- Health monitoring via HealthGuardianService

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
- Fix 4 — webhook consolidation — `server/webhooks/recall.ts` dead code, needs removal
- Session form — still has platform selection, needs simplification
- Session list UI — cramped, shows raw timestamp not formatted date
- Shadow Mode UI — inconsistent with rest of platform
- Tier 2 standby — needs proper server-side implementation
- Fix 3 — WebM — low priority, only for unsupported platforms

## Scaling Backlog
1. Recall.ai plan — check concurrent bot limit
2. AI Core — add workers for parallel processing
3. Render instance — upgrade when needed

## AI Redundancy Backlog
1. Get Gemini API key → add to Render → transcription fallback active
2. Multi-provider fallback in Python AI Core — Phase 2
3. Anthropic API for analysis layer — Phase 3
