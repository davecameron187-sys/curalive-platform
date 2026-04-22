# CuraLive — Master AI Architecture Roadmap v2
### Chief Architect: Claude | April 22 2026
### Patent Reference: SA Provisional 1773575338868 | 54 Claims | 12 Figures

---

## PREAMBLE — WHAT THIS DOCUMENT IS

This is not a feature list. This is not a sprint plan. This is the complete architectural blueprint for building every patent claim into a working, enterprise-grade, regulated corporate communication governance platform.

Three independent reviewers stress-tested the first version. Their combined feedback identified nine gaps. Every gap is addressed here. Nothing is deferred without a reason. Nothing is assumed without a justification.

This document is the single source of truth for all AI architecture decisions on CuraLive from this point forward. It supersedes all previous classification documents.

**NON-NEGOTIABLE RULE: No phase may be started until the gate condition of the previous phase is confirmed met and logged in SESSION_LOG.md. Claude is responsible for enforcing this. No exceptions.**

---

## THE HONEST STATE OF THE PLATFORM TODAY

**What works:**
- Recall bot joins meetings and captures transcripts ✅
- Webhook signature verification working as of April 22 ✅
- Bot status updating correctly as of April 22 ✅
- Post-session pipeline fires reliably as of April 22 ✅
- Four AI modules complete post-session ✅
- Governance records persisting ✅

**What doesn't exist yet:**
- Canonical Event Model — transcripts are JSON blobs, not governed records
- Deterministic Governance Gateway — AI outputs surface with zero evaluation
- Live operator intelligence — frontend is a polling shell with no real-time AI
- Organisational Memory Graph — orphaned, never run
- Identity fusion — no participant reconciliation
- Predictive risk — not implemented
- Answer-risk assessment — not implemented
- Autonomous policy synthesis — not implemented
- Cross-event benchmarking — not implemented
- Real-time pipeline orchestration — services fire independently with no coordination
- System health monitoring — silent failures go undetected
- Failure recovery — no retry, no replay, no degraded mode

**The core problem in one sentence:**
The intelligence system was built without the foundation, without the nervous system, and without the safety net. This roadmap builds all three.

---

## THE COMPLETE LAYER STACK

Eight layers. Build order is non-negotiable. Each layer is a prerequisite for the one above it.
Layer 7 — Autonomous Policy Synthesis + Cross-Event Benchmarking
Layer 6 — Organisational Memory Graph
Layer 5 — Predictive Risk + Answer-Risk + Identity Fusion + CuraLive Assistant
Layer 4 — Deterministic Governance Gateway
Layer 3 — Operator Intelligence Console (live UI + Ably)
Layer 2B — Multi-Dimensional Analysis Pipelines
Layer 2A — Real-Time Orchestration Engine
Layer 1 — Canonical Event Model
Layer 0 — Connectivity & Ingestion Orchestration

**Layer 0 was missing from v1. It is the most important addition.**

---

## LAYER 0 — CONNECTIVITY & INGESTION ORCHESTRATION
**Patent:** Invention Family 1 (Claims 1-6), Invention Family 2 (Claims 7-11)
**Current state:** Partially working — Recall bot joins but no fallback, no health monitoring, no guaranteed presence

### Components:

**0.1 — Bot Health Heartbeat**
Two-tier watchdog:
- 15 seconds silence → publish `transcript.warning` to operator Ably channel — operator alerted immediately
- 90 seconds silence → existing failover logic fires

**0.2 — Three-Tier Capture Redundancy**

| Tier | Method | Status |
|------|--------|--------|
| Tier 1 | Recall bot via meeting URL | ✅ Working |
| Tier 2 | Server-side transcript buffer via Telnyx/Twilio dial-in | ⏳ Phase 0C |
| Tier 3 | Manual operator transcript upload | ⏳ Phase 0C |

**0.3 — Ingest Health Dashboard**
Operator sees bot status in real time: `connecting → joining → in_call → transcribing → done`. Live indicator confirms system presence before first word spoken.

