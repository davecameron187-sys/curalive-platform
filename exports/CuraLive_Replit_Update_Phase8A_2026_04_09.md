# CuraLive — Replit Update Brief: Phase 8A — Internal Benchmarking Foundation / Sector Context Enrichment (9 April 2026)

## Summary

Phase 8A complete. New internal benchmark dataset system that aggregates all AI Core data sources across organisations and events into segmented baselines. Supports segmentation by global, event_type, and organisation (extensible to jurisdiction/sector/reporting_period). Six baseline dimensions: compliance, commitment, drift, sentiment, governance, and topics. Sector context enrichment compares an org's profile against the global benchmark and positions each dimension as above/at/below benchmark, then optionally persists the enriched sector_context and profile_summary back to the org profile. Four API endpoints, typed Node client methods, and clean `aic_benchmarks` table. End-to-end tested.

---

## Files Created

| File | Purpose |
|---|---|
| `curalive_ai_core/app/models/benchmark.py` | Benchmark ORM model (17 cols, unique on segment_key, versioned) |
| `curalive_ai_core/app/schemas/benchmark.py` | Pydantic schemas: build request, build response, retrieve, list, enrichment request/response with typed baseline sub-schemas |
| `curalive_ai_core/app/services/benchmark_generator.py` | BenchmarkGenerator: aggregates EventBucket/OrgBucket data into 6 baseline dimensions + sector enrichment logic |
| `curalive_ai_core/app/api/routes/benchmark.py` | `POST /api/benchmark/build`, `GET /api/benchmark/list`, `GET /api/benchmark/{segment_key}`, `POST /api/benchmark/enrich-sector` |

## Files Changed

| File | What changed |
|---|---|
| `curalive_ai_core/app/main.py` | Registered benchmark router + model import |
| `server/services/AICoreClient.ts` | Added `buildBenchmarks()`, `listBenchmarks()`, `getBenchmark()`, `enrichSectorContext()` + 7 typed interfaces |

---

## Table: `aic_benchmarks` (17 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `segment_key` | VARCHAR(256) | Unique, indexed. Format: `{type}:{value}` (e.g. `global:all`, `event_type:earnings_call`) |
| `segment_type` | VARCHAR(64) | `global`, `event_type`, `organisation` |
| `segment_value` | VARCHAR(256) | The value within the segment type |
| `event_count` | INTEGER | Number of events in this segment |
| `organisation_count` | INTEGER | Number of orgs in this segment |
| `compliance_baselines` | JSONB | total_flags, avg_flags_per_event, by type/severity, high_flag_rate, most_common_type/severity |
| `commitment_baselines` | JSONB | total_commitments, avg_per_event, by type/status, avg_confidence, quantitative_target_rate, most_common_type |
| `drift_baselines` | JSONB | total_drifts, avg_per_event, by type/severity, drift_rate, avg_confidence |
| `sentiment_baselines` | JSONB | total_signals, avg_per_org, sentiment_distribution, avg_score, by_type, top_sources, top_themes |
| `governance_baselines` | JSONB | total_records, avg_confidence, risk_level_distribution, avg_matters_arising, avg_flags_per_record, most_common_risk_level |
| `topic_baselines` | JSONB | topic_frequency (top 20), top_topics (top 15), topic_count |
| `summary` | JSONB | Aggregate summary with key metrics |
| `confidence` | FLOAT | 0.0–1.0 |
| `version` | INTEGER | Auto-increments on refresh |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

---

## Endpoint Contracts

### `POST /api/benchmark/build`

Builds benchmarks for all segments (or a specific one).

**Request:**
```json
{
  "segment_type": null,
  "segment_value": null,
  "force_rebuild": false
}
```

