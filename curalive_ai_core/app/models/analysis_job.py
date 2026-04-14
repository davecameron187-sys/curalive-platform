import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, Float, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    PARTIAL = "partial"
    ERROR = "error"


class AnalysisJob(Base):
    __tablename__ = "aic_analysis_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[str] = mapped_column(String(256), index=True)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    requested_modules: Mapped[list[str]] = mapped_column(ARRAY(String(64)))
    completed_modules: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    failed_modules: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    overall_status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus, name="aic_job_status"), default=JobStatus.QUEUED)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
