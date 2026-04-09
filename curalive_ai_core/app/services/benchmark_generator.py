from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Any

MIN_EVENTS_FOR_RELIABLE = 3
MIN_CONFIDENCE_THRESHOLD = 0.3


@dataclass
class EventBucket:
    event_id: str
    organisation_id: str
    event_type: str | None = None
    jurisdiction: str | None = None
    sector: str | None = None
    flags_count: int = 0
    flags_by_type: dict[str, int] = field(default_factory=dict)
    flags_by_severity: dict[str, int] = field(default_factory=dict)
    commitments_count: int = 0
    commitments_by_type: dict[str, int] = field(default_factory=dict)
    commitments_by_status: dict[str, int] = field(default_factory=dict)
    avg_commitment_confidence: float = 0.0
    quantitative_target_count: int = 0
    drifts_count: int = 0
    drifts_by_type: dict[str, int] = field(default_factory=dict)
    drifts_by_severity: dict[str, int] = field(default_factory=dict)
    avg_drift_confidence: float = 0.0
    governance_risk_level: str | None = None
    governance_confidence: float = 0.0
    governance_matters_arising: int = 0
    governance_flags_count: int = 0
    governance_topics: list[str] = field(default_factory=list)


@dataclass
class OrgBucket:
    organisation_id: str
    sector: str | None = None
    jurisdiction: str | None = None
    signals_count: int = 0
    signals_by_type: dict[str, int] = field(default_factory=dict)
    sentiment_distribution: dict[str, int] = field(default_factory=dict)
    avg_sentiment_score: float = 0.0
    top_sources: list[str] = field(default_factory=list)
    top_themes: list[str] = field(default_factory=list)


@dataclass
class BenchmarkQuality:
    low_sample: bool = False
    zero_events: bool = False
    weak_confidence: bool = False
    event_count: int = 0
    organisation_count: int = 0
    confidence: float = 0.0
    quality_notes: list[str] = field(default_factory=list)

    @property
    def usable(self) -> bool:
        return not self.zero_events and self.confidence >= MIN_CONFIDENCE_THRESHOLD


@dataclass
class BenchmarkResult:
    segment_key: str
    segment_type: str
    segment_value: str
    event_count: int = 0
    organisation_count: int = 0
    compliance_baselines: dict[str, Any] = field(default_factory=dict)
    commitment_baselines: dict[str, Any] = field(default_factory=dict)
    drift_baselines: dict[str, Any] = field(default_factory=dict)
    sentiment_baselines: dict[str, Any] = field(default_factory=dict)
    governance_baselines: dict[str, Any] = field(default_factory=dict)
    topic_baselines: dict[str, Any] = field(default_factory=dict)
    summary: dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    quality: BenchmarkQuality = field(default_factory=BenchmarkQuality)


def make_segment_key(segment_type: str, segment_value: str) -> str:
    return f"{segment_type}:{segment_value}"


