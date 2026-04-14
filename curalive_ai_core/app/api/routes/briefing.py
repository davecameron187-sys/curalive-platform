from __future__ import annotations

import dataclasses
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.benchmark import Benchmark
from app.models.briefing import Briefing
from app.models.commitment import Commitment, CommitmentStatus
from app.models.drift_event import DriftEvent
from app.models.org_profile import OrgProfile
from app.models.stakeholder_signal import StakeholderSignal
from app.schemas.briefing import (
    BenchmarkContextSchema,
    BriefingGenerateRequest,
    BriefingResponse,
    BriefingRetrieveResponse,
    NarrativeRisk,
    PredictedQuestion,
    PressurePoint,
    SentimentSummary,
    TopicEntry,
)
from app.services.benchmark_generator import BenchmarkGenerator
from app.services.briefing_generator import (
    BriefingGenerator,
    CommitmentRecord,
    DriftRecord,
    SignalRecord,
)

router = APIRouter()


def _dc_to_dict(obj):
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: _dc_to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [_dc_to_dict(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _dc_to_dict(v) for k, v in obj.items()}
    return obj


def _load_benchmark_context(
    db: Session,
    organisation_id: str,
    event_type: str | None,
) -> dict | None:
    try:
        profile = db.query(OrgProfile).filter(OrgProfile.organisation_id == organisation_id).first()
        if not profile:
            return None

        all_bms = db.query(Benchmark).all()
        if not all_bms:
            return None

        candidates = []
        for bm in all_bms:
            candidates.append({
                "segment_key": bm.segment_key,
                "event_count": bm.event_count,
                "organisation_count": bm.organisation_count,
                "confidence": bm.confidence,
                "low_sample": bm.low_sample or False,
                "compliance_baselines": bm.compliance_baselines or {},
                "commitment_baselines": bm.commitment_baselines or {},
                "drift_baselines": bm.drift_baselines or {},
                "sentiment_baselines": bm.sentiment_baselines or {},
                "governance_baselines": bm.governance_baselines or {},
                "summary": bm.summary or {},
            })

        bm_gen = BenchmarkGenerator()

        preferred = []
        if event_type:
            et_key = f"event_type:{event_type}"
            preferred = [c for c in candidates if c["segment_key"] == et_key]
        if not preferred:
            preferred = [c for c in candidates if c["segment_key"] == "global:all"]
        if not preferred:
            preferred = candidates

        best_bm, fallback_used = bm_gen.select_best_segment(preferred)
        if not best_bm:
            best_bm, fallback_used = bm_gen.select_best_segment(candidates)

        if not best_bm:
            return None

        org_dict = {
            "compliance_risk_profile": profile.compliance_risk_profile or {},
            "commitment_delivery_profile": profile.commitment_delivery_profile or {},
            "stakeholder_relationship_profile": profile.stakeholder_relationship_profile or {},
            "governance_trajectory_profile": profile.governance_trajectory_profile or {},
            "sector_context": profile.sector_context or {},
            "events_incorporated": profile.events_incorporated,
        }

        ctx = bm_gen.build_briefing_benchmark_context(org_dict, best_bm)
        if ctx and fallback_used:
            ctx["benchmark_quality"] = "fallback"
            ctx["fallback_segment_used"] = fallback_used
        return ctx
    except Exception as exc:
        print(f"[Briefing] Benchmark context loading failed (non-blocking): {exc}")
        return None


@router.post("/generate", response_model=BriefingResponse)
async def generate_briefing(
    request: BriefingGenerateRequest,
    db: Session = Depends(get_db),
) -> BriefingResponse:
    start = time.monotonic()

    signal_rows = (
        db.query(StakeholderSignal)
        .filter(StakeholderSignal.organisation_id == request.organisation_id)
        .order_by(StakeholderSignal.created_at.desc())
        .limit(100)
        .all()
    )

    open_statuses = [CommitmentStatus.OPEN, CommitmentStatus.MONITORED, CommitmentStatus.ESCALATED]
    commitment_rows = (
        db.query(Commitment)
        .filter(
            Commitment.organisation_id == request.organisation_id,
            Commitment.status.in_(open_statuses),
        )
        .all()
    )

    drift_rows = (
        db.query(DriftEvent)
        .filter(DriftEvent.organisation_id == request.organisation_id)
        .order_by(DriftEvent.created_at.desc())
        .limit(50)
        .all()
    )

    signals = [
        SignalRecord(
            signal_type=s.signal_type,
            source_name=s.source_name,
            content=s.content,
            sentiment=s.sentiment,
            sentiment_score=s.sentiment_score,
            topics=s.topics or [],
            relevance_score=s.relevance_score,
        )
        for s in signal_rows
    ]

    commitments = [
        CommitmentRecord(
            commitment_text=c.commitment_text,
            commitment_type=c.commitment_type,
            speaker_name=c.speaker_name,
            deadline=c.deadline,
            has_quantitative_target=c.has_quantitative_target,
            confidence=c.confidence,
        )
        for c in commitment_rows
    ]

    drifts = [
        DriftRecord(
            drift_type=d.drift_type,
            severity=d.severity,
            matched_text=d.matched_text,
            explanation=d.explanation,
            original_commitment_text=d.original_commitment_text,
            confidence=d.confidence,
        )
        for d in drift_rows
    ]

    benchmark_ctx = _load_benchmark_context(db, request.organisation_id, request.event_type)

    generator = BriefingGenerator()
    result = generator.generate(signals, commitments, drifts, request.event_type or "earnings_call", benchmark_ctx)

    elapsed = round((time.monotonic() - start) * 1000, 1)

    briefing = Briefing(
        organisation_id=request.organisation_id,
        event_id=request.event_id,
        event_name=request.event_name,
        event_type=request.event_type,
        likely_topics=_dc_to_dict(result.likely_topics),
        pressure_points=_dc_to_dict(result.pressure_points),
        sentiment_summary=_dc_to_dict(result.sentiment_summary) if result.sentiment_summary else {},
        predicted_questions=_dc_to_dict(result.predicted_questions),
        narrative_risk=_dc_to_dict(result.narrative_risk) if result.narrative_risk else {},
        signals_used=result.signals_used,
        commitments_referenced=result.commitments_referenced,
        drift_events_referenced=result.drift_events_referenced,
        confidence=result.confidence,
        duration_ms=elapsed,
    )
    db.add(briefing)

    try:
        db.commit()
        db.refresh(briefing)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist briefing: {exc}")

    sentiment = result.sentiment_summary
    narrative = result.narrative_risk

    bm_ctx_schema = None
    if result.benchmark_context:
        bm = result.benchmark_context
        bm_quality = benchmark_ctx.get("benchmark_quality", bm.benchmark_quality) if benchmark_ctx else bm.benchmark_quality
        fb_used = benchmark_ctx.get("fallback_segment_used") if benchmark_ctx else None
        bm_ctx_schema = BenchmarkContextSchema(
            benchmark_segment=bm.benchmark_segment,
            benchmark_event_count=bm.benchmark_event_count,
            benchmark_quality=bm_quality,
            fallback_segment_used=fb_used,
            dimensions=bm.dimensions,
            benchmark_concerns=bm.benchmark_concerns,
            benchmark_strengths=bm.benchmark_strengths,
        )

    return BriefingResponse(
        briefing_id=str(briefing.id),
        organisation_id=request.organisation_id,
        event_id=request.event_id,
        event_name=request.event_name,
        likely_topics=[
            TopicEntry(topic=t.topic, confidence=t.confidence, source=t.source, detail=t.detail)
            for t in result.likely_topics
        ],
        pressure_points=[
            PressurePoint(area=p.area, severity=p.severity, source=p.source, detail=p.detail)
            for p in result.pressure_points
        ],
        sentiment_summary=SentimentSummary(
            overall=sentiment.overall if sentiment else "neutral",
            score=sentiment.score if sentiment else 0.0,
            positive_signals=sentiment.positive_signals if sentiment else 0,
            negative_signals=sentiment.negative_signals if sentiment else 0,
            neutral_signals=sentiment.neutral_signals if sentiment else 0,
            key_themes=sentiment.key_themes if sentiment else [],
        ),
        predicted_questions=[
            PredictedQuestion(
                question=q.question, likelihood=q.likelihood,
                source=q.source, theme=q.theme, rationale=q.rationale,
            )
            for q in result.predicted_questions
        ],
        narrative_risk=NarrativeRisk(
            level=narrative.level if narrative else "low",
            score=narrative.score if narrative else 0.0,
            indicators=narrative.indicators if narrative else [],
            detail=narrative.detail if narrative else "",
        ),
        benchmark_context=bm_ctx_schema,
        signals_used=result.signals_used,
        commitments_referenced=result.commitments_referenced,
        drift_events_referenced=result.drift_events_referenced,
        confidence=result.confidence,
        duration_ms=elapsed,
        created_at=briefing.created_at,
    )


@router.get("/{briefing_id}", response_model=BriefingRetrieveResponse)
async def get_briefing(
    briefing_id: str,
    db: Session = Depends(get_db),
) -> BriefingRetrieveResponse:
    try:
        uid = uuid.UUID(briefing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid briefing_id format")

    briefing = db.query(Briefing).filter(Briefing.id == uid).first()
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")

    return BriefingRetrieveResponse(
        briefing_id=str(briefing.id),
        organisation_id=briefing.organisation_id,
        event_id=briefing.event_id,
        event_name=briefing.event_name,
        likely_topics=briefing.likely_topics or [],
        pressure_points=briefing.pressure_points or [],
        sentiment_summary=briefing.sentiment_summary or {},
        predicted_questions=briefing.predicted_questions or [],
        narrative_risk=briefing.narrative_risk or {},
        signals_used=briefing.signals_used,
        commitments_referenced=briefing.commitments_referenced,
        drift_events_referenced=briefing.drift_events_referenced,
        confidence=briefing.confidence,
        duration_ms=briefing.duration_ms,
        created_at=briefing.created_at,
    )
