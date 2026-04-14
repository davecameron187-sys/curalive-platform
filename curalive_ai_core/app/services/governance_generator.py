from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Any


@dataclass
class EventContext:
    event_id: str | None = None
    event_name: str | None = None
    event_type: str | None = None
    event_date: str | None = None


@dataclass
class SegmentInput:
    speaker_id: str | None = None
    speaker_name: str | None = None
    text: str = ""
    start_time: float | None = None
    word_count: int = 0


@dataclass
class CommitmentInput:
    commitment_id: str
    commitment_text: str
    commitment_type: str
    speaker_name: str | None = None
    deadline: str | None = None
    has_quantitative_target: bool = False
    quantitative_values: list[str] = field(default_factory=list)
    confidence: float = 0.0
    status: str = "open"


@dataclass
class ComplianceFlagInput:
    flag_id: str
    flag_type: str
    severity: str
    speaker_name: str | None = None
    matched_pattern: str = ""
    segment_text: str = ""


@dataclass
class DriftInput:
    drift_type: str
    severity: str
    commitment_id: str | None = None
    commitment_text: str = ""
    matched_text: str = ""
    explanation: str = ""
    confidence: float = 0.0


@dataclass
class BriefingContext:
    briefing_id: str | None = None
    likely_topics: list[dict[str, Any]] = field(default_factory=list)
    pressure_points: list[dict[str, Any]] = field(default_factory=list)
    sentiment_summary: dict[str, Any] = field(default_factory=dict)
    narrative_risk: dict[str, Any] = field(default_factory=dict)


@dataclass
class MeetingSummary:
    title: str = ""
    date: str | None = None
    event_type: str | None = None
    duration: str | None = None
    total_speakers: int = 0
    total_segments: int = 0
    key_topics: list[str] = field(default_factory=list)
    executive_summary: str = ""
    speaker_contributions: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class CommitmentRegisterEntry:
    commitment_id: str = ""
    speaker: str | None = None
    commitment_text: str = ""
    commitment_type: str = ""
    deadline: str | None = None
    has_quantitative_target: bool = False
    quantitative_values: list[str] = field(default_factory=list)
    status: str = "open"
    confidence: float = 0.0
    drift_detected: bool = False
    drift_details: dict[str, Any] | None = None


@dataclass
class ComplianceFlagEntry:
    flag_id: str = ""
    flag_type: str = ""
    severity: str = ""
    speaker: str | None = None
    matched_pattern: str = ""
    segment_text: str = ""


@dataclass
class RiskComplianceSummary:
    total_flags: int = 0
    critical_flags: int = 0
    high_flags: int = 0
    medium_flags: int = 0
    low_flags: int = 0
    flags: list[ComplianceFlagEntry] = field(default_factory=list)
    drift_summary: dict[str, Any] = field(default_factory=dict)
    narrative_risk: dict[str, Any] = field(default_factory=dict)
    overall_risk_level: str = "low"


@dataclass
class MattersArisingEntry:
    source: str = ""
    reference_type: str = ""
    reference_id: str | None = None
    description: str = ""
    status: str = "open"
    original_event: str | None = None
    current_position: str | None = None
    severity: str = "medium"


@dataclass
class DataSources:
    analysis_job_id: str | None = None
    briefing_id: str | None = None
    commitments_count: int = 0
    compliance_flags_count: int = 0
    drift_events_count: int = 0
    signals_count: int = 0
    segments_count: int = 0


@dataclass
class GovernanceResult:
    meeting_summary: MeetingSummary = field(default_factory=MeetingSummary)
    commitment_register: list[CommitmentRegisterEntry] = field(default_factory=list)
    risk_compliance_summary: RiskComplianceSummary = field(default_factory=RiskComplianceSummary)
    matters_arising: list[MattersArisingEntry] = field(default_factory=list)
    data_sources: DataSources = field(default_factory=DataSources)
    confidence: float = 0.0


TOPIC_KEYWORDS: dict[str, list[str]] = {
    "guidance": ["guidance", "outlook", "forecast", "target", "expect"],
    "revenue": ["revenue", "sales", "top-line", "turnover", "income"],
    "margins": ["margin", "ebitda", "profitability", "cost", "operating"],
    "compliance": ["compliance", "regulatory", "regulation", "filing", "disclosure"],
    "expansion": ["expansion", "growth", "new market", "acquisition", "geographic"],
    "leadership": ["ceo", "cfo", "management", "executive", "leadership", "board"],
    "risk": ["risk", "uncertainty", "headwind", "downside", "concern"],
    "dividend": ["dividend", "payout", "return", "buyback", "capital return"],
    "esg": ["esg", "sustainability", "environmental", "social", "governance"],
    "debt": ["debt", "leverage", "borrowing", "refinanc", "credit"],
}


