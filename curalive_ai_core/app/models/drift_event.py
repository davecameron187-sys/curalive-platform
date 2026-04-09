import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DriftEvent(Base):
    __tablename__ = "aic_drift_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commitment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('aic_commitments.id'), index=True)
    organisation_id: Mapped[str] = mapped_column(String(128), index=True)
    inconsistency_type: Mapped[str] = mapped_column(String(128))
    severity: Mapped[str] = mapped_column(String(64))
    source_reference: Mapped[str] = mapped_column(Text)
    extra_data: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
