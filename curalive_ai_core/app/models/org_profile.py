import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OrgProfile(Base):
    __tablename__ = "aic_org_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    speaker_profiles: Mapped[dict] = mapped_column(JSONB, default=dict)
    compliance_risk_profile: Mapped[dict] = mapped_column(JSONB, default=dict)
    commitment_delivery_profile: Mapped[dict] = mapped_column(JSONB, default=dict)
    stakeholder_relationship_profile: Mapped[dict] = mapped_column(JSONB, default=dict)
    governance_trajectory_profile: Mapped[dict] = mapped_column(JSONB, default=dict)
    sector_context: Mapped[dict] = mapped_column(JSONB, default=dict)
    profile_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    events_incorporated: Mapped[int] = mapped_column(Integer, default=0)
    last_event_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