**0.4 — Pre-Event Context Injection (Briefing Room)**
Before session starts, operator uploads:
- Previous SENS/RNS announcements
- Prior quarter results
- Known risk topics for this organisation

Context stored against organisation record. Fed into every AI pipeline as pre-event context. Required for Narrative Drift detection in Layer 6.

**Table required:** `pre_event_context` linked to `organisations`

---

## LAYER 1 — CANONICAL EVENT MODEL
**Patent:** Invention Family 3, Claims 12-17
**Current state:** NOT IMPLEMENTED — transcripts stored as JSON blobs on recall_bots

### Schema:

```sql
canonical_event_segments
- id (serial primary key)
- session_id (references shadow_sessions.id)
- source_type (enum: recall | webrtc | upload | telnyx | future)
- speaker_id (nullable — populated by Identity Fusion Layer 5)
- speaker_name (text — temporary from Recall participant.name)
- speaker_role (nullable — presenter | analyst | operator | unknown)
- text (text)
- start_timestamp (bigint absolute ms)
- end_timestamp (bigint absolute ms)
- aligned_timestamp (bigint — normalised reference clock)
- word_count (integer)
- segment_index (integer — ordering within session)
- confidence_score (float — source reliability indicator)
- governance_status (enum: pending | authorised | withheld — Layer 4)
- created_at (timestamp)
```

### Critical notes:
- `speaker_id` is nullable in Layer 1. Identity Fusion populates it in Layer 5. This is acknowledged and not a blocker.
- `handleTranscriptData` dual-writes during migration: canonical rows AND existing blob. Blob fallback removed only after 10 consecutive sessions confirmed on canonical data.
- Sessions spanning migration use blob fallback — no data loss.
- `createScheduledSession` PostgreSQL `?` placeholder fixed in Phase 1C — one-line fix, not deferred further.

---

## LAYER 2A — REAL-TIME ORCHESTRATION ENGINE
**Patent:** Invention Family 4, Claims 18-23 (pipeline coordination layer)
**Current state:** NOT IMPLEMENTED — services fire independently, outputs race each other

### Architecture:
canonical_event_segments → SegmentOrchestrator
↓
┌───────────────────────────┼───────────────────────────┐
↓                           ↓                           ↓
Every segment              Every 5 segments           Every 10 segments

ComplianceEngine          - SentimentAnalysis         - RollingSummary
EvasivenessDetection      - SpeakerDynamics           - TopicClassification


### Orchestrator rules:
- Compliance alerts must reach operator within 2 seconds of segment arrival
- Sentiment: 5-segment batches, 3-second max latency
- Rolling summary: 10-segment batches, fires async, non-blocking
- Maximum 3 concurrent LLM calls per session — prevents token exhaustion
- Summary waits for sentiment to complete on same batch

### Failure handling:
- Compliance fails → log, retry once, alert operator if retry fails
- Sentiment fails → log, skip, continue
- Summary fails → log, skip, do not block other pipelines
- No pipeline failure stops the orchestrator

---

## LAYER 2B — MULTI-DIMENSIONAL ANALYSIS PIPELINES
**Patent:** Invention Family 4, Claims 18-23
**Current state:** PARTIAL — aiAnalysis.ts runs sentiment and summary, output not persisted or governed

### Six pipelines — build order:

| Pipeline | Trigger | Service | Status | Latency Budget |
|----------|---------|---------|--------|----------------|
| 1 — Compliance Language | Every segment | ComplianceEngineService | Active, needs canonical input | 2s synchronous |
| 2 — Sentiment Analysis | Every 5 segments | SentimentAnalysisService.analyzeSentiment() | Orphaned, portable | 3s async |
| 3 — Evasiveness Detection | Q&A exchange detected | EvasiveAnswerDetectionService.scoreResponse() | Active, pure text | 3s async |
| 4 — Speaker Dynamics | Every 10 segments | aiAnalysis.analyzeSpeakingPace() | Exists, not persisted | 5s async |
| 5 — Topic Classification | Every 5 segments | TopicClassificationService.ts | NEEDS BUILDING | 3s async |
| 6 — Anomaly Detection | Every 20 segments | AnomalyDetectionService.ts | NEEDS BUILDING | 10s async |

