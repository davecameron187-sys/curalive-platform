from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class StakeholderSignalInput(BaseModel):
    organisation_id: str
    signal_type: str = Field(..., description="analyst_note, media_snippet, shareholder_note, investor_note, observation")
    source_name: str = Field(..., description="Name of the source (e.g. 'Bloomberg', 'JP Morgan Research')")
    source_url: str | None = None
    author: str | None = None
    title: str | None = None
    content: str = Field(..., min_length=10)
    sentiment: str | None = Field(default=None, description="positive, negative, neutral, mixed")
    topics: list[str] | None = None
    relevance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    signal_date: datetime | None = None
    metadata: dict[str, Any] | None = None


class StakeholderSignalBatchRequest(BaseModel):
    signals: list[StakeholderSignalInput] = Field(..., min_length=1)


class StakeholderSignalResponse(BaseModel):
    signal_id: str
    organisation_id: str
    signal_type: str
    source_name: str
    sentiment: str | None
    sentiment_score: float | None
    topics: list[str] | None
    created_at: datetime


class StakeholderSignalBatchResponse(BaseModel):
    ingested: int
    signals: list[StakeholderSignalResponse]


class StakeholderSignalQueryRequest(BaseModel):
    organisation_id: str
    signal_types: list[str] | None = None
    limit: int = Field(default=50, ge=1, le=500)
    since: datetime | None = None


class StakeholderSignalQueryResponse(BaseModel):
    organisation_id: str
    total: int
    signals: list[StakeholderSignalResponse]
