# SHADOW MODE — TECHNICAL ARCHITECTURE
**Last Updated: April 22 2026**
**Last Commit: 6609cfa**

## Current State — Phase 0A Starting
Bot status fix complete. Webhook system fully operational for first time.
Canonical Event Model build starts next session.

## Architecture North Star
Eight-layer AI system mapped to patent claims. See AI_ARCHITECTURE_ROADMAP.md.
Current position: Phase 0A — Bot Health Heartbeat.

## Pipeline Flow (Current)
```
Meeting URL
    ↓
Recall Bot (joins automatically)
    ↓
Webhook events → server/recallWebhook.ts
(signature: webhook-signature header, whsec_ prefix stripped, base64 decoded, msgId.msgTimestamp.body signed)
    ↓
bot.joining_call / bot.in_call_not_recording / bot.in_call_recording → handleBotStatusChange
    ↓
recall_bots.status updated correctly ✅
    ↓
transcript.data → handleTranscriptData
    ↓
recall_bots.transcript_json (JSON blob — temporary until Layer 1)
    ↓
bot.done / bot.call_ended / bot.fatal → handleBotStatusChange → runSessionClosePipeline
(duplicate guard active — Set<number> prevents concurrent execution)
    ↓
AICorePayloadMapper (reads recall_bots via recall_bot_id — both camelCase and snake_case)
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
| server/recallWebhook.ts | Canonical webhook handler | ✅ Fixed April 22 |
| server/services/SessionClosePipeline.ts | Post-session orchestrator | ✅ Fixed April 22 |
| server/services/AICorePayloadMapper.ts | Builds transcript payload | ✅ Fixed |
| server/services/AICoreClient.ts | Calls Python AI Core | ✅ Working |
| client/src/pages/ShadowMode.tsx | Frontend operator console | ⚠️ Shell only — Layer 3 |
| server/webhooks/aiAmRecall.ts | AI-AM webhook — quarantined | ⛔ Do not delete |

## Webhook Configuration — CRITICAL
- Endpoint registered: Recall dashboard → https://curalive-node.onrender.com/api/recall/webhook
- Events subscribed: bot, transcript, recording (parent categories)
- Signing secret: stored as RECALL_AI_WEBHOOK_SECRET on Render (whsec_ prefix, base64 encoded)
- Signature header: webhook-signature
- Signing format: msgId.msgTimestamp.rawBody → HMAC-SHA256 → base64
- Secret decoding: strip whsec_ prefix, base64 decode, use as HMAC key

## Fixes Applied This Session — April 22 2026

### Fix — Switch event names (commit 6609cfa)
`bot.status_change` never exists in Recall. Replaced with 7 discrete cases:
`bot.joining_call`, `bot.in_waiting_room`, `bot.in_call_not_recording`,
`bot.in_call_recording`, `bot.call_ended`, `bot.done`, `bot.fatal`

### Fix — Webhook signature verification (commit 6609cfa)
Four compounding failures fixed:
1. Header: `x-recall-signature` → `webhook-signature`
2. Signing input: rawBody → `${msgId}.${msgTimestamp}.${rawBody}`
3. Secret decoding: strip `whsec_` prefix, base64 decode before use as HMAC key
4. Comparison: `sha256=<hex>` → `v1,<base64>` format

### Fix — Duplicate pipeline guard (commit 6609cfa)
`const pipelineRunning = new Set<number>()` added to SessionClosePipeline.
`finally` block guarantees cleanup on error or normal exit.

### Fix — handleRecordingDone payload (commit 6609cfa)
Was reading `payload.bot` — Recall sends `payload.data.bot`.
Fixed to `payload.data.bot` and `payload.data.data.recording_url`.

### Fix — AICorePayloadMapper debug log (commit 6609cfa)
`recallBotId on session` now logs `session.recallBotId ?? session.recall_bot_id`
instead of always logging `undefined`.

## Known Issues / Backlog
- Pipeline fires before transcript arrives — timing issue, fix Phase 1A
- `createScheduledSession` PostgreSQL `?` placeholder — fix Phase 1B
- `!isRecallSupported` dead code — Phase 2 cleanup
- Transcript blob → canonical migration — Phase 1A
- Operator console real-time — Layer 3
- Ably token endpoint — Layer 3 prerequisite

## Render Environment Variables — Required
| Variable | Purpose | Status |
|----------|---------|--------|
| RECALL_AI_API_KEY | Recall bot deployment | ✅ Set |
| RECALL_AI_WEBHOOK_SECRET | Webhook HMAC verification | ✅ Set |
| RECALL_WEBHOOK_BASE_URL | https://curalive-node.onrender.com | ✅ Set |
| AI_CORE_URL | https://curalive-platform-1.onrender.com | ✅ Set |
| OPENAI_API_KEY | Whisper + GPT-4o | ✅ Set |
| ABLY_API_KEY | Real-time messaging | ✅ Set |
| DATABASE_URL | PostgreSQL connection | ✅ Set |

## AI Architecture
Full eight-layer roadmap in AI_ARCHITECTURE_ROADMAP.md.
Phase gate rule enforced by Claude — no phase starts without previous gate confirmed.