### intelligence_feed table:
Already exists. Schema must be audited to confirm support for: `governance_status`, `pipeline_id`, `confidence_score`, `speaker_id`, `session_id`. New columns added as migration — existing data unaffected.

---

## LAYER 3 — OPERATOR INTELLIGENCE CONSOLE
**Patent:** Invention Family 5, Claims 24-28
**Current state:** Polling shell — no Ably subscriptions, no live AI display

### Ably authentication — prerequisite:
Server-side token endpoint required before any frontend Ably work.
**Required:** `GET /api/ably/token` — server generates Ably token for authenticated operator.

### Console panels:

**Panel 1 — Session Status Bar**
`Bot: IN CALL | Transcript: LIVE | Pipeline: RUNNING | Last segment: 2s ago`
Red + audible alert if transcript gap > 15 seconds.

**Panel 2 — Live Transcript Feed**
Segments appear in real time via Ably `transcript.segment` events. Speaker name. Timestamps. Auto-scroll.

**Panel 3 — Intelligence Feed**
Governed AI outputs only. Compliance alerts — red, audible if HIGH. Sentiment shifts — amber. Evasiveness flags — amber. Topic signals — blue. Rolling summary — green every 10 segments.

**Panel 4 — PSIL Status**
`CLEAR / CONSTRAIN / REDIRECT / ESCALATE` — derived from compliance pipeline. Real-time updates.

**Panel 5 — Speaker Scorecards**
Per-speaker: sentiment score, speaking time, evasiveness index. Updates every 5 segments.

**Panel 6 — Answer-Risk Panel**
Operator pastes candidate response. System scores it. Go / Review / Withhold. Phase 3 feature — panel placeholder exists from Layer 3.

**Panel 7 — CuraLive Assistant**
Context-aware in-session assistant grounded in:
- Current session canonical segments
- Pre-event context (Layer 0)
- Organisation memory graph (Layer 6)
- Prior session intelligence

Governed — cannot surface unverified compliance conclusions.
Phase 3 feature — panel placeholder exists from Layer 3. Not a stub — a deferred feature with a defined place.

### Human-in-the-Loop Verification:
Every HIGH severity compliance flag gets a Verify button before finalised or sent to client. Operator confirms AI didn't misinterpret a complex financial statement. Non-optional for regulated events.

---

## LAYER 4 — DETERMINISTIC GOVERNANCE GATEWAY
**Patent:** Embodiment 1
**Current state:** NOT IMPLEMENTED — AI outputs surface with zero evaluation

### Four evaluation criteria:
1. Stability Score — weighted: decayed evidence + consistency rate + inverse failure rate
2. Minimum Observation Count — enough data points to be reliable
3. Failure Rate Ceiling — pipeline performing within acceptable bounds
4. Compliance-Critical Elevation — elevated threshold for compliance outputs

### Latency architecture:
- Compliance alerts: SYNCHRONOUS — 2 second maximum. Operator never sees unverified compliance alert.
- Sentiment / evasiveness / dynamics: ASYNCHRONOUS — queued, evaluated, surfaced when authorised.
- Rolling summaries: ASYNCHRONOUS — low urgency, latency acceptable.

### New table: governance_decisions
```sql
- id
- intelligence_feed_id
- pipeline_id
- decision (authorised | withheld | pending)
- stability_score
- observation_count
- failure_rate
- is_compliance_critical
- reason_code
- created_at
```

---

## LAYER 5 — PREDICTIVE RISK + ANSWER-RISK + IDENTITY FUSION + CURALIVE ASSISTANT
**Patent:** Embodiments 2, 3 | Claims 36-43
**Current state:** NOT IMPLEMENTED

### 5.1 — Identity-Confidence Fusion (build first)
Populates `speaker_id` in canonical segments.
Sources: Recall participant data, pre-registered lists, question submissions, historical records.
Output: composite identity record with confidence score and provenance metadata.

