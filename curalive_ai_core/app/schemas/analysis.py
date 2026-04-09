from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.event_ingest import CanonicalEventModel


class AnalysisRequest(BaseModel):
    canonical_event: CanonicalEventModel
    modules: list[str] = Field(
        default_factory=lambda: ["sentiment", "engagement", "compliance_signals", "commitment_extraction"],
        description="Modules to run. Options: sentiment, engagement, compliance_signals, commitment_extraction",
    )


class ModuleOutput(BaseModel):
    module: str
    status: str = "ok"
    result: dict[str, Any]
    error: str | None = None


class AnalysisResponse(BaseModel):
    job_id: str
    event_id: str
    organisation_id: str
    overall_status: str
    modules_requested: list[str]
    modules_completed: list[str]
    modules_failed: list[str] = Field(default_factory=list)
    outputs: list[ModuleOutput]
    duration_ms: float | None = None
    created_at: datetime | None = None


class JobSummaryResponse(BaseModel):
    job_id: str
    event_id: str
    organisation_id: str
    overall_status: str
    requested_modules: list[str]
    completed_modules: list[str]
    failed_modules: list[str]
    duration_ms: float | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class JobResultsResponse(BaseModel):
    job_id: str
    event_id: str
    organisation_id: str
    overall_status: str
    modules: list[ModuleOutput]
    commitments_persisted: int = 0
    compliance_flags_persisted: int = 0


class ErrorResponse(BaseModel):
    status: str = "error"
    error: str
    detail: str | None = None
