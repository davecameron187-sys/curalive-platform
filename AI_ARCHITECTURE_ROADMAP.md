# CuraLive — Master AI Architecture Roadmap v2
### Chief Architect: Claude | April 22 2026
### Patent Reference: SA Provisional 1773575338868 | 54 Claims | 12 Figures

---

## PREAMBLE — WHAT THIS DOCUMENT IS

This is not a feature list. This is not a sprint plan. This is the complete architectural blueprint for building every patent claim into a working, enterprise-grade, regulated corporate communication governance platform.

Three independent reviewers stress-tested the first version. Their combined feedback identified nine gaps. Every gap is addressed here. Nothing is deferred without a reason. Nothing is assumed without a justification.

This document is the single source of truth for all AI architecture decisions on CuraLive from this point forward. It supersedes all previous classification documents.

**NON-NEGOTIABLE RULE: No phase may be started until the gate condition of the previous phase is confirmed met and logged in SESSION_LOG.md. Claude is responsible for enforcing this. No exceptions.**

## CURALIVE LEGAL BOUNDARY — NON-NEGOTIABLE
**Established: April 23 2026**

CuraLive is an intelligence and delivery platform. CuraLive is NEVER a decision-making platform.

CuraLive's role is strictly:
- DETECT — identify signals, patterns, compliance indicators
- CLASSIFY — score, categorise, prioritise
- DELIVER — present to the right person at the right time

The CLIENT decides what to do with that intelligence. Always.

CuraLive must never:
- Make compliance decisions on behalf of a client
- Verify or dismiss compliance flags on behalf of a client
- Take automated actions that could be construed as compliance decisions
- Put CuraLive operators in the compliance decision chain

Every output CuraLive produces must be clearly labelled as AI-generated intelligence, not legal advice, not compliance instruction, not regulatory guidance.

The audit trail must always show: CuraLive detected → Client decided.
Never: CuraLive decided.

This principle applies to every feature, every pipeline, every dashboard, every report — forever.

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
```