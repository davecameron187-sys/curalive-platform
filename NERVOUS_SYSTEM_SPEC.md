# CURALIVE — NERVOUS SYSTEM SPECIFICATION
**Version: 1.0**
**Established: April 23 2026**
**Author: Chief Architect**
**Status: ACTIVE — all phases must implement against this spec**

---

## PURPOSE

This document defines the formal truth model for CuraLive's nervous system.

Every layer, every pipeline, every service, every output must conform to the rules defined here.

This spec answers the question:
> "Is the nervous system formally safe, deterministic, auditable, and scalable enough for regulated enterprise deployment?"

---

## CURALIVE LEGAL BOUNDARY — SUPREME RULE

CuraLive DETECTS. CuraLive CLASSIFIES. CuraLive DELIVERS.
The CLIENT decides. Always. Without exception.

CuraLive is never in the decision chain.
The audit trail must always read: CuraLive detected → Client decided.
Never: CuraLive decided.

---

## 1. FORMAL STATE MACHINE

### 1.1 Session Lifecycle States
CREATED → DEPLOYING → JOINING → IN_CALL → TRANSCRIBING → CLOSING → POST_PROCESSING → COMPLETED
↓
DEGRADED → FALLBACK_ACTIVE → CLOSING
↓
FAILOVER_PENDING → RECALL_FAILED → CLOSING

| State | Description | Entry Trigger | Exit Trigger |
|-------|-------------|---------------|--------------|
| CREATED | Session record inserted | startSession mutation | Bot deploy API call succeeds |
| DEPLOYING | Bot creation request sent to Recall | Bot deploy call made | Recall returns bot.id |
| JOINING | Bot attempting to join meeting | recall_bot created | bot.joining_call webhook |
| IN_CALL | Bot in meeting, no transcript yet | bot.in_call_recording webhook | First transcript.data webhook |
| TRANSCRIBING | Transcript flowing normally | First transcript.data arrives | endSession or bot.call_ended |
| DEGRADED | Transcript gap detected (15s warning fired) | Watchdog 15s timer | Transcript resumes or 90s timer |
| FAILOVER_PENDING | 90s no transcript — failover triggered | Watchdog 90s timer | Tier 2 activates or session ends |
| FALLBACK_ACTIVE | Tier 2 capture active | Tier 2 connect success | Session ends |
| RECALL_FAILED | Bot fatal or unrecoverable | bot.fatal webhook | Operator ends session |
| CLOSING | endSession called | endSession mutation | Pipeline completes |
| POST_PROCESSING | SessionClosePipeline running | Pipeline start | Pipeline complete |
| COMPLETED | All post-session work done | Pipeline complete | — |

### 1.2 Transition Rules
- No state may be skipped — transitions must follow the defined paths
- COMPLETED is terminal — no transitions out
- RECALL_FAILED may only transition to CLOSING via operator action
- DEGRADED must not persist longer than 90 seconds before transitioning to FAILOVER_PENDING
- Conflicting states are prevented by atomic DB updates with optimistic locking

### 1.3 Invalid State Prevention
Every state transition must:
1. Read current state
2. Validate transition is permitted
3. Write new state atomically with `WHERE status = $current_state` condition
4. If write affects 0 rows — another process beat us — abort, do not retry blindly

---

## 2. IDEMPOTENCY AND DUPLICATE EVENT CONTROL

### 2.1 Canonical Segment Deduplication
Every canonical segment must have a unique key:
unique_key = sha256(session_id + speaker_name + start_timestamp + text_first_10_chars)
Before inserting to `canonical_event_segments`:
- Check if unique_key already exists
- If exists → skip insert, return existing row ID
- If not → insert

This prevents duplicate segments from transcript replay or webhook retry.

### 2.2 Intelligence Feed Deduplication
Every intelligence_feed row must have:
idempotency_key = sha256(session_id + pipeline + canonical_segment_id + feed_type)
Insert uses `ON CONFLICT (idempotency_key) DO NOTHING`.

### 2.3 Pipeline Execution Idempotency
The orchestrator tracks pipeline executions per segment:
pipeline_executions: Map<sessionId-segmentIndex-pipelineName, boolean>
Before running any pipeline — check if already executed for this segment. If yes — skip.

### 2.4 Governance Decision Idempotency
Each governance decision is keyed on `intelligence_feed_id + pipeline_id`.
`ON CONFLICT DO NOTHING` on insert.

### 2.5 Webhook Event Deduplication
Every incoming Recall webhook event carries a `webhook-id` header.
Store processed webhook IDs in `processed_webhooks` table (id, processed_at).
Before processing — check if webhook-id already processed. If yes — return 200 immediately.
TTL: 24 hours.

---

## 3. MASTER CLOCK AND TIME TRUTH

