# CuraLive — Replit Update Brief: Phase 5 — Stakeholder Intelligence + Pre-Event Briefing (9 April 2026)

## Summary

Phase 5 complete. Two new Python services: stakeholder signal ingestion (with auto sentiment/topic analysis) and structured pre-event briefing generation (aggregating signals, commitments, and drift events). Four API endpoints added. Node client fully typed. Pre-event briefing scheduler enriched to call AI Core before LLM fallback. End-to-end tested.

---

## Files Created

| File | Purpose |
|---|---|
| `curalive_ai_core/app/models/stakeholder_signal.py` | StakeholderSignal ORM model (15 columns) |
| `curalive_ai_core/app/models/briefing.py` | Briefing ORM model (16 columns) |
| `curalive_ai_core/app/services/stakeholder_intelligence.py` | Auto-analysis: sentiment scoring (positive/negative/neutral/mixed), topic extraction (10 financial topics) |
| `curalive_ai_core/app/services/briefing_generator.py` | Structured briefing: topics, pressure points, sentiment summary, predicted questions, narrative risk |
| `curalive_ai_core/app/schemas/stakeholder.py` | Pydantic schemas for signal ingestion, query, and response |
| `curalive_ai_core/app/schemas/briefing.py` | Pydantic schemas for briefing generation and retrieval |
| `curalive_ai_core/app/api/routes/stakeholder.py` | `POST /api/stakeholder/ingest`, `POST /api/stakeholder/query` |
| `curalive_ai_core/app/api/routes/briefing.py` | `POST /api/briefing/generate`, `GET /api/briefing/{id}` |

## Files Changed

| File | What changed |
|---|---|
| `curalive_ai_core/app/main.py` | Registered stakeholder and briefing routers; imported new models |
| `server/services/AICoreClient.ts` | Added `ingestStakeholderSignals()`, `generateBriefing()`, `getBriefing()` + 12 typed interfaces |
| `server/services/PreEventBriefingService.ts` | Added AI Core briefing enrichment before LLM fallback; persists `ai_briefing_id` and `ai_briefing_results` to `scheduled_sessions` |

---

## Table: `aic_stakeholder_signals` (15 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organisation_id` | VARCHAR(128) | Indexed |
| `signal_type` | VARCHAR(64) | `analyst_note`, `media_snippet`, `shareholder_note`, `investor_note`, `observation` |
| `source_name` | VARCHAR(256) | Source name (e.g. "JP Morgan Research") |
| `source_url` | TEXT | Nullable |
| `author` | VARCHAR(256) | Nullable |
| `title` | VARCHAR(512) | Nullable |
| `content` | TEXT | Signal body text |
| `sentiment` | VARCHAR(32) | Auto-detected: `positive`, `negative`, `neutral`, `mixed` |
| `sentiment_score` | FLOAT | -1.0 to +1.0 |
| `topics` | JSONB | Auto-extracted topic tags |
| `relevance_score` | FLOAT | 0.0–1.0, default 0.5 |
| `signal_date` | TIMESTAMPTZ | Nullable, when signal occurred |
| `signal_metadata` | JSONB | Nullable, arbitrary metadata |
| `created_at` | TIMESTAMPTZ | Auto-generated |

## Table: `aic_briefings` (16 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `organisation_id` | VARCHAR(128) | Indexed |
| `event_id` | VARCHAR(256) | Nullable, indexed |
| `event_name` | VARCHAR(512) | Nullable |
| `event_type` | VARCHAR(64) | Nullable |
| `likely_topics` | JSONB | Array of topic entries with confidence |
| `pressure_points` | JSONB | Array of pressure points with severity |
| `sentiment_summary` | JSONB | Aggregated sentiment across signals |
| `predicted_questions` | JSONB | Array of predicted Q&A themes |
| `narrative_risk` | JSONB | Risk level, score, indicators |
| `signals_used` | INTEGER | Count of signals consumed |
| `commitments_referenced` | INTEGER | Count of open commitments |
| `drift_events_referenced` | INTEGER | Count of drift events |
| `confidence` | FLOAT | Overall briefing confidence |
| `duration_ms` | FLOAT | Generation time |
| `created_at` | TIMESTAMPTZ | Auto-generated |

---

## Endpoint Contracts

### `POST /api/stakeholder/ingest`

**Request:**
```json
{
  "signals": [
    {
      "organisation_id": "string",
      "signal_type": "analyst_note | media_snippet | shareholder_note | investor_note | observation",
      "source_name": "string",
      "source_url": "string | null",
      "author": "string | null",
      "title": "string | null",
      "content": "string (min 10 chars)",
      "sentiment": "string | null (auto-detected if omitted)",
      "topics": ["string"] | null (auto-extracted if omitted)",
      "relevance_score": 0.5,
      "signal_date": "ISO datetime | null",
      "metadata": {}
    }
  ]
}
```

**Response:**
```json
{
  "ingested": 5,
  "signals": [
    {
      "signal_id": "uuid",
      "organisation_id": "string",
      "signal_type": "analyst_note",
      "source_name": "JP Morgan Research",
      "sentiment": "negative",
      "sentiment_score": -0.33,
      "topics": ["revenue", "margins", "guidance"],
      "created_at": "ISO datetime"
    }
  ]
}
```

### `POST /api/stakeholder/query`

