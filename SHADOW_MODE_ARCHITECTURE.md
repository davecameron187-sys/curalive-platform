# CuraLive — Shadow Mode Master Architecture Document
**Branch:** shadow-mode-relaunch  
**Last Updated:** April 2026  
**Status:** Active — this is the source of truth for all Shadow Mode build decisions  
**Architects:** Claude (lead) + ChatGPT (build partner) + Replit (codebase verification)

---

## PURPOSE

This document exists so we never navigate blind again.

Every component is mapped. Every gap is named. Every fix is sequenced.
Before any code is written, check this document.
After any code is committed, update this document.

---

## THE END GOAL

Shadow Mode is a self-completing intelligence system.

An operator creates a session. A bot joins the meeting. 
Transcripts flow. Live compliance fires. The session ends automatically. 
The AI pipeline runs without human intervention. 
Intelligence is written to the database. The operator sees the output.

**No manual steps. No silent failures. No orphaned services.**

Fix 2 implements a direct trigger. This is intentional and temporary. Final architecture replaces direct calls with event emission so pipeline, analytics, and notifications all respond to the same session.completed event independently.

The nugget that drives every decision:
> eventId / shadowSessionId is not just a foreign key —
> it is the handoff that connects real-time capture to intelligence orchestration.
> Every architectural decision must preserve and strengthen this handoff.

---

## SYSTEM LAYERS — CURRENT STATE

### LAYER 1 — SESSION CREATION
| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Create session UI | `/shadow-mode` route | ✅ WORKING | Operator creates session |
| Session router | `server/routers/shadowModeRouter.ts` | ✅ WORKING | All tRPC procedures confirmed |
| DB write | `shadow_sessions` table | ✅ WORKING | 39 rows confirmed in production |

**Layer 1 verdict: No action required.**

---

### LAYER 2 — BOT DEPLOYMENT
| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Bot deployment — primary | `shadowModeRouter.ts` ~L338 | ✅ REAL API | Uses `recallFetch` — real HTTP calls to Recall.ai |
| Bot deployment — retry | `shadowModeRouter.ts` ~L685 | ✅ REAL API | Identical payload, same path |
| `recallai.ts` service | `server/_core/recallai.ts` | ✅ CLEANED | Was OCC-era mock — replaced in commit f8f9314. Not on live Shadow Mode path but cleaned for integrity |
| Webhook URL | `shadowModeRouter.ts` | ✅ CORRECT | Constructs `/api/recall/webhook` correctly |
| `metadata.shadowSessionId` | `shadowModeRouter.ts` | ✅ PRESENT | Handoff key embedded in every bot payload sent to Recall.ai |
| DB write on bot creation | `recallBots` table | ✅ WORKING | botId, meetingUrl, status written correctly |
| Bot status in production | `recallBots` | ❌ BROKEN | All 6 bots stuck at `created`. `joined_at` never written. Webhook not firing or not processing status changes |

**Layer 2 verdict: Bot deploys correctly. Status updates never return. Fix 1 addresses this.**

---

### LAYER 3 — WEBHOOK & LIVE TRANSCRIPTION
| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Primary webhook handler | `server/recallWebhook.ts` | ⚠️ INCOMPLETE | Handles events but pipeline never called on completion |
| Legacy webhook handler | `server/webhooks/recall.ts` | ❌ DEPRECATED | OCC-era. Different schema. Must not be called |
| Compliance webhook | `server/webhooks/aiAmRecall.ts` | ⚠️ VALUABLE | Per-segment live compliance detection. Logic must be preserved and consolidated into primary handler |
| `handleBotStatusChange` | `recallWebhook.ts` | ❌ INCOMPLETE | Sets `leftAt` on terminal status. Never reads `metadata.shadowSessionId`. Never calls `runSessionClosePipeline` |
| `handleTranscriptData` | `recallWebhook.ts` | ❓ UNVERIFIED | Must confirm it writes to `shadow_sessions.transcript_segments` |
| `handleRecordingDone` | `recallWebhook.ts` | ❓ UNVERIFIED | Must confirm recording URL is saved correctly |
| Transcript segments in DB | `shadow_sessions.transcript_segments` | ❌ ALL NULL | Never written in production across all 39 sessions |
| `metadata.shadowSessionId` read | `recallWebhook.ts` | ❌ MISSING | Key exists in every bot payload. Never read. This is Fix 2 |

