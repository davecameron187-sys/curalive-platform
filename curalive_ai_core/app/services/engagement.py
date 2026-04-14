from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.event_ingest import CanonicalEventModel


@dataclass
class SpeakerEngagement:
    speaker_id: str
    display_name: str | None
    role: str | None
    segment_count: int
    total_words: int
    share_of_voice_pct: float
    avg_words_per_segment: float
    estimated_speaking_time_secs: float


@dataclass
class PaceAnalysis:
    total_duration_secs: float | None
    total_words: int
    overall_words_per_minute: float | None
    segments_above_180_wpm: int
    segments_below_80_wpm: int


@dataclass
class QaDensity:
    total_questions: int
    questions_per_speaker: dict[str, int]


@dataclass
class EngagementResult:
    module: str = "engagement"
    engagement_score: float = 0.0
    total_speakers: int = 0
    total_segments: int = 0
    total_words: int = 0
    speaking_balance_index: float = 0.0
    speaker_engagement: list[SpeakerEngagement] = field(default_factory=list)
    pace_analysis: PaceAnalysis | None = None
    qa_density: QaDensity | None = None


def _gini_coefficient(shares: list[float]) -> float:
    if not shares or all(s == 0 for s in shares):
        return 0.0
    n = len(shares)
    sorted_shares = sorted(shares)
    cumulative = sum((2 * (i + 1) - n - 1) * sorted_shares[i] for i in range(n))
    return round(cumulative / (n * sum(sorted_shares)), 4) if sum(sorted_shares) > 0 else 0.0


class EngagementService:
    def analyze(self, canonical: CanonicalEventModel) -> EngagementResult:
        if not canonical.segments:
            return EngagementResult()

        speaker_map = {s.speaker_id: s for s in canonical.speakers}
        speaker_words: dict[str, int] = {}
        speaker_segs: dict[str, int] = {}
        speaker_time: dict[str, float] = {}

        total_words = 0
        timed_words = 0
        total_duration = 0.0
        has_timing = False
        fast_segs = 0
        slow_segs = 0

        for seg in canonical.segments:
            wc = seg.word_count or len(seg.text.split())
            total_words += wc
            speaker_words[seg.speaker_id] = speaker_words.get(seg.speaker_id, 0) + wc
            speaker_segs[seg.speaker_id] = speaker_segs.get(seg.speaker_id, 0) + 1

            if seg.start_time is not None and seg.end_time is not None:
                dur = seg.end_time - seg.start_time
                if dur > 0:
                    has_timing = True
                    total_duration += dur
                    timed_words += wc
                    speaker_time[seg.speaker_id] = speaker_time.get(seg.speaker_id, 0.0) + dur
                    wpm = (wc / dur) * 60
                    if wpm > 180:
                        fast_segs += 1
                    elif wpm < 80:
                        slow_segs += 1

        se_list: list[SpeakerEngagement] = []
        shares: list[float] = []
        for sid, words in speaker_words.items():
            spk = speaker_map.get(sid)
            share = round((words / total_words) * 100, 2) if total_words > 0 else 0.0
            shares.append(share)
            sc = speaker_segs.get(sid, 0)
            se_list.append(SpeakerEngagement(
                speaker_id=sid,
                display_name=spk.display_name if spk else None,
                role=spk.role if spk else None,
                segment_count=sc,
                total_words=words,
                share_of_voice_pct=share,
                avg_words_per_segment=round(words / sc, 1) if sc > 0 else 0.0,
                estimated_speaking_time_secs=round(speaker_time.get(sid, 0.0), 1),
            ))

        balance = round(1.0 - _gini_coefficient(shares), 4) if shares else 0.0

        overall_wpm = None
        if has_timing and total_duration > 0:
            overall_wpm = round((timed_words / total_duration) * 60, 1)

        pace = PaceAnalysis(
            total_duration_secs=round(total_duration, 1) if has_timing else None,
            total_words=total_words,
            overall_words_per_minute=overall_wpm,
            segments_above_180_wpm=fast_segs,
            segments_below_80_wpm=slow_segs,
        )

        q_per_speaker: dict[str, int] = {}
        for q in canonical.questions:
            asker = q.get("asker_id") or q.get("speaker_id") or "unknown"
            q_per_speaker[asker] = q_per_speaker.get(asker, 0) + 1

        qa = QaDensity(
            total_questions=len(canonical.questions),
            questions_per_speaker=q_per_speaker,
        )

        n_speakers = len(se_list)
        score_components = [
            min(balance * 100, 30),
            min(n_speakers * 10, 20),
            min(len(canonical.questions) * 5, 20),
            min(len(canonical.segments) * 2, 30),
        ]
        eng_score = round(min(sum(score_components), 100), 1)

        return EngagementResult(
            engagement_score=eng_score,
            total_speakers=n_speakers,
            total_segments=len(canonical.segments),
            total_words=total_words,
            speaking_balance_index=balance,
            speaker_engagement=se_list,
            pace_analysis=pace,
            qa_density=qa,
        )