### 5.2 — Predictive Risk Engine
- Pre-event: scores event risk from org history and memory graph
- In-event: updates risk score as canonical segments flow
- Output: event risk band on operator console with explanatory indicators

### 5.3 — Answer-Risk Assessment
- Operator inputs candidate response text
- Evaluates: MNPI risk, selective disclosure, compliance language, consistency with prior statements
- Output: Go / Review / Withhold with explanatory indicators
- HITL verification required before Withhold decision is logged

### 5.4 — CuraLive Assistant
Context-aware in-session assistant grounded in:
- Current session canonical segments
- Pre-event context (Layer 0)
- Organisation memory graph (Layer 6)
- Prior session intelligence

Governed — cannot surface unverified compliance conclusions.

---

## LAYER 6 — ORGANISATIONAL MEMORY GRAPH
**Patent:** Embodiment 4, Claims 44-48
**Current state:** OrganizationalKnowledgeGraphService — orphaned

### What it is:
Persistent graph updated after every session. By session 10, knows org communication patterns. By session 50, predicts compliance risk pre-event. By session 100, generates policy recommendations. This is the compounding intelligence moat.

### Tables:
- `memory_graph_nodes`
- `memory_graph_edges`
- `memory_graph_attributes` (with `effective_weight` for temporal decay)

### Trigger:
New step added to SessionClosePipeline after all existing steps complete.

---

## LAYER 7 — AUTONOMOUS POLICY SYNTHESIS + CROSS-EVENT BENCHMARKING
**Patent:** Embodiment 6 (Claims 53-54), Invention Family 6 (Claims 29-32)
**Current state:** NOT IMPLEMENTED

### Policy Synthesis:
Analyses accumulated intelligence, identifies recurring patterns, generates candidate policy records. Non-executable by default. Requires explicit human promotion workflow. Full audit trail. No autonomously synthesised policy takes effect without deliberate human authorisation.

### Cross-Event Benchmarking:
Anonymised intelligence aggregated across sessions and organisations. Sector-level benchmarks. VolatilitySimulatorService feeds post-earnings sentiment benchmarks as a product feature.

### Flash Report — 5 minutes post-session:
Automated report generated 5 minutes after session ends:
- Top 3 risk flags with HITL-verified status
- Sentiment trajectory per speaker
- Commitment ledger
- Narrative drift score vs prior sessions
- Benchmark comparison vs sector

This is the aha moment for the CCO or CFO. This is what makes CuraLive indispensable.

---

## CROSS-CUTTING SYSTEM RELIABILITY LAYER
Applies to all layers.

### Monitoring:
Every pipeline reports health metrics. HealthGuardianService extended to monitor AI pipelines, not just database latency.

### Retry logic:
- Transient failures: retry once after 2 seconds
- Persistent failures: log, alert, degrade gracefully
- Never silent

### Replay / Recovery:
If pipeline fails mid-session, orchestrator can replay missed segments post-session. No intelligence permanently lost.

### Multi-session scaling:
Orchestrator is session-scoped. Stateless design from Layer 2A upward. Ten concurrent sessions = ten independent orchestrator instances. No shared state between sessions.

### Latency budget:

| Pipeline | Max Latency | Mode |
|----------|------------|------|
| Compliance alert | 2 seconds | Synchronous |
| Sentiment | 3 seconds | Async |
| Evasiveness | 3 seconds | Async |
| Speaker dynamics | 5 seconds | Async non-blocking |
| Topic classification | 3 seconds | Async |
| Rolling summary | 10 seconds | Async non-blocking |
| Anomaly detection | 10 seconds | Async non-blocking |
| Governance gateway (compliance) | 2 seconds | Synchronous |
| Governance gateway (other) | 5 seconds | Async queue |

---

## PHASE EXECUTION PLAN

