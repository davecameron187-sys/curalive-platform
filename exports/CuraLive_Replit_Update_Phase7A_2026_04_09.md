# CuraLive — Replit Update Brief: Phase 7A — Heartbeat Foundation / Institutional Knowledge Profile (9 April 2026)

## Summary

Phase 7A complete. New persistent Institutional Knowledge Profile system for each organisation, built from all AI Core data sources (analysis, commitments, compliance flags, drift events, stakeholder signals, governance records). Six profile dimensions: speaker communication, compliance risk, commitment delivery, stakeholder relationships, governance trajectory, and sector context (placeholder). Profile auto-updates after each governance record step in the session close pipeline. Three API endpoints. Typed Node client. End-to-end tested.

---

## Files Created

| File | Purpose |
|---|---|
| `curalive_ai_core/app/models/org_profile.py` | OrgProfile ORM model (15 cols, unique on organisation_id, versioned) |
| `curalive_ai_core/app/schemas/profile.py` | Pydantic schemas: update request, full response, retrieval, summary with typed sub-schemas |
| `curalive_ai_core/app/services/profile_generator.py` | ProfileGenerator: builds 6-dimension profile from all data sources |
| `curalive_ai_core/app/api/routes/profile.py` | `POST /api/profile/update`, `GET /api/profile/{org_id}`, `GET /api/profile/{org_id}/summary` |

## Files Changed

| File | What changed |
|---|---|
| `curalive_ai_core/app/main.py` | Registered profile router + model import |
| `server/services/AICoreClient.ts` | Added `updateOrgProfile()`, `getOrgProfile()`, `getOrgProfileSummary()` + 4 typed interfaces |
| `server/services/SessionClosePipeline.ts` | Added `runProfileUpdateStep()` after governance; persists `ai_profile_version` + `ai_profile_summary` to `shadow_sessions` |

---

## Table: `aic_org_profiles` (15 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organisation_id` | VARCHAR(128) | Unique, indexed |
| `speaker_profiles` | JSONB | Per-speaker: events_seen, word counts, segments, share %, commitments, flags |
| `compliance_risk_profile` | JSONB | Historical flag counts, by type/severity, avg/event, trend, latest level |
| `commitment_delivery_profile` | JSONB | Total commitments by status/type, drift rate, reliability rating, avg confidence |
| `stakeholder_relationship_profile` | JSONB | Signal counts by type, sentiment distribution, top sources, themes, health |
| `governance_trajectory_profile` | JSONB | Record count, avg confidence, risk history, topic frequency, quality rating |
| `sector_context` | JSONB | Placeholder: sector, sub_sector, jurisdiction, regulatory_framework |
| `profile_summary` | JSONB | Aggregate: overall risk, reliability, health, quality, concerns, strengths |
| `events_incorporated` | INTEGER | Number of events incorporated into profile |
| `last_event_id` | VARCHAR(256) | Nullable |
| `confidence` | FLOAT | 0.0–1.0 |
| `version` | INTEGER | Auto-increments on each update |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

## `shadow_sessions` columns added

| Column | Type |
|---|---|
| `ai_profile_version` | INTEGER |
| `ai_profile_summary` | JSONB |

---

## Endpoint Contracts

### `POST /api/profile/update`

**Request:**
```json
{
  "organisation_id": "string",
  "event_id": "string | null",
  "event_name": "string | null",
  "event_type": "string | null",
  "force_rebuild": false
}
```

