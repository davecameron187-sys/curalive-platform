from uuid import UUID

from fastapi import APIRouter

from app.schemas.job import AnalysisJobRequest, AnalysisJobResponse
from app.services.orchestrator import AnalysisOrchestrator

router = APIRouter()


@router.post("/analyze", response_model=AnalysisJobResponse)
def enqueue_analysis(payload: AnalysisJobRequest) -> AnalysisJobResponse:
    orchestrator = AnalysisOrchestrator()
    return orchestrator.enqueue(payload.event_id, payload.modules)
