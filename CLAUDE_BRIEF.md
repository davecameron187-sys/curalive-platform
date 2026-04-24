# CURALIVE — CHIEF ARCHITECT BRIEF
## Read this every session before touching anything.

---

## WHO IS CURALIVE

CuraLive is the world's first personalised, role-aware, memory-driven corporate
communications intelligence platform.

Founder: David Cameron (South Africa)
Target acquisition: Microsoft and enterprise-grade buyers
Patent: SA Provisional 1773575338868, 54 claims, 12 figures
PCT filing target: End of 2026

### THE VISION
CuraLive joins silently in every earnings call, AGM, investor day.
It captures everything, understands everything, remembers everything.
Each team member — CEO, CFO, IR team — has their own personalised intelligence
assistant that gets smarter with every session.

### THE LEGAL BOUNDARY — SUPREME RULE
CuraLive DETECTS. CuraLive CLASSIFIES. CuraLive DELIVERS.
The CLIENT decides. Always. Without exception.
CuraLive is NEVER in the compliance decision chain.
Audit trail must always read: CuraLive detected. Client decided.
Never: CuraLive decided.

---

## WHAT CURALIVE IS AND IS NOT

CuraLive is NOT a reporting tool.
CuraLive is a REAL-TIME intelligence system.

Operator dashboard = runs the system
Customer dashboard = proves the system

---

## ARCHITECTURE — THE PIPELINE (NON-NEGOTIABLE ORDER)
Transcript → Canonical Segment → Segment Orchestrator → AI Pipelines (Compliance P0, Sentiment P1, Correlation P2) → Governance Gateway → Intelligence Feed → Customer Dashboard → Customer Action → Database

Every stage must be: observable, verifiable, consistent.
Primary risk: silent failure between stages.
If ANY stage fails → STOP and fix before continuing.

---

## PHASE STATUS (AS OF APRIL 24 2026)

| Phase | Status |
|-------|--------|
| Phase 0A — Bot health heartbeat | ✅ DONE |
| Phase 1A — Canonical Event Model | ✅ DONE |
| Phase 1B — SQL placeholder bug | ✅ DONE |
| Phase 2A — Segment Orchestrator | ✅ DONE |
| Phase 2B — Pipelines 1-2 live | ✅ DONE |
| Phase 2C — Operator console live | ✅ DONE |
| Phase 2E — Full operator console | ✅ DONE |
| Phase 2F — Governance Gateway | ✅ DONE |
| Phase 2G — All pipelines governed | ✅ DONE |
| Phase 2H — Backpressure & degradation | ✅ DONE |
| Phase 3 Task 1 — Customer dashboard UI | ✅ DONE |
| Phase 3 Task 2 — Real-time Ably (customer) | ⬜ NEXT |
| Phase 3 Task 3 — Customer role enforcement | ⬜ |
| Phase 3 Task 4 — Profile foundation | ⬜ |
| Phase 4 — Personal Intelligence Profiles | ⬜ |
| Phase 5 — Predictive Communication Intelligence | ⬜ |

---

## PHASE 3 — ACTIVE PHASE DETAIL

### Last Known Good Commit: 3c7104c

### What Is Built
- Customer dashboard UI live at /customer/dashboard
- orgId column on users table active
- customer_actions table live with full audit trail
- Tenant isolation active — all sessions updated to org_id = 1
- 5-tab shell — only Live Events tab functional, others show Coming Next

### Gate Conditions Remaining
- Real-time Ably subscription on customer dashboard ⬜
- Customer role enforcement on dashboard route ⬜
- Personal Intelligence Profiles ⬜
- Regulatory reconstruction query ⬜

---

## PHASE 3 ALIGNMENT BRIEF (FROM CHATGPT ARCHITECTURE — APRIL 24 2026)

### UPDATED PRIORITY ORDER — MANDATORY
1. Real-time Ably integration (customer dashboard) — FIRST
2. End-to-end live validation — SECOND
3. Customer role enforcement — THIRD
4. Profile foundation only — NOT full profiles

### TASK 1 — REAL-TIME ABLY INTEGRATION
- Subscribe to existing Ably channel used by operator console
- When new intelligence_feed event published: append to feed, reflect instantly
- NO manual refresh
- Success condition: user feels the system is alive and reacting in real time

