from uuid import UUID

from sqlalchemy.orm import Session

from app.models.event import Event, EventStatus
from app.schemas.event import EventCreate
from app.services.canonical_model import CanonicalEventBuilder


class EventService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.builder = CanonicalEventBuilder()

    def create_event(self, payload: EventCreate) -> Event:
        canonical = self.builder.build({**payload.model_dump(), "source_platform": payload.source_platform})
        event = Event(
            organisation_id=payload.organisation_id,
            title=payload.title,
            event_type=payload.event_type,
            source_platform=payload.source_platform,
            scheduled_at=payload.scheduled_at,
            raw_payload=payload.raw_payload,
            canonical_event_model=canonical,
            status=EventStatus.NORMALIZED,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_event(self, event_id: UUID) -> Event | None:
        return self.db.get(Event, event_id)