**Layer 3 verdict: Three fixes required — Fix 1 (webhook reachability), Fix 2 (pipeline wire), Fix 3 (transcript write confirmation).**

---

### LAYER 4 — AI PIPELINE
| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Session close pipeline | `server/services/SessionClosePipeline.ts` | ✅ REAL | 583 lines. Calls compliance, drift detection, governance record, AI report. Substantial and production-ready |
| AI report pipeline | `server/services/AIReportPipeline.ts` | ✅ REAL | 519 lines. Generates 10-module intelligence report. Only called via SessionClosePipeline |
| Pipeline trigger — manual | `shadowModeRouter.ts` endSession | ⚠️ MANUAL ONLY | 3 call sites. All require operator to click end session. Silent failure if operator doesn't click |
| Pipeline trigger — automatic | `recallWebhook.ts` | ❌ MISSING | Never called on bot `done`/`call_ended`. This is Fix 2 — 4 lines of code |
| Compliance engine | `server/services/ComplianceEngineService.ts` | ✅ WIRED | 525 lines. 3 callers confirmed |
| AI Core client | `server/services/AICoreClient.ts` | ✅ WIRED | 822 lines. 4 callers confirmed |
| Unified intelligence service | `server/services/UnifiedIntelligenceService.ts` | ✅ DATA AGGREGATOR | Wraps AICoreClient. Not a trigger. Read-only |

**Layer 4 verdict: Pipeline is real and substantial. It just never fires automatically. Fix 2 is the single wire that changes everything.**

---

### LAYER 5 — AI OUTPUT STORAGE
| Table | Rows in Production | Status | Fix |
|-------|--------------------|--------|-----|
| `shadow_sessions.ai_core_results` | NULL on all 39 sessions | ❌ Never written | Resolved by Fix 2 |
| `compliance_flags` | 0 rows | ❌ Pipeline never ran | Resolved by Fix 2 |
| `governance_decisions` | 0 rows | ❌ Pipeline never ran | Resolved by Fix 2 |
| `intelligence_feed` | 0 rows | ❌ Pipeline never ran | Resolved by Fix 2 |
| `session_runtime` | 1 record, all idle | ❌ Never updated | Resolved by Fix 1 |
| `recall_bots` | 6 rows, all `created` | ❌ Status never updated | Resolved by Fix 1 |

**Layer 5 verdict: Zero AI output in production. All resolved by Fixes 1 and 2.**

---

### LAYER 6 — ORPHANED AI SERVICES
*These are real, substantial services. They are imported nowhere. They do not affect Shadow Mode.*  
*Do not touch until Shadow Mode is working end-to-end.*

| Service | Lines | Purpose |
|---------|-------|---------|
| `PredictiveEventIntelligenceService.ts` | 767 | Predictive analytics |
| `OrganizationalKnowledgeGraphService.ts` | 742 | Org knowledge graph |
| `BastionInvestorAiService.ts` | 729 | Investor intelligence |
| `HealthGuardianService.ts` | 618 | Health monitoring |
| `InvestorEngagementScoringService.ts` | 504 | Investor scoring |
| `SentimentAnalysisService.ts` | ~200 | Sentiment — orphaned |
| `TranscriptSyncService.ts` | unknown | Transcript sync — orphaned |
| `LiveQaTriageService.ts` | unknown | Q&A triage — orphaned |
| `AeosQuoteToCashService.ts` | unknown | AEOS billing — orphaned |

**These become relevant after Shadow Mode works. Not before.**

---

## THE THREE FIXES — SEQUENCED

