from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class BriefingGenerateRequest(BaseModel):
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = Field(default="earnings_call", description="earnings_call, agm, investor_day, press_conference")


class TopicEntry(BaseModel):
    topic: str
    confidence: float
    source: str
    detail: str | None = None


class PressurePoint(BaseModel):
    area: str
    severity: str
    source: str
    detail: str


class SentimentSummary(BaseModel):
    overall: str
    score: float
    positive_signals: int
    negative_signals: int
    neutral_signals: int
    key_themes: list[str]


class PredictedQuestion(BaseModel):
    question: str
    likelihood: str
    source: str
    theme: str
    rationale: str


class NarrativeRisk(BaseModel):
    level: str
    score: float
    indicators: list[str]
    detail: str


class BenchmarkContextSchema(BaseModel):
    benchmark_segment: str = ""
    benchmark_event_count: int = 0
    benchmark_quality: str = "unknown"
    fallback_segment_used: str | None = None
    dimensions: dict[str, Any] = Field(default_factory=dict)
    benchmark_concerns: list[str] = Field(default_factory=list)
    benchmark_strengths: list[str] = Field(default_factory=list)


class BriefingResponse(BaseModel):
    briefing_id: str
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    likely_topics: list[TopicEntry]
    pressure_points: list[PressurePoint]
    sentiment_summary: SentimentSummary
    predicted_questions: list[PredictedQuestion]
    narrative_risk: NarrativeRisk
    benchmark_context: BenchmarkContextSchema | None = None
    signals_used: int
    commitments_referenced: int
    drift_events_referenced: int
    confidence: float
    duration_ms: float | None = None
    created_at: datetime | None = None


class BriefingRetrieveResponse(BaseModel):
    briefing_id: str
    organisation_id: str
    event_id: str | None = None
    event_name: str | None = None
    likely_topics: list[dict[str, Any]]
    pressure_points: list[dict[str, Any]]
    sentiment_summary: dict[str, Any]
    predicted_questions: list[dict[str, Any]]
    narrative_risk: dict[str, Any]
    signals_used: int
    commitments_referenced: int
    drift_events_referenced: int
    confidence: float
    duration_ms: float | None = None
    created_at: datetime
