# CURALIVE — MASTER OPERATING BLUEPRINT
**Shadow Mode Relaunch — April 2026**
**ONE SOURCE. ONE PLAN. ONE DIRECTION.**
Read this before every session. Update after every commit.
CONFIDENTIAL — FOUNDER CONTROL DOCUMENT

---

## How To Use This Document

### BEFORE EVERY SESSION
1. Open GitHub raw URLs for all three docs
2. Paste links to Claude at start of conversation
3. Claude reads current state, you state today's objective, work begins

### AFTER EVERY SESSION
1. Claude produces updated SHADOW_MODE_ARCHITECTURE.md and CURALIVE_BRIEF.md
2. Take both to ChatGPT: "Push these to shadow-mode-relaunch branch on davecameron187-sys/curalive-platform"
3. ChatGPT commits via GitHub API
4. Both files always current, always versioned

### Tool Roles
| Tool | Role | How to Brief |
|------|------|--------------|
| Claude | Architect — diagnoses, designs, questions assumptions, decides between options | Paste GitHub raw URLs at session start |
| Replit | Codebase reader and committer — proposes solutions, executes precise instructions | Problem first, propose options, then implement |
| ChatGPT | GitHub doc updates, large file commits, architecture review | Share files + specific task only |
| Manus | Emergency DB queries only — phase out | SQL only, sparingly, max 300 credits/day |

### Tool Workflow — Permanent Process Rule
1. Problem identified
2. Brief Replit — explain the problem, ask for proposed solutions
3. Replit proposes options based on real code
4. Claude assesses options, recommends one
5. Founder decides
6. Replit implements with precise instruction from Claude
7. Founder pushes from Replit Shell

### Git Push Rule
Founder always runs git push commands from Replit Shell. Claude gives exact command. Never let Replit push autonomously.

### Replit Discipline Rule
- Replit reads and reports only unless explicitly told to write or commit
- Every action Replit takes must be instructed by Claude first
- Replit never fixes, pushes, or runs commands on its own initiative
- One instruction at a time, one file at a time
- Always give Replit instructions in this format:
  - **TASK:** one specific thing
  - **FILE:** exact file path
  - **ACTION:** read / create / edit — nothing else
  - **DO NOT:** explore, fix, commit, push, or do anything else

---

## 1. The Root Cause — Verified and Fixed April 2026

### Original Root Cause (Fixed)
`AICorePayloadMapper.ts` queried `occ_transcription_segments` to build transcript payload.
Shadow Mode NEVER writes to `occ_transcription_segments`. 0 rows.

### Additional Root Cause Found and Fixed April 21 2026
`AICorePayloadMapper` checked `session.recallBotId` but `rawSql` returns `session.recall_bot_id` in snake_case. This silently skipped the entire Recall transcript fallback for every session. Fixed by adding `recall_bot_id` to `SessionData` interface.

### The Fix
`AICorePayloadMapper.ts loadTranscriptSegments()` has three fallbacks:
1. `occ_transcription_segments` (primary — OCC compatibility)
2. `recall_bots.transcriptJson` via `shadow_sessions.recall_bot_id` (Shadow Mode primary)
3. `shadow_sessions.local_transcript_json` (final fallback)

---

## 2. Database Reality — April 21 2026

| Metric | Status |
|--------|--------|
| shadow_sessions total | 90+ |
| ai_core_results populated | ✅ Working — session 90 confirmed |
| recall_bots with transcript | ✅ Working |
| Pipeline completion | ✅ 5+ steps completing |

---

## 3. System Status

### Working
| Component | Detail | Status |
|-----------|--------|--------|
| Session creation | INSERT confirmed | ✅ WORKING |
| Session close pipeline | Fires on endSession + polling | ✅ WORKING |
| AI Core analysis | 4 modules completing | ✅ WORKING |
| Board Intelligence | Saves commitments correctly | ✅ WORKING |
| AI report generation | Completes ~20 seconds | ✅ WORKING |
| Recall bot creation | Bot created, joins meeting | ✅ WORKING |
| Webhook registration | Correct URL, accepted | ✅ WORKING |
| Transcript polling | 5s intervals, 60s max | ✅ WORKING |
| Watchdog failover | 90s silence detection | ✅ WORKING |
| ai_core_results | Populating on production | ✅ WORKING |

### Backlog / Not Started
| Component | Detail | Status |
|-----------|--------|--------|
| Fix 4 — webhook consolidation | Three handlers need merging | ⏳ BACKLOG |
| Bot status updates | All stuck at 'created' | ⏳ BACKLOG |
| Tier 2 standby buffer | Server-side implementation | ⏳ BACKLOG |
| Session form simplification | Remove platform selection | ⏳ BACKLOG |
| Shadow Mode UI consistency | Align with rest of platform | ⏳ BACKLOG |

---

## 4. Shadow Mode Architecture — Connectivity

### Core Principle
Every Shadow Mode session uses a meeting URL. Recall bot joins automatically. Platform is irrelevant — Recall handles detection.

### Session Creation Form
- Client Name
- Event Name
- Event Type
- Meeting URL
*(Platform selection to be removed — backlog)*

### Three-Tier Redundancy
| Tier | Method | Status |
|------|--------|--------|
| Tier 1 | Recall bot via meeting URL | ✅ Active |
| Tier 2 | Server-side transcript buffer (on failover) | ⏳ Backlog |
| Tier 3 | Twilio dial-in (nuclear option) | ⏳ Phase 2 |

### Watchdog
90-second server-side timer per session. If no `transcript.data` webhook arrives, fires `bot.failover` via Ably and sets session status to `recall_failed`.

---

## 5. Phase Roadmap

