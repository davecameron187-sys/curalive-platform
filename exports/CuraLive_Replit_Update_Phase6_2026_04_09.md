# CuraLive — Replit Update Brief: Phase 6 — Governance Record Generation (9 April 2026)

## Summary

Phase 6 complete. New Python service generates structured governance records from event data, analysis outputs, commitments, compliance flags, drift events, and briefing context. Four governance sections: meeting summary, commitment/action register, risk/compliance summary, and matters arising. Two API endpoints. Typed Node client. Integrated into SessionClosePipeline — closed sessions now automatically generate and persist governance records. End-to-end tested.

---

## Files Created

| File | Purpose |
|---|---|
| `curalive_ai_core/app/models/governance_record.py` | GovernanceRecord ORM model (15 columns) |
| `curalive_ai_core/app/schemas/governance.py` | Pydantic schemas: generation request (with segment input), response, retrieval |
| `curalive_ai_core/app/services/governance_generator.py` | Core generator: meeting summary, commitment register, risk/compliance, matters arising |
| `curalive_ai_core/app/api/routes/governance.py` | `POST /api/governance/generate`, `GET /api/governance/{id}` |

## Files Changed

| File | What changed |
|---|---|
| `curalive_ai_core/app/main.py` | Registered governance router + model import |
| `server/services/AICoreClient.ts` | Added `generateGovernanceRecord()`, `getGovernanceRecord()` + 10 typed interfaces |
| `server/services/SessionClosePipeline.ts` | Added `runGovernanceRecordStep()` after drift detection; persists `ai_governance_id` + `ai_governance_results` to `shadow_sessions` |

---

## Table: `aic_governance_records` (15 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organisation_id` | VARCHAR(128) | Indexed |
| `event_id` | VARCHAR(256) | Nullable, indexed |
| `event_name` | VARCHAR(512) | Nullable |
| `event_type` | VARCHAR(64) | Nullable |
| `event_date` | TIMESTAMPTZ | Nullable |
| `record_type` | VARCHAR(64) | Default `"full"` |
| `meeting_summary` | JSONB | Structured: title, date, duration, speakers, topics, executive summary |
| `commitment_register` | JSONB | Array: each entry has commitment text, type, status, drift annotation |
| `risk_compliance_summary` | JSONB | Structured: flag counts by severity, drift summary, narrative risk, overall level |
| `matters_arising` | JSONB | Array: drift-based matters + escalated/deadline commitments |
| `data_sources` | JSONB | Counts of inputs used: segments, commitments, flags, drifts, signals |
| `confidence` | FLOAT | 0.0–1.0, based on data richness + section coverage |
| `duration_ms` | FLOAT | Generation time |
| `created_at` | TIMESTAMPTZ | Auto-generated |

## `shadow_sessions` columns added

| Column | Type |
|---|---|
| `ai_governance_id` | VARCHAR(128) |
| `ai_governance_results` | JSONB |

---

## Endpoint Contracts

### `POST /api/governance/generate`

**Request:**
```json
{
  "organisation_id": "string",
  "event_id": "string | null",
  "event_name": "string | null",
  "event_type": "earnings_call | agm | investor_day | press_conference",
  "event_date": "ISO datetime | null",
  "analysis_job_id": "string | null",
  "briefing_id": "string | null",
  "segments": [
    {
      "speaker_id": "string | null",
      "speaker_name": "string | null",
      "text": "string",
      "start_time": "float | null",
      "word_count": "int | null"
    }
  ],
  "include_matters_arising": true
}
```

**Response:**
```json
{
  "governance_record_id": "uuid",
  "organisation_id": "string",
  "event_id": "string | null",
  "event_name": "string | null",
  "event_type": "string | null",
  "event_date": "ISO datetime | null",
  "record_type": "full",
  "meeting_summary": {
    "title": "string",
    "date": "string | null",
    "event_type": "string | null",
    "duration": "2 min",
    "total_speakers": 5,
    "total_segments": 10,
    "key_topics": ["guidance", "margins", "expansion"],
    "executive_summary": "string",
    "speaker_contributions": [
      {"speaker_name": "CEO John Smith", "word_count": 186, "segment_count": 5, "share_pct": 51.2}
    ]
  },
  "commitment_register": [
    {
      "commitment_id": "uuid",
      "speaker": "string | null",
      "commitment_text": "string",
      "commitment_type": "target | deadline_commitment | will_statement | ...",
      "deadline": "string | null",
      "has_quantitative_target": false,
      "quantitative_values": [],
      "status": "open",
      "confidence": 0.85,
      "drift_detected": false,
      "drift_details": null
    }
  ],
  "risk_compliance_summary": {
    "total_flags": 13,
    "critical_flags": 0,
    "high_flags": 2,
    "medium_flags": 9,
    "low_flags": 2,
    "flags": [{"flag_id": "uuid", "flag_type": "string", "severity": "string", "speaker": "string | null", "matched_pattern": "string", "segment_text": "string"}],
    "drift_summary": {"total_drifts": 4, "by_type": {"semantic": 1, "numerical": 2, "timing": 1}, "by_severity": {"high": 1, "medium": 3}},
    "narrative_risk": {},
    "overall_risk_level": "high | medium | low"
  },
  "matters_arising": [
    {
      "source": "drift_detection | commitment_register",
      "reference_type": "commitment_drift | escalated_commitment | deadline_commitment",
      "reference_id": "uuid | null",
      "description": "string",
      "status": "requires_attention | escalated | open",
      "original_event": "string | null",
      "current_position": "string | null",
      "severity": "high | medium | low"
    }
  ],
  "data_sources": {
    "analysis_job_id": "string | null",
    "briefing_id": "string | null",
    "commitments_count": 7,
    "compliance_flags_count": 13,
    "drift_events_count": 0,
    "signals_count": 0,
    "segments_count": 10
  },
  "confidence": 0.88,
  "duration_ms": 33.6,
  "created_at": "ISO datetime"
}
```

