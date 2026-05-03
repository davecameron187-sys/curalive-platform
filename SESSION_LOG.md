# CURALIVE — SESSION LOG
**Last Updated: April 22 2026**
**Last Commit: see latest push**

---

## SESSION: April 22 2026 — COMPLETE

### What Was Accomplished

1. **Render verification** — Both services confirmed green on `main`.

2. **Recall webhook endpoint registered** — First time ever. URL: `https://curalive-node.onrender.com/api/recall/webhook`. Events: bot, transcript, recording.

3. **Bot status fix — COMPLETE (100%)** — Four compounding root causes fixed:
   - Wrong event names in switch (`bot.status_change` → 7 discrete cases)
   - Wrong header name (`x-recall-signature` → `webhook-signature`)
   - Wrong signing input (rawBody → `msgId.msgTimestamp.body`)
   - Wrong secret format (`whsec_` prefix not stripped, secret not base64-decoded)

4. **Duplicate pipeline execution fixed** — In-memory Set guard added to SessionClosePipeline.

5. **handleRecordingDone payload shape fixed** — Payload path corrected.

6. **AI Architecture Roadmap v2 produced** — Eight-layer architecture mapped against patent claims. Pushed to `AI_ARCHITECTURE_ROADMAP.md` on main.

7. **Phase 0A — COMPLETE** — Two-tier watchdog: 15s operator warning + 90s failover. Gate condition met.

8. **Phase 1A — COMPLETE** — `canonical_event_segments` table live. Dual-write confirmed across 11 consecutive sessions. Gate condition met.

9. **Phase 1B — COMPLETE** — MySQL `?` placeholder bugs fixed in shadowModeRouter.ts.

10. **Phase 2A — COMPLETE** — SegmentOrchestrator built and wired. Compliance signal confirmed in intelligence_feed.

11. **Phase 2B — COMPLETE** — Recall bot configured for low-latency real-time streaming. Compliance and sentiment pipelines firing and writing to intelligence_feed.

12. **Phase 2C — PARTIALLY COMPLETE** — Ably subscription added to ShadowMode.tsx. Intelligence feed polling fixed (snake_case → camelCase mapping, session_id format fix). Sentiment displayed once on screen. Needs further testing to confirm stability.

### Decisions Made
- Canonical Event Model is Layer 1 — built and confirmed
- Recall bot `prioritize_low_latency` mode enabled — real-time segments now streaming
- `intelligence_feed` schema extended: `canonical_segment_id`, `governance_status`, `confidence_score`
- Ably auth uses `authUrl` not static token
- Phase 2C needs retesting next session before marking complete

### Open Issues
- Phase 2C — Intelligence Feed display needs stability testing
- Pipeline fires before transcript arrives — timing issue, fix in future session
- `!isRecallSupported` dead code — Phase 2 cleanup
- AI-AM tRPC routers live but webhook ingest dead — by design
- `transcript.done` unhandled event type — low priority
- `transcript.warning` stacking in UI — needs deduplication
- Remove Phase 2C debug log before Phase 2C marked complete

---

## SESSION: April 23 2026 — OBJECTIVES

### MANDATORY SESSION OPENER
Before any work starts, Claude must:
1. Read all five files from GitHub raw URLs
2. Confirm last commit, current phase, gate condition
3. Do not start any work until founder confirms

### PHASE GATE RULE — NON-NEGOTIABLE
No phase may be started until the gate condition of the previous phase is confirmed met and logged in SESSION_LOG.md. Claude enforces this. No exceptions.

### First Task — Complete Phase 2C
Phase 2C gate condition: Operator sees live compliance alerts AND sentiment on screen consistently during a session. Not once — consistently.

