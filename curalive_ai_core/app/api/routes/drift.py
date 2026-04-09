from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.commitment import Commitment, CommitmentStatus
from app.models.drift_event import DriftEvent
from app.schemas.drift import (
    DriftEventSummary,
    DriftRunRequest,
    DriftRunResponse,
)
from app.services.commitment_drift import (
    CommitmentDriftService,
    OpenCommitment,
    SourceRecord,
)

router = APIRouter()


@router.post("/run", response_model=DriftRunResponse)
async def run_drift_detection(
    request: DriftRunRequest,
    db: Session = Depends(get_db),
) -> DriftRunResponse:
    start = time.monotonic()

    open_statuses = [CommitmentStatus.OPEN, CommitmentStatus.MONITORED, CommitmentStatus.ESCALATED]
    rows = (
        db.query(Commitment)
        .filter(
            Commitment.organisation_id == request.organisation_id,
            Commitment.status.in_(open_statuses),
        )
        .all()
    )

    if not rows:
        return DriftRunResponse(
            organisation_id=request.organisation_id,
            event_id=request.event_id,
            commitments_evaluated=0,
            statements_processed=len(request.statements),
            drift_events_created=0,
            drift_events=[],
            duration_ms=round((time.monotonic() - start) * 1000, 1),
        )

    commitments = [
        OpenCommitment(
            id=c.id,
            speaker_id=c.speaker_id,
            speaker_name=c.speaker_name,
            commitment_text=c.commitment_text,
            commitment_type=c.commitment_type,
            deadline=c.deadline,
            has_quantitative_target=c.has_quantitative_target,
            quantitative_values=list(c.quantitative_values) if c.quantitative_values else [],
            confidence=c.confidence,
        )
        for c in rows
    ]

    statements = [
        SourceRecord(
            text=s.text,
            speaker_id=s.speaker_id,
            speaker_name=s.speaker_name,
            source_type=s.source_type,
            source_reference=s.source_reference,
            timestamp=s.timestamp,
        )
        for s in request.statements
    ]

    service = CommitmentDriftService()
    result = service.detect(commitments, statements)

    job_uuid: uuid.UUID | None = None
    if request.job_id:
        try:
            job_uuid = uuid.UUID(request.job_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid job_id format: {request.job_id}")

    persisted: list[DriftEventSummary] = []
    for d in result.drifts:
        drift_id = uuid.uuid4()
        db.add(DriftEvent(
            id=drift_id,
            commitment_id=d.commitment_id,
            job_id=job_uuid,
            event_id=request.event_id,
            organisation_id=request.organisation_id,
            source_type=d.source_type,
            source_reference=d.source_reference,
            drift_type=d.drift_type,
            severity=d.severity,
            matched_text=d.matched_text,
            explanation=d.explanation,
            confidence=d.confidence,
            original_commitment_text=d.original_commitment_text,
        ))
        persisted.append(DriftEventSummary(
            drift_event_id=str(drift_id),
            commitment_id=str(d.commitment_id),
            commitment_text=d.original_commitment_text,
            drift_type=d.drift_type,
            severity=d.severity,
            matched_text=d.matched_text,
            explanation=d.explanation,
            confidence=d.confidence,
            source_type=d.source_type,
            source_reference=d.source_reference,
        ))

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist drift events: {exc}")

    elapsed = round((time.monotonic() - start) * 1000, 1)

    return DriftRunResponse(
        organisation_id=request.organisation_id,
        event_id=request.event_id,
        commitments_evaluated=result.commitments_evaluated,
        statements_processed=result.statements_processed,
        drift_events_created=len(persisted),
        drift_events=persisted,
        duration_ms=elapsed,
    )
