import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
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
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    event_id: Mapped[str] = mapped_column(String(256), index=True)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    speaker_id: Mapped[str] = mapped_column(String(128))
    speaker_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    commitment_text: Mapped[str] = mapped_column(Text)
    full_segment_text: Mapped[str] = mapped_column(Text)
    commitment_type: Mapped[str] = mapped_column(String(64))
    deadline: Mapped[str | None] = mapped_column(String(128), nullable=True)
    has_quantitative_target: Mapped[bool] = mapped_column(default=False)
    quantitative_values: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    segment_index: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[CommitmentStatus] = mapped_column(SAEnum(CommitmentStatus, name="aic_commitment_status"), default=CommitmentStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
