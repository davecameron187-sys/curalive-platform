import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "aic_briefings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    event_id: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    event_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    likely_topics: Mapped[list] = mapped_column(JSONB, default=list)
    pressure_points: Mapped[list] = mapped_column(JSONB, default=list)
    sentiment_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    predicted_questions: Mapped[list] = mapped_column(JSONB, default=list)
    narrative_risk: Mapped[dict] = mapped_column(JSONB, default=dict)
    signals_used: Mapped[int] = mapped_column(Integer, default=0)
    commitments_referenced: Mapped[int] = mapped_column(Integer, default=0)
    drift_events_referenced: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