**Request:**
```json
{
  "organisation_id": "string",
  "signal_types": ["analyst_note"] | null,
  "limit": 50,
  "since": "ISO datetime | null"
}
```

### `POST /api/briefing/generate`

**Request:**
```json
{
  "organisation_id": "string",
  "event_id": "string | null",
  "event_name": "string | null",
  "event_type": "earnings_call | agm | investor_day | press_conference"
}
```

**Response:**
```json
{
  "briefing_id": "uuid",
  "organisation_id": "string",
  "event_id": "string | null",
  "event_name": "string | null",
  "likely_topics": [{"topic": "guidance", "confidence": 1.0, "source": "signal:Allan Gray", "detail": "..."}],
  "pressure_points": [{"area": "guidance", "severity": "high", "source": "signal:Coronation", "detail": "..."}],
  "sentiment_summary": {"overall": "neutral", "score": -0.13, "positive_signals": 0, "negative_signals": 2, "neutral_signals": 2, "key_themes": [...]},
  "predicted_questions": [{"question": "...", "likelihood": "high", "source": "...", "theme": "guidance", "rationale": "..."}],
  "narrative_risk": {"level": "low", "score": 0.13, "indicators": [...], "detail": "..."},
  "signals_used": 5,
  "commitments_referenced": 7,
  "drift_events_referenced": 0,
  "confidence": 0.64,
  "duration_ms": 13.5,
  "created_at": "ISO datetime"
}
```

### `GET /api/briefing/{briefing_id}`

Returns the same structure as the generation response.

---

## End-to-End Test Result

### Step 1: Signal Ingestion
Ingested 5 signals for organisation `-test-corp-`:

| # | Type | Source | Auto-Sentiment | Score | Topics |
|---|---|---|---|---|---|
| 1 | analyst_note | JP Morgan Research | negative | -0.33 | revenue, margins, guidance, expansion, risk |
| 2 | media_snippet | Bloomberg | neutral | 0.00 | compliance, esg |
| 3 | shareholder_note | Coronation Fund Managers | negative | -0.33 | guidance, expansion, dividend, leadership |
| 4 | investor_note | Allan Gray | neutral | 0.00 | guidance, risk, leadership, debt |
| 5 | observation | Internal IR Team | mixed | 0.00 | compliance, leadership, esg |

### Step 2: Briefing Generation

**Input:** organisation_id=`-test-corp-`, event_name=`Test Corp H2 FY26 Results`

**Output:**
- **8 likely topics**: guidance (1.00), compliance (0.29), leadership (0.29), expansion (0.29), margins (0.29), esg (0.19), risk (0.19), debt (0.10)
- **3 pressure points**: guidance [high], revenue [high], compliance [medium]
- **Sentiment**: neutral (score: -0.13), 0 positive / 2 negative / 2 neutral
- **6 predicted questions**: guidance (high), compliance (medium), leadership (medium), expansion (medium), margins (medium), esg (medium)
- **Narrative risk**: LOW (score: 0.13) — "Narrative appears broadly consistent. Limited coordinated risk."
- **Data sources**: 5 signals, 7 commitments, 0 drift events
- **Confidence**: 0.64
- **Duration**: 13.5ms

### Step 3: Briefing Retrieval
`GET /api/briefing/709801fa-...` — returned correct stored data.

---

## Example Pre-Event Briefing Output

```
=== PRE-EVENT BRIEFING ===
Briefing ID: 709801fa-a1b9-40f4-ab24-3ca30892711d
Organisation: -test-corp-
Event: Test Corp H2 FY26 Results
Confidence: 0.64

--- LIKELY TOPICS ---
  guidance        conf=1.00  (from: Allan Gray investor note)
  compliance      conf=0.29  (from: Internal IR Team observation)
  leadership      conf=0.29  (from: Internal IR Team observation)
  expansion       conf=0.29  (from: Coronation Fund Managers shareholder note)
  margins         conf=0.29  (from: JP Morgan Research analyst note)

--- PRESSURE POINTS ---
  [high  ] guidance: Coronation concerns on revised ROE targets & postponed expansion
  [high  ] revenue: JP Morgan downgrade — revenue deceleration, margin pressure
  [medium] compliance: Social media sentiment negative, IFRS transition concerns

--- PREDICTED QUESTIONS ---
  [high  ] Are you maintaining or revising your full-year guidance?
  [medium] What is the status of your regulatory compliance programme?
  [medium] Can you address management succession planning?
  [medium] What is the timeline for your expansion plans?
  [medium] What actions are being taken to protect margins?
  [medium] What progress has been made on ESG commitments?

--- NARRATIVE RISK ---
  Level: LOW (13%)
  Detail: Narrative appears broadly consistent. Limited coordinated risk.
  Indicators:
    - 2 negative stakeholder signals
    - 1 mixed-sentiment signals
```

---

## Node Integration

The `PreEventBriefingService.ts` now:
1. Checks AI Core health before each pre-event briefing
2. If available, calls `POST /api/briefing/generate` with the org ID
3. Persists `ai_briefing_id` and full `ai_briefing_results` JSONB to `scheduled_sessions`
4. Formats the structured briefing into HTML for the email
5. Falls back to LLM-only briefing if AI Core is unavailable or returns no topics

---

## Blockers

None. Phase 5 is complete and production-ready.
