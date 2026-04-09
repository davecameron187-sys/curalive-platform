from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SpeakerData:
    speaker_name: str
    word_count: int = 0
    segment_count: int = 0
    share_pct: float = 0.0


@dataclass
class CommitmentData:
    commitment_id: str
    commitment_text: str
    commitment_type: str
    status: str = "open"
    confidence: float = 0.0
    has_quantitative_target: bool = False
    speaker_name: str | None = None


@dataclass
class ComplianceFlagData:
    flag_type: str
    severity: str
    speaker_name: str | None = None


@dataclass
class DriftData:
    drift_type: str
    severity: str
    confidence: float = 0.0
    commitment_id: str | None = None


@dataclass
class SignalData:
    signal_type: str
    source_name: str
    sentiment: str | None = None
    sentiment_score: float = 0.0
    topics: list[str] = field(default_factory=list)


@dataclass
class GovernanceData:
    governance_record_id: str
    risk_level: str = "low"
    confidence: float = 0.0
    key_topics: list[str] = field(default_factory=list)
    matters_arising_count: int = 0
    flags_count: int = 0
    event_id: str | None = None


@dataclass
class SpeakerProfileEntry:
    speaker_name: str
    events_seen: int = 0
    total_words: int = 0
    total_segments: int = 0
    avg_share_pct: float = 0.0
    roles_observed: list[str] = field(default_factory=list)
    commitment_count: int = 0
    flag_count: int = 0
    last_seen_event: str | None = None


@dataclass
class ComplianceRiskProfile:
    total_flags_historical: int = 0
    flags_by_type: dict[str, int] = field(default_factory=dict)
    flags_by_severity: dict[str, int] = field(default_factory=dict)
    avg_flags_per_event: float = 0.0
    risk_trend: str = "stable"
    latest_risk_level: str = "low"


@dataclass
class CommitmentDeliveryProfile:
    total_commitments: int = 0
    commitments_by_status: dict[str, int] = field(default_factory=dict)
    commitments_by_type: dict[str, int] = field(default_factory=dict)
    total_drifts: int = 0
    drifts_by_type: dict[str, int] = field(default_factory=dict)
    drift_rate: float = 0.0
    delivery_reliability: str = "unknown"
    avg_confidence: float = 0.0


@dataclass
class StakeholderRelationshipProfile:
    total_signals: int = 0
    signals_by_type: dict[str, int] = field(default_factory=dict)
    sentiment_distribution: dict[str, int] = field(default_factory=dict)
    avg_sentiment_score: float = 0.0
    top_sources: list[str] = field(default_factory=list)
    key_themes: list[str] = field(default_factory=list)
    relationship_health: str = "unknown"


@dataclass
class GovernanceTrajectoryProfile:
    total_records: int = 0
    avg_confidence: float = 0.0
    latest_risk_level: str = "low"
    risk_level_history: list[dict[str, Any]] = field(default_factory=list)
    key_topics_frequency: dict[str, int] = field(default_factory=dict)
    avg_matters_arising: float = 0.0
    governance_quality: str = "unknown"


@dataclass
class SectorContext:
    sector: str = "unclassified"
    sub_sector: str | None = None
    jurisdiction: str | None = None
    regulatory_framework: str | None = None
    notes: str = "Sector context will be enriched in future phases."


@dataclass
class ProfileSummary:
    organisation_id: str = ""
    events_incorporated: int = 0
    overall_risk_level: str = "low"
    delivery_reliability: str = "unknown"
    relationship_health: str = "unknown"
    governance_quality: str = "unknown"
    key_concerns: list[str] = field(default_factory=list)
    key_strengths: list[str] = field(default_factory=list)
    confidence: float = 0.0


@dataclass
class ProfileResult:
    speaker_profiles: dict[str, SpeakerProfileEntry] = field(default_factory=dict)
    compliance_risk_profile: ComplianceRiskProfile = field(default_factory=ComplianceRiskProfile)
    commitment_delivery_profile: CommitmentDeliveryProfile = field(default_factory=CommitmentDeliveryProfile)
    stakeholder_relationship_profile: StakeholderRelationshipProfile = field(default_factory=StakeholderRelationshipProfile)
    governance_trajectory_profile: GovernanceTrajectoryProfile = field(default_factory=GovernanceTrajectoryProfile)
    sector_context: SectorContext = field(default_factory=SectorContext)
    profile_summary: ProfileSummary = field(default_factory=ProfileSummary)
    events_incorporated: int = 0
    confidence: float = 0.0


