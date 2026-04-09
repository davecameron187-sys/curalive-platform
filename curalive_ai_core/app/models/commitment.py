import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CommitmentStatus(str, Enum):
    OPEN = "open"
    MONITORED = "monitored"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    SUPERSEDED = "superseded"
    EXPIRED = "expired"


class Commitment(Base):
    __tablename__ = "aic_commitments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('aic_events.id'), index=True)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    speaker_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    commitment_text: Mapped[str] = mapped_column(Text)
    extra_data: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    status: Mapped[CommitmentStatus] = mapped_column(SAEnum(CommitmentStatus), default=CommitmentStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