class GovernanceGenerator:
    def generate(
        self,
        event: EventContext,
        segments: list[SegmentInput],
        commitments: list[CommitmentInput],
        compliance_flags: list[ComplianceFlagInput],
        drifts: list[DriftInput],
        briefing: BriefingContext | None = None,
        analysis_job_id: str | None = None,
        include_matters_arising: bool = True,
    ) -> GovernanceResult:
        result = GovernanceResult()

        result.meeting_summary = self._build_meeting_summary(event, segments, briefing)
        result.commitment_register = self._build_commitment_register(commitments, drifts)
        result.risk_compliance_summary = self._build_risk_compliance(compliance_flags, drifts, briefing)

        if include_matters_arising:
            result.matters_arising = self._build_matters_arising(commitments, drifts)

        result.data_sources = DataSources(
            analysis_job_id=analysis_job_id,
            briefing_id=briefing.briefing_id if briefing else None,
            commitments_count=len(commitments),
            compliance_flags_count=len(compliance_flags),
            drift_events_count=len(drifts),
            segments_count=len(segments),
        )

        data_richness = min(1.0, (
            len(segments) * 0.002
            + len(commitments) * 0.05
            + len(compliance_flags) * 0.03
            + len(drifts) * 0.1
        ))
        section_coverage = sum([
            1 if result.meeting_summary.total_segments > 0 else 0,
            1 if len(result.commitment_register) > 0 else 0,
            1 if result.risk_compliance_summary.total_flags > 0 else 0,
            1 if len(result.matters_arising) > 0 else 0,
        ]) / 4
        result.confidence = round(min(1.0, data_richness * 0.5 + section_coverage * 0.5), 2)

        return result

    def _build_meeting_summary(
        self,
        event: EventContext,
        segments: list[SegmentInput],
        briefing: BriefingContext | None,
    ) -> MeetingSummary:
        speaker_word_counts: Counter[str] = Counter()
        speaker_segment_counts: Counter[str] = Counter()
        all_text_words: list[str] = []

        for seg in segments:
            name = seg.speaker_name or seg.speaker_id or "Unknown"
            speaker_word_counts[name] += seg.word_count or len(seg.text.split())
            speaker_segment_counts[name] += 1
            all_text_words.extend(seg.text.lower().split())

        topic_scores: Counter[str] = Counter()
        for topic, keywords in TOPIC_KEYWORDS.items():
            for kw in keywords:
                count = sum(1 for w in all_text_words if kw in w)
                if count > 0:
                    topic_scores[topic] += count

        if briefing and briefing.likely_topics:
            for t in briefing.likely_topics:
                topic_name = t.get("topic", "")
                if topic_name:
                    topic_scores[topic_name] += 5

        key_topics = [t for t, _ in topic_scores.most_common(6)]

        total_words = sum(speaker_word_counts.values())
        speakers = []
        for name, words in speaker_word_counts.most_common():
            speakers.append({
                "speaker_name": name,
                "word_count": words,
                "segment_count": speaker_segment_counts[name],
                "share_pct": round(words / max(total_words, 1) * 100, 1),
            })

        duration_est = None
        if total_words > 0:
            mins = round(total_words / 150)
            duration_est = f"{mins} min" if mins < 60 else f"{mins // 60}h {mins % 60}m"

        summary_parts = []
        if event.event_name:
            summary_parts.append(f"{event.event_name}")
        summary_parts.append(f"covered {len(speakers)} speakers across {len(segments)} transcript segments")
        if key_topics:
            summary_parts.append(f"Key topics: {', '.join(key_topics[:4])}")
        if total_words:
            summary_parts.append(f"Total words: {total_words:,}")

        return MeetingSummary(
            title=event.event_name or "Untitled Event",
            date=event.event_date,
            event_type=event.event_type,
            duration=duration_est,
            total_speakers=len(speakers),
            total_segments=len(segments),
            key_topics=key_topics,
            executive_summary=". ".join(summary_parts) + ".",
            speaker_contributions=speakers,
        )

    def _build_commitment_register(
        self,
        commitments: list[CommitmentInput],
        drifts: list[DriftInput],
    ) -> list[CommitmentRegisterEntry]:
        drift_by_commitment: dict[str, list[DriftInput]] = {}
        for d in drifts:
            if d.commitment_id:
                drift_by_commitment.setdefault(d.commitment_id, []).append(d)

        register: list[CommitmentRegisterEntry] = []
        for c in commitments:
            related_drifts = drift_by_commitment.get(c.commitment_id, [])
            drift_detected = len(related_drifts) > 0
            drift_details = None
            if drift_detected:
                worst = max(related_drifts, key=lambda d: {"high": 3, "medium": 2, "low": 1}.get(d.severity, 0))
                drift_details = {
                    "drift_count": len(related_drifts),
                    "worst_severity": worst.severity,
                    "worst_type": worst.drift_type,
                    "explanation": worst.explanation[:200],
                }

            register.append(CommitmentRegisterEntry(
                commitment_id=c.commitment_id,
                speaker=c.speaker_name,
                commitment_text=c.commitment_text,
                commitment_type=c.commitment_type,
                deadline=c.deadline,
                has_quantitative_target=c.has_quantitative_target,
                quantitative_values=c.quantitative_values,
                status=c.status,
                confidence=c.confidence,
                drift_detected=drift_detected,
                drift_details=drift_details,
            ))

        register.sort(key=lambda e: (
            0 if e.drift_detected else 1,
            {"open": 0, "monitored": 1, "escalated": 2}.get(e.status, 3),
        ))
        return register

    def _build_risk_compliance(
        self,
        compliance_flags: list[ComplianceFlagInput],
        drifts: list[DriftInput],
        briefing: BriefingContext | None,
    ) -> RiskComplianceSummary:
        flags = [
            ComplianceFlagEntry(
                flag_id=f.flag_id,
                flag_type=f.flag_type,
                severity=f.severity,
                speaker=f.speaker_name,
                matched_pattern=f.matched_pattern,
                segment_text=f.segment_text[:300],
            )
            for f in compliance_flags
        ]
        flags.sort(key=lambda f: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(f.severity, 4))

        critical = sum(1 for f in flags if f.severity == "critical")
        high = sum(1 for f in flags if f.severity == "high")
        medium = sum(1 for f in flags if f.severity == "medium")
        low = sum(1 for f in flags if f.severity == "low")

        drift_type_counts: Counter[str] = Counter()
        drift_severity_counts: Counter[str] = Counter()
        for d in drifts:
            drift_type_counts[d.drift_type] += 1
            drift_severity_counts[d.severity] += 1

        drift_summary: dict[str, Any] = {}
        if drifts:
            drift_summary = {
                "total_drifts": len(drifts),
                "by_type": dict(drift_type_counts),
                "by_severity": dict(drift_severity_counts),
            }

        narrative_risk: dict[str, Any] = {}
        if briefing and briefing.narrative_risk:
            narrative_risk = briefing.narrative_risk

        risk_score = 0.0
        risk_score += critical * 0.3 + high * 0.15 + medium * 0.05 + low * 0.02
        risk_score += drift_severity_counts.get("high", 0) * 0.2
        risk_score += drift_severity_counts.get("medium", 0) * 0.1

        if risk_score >= 0.6:
            overall_level = "high"
        elif risk_score >= 0.3:
            overall_level = "medium"
        else:
            overall_level = "low"

        return RiskComplianceSummary(
            total_flags=len(flags),
            critical_flags=critical,
            high_flags=high,
            medium_flags=medium,
            low_flags=low,
            flags=flags,
            drift_summary=drift_summary,
            narrative_risk=narrative_risk,
            overall_risk_level=overall_level,
        )

    def _build_matters_arising(
        self,
        commitments: list[CommitmentInput],
        drifts: list[DriftInput],
    ) -> list[MattersArisingEntry]:
        matters: list[MattersArisingEntry] = []

        drift_commitment_ids = set()
        for d in drifts:
            severity = "high" if d.severity == "high" else "medium"
            matters.append(MattersArisingEntry(
                source="drift_detection",
                reference_type="commitment_drift",
                reference_id=d.commitment_id,
                description=f"Drift ({d.drift_type}) detected: {d.explanation[:200]}",
                status="requires_attention",
                original_event=None,
                current_position=d.matched_text[:200] if d.matched_text else None,
                severity=severity,
            ))
            if d.commitment_id:
                drift_commitment_ids.add(d.commitment_id)

        for c in commitments:
            if c.commitment_id in drift_commitment_ids:
                continue
            if c.status in ("escalated",):
                matters.append(MattersArisingEntry(
                    source="commitment_register",
                    reference_type="escalated_commitment",
                    reference_id=c.commitment_id,
                    description=f"Escalated commitment: {c.commitment_text[:200]}",
                    status="escalated",
                    original_event=None,
                    current_position=None,
                    severity="high",
                ))
            elif c.deadline and c.status == "open":
                matters.append(MattersArisingEntry(
                    source="commitment_register",
                    reference_type="deadline_commitment",
                    reference_id=c.commitment_id,
                    description=f"Open commitment with deadline ({c.deadline}): {c.commitment_text[:150]}",
                    status="open",
                    original_event=None,
                    current_position=None,
                    severity="medium",
                ))

        matters.sort(key=lambda m: {"high": 0, "medium": 1, "low": 2}.get(m.severity, 3))
        return matters
