from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SourceStatement(BaseModel):
    text: str = Field(..., description="The text of the statement to compare against open commitments")
    speaker_id: str | None = Field(default=None, description="Speaker who made this statement")
    speaker_name: str | None = Field(default=None, description="Display name of the speaker")
    source_type: str = Field(default="transcript", description="Origin: transcript, filing, press_release, manual")
    source_reference: str = Field(default="", description="Free-text reference (e.g. segment index, document name)")
    timestamp: float | None = Field(default=None, description="Optional timestamp within source")


class DriftRunRequest(BaseModel):
    organisation_id: str = Field(..., description="Organisation to load open commitments for")
    event_id: str | None = Field(default=None, description="Optional event_id to associate drift events with")
    job_id: str | None = Field(default=None, description="Optional analysis job_id to link drift events to")
    statements: list[SourceStatement] = Field(..., min_length=1, description="One or more statements to compare against open commitments")


class DriftEventSummary(BaseModel):
    drift_event_id: str
    commitment_id: str
    commitment_text: str
    drift_type: str
    severity: str
    matched_text: str
    explanation: str
    confidence: float
    source_type: str
    source_reference: str


class DriftRunResponse(BaseModel):
    organisation_id: str
    event_id: str | None = None
    commitments_evaluated: int
    statements_processed: int
    drift_events_created: int
    drift_events: list[DriftEventSummary]
    duration_ms: float | None = None


class DriftErrorResponse(BaseModel):
    status: str = "error"
    error: str
    detail: str | None = None
