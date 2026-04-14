from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SegmentInput(BaseModel):
    speaker_id: str | None = None
    speaker_name: str | None = None
    text: str = ""
    start_time: float | None = None
    word_count: int | None = None


class GovernanceGenerateRequest(BaseModel):
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = Field(default="earnings_call")
    event_date: datetime | None = None
    analysis_job_id: str | None = None
    briefing_id: str | None = None
    segments: list[SegmentInput] = Field(default_factory=list)
    include_matters_arising: bool = True


class MeetingSummarySchema(BaseModel):
    title: str
    date: str | None = None
    event_type: str | None = None
    duration: str | None = None
    total_speakers: int = 0
    total_segments: int = 0
    key_topics: list[str] = Field(default_factory=list)
    executive_summary: str = ""
    speaker_contributions: list[dict[str, Any]] = Field(default_factory=list)


class CommitmentRegisterEntry(BaseModel):
    commitment_id: str
    speaker: str | None = None
    commitment_text: str
    commitment_type: str
    deadline: str | None = None
    has_quantitative_target: bool = False
    quantitative_values: list[str] = Field(default_factory=list)
    status: str = "open"
    confidence: float = 0.0
    drift_detected: bool = False
    drift_details: dict[str, Any] | None = None


class ComplianceFlagEntry(BaseModel):
    flag_id: str
    flag_type: str
    severity: str
    speaker: str | None = None
    matched_pattern: str
    segment_text: str


class RiskComplianceSummary(BaseModel):
    total_flags: int = 0
    critical_flags: int = 0
    high_flags: int = 0
    medium_flags: int = 0
    low_flags: int = 0
    flags: list[ComplianceFlagEntry] = Field(default_factory=list)
    drift_summary: dict[str, Any] = Field(default_factory=dict)
    narrative_risk: dict[str, Any] = Field(default_factory=dict)
    overall_risk_level: str = "low"


class MattersArisingEntry(BaseModel):
    source: str
    reference_type: str
    reference_id: str | None = None
    description: str
    status: str = "open"
    original_event: str | None = None
    current_position: str | None = None
    severity: str = "medium"


class DataSourcesSchema(BaseModel):
    analysis_job_id: str | None = None
    briefing_id: str | None = None
    commitments_count: int = 0
    compliance_flags_count: int = 0
    drift_events_count: int = 0
    signals_count: int = 0
    segments_count: int = 0


class GovernanceRecordResponse(BaseModel):
    governance_record_id: str
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = None
    event_date: datetime | None = None
    record_type: str
    meeting_summary: MeetingSummarySchema
    commitment_register: list[CommitmentRegisterEntry]
    risk_compliance_summary: RiskComplianceSummary
    matters_arising: list[MattersArisingEntry]
    data_sources: DataSourcesSchema
    confidence: float
    duration_ms: float | None = None
    created_at: datetime | None = None


class GovernanceRetrieveResponse(BaseModel):
    governance_record_id: str
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = None
    event_date: datetime | None = None
    record_type: str
    meeting_summary: dict[str, Any]
    commitment_register: list[dict[str, Any]]
    risk_compliance_summary: dict[str, Any]
    matters_arising: list[dict[str, Any]]
    data_sources: dict[str, Any]
    confidence: float
    duration_ms: float | None = None
    created_at: datetime
