# CuraLive First Module

This module provides:
- FastAPI app bootstrap
- Event ingestion endpoint
- Canonical event normalization
- Structured canonical event model output

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Test

POST to:
`/api/events/ingest`

Example payload:

```json
{
  "event_id": "evt_001",
  "metadata": {
    "title": "Q2 Investor Briefing",
    "organisation_id": "org_curalive",
    "organisation_name": "CuraLive",
    "event_type": "investor_briefing",
    "jurisdiction": "ZA",
    "signal_source": "telephony"
  },
  "participants": [
    {
      "participant_id": "spk_001",
      "display_name": "Sarah Chen",
      "role": "CEO"
    },
    {
      "participant_id": "spk_002",
      "display_name": "James Molefe",
      "role": "CFO"
    }
  ],
  "transcript_segments": [
    {
      "speaker_id": "spk_001",
      "speaker_name": "Sarah Chen",
      "text": "Good morning everyone. Welcome to our Q2 investor briefing.",
      "start_time": 0.0,
      "end_time": 4.2,
      "confidence": 0.97
    },
    {
      "speaker_id": "spk_002",
      "speaker_name": "James Molefe",
      "text": "Thank you Sarah. Revenue grew 12% year over year driven by our expansion into new markets.",
      "start_time": 4.5,
      "end_time": 10.1,
      "confidence": 0.95
    },
    {
      "speaker_id": "spk_001",
      "speaker_name": "Sarah Chen",
      "text": "We remain committed to achieving a 15% EBITDA margin by year end.",
      "start_time": 10.5,
      "end_time": 15.0,
      "confidence": 0.98
    }
  ],
  "questions": [],
  "compliance_flags": []
}
```

Expected response includes canonical event model with speaker statistics, normalized segments, and word counts.
