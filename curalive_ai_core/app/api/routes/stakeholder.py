from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.stakeholder_signal import StakeholderSignal
from app.schemas.stakeholder import (
    StakeholderSignalBatchRequest,
    StakeholderSignalBatchResponse,
    StakeholderSignalQueryRequest,
    StakeholderSignalQueryResponse,
    StakeholderSignalResponse,
)
from app.services.stakeholder_intelligence import analyse_signal_content

router = APIRouter()


@router.post("/ingest", response_model=StakeholderSignalBatchResponse)
async def ingest_signals(
    request: StakeholderSignalBatchRequest,
    db: Session = Depends(get_db),
) -> StakeholderSignalBatchResponse:
    results: list[StakeholderSignalResponse] = []

    for sig_input in request.signals:
        analysis = analyse_signal_content(sig_input.content)

        sentiment = sig_input.sentiment or analysis.sentiment
        sentiment_score = analysis.sentiment_score
        topics = sig_input.topics if sig_input.topics else analysis.topics

        record = StakeholderSignal(
            organisation_id=sig_input.organisation_id,
            signal_type=sig_input.signal_type,
            source_name=sig_input.source_name,
            source_url=sig_input.source_url,
            author=sig_input.author,
            title=sig_input.title,
            content=sig_input.content,
            sentiment=sentiment,
            sentiment_score=sentiment_score,
            topics=topics,
            relevance_score=sig_input.relevance_score,
            signal_date=sig_input.signal_date,
            extra_data=sig_input.metadata,
        )
        db.add(record)
        db.flush()

        results.append(StakeholderSignalResponse(
            signal_id=str(record.id),
            organisation_id=record.organisation_id,
            signal_type=record.signal_type,
            source_name=record.source_name,
            sentiment=record.sentiment,
            sentiment_score=record.sentiment_score,
            topics=record.topics,
            created_at=record.created_at,
        ))

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist signals: {exc}")

    return StakeholderSignalBatchResponse(ingested=len(results), signals=results)


@router.post("/query", response_model=StakeholderSignalQueryResponse)
async def query_signals(
    request: StakeholderSignalQueryRequest,
    db: Session = Depends(get_db),
) -> StakeholderSignalQueryResponse:
    q = db.query(StakeholderSignal).filter(
        StakeholderSignal.organisation_id == request.organisation_id
    )

    if request.signal_types:
        q = q.filter(StakeholderSignal.signal_type.in_(request.signal_types))

    if request.since:
        q = q.filter(StakeholderSignal.created_at >= request.since)

    q = q.order_by(StakeholderSignal.created_at.desc()).limit(request.limit)
    rows = q.all()

    signals = [
        StakeholderSignalResponse(
            signal_id=str(r.id),
            organisation_id=r.organisation_id,
            signal_type=r.signal_type,
            source_name=r.source_name,
            sentiment=r.sentiment,
            sentiment_score=r.sentiment_score,
            topics=r.topics,
            created_at=r.created_at,
        )
        for r in rows
    ]

    return StakeholderSignalQueryResponse(
        organisation_id=request.organisation_id,
        total=len(signals),
        signals=signals,
    )