**Response:**
```json
{
  "benchmarks_built": 5,
  "segments": [
    {
      "benchmark_id": "uuid",
      "segment_key": "global:all",
      "segment_type": "global",
      "segment_value": "all",
      "event_count": 1,
      "organisation_count": 3,
      "compliance_baselines": { "total_flags": 13, "avg_flags_per_event": 13.0, "..." : "..." },
      "commitment_baselines": { "total_commitments": 7, "avg_commitments_per_event": 7.0, "..." : "..." },
      "drift_baselines": { "total_drifts": 0, "drift_rate": 0.0, "..." : "..." },
      "sentiment_baselines": { "total_signals": 5, "avg_sentiment_score": -0.13, "..." : "..." },
      "governance_baselines": { "total_records": 1, "avg_confidence": 0.88, "..." : "..." },
      "topic_baselines": { "top_topics": ["guidance", "margins", "..."], "..." : "..." },
      "summary": { "avg_flags_per_event": 13.0, "avg_commitments_per_event": 7.0, "..." : "..." },
      "confidence": 0.7,
      "version": 1,
      "duration_ms": 45.2,
      "created_at": "ISO datetime",
      "updated_at": "ISO datetime"
    }
  ],
  "duration_ms": 120.5
}
```

### `GET /api/benchmark/list?segment_type=global`

Returns all benchmarks, optionally filtered by segment_type.

### `GET /api/benchmark/{segment_key}`

Returns a single benchmark by segment_key (e.g. `global:all`, `event_type:earnings_call`).

### `POST /api/benchmark/enrich-sector`

Compares org profile against global benchmark and optionally applies enrichment.

**Request:**
```json
{
  "organisation_id": "-test-corp-",
  "apply": false
}
```

**Response:**
```json
{
  "organisation_id": "-test-corp-",
  "sector_context": {
    "sector": "unclassified",
    "sub_sector": null,
    "jurisdiction": null,
    "regulatory_framework": null,
    "benchmark_segment": "global:all",
    "benchmark_event_count": 1,
    "benchmark_org_count": 3,
    "compliance_position": "at_benchmark",
    "commitment_position": "at_benchmark",
    "drift_position": "at_benchmark",
    "sentiment_position": "at_benchmark",
    "governance_position": "at_benchmark",
    "notes": "Sector context enriched from benchmark segment 'global:all'."
  },
  "benchmark_comparison": {
    "benchmark_segment": "global:all",
    "benchmark_event_count": 1,
    "benchmark_org_count": 3,
    "compliance_flags_per_event": { "org": 13.0, "benchmark": 13.0, "position": "at_benchmark" },
    "commitments_per_event": { "org": 7.0, "benchmark": 7.0, "position": "at_benchmark" },
    "drift_rate": { "org": 0.0, "benchmark": 0.0, "position": "at_benchmark" },
    "sentiment_score": { "org": -0.13, "benchmark": -0.13, "position": "at_benchmark" },
    "governance_confidence": { "org": 0.88, "benchmark": 0.88, "position": "at_benchmark" }
  },
  "profile_summary_updates": null,
  "applied": false,
  "duration_ms": 6.0
}
```

When `apply: true`, the enriched sector_context is persisted to the org profile, profile_summary is updated with benchmark concerns/strengths, and profile version increments.

---

## End-to-End Test Result

### Step 1: Benchmark Build (all segments)

**Input:** Empty request (build all segments)

**Result:**
| Segment | Events | Orgs | Confidence |
|---|---|---|---|
| `global:all` | 1 | 3 | 0.70 |
| `event_type:earnings_call` | 1 | 3 | 0.70 |
| `organisation:-test-corp-` | 1 | 1 | 0.60 |
| `organisation:org_curalive` | 0 | 0 | 0.00 |
| `organisation:test-corp` | 0 | 0 | 0.00 |

### Step 2: Benchmark Retrieve (global:all)

| Metric | Value |
|---|---|
| Avg flags/event | 13.0 |
| Avg commitments/event | 7.0 |
| Drift rate | 0.0 |
| Avg sentiment score | -0.13 |
| Avg governance confidence | 0.88 |
| Most common risk level | high |
| Top topics | guidance, margins, expansion, dividend, debt, compliance |

