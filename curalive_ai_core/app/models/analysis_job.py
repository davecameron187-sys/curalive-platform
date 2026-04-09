import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"


class AnalysisJob(Base):
    __tablename__ = "aic_analysis_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    modules: Mapped[list[str]] = mapped_column(ARRAY(String(64)))
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.QUEUED)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
