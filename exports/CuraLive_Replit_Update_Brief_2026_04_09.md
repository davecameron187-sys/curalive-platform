# CuraLive — Replit Update Brief (9 April 2026)

## What was built this session

### 1. First Module aligned to DOCX brief

The Python AI Core (`curalive_ai_core/`) was rebuilt to match the exact file structure and code from the provided DOCX:

- `app/main.py` — FastAPI bootstrap with health route
- `app/api/routes/events.py` — Event ingestion endpoint
- `app/schemas/event_ingest.py` — Full Pydantic schemas (EventIngestRequest, EventIngestResponse, CanonicalEventModel, CanonicalSpeaker, CanonicalSegment, ParticipantRecord, TranscriptSegment, EventMetadata)
- `app/services/canonical_model.py` — CanonicalEventModelBuilder with speaker stats, word counts, role enrichment from participants
- `requirements.txt` — Pinned to fastapi==0.115.0, uvicorn==0.30.6, pydantic==2.9.2
- `README_FIRST_MODULE.md` — Run instructions and example payload

### 2. Phase 2 — Four AI analysis modules built and operational

All four modules accept a `CanonicalEventModel` and return structured dataclass results.

| Module | File | What it does |
|---|---|---|
| **Sentiment** | `app/services/sentiment.py` | Per-segment and per-speaker sentiment scoring using keyword analysis. Detects tone shifts (≥0.5 magnitude). Returns overall score, label, positive/negative signal counts. |
| **Engagement** | `app/services/engagement.py` | Gini-coefficient speaking balance index, share of voice per speaker, pace analysis (WPM with fast/slow segment detection), Q&A density scoring. Composite engagement score 0–100. |
| **Compliance Signals** | `app/services/compliance_signals.py` | Regex-based detection of forward-looking statements (20+ patterns), hedging language (15 patterns), regulatory triggers (20 patterns including IFRS, SEC, JSE, FSCA, King IV, SOX). Risk level: low/medium/high. |
| **Commitment Extraction** | `app/services/commitment_extraction.py` | Extracts explicit commitments with type classification (will_statement, explicit_commitment, target, stated_intention, etc.). Detects deadlines (year end, FY27, next quarter, relative periods). Identifies quantitative targets (percentages, monetary values). Confidence scoring 0.0–1.0. |

### 3. New endpoint

- `POST /api/analysis/run` — Accepts a canonical event + list of module names, runs selected modules, returns combined structured output with per-module status tracking (completed/failed).

### 4. New files created

- `app/services/sentiment.py`
- `app/services/engagement.py`
- `app/services/compliance_signals.py`
- `app/services/commitment_extraction.py`
- `app/schemas/analysis.py` (AnalysisRequest, AnalysisResponse, ModuleOutput)
- `app/api/routes/analysis.py`

### 5. End-to-end test results

Tested with a 5-segment, 2-speaker investor briefing payload:

- **Sentiment**: overall score 0.35 (positive), detected tone shift from positive to negative in risk discussion segment
- **Engagement**: score 56.5, speaking balance 0.86, 180 WPM overall pace
- **Compliance**: 12 flags detected (forward-looking, hedging, regulatory triggers), risk level "high"
- **Commitment extraction**: 6 commitments found — "15% EBITDA margin by year end" (confidence 0.85), "20% return on equity within 18 months" (confidence 0.95), etc.

### 6. What's ready for next step

The canonical event model flows cleanly into all four analysis services. The `/api/analysis/run` endpoint is the single entry point for running any combination of modules. The architecture is ready for:

- Phase 3 modules (commitment drift, stakeholder intelligence, governance records)
- Wiring the Node.js platform to call the Python AI Core's `/api/analysis/run` endpoint from the SessionClosePipeline
- Storing analysis outputs in the `aic_` database tables

**No blockers. No architecture changes made. All modules are incremental and testable.**
