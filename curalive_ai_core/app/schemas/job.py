from uuid import UUID

from pydantic import BaseModel


class AnalysisJobRequest(BaseModel):
    event_id: UUID
    modules: list[str]


class AnalysisJobResponse(BaseModel):
    job_id: UUID
    status: str
    modules: list[str]
