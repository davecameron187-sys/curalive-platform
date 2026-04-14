from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field


@dataclass
class OpenCommitment:
    id: uuid.UUID
    speaker_id: str
    speaker_name: str | None
    commitment_text: str
    commitment_type: str
    deadline: str | None
    has_quantitative_target: bool
    quantitative_values: list[str]
    confidence: float


@dataclass
class SourceRecord:
    text: str
    speaker_id: str | None
    speaker_name: str | None
    source_type: str
    source_reference: str
    timestamp: float | None


@dataclass
class DetectedDrift:
    commitment_id: uuid.UUID
    original_commitment_text: str
    drift_type: str
    severity: str
    matched_text: str
    explanation: str
    confidence: float
    source_type: str
    source_reference: str


@dataclass
class DriftResult:
    commitments_evaluated: int = 0
    statements_processed: int = 0
    drifts: list[DetectedDrift] = field(default_factory=list)


NEGATION_PATTERNS = [
    r"\b(?:no longer|not|unlikely|unable|cannot|won't|will not)\b",
]

DOWNGRADE_PATTERNS = [
    (r"\b(?:revise|revised|lower|lowered|reduce|reduced|downgrade|downgraded)\b", "downgrade"),
    (r"\b(?:delay|delayed|postpone|postponed|push back|pushed back|defer|deferred)\b", "delay"),
    (r"\b(?:uncertain|uncertainty|challenging|headwind|risk|difficult)\b", "caution"),
    (r"\b(?:reassess|reassessing|review|reviewing|reconsider|reconsidering)\b", "reassessment"),
]

QUANTITATIVE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*%")
MONETARY_PATTERN = re.compile(r"R?\$?(\d+(?:\.\d+)?)\s*(?:billion|million|bn|m)\b", re.IGNORECASE)
NUMERIC_PATTERN = re.compile(r"\b(\d+(?:,\d{3})*(?:\.\d+)?)\b")

TEXT_PERCENT_PATTERN = re.compile(r"\b(\d+(?:\.\d+)?)\s+percent\b", re.IGNORECASE)
PLAIN_NUMBER_PATTERN = re.compile(r"\b(\d+(?:,\d{3})*(?:\.\d+)?)\b")

TIMELINE_KEYWORDS = [
    "by year end", "by fy", "by h1", "by h2", "by q1", "by q2", "by q3", "by q4",
    "next quarter", "next year", "within", "by end of",
]


