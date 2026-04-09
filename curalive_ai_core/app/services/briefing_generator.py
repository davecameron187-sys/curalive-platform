from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SignalRecord:
    signal_type: str
    source_name: str
    content: str
    sentiment: str | None
    sentiment_score: float | None
    topics: list[str] | None
    relevance_score: float


@dataclass
class CommitmentRecord:
    commitment_text: str
    commitment_type: str
    speaker_name: str | None
    deadline: str | None
    has_quantitative_target: bool
    confidence: float


@dataclass
class DriftRecord:
    drift_type: str
    severity: str
    matched_text: str
    explanation: str
    original_commitment_text: str
    confidence: float


@dataclass
class TopicEntry:
    topic: str
    confidence: float
    source: str
    detail: str | None = None


@dataclass
class PressurePoint:
    area: str
    severity: str
    source: str
    detail: str


@dataclass
class SentimentSummary:
    overall: str
    score: float
    positive_signals: int
    negative_signals: int
    neutral_signals: int
    key_themes: list[str]


@dataclass
class PredictedQuestion:
    question: str
    likelihood: str
    source: str
    theme: str
    rationale: str


@dataclass
class NarrativeRisk:
    level: str
    score: float
    indicators: list[str]
    detail: str


@dataclass
class BriefingResult:
    likely_topics: list[TopicEntry] = field(default_factory=list)
    pressure_points: list[PressurePoint] = field(default_factory=list)
    sentiment_summary: SentimentSummary | None = None
    predicted_questions: list[PredictedQuestion] = field(default_factory=list)
    narrative_risk: NarrativeRisk | None = None
    signals_used: int = 0
    commitments_referenced: int = 0
    drift_events_referenced: int = 0
    confidence: float = 0.0


TOPIC_QUESTION_TEMPLATES: dict[str, list[tuple[str, str]]] = {
    "revenue": [
        ("What is driving the change in revenue trajectory?", "Revenue growth appears to be a key area of stakeholder interest"),
        ("Can you provide guidance on top-line growth for the next quarter?", "Multiple signals reference revenue performance"),
    ],
    "margins": [
        ("What actions are being taken to protect margins?", "Margin pressure has been flagged in stakeholder signals"),
        ("When do you expect margin recovery to materialise?", "EBITDA/operating margin trends are under scrutiny"),
    ],
    "guidance": [
        ("Are you maintaining or revising your full-year guidance?", "Guidance credibility is a recurring stakeholder concern"),
        ("What assumptions underpin your current outlook?", "Forecast assumptions have been questioned"),
    ],
    "compliance": [
        ("What is the status of your regulatory compliance programme?", "Compliance-related signals indicate heightened interest"),
        ("How will upcoming regulatory changes affect your operations?", "Regulatory landscape is flagged as a concern"),
    ],
    "expansion": [
        ("What is the timeline for your expansion plans?", "Geographic/market expansion is a watched commitment"),
        ("How do you assess the risk profile of new market entry?", "Expansion strategy risk is a stakeholder concern"),
    ],
    "risk": [
        ("How are you managing the key risks identified in your latest filings?", "Risk factors are prominent in stakeholder communications"),
        ("What contingency plans are in place for adverse scenarios?", "Stakeholder signals highlight downside risk awareness"),
    ],
    "dividend": [
        ("Is the current dividend policy sustainable?", "Capital return policy is a key shareholder focus"),
        ("Are there plans to adjust the payout ratio?", "Dividend sustainability has been questioned"),
    ],
    "leadership": [
        ("Can you address management succession planning?", "Leadership continuity is a governance concern"),
        ("What is the board's assessment of executive performance?", "Leadership effectiveness is under review"),
    ],
    "esg": [
        ("What progress has been made on ESG commitments?", "ESG performance is increasingly material to investors"),
        ("How do you measure and report on sustainability targets?", "ESG disclosure adequacy is a stakeholder concern"),
    ],
    "debt": [
        ("What is the outlook for your leverage ratio?", "Balance sheet health is a key credit concern"),
        ("How do you plan to manage refinancing risk?", "Debt maturity profile is being watched"),
    ],
}

