from __future__ import annotations

from collections import OrderedDict

from app.schemas.event_ingest import (
    CanonicalEventModel,
    CanonicalSegment,
    CanonicalSpeaker,
    EventIngestRequest,
)


class CanonicalEventModelBuilder:
    """
    Converts raw event payloads into the CuraLive canonical event model.
    This is the foundation for downstream AI analysis services.
    """

    def build(self, payload: EventIngestRequest) -> CanonicalEventModel:
        if not payload.transcript_segments:
            return CanonicalEventModel(
                event_id=payload.event_id,
                title=payload.metadata.title,
                organisation_id=payload.metadata.organisation_id,
                organisation_name=payload.metadata.organisation_name,
                event_type=payload.metadata.event_type,
                jurisdiction=payload.metadata.jurisdiction,
                signal_source=payload.metadata.signal_source,
                speakers=[],
                segments=[],
                total_segments=0,
                total_words=0,
                total_speakers=0,
                questions=payload.questions,
                compliance_flags=payload.compliance_flags,
            )

        speaker_stats: OrderedDict[str, dict] = OrderedDict()
        segments: list[CanonicalSegment] = []

        for seg in payload.transcript_segments:
            words = seg.text.split()
            word_count = len(words)

            if seg.speaker_id not in speaker_stats:
                speaker_stats[seg.speaker_id] = {
                    "speaker_id": seg.speaker_id,
                    "display_name": seg.speaker_name,
                    "role": None,
                    "segment_count": 0,
                    "total_words": 0,
                }

            speaker_stats[seg.speaker_id]["segment_count"] += 1
            speaker_stats[seg.speaker_id]["total_words"] += word_count

            if seg.speaker_name and not speaker_stats[seg.speaker_id]["display_name"]:
                speaker_stats[seg.speaker_id]["display_name"] = seg.speaker_name

            segments.append(
                CanonicalSegment(
                    speaker_id=seg.speaker_id,
                    speaker_name=seg.speaker_name,
                    text=seg.text,
                    start_time=seg.start_time,
                    end_time=seg.end_time,
                    word_count=word_count,
                )
            )

        for p in payload.participants:
            if p.participant_id in speaker_stats and p.role:
                speaker_stats[p.participant_id]["role"] = p.role
            if p.participant_id in speaker_stats and p.display_name:
                speaker_stats[p.participant_id]["display_name"] = p.display_name

        speakers = [CanonicalSpeaker(**s) for s in speaker_stats.values()]
        total_words = sum(s.total_words for s in speakers)

        return CanonicalEventModel(
            event_id=payload.event_id,
            title=payload.metadata.title,
            organisation_id=payload.metadata.organisation_id,
            organisation_name=payload.metadata.organisation_name,
            event_type=payload.metadata.event_type,
            jurisdiction=payload.metadata.jurisdiction,
            signal_source=payload.metadata.signal_source,
            speakers=speakers,
            segments=segments,
            total_segments=len(segments),
            total_words=total_words,
            total_speakers=len(speakers),
            questions=payload.questions,
            compliance_flags=payload.compliance_flags,
        )