class CommitmentDriftService:
    def detect(
        self,
        commitments: list[OpenCommitment],
        statements: list[SourceRecord],
    ) -> DriftResult:
        result = DriftResult(
            commitments_evaluated=len(commitments),
            statements_processed=len(statements),
        )

        for stmt in statements:
            stmt_lower = stmt.text.lower()
            for commitment in commitments:
                drifts = self._compare(commitment, stmt, stmt_lower)
                result.drifts.extend(drifts)

        seen: set[tuple[str, str, str]] = set()
        deduped: list[DetectedDrift] = []
        for d in result.drifts:
            key = (str(d.commitment_id), d.drift_type, d.matched_text[:80])
            if key not in seen:
                seen.add(key)
                deduped.append(d)
        result.drifts = deduped

        return result

    def _compare(
        self,
        commitment: OpenCommitment,
        stmt: SourceRecord,
        stmt_lower: str,
    ) -> list[DetectedDrift]:
        drifts: list[DetectedDrift] = []

        commit_lower = commitment.commitment_text.lower()
        commit_keywords = self._extract_keywords(commit_lower)

        if not self._has_topical_overlap(commit_keywords, stmt_lower):
            return drifts

        semantic = self._check_semantic(commitment, stmt, stmt_lower, commit_lower, commit_keywords)
        if semantic:
            drifts.append(semantic)

        commit_numbers = self._extract_numbers(commitment.commitment_text)
        if commitment.has_quantitative_target or len(commit_numbers) > 0:
            numerical = self._check_numerical_with(commitment, stmt, stmt_lower, commit_numbers)
            if numerical:
                drifts.append(numerical)

        if commitment.deadline:
            timing = self._check_timing(commitment, stmt, stmt_lower)
            if timing:
                drifts.append(timing)

        directional = self._check_directional(commitment, stmt, stmt_lower, commit_lower)
        if directional:
            drifts.append(directional)

        return drifts

    def _extract_keywords(self, text: str) -> set[str]:
        stop_words = {
            "we", "will", "shall", "are", "is", "the", "a", "an", "to", "of",
            "in", "on", "for", "by", "our", "and", "or", "be", "that", "this",
            "with", "from", "at", "have", "has", "not", "it", "its", "as",
        }
        words = re.findall(r"\b[a-z]{3,}\b", text)
        return {w for w in words if w not in stop_words}

    def _has_topical_overlap(self, commit_keywords: set[str], stmt_lower: str) -> bool:
        if not commit_keywords:
            return False
        stmt_words = set(re.findall(r"\b[a-z]{3,}\b", stmt_lower))
        overlap = commit_keywords & stmt_words
        return len(overlap) >= min(2, max(1, len(commit_keywords) // 3))

    def _check_semantic(
        self,
        commitment: OpenCommitment,
        stmt: SourceRecord,
        stmt_lower: str,
        commit_lower: str,
        commit_keywords: set[str],
    ) -> DetectedDrift | None:
        for pat in NEGATION_PATTERNS:
            matches = list(re.finditer(pat, stmt_lower))
            if not matches:
                continue

            for m in matches:
                context_start = max(0, m.start() - 40)
                context_end = min(len(stmt_lower), m.end() + 80)
                context = stmt_lower[context_start:context_end]

                context_words = set(re.findall(r"\b[a-z]{3,}\b", context))
                if len(commit_keywords & context_words) >= min(2, max(1, len(commit_keywords) // 3)):
                    negation_word = m.group(0)
                    severity = "high" if negation_word in ("no longer", "will not", "won't", "cannot") else "medium"

                    return DetectedDrift(
                        commitment_id=commitment.id,
                        original_commitment_text=commitment.commitment_text,
                        drift_type="semantic",
                        severity=severity,
                        matched_text=stmt.text[max(0, m.start() - 20):min(len(stmt.text), m.end() + 60)].strip(),
                        explanation=f"Statement contains '{negation_word}' in context related to commitment: \"{commitment.commitment_text[:80]}\"",
                        confidence=0.7 if severity == "high" else 0.55,
                        source_type=stmt.source_type,
                        source_reference=stmt.source_reference,
                    )
        return None

    def _check_numerical_with(
        self,
        commitment: OpenCommitment,
        stmt: SourceRecord,
        stmt_lower: str,
        commit_numbers: list[float],
    ) -> DetectedDrift | None:
        stmt_numbers = self._extract_numbers(stmt.text)

        if not commit_numbers or not stmt_numbers:
            return None

        for cn in commit_numbers:
            for sn in stmt_numbers:
                if cn == 0 or cn == sn:
                    continue
                diff_pct = abs(sn - cn) / abs(cn) * 100
                if diff_pct >= 10:
                    severity = "high" if diff_pct >= 30 else "medium"
                    return DetectedDrift(
                        commitment_id=commitment.id,
                        original_commitment_text=commitment.commitment_text,
                        drift_type="numerical",
                        severity=severity,
                        matched_text=stmt.text.strip(),
                        explanation=f"Numerical shift: commitment referenced {cn}, statement now shows {sn} ({diff_pct:.0f}% change)",
                        confidence=0.75 if severity == "high" else 0.6,
                        source_type=stmt.source_type,
                        source_reference=stmt.source_reference,
                    )
        return None

    def _extract_numbers(self, text: str) -> list[float]:
        numbers: list[float] = []
        for m in QUANTITATIVE_PATTERN.finditer(text):
            try:
                numbers.append(float(m.group(1)))
            except ValueError:
                pass
        for m in MONETARY_PATTERN.finditer(text):
            try:
                numbers.append(float(m.group(1)))
            except ValueError:
                pass
        for m in TEXT_PERCENT_PATTERN.finditer(text):
            try:
                numbers.append(float(m.group(1)))
            except ValueError:
                pass
        for m in PLAIN_NUMBER_PATTERN.finditer(text):
            try:
                val = float(m.group(1).replace(",", ""))
                if 1 <= val <= 100_000:
                    numbers.append(val)
            except ValueError:
                pass
        seen: set[float] = set()
        deduped: list[float] = []
        for n in numbers:
            if n not in seen:
                seen.add(n)
                deduped.append(n)
        return deduped

    def _check_timing(
        self,
        commitment: OpenCommitment,
        stmt: SourceRecord,
        stmt_lower: str,
    ) -> DetectedDrift | None:
        if not commitment.deadline:
            return None

        commit_deadline_lower = commitment.deadline.lower()

        for pat_text, kind in DOWNGRADE_PATTERNS:
            if kind != "delay":
                continue
            matches = list(re.finditer(pat_text, stmt_lower))
            if not matches:
                continue

            commit_keywords = self._extract_keywords(commitment.commitment_text.lower())
            for m in matches:
                context_start = max(0, m.start() - 60)
                context_end = min(len(stmt_lower), m.end() + 60)
                context_words = set(re.findall(r"\b[a-z]{3,}\b", stmt_lower[context_start:context_end]))
                if len(commit_keywords & context_words) >= 1:
                    return DetectedDrift(
                        commitment_id=commitment.id,
                        original_commitment_text=commitment.commitment_text,
                        drift_type="timing",
                        severity="medium",
                        matched_text=stmt.text[max(0, m.start() - 20):min(len(stmt.text), m.end() + 60)].strip(),
                        explanation=f"Timeline shift detected ('{m.group(0)}') against commitment deadline '{commit_deadline_lower}'",
                        confidence=0.65,
                        source_type=stmt.source_type,
                        source_reference=stmt.source_reference,
                    )

        for kw in TIMELINE_KEYWORDS:
            pos = stmt_lower.find(kw)
            if pos == -1:
                continue
            end_pos = min(len(stmt_lower), pos + len(kw) + 30)
            new_timeline = stmt_lower[pos:end_pos].strip()
            if new_timeline != commit_deadline_lower and commit_deadline_lower not in new_timeline:
                commit_keywords = self._extract_keywords(commitment.commitment_text.lower())
                context_words = set(re.findall(r"\b[a-z]{3,}\b", stmt_lower[max(0, pos - 40):end_pos]))
                if len(commit_keywords & context_words) >= 1:
                    return DetectedDrift(
                        commitment_id=commitment.id,
                        original_commitment_text=commitment.commitment_text,
                        drift_type="timing",
                        severity="low",
                        matched_text=stmt.text[pos:min(len(stmt.text), pos + len(kw) + 30)].strip(),
                        explanation=f"Different timeline '{new_timeline}' vs original deadline '{commit_deadline_lower}'",
                        confidence=0.5,
                        source_type=stmt.source_type,
                        source_reference=stmt.source_reference,
                    )
        return None

    def _check_directional(
        self,
        commitment: OpenCommitment,
        stmt: SourceRecord,
        stmt_lower: str,
        commit_lower: str,
    ) -> DetectedDrift | None:
        commit_keywords = self._extract_keywords(commit_lower)

        for pat_text, kind in DOWNGRADE_PATTERNS:
            matches = list(re.finditer(pat_text, stmt_lower))
            if not matches:
                continue

            for m in matches:
                context_start = max(0, m.start() - 50)
                context_end = min(len(stmt_lower), m.end() + 50)
                context_words = set(re.findall(r"\b[a-z]{3,}\b", stmt_lower[context_start:context_end]))

                if len(commit_keywords & context_words) >= min(2, max(1, len(commit_keywords) // 3)):
                    severity = "high" if kind in ("downgrade", "delay") else "medium"
                    return DetectedDrift(
                        commitment_id=commitment.id,
                        original_commitment_text=commitment.commitment_text,
                        drift_type="directional",
                        severity=severity,
                        matched_text=stmt.text[max(0, m.start() - 20):min(len(stmt.text), m.end() + 60)].strip(),
                        explanation=f"Directional shift ({kind}): '{m.group(0)}' detected near commitment-related language",
                        confidence=0.65 if severity == "high" else 0.5,
                        source_type=stmt.source_type,
                        source_reference=stmt.source_reference,
                    )
        return None