### FIX 1 — Confirm webhook is reachable
**What:** Verify Recall.ai status webhooks are reaching `/api/recall/webhook` on Render  
**Why:** All 6 bots stuck at `created` — either bots fail to join or status events never arrive  
**How:** Live test — create session with real Zoom URL, watch Render logs for incoming webhook events  
**File:** No code change until confirmed  
**Depends on:** Nothing — first action  
**Blocks:** Fix 2 and Fix 3 depend on webhooks working  

---

### FIX 2 — Wire automatic pipeline on bot completion *(THE CRITICAL FIX)*
**What:** In `handleBotStatusChange`, read `metadata.shadowSessionId` and call `runSessionClosePipeline`  
**Why:** The handoff key is already in every bot payload. It is never read. The pipeline never fires automatically  
**How:** 4-line addition confirmed by Replit. Exact location identified  
**File:** `server/recallWebhook.ts`  
**Depends on:** Fix 1 confirmed  
**Unlocks:** Every AI output table. Compliance flags. Governance records. Intelligence reports. Everything  

Exact code (confirmed by Replit):
```typescript
if (status === "done" || status === "call_ended") {
  const shadowSessionId = payload.data.bot.metadata?.shadowSessionId;
  if (shadowSessionId) {
    const sessionId = parseInt(shadowSessionId, 10);
    if (!isNaN(sessionId)) {
      console.log(`[Recall] Bot ${recallBotId} done — firing pipeline for session ${sessionId}`);
      runSessionClosePipeline(sessionId).catch(err =>
        console.error(`[Recall] SessionClosePipeline failed for session ${sessionId}:`, err)
      );
    }
  }
}
```

**Note:** `fatal` deliberately excluded — crashed bot may have no transcript. `done` and `call_ended` are clean completion signals only.  
**Required import:** `import { runSessionClosePipeline } from "./services/SessionClosePipeline";` must be added to top of `recallWebhook.ts`  

---

### FIX 3 — Confirm transcript segments written to database
**What:** Verify `handleTranscriptData` writes incoming segments to `shadow_sessions.transcript_segments`  
**Why:** All 39 sessions show NULL transcripts. Live compliance detection has no input  
**How:** Read `handleTranscriptData` in `recallWebhook.ts` — confirm or add the DB write  
**File:** `server/recallWebhook.ts`  
**Depends on:** Fix 1 confirmed  
**Unlocks:** Live compliance detection via `aiAmRecall.ts` during active sessions  

---

## WEBHOOK CONSOLIDATION — POST FIX PRIORITY

Three webhook handlers exist simultaneously. This must be resolved after Fixes 1-3 are confirmed working.

| File | Action |
|------|--------|
| `server/recallWebhook.ts` | CANONICAL — keep, enhance |
| `server/webhooks/recall.ts` | DEPRECATE — OCC-era, wrong schema |
| `server/webhooks/aiAmRecall.ts` | ABSORB — valuable per-segment compliance logic must move into canonical handler |

---

## BUILD RULES FOR THIS BRANCH

1. **This document is updated with every commit** — status column reflects real state
2. **No fix is committed without the previous fix confirmed working**
3. **No new services are added until Fixes 1, 2, and 3 are complete**
4. **Every commit references this document** — commit messages cite the Fix number
5. **Replit reads, ChatGPT commits, Claude architects** — no role confusion
6. **The live test (Fix 1) happens before any code changes to webhook files**

---

## PROGRESS TRACKER

| Fix | Status | Commit | Date |
|-----|--------|--------|------|
| Step 1: Replace mock recallai.ts | ✅ COMPLETE | f8f9314 | Apr 2026 |
| Fix 1: Webhook reachability test | ⏳ PENDING | — | — |
| Fix 2: Pipeline wire | ✅ COMPLETE | 07f81f6 | Apr 2026 |
| Fix 3: Transcript DB write | ⏳ PENDING | — | — |
| Webhook consolidation | ⏳ PENDING | — | — |

---

*This document is the source of truth.*  
*When in doubt, come back here.*