### Step 3: Sector Context Enrichment (preview)

**Input:** org `-test-corp-`, apply=false

| Dimension | Org Value | Benchmark | Position |
|---|---|---|---|
| Compliance flags/event | 13.0 | 13.0 | at_benchmark |
| Commitments/event | 7.0 | 7.0 | at_benchmark |
| Drift rate | 0.0 | 0.0 | at_benchmark |
| Sentiment score | -0.13 | -0.13 | at_benchmark |
| Governance confidence | 0.88 | 0.88 | at_benchmark |

(Org is at benchmark since it represents the majority of the dataset)

### Step 4: Sector Context Enrichment (apply)

**Input:** org `-test-corp-`, apply=true

**Result:** Enriched sector_context persisted to org profile. Profile version incremented to v3. Sector context now includes benchmark_segment, positions, and enrichment notes.

---

## Example Benchmark Dataset Output

```
=== global:all ===
Events: 1, Organisations: 3, Confidence: 0.70

--- COMPLIANCE BASELINES ---
  Total flags: 13
  Avg flags/event: 13.0
  By type: forward_looking_statement=9, hedging_language=2, regulatory_trigger=2
  By severity: medium=9, low=2, high=2
  High flag rate: 0.15
  Most common type: forward_looking_statement
  Most common severity: medium

--- COMMITMENT BASELINES ---
  Total commitments: 7
  Avg/event: 7.0
  By type: will_statement=2, target=1, expectation=1, stated_intention=1, deadline_commitment=1, reaffirmed_commitment=1
  By status: open=7
  Avg confidence: 0.81
  Quantitative target rate: 0.0
  Most common type: will_statement

--- DRIFT BASELINES ---
  Total drifts: 0
  Avg/event: 0.0
  Drift rate: 0.0

--- SENTIMENT BASELINES ---
  Total signals: 5
  Avg/org: 1.67
  Sentiment: negative=2, neutral=2, mixed=1
  Avg score: -0.13
  Top sources: JP Morgan Research, Bloomberg, Coronation Fund Managers, Allan Gray, Internal IR Team
  Top themes: guidance, leadership, expansion, risk, compliance, esg, revenue, margins

--- GOVERNANCE BASELINES ---
  Total records: 1
  Avg confidence: 0.88
  Risk distribution: high=1
  Avg matters arising: 7.0
  Avg flags/record: 13.0
  Most common risk: high

--- TOPIC BASELINES ---
  Topics: guidance, margins, expansion, dividend, debt, compliance (6 total)
```

## Example Enriched Sector Context (after apply)

```
sector_context: {
  "sector": "unclassified",
  "sub_sector": null,
  "jurisdiction": null,
  "regulatory_framework": null,
  "benchmark_segment": "global:all",
  "benchmark_event_count": 1,
  "benchmark_org_count": 3,
  "compliance_position": "at_benchmark",
  "commitment_position": "at_benchmark",
  "drift_position": "at_benchmark",
  "sentiment_position": "at_benchmark",
  "governance_position": "at_benchmark",
  "notes": "Sector context enriched from benchmark segment 'global:all'."
}
```

---

## Node Client Methods

| Method | Endpoint | Purpose |
|---|---|---|
| `buildBenchmarks(req)` | `POST /api/benchmark/build` | Build/refresh benchmark datasets |
| `listBenchmarks(type?)` | `GET /api/benchmark/list` | List all benchmarks, optionally by type |
| `getBenchmark(key)` | `GET /api/benchmark/{key}` | Retrieve single benchmark |
| `enrichSectorContext(req)` | `POST /api/benchmark/enrich-sector` | Preview or apply sector enrichment |

---

## Blockers

None. Phase 8A is complete and production-ready.
