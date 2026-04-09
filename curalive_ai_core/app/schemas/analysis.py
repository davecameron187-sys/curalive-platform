from __future__ import annotations

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
    event_id: str
    modules_requested: list[str]
    modules_completed: list[str]
    modules_failed: list[str] = Field(default_factory=list)
    outputs: list[ModuleOutput]
