from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class BenchmarkBuildRequest(BaseModel):
    segment_type: str | None = None
    segment_value: str | None = None
    force_rebuild: bool = False


class ComplianceBaselines(BaseModel):
    total_flags: int = 0
    avg_flags_per_event: float = 0.0
    flags_by_type: dict[str, int] = Field(default_factory=dict)
    flags_by_severity: dict[str, int] = Field(default_factory=dict)
    high_flag_rate: float = 0.0
    most_common_type: str | None = None
    most_common_severity: str | None = None


class CommitmentBaselines(BaseModel):
    total_commitments: int = 0
    avg_commitments_per_event: float = 0.0
    commitments_by_type: dict[str, int] = Field(default_factory=dict)
    commitments_by_status: dict[str, int] = Field(default_factory=dict)
    avg_confidence: float = 0.0
    quantitative_target_rate: float = 0.0
    most_common_type: str | None = None


class DriftBaselines(BaseModel):
    total_drifts: int = 0
    avg_drifts_per_event: float = 0.0
    drifts_by_type: dict[str, int] = Field(default_factory=dict)
    drifts_by_severity: dict[str, int] = Field(default_factory=dict)
    drift_rate: float = 0.0
    avg_confidence: float = 0.0


class SentimentBaselines(BaseModel):
    total_signals: int = 0
    avg_signals_per_org: float = 0.0
    sentiment_distribution: dict[str, int] = Field(default_factory=dict)
    avg_sentiment_score: float = 0.0
    signals_by_type: dict[str, int] = Field(default_factory=dict)
    top_sources: list[str] = Field(default_factory=list)
    top_themes: list[str] = Field(default_factory=list)


class GovernanceBaselines(BaseModel):
    total_records: int = 0
    avg_confidence: float = 0.0
    risk_level_distribution: dict[str, int] = Field(default_factory=dict)
    avg_matters_arising: float = 0.0
    avg_flags_per_record: float = 0.0
    most_common_risk_level: str | None = None


class TopicBaselines(BaseModel):
    topic_frequency: dict[str, int] = Field(default_factory=dict)
    top_topics: list[str] = Field(default_factory=list)
    topic_count: int = 0


class BenchmarkSummary(BaseModel):
    segment_key: str
    segment_type: str
    segment_value: str
    event_count: int = 0
    organisation_count: int = 0
    avg_flags_per_event: float = 0.0
    avg_commitments_per_event: float = 0.0
    drift_rate: float = 0.0
    avg_sentiment_score: float = 0.0
    avg_governance_confidence: float = 0.0
    most_common_risk_level: str | None = None
    top_topics: list[str] = Field(default_factory=list)
    confidence: float = 0.0


class BenchmarkResponse(BaseModel):
    benchmark_id: str
    segment_key: str
    segment_type: str
    segment_value: str
    event_count: int
    organisation_count: int
    compliance_baselines: ComplianceBaselines
    commitment_baselines: CommitmentBaselines
    drift_baselines: DriftBaselines
    sentiment_baselines: SentimentBaselines
    governance_baselines: GovernanceBaselines
    topic_baselines: TopicBaselines
    summary: BenchmarkSummary
    confidence: float
    version: int
    duration_ms: float | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BenchmarkBuildResponse(BaseModel):
    benchmarks_built: int
    segments: list[BenchmarkResponse]
    duration_ms: float


class BenchmarkRetrieveResponse(BaseModel):
    benchmark_id: str
    segment_key: str
    segment_type: str
    segment_value: str
    event_count: int
    organisation_count: int
    compliance_baselines: dict[str, Any]
    commitment_baselines: dict[str, Any]
    drift_baselines: dict[str, Any]
    sentiment_baselines: dict[str, Any]
    governance_baselines: dict[str, Any]
    topic_baselines: dict[str, Any]
    summary: dict[str, Any]
    confidence: float
    version: int
    created_at: datetime
    updated_at: datetime


class BenchmarkListResponse(BaseModel):
    benchmarks: list[BenchmarkRetrieveResponse]
    total: int


class SectorEnrichmentRequest(BaseModel):
    organisation_id: str
    apply: bool = False


class SectorEnrichmentResponse(BaseModel):
    organisation_id: str
    sector_context: dict[str, Any]
    benchmark_comparison: dict[str, Any]
    profile_summary_updates: dict[str, Any] | None = None
    applied: bool = False
    duration_ms: float