### 3.1 Source of Time Truth
The master clock for all CuraLive time references is:
**Recall's absolute timestamps from word-level data** — `words[n].start_timestamp.absolute`

This is an ISO8601 UTC timestamp derived from the meeting platform's clock — the most accurate available source.

Server ingestion time (`Date.now()`) is NEVER used as a canonical timestamp. It is only used for `created_at` audit fields.

### 3.2 Timestamp Fields — Canonical Segment
| Field | Source | Purpose |
|-------|--------|---------|
| start_timestamp | words[0].start_timestamp.absolute → epoch ms | Canonical event time |
| end_timestamp | words[-1].end_timestamp.absolute → epoch ms | Segment end |
| aligned_timestamp | start_timestamp (same source) | Cross-source alignment anchor |
| created_at | Date.now() | Audit only — when row was written |

### 3.3 Out-of-Order Segment Handling
Segments arriving out of order are accepted and inserted with their correct `start_timestamp`.
`segment_index` is assigned based on insertion order — not time order.
All downstream consumers must sort by `start_timestamp` not `segment_index` for time-ordered processing.

### 3.4 Cross-Source Alignment
When multiple capture sources run simultaneously (Tier 1 Recall + Tier 2 fallback):
- Both write to `canonical_event_segments` with their respective `source_type`
- Deduplication key prevents exact duplicates
- Overlapping segments from different sources are retained with both `source_type` values
- Downstream consumers use earliest `start_timestamp` for a given time window

---

## 4. BACKPRESSURE AND OVERLOAD BEHAVIOUR
**Status: IMPLEMENTED — Phase 2H — April 24 2026**
**Commit: 6a81802**

### 4.1 Pipeline Priority Tiers

| Tier | Pipelines | Behaviour Under Load |
|------|-----------|---------------------|
| P0 — Must never drop | Compliance detection, watchdog, state transitions | Always runs — synchronous, no queue |
| P1 — Real-time preferred | Sentiment analysis, evasiveness detection | Queue with 10s max wait — drop if exceeded |
| P2 — Best effort | Speaker dynamics, rolling summary | Queue with 30s max wait — drop if exceeded |
| P3 — Async acceptable | Topic classification, anomaly detection | Queue with 5min max wait — drop if exceeded |

### 4.2 Concurrency Limits
| Resource | Limit | Behaviour at limit |
|----------|-------|-------------------|
| LLM calls per session | 3 concurrent | P1/P2 queue, P0 bypasses |
| LLM calls total (all sessions) | 20 concurrent | New sessions queue at P1/P2 |
| AI Core requests | 5 concurrent | Queue — never drop |
| DB writes per second | 100 | Batch writes at 50ms intervals |

### 4.3 Degradation Order
Under extreme load, pipelines degrade in this order:
1. P3 pipelines drop first — topic classification, anomaly detection
2. P2 pipelines drop next — speaker dynamics, rolling summary
3. P1 pipelines queue — sentiment, evasiveness
4. P0 never drops — compliance and state transitions always run

### 4.4 Overload Signalling
When any pipeline drops due to load:
- Log `[Orchestrator] Pipeline ${name} dropped for session ${id} — load shedding`
- Write to `intelligence_feed` with `feed_type: "system"`, `severity: "info"`, `title: "Analysis Delayed"` — operator is informed
- Never silently drop

---

## 5. AUDIT LINEAGE MODEL

### 5.1 The Lineage Chain
Every surfaced intelligence output must be traceable through this complete chain:
Raw Audio/Transcript
↓ [source_type, recallBotId]
canonical_event_segments
↓ [canonical_segment_id]
intelligence_feed
↓ [intelligence_feed_id]
governance_decisions
↓ [governance_decision_id]
Operator Console Display / Customer Dashboard
↓ [display_event_id]
Customer Action (if any)
↓ [customer_action_id]

### 5.2 Required Fields Per Layer

**canonical_event_segments:**
- `source_type` — where signal came from
- `start_timestamp` — canonical time reference
- `confidence_score` — source reliability

**intelligence_feed:**
- `canonical_segment_id` — links to source segment
- `pipeline` — which pipeline produced this
- `confidence_score` — pipeline confidence
- `governance_status` — pending/authorised/withheld
- `idempotency_key` — deduplication

**governance_decisions:**
- `intelligence_feed_id` — links to evaluated output
- `pipeline_id` — which pipeline
- `decision` — authorised/withheld/pending_review
- `stability_score`, `observation_count`, `failure_rate` — criteria scores
- `reason_code` — why withheld if applicable
- `created_at` — decision timestamp

**customer_actions (future):**
- `governance_decision_id` — links to gateway decision
- `customer_user_id` — who actioned
- `action_type` — verified/dismissed/escalated
- `actioned_at` — timestamp
- `notes` — optional

