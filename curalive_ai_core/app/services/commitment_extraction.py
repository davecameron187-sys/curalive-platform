from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.event_ingest import CanonicalEventModel


COMMITMENT_PATTERNS = [
    (r"\bwe\s+(?:will|shall)\s+(.{10,80})", "will_statement"),
    (r"\bwe\s+(?:commit|are\s+committed)\s+to\s+(.{10,80})", "explicit_commitment"),
    (r"\bwe\s+(?:plan|intend|aim)\s+to\s+(.{10,80})", "stated_intention"),
    (r"\bour\s+target\s+(?:is|of)\s+(.{10,80})", "target"),
    (r"\bwe\s+(?:expect|anticipate)\s+to\s+(.{10,80})", "expectation"),
    (r"\bwe\s+remain\s+committed\s+to\s+(.{10,80})", "reaffirmed_commitment"),
    (r"\bwe\s+are\s+on\s+track\s+to\s+(.{10,80})", "progress_commitment"),
    (r"\bwe\s+(?:have\s+)?(?:set|established)\s+a\s+(?:target|goal)\s+(?:of|to)\s+(.{10,80})", "goal_setting"),
    (r"\bby\s+(?:year\s+end|FY\d{2,4}|H[12]\s+\d{4}|Q[1-4]\s+\d{4}|end\s+of\s+\d{4})\s*[,:]?\s*(.{10,80})", "deadline_commitment"),
]

DEADLINE_PATTERNS = [
    (r"\bby\s+(year\s+end)\b", "year_end"),
    (r"\bby\s+(FY\d{2,4})\b", "fiscal_year"),
    (r"\bby\s+(H[12]\s+\d{4})\b", "half_year"),
    (r"\bby\s+(Q[1-4]\s+\d{4})\b", "quarter"),
    (r"\bby\s+(end\s+of\s+\d{4})\b", "calendar_year"),
    (r"\b(next\s+quarter)\b", "next_quarter"),
    (r"\b(next\s+year)\b", "next_year"),
    (r"\bwithin\s+(\d+\s+(?:months?|weeks?|days?))\b", "relative"),
]

QUANTITATIVE_PATTERNS = [
    r"\b(\d+(?:\.\d+)?)\s*%",
    r"\bR?\$?\d+(?:\.\d+)?\s*(?:billion|million|bn|m)\b",
    r"\b\d+(?:,\d{3})+\b",
]


@dataclass
class ExtractedCommitment:
    segment_index: int
    speaker_id: str
    speaker_name: str | None
    commitment_text: str
    full_segment_text: str
    commitment_type: str
    deadline: str | None
    has_quantitative_target: bool
    quantitative_values: list[str]
    confidence: float
    start_time: float | None


@dataclass
class CommitmentExtractionResult:
    module: str = "commitment_extraction"
    total_commitments: int = 0
    commitments_with_deadlines: int = 0
    commitments_with_targets: int = 0
    speakers_making_commitments: list[str] = field(default_factory=list)
    commitments: list[ExtractedCommitment] = field(default_factory=list)


def _extract_deadline(text: str) -> str | None:
    lower = text.lower()
    for pat, _ in DEADLINE_PATTERNS:
        m = re.search(pat, lower)
        if m:
            return m.group(1).strip()
    return None


def _extract_quantitative(text: str) -> list[str]:
    found = []
    for pat in QUANTITATIVE_PATTERNS:
        for m in re.finditer(pat, text):
            found.append(m.group(0))
    return found


def _confidence_score(commitment_type: str, has_deadline: bool, has_quant: bool) -> float:
    base = {
        "explicit_commitment": 0.9,
        "reaffirmed_commitment": 0.85,
        "will_statement": 0.7,
        "progress_commitment": 0.75,
        "goal_setting": 0.8,
        "target": 0.8,
        "deadline_commitment": 0.75,
        "stated_intention": 0.6,
        "expectation": 0.55,
    }.get(commitment_type, 0.5)
    if has_deadline:
        base = min(base + 0.1, 1.0)
    if has_quant:
        base = min(base + 0.05, 1.0)
    return round(base, 2)


class CommitmentExtractionService:
    def analyze(self, canonical: CanonicalEventModel) -> CommitmentExtractionResult:
        if not canonical.segments:
            return CommitmentExtractionResult()

        commitments: list[ExtractedCommitment] = []
        speakers_set: set[str] = set()
        seen_texts: set[str] = set()

        for idx, seg in enumerate(canonical.segments):
            for pat, ctype in COMMITMENT_PATTERNS:
                matches = re.finditer(pat, seg.text, re.IGNORECASE)
                for m in matches:
                    commitment_text = m.group(0).strip()
                    if commitment_text in seen_texts:
                        continue
                    seen_texts.add(commitment_text)

                    deadline = _extract_deadline(seg.text)
                    quant = _extract_quantitative(seg.text)
                    conf = _confidence_score(ctype, deadline is not None, len(quant) > 0)

                    speakers_set.add(seg.speaker_id)
                    commitments.append(ExtractedCommitment(
                        segment_index=idx,
                        speaker_id=seg.speaker_id,
                        speaker_name=seg.speaker_name,
                        commitment_text=commitment_text,
                        full_segment_text=seg.text,
                        commitment_type=ctype,
                        deadline=deadline,
                        has_quantitative_target=len(quant) > 0,
                        quantitative_values=quant,
                        confidence=conf,
                        start_time=seg.start_time,
                    ))

        with_deadlines = sum(1 for c in commitments if c.deadline is not None)
        with_targets = sum(1 for c in commitments if c.has_quantitative_target)

        return CommitmentExtractionResult(
            total_commitments=len(commitments),
            commitments_with_deadlines=with_deadlines,
            commitments_with_targets=with_targets,
            speakers_making_commitments=sorted(speakers_set),
            commitments=commitments,
        )
