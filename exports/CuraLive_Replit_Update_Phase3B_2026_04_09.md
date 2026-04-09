# CuraLive — Replit Update Brief: Phase 3B (9 April 2026)

## Summary

Phase 3B complete. The Node.js SessionClosePipeline is now wired to the Python AI Core. On session close, the pipeline assembles a canonical event payload from transcript data, sends it to the Python service, and persists the job_id and full analysis results back into the Node database. A reusable client and payload mapper were built. End-to-end tested successfully.

---

## Node Files Created

| File | Purpose |
|---|---|
| `server/services/AICoreClient.ts` | Reusable HTTP client for all Python AI Core calls — `checkAICoreHealth()`, `runAICoreAnalysis()`, `getAICoreJobSummary()`, `getAICoreJobResults()`. Fully typed interfaces for all request/response shapes. |
| `server/services/AICorePayloadMapper.ts` | Maps Node session/transcript data into the Python canonical event format. Loads segments from `occ_transcription_segments` (primary) or `local_transcript_json` (fallback). Builds speaker map, normalises IDs, maps platform to signal_source, loads Q&A questions. |

## Node Files Changed

| File | What changed |
|---|---|
| `server/services/SessionClosePipeline.ts` | Added `runAICoreAnalysisStep()` — called after compliance email, before legacy AI report. Health-checks AI Core first. Maps session to canonical payload. Calls `POST /api/analysis/run`. Persists `ai_core_job_id`, `ai_core_status`, and full `ai_core_results` JSONB to `shadow_sessions`. Gracefully falls back if AI Core is unavailable. |

## Python Endpoints Used

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Pre-flight check before analysis |
| `POST` | `/api/analysis/run` | Run all 4 analysis modules |
| `GET` | `/api/analysis/jobs/{job_id}` | Available for status polling |
| `GET` | `/api/analysis/jobs/{job_id}/results` | Available for result retrieval |

## Database Changes

### shadow_sessions — 3 columns added (via ALTER TABLE)

| Column | Type | Purpose |
|---|---|---|
| `ai_core_job_id` | VARCHAR(128) | UUID of the Python AI Core analysis job |
| `ai_core_status` | VARCHAR(64) | Job status: `running`, `complete`, `partial`, `error` |
| `ai_core_results` | JSONB | Full analysis outputs from all completed modules |

---

## Where SessionClosePipeline Triggers Python

In `server/services/SessionClosePipeline.ts`, the `runAICoreAnalysisStep()` function is called:
- **After** compliance email processing
- **Before** the legacy `generateAIReport()` call
- Wrapped in try/catch — if AI Core fails, the legacy pipeline continues unaffected

Flow:
1. `checkAICoreHealth()` → verifies Python service is available
2. `buildCanonicalPayload(sessionId, session)` → loads transcript segments from `occ_transcription_segments`, builds speaker map, normalises to canonical format
3. `runAICoreAnalysis(payload)` → POST to `/api/analysis/run` with 4 modules
4. Persists `job_id`, `status`, and full results JSONB to `shadow_sessions`

## How job_id is Stored

- `shadow_sessions.ai_core_job_id` — UUID string from the Python response
- `shadow_sessions.ai_core_status` — mirrors `overall_status` from response
- `shadow_sessions.ai_core_results` — full JSONB containing all module outputs, keyed by module name

## How Result Polling/Retrieval Works

The Node client exposes two retrieval functions:
- `getAICoreJobSummary(jobId)` → `GET /api/analysis/jobs/{job_id}` — returns job metadata, timing, module lists
- `getAICoreJobResults(jobId)` → `GET /api/analysis/jobs/{job_id}/results` — returns full module outputs + persistence counts

These are available for any downstream service or router to call using the stored `ai_core_job_id`.

## Where Outputs are Stored in Node

- **Immediate**: `shadow_sessions.ai_core_results` — JSONB containing the full output from all 4 modules (sentiment, engagement, compliance_signals, commitment_extraction)
- **Python-side persistence**: `aic_analysis_jobs`, `aic_analysis_results`, `aic_commitments`, `aic_compliance_flags` — all linked by `job_id` and queryable via API

---

## End-to-End Test Result

### Test Setup
- Created session 23 with 5 transcript segments (2 speakers: Sarah Chen CEO, James Molefe CFO)
- Triggered via `shadowMode.endSession` tRPC mutation

### Node Logs
```
[SessionClose] Starting pipeline for session 23
[AICoreMapper] Loaded 5 segments from occ_transcription_segments
[AICoreMapper] Built payload: 2 speakers, 5 segments, 130 words
[AICoreClient] Running analysis for event shadow-23 (4 modules)
[AICoreClient] Analysis complete: job=aa2a78e9-... status=complete (32ms)
[SessionClose] Persisted AI Core results: job=aa2a78e9-..., modules=4/4
[SessionClose] AI Core analysis complete: job=aa2a78e9-... status=complete (61ms)
```

### Python Logs
```
GET /health → 200 OK
POST /api/analysis/run → 200 OK
```

### Verification
- **Node side** (`shadow_sessions`): `ai_core_job_id` = `aa2a78e9-...`, `ai_core_status` = `complete`, `ai_core_results` = 12,979 chars of JSONB
- **Python side**: 4 analysis results (all ok), 7 commitments persisted, 13 compliance flags persisted
- **API retrieval**: Both `GET /jobs/{id}` and `GET /jobs/{id}/results` return correct data

### Timing
- Total pipeline: 61ms (including health check + payload mapping + analysis + persistence)
- Python analysis only: 5.9ms
- Network round-trip overhead: ~26ms

---

## Blockers

None. The integration is live and production-ready. Ready for:
- Phase 3 modules (commitment drift, stakeholder intelligence, governance records)
- Exposing `ai_core_results` in Shadow Mode UI or report views
- Connecting the Python analysis to the existing `archive_events.ai_report` structure