### `GET /api/governance/{record_id}`

Returns the same structure as the generation response.

---

## End-to-End Test Result

**Input:** 10 transcript segments (5 speakers), org `-test-corp-`, event `Test Corp H2 FY26 Results`

| Section | Result |
|---|---|
| **Meeting Summary** | 5 speakers, 10 segments, 6 key topics (guidance, margins, expansion, dividend, debt, compliance), CEO 51.2% share |
| **Commitment Register** | 7 entries (all open), sorted by drift status then status |
| **Risk/Compliance** | HIGH risk, 13 flags (2 high, 9 medium, 2 low) |
| **Matters Arising** | 7 entries (all from deadline commitments) |
| **Confidence** | 0.88 |
| **Duration** | 33.6ms |

Retrieval via `GET /api/governance/0ffd7116-...` returned correct stored data.

---

## Example Governance Record Output

```
=== GOVERNANCE RECORD ===
Record ID: 0ffd7116-1308-4e4e-9e69-46c9a4232398
Organisation: -test-corp-
Event: Test Corp H2 FY26 Results
Type: full
Confidence: 0.88

--- MEETING SUMMARY ---
  Title: Test Corp H2 FY26 Results
  Event type: earnings_call
  Duration: 2 min
  Speakers: 5
  Segments: 10
  Key topics: ['guidance', 'margins', 'expansion', 'dividend', 'debt', 'compliance']
  Summary: Test Corp H2 FY26 Results. covered 5 speakers across 10 transcript segments...
  Speaker contributions:
    CEO John Smith            words= 186 segs=5 share=51.2%
    CFO Sarah Johnson         words=  84 segs=2 share=23.1%
    Analyst Mike Chen         words=  37 segs=1 share=10.2%
    Shareholder David Molefe  words=  31 segs=1 share=8.5%
    Analyst Lisa Park         words=  25 segs=1 share=6.9%

--- COMMITMENT REGISTER ---
  7 entries (all open, 0 with drift)
  [open] [deadline_commitment] by FY27. Our target is a 20 percent return...
  [open] [target]              Our target is a 20 percent return on equity...
  [open] [stated_intention]    We plan to expand into three new jurisdictions...
  [open] [will_statement]      We will deliver on this commitment.
  [open] [reaffirmed_commitment] We remain committed to achieving our IFRS...
  [open] [expectation]         We expect to deliver strong results next quarter...
  [open] [will_statement]      We will achieve a 15 percent EBITDA margin...

--- RISK/COMPLIANCE SUMMARY ---
  Overall risk: HIGH
  Flags: 13 total (2 high, 9 medium, 2 low)
  [high]   regulatory_trigger: \bcompliance\b
  [high]   regulatory_trigger: \bregulat(?:ory|ion|or)\b
  [medium] forward_looking_statement: \bwill\s+(?:achieve|deliver|reach|grow|...)\b

--- MATTERS ARISING ---
  7 entries (all deadline commitments)
  [medium] Open commitment with deadline (18 months): by FY27. Our target is...
  [medium] Open commitment with deadline (18 months): Our target is a 20 percent...
  ...
```

---

## Node Integration — Where Governance Records Are Stored

The `SessionClosePipeline.ts` now runs `runGovernanceRecordStep()` after drift detection:

1. Loads transcript segments from `occ_transcription_segments` (or `local_transcript_json` fallback)
2. Calls `POST /api/governance/generate` with org ID, event ID, segments, analysis job ID, and briefing ID
3. Persists to `shadow_sessions`:
   - `ai_governance_id` — the governance record UUID
   - `ai_governance_results` — JSONB summary with record counts, risk level, confidence
4. Non-blocking: failures are logged and the pipeline continues

Pipeline order: compliance email → AI Core analysis → drift detection → **governance record** → AI report → delivery → board intelligence → briefing accuracy.

---

## Blockers

None. Phase 6 is complete and production-ready.