class ProfileGenerator:
    def build_profile(
        self,
        organisation_id: str,
        speakers_by_event: list[list[SpeakerData]],
        commitments: list[CommitmentData],
        compliance_flags: list[ComplianceFlagData],
        drifts: list[DriftData],
        signals: list[SignalData],
        governance_records: list[GovernanceData],
        existing_profile: ProfileResult | None = None,
        event_id: str | None = None,
    ) -> ProfileResult:
        result = ProfileResult()
        result.events_incorporated = len(speakers_by_event)

        result.speaker_profiles = self._build_speaker_profiles(
            speakers_by_event, commitments, compliance_flags, event_id,
            existing_profile.speaker_profiles if existing_profile else None,
        )
        result.compliance_risk_profile = self._build_compliance_risk(
            compliance_flags, governance_records, result.events_incorporated,
        )
        result.commitment_delivery_profile = self._build_commitment_delivery(
            commitments, drifts,
        )
        result.stakeholder_relationship_profile = self._build_stakeholder_relationship(
            signals,
        )
        result.governance_trajectory_profile = self._build_governance_trajectory(
            governance_records,
        )
        result.sector_context = SectorContext()

        result.profile_summary = self._build_summary(
            organisation_id, result,
        )

        section_coverage = sum([
            1 if result.speaker_profiles else 0,
            1 if result.compliance_risk_profile.total_flags_historical > 0 else 0,
            1 if result.commitment_delivery_profile.total_commitments > 0 else 0,
            1 if result.stakeholder_relationship_profile.total_signals > 0 else 0,
            1 if result.governance_trajectory_profile.total_records > 0 else 0,
        ]) / 5
        data_volume = min(1.0, (
            len(commitments) * 0.03
            + len(compliance_flags) * 0.02
            + len(drifts) * 0.05
            + len(signals) * 0.02
            + len(governance_records) * 0.1
            + result.events_incorporated * 0.05
        ))
        result.confidence = round(min(1.0, section_coverage * 0.5 + data_volume * 0.5), 2)

        return result

    def _build_speaker_profiles(
        self,
        speakers_by_event: list[list[SpeakerData]],
        commitments: list[CommitmentData],
        flags: list[ComplianceFlagData],
        event_id: str | None,
        existing: dict[str, SpeakerProfileEntry] | None,
    ) -> dict[str, SpeakerProfileEntry]:
        profiles: dict[str, SpeakerProfileEntry] = {}
        if existing:
            profiles = {k: SpeakerProfileEntry(**{
                "speaker_name": v.speaker_name,
                "events_seen": v.events_seen,
                "total_words": v.total_words,
                "total_segments": v.total_segments,
                "avg_share_pct": v.avg_share_pct,
                "roles_observed": list(v.roles_observed),
                "commitment_count": v.commitment_count,
                "flag_count": v.flag_count,
                "last_seen_event": v.last_seen_event,
            }) if isinstance(v, SpeakerProfileEntry) else SpeakerProfileEntry(
                speaker_name=v.get("speaker_name", k) if isinstance(v, dict) else k,
                events_seen=v.get("events_seen", 0) if isinstance(v, dict) else 0,
                total_words=v.get("total_words", 0) if isinstance(v, dict) else 0,
                total_segments=v.get("total_segments", 0) if isinstance(v, dict) else 0,
                avg_share_pct=v.get("avg_share_pct", 0.0) if isinstance(v, dict) else 0.0,
                roles_observed=v.get("roles_observed", []) if isinstance(v, dict) else [],
                commitment_count=v.get("commitment_count", 0) if isinstance(v, dict) else 0,
                flag_count=v.get("flag_count", 0) if isinstance(v, dict) else 0,
                last_seen_event=v.get("last_seen_event") if isinstance(v, dict) else None,
            ) for k, v in existing.items()}

        for event_speakers in speakers_by_event:
            seen_in_event: set[str] = set()
            for sp in event_speakers:
                name = sp.speaker_name
                if name not in profiles:
                    profiles[name] = SpeakerProfileEntry(speaker_name=name)
                p = profiles[name]
                if name not in seen_in_event:
                    p.events_seen += 1
                    seen_in_event.add(name)
                p.total_words += sp.word_count
                p.total_segments += sp.segment_count
                all_shares = [s.share_pct for s in event_speakers if s.speaker_name == name]
                if all_shares:
                    p.avg_share_pct = round(
                        (p.avg_share_pct * (p.events_seen - 1) + sum(all_shares) / len(all_shares))
                        / max(p.events_seen, 1), 1
                    )
                if event_id:
                    p.last_seen_event = event_id

        commitment_speaker_counts: Counter[str] = Counter()
        for c in commitments:
            if c.speaker_name:
                commitment_speaker_counts[c.speaker_name] += 1
        for name, count in commitment_speaker_counts.items():
            if name in profiles:
                profiles[name].commitment_count = count

        flag_speaker_counts: Counter[str] = Counter()
        for f in flags:
            if f.speaker_name:
                flag_speaker_counts[f.speaker_name] += 1
        for name, count in flag_speaker_counts.items():
            if name in profiles:
                profiles[name].flag_count = count

        return profiles

    def _build_compliance_risk(
        self,
        flags: list[ComplianceFlagData],
        governance_records: list[GovernanceData],
        events_count: int,
    ) -> ComplianceRiskProfile:
        type_counts: Counter[str] = Counter()
        severity_counts: Counter[str] = Counter()
        for f in flags:
            type_counts[f.flag_type] += 1
            severity_counts[f.severity] += 1

        avg_per_event = round(len(flags) / max(events_count, 1), 1)

        latest_risk = "low"
        if governance_records:
            latest_risk = governance_records[-1].risk_level

        risk_trend = "stable"
        if len(governance_records) >= 2:
            risk_levels = [g.risk_level for g in governance_records]
            level_map = {"low": 0, "medium": 1, "high": 2}
            recent = [level_map.get(r, 0) for r in risk_levels[-3:]]
            if len(recent) >= 2:
                if recent[-1] > recent[0]:
                    risk_trend = "increasing"
                elif recent[-1] < recent[0]:
                    risk_trend = "decreasing"

        return ComplianceRiskProfile(
            total_flags_historical=len(flags),
            flags_by_type=dict(type_counts),
            flags_by_severity=dict(severity_counts),
            avg_flags_per_event=avg_per_event,
            risk_trend=risk_trend,
            latest_risk_level=latest_risk,
        )

    def _build_commitment_delivery(
        self,
        commitments: list[CommitmentData],
        drifts: list[DriftData],
    ) -> CommitmentDeliveryProfile:
        status_counts: Counter[str] = Counter()
        type_counts: Counter[str] = Counter()
        confidences: list[float] = []

        for c in commitments:
            status_counts[c.status] += 1
            type_counts[c.commitment_type] += 1
            confidences.append(c.confidence)

        drift_type_counts: Counter[str] = Counter()
        for d in drifts:
            drift_type_counts[d.drift_type] += 1

        drift_rate = round(len(drifts) / max(len(commitments), 1), 2)

        if len(commitments) == 0:
            reliability = "unknown"
        elif drift_rate >= 0.4:
            reliability = "poor"
        elif drift_rate >= 0.2:
            reliability = "moderate"
        elif drift_rate >= 0.05:
            reliability = "good"
        else:
            reliability = "strong"

        return CommitmentDeliveryProfile(
            total_commitments=len(commitments),
            commitments_by_status=dict(status_counts),
            commitments_by_type=dict(type_counts),
            total_drifts=len(drifts),
            drifts_by_type=dict(drift_type_counts),
            drift_rate=drift_rate,
            delivery_reliability=reliability,
            avg_confidence=round(sum(confidences) / max(len(confidences), 1), 2),
        )

    def _build_stakeholder_relationship(
        self,
        signals: list[SignalData],
    ) -> StakeholderRelationshipProfile:
        type_counts: Counter[str] = Counter()
        sentiment_counts: Counter[str] = Counter()
        source_counts: Counter[str] = Counter()
        topic_counts: Counter[str] = Counter()
        scores: list[float] = []

        for s in signals:
            type_counts[s.signal_type] += 1
            if s.sentiment:
                sentiment_counts[s.sentiment] += 1
            source_counts[s.source_name] += 1
            scores.append(s.sentiment_score)
            for t in s.topics:
                topic_counts[t] += 1

        avg_score = round(sum(scores) / max(len(scores), 1), 2)

        neg = sentiment_counts.get("negative", 0)
        pos = sentiment_counts.get("positive", 0)
        total = len(signals)
        if total == 0:
            health = "unknown"
        elif neg / max(total, 1) >= 0.5:
            health = "strained"
        elif pos / max(total, 1) >= 0.5:
            health = "strong"
        elif avg_score < -0.15:
            health = "cautious"
        elif avg_score > 0.15:
            health = "positive"
        else:
            health = "neutral"

        return StakeholderRelationshipProfile(
            total_signals=len(signals),
            signals_by_type=dict(type_counts),
            sentiment_distribution=dict(sentiment_counts),
            avg_sentiment_score=avg_score,
            top_sources=[s for s, _ in source_counts.most_common(5)],
            key_themes=[t for t, _ in topic_counts.most_common(8)],
            relationship_health=health,
        )

    def _build_governance_trajectory(
        self,
        governance_records: list[GovernanceData],
    ) -> GovernanceTrajectoryProfile:
        if not governance_records:
            return GovernanceTrajectoryProfile()

        confidences = [g.confidence for g in governance_records]
        topic_counts: Counter[str] = Counter()
        matters_counts: list[int] = []
        risk_history: list[dict[str, Any]] = []

        for g in governance_records:
            for t in g.key_topics:
                topic_counts[t] += 1
            matters_counts.append(g.matters_arising_count)
            risk_history.append({
                "event_id": g.event_id,
                "risk_level": g.risk_level,
                "confidence": g.confidence,
            })

        avg_conf = round(sum(confidences) / max(len(confidences), 1), 2)
        avg_matters = round(sum(matters_counts) / max(len(matters_counts), 1), 1)
        latest_risk = governance_records[-1].risk_level

        if avg_conf >= 0.7 and latest_risk != "high":
            quality = "strong"
        elif avg_conf >= 0.5:
            quality = "adequate"
        elif avg_conf >= 0.3:
            quality = "developing"
        else:
            quality = "insufficient"

        return GovernanceTrajectoryProfile(
            total_records=len(governance_records),
            avg_confidence=avg_conf,
            latest_risk_level=latest_risk,
            risk_level_history=risk_history[-10:],
            key_topics_frequency=dict(topic_counts.most_common(10)),
            avg_matters_arising=avg_matters,
            governance_quality=quality,
        )

    def _build_summary(
        self,
        organisation_id: str,
        result: ProfileResult,
    ) -> ProfileSummary:
        concerns: list[str] = []
        strengths: list[str] = []

        crp = result.compliance_risk_profile
        if crp.latest_risk_level == "high":
            concerns.append("High compliance risk level")
        elif crp.latest_risk_level == "low" and crp.total_flags_historical > 0:
            strengths.append("Low compliance risk")
        if crp.risk_trend == "increasing":
            concerns.append("Compliance risk trend is increasing")

        cdp = result.commitment_delivery_profile
        if cdp.delivery_reliability == "poor":
            concerns.append(f"Poor commitment delivery reliability (drift rate: {cdp.drift_rate:.0%})")
        elif cdp.delivery_reliability in ("strong", "good"):
            strengths.append(f"Commitment delivery reliability: {cdp.delivery_reliability}")
        if cdp.total_drifts > 0:
            concerns.append(f"{cdp.total_drifts} commitment drifts detected historically")

        srp = result.stakeholder_relationship_profile
        if srp.relationship_health == "strained":
            concerns.append("Strained stakeholder relationships")
        elif srp.relationship_health in ("strong", "positive"):
            strengths.append(f"Stakeholder relationship health: {srp.relationship_health}")

        gtp = result.governance_trajectory_profile
        if gtp.governance_quality in ("insufficient", "developing"):
            concerns.append(f"Governance quality: {gtp.governance_quality}")
        elif gtp.governance_quality == "strong":
            strengths.append("Strong governance trajectory")

        overall_risk = crp.latest_risk_level
        if cdp.delivery_reliability == "poor" or srp.relationship_health == "strained":
            risk_map = {"low": "medium", "medium": "high", "high": "high"}
            overall_risk = risk_map.get(overall_risk, overall_risk)

        return ProfileSummary(
            organisation_id=organisation_id,
            events_incorporated=result.events_incorporated,
            overall_risk_level=overall_risk,
            delivery_reliability=cdp.delivery_reliability,
            relationship_health=srp.relationship_health,
            governance_quality=gtp.governance_quality,
            key_concerns=concerns[:8],
            key_strengths=strengths[:8],
            confidence=result.confidence,
        )
