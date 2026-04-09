from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SignalSource = Literal["telephony", "webcast", "video", "manual", "hybrid"]


class ParticipantRecord(BaseModel):
    participant_id: str = Field(..., description="Unique participant identifier from source system.")
    display_name: str | None = None
    email: str | None = None
    role: str | None = None
    joined_at: str | None = None
    left_at: str | None = None


class TranscriptSegment(BaseModel):
    speaker_id: str = Field(..., description="Participant identifier who spoke this segment.")
    speaker_name: str | None = None
    text: str = Field(..., description="Transcript text content.")
    start_time: float | None = Field(None, description="Segment start in seconds from session start.")
    end_time: float | None = Field(None, description="Segment end in seconds from session start.")
    confidence: float | None = Field(None, ge=0.0, le=1.0, description="ASR confidence score.")
    language: str | None = None


class EventMetadata(BaseModel):
    title: str = Field(..., description="Event title.")
    organisation_id: str = Field(..., description="Organisation identifier.")
    organisation_name: str | None = None
    event_type: str = Field(..., description="Event type (e.g. earnings_call, agm, investor_briefing).")
    jurisdiction: str | None = None
    scheduled_at: str | None = None
    signal_source: SignalSource = "manual"


class EventIngestRequest(BaseModel):
    event_id: str = Field(..., description="Unique event identifier from source system.")
    metadata: EventMetadata
    participants: list[ParticipantRecord] = Field(default_factory=list)
    transcript_segments: list[TranscriptSegment] = Field(default_factory=list)
    questions: list[dict] = Field(default_factory=list)
    compliance_flags: list[dict] = Field(default_factory=list)
    raw_payload: dict | None = None


class CanonicalSpeaker(BaseModel):
    speaker_id: str
    display_name: str | None = None
    role: str | None = None
    segment_count: int = 0
    total_words: int = 0


class CanonicalSegment(BaseModel):
    speaker_id: str
    speaker_name: str | None = None
    text: str
    start_time: float | None = None
    end_time: float | None = None
    word_count: int = 0


class CanonicalEventModel(BaseModel):
    event_id: str
    title: str
    organisation_id: str
    organisation_name: str | None = None
    event_type: str
    jurisdiction: str | None = None
    signal_source: str = "manual"
    speakers: list[CanonicalSpeaker] = Field(default_factory=list)
    segments: list[CanonicalSegment] = Field(default_factory=list)
    total_segments: int = 0
    total_words: int = 0
    total_speakers: int = 0
    questions: list[dict] = Field(default_factory=list)
    compliance_flags: list[dict] = Field(default_factory=list)


class EventIngestResponse(BaseModel):
    status: str = "ok"
    event_id: str
    canonical_event: CanonicalEventModel
