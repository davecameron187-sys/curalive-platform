import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Benchmark(Base):
    __tablename__ = "aic_benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_key: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    segment_type: Mapped[str] = mapped_column(String(64))
    segment_value: Mapped[str] = mapped_column(String(256))
    event_count: Mapped[int] = mapped_column(Integer, default=0)
    organisation_count: Mapped[int] = mapped_column(Integer, default=0)
    compliance_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    commitment_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    drift_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    sentiment_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    governance_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    topic_baselines: Mapped[dict] = mapped_column(JSONB, default=dict)
    summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
