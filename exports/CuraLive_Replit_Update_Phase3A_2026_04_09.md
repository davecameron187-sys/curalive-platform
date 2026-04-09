# CuraLive — Replit Update Brief: Phase 3A (9 April 2026)

## Summary

Phase 3A complete. All analysis outputs are now persisted to the database. Job retrieval endpoints added. Integration contract documented. No new AI modules added. No architecture changes.

---

## Files Created

| File | Purpose |
|---|---|
| `app/models/analysis_result.py` | New ORM model — `aic_analysis_results` table for per-module output storage |
| `app/models/compliance_flag.py` | New ORM model — `aic_compliance_flags` table for persisted compliance signals |
| `curalive_ai_core/docs/integration_contract.md` | Full JSON contract for Node.js SessionClosePipeline integration |

## Files Changed

| File | What changed |
|---|---|
| `app/models/analysis_job.py` | Added `organisation_id`, `completed_modules`, `failed_modules`, `overall_status` (5 states), `error_message`, `duration_ms`, `updated_at`. Changed `event_id` from UUID to String (matches canonical event_id format). |
| `app/models/commitment.py` | Rebuilt to match commitment extraction output — added `job_id`, `speaker_name`, `full_segment_text`, `commitment_type`, `deadline`, `has_quantitative_target`, `quantitative_values`, `confidence`, `segment_index`, `start_time`. Removed FK to `aic_events`. |
| `app/api/routes/analysis.py` | `/run` now persists job, results, commitments, and compliance flags to DB. Added `GET /jobs/{job_id}` and `GET /jobs/{job_id}/results`. |
| `app/schemas/analysis.py` | Added `job_id`, `organisation_id`, `overall_status`, `duration_ms`, `created_at` to `AnalysisResponse`. Added `JobSummaryResponse`, `JobResultsResponse`, `ErrorResponse`. |
| `app/main.py` | Restored DB lifespan handler for auto table creation on startup. Version bumped to 0.3.0. |

---

## Endpoints Added

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/analysis/jobs/{job_id}` | Retrieve job summary — status, timing, requested/completed/failed modules |
| `GET` | `/api/analysis/jobs/{job_id}/results` | Retrieve full module outputs from DB + commitment/flag persistence counts |

## Endpoints Changed

| Method | Path | What changed |
|---|---|---|
| `POST` | `/api/analysis/run` | Now persists everything to DB. Response includes `job_id`, `organisation_id`, `overall_status`, `duration_ms`, `created_at`. |

---

## Table Definitions

### `aic_analysis_jobs` (changed — 11 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `event_id` | VARCHAR(256) | Indexed |
| `organisation_id` | VARCHAR(128) | Indexed |
| `requested_modules` | TEXT[] | Modules requested |
| `completed_modules` | TEXT[] | Modules that succeeded |
| `failed_modules` | TEXT[] | Modules that failed |
| `overall_status` | ENUM | queued, running, complete, partial, error |
| `error_message` | TEXT | Null if no errors |
| `duration_ms` | FLOAT | Processing time |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `aic_analysis_results` (new — 8 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `job_id` | UUID | FK → aic_analysis_jobs.id, indexed |
| `event_id` | VARCHAR(256) | Indexed |
| `module_name` | VARCHAR(64) | Indexed (sentiment, engagement, etc.) |
| `status` | VARCHAR(32) | ok or error |
| `result_payload` | JSONB | Full module output |
| `error_message` | TEXT | Null if ok |
| `created_at` | TIMESTAMPTZ | |

### `aic_commitments` (changed — 17 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `job_id` | UUID | Indexed |
| `event_id` | VARCHAR(256) | Indexed |
| `organisation_id` | VARCHAR(128) | Indexed |
| `speaker_id` | VARCHAR(128) | |
| `speaker_name` | VARCHAR(256) | Nullable |
| `commitment_text` | TEXT | |
| `full_segment_text` | TEXT | |
| `commitment_type` | VARCHAR(64) | will_statement, explicit_commitment, target, etc. |
| `deadline` | VARCHAR(128) | Nullable — year end, FY27, 18 months, etc. |
| `has_quantitative_target` | BOOLEAN | |
| `quantitative_values` | TEXT[] | e.g. ["15%", "20%"] |
| `confidence` | FLOAT | 0.0–1.0 |
| `segment_index` | INTEGER | |
| `start_time` | FLOAT | Nullable — seconds from session start |
| `status` | ENUM | open, monitored, escalated, resolved, superseded, expired |
| `created_at` | TIMESTAMPTZ | |

### `aic_compliance_flags` (new — 13 columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `job_id` | UUID | Indexed |
| `event_id` | VARCHAR(256) | Indexed |
| `organisation_id` | VARCHAR(128) | Indexed |
| `segment_index` | INTEGER | |
| `speaker_id` | VARCHAR(128) | |
| `speaker_name` | VARCHAR(256) | Nullable |
| `flag_type` | VARCHAR(64) | Indexed — forward_looking_statement, hedging_language, regulatory_trigger |
| `matched_pattern` | VARCHAR(256) | Regex pattern that matched |
| `severity` | VARCHAR(32) | low, medium, high |
| `segment_text` | TEXT | |
| `start_time` | FLOAT | Nullable |
| `created_at` | TIMESTAMPTZ | |

---

## Test Results

### POST /api/analysis/run — full pipeline

- **Status**: complete
- **Duration**: 18.9ms
- **Modules**: 4/4 succeeded (sentiment, engagement, compliance_signals, commitment_extraction)
- **Persisted**: 6 commitments, 12 compliance flags, 4 analysis results, 1 job record

### GET /api/analysis/jobs/{job_id} — job retrieval

- Returns job summary with all metadata, timing, module lists
- 404 for non-existent jobs, 400 for invalid UUIDs

### GET /api/analysis/jobs/{job_id}/results — result retrieval

- Returns full module outputs from DB with persistence counts
- `commitments_persisted: 6`, `compliance_flags_persisted: 12`

### Error handling

- Unknown module → `overall_status: "partial"`, module listed in `modules_failed`
- Invalid job_id → 400 with `"Invalid job_id format"`
- Non-existent job → 404 with `"Job not found"`

---

## Integration Contract

Full JSON contract documented at `curalive_ai_core/docs/integration_contract.md`. Covers:

- Request format for `/api/analysis/run`
- Response format (success, partial, error)
- Validation error format (422)
- Job status values and transitions
- GET endpoint contracts
- Example Node.js integration pattern for SessionClosePipeline

---

## Blockers

None. Ready for Phase 3B or Node.js integration wiring.
