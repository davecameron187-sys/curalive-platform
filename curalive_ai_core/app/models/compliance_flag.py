import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ComplianceFlag(Base):
    __tablename__ = "aic_compliance_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    event_id: Mapped[str] = mapped_column(String(256), index=True)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    segment_index: Mapped[int] = mapped_column(Integer)
    speaker_id: Mapped[str] = mapped_column(String(128))
    speaker_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    flag_type: Mapped[str] = mapped_column(String(64), index=True)
    matched_pattern: Mapped[str] = mapped_column(String(256))
    severity: Mapped[str] = mapped_column(String(32))
    segment_text: Mapped[str] = mapped_column(Text)
    start_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