class BenchmarkGenerator:
    def build_benchmark(
        self,
        segment_type: str,
        segment_value: str,
        event_buckets: list[EventBucket],
        org_buckets: list[OrgBucket],
    ) -> BenchmarkResult:
        segment_key = make_segment_key(segment_type, segment_value)
        result = BenchmarkResult(
            segment_key=segment_key,
            segment_type=segment_type,
            segment_value=segment_value,
            event_count=len(event_buckets),
            organisation_count=len(org_buckets),
        )

        result.compliance_baselines = self._build_compliance_baselines(event_buckets)
        result.commitment_baselines = self._build_commitment_baselines(event_buckets)
        result.drift_baselines = self._build_drift_baselines(event_buckets)
        result.sentiment_baselines = self._build_sentiment_baselines(org_buckets)
        result.governance_baselines = self._build_governance_baselines(event_buckets)
        result.topic_baselines = self._build_topic_baselines(event_buckets)

        sections_populated = sum([
            1 if result.compliance_baselines.get("total_flags", 0) > 0 else 0,
            1 if result.commitment_baselines.get("total_commitments", 0) > 0 else 0,
            1 if result.governance_baselines.get("total_records", 0) > 0 else 0,
            1 if result.sentiment_baselines.get("total_signals", 0) > 0 else 0,
        ]) / 4
        volume_score = min(1.0, len(event_buckets) * 0.1 + len(org_buckets) * 0.1)
        result.confidence = round(min(1.0, sections_populated * 0.5 + volume_score * 0.5), 2)

        result.quality = self.assess_quality(result)

        result.summary = {
            "segment_key": segment_key,
            "segment_type": segment_type,
            "segment_value": segment_value,
            "event_count": result.event_count,
            "organisation_count": result.organisation_count,
            "avg_flags_per_event": result.compliance_baselines.get("avg_flags_per_event", 0.0),
            "avg_commitments_per_event": result.commitment_baselines.get("avg_commitments_per_event", 0.0),
            "drift_rate": result.drift_baselines.get("drift_rate", 0.0),
            "avg_sentiment_score": result.sentiment_baselines.get("avg_sentiment_score", 0.0),
            "avg_governance_confidence": result.governance_baselines.get("avg_confidence", 0.0),
            "most_common_risk_level": result.governance_baselines.get("most_common_risk_level"),
            "top_topics": result.topic_baselines.get("top_topics", []),
            "confidence": result.confidence,
            "low_sample": result.quality.low_sample,
            "quality_notes": result.quality.quality_notes,
        }

        return result

    def assess_quality(self, result: BenchmarkResult) -> BenchmarkQuality:
        quality = BenchmarkQuality(
            event_count=result.event_count,
            organisation_count=result.organisation_count,
            confidence=result.confidence,
        )

        if result.event_count == 0:
            quality.zero_events = True
            quality.quality_notes.append("No events in this segment")

        if result.event_count < MIN_EVENTS_FOR_RELIABLE:
            quality.low_sample = True
            quality.quality_notes.append(f"Low sample: {result.event_count} events (minimum recommended: {MIN_EVENTS_FOR_RELIABLE})")

        if result.confidence < MIN_CONFIDENCE_THRESHOLD:
            quality.weak_confidence = True
            quality.quality_notes.append(f"Weak confidence: {result.confidence} (threshold: {MIN_CONFIDENCE_THRESHOLD})")

        if not quality.quality_notes:
            quality.quality_notes.append("Benchmark quality acceptable")

        return quality

    def select_best_segment(
        self,
        candidates: list[dict[str, Any]],
        fallback_key: str = "global:all",
    ) -> tuple[dict[str, Any] | None, str | None]:
        usable = []
        for bm in candidates:
            event_count = bm.get("event_count", 0)
            confidence = bm.get("confidence", 0.0)
            low_sample = bm.get("low_sample", False)
            if event_count == 0:
                continue
            if confidence < MIN_CONFIDENCE_THRESHOLD:
                continue
            usable.append(bm)

        if not usable:
            fallback = None
            for bm in candidates:
                if bm.get("segment_key") == fallback_key:
                    fallback = bm
                    break
            if fallback and fallback.get("event_count", 0) > 0:
                return fallback, fallback_key
            return None, None

        usable.sort(key=lambda b: (
            0 if not b.get("low_sample", False) else 1,
            -b.get("confidence", 0.0),
            -b.get("event_count", 0),
        ))

        best = usable[0]
        fallback_used = None
        if best.get("low_sample", False):
            for bm in candidates:
                if bm.get("segment_key") == fallback_key and not bm.get("low_sample", False):
                    return bm, fallback_key
            fallback_used = fallback_key

        return best, fallback_used

    def build_sector_enrichment(
        self,
        org_profile: dict[str, Any],
        benchmark: dict[str, Any] | None,
        fallback_segment_used: str | None = None,
    ) -> dict[str, Any]:
        crp = org_profile.get("compliance_risk_profile", {})
        cdp = org_profile.get("commitment_delivery_profile", {})
        srp = org_profile.get("stakeholder_relationship_profile", {})
        gtp = org_profile.get("governance_trajectory_profile", {})

        sector_ctx = dict(org_profile.get("sector_context", {}))

        if not benchmark:
            sector_ctx["benchmark_segment"] = None
            sector_ctx["benchmark_quality"] = "unavailable"
            sector_ctx["notes"] = "No benchmark data available for comparison."
            return {
                "sector_context": sector_ctx,
                "benchmark_comparison": {},
                "profile_summary_updates": None,
            }

        bm_compliance = benchmark.get("compliance_baselines", {})
        bm_commitment = benchmark.get("commitment_baselines", {})
        bm_drift = benchmark.get("drift_baselines", {})
        bm_sentiment = benchmark.get("sentiment_baselines", {})
        bm_governance = benchmark.get("governance_baselines", {})
        bm_summary = benchmark.get("summary", {})

        org_flags_per_event = crp.get("avg_flags_per_event", 0.0)
        bm_flags_per_event = bm_compliance.get("avg_flags_per_event", 0.0)
        compliance_vs = self._compare(org_flags_per_event, bm_flags_per_event, invert=True)

        org_commitments = cdp.get("total_commitments", 0)
        events_inc = org_profile.get("events_incorporated", 1)
        org_commits_per_event = org_commitments / max(events_inc, 1)
        bm_commits_per_event = bm_commitment.get("avg_commitments_per_event", 0.0)
        commitment_vs = self._compare(org_commits_per_event, bm_commits_per_event)

        org_drift_rate = cdp.get("drift_rate", 0.0)
        bm_drift_rate = bm_drift.get("drift_rate", 0.0)
        drift_vs = self._compare(org_drift_rate, bm_drift_rate, invert=True)

        org_sentiment = srp.get("avg_sentiment_score", 0.0)
        bm_sentiment_score = bm_sentiment.get("avg_sentiment_score", 0.0)
        sentiment_vs = self._compare(org_sentiment, bm_sentiment_score)

        org_gov_conf = gtp.get("avg_confidence", 0.0)
        bm_gov_conf = bm_governance.get("avg_confidence", 0.0)
        governance_vs = self._compare(org_gov_conf, bm_gov_conf)

        bm_low_sample = bm_summary.get("low_sample", False)
        bm_quality = "low_sample" if bm_low_sample else "reliable"
        if fallback_segment_used:
            bm_quality = "fallback"

        comparison = {
            "benchmark_segment": benchmark.get("segment_key", ""),
            "benchmark_event_count": bm_summary.get("event_count", 0),
            "benchmark_org_count": bm_summary.get("organisation_count", 0),
            "benchmark_quality": bm_quality,
            "fallback_segment_used": fallback_segment_used,
            "compliance_flags_per_event": {"org": org_flags_per_event, "benchmark": bm_flags_per_event, "position": compliance_vs},
            "commitments_per_event": {"org": round(org_commits_per_event, 2), "benchmark": bm_commits_per_event, "position": commitment_vs},
            "drift_rate": {"org": org_drift_rate, "benchmark": bm_drift_rate, "position": drift_vs},
            "sentiment_score": {"org": org_sentiment, "benchmark": bm_sentiment_score, "position": sentiment_vs},
            "governance_confidence": {"org": org_gov_conf, "benchmark": bm_gov_conf, "position": governance_vs},
        }

        sector_ctx["benchmark_segment"] = benchmark.get("segment_key", "")
        sector_ctx["benchmark_event_count"] = bm_summary.get("event_count", 0)
        sector_ctx["benchmark_org_count"] = bm_summary.get("organisation_count", 0)
        sector_ctx["benchmark_quality"] = bm_quality
        sector_ctx["fallback_segment_used"] = fallback_segment_used
        sector_ctx["compliance_position"] = compliance_vs
        sector_ctx["commitment_position"] = commitment_vs
        sector_ctx["drift_position"] = drift_vs
        sector_ctx["sentiment_position"] = sentiment_vs
        sector_ctx["governance_position"] = governance_vs

        quality_note = ""
        if bm_low_sample:
            quality_note = " (low sample — interpret with caution)"
        if fallback_segment_used:
            quality_note = f" (using fallback segment '{fallback_segment_used}')"
        sector_ctx["notes"] = f"Sector context enriched from benchmark segment '{benchmark.get('segment_key', '')}'{quality_note}."

        concerns: list[str] = []
        strengths: list[str] = []
        if compliance_vs == "below_benchmark":
            concerns.append("Compliance flags above benchmark average")
        elif compliance_vs == "above_benchmark":
            strengths.append("Compliance flags below benchmark average")
        if drift_vs == "below_benchmark":
            concerns.append("Drift rate above benchmark average")
        elif drift_vs == "above_benchmark":
            strengths.append("Drift rate below benchmark average")
        if sentiment_vs == "below_benchmark":
            concerns.append("Sentiment below benchmark average")
        elif sentiment_vs == "above_benchmark":
            strengths.append("Sentiment above benchmark average")
        if governance_vs == "below_benchmark":
            concerns.append("Governance confidence below benchmark average")
        elif governance_vs == "above_benchmark":
            strengths.append("Governance confidence above benchmark average")

        summary_updates = None
        if concerns or strengths:
            summary_updates = {
                "benchmark_concerns": concerns,
                "benchmark_strengths": strengths,
            }

        return {
            "sector_context": sector_ctx,
            "benchmark_comparison": comparison,
            "profile_summary_updates": summary_updates,
        }

    def build_briefing_benchmark_context(
        self,
        org_profile: dict[str, Any],
        benchmark: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if not benchmark:
            return {}

        enrichment = self.build_sector_enrichment(org_profile, benchmark)
        comparison = enrichment.get("benchmark_comparison", {})
        summary_updates = enrichment.get("profile_summary_updates")

        context: dict[str, Any] = {
            "benchmark_segment": comparison.get("benchmark_segment", ""),
            "benchmark_event_count": comparison.get("benchmark_event_count", 0),
            "benchmark_quality": comparison.get("benchmark_quality", "unknown"),
            "dimensions": {},
        }

        for dim_key in ["compliance_flags_per_event", "commitments_per_event", "drift_rate", "sentiment_score", "governance_confidence"]:
            dim = comparison.get(dim_key, {})
            if dim:
                context["dimensions"][dim_key] = dim

        if summary_updates:
            context["benchmark_concerns"] = summary_updates.get("benchmark_concerns", [])
            context["benchmark_strengths"] = summary_updates.get("benchmark_strengths", [])
        else:
            context["benchmark_concerns"] = []
            context["benchmark_strengths"] = []

        return context

    def _compare(self, org_val: float, bm_val: float, invert: bool = False) -> str:
        if bm_val == 0 and org_val == 0:
            return "at_benchmark"
        if bm_val == 0:
            return "above_benchmark" if not invert else "below_benchmark"

        ratio = org_val / bm_val
        if invert:
            if ratio > 1.15:
                return "below_benchmark"
            elif ratio < 0.85:
                return "above_benchmark"
            else:
                return "at_benchmark"
        else:
            if ratio > 1.15:
                return "above_benchmark"
            elif ratio < 0.85:
                return "below_benchmark"
            else:
                return "at_benchmark"

    def _build_compliance_baselines(self, events: list[EventBucket]) -> dict[str, Any]:
        if not events:
            return {"total_flags": 0, "avg_flags_per_event": 0.0, "flags_by_type": {}, "flags_by_severity": {}, "high_flag_rate": 0.0, "most_common_type": None, "most_common_severity": None}

        total_flags = sum(e.flags_count for e in events)
        type_counts: Counter[str] = Counter()
        severity_counts: Counter[str] = Counter()
        for e in events:
            for k, v in e.flags_by_type.items():
                type_counts[k] += v
            for k, v in e.flags_by_severity.items():
                severity_counts[k] += v

        high_count = severity_counts.get("high", 0) + severity_counts.get("critical", 0)
        high_rate = round(high_count / max(total_flags, 1), 2)

        return {
            "total_flags": total_flags,
            "avg_flags_per_event": round(total_flags / max(len(events), 1), 2),
            "flags_by_type": dict(type_counts),
            "flags_by_severity": dict(severity_counts),
            "high_flag_rate": high_rate,
            "most_common_type": type_counts.most_common(1)[0][0] if type_counts else None,
            "most_common_severity": severity_counts.most_common(1)[0][0] if severity_counts else None,
        }

    def _build_commitment_baselines(self, events: list[EventBucket]) -> dict[str, Any]:
        if not events:
            return {"total_commitments": 0, "avg_commitments_per_event": 0.0, "commitments_by_type": {}, "commitments_by_status": {}, "avg_confidence": 0.0, "quantitative_target_rate": 0.0, "most_common_type": None}

        total = sum(e.commitments_count for e in events)
        type_counts: Counter[str] = Counter()
        status_counts: Counter[str] = Counter()
        confidences: list[float] = []
        quant_total = 0

        for e in events:
            for k, v in e.commitments_by_type.items():
                type_counts[k] += v
            for k, v in e.commitments_by_status.items():
                status_counts[k] += v
            if e.avg_commitment_confidence > 0:
                confidences.append(e.avg_commitment_confidence)
            quant_total += e.quantitative_target_count

        return {
            "total_commitments": total,
            "avg_commitments_per_event": round(total / max(len(events), 1), 2),
            "commitments_by_type": dict(type_counts),
            "commitments_by_status": dict(status_counts),
            "avg_confidence": round(sum(confidences) / max(len(confidences), 1), 2),
            "quantitative_target_rate": round(quant_total / max(total, 1), 2),
            "most_common_type": type_counts.most_common(1)[0][0] if type_counts else None,
        }

    def _build_drift_baselines(self, events: list[EventBucket]) -> dict[str, Any]:
        if not events:
            return {"total_drifts": 0, "avg_drifts_per_event": 0.0, "drifts_by_type": {}, "drifts_by_severity": {}, "drift_rate": 0.0, "avg_confidence": 0.0}

        total_drifts = sum(e.drifts_count for e in events)
        total_commitments = sum(e.commitments_count for e in events)
        type_counts: Counter[str] = Counter()
        severity_counts: Counter[str] = Counter()
        confidences: list[float] = []

        for e in events:
            for k, v in e.drifts_by_type.items():
                type_counts[k] += v
            for k, v in e.drifts_by_severity.items():
                severity_counts[k] += v
            if e.avg_drift_confidence > 0:
                confidences.append(e.avg_drift_confidence)

        return {
            "total_drifts": total_drifts,
            "avg_drifts_per_event": round(total_drifts / max(len(events), 1), 2),
            "drifts_by_type": dict(type_counts),
            "drifts_by_severity": dict(severity_counts),
            "drift_rate": round(total_drifts / max(total_commitments, 1), 2),
            "avg_confidence": round(sum(confidences) / max(len(confidences), 1), 2),
        }

    def _build_sentiment_baselines(self, orgs: list[OrgBucket]) -> dict[str, Any]:
        if not orgs:
            return {"total_signals": 0, "avg_signals_per_org": 0.0, "sentiment_distribution": {}, "avg_sentiment_score": 0.0, "signals_by_type": {}, "top_sources": [], "top_themes": []}

        total_signals = sum(o.signals_count for o in orgs)
        type_counts: Counter[str] = Counter()
        sentiment_counts: Counter[str] = Counter()
        source_counts: Counter[str] = Counter()
        theme_counts: Counter[str] = Counter()
        scores: list[float] = []

        for o in orgs:
            for k, v in o.signals_by_type.items():
                type_counts[k] += v
            for k, v in o.sentiment_distribution.items():
                sentiment_counts[k] += v
            for s in o.top_sources:
                source_counts[s] += 1
            for t in o.top_themes:
                theme_counts[t] += 1
            if o.avg_sentiment_score != 0:
                scores.append(o.avg_sentiment_score)

        return {
            "total_signals": total_signals,
            "avg_signals_per_org": round(total_signals / max(len(orgs), 1), 2),
            "sentiment_distribution": dict(sentiment_counts),
            "avg_sentiment_score": round(sum(scores) / max(len(scores), 1), 2),
            "signals_by_type": dict(type_counts),
            "top_sources": [s for s, _ in source_counts.most_common(10)],
            "top_themes": [t for t, _ in theme_counts.most_common(10)],
        }

    def _build_governance_baselines(self, events: list[EventBucket]) -> dict[str, Any]:
        gov_events = [e for e in events if e.governance_risk_level is not None]
        if not gov_events:
            return {"total_records": 0, "avg_confidence": 0.0, "risk_level_distribution": {}, "avg_matters_arising": 0.0, "avg_flags_per_record": 0.0, "most_common_risk_level": None}

        risk_counts: Counter[str] = Counter()
        confidences: list[float] = []
        matters: list[int] = []
        flags: list[int] = []

        for e in gov_events:
            risk_counts[e.governance_risk_level or "low"] += 1
            confidences.append(e.governance_confidence)
            matters.append(e.governance_matters_arising)
            flags.append(e.governance_flags_count)

        return {
            "total_records": len(gov_events),
            "avg_confidence": round(sum(confidences) / max(len(confidences), 1), 2),
            "risk_level_distribution": dict(risk_counts),
            "avg_matters_arising": round(sum(matters) / max(len(matters), 1), 1),
            "avg_flags_per_record": round(sum(flags) / max(len(flags), 1), 1),
            "most_common_risk_level": risk_counts.most_common(1)[0][0] if risk_counts else None,
        }

    def _build_topic_baselines(self, events: list[EventBucket]) -> dict[str, Any]:
        topic_counts: Counter[str] = Counter()
        for e in events:
            for t in e.governance_topics:
                topic_counts[t] += 1

        top = [t for t, _ in topic_counts.most_common(15)]
        return {
            "topic_frequency": dict(topic_counts.most_common(20)),
            "top_topics": top,
            "topic_count": len(topic_counts),
        }