| Phase | Goal | Gate |
|-------|------|------|
| Phase 1 | Runtime chain end to end | ✅ COMPLETE — ai_core_results populating |
| Phase 2 | Live operator experience | Operator can run session without manual steps |
| Phase 3 | AGM Intelligence — Bastion/Lumi | Compliance officer can act on output |
| Phase 3.5 | Output layer correction — Delta engine | Lead user says: I would feel uncomfortable running my next event without this |
| Phase 4 | Personal Intelligence Profiles | Role-aware memory active per user |
| Phase 5 | Predictive Communication Intelligence | System predicts communication risk before it surfaces |

### Phase 2 Priority Order
1. Fix 4 — webhook consolidation
2. Session form simplification — remove platform selection
3. Session list UI redesign
4. Shadow Mode UI consistency with rest of platform
5. Tier 2 standby buffer — server-side implementation
6. Bot status update fix

### Phase 3 — AGM Intelligence (Bastion / Lumi target)
- AgmGovernanceAiService.ts
- InvestorEngagementScoringService.ts
- InvestorIntentionDecoderService.ts
- CrossEventConsistencyService.ts
- MaterialityRiskOracleService.ts

---

## 6. Render Services

| Service | Purpose | Branch | Tier |
|---------|---------|--------|------|
| curalive-node | Main Node.js service | RenderMigration | Paid |
| curalive-platform-1 | Python AI Core | RenderMigration | Starter ($7/mo) |
| curalive-staging-db | PostgreSQL production | — | — |

**AI Core URL:** `https://curalive-platform-1.onrender.com`

---

## 7. Branch Discipline

| Branch | Purpose | Rule |
|--------|---------|------|
| main | Single source of truth — active development and live on Render | All work here |
| shadow-mode-relaunch | Retired — do not use | — |
| RenderMigration | Retired — do not use | — |
| replit-agent | Replit workspace | Do not merge anywhere |

**Push command after every commit:**
```bash
git push github HEAD:main && echo "===DONE==="
```

---

## 8. AI Services Classification

### Core Runtime — Phase 1 (Complete)
- SessionClosePipeline.ts ✅
- AICorePayloadMapper.ts ✅
- AICoreClient.ts ✅
- AIReportPipeline.ts ✅
- BoardIntelligenceService.ts ✅
- ComplianceDeadlineService.ts ✅
- ClientDeliveryService.ts ✅

### Phase 2 — Live Operator Experience
- ComplianceEngineService.ts
- SentimentAnalysisService.ts
- LiveQaTriageService.ts
- LiveRollingSummaryService.ts
- EvasiveAnswerDetectionService.ts
- ShadowModeGuardianService.ts
- PreEventBriefingService.ts

### Phase 3 — AGM Intelligence
- AgmGovernanceAiService.ts
- InvestorEngagementScoringService.ts
- InvestorIntentionDecoderService.ts
- CrossEventConsistencyService.ts
- MaterialityRiskOracleService.ts
- IpoMandAIntelligenceService.ts
- ComplianceModerator.ts

### DO NOT TOUCH
LanguageDubber, PodcastConverterService, VirtualStudioService, SustainabilityOptimizer, VolatilitySimulatorService, LumiBookingService, BastionBookingService — not Shadow Mode. voiceTranscription.ts — confirmed dead code.

---

## 9. Founder Control View — Current State

| Question | Answer |
|----------|--------|
| Active phase | Phase 3.5 — Output layer correction |
| Bug fixed this session | rawSql type mismatch on shadow_sessions JOINs |
| Last confirmed commit | eabc669 |
| Success condition | One fresh Render session with ai_core_results populated ✅ MET |
| Next customer milestone | Lead user says: I would feel uncomfortable running my next event without this |
| Do not touch | Webcast, Video, Dashboard, 60+ dormant services |

---

## 10. AI Redundancy Backlog

1. Get Gemini API key → add to Render → transcription fallback active (Gemini already wired in code)
2. Multi-provider fallback in Python AI Core — Phase 2
3. Anthropic API for analysis layer — Phase 3

## 11. Scaling Backlog
1. Recall.ai plan — check concurrent bot limit
2. AI Core — add workers for parallel processing
3. Render instance — upgrade when needed

---

## 12. GitHub Document Update Process

At end of every session:
1. Claude produces updated `SHADOW_MODE_ARCHITECTURE.md` and `CURALIVE_BRIEF.md`
2. Take to ChatGPT: "Push these files to branch `shadow-mode-relaunch` on `davecameron187-sys/curalive-platform`"
3. ChatGPT commits via GitHub API
4. Next session reads fresh context from GitHub raw URLs

**Raw URLs:**
- Master Blueprint: `https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/shadow-mode-relaunch/MASTER_BLUEPRINT.md`
- Architecture: `https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/shadow-mode-relaunch/SHADOW_MODE_ARCHITECTURE.md`
- Brief: `https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/shadow-mode-relaunch/CURALIVE_BRIEF.md`

---
## 13. CRITICAL — Markdown Corruption Rule (Non-Negotiable)

This chat interface automatically converts dotted identifiers into hyperlinks
before they reach the shell. This has caused hours of lost work.

Corrupted examples:
- s.id becomes [s.id](http://s.id)
- m.org_id becomes [m.org](http://m.org)_id
- f.id, ca.target_id, and any dotted SQL identifier are affected

The rule — never pass SQL containing dotted identifiers through the chat
interface as a shell command. It will always arrive corrupted.

The only safe approach for SQL fixes:
Write a Node.js or Python script file. Present it for download. User saves
it to Replit. User runs it. The script constructs corrupted strings
programmatically using concatenation so no chat interface can corrupt them.

Example safe construction:
'ON s' + '.id ='

This rule applies to every SQL fix for the rest of this project.
