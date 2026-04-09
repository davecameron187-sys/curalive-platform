from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.event_ingest import CanonicalEventModel


POSITIVE_WORDS = {
    "growth", "grew", "increase", "increased", "strong", "strengthen", "strengthened",
    "confident", "confidence", "optimistic", "positive", "improve", "improved",
    "improvement", "exceeded", "outperform", "outperformed", "record", "momentum",
    "robust", "resilient", "opportunity", "opportunities", "upside", "profit",
    "profitable", "expanded", "expansion", "progress", "progressed", "achievement",
    "delivered", "committed", "commitment", "milestone", "accelerate", "accelerated",
    "innovation", "innovative", "successful", "success", "surpassed", "exceeded",
    "upgrade", "upgraded", "favorable", "favourable", "strategic", "value",
}

NEGATIVE_WORDS = {
    "decline", "declined", "decrease", "decreased", "weak", "weakened", "loss",
    "losses", "risk", "risks", "challenge", "challenges", "challenging", "uncertain",
    "uncertainty", "concerned", "concern", "disappointing", "disappointed",
    "headwind", "headwinds", "pressure", "pressured", "downturn", "deteriorate",
    "deteriorated", "impairment", "restructuring", "restructured", "volatility",
    "volatile", "shortfall", "miss", "missed", "underperform", "underperformed",
    "downgrade", "downgraded", "adverse", "adversely", "difficult", "difficulty",
    "threat", "threatened", "contraction", "contracted", "deficit", "defaults",
    "writedown", "writeoff", "litigation", "regulatory", "violation",
}


@dataclass
class SegmentSentiment:
    speaker_id: str
    speaker_name: str | None
    text: str
    start_time: float | None
    positive_count: int
    negative_count: int
    score: float
    label: str


@dataclass
class SpeakerSentiment:
    speaker_id: str
    display_name: str | None
    role: str | None
    segment_count: int
    avg_score: float
    label: str
    positive_count: int
    negative_count: int


@dataclass
class ToneShift:
    from_segment_index: int
    to_segment_index: int
    speaker_id: str
    from_score: float
    to_score: float
    shift_magnitude: float
    direction: str


@dataclass
class SentimentResult:
    module: str = "sentiment"
    overall_score: float = 0.0
    overall_label: str = "neutral"
    total_positive_signals: int = 0
    total_negative_signals: int = 0
    segment_sentiments: list[SegmentSentiment] = field(default_factory=list)
    speaker_sentiments: list[SpeakerSentiment] = field(default_factory=list)
    tone_shifts: list[ToneShift] = field(default_factory=list)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z]+", text.lower())


def _score_segment(tokens: list[str]) -> tuple[int, int, float]:
    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    total = pos + neg
    if total == 0:
        return pos, neg, 0.0
    return pos, neg, round((pos - neg) / total, 4)


def _label(score: float) -> str:
    if score > 0.2:
        return "positive"
    if score < -0.2:
        return "negative"
    return "neutral"


class SentimentService:
    def analyze(self, canonical: CanonicalEventModel) -> SentimentResult:
        if not canonical.segments:
            return SentimentResult()

        seg_results: list[SegmentSentiment] = []
        speaker_accum: dict[str, dict] = {}
        total_pos = 0
        total_neg = 0

        for seg in canonical.segments:
            tokens = _tokenize(seg.text)
            pos, neg, score = _score_segment(tokens)
            total_pos += pos
            total_neg += neg

            seg_results.append(SegmentSentiment(
                speaker_id=seg.speaker_id,
                speaker_name=seg.speaker_name,
                text=seg.text,
                start_time=seg.start_time,
                positive_count=pos,
                negative_count=neg,
                score=score,
                label=_label(score),
            ))

            if seg.speaker_id not in speaker_accum:
                speaker_accum[seg.speaker_id] = {
                    "scores": [],
                    "pos": 0,
                    "neg": 0,
                    "name": seg.speaker_name,
                }
            speaker_accum[seg.speaker_id]["scores"].append(score)
            speaker_accum[seg.speaker_id]["pos"] += pos
            speaker_accum[seg.speaker_id]["neg"] += neg

        speaker_map = {s.speaker_id: s for s in canonical.speakers}
        speaker_results: list[SpeakerSentiment] = []
        for sid, acc in speaker_accum.items():
            avg = round(sum(acc["scores"]) / len(acc["scores"]), 4) if acc["scores"] else 0.0
            spk = speaker_map.get(sid)
            speaker_results.append(SpeakerSentiment(
                speaker_id=sid,
                display_name=spk.display_name if spk else acc["name"],
                role=spk.role if spk else None,
                segment_count=len(acc["scores"]),
                avg_score=avg,
                label=_label(avg),
                positive_count=acc["pos"],
                negative_count=acc["neg"],
            ))

        tone_shifts: list[ToneShift] = []
        for i in range(1, len(seg_results)):
            prev = seg_results[i - 1]
            curr = seg_results[i]
            shift = round(curr.score - prev.score, 4)
            if abs(shift) >= 0.5:
                tone_shifts.append(ToneShift(
                    from_segment_index=i - 1,
                    to_segment_index=i,
                    speaker_id=curr.speaker_id,
                    from_score=prev.score,
                    to_score=curr.score,
                    shift_magnitude=abs(shift),
                    direction="positive" if shift > 0 else "negative",
                ))

        all_scores = [s.score for s in seg_results]
        overall = round(sum(all_scores) / len(all_scores), 4) if all_scores else 0.0

        return SentimentResult(
            overall_score=overall,
            overall_label=_label(overall),
            total_positive_signals=total_pos,
            total_negative_signals=total_neg,
            segment_sentiments=seg_results,
            speaker_sentiments=speaker_results,
            tone_shifts=tone_shifts,
        )