**Response:**
```json
{
  "profile_id": "uuid",
  "organisation_id": "string",
  "speaker_profiles": {
    "CEO John Smith": {
      "speaker_name": "CEO John Smith",
      "events_seen": 1,
      "total_words": 186,
      "total_segments": 5,
      "avg_share_pct": 51.2,
      "roles_observed": [],
      "commitment_count": 0,
      "flag_count": 0,
      "last_seen_event": "shadow-25"
    }
  },
  "compliance_risk_profile": {
    "total_flags_historical": 13,
    "flags_by_type": {"forward_looking_statement": 9, "hedging_language": 2, "regulatory_trigger": 2},
    "flags_by_severity": {"medium": 9, "low": 2, "high": 2},
    "avg_flags_per_event": 13.0,
    "risk_trend": "stable | increasing | decreasing",
    "latest_risk_level": "high | medium | low"
  },
  "commitment_delivery_profile": {
    "total_commitments": 7,
    "commitments_by_status": {"open": 7},
    "commitments_by_type": {"deadline_commitment": 1, "target": 1, "...": "..."},
    "total_drifts": 0,
    "drifts_by_type": {},
    "drift_rate": 0.0,
    "delivery_reliability": "strong | good | moderate | poor | unknown",
    "avg_confidence": 0.81
  },
  "stakeholder_relationship_profile": {
    "total_signals": 5,
    "signals_by_type": {"analyst_note": 1, "media_snippet": 1, "...": "..."},
    "sentiment_distribution": {"negative": 2, "neutral": 2, "mixed": 1},
    "avg_sentiment_score": -0.13,
    "top_sources": ["Internal IR Team", "Allan Gray", "..."],
    "key_themes": ["leadership", "guidance", "compliance", "..."],
    "relationship_health": "strong | positive | neutral | cautious | strained | unknown"
  },
  "governance_trajectory_profile": {
    "total_records": 1,
    "avg_confidence": 0.88,
    "latest_risk_level": "high",
    "risk_level_history": [{"event_id": "shadow-25", "risk_level": "high", "confidence": 0.88}],
    "key_topics_frequency": {"guidance": 1, "margins": 1, "...": "..."},
    "avg_matters_arising": 7.0,
    "governance_quality": "strong | adequate | developing | insufficient | unknown"
  },
  "sector_context": {
    "sector": "unclassified",
    "sub_sector": null,
    "jurisdiction": null,
    "regulatory_framework": null,
    "notes": "Sector context will be enriched in future phases."
  },
  "profile_summary": {
    "organisation_id": "string",
    "events_incorporated": 1,
    "overall_risk_level": "high",
    "delivery_reliability": "strong",
    "relationship_health": "neutral",
    "governance_quality": "adequate",
    "key_concerns": ["High compliance risk level"],
    "key_strengths": ["Commitment delivery reliability: strong"],
    "confidence": 0.86
  },
  "events_incorporated": 1,
  "last_event_id": "shadow-25",
  "confidence": 0.86,
  "version": 2,
  "duration_ms": 7.5,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

### `GET /api/profile/{organisation_id}`

Returns the same structure as the update response (without `duration_ms`).

### `GET /api/profile/{organisation_id}/summary`

**Response:**
```json
{
  "organisation_id": "string",
  "profile_summary": {
    "organisation_id": "string",
    "events_incorporated": 1,
    "overall_risk_level": "high",
    "delivery_reliability": "strong",
    "relationship_health": "neutral",
    "governance_quality": "adequate",
    "key_concerns": ["High compliance risk level"],
    "key_strengths": ["Commitment delivery reliability: strong"],
    "confidence": 0.86
  },
  "events_incorporated": 1,
  "last_event_id": "shadow-25",
  "confidence": 0.86,
  "version": 2,
  "updated_at": "ISO datetime"
}
```

---

## End-to-End Test Result

**Input:** org `-test-corp-`, event `shadow-25` (Test Corp H2 FY26 Results)

**Data sources consumed:**
- 1 governance record (from Phase 6 E2E)
- 7 commitments (from Phase 3B E2E)
- 13 compliance flags (from Phase 3B E2E)
- 0 drift events (none for this org currently)
- 5 stakeholder signals (from Phase 5 E2E)

| Profile Dimension | Key Output |
|---|---|
| **Speaker Profiles** | 5 speakers: CEO 51.2% share (186 words), CFO 23.1%, 3 analysts/shareholders |
| **Compliance Risk** | 13 flags (9 FLS, 2 hedging, 2 regulatory), avg 13/event, trend stable, latest HIGH |
| **Commitment Delivery** | 7 commitments (all open), 0 drifts, drift rate 0%, reliability STRONG, avg conf 0.81 |
| **Stakeholder Relationship** | 5 signals (2 negative, 2 neutral, 1 mixed), avg score -0.13, health NEUTRAL |
| **Governance Trajectory** | 1 record, confidence 0.88, latest risk HIGH, quality ADEQUATE |
| **Sector Context** | Placeholder (unclassified) |
| **Profile Summary** | Risk: HIGH, Reliability: STRONG, Health: NEUTRAL, Quality: ADEQUATE |
| | Concerns: ["High compliance risk level"] |
| | Strengths: ["Commitment delivery reliability: strong"] |

**Overall:** version 2, confidence 0.86, 7.5ms

Retrieval via `GET /api/profile/-test-corp-` and summary via `GET /api/profile/-test-corp-/summary` both returned correct data.

---

## Example Institutional Knowledge Profile Output

```
=== INSTITUTIONAL KNOWLEDGE PROFILE ===
Profile ID: 6ccd6edf-f058-41a9-8d70-5519f2b2a032
Organisation: -test-corp-
Version: 2
Events incorporated: 1
Confidence: 0.86

