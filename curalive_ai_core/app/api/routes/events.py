from fastapi import APIRouter, HTTPException

from app.schemas.event_ingest import EventIngestRequest, EventIngestResponse
from app.services.canonical_model import CanonicalEventModelBuilder

router = APIRouter()


@router.post("/ingest", response_model=EventIngestResponse)
async def ingest_event(payload: EventIngestRequest) -> EventIngestResponse:
    """
    Ingest raw event inputs and normalize them into the CuraLive canonical event model.
    """
    try:
        builder = CanonicalEventModelBuilder()
        canonical = builder.build(payload)
        return EventIngestResponse(
            status="ok",
            event_id=payload.event_id,
            canonical_event=canonical,
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))
