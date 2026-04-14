import uuid
from uuid import UUID

from app.schemas.job import AnalysisJobResponse


class AnalysisOrchestrator:
    """Queue stub for module execution. Replace with Celery/RQ/Temporal later."""

    def enqueue(self, event_id: UUID, modules: list[str]) -> AnalysisJobResponse:
        return AnalysisJobResponse(job_id=uuid.uuid4(), status="queued", modules=modules)