### 5.3 Regulatory Reconstruction Query
A regulator must be able to run one query and get the complete chain for any surfaced output. This query path must be documented and tested before Phase 3 customer dashboard launch.

---

## 6. SECURITY AND TENANT ISOLATION

### 6.1 Isolation Boundaries

| Data Type | Isolation Level | Rule |
|-----------|----------------|------|
| shadow_sessions | Per organisation | WHERE org_id = $org_id on all queries |
| canonical_event_segments | Per session | Accessible only via session owned by org |
| intelligence_feed | Per session | Session ownership check required |
| governance_decisions | Per session | Session ownership check required |
| recall_bots | Per session | Session ownership check required |
| memory_graph_nodes/edges | Per organisation | Hard org_id partition |
| pre_event_context | Per organisation | Hard org_id partition |
| benchmark data | Anonymised pool | No org identifier retained after anonymisation |
| Ably channels | Per session | Channel name includes session ID — not guessable |

### 6.2 Row-Level Security
All tables containing `org_id` must have PostgreSQL Row Level Security policies enabled before Phase 3 customer dashboard launch.

### 6.3 Ably Channel Security
Channel names must not be predictable. Current format: `shadow-{sessionId}-{timestamp}` — acceptable.
Future: add HMAC signature to channel name for additional security.

### 6.4 Cross-Organisation Data
The only data that crosses organisation boundaries is anonymised benchmark data — stripped of all identifiers before aggregation. This is enforced by the anonymisation pipeline in Layer 7.

---

## 7. OPERATOR OVERRIDE HIERARCHY

### 7.1 What CuraLive Operators Can Do
CuraLive operators are technical session managers. They are NOT compliance officers.

| Action | Permitted | Logged |
|--------|-----------|--------|
| Start/end session | Yes | Yes — timestamp, operator ID |
| View intelligence feed | Yes | No |
| View bot status | Yes | No |
| Override bot failover | Yes | Yes — timestamp, operator ID, reason |
| Dismiss system alerts | Yes | Yes |
| Access client data | Read only | Yes — every access |
| Make compliance decisions | NO | N/A — not permitted |
| Verify/dismiss compliance flags | NO | N/A — client dashboard only |

### 7.2 What Client Users Can Do
Client users act on their own dashboard. They are the decision-makers.

| Action | Permitted | Logged |
|--------|-----------|--------|
| View intelligence reports | Yes | No |
| Verify compliance flags | Yes | Yes — user ID, timestamp, decision |
| Dismiss compliance flags | Yes | Yes — user ID, timestamp, reason |
| Escalate to legal team | Yes | Yes — full chain |
| Export audit trail | Yes | Yes — export event logged |
| Configure compliance rules | Yes (future) | Yes |

### 7.3 Operator Actions Feed Policy Synthesis
CuraLive operator actions (session start/end, failover overrides) are logged and available to the Policy Synthesis module in Layer 7. They inform operational patterns but never compliance patterns.

Client user actions (verify/dismiss/escalate) are logged and available to the Policy Synthesis module. They directly inform compliance pattern learning.

---

## 8. IMPLEMENTATION REQUIREMENTS PER PHASE

| Phase | Spec Requirements |
|-------|------------------|
| Phase 2F — Governance Gateway | Implement audit lineage fields, governance_decisions table, idempotency keys on intelligence_feed |
| Phase 3 — Customer Dashboard | Implement tenant isolation, row-level security, customer_actions table, regulatory reconstruction query |

---

## SECTION 2 — PERSONAL INTELLIGENCE SPECIFICATION
**Added: April 23 2026**

### 8. IDENTITY RESOLUTION

Resolution chain:
Recall participant.name + participant.email → match against registered users table → verified identity links canonical_segment to user_id. If confidence < 0.8 → flagged unresolved → operator can manually link.

Table: `user_speaker_mappings` — links user_id to speaker_name patterns per organisation. Learns over time. Self-improving across sessions.

### 9. GOVERNANCE SEPARATION

Two separate data stores. Two separate access control models.

- Organisational layer: compliance flags, governance decisions, audit trail. Visible to compliance officers and legal. Retained permanently. Feeds regulatory reconstruction. NEVER contains personal coaching data.
- Personal coaching layer: sentiment trends, evasiveness patterns, communication coaching. Visible only to the individual and designated manager. Retained per user retention policy. NEVER feeds regulatory audit trail.

Pipeline writes to both stores explicitly. Cross-contamination is architecturally prevented.

### 10. ADAPTIVE FEEDBACK LOOP

Personal profiles actively influence pipeline thresholds — not passive data accumulation.

