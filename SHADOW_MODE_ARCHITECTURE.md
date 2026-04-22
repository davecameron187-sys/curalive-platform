# SHADOW MODE — TECHNICAL ARCHITECTURE
**Last Updated: April 22 2026**
**Last Commit: see latest push**

## Current State — Phase 2C Partial
Bot status fix complete. Canonical Event Model live. Segment Orchestrator live.
Intelligence Feed displaying on operator console — needs stability confirmation.

## Architecture North Star
Eight-layer AI system mapped to patent claims. See AI_ARCHITECTURE_ROADMAP.md.
Current position: Phase 2C — complete and confirm operator console stability.

## Pipeline Flow (Current)
```
Meeting URL
    ↓
Recall Bot (joins automatically — low latency streaming mode enabled)
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
Dual-write:
  1. recall_bots.transcript_json (blob — fallback)
  2. canonical_event_segments (Layer 1 — primary) ✅
    ↓
SegmentOrchestrator.processSegment() fired for every canonical segment
    ↓
Pipeline 1 — Compliance (every segment) → intelligence_feed
Pipeline 2 — Sentiment (every 5 segments) → intelligence_feed
    ↓
ShadowMode.tsx polls intelligence_feed every 3s → displays on operator console
Ably subscription → real-time transcript.warning, sentiment.update, rolling.summary
    ↓
bot.done / bot.call_ended / bot.fatal → handleBotStatusChange → runSessionClosePipeline
(duplicate guard active — Set<number> prevents concurrent execution)
    ↓
AICorePayloadMapper (reads recall_bots blob — canonical read coming Phase 1B)
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
| server/services/SegmentOrchestrator.ts | Real-time AI pipeline coordinator | ✅ Built April 22 |
| server/services/AICorePayloadMapper.ts | Builds transcript payload | ✅ Fixed |
| server/services/AICoreClient.ts | Calls Python AI Core | ✅ Working |
| client/src/pages/ShadowMode.tsx | Frontend operator console | ⚠️ Phase 2C partial |
| server/webhooks/aiAmRecall.ts | AI-AM webhook — quarantined | ⛔ Do not delete |
| drizzle/schema.ts | Drizzle ORM schema | ✅ canonical_event_segments added |
| server/_core/index.ts | Startup migrations | ✅ canonical_event_segments ensured |

## Webhook Configuration
- Endpoint: https://curalive-node.onrender.com/api/recall/webhook
- Events: bot, transcript, recording (parent categories)
- Signing secret: RECALL_AI_WEBHOOK_SECRET on Render (whsec_ prefix, base64 encoded)
- Signature header: webhook-signature
- Signing format: msgId.msgTimestamp.rawBody → HMAC-SHA256 → base64
- Secret decoding: strip whsec_ prefix, base64 decode, use as HMAC key

## Recall Bot Configuration
- Provider: recallai_streaming
- Mode: prioritize_low_latency ✅ (enables real-time transcript chunks during call)
- Diarization: use_separate_streams_when_available: true
- Realtime endpoint: webhook URL, events: ["transcript.data"]

## Watchdog System
- Tier 1: 15 seconds silence → publish transcript.warning to Ably → operator alerted ✅
- Tier 2: 90 seconds silence → bot.failover → session status recall_failed ✅
- Clears on first transcript.data arrival

## Database Tables — Key
| Table | Purpose | Status |
|-------|---------|--------|
| shadow_sessions | Session records | ✅ Active |
| recall_bots | Bot records + transcript blob | ✅ Active |
| canonical_event_segments | Layer 1 canonical transcript | ✅ Live April 22 |
| intelligence_feed | AI pipeline outputs | ✅ Active — extended April 22 |
| governance_decisions | Layer 4 gateway decisions | ⏳ Phase 2F |
| memory_graph_nodes/edges | Layer 6 memory graph | ⏳ Phase 4A |

## intelligence_feed Schema (Extended April 22)
- id, session_id, feed_type, severity, title, body, pipeline, speaker
- timestamp_in_event, acknowledged, created_at (existing)
- canonical_segment_id (new — links to canonical_event_segments)
- governance_status (new — pending/authorised/withheld)
- confidence_score (new — pipeline confidence float)

## Known Issues / Backlog
- Phase 2C — Intelligence Feed display needs stability testing
- Pipeline fires before transcript arrives — timing issue
- transcript.warning stacking in UI — needs deduplication
- transcript.done unhandled event type — low priority
- !isRecallSupported dead code — Phase 2 cleanup
- AICorePayloadMapper still reads blob — update to canonical in Phase 1B

## Render Environment Variables
| Variable | Status |
|----------|--------|
| RECALL_AI_API_KEY | ✅ Set |
| RECALL_AI_WEBHOOK_SECRET | ✅ Set |
| RECALL_WEBHOOK_BASE_URL | ✅ Set |
| AI_CORE_URL | ✅ Set |
| OPENAI_API_KEY | ✅ Set |
| ABLY_API_KEY | ✅ Set |
| DATABASE_URL | ✅ Set |
