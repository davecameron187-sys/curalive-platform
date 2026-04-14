from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    organisation_id: str = Field(..., max_length=128)
    title: str = Field(..., max_length=512)
    event_type: str = Field(..., max_length=128)
    source_platform: str = Field(..., max_length=128)
    scheduled_at: datetime | None = None
    raw_payload: dict


class EventRead(BaseModel):
    id: UUID
    organisation_id: str
    title: str
    event_type: str
    source_platform: str
    scheduled_at: datetime | None
    status: str
    canonical_event_model: dict | None

    model_config = {"from_attributes": True}