- Each speaker has a personal baseline for sentiment, evasiveness, compliance risk
- Alert thresholds adjust dynamically based on deviation from personal baseline
- New speakers get conservative thresholds until baseline is established (minimum 5 sessions)
- Low-risk speakers get elevated thresholds — fewer false positives
- High-risk speakers get reduced thresholds — higher sensitivity

This is adaptive intelligence. Fixed thresholds are replaced by personalised baselines.

### 11. SIGNAL CONTROL AND COGNITIVE LOAD

Four-level signal hierarchy:

| Level | Audience | Override |
|-------|----------|---------|
| Personal | Individual only | User-configurable |
| Team | IR team | Team lead configurable |
| Organisational | CCO, legal, management | Admin configurable |
| External | Regulators, authorised parties | Fixed — never suppressed |

Cognitive load control: maximum signal density per user. If threshold exceeded in 60s window, lower-priority signals batch into summary card. Compliance signals always break through.

### 12. PRIVACY MODEL

Three retention tiers:

| Data Type | Retention | Access |
|-----------|-----------|--------|
| Compliance/governance records | Permanent | Legal, compliance, regulator |
| Session intelligence reports | 7 years | Organisation admins |
| Personal coaching profiles | 2 years default, user-controlled | Individual + designated manager |
| Raw transcript | 90 days default, configurable | Organisation admins |
| Anonymised benchmarks | Permanent | Aggregated pool only |

Right to deletion: personal coaching data deletable by individual without affecting organisational compliance records. Stores are fully separated at the architectural level.

---

## THE FORMAL TRUTH MODEL

Every event in CuraLive is an immutable record in the Event Ledger:
event_id: uuid              — uniqueness
session_id: uuid            — state context
org_id: uuid                — tenant isolation
user_id: uuid | null        — identity
source_type: enum           — provenance
canonical_timestamp: bigint — time truth (Recall absolute timestamp)
event_type: enum            — what happened
payload: jsonb              — the data
pipeline_version: string    — which pipeline
governance_status: enum     — control state
audit_hash: string          — tamper detection
created_at: timestamp       — write time (audit only)

Append-only. Nothing updated or deleted. Every state change, pipeline output, governance decision, and user action is a new row.

Any regulator can reconstruct the complete history of any session, any signal, any decision — in order, with full provenance, with tamper detection.

---

## THE DEEPER NUGGET

CuraLive is the first platform that makes corporate communication auditable at the individual level.

Not just "the company said X on this date."

But: "David Cameron, CEO, communication stress score 0.7, made this statement at 14:32:15, which deviated from his baseline evasiveness profile by 0.4 standard deviations, in a context where the compliance engine had flagged two prior statements in the same session."

That level of individual-level auditability has never existed in regulated corporate communications.

Regulators will eventually require it. CuraLive builds it before they ask.

That is not a feature. That is a category.

---

## THE GOLDEN NUGGET — PREDICTIVE COMMUNICATION INTELLIGENCE

Every architecture framework assumes CuraLive is a passive observer.
This is the wrong frame.

CuraLive has something no other platform possesses:
A longitudinal memory of how regulated corporate communications unfold —
across organisations, across event types, across speakers, across time.

After sufficient session history, CuraLive can predict the next 60 seconds
of a regulated event before it happens.

Not as a rule someone programmed.
As a pattern CuraLive discovered from its own accumulated intelligence.

Examples of predictive signals:
- "When CFO sentiment drops below 45 in the first 10 minutes, 73% of sessions
  see a hostile analyst question within 3 minutes"
- "Evasiveness spike on revenue guidance predicts escalation from a second
  analyst in the next exchange"
- "Three hedge phrases in five minutes increases compliance risk for the
  remainder of the call by 40%"

This is Predictive Communication Intelligence.

Not: "We detected a compliance signal."
But: "We predict a compliance risk in the next 60 seconds based on current
patterns matching 47 prior sessions where the same pattern preceded a violation."

Why nobody else can build this:
They need the session history.
They need the individual profiles.
They need the memory graph.
They need the canonical event model.
They need the correlation engine.

Every layer CuraLive has built is a prerequisite for prediction.
Without all of them, prediction is impossible.
With all of them, prediction is inevitable.

Architectural position:
This is the convergence of Layer 5 (Predictive Risk), Layer 6 (Memory Graph),
and Layer 2B (Correlation Engine) operating together in real time.

New signal type: feed_type = "predictive"
Appears in operator console and personal dashboard BEFORE the risk materialises.
Gives the team 60 seconds to prepare.

This is not a feature.
This is not a layer.
This is the reason the platform compounds in value with every session.
This is why the memory graph is not optional.
This is why individual profiles matter.
This is why the canonical event model must be source-agnostic.

Everything we have built leads here.
