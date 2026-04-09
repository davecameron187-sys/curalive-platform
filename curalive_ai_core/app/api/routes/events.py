from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.event import EventCreate, EventRead
from app.services.event_service import EventService

router = APIRouter()


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db)) -> EventRead:
    service = EventService(db)
    return service.create_event(payload)


@router.post("/ingest", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def ingest_event(payload: EventCreate, db: Session = Depends(get_db)) -> EventRead:
    service = EventService(db)
    return service.create_event(payload)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: UUID, db: Session = Depends(get_db)) -> EventRead:
    service = EventService(db)
    event = service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
