from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProfileUpdateRequest(BaseModel):
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = None
    force_rebuild: bool = False


class SpeakerProfileEntry(BaseModel):
    speaker_name: str
    events_seen: int = 0
    total_words: int = 0
    total_segments: int = 0
    avg_share_pct: float = 0.0
    roles_observed: list[str] = Field(default_factory=list)
    commitment_count: int = 0
    flag_count: int = 0
    last_seen_event: str | None = None


class ComplianceRiskProfileSchema(BaseModel):
    total_flags_historical: int = 0
    flags_by_type: dict[str, int] = Field(default_factory=dict)
    flags_by_severity: dict[str, int] = Field(default_factory=dict)
    avg_flags_per_event: float = 0.0
    risk_trend: str = "stable"
    latest_risk_level: str = "low"


class CommitmentDeliveryProfileSchema(BaseModel):
    total_commitments: int = 0
    commitments_by_status: dict[str, int] = Field(default_factory=dict)
    commitments_by_type: dict[str, int] = Field(default_factory=dict)
    total_drifts: int = 0
    drifts_by_type: dict[str, int] = Field(default_factory=dict)
    drift_rate: float = 0.0
    delivery_reliability: str = "unknown"
    avg_confidence: float = 0.0


class StakeholderRelationshipProfileSchema(BaseModel):
    total_signals: int = 0
    signals_by_type: dict[str, int] = Field(default_factory=dict)
    sentiment_distribution: dict[str, int] = Field(default_factory=dict)
    avg_sentiment_score: float = 0.0
    top_sources: list[str] = Field(default_factory=list)
    key_themes: list[str] = Field(default_factory=list)
    relationship_health: str = "unknown"


class GovernanceTrajectoryProfileSchema(BaseModel):
    total_records: int = 0
    avg_confidence: float = 0.0
    latest_risk_level: str = "low"
    risk_level_history: list[dict[str, Any]] = Field(default_factory=list)
    key_topics_frequency: dict[str, int] = Field(default_factory=dict)
    avg_matters_arising: float = 0.0
    governance_quality: str = "unknown"


class SectorContextSchema(BaseModel):
    sector: str = "unclassified"
    sub_sector: str | None = None
    jurisdiction: str | None = None
    regulatory_framework: str | None = None
    notes: str = "Sector context will be enriched in future phases."
    benchmark_segment: str | None = None
    benchmark_quality: str | None = None
    compliance_position: str | None = None
    commitment_position: str | None = None
    drift_position: str | None = None
    sentiment_position: str | None = None
    governance_position: str | None = None
    enrichment_source: str | None = None
    enrichment_timestamp: str | None = None


class ProfileSummarySchema(BaseModel):
    organisation_id: str
    events_incorporated: int = 0
    overall_risk_level: str = "low"
    delivery_reliability: str = "unknown"
    relationship_health: str = "unknown"
    governance_quality: str = "unknown"
    key_concerns: list[str] = Field(default_factory=list)
    key_strengths: list[str] = Field(default_factory=list)
    confidence: float = 0.0


class ProfileResponse(BaseModel):
    profile_id: str
    organisation_id: str
    speaker_profiles: dict[str, Any]
    compliance_risk_profile: ComplianceRiskProfileSchema
    commitment_delivery_profile: CommitmentDeliveryProfileSchema
    stakeholder_relationship_profile: StakeholderRelationshipProfileSchema
    governance_trajectory_profile: GovernanceTrajectoryProfileSchema
    sector_context: SectorContextSchema
    profile_summary: ProfileSummarySchema
    events_incorporated: int
    last_event_id: str | None
    confidence: float
    version: int
    duration_ms: float | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProfileRetrieveResponse(BaseModel):
    profile_id: str
    organisation_id: str
    speaker_profiles: dict[str, Any]
    compliance_risk_profile: dict[str, Any]
    commitment_delivery_profile: dict[str, Any]
    stakeholder_relationship_profile: dict[str, Any]
    governance_trajectory_profile: dict[str, Any]
    sector_context: dict[str, Any]
    profile_summary: dict[str, Any]
    events_incorporated: int
    last_event_id: str | None
    confidence: float
    version: int
    created_at: datetime
    updated_at: datetime


class ProfileSummaryResponse(BaseModel):
    organisation_id: str
    profile_summary: ProfileSummarySchema
    events_incorporated: int
    last_event_id: str | None
    confidence: float
    version: int
    updated_at: datetime
