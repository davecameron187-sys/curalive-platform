# CuraLive AI Core — Node.js Integration Contract

Version: 1.0
Date: 2026-04-09

This document defines the JSON contract for the Node.js SessionClosePipeline to call the Python AI Core analysis service.

---

## Base URL

```
http://localhost:5000
```

---

## 1. Run Analysis

### Request

```
POST /api/analysis/run
Content-Type: application/json
```

```json
{
  "canonical_event": {
    "event_id": "string (required — unique event identifier)",
    "title": "string (required)",
    "organisation_id": "string (required)",
    "organisation_name": "string | null",
    "event_type": "string (required — e.g. earnings_call, agm, investor_briefing)",
    "jurisdiction": "string | null (e.g. ZA, UK, US)",
    "signal_source": "string (default: manual — options: telephony, webcast, video, manual, hybrid)",
    "speakers": [
      {
        "speaker_id": "string (required)",
        "display_name": "string | null",
        "role": "string | null",
        "segment_count": "integer",
        "total_words": "integer"
      }
    ],
    "segments": [
      {
        "speaker_id": "string (required)",
        "speaker_name": "string | null",
        "text": "string (required)",
        "start_time": "float | null (seconds from session start)",
        "end_time": "float | null",
        "word_count": "integer"
      }
    ],
    "total_segments": "integer",
    "total_words": "integer",
    "total_speakers": "integer",
    "questions": [
      {
        "asker_id": "string",
        "text": "string"
      }
    ],
    "compliance_flags": []
  },
  "modules": ["sentiment", "engagement", "compliance_signals", "commitment_extraction"]
}
```

### Response (Success — 200)

```json
{
  "job_id": "uuid string",
  "event_id": "string",
  "organisation_id": "string",
  "overall_status": "complete | partial | error",
  "modules_requested": ["sentiment", "engagement", "compliance_signals", "commitment_extraction"],
  "modules_completed": ["sentiment", "engagement", "compliance_signals", "commitment_extraction"],
  "modules_failed": [],
  "outputs": [
    {
      "module": "sentiment",
      "status": "ok",
      "result": { "...sentiment result object..." },
      "error": null
    },
    {
      "module": "engagement",
      "status": "ok",
      "result": { "...engagement result object..." },
      "error": null
    },
    {
      "module": "compliance_signals",
      "status": "ok",
      "result": { "...compliance result object..." },
      "error": null
    },
    {
      "module": "commitment_extraction",
      "status": "ok",
      "result": { "...commitment result object..." },
      "error": null
    }
  ],
  "duration_ms": 18.9,
  "created_at": "2026-04-09T16:29:14.974747Z"
}
```

### Response (Partial — 200, some modules failed)

```json
{
  "job_id": "uuid string",
  "event_id": "string",
  "organisation_id": "string",
  "overall_status": "partial",
  "modules_requested": ["sentiment", "fake_module"],
  "modules_completed": ["sentiment"],
  "modules_failed": ["fake_module"],
  "outputs": [
    {
      "module": "sentiment",
      "status": "ok",
      "result": { "..." },
      "error": null
    },
    {
      "module": "fake_module",
      "status": "error",
      "result": {},
      "error": "Unknown module: fake_module"
    }
  ],
  "duration_ms": 5.2,
  "created_at": "2026-04-09T16:30:00.000000Z"
}
```

### Response (Validation Error — 422)

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "canonical_event", "event_id"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

---

## 2. Get Job Summary

### Request

```
GET /api/analysis/jobs/{job_id}
```

### Response (200)

```json
{
  "job_id": "80f0ca39-075e-4b48-b156-3ab6be3eaaf5",
  "event_id": "evt_001",
  "organisation_id": "org_curalive",
  "overall_status": "complete",
  "requested_modules": ["sentiment", "engagement", "compliance_signals", "commitment_extraction"],
  "completed_modules": ["sentiment", "engagement", "compliance_signals", "commitment_extraction"],
  "failed_modules": [],
  "duration_ms": 18.9,
  "error_message": null,
  "created_at": "2026-04-09T16:29:14.974747Z",
  "updated_at": "2026-04-09T16:29:14.987680Z"
}
```

### Response (404)

```json
{
  "detail": "Job not found"
}
```

### Response (400 — invalid UUID)

```json
{
  "detail": "Invalid job_id format"
}
```

---

## 3. Get Job Results (full module outputs)

### Request

```
GET /api/analysis/jobs/{job_id}/results
```

### Response (200)

```json
{
  "job_id": "80f0ca39-075e-4b48-b156-3ab6be3eaaf5",
  "event_id": "evt_001",
  "organisation_id": "org_curalive",
  "overall_status": "complete",
  "modules": [
    {
      "module": "sentiment",
      "status": "ok",
      "result": { "...full sentiment result..." },
      "error": null
    }
  ],
  "commitments_persisted": 6,
  "compliance_flags_persisted": 12
}
```

---

## 4. Job Status Values

| Status | Meaning |
|---|---|
| `queued` | Job created, not yet started (reserved for future async) |
| `running` | Analysis in progress |
| `complete` | All requested modules succeeded |
| `partial` | Some modules succeeded, some failed |
| `error` | All modules failed |

---

## 5. Available Modules

| Module Key | Description |
|---|---|
| `sentiment` | Per-segment and per-speaker sentiment analysis with tone shift detection |
| `engagement` | Speaking balance, share of voice, pace analysis, Q&A density scoring |
| `compliance_signals` | Forward-looking statements, hedging language, regulatory trigger detection |
| `commitment_extraction` | Commitment extraction with deadline, quantitative target, and confidence scoring |

---

## 6. Persistence Side Effects

When `/api/analysis/run` completes:

- **aic_analysis_jobs**: 1 row per run (job metadata, status, timing)
- **aic_analysis_results**: 1 row per module per run (full result payload as JSONB)
- **aic_commitments**: 1 row per extracted commitment (from `commitment_extraction` module)
- **aic_compliance_flags**: 1 row per detected flag (from `compliance_signals` module)

All records are linked by `job_id` and indexed by `event_id` and `organisation_id`.

---

## 7. Node.js Integration Pattern

```typescript
// In SessionClosePipeline.ts
const response = await fetch('http://localhost:5000/api/analysis/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    canonical_event: {
      event_id: `shadow-${sessionId}`,
      title: sessionTitle,
      organisation_id: organisationId,
      organisation_name: companyName,
      event_type: eventType,
      jurisdiction: jurisdiction,
      signal_source: 'telephony',
      speakers: buildSpeakers(transcriptSegments),
      segments: buildSegments(transcriptSegments),
      total_segments: transcriptSegments.length,
      total_words: countWords(transcriptSegments),
      total_speakers: uniqueSpeakers.length,
      questions: questions,
      compliance_flags: [],
    },
    modules: ['sentiment', 'engagement', 'compliance_signals', 'commitment_extraction'],
  }),
});

const result = await response.json();

if (result.overall_status === 'complete') {
  // All modules succeeded — store job_id for later retrieval
  await storeJobReference(sessionId, result.job_id);
} else if (result.overall_status === 'partial') {
  // Some modules failed — check modules_failed array
  console.warn('Partial analysis:', result.modules_failed);
} else {
  // All failed
  console.error('Analysis failed:', result);
}
```

---

## 8. Health Check

```
GET /health
```

```json
{"status": "ok"}
```

Use this to verify the AI Core service is available before sending analysis requests.
