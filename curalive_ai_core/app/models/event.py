import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EventStatus(str, Enum):
    INGESTED = "ingested"
    NORMALIZED = "normalized"
    ANALYZING = "analyzing"
    COMPLETE = "complete"
    ERROR = "error"


class Event(Base):
    __tablename__ = "aic_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(512))
    event_type: Mapped[str] = mapped_column(String(128), index=True)
    source_platform: Mapped[str] = mapped_column(String(128))
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSONB)
    canonical_event_model: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[EventStatus] = mapped_column(SAEnum(EventStatus), default=EventStatus.INGESTED)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