--- SPEAKER PROFILES ---
  CEO John Smith                 events=1 words=  186 segs=5 share=51.2%
  CFO Sarah Johnson              events=1 words=   84 segs=2 share=23.1%
  Analyst Mike Chen              events=1 words=   37 segs=1 share=10.2%
  Shareholder David Molefe       events=1 words=   31 segs=1 share=8.5%
  Analyst Lisa Park              events=1 words=   25 segs=1 share=6.9%

--- COMPLIANCE RISK PROFILE ---
  Total flags: 13 (9 FLS, 2 hedging, 2 regulatory)
  By severity: 2 high, 9 medium, 2 low
  Avg flags/event: 13.0
  Risk trend: stable
  Latest risk level: HIGH

--- COMMITMENT DELIVERY PROFILE ---
  7 commitments (all open)
  By type: 2 will_statement, 1 each of deadline/target/intention/reaffirmed/expectation
  0 drifts, drift rate: 0%
  Delivery reliability: STRONG
  Avg confidence: 0.81

--- STAKEHOLDER RELATIONSHIP PROFILE ---
  5 signals (analyst, media, shareholder, investor, observation)
  Sentiment: 2 negative, 2 neutral, 1 mixed
  Avg sentiment score: -0.13
  Relationship health: NEUTRAL

--- GOVERNANCE TRAJECTORY PROFILE ---
  1 record, avg confidence: 0.88
  Latest risk level: HIGH
  Topics: guidance, margins, expansion, dividend, debt, compliance
  Avg matters arising: 7.0
  Governance quality: ADEQUATE

--- PROFILE SUMMARY ---
  Overall risk: HIGH
  Delivery reliability: STRONG
  Relationship health: NEUTRAL
  Governance quality: ADEQUATE
  Key concerns: High compliance risk level
  Key strengths: Commitment delivery reliability: strong
```

---

## Node Integration — Where Profile Summary Is Stored

The `SessionClosePipeline.ts` now runs `runProfileUpdateStep()` after governance record generation:

1. Calls `POST /api/profile/update` with org ID, event ID, event name, event type
2. Persists to `shadow_sessions`:
   - `ai_profile_version` — the current profile version number
   - `ai_profile_summary` — JSONB with profile_id, version, overall_risk_level, delivery_reliability, relationship_health, governance_quality, events_incorporated, confidence, key_concerns, key_strengths
3. Non-blocking: failures are logged and the pipeline continues

Pipeline order: compliance email → AI Core analysis → drift detection → governance record → **profile update** → AI report → delivery → board intelligence → briefing accuracy.

---

## Blockers

None. Phase 7A is complete and production-ready.