Steps to complete Phase 2C:
1. Remove debug log added today (`console.log("[Feed] Poll response:..."`
2. Run 3 consecutive test sessions with earnings paragraph
3. Confirm intelligence feed items appear reliably on screen each time
4. If watchdog warning stacks — add deduplication
5. Gate confirmed → log Phase 2C complete → move to Phase 2E (full operator console)

### Phase 2E — Full Operator Console
After Phase 2C confirmed:
- Bot status indicator live
- Live transcript feed panel
- Speaker scorecards panel
- PSIL status updating from compliance pipeline
- Answer-risk panel placeholder

---

## Phase Status

| Phase | Status |
|-------|--------|
| Fix 4 — webhook consolidation | ✅ DONE |
| Session form simplification | ✅ DONE |
| Session list UI | ✅ DONE |
| Bot status fix | ✅ DONE April 22 |
| Phase 0A — Bot health heartbeat | ✅ DONE April 22 |
| Phase 1A — Canonical Event Model | ✅ DONE April 22 |
| Phase 1B — SQL placeholder bug | ✅ DONE April 22 |
| Phase 2A — Segment Orchestrator | ✅ DONE April 22 |
| Phase 2B — Pipelines 1-2 live | ✅ DONE April 22 |
| Phase 2C — Operator console live | ✅ DONE April 23 |
| Phase 2E — Full operator console | ✅ DONE April 23 |
| Phase 2F — Governance Gateway | ✅ DONE April 23 |
| Phase 2G — All pipelines governed | ✅ DONE April 23 |

---

## SESSION: April 23 2026 — Phase 2G COMPLETE

### Last Known Good Commit: 4fa92c9

### What Was Confirmed
1. governance_decisions table — 28 rows writing correctly
2. Chain hash audit trail — verified unbroken across all rows
3. Each row's previous_hash matches prior row's chain_hash exactly
4. Genesis anchor confirmed as chain starting point
5. Gateway correctly classifying — 20 authorised, 8 pending_review
6. decided_at timestamps present and sequential
7. DeterministicGovernanceGateway.ts — no changes made, working as built

### Gate Condition — MET ✅
- governance_decisions populating correctly ✅
- Chain hash audit trail tamper-evident and complete ✅
- Full governance flow confirmed: pipeline → gateway → decision ✅

### Database State at Close
- governance_decisions rows: 28
- authorised: 20
- pending_review: 8
- withheld: 0
- Schema: all columns confirmed present including chain_hash, previous_hash, decided_at

### Nothing Was Changed Today
- No code was modified
- No schema was altered
- Verification only session — confirmed what was built in Phase 2F is working correctly

### Next Phase: 2H — To Be Defined

---

## SESSION: April 24 2026 — Phase 2H COMPLETE

### Last Known Good Commit: 405d49e

### What Was Built
1. Task 1 — Overload signalling: sentiment pipeline now writes to intelligence_feed when dropped
2. Task 2 — Pipeline priority tiers and global LLM concurrency limit (MAX_GLOBAL_LLM_CALLS = 20)
3. Task 3 — Degradation order enforced: P0 never drops, P1 drops with signal, P2 drops with signal
4. Task 4 — Fail-safe confirmed: all overload writers have .catch handlers
5. Task 5 — NERVOUS_SYSTEM_SPEC.md Section 4 marked as implemented

### Gate Condition — MET ✅
- Pipeline prioritisation logic active ✅
- Degradation modes defined ✅
- Fail-safe output rules implemented ✅
- NERVOUS_SYSTEM_SPEC.md updated ✅

### Next Phase: Phase 3 — Customer Dashboard

---

## Raw URLs For Session Opener
Master Blueprint: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/MASTER_BLUEPRINT.md
Session Brief: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/CURALIVE_BRIEF.md
Technical Architecture: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SHADOW_MODE_ARCHITECTURE.md
Session Log: https://raw.githubusercontent.com/davecameron187-sys/curalive-platform/main/SESSION_LOG.md
AI Architecture Roadmap: https://raw.githubusercontent.com/davecameron187-sys/curalive-p
---

## SESSION: April 24 2026 — Phase 3 Task 1 COMPLETE
### Last Known Good Commit: 07336d9
### What Was Built
1. orgId column added to users table
2. customer_actions table created and live
3. customerDashboardRouter built with 4 procedures — tenant isolation active
4. Premium customer dashboard UI live — Live Events tab functional
5. Tab shell with 5 tabs — Coming Next placeholders for inactive tabs
6. 147 existing sessions updated to org_id = 1
### Gate Conditions Progress
- Customer dashboard UI live ✅
- customer_actions table live ✅
- Tenant isolation active ✅
- Personal Intelligence Profiles ⬜
- Regulatory reconstruction query ⬜
### Next Session
- Add real-time Ably subscription to customer dashboard
- Enforce customer role on dashboard route
- Build Personal Intelligence Profiles

---

## PHASE 3 ALIGNMENT BRIEF — April 24 2026
### From: ChatGPT (Architecture) → Claude (Chief Architect)
### Purpose: Correct execution sequence + enforce system validation priorities

### CORE PRINCIPLE
CuraLive is NOT a reporting tool. CuraLive is a REAL-TIME intelligence system.

### UPDATED PRIORITY ORDER (MANDATORY)
1. Real-time Ably integration (customer dashboard)
2. End-to-end live validation
3. Customer role enforcement
4. Profile foundation (NOT full profiles)

### TASK 1 — REAL-TIME ABLY INTEGRATION
- Subscribe to existing Ably channel used by operator console
- When new intelligence_feed event published: append to feed, reflect instantly
- NO manual refresh
- Success: user feels the system is alive and reacting in real time

### TASK 2 — LIVE SYSTEM VALIDATION (NON-NEGOTIABLE)
Prove this full flow for ONE live session:
Transcript → Canonical Segment → Pipeline → Intelligence Feed → Customer Dashboard → Customer Action → Database
- Feed item appears live, no refresh needed
- Action button works, row written to customer_actions
- If ANY step fails → STOP and fix

### TASK 3 — CUSTOMER ROLE ENFORCEMENT
- Only role = customer can access /customer/dashboard
- Operators must NOT use customer dashboard
- Maintain org_id filtering

### TASK 4 — PROFILE FOUNDATION (NOT FULL BUILD)
- User role awareness in UI
- Profile tab placeholder
- Future hook for personalisation only
- DO NOT build behavioural tracking, prediction logic, or full profile system

### SYSTEM RISK
Silent failure between: transcript → pipeline → feed → UI
Every stage must be observable, verifiable, consistent.

### SUCCESS CONDITION
Phase 3 is complete when:
- Live session runs
- Intelligence appears in real time
- Customer can act on it
- Data persists correctly

### PRODUCT TRUTH
Operator dashboard = runs the system
Customer dashboard = proves the system

## Session: April 25 2026
### Objective: Phase 3 Task 2 — Real-Time Ably Integration

### Completed
- Created IntelligenceFeedPublisher.ts — publishes to Ably after governance decision
- Wired DeterministicGovernanceGateway to call publishFeedItem after audit trail
- Added ably_channel to customerDashboardRouter getSessions query
- Fixed intelligence_feed JOIN — now uses shadow-{id} format correctly
- Fixed session identifier — frontend now uses shadow-{id} consistently
- Added /api/ably-token-string endpoint returning real token string
- Fixed Ably auth on customer dashboard using authCallback
- Fixed org_id set on session creation in shadowModeRouter
- Added Ably connection status indicator to customer dashboard
- Added deterministic newest-session auto-select with 5s refetch
- Added actionStates to FeedCard — loading, success, disabled states
- Full pipeline validated end to end — real-time feed cards confirmed

### Validation Confirmed
- Transcript → Pipeline → intelligence_feed → Governance → Ably publish → Customer dashboard → Feed card appears instantly
- Acknowledge and Follow Up buttons write to customer_actions
- DB confirmed rows written correctly

### Last Known Good Commit: a855e02

### Next: Phase 3 Task 3 — Customer Role Enforcement

## Session: April 25 2026

### Objective: Phase 3 Task 3 — Customer Role Enforcement + Task 3B Validation

### Completed
- customerProcedure created in customerDashboardRouter.ts
- All 4 procedures protected: getSessions, getFeed, getGovernance, recordAction
- CustomerRoute component created — redirects non-customers to /
- /customer/dashboard wrapped with CustomerRoute in App.tsx
- RequireAuth removed from customer route — does not support customer role
- Ably token security flag added to ably.ts
- Operator redirect confirmed working in browser — negative validation PASSED
- auth.me updated in routers.ts — now reads real DB user from session cookie in dev bypass mode
- devLoginRouter.ts created then deleted — never registered, never deployed

### Blocked
- Positive customer login validation blocked — OAuth not configured on Render
- No mechanism to issue customer session token without OAuth or locked file change
- Locked file discipline maintained — index.ts not touched

### Follow-up Task
- Phase 3 Task 3B — Configure proper customer authentication on Render
- Complete positive customer validation once OAuth or customer session path exists

### Replit Auto-Commits Detected
- R10 noted — Replit committed autonomously during session multiple times

### Last Known Good Commit: 85b4bdc
### Next: Phase 3 Task 3B — OAuth/customer login configuration

## Session: April 26 2026
### Objective: Phase 3 Task 3B — Clerk Auth Integration

### Completed
- Diagnosed WebDev OAuth server as non-existent and uncontrollable
- Decision made: replace WebDev OAuth scaffold with Clerk
- Installed @clerk/express and @clerk/react (correct non-deprecated packages)
- Created server/_core/auth.ts — CuraLive auth abstraction layer (only file that knows about Clerk)
- Updated server/_core/oauth.ts — replaced WebDev internals, registerOAuthRoutes export preserved
- Updated server/_core/context.ts — replaced sdk.authenticateRequest with getCurrentUser
- Updated server/slideDeckUpload.ts — replaced sdk.authenticateRequest with requireAuth
- Updated server/_core/env.ts — added Clerk env vars
- Added .env to .gitignore
- Fixed clerkMiddleware to pass keys explicitly
- Deployed to Render — /api/auth/status confirmed returning mode: clerk

### Validation Confirmed
- /api/auth/status returns authenticated: false, mode: clerk, oauthConfigured: true ✅
- /api/oauth/login returns 302 redirect to Clerk sign-in ✅
- Backend auth path confirmed functional via curl ✅

### Blocked
- Full browser flow blocked on Replit — webview proxy interferes
- Full browser flow blocked on Render — requires custom domain + Clerk Production instance

### Replit Auto-Commits Detected
- R10 violation — Replit committed autonomously multiple times during session
- Local branch reset to github/main to restore clean state
- GitHub remote confirmed clean at 130e379

### Last Known Good Commit: 130e379
### Next: Phase 3 Task 3C — Custom domain + Clerk Production + full browser validation on Render

## Session: April 26 2026
### Objective: Phase 3 Task 3C — Custom Domain + Clerk Production + Browser Validation
### Completed
- Added structured error logging to getCurrentUser in auth.ts
- Purchased and configured app.curalive.cc subdomain
- Moved DNS from Konsoleh to Cloudflare for reliable CNAME handling
- All 5 Clerk Production DNS records verified in Cloudflare
- Render redeployed with production Clerk keys (sk_live / pk_live)
- Customer test user created in Clerk (user_3CuDZMD0Moz882aj7ZGu0ioDbaI)
- Customer user mapped in CuraLive DB: role=customer, orgId=1
### Blocked
- Browser validation blocked — DNS nameserver propagation pending (1-3 days)
- app.curalive.cc not yet resolving via Cloudflare
### Last Known Good Commit: 0acc16b
### Next: Phase 3 Task 3C continued — browser validation once DNS propagates
- Open app.curalive.cc in browser
- Login as customer@curalive.cc
- Confirm /api/auth/status returns authenticated true, role customer, orgId 1
- Confirm /customer/dashboard loads with live feed
- Confirm customer action writes to customer_actions
- Confirm operator is blocked

## Session: April 27 2026
### Objective: Phase 3 Task 3C — Browser Validation (continued)
### Completed
- Removed AUTH_BYPASS=true from Render environment — was forcing dev bypass in production
- Added /sign-in route with Clerk SignIn component
- Fixed Clerk JWT token passing in tRPC requests via Authorization header
- Switched Clerk SignIn to hash routing to handle sub-routes correctly
- Full browser validation confirmed on app.curalive.cc
### Validation Confirmed
- /api/auth/status returns authenticated true, mode clerk, role customer, orgId 1 ✅
- /customer/dashboard loads correctly ✅
- Ably connected on customer dashboard ✅
- Live feed visible ✅
- Unauthenticated users blocked and redirected ✅
### Last Known Good Commit: 62c0622
### Next: Phase 3 Task 4 — Profile Foundation

## Session: April 27 2026
### Objective: Phase 3 Task 4 — Profile Foundation

### Completed
- Created CustomerProfile.tsx — displays email, role, orgId from auth.me
- Added /customer/profile route in App.tsx wrapped with CustomerRoute
- Updated CustomerDashboard.tsx — Profile tab navigates via Wouter, no page reload
- Fixed CustomerRoute — redirects to /sign-in, shows loading div not null
- Fixed useAuth — removed localStorage, added staleTime/gcTime, confirmed auth only on isSuccess
- Fixed routers.ts and routers.eager.ts — removed OAUTH_SERVER_URL dev bypass
- Fixed ClerkProvider — added signInUrl, afterSignInUrl, afterSignUpUrl
- Fixed /sign-in route — wrapped ClerkSignIn with forceRedirectUrl

### Validation Confirmed
- Fresh incognito to /customer/profile redirects to /sign-in
- Login redirects to /customer/dashboard
- Profile page displays email, role, orgId correctly
- Back button returns to /customer/dashboard
- Auth wall confirmed airtight in production

### Security Fix
- Production auth bypass via OAUTH_SERVER_URL removed from routers.ts and routers.eager.ts
- Confirmed: auth.me returns null for unauthenticated

### Last Known Good Commit: 0458c2c
### Next: Phase 4 — Personal Intelligence Profiles

## Session: April 27 2026 (Phase 3.5 Brief)
### Objective: Phase 3.5 Task 1 — Signal Discipline Core

### Completed
- Created server/services/SignalDiscipline.ts — Signal Discipline Core module
- Added evaluateSignalDiscipline() — confidence filtering + dedup gate
- Normalization: lowercase, trim, punctuation strip, whitespace collapse
- TTL-based session state cleanup (4 hours inactivity, 30 min interval)
- Integrated into SegmentOrchestrator.ts — one import, one guard block before INSERT
- Signal Discipline sits between Governance Gateway and intelligence_feed write

### Validation Confirmed
- Session 175 — 3 segments processed in production
- [SignalDiscipline] surfaced logged for all 3 segments ✅
- Confidence 0.8 threshold active ✅
- Ably publish unchanged ✅
- Feed items 179, 180, 181 written and published ✅

### Replit Auto-Commits Detected
- R10 violation — Replit committed autonomously multiple times during session

### Last Known Good Commit: c71166c
### Next: Phase 3.5 Task 2 — Signal Collapsing

## Session: April 28 2026 (Session 2)
### Objective: Phase 3.5 Task 2 — Signal Collapsing

### Completed
- Added CLUSTER_STOPWORDS and getClusterKey() to CustomerDashboard.tsx
- Added collapseIntoClusters() — groups feedItems by first meaningful word
- Added expandedClusters state tracking expanded clusters
- Replaced feedItems.map() with cluster render
- KPI strip unchanged — still shows raw feedItems.length

### Validation Confirmed
- Session 177 — 5 sentiment signals arrived live via Ably
- All 5 collapsed into Sentiment Cluster — 5 signals
- Expand revealed all 5 signals with timestamps, scores, keywords
- Acknowledge and Follow Up buttons functional inside cluster
- No flicker, no duplication, real-time stable

### Known Limitations
- Customer dashboard does not yet rehydrate historical feedItems from database
- Clustering validated in live session context only
- History persistence deferred — not in scope for Phase 3.5

### Replit Auto-Commits Detected
- R10 violation — Replit committed autonomously multiple times during session

### Last Known Good Commit: 6fec2ab
### Next: Phase 3.5 Task 3 — Post-Event Summary

## Session: April 29 2026
### Objective: Phase 3.5 Task 3 — Post-Event Summary validation

### Completed
- Post-Event Summary panel deployed in previous session (cace7c3)
- Validated live against session 178

### Validation Confirmed
- Total Signals: 7 matched live feed count
- Clusters: 1 (Sentiment Cluster) matched Signal Collapsing output
- Latest Signal timestamp: 10:21:32 AM correct
- Key Signals: Sentiment Cluster listed correctly
- Session name displayed correctly
- No AI summarisation footer confirmed
- No Coming Soon placeholder

### Known Limitations
- Summary derived from live feed only — history persistence still deferred
- Clustering validated in live session context only

### Replit Auto-Commits Detected
- R10 violation — monitor on every push

### Last Known Good Commit: cace7c3
### Next: Phase 3.5 Task 4 — Outcome Marker

## Session: April 29 2026 (Session 2)
### Objective: Phase 3.5 Task 5 — Presence Indicator

### Completed
- Added getSuppressionStats query to shadowModeRouter.ts
- Added getSuppressionStats query to customerDashboardRouter.ts
- Component 1: CAPTURING indicator in operator header (green pulsing dot)
- Component 2: Suppression counter in operator feed header (X ASSESSED · Y SURFACED · Z FILTERED)
- Component 2 simplified: filtered for clarity on customer dashboard (conditional)
- Component 3: Session Confirmation in Post-Event tab (CuraLive captured X minutes)

### Validation Confirmed
- Session 180 — all three components validated in production
- CAPTURING indicator visible in operator header
- 56 ASSESSED · 56 SURFACED · 0 FILTERED confirmed in operator feed header
- CuraLive captured 8 minutes. 59 signals assessed. 59 surfaced — confirmed in Post-Event tab

### PCT Flags
- Presence indicator mechanics — flag for PCT
- Suppression counter as trust signal — flag for PCT
- Session confirmation closing presence loop — flag for PCT

### Replit Auto-Commits Detected
- R10 violation — Replit committed autonomously multiple times

### Last Known Good Commit: 99a2e0c
### Next: Phase 3.5 Task 6 — Daily Confidence Signal (after Task 3 refinement)

## Session: April 29 2026 (Session 3)
### Objective: Phase 3.5 Task 3 Refinement — Action Resolution in Post-Event Summary

### Completed
- Added getActionResolution query to customerDashboardRouter.ts
- Added Action Resolution block to Post-Event tab in CustomerDashboard.tsx
- Required attention = high/critical severity feed items
- Actioned = matched customer_actions.target_id
- Unresolved = required attention minus actioned

### Validation Confirmed
- Session 180 — 4 high/critical signals in DB confirmed
- UI shows: 4 requiring attention, 0 acknowledged, 4 unresolved
- DB query confirmed exact match
- Post-Event Summary now answers: did I handle what mattered

### PCT Flag
- User relevance filtering mechanism — actionability filter on severity
- Flag for PCT documentation

### Replit Auto-Commits Detected
- R10 violation — monitor on every push

### Last Known Good Commit: to be confirmed after push
### Next: Phase 3.5 Task 6 — Daily Confidence Signal

## Session: April 29 2026 (Session 4)
### Objective: Phase 3.5 Task 6 — Daily Confidence Signal

### Completed
- Added getDailyConfidence query to customerDashboardRouter.ts
- Replaced Daily Intelligence Coming Soon with confidence panel
- Three states: CONFIDENT / CAUTION / NOT READY
- State derived from latest completed session unresolved high/critical counts
- Max 3 supporting items with title and severity badge
- Hook moved to component level to fix React rules violation

### Validation Confirmed
- Daily Intelligence tab shows NOT READY for session 180
- 3 Sentiment Deterioration Pattern items listed as HIGH
- Session name and date correct
- No AI recommendations footer confirmed
- State logic correct: 4 unresolved high items triggers NOT READY

### PCT Flags
- Confidence state generation — flag for PCT
- Signal compression logic — flag for PCT
- Actionability filtering — flag for PCT

### Replit Auto-Commits Detected
- R10 violation — Replit intervened during hook fix

### Last Known Good Commit: to confirm after push
### Next: Phase 3.5 Task 7 — First Event Protocol (operational, no build)

## Session: April 29 2026 (Session 5)
### Objective: rawSql governance_decisions JOIN bug fix

### Completed
- Located rawSql error: operator does not exist: text = integer in getGovernance query
- Confirmed query in customerDashboardRouter.ts — not in any locked file
- Fixed JOIN across three iterations:
  - Attempt 1: s.session_id::text = g.session_id → changed error to invalid input syntax
  - Attempt 2: replace(g.session_id, 'shadow-', '')::integer → g.session_id is integer, replace() failed
  - Attempt 3: s.id = g.session_id — direct integer join, correct solution
- Deployed to Render, confirmed zero rawSql errors in polling cycle

### Validation Confirmed
- Render logs clean — no rawSql Query failed errors
- governance_decisions JOIN executing silently as expected
- Polling loop stable

### Replit Auto-Commits Detected
- R10 violation — Replit auto-committed all three fix iterations

### Last Known Good Commit: 78aba04
### Next: Phase 3.5 Stage 1A — Deterministic Delta Prototype

## Session: April 30 2026
### Objective: Stage 1A — Deterministic Delta Prototype

### Completed
- NarrativeDeltaService.ts created — pure TypeScript, no DB writes, no pipeline injection
- Priority hierarchy implemented: P0 compliance, P1 correlation deterioration, P2 material novelty, P3 sustained pressure, P4 internal only
- P4 never surfaced — logged as STATE_RESOLUTION only
- Materiality gate: pipeline-driven not keyword-driven
- Validation script created: scripts/validate-delta-181.ts
- Fixture created: fixtures/session-181-feed.json (6 representative items from session 181)
- tsconfig.scripts.json created for standalone script execution

### Validation Confirmed
- 6 items processed
- 4 surfaced — all P1 correlation deterioration signals
- 2 suppressed — baseline sentiment correctly filtered
- Delta text confirmed clean: no scores, no numeric language, no advice
- Example: "Sentiment has weakened across recent responses relative to session opening."

### Finding for Stage 1B
- 4 repeated P1 deterioration signals need collapsing into one for customer dashboard
- Maximum three rule requires deduplication of repeated same-pattern signals
- Deferred to Stage 1B

### Replit Auto-Commits Detected
- R10 violation — Replit committed 3 times autonomously during session

### Last Known Good Commit: 7510dbd
### Next: Stage 1B — Signal collapsing for repeated deterioration patterns

## Session: April 30 2026
### Objective: Stage 1A — Deterministic Delta Prototype

### Completed
- NarrativeDeltaService.ts created — pure TypeScript, no DB writes, no pipeline injection
- Priority hierarchy: P0 compliance, P1 correlation deterioration, P2 material novelty, P3 sustained pressure, P4 internal only
- P4 never surfaced — logged as STATE_RESOLUTION only
- Materiality gate: pipeline-driven not keyword-driven
- Validation script: scripts/validate-delta-181.ts
- Fixture: fixtures/session-181-feed.json
- tsconfig.scripts.json created for standalone script execution

### Validation Confirmed
- 6 items processed, 4 surfaced, 2 suppressed
- All 4 surfaced: P1 correlation deterioration signals
- Delta text clean: no scores, no numeric language, no advice
- Example output: Sentiment has weakened across recent responses relative to session opening.

### Finding for Stage 1B
- 4 repeated P1 deterioration signals need collapsing into one
- Deferred to Stage 1B

### Replit Auto-Commits Detected
- R10 violation — Replit committed 3 times autonomously

### Last Known Good Commit: 7510dbd
### Next: Stage 1B — Signal collapsing for repeated deterioration patterns

## Session: April 30 2026 (Stage 1B)
### Objective: Stage 1B — Signal Collapsing for Repeated Deterioration Patterns

### Completed
- Added surfacedSignals Set to SessionDeltaState
- Duplicate check added to scorePriority before P1 correlation block
- Signal key: topicKey + pipeline + pattern_type
- First occurrence surfaces, all subsequent suppress as SUPPRESSED_DUPLICATE_PATTERN

### Validation Confirmed
- 6 items processed
- 1 surfaced — feedItemId 317, P1 correlation deterioration
- 3 suppressed as SUPPRESSED_DUPLICATE_PATTERN (feedItemId 320, 327, 372)
- 2 suppressed as baseline sentiment
- Customer dashboard would show exactly 1 delta instead of 4

### Replit Auto-Commits Detected
- R10 violation — Replit committed autonomously

### Last Known Good Commit: to confirm after push
### Next: Stage 2 — Shadow panel on customer dashboard

## Session: April 30 2026 (Stage 2)
### Objective: Stage 2 — Narrative Delta Panel on customer dashboard

### Completed
- getNarrativeDeltas tRPC procedure added to customerDashboardRouter.ts
- NarrativeDeltaService imported server-side
- Narrative Intelligence panel added to CustomerDashboard.tsx above Intelligence Feed
- Panel shows: priority badge, delta text, suppression counter, active silence state
- Fixed: surfacedSignals.add missing — duplicate suppression was not registering
- Fixed: session state persisting between requests — clearSession called at start of evaluateSessionDeltas
- Fixed: governance JOIN regression patched again

### Validation Confirmed
- 123 assessed, 1 surfaced
- P1 delta: Sentiment has weakened across recent responses relative to session opening.
- Duplicate collapsing working correctly — 4 correlation signals collapsed to 1
- Existing Intelligence Feed unchanged
- Active silence state ready for sessions with no material deviations

### Replit Auto-Commits Detected
- R10 violation — multiple autonomous commits during session

### Last Known Good Commit: to confirm after push
### Next: Stage 3 — Replace feed with delta panel (on user evidence only)

## Session: April 30 2026 (Phase 3 Gate Close)
### Objective: Regulatory Reconstruction Query — Phase 3 Gate Close

### Completed
- getAuditRecord procedure added to shadowModeRouter.ts (operatorProcedure)
- Audit Record tab added to ShadowMode.tsx operator console
- listSessions fixed — rawSql replaces Drizzle ORM to bypass schema mismatch
- History tab sessions made clickable — setSelectedSessionId on click
- Operator Clerk user created and mapped (user_3D5DtZxrxrAcRykBshO0HGLrrRR, id=3)
- Session ID mapping corrected — numeric id used not UUID session_id

### Validation Confirmed
- Session 181 (Cell C Interim Results) selected from History tab
- Audit Record tab loaded successfully
- Chain intact confirmed: CHAIN INTACT — Tamper-evidence verified
- 123 signals detected — complete and chronological
- 123 governance decisions — all AUTHORISED with unique chain hashes
- 6 client actions — ACKNOWLEDGE and FOLLOW_UP with timestamps and targets
- Output is regulator-readable without system knowledge

### Phase 3 Gate Status
CONFIRMED CLOSED
All gate conditions met:
- Real-time Ably: done
- Customer role enforcement: done
- Profile foundation: done
- Regulatory Reconstruction Query: done

### Last Known Good Commit: to confirm after push
### Next: Phase 4 — Personal Intelligence Profiles

## Session: May 01 2026 (Session 6 — Isolation Validation)
### Objective: Seed real customer org and validate end-to-end tenant isolation

### Completed
- Seeded Cell C as first real customer org (org_id = 6)
- Updated customer@curalive.cc to org_id = 6
- Added Cell C to Shadow Mode org dropdown
- Ran real session (id=182, Isolation Test) against Cell C
- Confirmed session written with org_id = 6 in DB
- Confirmed customer dashboard shows only Cell C sessions
- Confirmed CuraLive Internal sessions not visible to Cell C customer

### Validation Confirmed
- DB: session 182 org_id = 6
- DB: session 181 org_id = 4 — not visible to Cell C
- Customer dashboard: only Isolation Test visible
- Tenant isolation proven end to end in production

### Phase Status
- Tenant isolation: CONFIRMED
- Phase 4: UNBLOCKED
- Next: Phase 4 — Personal Intelligence Profiles

### Last Known Good Commit: to confirm after push
### Next: Phase 4 — Personal Intelligence Profiles

## Session: April 30 2026 (Phase 4 Foundation)
### Objective: Phase 4 — Session Memory Foundation

### Completed
- user_session_memory table created in production database
- 11 columns: id, user_id, org_id, session_id, signals_surfaced, signals_actioned, signals_ignored, highest_severity_seen, session_duration_ms, session_closed_at, created_at
- UNIQUE constraint on (user_id, session_id) — write-once enforced
- UserSessionMemoryService.ts created — derives all values from existing tables
- org_id filter removed from intelligence_feed queries — org_id is NULL on feed items
- Manual validation against session 181, user 4 confirmed:
  signals_surfaced=123, signals_actioned=3, signals_ignored=1, highest_severity=high
- First memory record written to production successfully

### Constraints Locked
- Derived not authoritative — summary of existing data only
- Write-once per session — ON CONFLICT DO NOTHING
- No business logic in table — all logic in service layer
- No UI yet — storage foundation only

### Last Known Good Commit: to confirm after push
### Next: Wire UserSessionMemoryService into session close pipeline

## Session: April 30 2026 (Phase 4 Auto-Start)
### Objective: Wire SessionMemoryBackfillService into automatic startup

### Completed
- SessionMemoryBackfillService.ts wired into server/routers.eager.ts
- startSessionMemoryBackfill() called at server boot
- Duplicate interval guard confirmed active
- Deployed to Render — 327 memory records in production confirming service is running
- Per-user differentiation validated: user 4 shows actioned=3 ignored=1, others show actioned=0 ignored=4
- Idempotency confirmed — second run produces no duplicate writes

### Validation Confirmed
- npx tsx direct call confirms: [SessionMemoryBackfill] Starting polling worker
- 327 user_session_memory records in production
- Service running automatically on every server boot

### Last Known Good Commit: to confirm after push
### Next: Phase 4 UI — surface session memory on customer profile

## Session: May 01 2026
### Objective: Phase 4 UI — Surface session memory on customer profile

### Completed
- getSessionMemory procedure added to customerDashboardRouter.ts
- Queries user_session_memory JOIN shadow_sessions for event_name
- Filters by user_id and org_id — tenant isolated
- CustomerProfile.tsx updated — Session History table added below profile info
- Columns: Session, Surfaced, Actioned, Ignored, Highest Severity, Date
- Severity badge colour-coded: critical=red, high=orange, medium=yellow
- Fixed trpc import path — ../lib/trpc not ../_core/trpc

### Validation Confirmed
- app.curalive.cc/customer/profile loads correctly
- Email, role, orgId confirmed
- Session History table visible with real production data
- 16+ sessions displayed with correct signal counts and severity
- Data sourced from user_session_memory — 327 records in production

### Known Issues
- Last row truncated — null highest_severity_seen and session_closed_at on some rows
- session_duration_ms still NULL across all rows — not displayed in UI

### R10 Violations
- Replit auto-committed both changes autonomously during session

### Last Known Good Commit: 188fde2
### Next: Phase 4 — surface session memory insights, or next architect decision

## Session: May 01 2026 (Session 2)
### Objective: Phase 4 — Clean session memory output

### Completed
- Behavioural filter applied to getSessionMemory query
- Filter: signals_actioned > 0 OR signals_ignored > 0
- Eliminates backfill artefacts and zero-interaction sessions
- Profile now shows only sessions with real user interaction

### Key Decision
- Name-based filtering rejected — brittle and wrong
- One real session (Interim Results) is correct and accurate
- Test sessions remain visible as historical record — not hidden

### Deferred
- session_duration_ms population — separate follow-up fix
- Behavioural insight layer — requires 3-5 real production sessions minimum
- Upstream fix — mark test/demo sessions at creation before memory write

### Validation
- app.curalive.cc/customer/profile shows filtered session list
- Behavioural filter confirmed working in production

### Last Known Good Commit: 2ea97c1
### Next: Accumulate real sessions. Then build behavioural insight layer.

## Session: May 01 2026 (Session 3 — Extended)
### Objective: Discovery and triage

### No code written this session.

### Discoveries
- Archive sessions in operator console show no data — NaN timestamps, no signals
- All sessions visible on customer dashboard regardless of ownership — no isolation
- session_duration_ms still NULL — not being populated
- Only 1 real production session exists (Session 181 — Interim Results)
- 327 memory records are mostly backfill artefacts

### Decisions Locked
- No behavioural insight layer until 3-5 real sessions accumulate
- No name-based session filtering — rejected as brittle
- Archive sessions are the path to generating real memory data
- Full system audit required before any new Phase 4 build

### Next Session Objectives
1. Audit operator console — why archive sessions show no data
2. Audit customer dashboard — why all sessions are visible regardless of ownership
3. Map real state vs intended state before writing any code

### Last Known Good Commit: 434f304

## Session: May 01 2026 (Session 4 — Multi-Tenancy Foundation)
### Objective: Audit + correct multi-tenancy model and session ownership

### No application code written this session.

### Discoveries
- organisations table already existed in production (Replit-era seed data)
- Three fake orgs: Meridian Resources, Acacia Capital, Stellarway Holdings
- All 164 historical sessions attributed to Meridian Resources (org_id = 1)
- created_by_user_id column was missing from shadow_sessions
- status values included 'pilot' and 'demo' — not part of approved model

### Corrections Applied (DB only)
- Created CuraLive Internal as permanent internal org (id = 4)
- Reclassified all 164 historical sessions to org_id = 4
- Froze legacy orgs 1, 2, 3 as inactive
- Added organisations_status_check constraint (active | inactive only)
- Added shadow_sessions_org_id_fkey FK constraint
- Added created_by_user_id nullable audit column to shadow_sessions

### Verified State
- 1 active org: CuraLive Internal (id = 4)
- 3 inactive orgs: legacy frozen, not deleted
- All 164 sessions: org_id = 4
- Constraint enforced: status IN ('active', 'inactive')

### Design Decisions Locked
- CuraLive Internal = permanent internal org, never customer-facing
- Real customers = org_id 5+ from this point forward
- Operator sits above all orgs — no org membership
- Session ownership set explicitly at creation — no defaults
- No hardcoded org IDs in application code
- Org creation: founder-controlled via DB seed (Render Shell)
- Partners tab: deferred

### Remaining Before Phase 4 Resumes
- Audit codebase for hardcoded org_id = 1 references
- Add org selector to Shadow Mode session creation (hard gate)
- Seed first real customer org (id = 5+)
- Run one real session against that org
- Validate customer dashboard isolation end to end

### Phase Status
- Phase 4: ON HOLD — do not resume until Shadow Mode org selector is built and validated

### Last Known Good Commit: e31f988
### Next: Codebase audit for org_id = 1 hardcoding, then Shadow Mode org selector

## Session: May 01 2026 (Session 5 — Org Selector + Session Ownership Fix)
### Objective: Fix hardcoded org_id references + add Shadow Mode org selector

### Completed
- Audited codebase for hardcoded org_id = 1 references
- Found 3 critical locations: SessionMemoryBackfillService.ts, shadowModeRouter.ts, customerDashboardRouter.ts
- SessionMemoryBackfillService.ts — HTTP artifact corruption resolved via ChatGPT
- shadowModeRouter.ts — removed ctx.user?.orgId ?? 1 fallback, now requires input.orgId
- ShadowMode.tsx — org selector added, START SESSION disabled until org selected
- Hard gate confirmed: no org selected = session cannot launch

### Operational Note — Markdown Link Corruption
When Claude outputs dot-notation code (s.id, u.org_id, session.org_id),
the Claude chat interface converts them to markdown hyperlinks before
reaching the shell. This corrupts file write commands.
Resolution protocol: if file write fails twice due to this — hand to ChatGPT,
return to Claude for verification and commit. Do not attempt heredoc,
python, or node workarounds — all suffer same corruption.

### Remaining
- customerDashboardRouter.ts — 9 instances of ?? 1 fallback still present (low risk, authenticated users always have orgId)
- Org selector currently hardcoded with CuraLive Internal only — needs dynamic query when real customer orgs exist
- Seed first real customer org (org_id = 5+)
- Run one real session against that org
- Validate customer dashboard isolation end to end

### Phase Status
- Phase 4: ON HOLD — shadow mode org selector now enforced
- Next: seed real customer org, run real session, validate isolation

### Last Known Good Commit: to confirm after push
### Next: Seed first real customer org and run end-to-end isolation validation

## Session: May 01 2026 (Session 6 — Isolation Validation)
### Objective: Seed real customer org and validate end-to-end tenant isolation

### Completed
- Seeded Cell C as first real customer org (org_id = 6)
- Updated customer@curalive.cc to org_id = 6
- Added Cell C to Shadow Mode org dropdown
- Ran real session (id=182, Isolation Test) against Cell C
- Confirmed session written with org_id = 6 in DB
- Confirmed customer dashboard shows only Cell C sessions
- Confirmed CuraLive Internal sessions not visible to Cell C customer

### Validation Confirmed
- DB: session 182 org_id = 6 ✅
- DB: session 181 org_id = 4 — not visible to Cell C ✅
- Customer dashboard: only Isolation Test visible ✅
- Tenant isolation proven end to end in production ✅

### Phase Status
- Tenant isolation: CONFIRMED
- Phase 4: UNBLOCKED
- Next: Phase 4 build — Personal Intelligence Profiles

### Last Known Good Commit: to confirm after push
### Next: Phase 4 — Personal Intelligence Profiles

## Session: May 02 2026 (Session 1 — curalive-core Extraction)
### Objective: Create clean patent-aligned repository — curalive-core

### Completed
- Full dependency audit completed before any file was moved
- Identified 5 blockers: legacy imports in shadowModeRouter, aiAnalysis dependency, SessionClosePipeline locked file dependencies, aggregateIntelligence, LiveQaDashboard
- Classification completed: active core, patent-relevant future modules, legacy discard
- New private GitHub repo created: https://github.com/davecameron187-sys/curalive-core
- 53 files extracted and pushed to curalive-core
- Stub files created for SessionClosePipeline locked dependencies
- Patent-relevant modules archived: aggregateIntelligence, archiveUploadRouter
- Docs created: README, architecture, patent-alignment, deployment, validation-checklist
- Legacy repo reset after R10 violation — Replit committed stubs locally, reset to github/main

### Not Yet Done (next session)
- Remove legacy imports from shadowModeRouter.ts in curalive-core (lines 8-10, 54, 536, 614)
- Remove LiveQaDashboard import from ShadowMode.tsx in curalive-core
- Run npx tsc --noEmit in curalive-core — must pass clean
- Deploy curalive-core to separate Render services
- Full validation checklist

### Rules
- Legacy repo: untouched and clean at d432df7
- Production Render: still pointing at legacy repo
- No production switch until curalive-core passes full validation

### Last Known Good Commit (legacy): d432df7
### curalive-core commit: ef3c24c
### Next: Clean legacy imports in curalive-core, then TypeScript compile check

## Session: May 02 2026 (Session 1 - curalive-core Extraction)
### Objective: Create clean patent-aligned repository

### Completed
- Full dependency audit completed before any file was moved
- Identified 5 blockers and resolved all
- Classification completed: active core, patent-relevant future modules, legacy discard
- New private GitHub repo created: https://github.com/davecameron187-sys/curalive-core
- 53 files extracted and pushed to curalive-core
- Stub files created for SessionClosePipeline locked dependencies
- Patent-relevant modules archived: aggregateIntelligence, archiveUploadRouter
- Docs created: README, architecture, patent-alignment, deployment, validation-checklist
- Legacy repo reset after R10 violation

### Not Yet Done
- Remove legacy imports from shadowModeRouter.ts in curalive-core
- Remove LiveQaDashboard import from ShadowMode.tsx in curalive-core
- Run npx tsc --noEmit in curalive-core
- Deploy curalive-core to separate Render services
- Full validation checklist

### Rules
- Legacy repo: untouched and clean at d432df7
- Production Render: still pointing at legacy repo
- No production switch until curalive-core passes full validation

### Last Known Good Commit (legacy): d432df7
### curalive-core commit: ef3c24c
### Next: Clean legacy imports in curalive-core, then TypeScript compile check

## Session: May 02 2026 (Session 2 — curalive-core Build Stabilisation)
### Objective: Resolve all TypeScript errors in curalive-core

### Completed
- Moved stubs to correct server/services/ location
- Created AIReportPipeline stub
- Created notification.ts stub
- Created drizzle/gaps.schema.ts and partners.schema.ts stubs
- Fixed App.tsx — removed 100+ legacy imports, clean minimal router
- Fixed main.tsx — removed invalid Clerk props
- Added auth router with me and logout procedures
- Installed @clerk/clerk-react
- Excluded locked files from tsconfig (recallWebhook.ts, SegmentOrchestrator.ts)
- Archived AI modules: AiEvolutionService, OrganizationalKnowledgeGraphService, PredictiveEventIntelligenceService, AIReportPipeline to patent-modules
- Archived experimental: AeosQuoteToCash, AeosSemanticApi, AeosSovereignData, IpoMandA
- Archived strategic-legacy: PersonalizationEngine, UnifiedIntelligenceService, AICoreClient, AICorePayloadMapper
- TypeScript compiles clean: 0 errors
- Backup file removed from git

### curalive-core Status
- TypeScript: CLEAN
- GitHub: fcb2960
- Archive: complete — all AI work preserved and classified
- Next: ShadowMode.tsx LiveQaDashboard import removal, then session close

### Legacy Repo
- Untouched at d432df7
- Production Render: still on legacy repo

### Last Known Good Commit (legacy): d432df7
### curalive-core commit: fcb2960
### Next: Remove LiveQaDashboard import from ShadowMode.tsx in curalive-core

## Session: May 02 2026 (Session 3 — Production Recovery)
### Completed
- R10 violation: Replit stripped legacy App.tsx — reverted
- Fixed SessionMemoryBackfillService orgId column name
- Production live at app.curalive.cc
- curalive-core TypeScript clean at fcb2960
### Legacy commit: db41e13
### curalive-core: fcb2960
### Next: LiveQaDashboard removal in curalive-core

## Session: May 02 2026 (Session 4 — UI Cleanup)
### Objective: Clean operator console UI to match curalive-core spec

### Completed
- Removed Live QA and Participants tabs from Shadow Mode
- Fixed NaN timestamps in history tab — Unix ms timestamps now handled correctly
- Removed Overview, Events, Partners tabs from Dashboard
- Default tab changed from Overview to Shadow Mode
- Removed legacy Dashboard nav link
- Fixed broken JSX after nav removal — build restored
- Production confirmed: Shadow Mode, Billing, Settings only
- App opens directly in Shadow Mode

### Production Status
- Live at app.curalive.cc
- Last commit: 13bb757
- curalive-core: f45f840 (unchanged)

### Next
- Customer dashboard session history fix
- curalive-core Render deployment planning

### Last Known Good Commit (legacy): 13bb757
### curalive-core commit: f45f840

## Session: May 02 2026 (Session 5 — History Fix + Audit)
### Completed
- Reverted ShadowMode to 60233c7 clean state
- Added isLive guard — timer and CAPTURING only show for live sessions
- Added historySessionId state — history clicks no longer activate live console
- Audit Record now works for history sessions via historySessionId
- Fixed NaN timestamps in history list
- Fixed Unix ms timestamp in session elapsed timer
### Remaining for next session
- Audit Tab UI refinement — reconstruct Detected/Governed/Surfaced/Acted story
- Customer dashboard session history rehydration
### Last Known Good Commit (legacy): see git log
### curalive-core: f45f840 unchanged

## Session: May 03 2026 (Session 1 — Audit PDF Export)
### Objective: Build tamper-evident audit PDF export from Shadow Mode

### Completed
- Added generateAuditPdf procedure to shadowModeRouter.ts
- Added attachment support to sendEmail in email.ts
- Added EXPORT PDF button to AuditRecordPanel in ShadowMode.tsx
- PDF generates server-side from DB data — not browser state
- PDF includes: summary, material signals, client actions, chain verification
- Optional recipient email field for sending to client compliance officer
- PDF downloads in browser and emails to operator
- Cleaned PDF layout — single page, linear flow, no coordinate overlap

### Known
- PDF layout can be refined further
- Material signals shows high/critical only — correct for audit summary

### Production Status
- Live at app.curalive.cc
- Legacy commit: see git log
- curalive-core: f45f840 unchanged

### Next
- Customer dashboard session history rehydration
- Further UI refinements if needed

## Session: May 03 2026 (Phase 3.6 — Operator Command Centre)
### Objective: Multi-event live monitoring on Operator Dashboard

### Completed
- Full workflow audit across 8 scope areas — documented what exists, what works, what is missing
- Designed Operator Command Centre blueprint — health model, priority model, dashboard structure
- Added getLiveSessions procedure to operatorDashboardRouter.ts — queries all live sessions with health state derived from bot status and feed activity
- Wired getLiveSessions into OperatorDashboard.tsx frontend
- Dashboard KPI and header now use live session count from getLiveSessions
- Replaced single-session primary panel with multi-session data model
- Fixed broken primaryLiveSession references in SessionsPanel — replaced with live.data
- Added live sessions grid to CommandPanel — shows all live sessions with org name, event name, health state, alert count, elapsed time

### Commits
- ae53dcb feat: add multi-event live sessions query
- e9c06c2 feat: wire live sessions query into operator dashboard
- 7e1b0f7 feat: use liveSessions count in operator dashboard
- a4f90a6 feat: switch live session panel to multi-session data model
- bb5d361 fix: replace broken primaryLiveSession refs in SessionsPanel with live.data
- b308a3d feat: add live sessions grid to operator dashboard command panel

### Health model implemented
- HEALTHY: bot in_call, last feed < 60s
- WATCH: last feed 60-120s
- DEGRADED: last feed 120-240s
- CRITICAL: last feed > 240s, bot done while live, bot failed
- BOT_MISSING: no recall_bot_id
- NO_DATA: no feed items and session started > 60s ago

### Known issues
- Markdown dot-notation corruption active in this chat interface
- File writes must use Python heredoc via shell, not inline scripts or copy-paste

### Outstanding next session
- Step 2: Fix getUpcomingSessions to read shadow_sessions WHERE status IN pending, booked
- Step 3: Extend getAttentionItems with session health items
- Customer dashboard feed rehydration (deferred)
- Booking to session automated workflow (deferred)
- curalive-core deployment (deferred)

### Production Status
- Live at app.curalive.cc
- Legacy commit: b308a3d
- curalive-core: f45f840 unchanged

### Last Known Good Commit: b308a3d