DRIFT_QUESTION_TEMPLATES: dict[str, list[tuple[str, str]]] = {
    "semantic": [
        ("Your previous commitment stated '{}' — can you clarify the current position?", "Semantic inconsistency detected between prior and current statements"),
    ],
    "numerical": [
        ("The target has shifted from the previously communicated figure — what drove this revision?", "Numerical drift detected in quantitative commitments"),
    ],
    "timing": [
        ("The timeline for '{}' appears to have changed — can you confirm the updated schedule?", "Timeline inconsistency detected against prior commitments"),
    ],
    "directional": [
        ("There appears to be a change in strategic direction regarding '{}' — can you elaborate?", "Directional shift detected in commitment language"),
    ],
}


class BriefingGenerator:
    def generate(
        self,
        signals: list[SignalRecord],
        commitments: list[CommitmentRecord],
        drifts: list[DriftRecord],
        event_type: str = "earnings_call",
    ) -> BriefingResult:
        result = BriefingResult(
            signals_used=len(signals),
            commitments_referenced=len(commitments),
            drift_events_referenced=len(drifts),
        )

        result.likely_topics = self._build_topics(signals, commitments, drifts)
        result.pressure_points = self._build_pressure_points(signals, drifts)
        result.sentiment_summary = self._build_sentiment(signals)
        result.predicted_questions = self._build_questions(signals, commitments, drifts, result.likely_topics)
        result.narrative_risk = self._build_narrative_risk(drifts, signals)

        topic_conf = sum(t.confidence for t in result.likely_topics) / max(len(result.likely_topics), 1)
        data_richness = min(1.0, (len(signals) * 0.1 + len(commitments) * 0.05 + len(drifts) * 0.15))
        result.confidence = round(min(1.0, (topic_conf * 0.4 + data_richness * 0.6)), 2)

        return result

    def _build_topics(
        self,
        signals: list[SignalRecord],
        commitments: list[CommitmentRecord],
        drifts: list[DriftRecord],
    ) -> list[TopicEntry]:
        topic_counts: Counter[str] = Counter()
        topic_sources: dict[str, str] = {}

        for sig in signals:
            if sig.topics:
                for t in sig.topics:
                    topic_counts[t] += 1
                    topic_sources.setdefault(t, f"signal:{sig.source_name}")

        commitment_topics = {
            "guidance": ["target", "goal_setting", "expectation"],
            "compliance": ["explicit_commitment", "reaffirmed_commitment"],
            "expansion": ["stated_intention"],
            "margins": ["will_statement"],
        }
        for c in commitments:
            for topic, types in commitment_topics.items():
                if c.commitment_type in types:
                    topic_counts[topic] += 1
                    topic_sources.setdefault(topic, "commitments")
            if c.deadline:
                topic_counts["guidance"] += 1

        drift_topic_map = {
            "numerical": "margins",
            "timing": "guidance",
            "semantic": "compliance",
            "directional": "guidance",
        }
        for d in drifts:
            mapped = drift_topic_map.get(d.drift_type, "risk")
            topic_counts[mapped] += 1
            topic_counts["risk"] += 1
            topic_sources.setdefault(mapped, "drift_events")

        total = sum(topic_counts.values()) or 1
        topics = []
        for topic, count in topic_counts.most_common(8):
            conf = round(min(1.0, count / total * 3), 2)
            topics.append(TopicEntry(
                topic=topic,
                confidence=conf,
                source=topic_sources.get(topic, "analysis"),
                detail=f"Referenced {count} times across signals, commitments, and drift events",
            ))

        return topics

    def _build_pressure_points(
        self,
        signals: list[SignalRecord],
        drifts: list[DriftRecord],
    ) -> list[PressurePoint]:
        points: list[PressurePoint] = []

        neg_signals = [s for s in signals if s.sentiment in ("negative", "mixed")]
        for sig in neg_signals[:5]:
            area = sig.topics[0] if sig.topics else "general"
            points.append(PressurePoint(
                area=area,
                severity="high" if sig.sentiment == "negative" else "medium",
                source=f"signal:{sig.source_name}",
                detail=sig.content[:200],
            ))

        for d in drifts:
            if d.severity in ("high", "medium"):
                points.append(PressurePoint(
                    area=f"commitment_drift:{d.drift_type}",
                    severity=d.severity,
                    source="drift_detection",
                    detail=d.explanation[:200],
                ))

        points.sort(key=lambda p: {"high": 0, "medium": 1, "low": 2}.get(p.severity, 3))
        return points[:10]

    def _build_sentiment(self, signals: list[SignalRecord]) -> SentimentSummary:
        pos = sum(1 for s in signals if s.sentiment == "positive")
        neg = sum(1 for s in signals if s.sentiment == "negative")
        neu = sum(1 for s in signals if s.sentiment in ("neutral", None))

        scores = [s.sentiment_score for s in signals if s.sentiment_score is not None]
        avg_score = round(sum(scores) / max(len(scores), 1), 2)

        if avg_score > 0.2:
            overall = "positive"
        elif avg_score < -0.2:
            overall = "negative"
        elif pos > 0 and neg > 0:
            overall = "mixed"
        else:
            overall = "neutral"

        all_topics: list[str] = []
        for s in signals:
            if s.topics:
                all_topics.extend(s.topics)
        key_themes = [t for t, _ in Counter(all_topics).most_common(5)]

        return SentimentSummary(
            overall=overall,
            score=avg_score,
            positive_signals=pos,
            negative_signals=neg,
            neutral_signals=neu,
            key_themes=key_themes,
        )

    def _build_questions(
        self,
        signals: list[SignalRecord],
        commitments: list[CommitmentRecord],
        drifts: list[DriftRecord],
        topics: list[TopicEntry],
    ) -> list[PredictedQuestion]:
        questions: list[PredictedQuestion] = []
        seen_themes: set[str] = set()

        for d in drifts:
            templates = DRIFT_QUESTION_TEMPLATES.get(d.drift_type, [])
            for tmpl, rationale in templates[:1]:
                commitment_snippet = d.original_commitment_text[:60]
                q_text = tmpl.format(commitment_snippet) if "{}" in tmpl else tmpl
                theme = f"drift:{d.drift_type}"
                if theme not in seen_themes:
                    seen_themes.add(theme)
                    questions.append(PredictedQuestion(
                        question=q_text,
                        likelihood="high" if d.severity == "high" else "medium",
                        source="drift_detection",
                        theme=theme,
                        rationale=rationale,
                    ))

        for topic_entry in topics[:6]:
            topic = topic_entry.topic
            if topic in TOPIC_QUESTION_TEMPLATES and topic not in seen_themes:
                seen_themes.add(topic)
                tmpl_list = TOPIC_QUESTION_TEMPLATES[topic]
                for q_tmpl, rationale in tmpl_list[:1]:
                    questions.append(PredictedQuestion(
                        question=q_tmpl,
                        likelihood="high" if topic_entry.confidence > 0.6 else "medium",
                        source=topic_entry.source,
                        theme=topic,
                        rationale=rationale,
                    ))

        return questions[:12]

    def _build_narrative_risk(
        self,
        drifts: list[DriftRecord],
        signals: list[SignalRecord],
    ) -> NarrativeRisk:
        indicators: list[str] = []
        score = 0.0

        high_drifts = [d for d in drifts if d.severity == "high"]
        if high_drifts:
            score += min(0.4, len(high_drifts) * 0.1)
            indicators.append(f"{len(high_drifts)} high-severity commitment drifts detected")

        med_drifts = [d for d in drifts if d.severity == "medium"]
        if med_drifts:
            score += min(0.2, len(med_drifts) * 0.05)
            indicators.append(f"{len(med_drifts)} medium-severity commitment drifts detected")

        neg_signals = [s for s in signals if s.sentiment == "negative"]
        if neg_signals:
            score += min(0.2, len(neg_signals) * 0.05)
            indicators.append(f"{len(neg_signals)} negative stakeholder signals")

        mixed_signals = [s for s in signals if s.sentiment == "mixed"]
        if mixed_signals:
            score += min(0.1, len(mixed_signals) * 0.03)
            indicators.append(f"{len(mixed_signals)} mixed-sentiment signals")

        drift_types = set(d.drift_type for d in drifts)
        if len(drift_types) >= 3:
            score += 0.15
            indicators.append(f"Drifts span {len(drift_types)} categories — possible coordinated narrative shift")

        score = round(min(1.0, score), 2)

        if score >= 0.6:
            level = "high"
            detail = "Significant narrative inconsistency detected. High risk of challenging Q&A."
        elif score >= 0.3:
            level = "medium"
            detail = "Moderate narrative tension. Some commitments may face scrutiny."
        else:
            level = "low"
            detail = "Narrative appears broadly consistent. Limited coordinated risk."

        if not indicators:
            indicators.append("No significant risk indicators detected")

        return NarrativeRisk(level=level, score=score, indicators=indicators, detail=detail)
