import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GovernanceRecord(Base):
    __tablename__ = "aic_governance_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    event_id: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    event_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    record_type: Mapped[str] = mapped_column(String(64), default="full")
    meeting_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    commitment_register: Mapped[list] = mapped_column(JSONB, default=list)
    risk_compliance_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    matters_arising: Mapped[list] = mapped_column(JSONB, default=list)
    data_sources: Mapped[dict] = mapped_column(JSONB, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
