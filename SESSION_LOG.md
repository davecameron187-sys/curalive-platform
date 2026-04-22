# CURALIVE — SESSION LOG
**Last Updated: April 22 2026**
**Last Commit: 6609cfa on main**

---

## SESSION: April 22 2026 — COMPLETE

### What Was Accomplished

1. **Render verification** — Both services confirmed green on `main` before any work started.

2. **Recall webhook endpoint registered** — First time ever. URL: `https://curalive-node.onrender.com/api/recall/webhook`. Events subscribed: `bot`, `transcript`, `recording`.

3. **Bot status fix — COMPLETE (100%)** — Four compounding root causes identified and fixed:
   - Wrong event names in switch (`bot.status_change` never exists — replaced with 7 discrete event cases)
   - Wrong header name (`x-recall-signature` → `webhook-signature`)
   - Wrong signing input (raw body only → `msgId.msgTimestamp.body`)
   - Wrong secret format (`whsec_` prefix not stripped, secret not base64-decoded)
   - All four were present simultaneously. System was rejecting every webhook event since launch.

4. **Duplicate pipeline execution fixed** — In-memory `Set` guard added to `SessionClosePipeline`. Concurrent calls for same session dropped immediately.

5. **`handleRecordingDone` payload shape fixed** — Was reading `payload.bot` but Recall sends `payload.data.bot`. Fixed.

6. **Misleading debug log fixed** — `AICorePayloadMapper` now logs actual bot ID value instead of always logging `undefined`.

7. **AI Services Classification complete** — Full inventory of 67 services across five boxes produced.

8. **Patent reviewed** — SA Provisional 1773575338868, 54 claims, 12 figures read in full.

9. **AI Architecture Roadmap v2 produced** — Eight-layer architecture mapped against patent claims. Three independent reviews incorporated. Pushed to `AI_ARCHITECTURE_ROADMAP.md` on main.

### Confirmed Working After Today
- Bot status progressing: `joining_call → in_call_not_recording → in_call_recording → done`
- Webhook signature verification passing
- Pipeline firing once per session (duplicate guard active)
- `recallBotId` logging actual UUID
- `handleRecordingDone` processing without crash

### Decisions Made
- Canonical Event Model is Layer 1 — build before any AI service wiring
- Layer 0 (Connectivity) added to roadmap — was missing from v1
- Real-Time Orchestration Engine added as Layer 2A
- Flash Report (5 min post-session) added to Phase 3E
- HITL verification added to Layer 3 for HIGH severity compliance flags
- Ably token endpoint required before Layer 3 frontend work
- `speaker_id` nullable in Layer 1 canonical schema — Identity Fusion populates later
- Blob fallback in `AICorePayloadMapper` stays until 10 consecutive sessions confirmed on canonical data

### Open Issues (Logged — Not Forgotten)
- Pipeline fires before transcript arrives — timing issue, fix in Phase 1A
- `createScheduledSession` PostgreSQL `?` placeholder — fix in Phase 1C
- `!isRecallSupported` dead code in `startSession` — Phase 2 cleanup
- AI-AM tRPC routers live but webhook ingest dead — by design, revisit when AI-AM prioritised
- `transcript.done` unhandled event type — log only, not blocking

---

## SESSION: April 23 2026 — OBJECTIVES

### MANDATORY SESSION OPENER
Before any work starts, Claude must:
1. Read all five files from GitHub raw URLs
2. Confirm last commit, last completed phase, and what phase we are starting today
3. State the gate condition that must be met before this session closes
4. Do not start any work until founder confirms

### PHASE GATE RULE — NON-NEGOTIABLE
No phase may be started until the gate condition of the previous phase is confirmed met and logged in SESSION_LOG.md. No exceptions. Claude is responsible for enforcing this.

### Tomorrow's Phase — Phase 0A + Phase 1A

**Phase 0A — Bot Health Heartbeat (first task)**
Upgrade watchdog from single-tier 90s to two-tier:
- 15 seconds silence → publish `transcript.warning` to operator Ably channel
- 90 seconds silence → existing failover logic unchanged
Gate: Operator console receives warning within 15s of transcript gap in test session.

**Phase 1A — Canonical Event Model**
Step 1 — Brief Replit to read current `handleTranscriptData` segment structure — report only
Step 2 — Write `canonical_event_segments` migration
Step 3 — Update `handleTranscriptData` to dual-write: canonical rows AND existing blob (migration safety)
Step 4 — Confirm 10 consecutive sessions produce clean canonical rows
Step 5 — Update `AICorePayloadMapper` to read from canonical table
Step 6 — Confirm pipeline completes using canonical data
Gate: 10 consecutive sessions produce clean canonical rows. Pipeline completes from canonical data. Confirmed in logs.

**Phase 1B — Fix `createScheduledSession` PostgreSQL bug**
One-line fix. Do not skip.
Gate: Mutation executes without crash.

### Session Close Process — MANDATORY
At end of every session:
1. Claude produces updated SESSION_LOG.md, SHADOW_MODE_ARCHITECTURE.md, CURALIVE_BRIEF.md
2. Replit overwrites all three files and pushes to main in one commit
3. Next session reads fresh context from GitHub raw URLs
4. Claude confirms push was successful before session closes

---

## Phase 2 Priority Order (Full — Updated April 22)
See AI_ARCHITECTURE_ROADMAP.md for complete phase plan.

Current position: Phase 0A next.

| Phase | Status |
|-------|--------|
| Fix 4 — webhook consolidation | ✅ DONE |
| Session form simplification | ✅ DONE |
| Session list UI | ✅ DONE |
| Bot status fix | ✅ DONE April 22 |
| Phase 0A — Bot health heartbeat | ✅ DONE April 22 |
| Phase 1A — Canonical Event Model | ⏳ NEXT |
| Phase 1B — createScheduledSession bug | ⏳ Phase 1A session |

---

## Raw URLs For Session Opener
Master Blueprint: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/MASTER_BLUEPRINT.md
Session Brief: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/CURALIVE_BRIEF.md
Technical Architecture: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SHADOW_MODE_ARCHITECTURE.md
Session Log: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SESSION_LOG.md
AI Services Brief: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/AI_ARCHITECTURE_ROADMAP.md