### TASK 2 — LIVE SYSTEM VALIDATION (NON-NEGOTIABLE)
Prove this full flow for ONE live session:
Transcript → Canonical Segment → Pipeline → Intelligence Feed →
Customer Dashboard → Customer Action → Database
- Feed item appears live, no refresh needed
- Action button works, row written to customer_actions
- If ANY step fails → STOP and fix

### TASK 3 — CUSTOMER ROLE ENFORCEMENT
- Only role = customer can access /customer/dashboard
- Operators must NOT use customer dashboard
- Maintain org_id filtering

### TASK 4 — PROFILE FOUNDATION (NOT FULL BUILD)
- User role awareness in UI
- Profile tab placeholder only
- Future hook for personalisation
- DO NOT build behavioural tracking, prediction logic, or full profile system

### PHASE 3 SUCCESS CONDITION
Phase 3 is NOT complete when the UI looks good.
Phase 3 is complete when:
- Live session runs
- Intelligence appears in real time on customer dashboard
- Customer can act on it
- Data persists correctly in customer_actions

---

## PCT PATENT REQUIREMENTS — BUILD TO THESE

Every feature built must map to a patent claim. Current gaps:
- Personal Intelligence Profiles → must be built (Phase 4)
- Predictive Communication Intelligence → must be built (Phase 5)
- Cross-Dimensional Correlation Engine → built in SegmentOrchestrator ✅
- Backpressure & Degradation → built in Phase 2H ✅
- Nervous System / Orchestration → built in SegmentOrchestrator ✅

---

## CONFIRMED WORKING (DO NOT BREAK)

- Recall webhook fully operational
- Bot status updates correctly
- Canonical Event Model live
- Segment Orchestrator firing
- Compliance pipeline writing to intelligence_feed
- Sentiment pipeline writing to intelligence_feed
- Correlation engine active
- Governance Gateway writing to governance_decisions
- Chain hash audit trail confirmed tamper-evident
- Three-panel operator console live
- Intelligence Feed displaying on screen
- Duplicate pipeline guard active
- Two-tier watchdog active
- Backpressure and degradation behaviour active
- Pipeline priority tiers enforced (P0/P1/P2/P3)
- Global LLM concurrency limit active (MAX_GLOBAL_LLM_CALLS = 20)

---

## LOCKED FILES — NEVER TOUCH

- server/recallWebhook.ts
- server/services/SessionClosePipeline.ts
- server/services/SegmentOrchestrator.ts
- server/services/DeterministicGovernanceGateway.ts
- drizzle/schema.ts
- server/_core/index.ts

---

## SECTION 2 RULES — NON-NEGOTIABLE

R1: Replit must never commit or push autonomously
R2: One task at a time, one file at a time
R3: Confirm before starting any work
R4: Phase gate — previous phase confirmed before next starts
R5: DB queries in Render Shell ONLY — never Replit Shell
R6: Locked files above — untouched
R7: No schema changes without Claude approval
R8: Session close — update SESSION_LOG.md, commit, push github main
R9: Never run bash push-to-github.sh — always use git push github main
R10: Replit auto-commit awareness — check git log after every instruction

---

## TECH STACK

- Node.js + TypeScript on Render
- PostgreSQL (curalive-staging-db)
- tRPC + Drizzle ORM
- Recall.ai for meeting bots
- Whisper + GPT-4o
- React frontend
- Ably for real-time
- GitHub: davecameron187-sys/curalive-platform (main)

## RENDER SERVICES
- curalive-node — https://curalive-node.onrender.com
- curalive-platform-1 — https://curalive-platform-1.onrender.com
- curalive-staging-db — PostgreSQL

## RENDER SHELL vs REPLIT SHELL
- Render Shell prompt: render@srv-xxx:~/project/src$
- Replit Shell prompt: ~/workspace$
- NEVER run database queries in Replit Shell

---

## CHALLENGE QUESTION (mandatory before any code)
"Does the customer dashboard prove CuraLive works in real time?"
If not — continue iteration. Do NOT move forward.

---

## SESSION CLOSE PROTOCOL (EVERY SESSION)
1. Confirm final git log
2. Append session entry to SESSION_LOG.md
3. git add SESSION_LOG.md
4. git commit -m "session close: [description]"
5. git push github main
6. Never use bash push-to-github.sh
