# CuraLive — Replit Update Brief: Phase 4B — Drift in SessionClosePipeline (9 April 2026)

## Summary

Phase 4B complete. Commitment drift detection is now wired into the Node.js SessionClosePipeline. After AI Core analysis completes, the pipeline loads transcript segments, sends them to `POST /api/drift/run`, and persists drift status and results into `shadow_sessions`. The step is non-blocking — failures are logged and the pipeline continues.

---

## Node Files Changed

| File | What changed |
|---|---|
| `server/services/SessionClosePipeline.ts` | Added `runDriftDetectionStep()` function. Added import for `runAICoreDriftDetection` and drift types. Wired drift step after AI Core analysis block, gated on `aiCoreResult.overall_status === 'complete'`. |

No other files changed.

---

## Where Drift is Triggered in SessionClosePipeline

In `runSessionClosePipeline()`, immediately after the AI Core analysis step (line ~104):

```
1. Compliance email
2. AI Core analysis  ← runs 4 modules, persists results
3. Drift detection   ← NEW: triggered only if analysis completed
4. Legacy AI report
5. Report delivery
6. Board intelligence
7. Briefing accuracy
```

The drift step is wrapped in try/catch — if it fails, the error is logged and the pipeline continues to step 4.

---

## Where Drift Results are Stored in Node

Two new columns on `shadow_sessions` (added via ALTER TABLE):

| Column | Type | Values |
|---|---|---|
| `ai_drift_status` | VARCHAR(64) | `running` → `drift_detected` or `no_drift` |
| `ai_drift_results` | JSONB | Full drift response: `commitments_evaluated`, `statements_processed`, `drift_events_created`, `drift_events[]`, `duration_ms` |

---

## Example Request Payload Sent to /api/drift/run

```json
{
  "organisation_id": "test-corp",
  "event_id": "shadow-24",
  "job_id": "a9aa31ae-dc98-4c5b-8b77-f676f0cdef07",
  "statements": [
    {
      "text": "Good afternoon. Thank you for joining our H2 update. We have made progress on several fronts but face some headwinds.",
      "speaker_id": "sarah_chen",
      "speaker_name": "Sarah Chen",
      "source_type": "transcript",
      "source_reference": "session-24/segment-0",
      "timestamp": 0
    },
    {
      "text": "Revenue grew 8 percent year over year. However, our EBITDA margin target has been revised downward to 10 percent by year end due to cost pressures in our supply chain.",
      "speaker_id": "james_molefe",
      "speaker_name": "James Molefe",
      "source_type": "transcript",
      "source_reference": "session-24/segment-1",
      "timestamp": 6.5
    },
    {
      "text": "We will no longer pursue the IFRS transition targets this year due to regulatory complexity. Our compliance team is reassessing the timeline.",
      "speaker_id": "sarah_chen",
      "speaker_name": "Sarah Chen",
      "source_type": "transcript",
      "source_reference": "session-24/segment-2",
      "timestamp": 16.5
    },
    {
      "text": "We have decided to postpone the expansion into new jurisdictions until FY28 due to uncertain market conditions and competitive headwinds.",
      "speaker_id": "sarah_chen",
      "speaker_name": "Sarah Chen",
      "source_type": "transcript",
      "source_reference": "session-24/segment-3",
      "timestamp": 26.5
    },
    {
      "text": "Our return on equity target is now 12 percent rather than the previously stated 20 percent. We are taking a more conservative approach.",
      "speaker_id": "james_molefe",
      "speaker_name": "James Molefe",
      "source_type": "transcript",
      "source_reference": "session-24/segment-4",
      "timestamp": 36.5
    }
  ]
}
```

---

## End-to-End Test Result

### Setup
- Session 24 with 5 transcript segments contradicting prior H1 commitments
- Triggered via `shadowMode.endSession` tRPC mutation

### Node Logs
```
[SessionClose] Starting pipeline for session 24
[AICoreMapper] Loaded 5 segments from occ_transcription_segments
[AICoreMapper] Built payload: 2 speakers, 5 segments, 115 words
[AICoreClient] Running analysis for event shadow-24 (4 modules)
[AICoreClient] Analysis complete: job=a9aa31ae-... status=complete (81ms)
[SessionClose] Persisted AI Core results: job=a9aa31ae-..., modules=4/4
[SessionClose] AI Core analysis complete: job=a9aa31ae-... status=complete (104ms)
[AICoreClient] Running drift detection for org=test-corp (5 statements)
[AICoreClient] Drift detection complete: 4 drifts found across 2 commitments (17ms)
[SessionClose] Drift detection complete: 4 drifts across 2 commitments (11.9ms)
```

### Verification

**Node side (`shadow_sessions` id=24):**
- `ai_drift_status` = `drift_detected`
- `ai_drift_results` = 2,445 chars JSONB
- `commitments_evaluated` = 2
- `statements_processed` = 5
- `drift_events_created` = 4

**Python side (`aic_drift_events`):**
- 4 drift events persisted with `event_id=shadow-24`

### Drift Events Produced: 4

| # | Type | Severity | Confidence | Explanation |
|---|---|---|---|---|
| 1 | directional | high | 0.65 | Directional shift (downgrade): 'revised' detected near commitment-related language |
| 2 | directional | high | 0.65 | Directional shift (downgrade): 'revised' detected near commitment-related language |
| 3 | semantic | high | 0.70 | Statement contains 'no longer' in context related to EBITDA commitment |
| 4 | semantic | high | 0.70 | Statement contains 'no longer' in context related to IFRS commitment |

---

## Blockers

None. Phase 4B is complete and production-ready.