| Phase | Layer | Objective | Gate Condition |
|-------|-------|-----------|----------------|
| 0A | Layer 0 | Bot health heartbeat — 15s alert | Operator alerted within 15s of transcript gap in test |
| 0B | Layer 0 | Pre-event context injection — Briefing Room | Org context stored and retrievable pre-session |
| 0C | Layer 0 | Tier 2 fallback — Telnyx dial-in | Failover fires automatically on Tier 1 failure |
| 1A | Layer 1 | canonical_event_segments table + dual-write | 10 consecutive sessions produce clean canonical rows |
| 1B | Layer 1 | AICorePayloadMapper reads canonical table | Pipeline completes using canonical data confirmed in logs |
| 1C | Layer 1 | createScheduledSession bug fix | Mutation executes without crash |
| 2A | Layer 2A | Segment orchestrator built | All pipelines triggered via orchestrator not directly |
| 2B | Layer 2B | Pipelines 1-2 live (Compliance + Sentiment) | Intelligence feed populated every session |
| 2C | Layer 2B + 3 | Ably token endpoint + pipelines 1-2 wired to console | Operator sees live compliance alerts and sentiment |
| 2D | Layer 2B | Pipelines 3-4 live (Evasiveness + Speaker Dynamics) | Full four-pipeline intelligence feed running |
| 2E | Layer 3 | Full operator console — all panels live | Operator can run session without manual steps |
| 2F | Layer 4 | Governance Gateway — compliance synchronous | No ungoverned compliance alert reaches operator |
| 2G | Layer 4 | Governance Gateway — all pipelines | All outputs governed and auditable |
| 3A | Layer 5 | Identity Fusion | Speaker IDs populated in canonical segments |
| 3B | Layer 5 | Predictive Risk Engine | Pre-event and in-event risk scoring live |
| 3C | Layer 5 | Answer-Risk Assessment + HITL | Operator has pre-delivery compliance assessment |
| 3D | Layer 5 | CuraLive Assistant | In-session context-aware assistant live |
| 3E | Layer 0 | Flash Report — 5 minutes post-session | CCO/CFO receives automated risk summary |
| 4A | Layer 6 | Memory Graph — build and wire to pipeline | Cross-session intelligence accumulating |
| 4B | Layer 6 | Temporal decay + baseline establishment | Anomaly detection has baseline data |
| 4C | Layer 2B | Pipeline 6 — Anomaly Detection | Statistically unusual patterns flagged live |
| 4D | Layer 2B | Pipeline 5 — Topic Classification | Topic attribution live every session |
| 5A | Layer 7 | Cross-event benchmarking | Anonymised benchmarks generating post-session |
| 5B | Layer 7 | Autonomous Policy Synthesis | Candidate policies generating from accumulated patterns |
| 5C | Layer 7 | VolatilitySimulatorService wired to benchmarking | Post-earnings volatility prediction live |

---

## NEXT SESSION — PHASE 0A + PHASE 1A

**Phase 0A — Bot Health Heartbeat**
Upgrade watchdog from single-tier 90s to two-tier:
- 15 seconds silence → publish transcript.warning to Ably channel
- 90 seconds silence → existing failover unchanged
Gate: Operator console receives warning within 15s of transcript gap in test session.

**Phase 1A — Canonical Event Model**
Step 1 — Read current handleTranscriptData segment structure — report only
Step 2 — Write canonical_event_segments migration
Step 3 — Update handleTranscriptData to dual-write canonical rows AND existing blob
Step 4 — Confirm 10 consecutive sessions produce clean canonical rows
Step 5 — Update AICorePayloadMapper to read from canonical table
Step 6 — Confirm pipeline completes using canonical data
Gate: 10 consecutive sessions with clean canonical rows. Pipeline completes from canonical data. Confirmed in logs.

---

## WHAT THIS PLATFORM BECOMES

When all seven layers are complete, CuraLive is not a meeting intelligence tool.

It is the world's first autonomous governance system for regulated corporate communication events. Every session feeds the memory. Every memory improves the predictions. Every prediction reduces compliance risk. Every compliance risk avoided is a liability prevented for the client.

The platform compounds. The moat deepens with every session run on it. That is not a feature. That is a category.
