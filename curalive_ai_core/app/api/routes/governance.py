from __future__ import annotations

import dataclasses
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.governance_record import GovernanceRecord
from app.models.commitment import Commitment, CommitmentStatus
from app.models.compliance_flag import ComplianceFlag
from app.models.drift_event import DriftEvent
from app.models.briefing import Briefing
from app.schemas.governance import (
    GovernanceGenerateRequest,
    GovernanceRecordResponse,
    GovernanceRetrieveResponse,
    MeetingSummarySchema,
    CommitmentRegisterEntry as CommitmentRegisterEntrySchema,
    ComplianceFlagEntry as ComplianceFlagEntrySchema,
    RiskComplianceSummary as RiskComplianceSummarySchema,
    MattersArisingEntry as MattersArisingEntrySchema,
    DataSourcesSchema,
)
from app.services.governance_generator import (
    GovernanceGenerator,
    EventContext,
    SegmentInput,
    CommitmentInput,
    ComplianceFlagInput,
    DriftInput,
    BriefingContext,
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


@router.post("/generate", response_model=GovernanceRecordResponse)
async def generate_governance_record(
    request: GovernanceGenerateRequest,
    db: Session = Depends(get_db),
) -> GovernanceRecordResponse:
    start = time.monotonic()

    event = EventContext(
        event_id=request.event_id,
        event_name=request.event_name,
        event_type=request.event_type,
        event_date=request.event_date.isoformat() if request.event_date else None,
    )

    segments: list[SegmentInput] = [
        SegmentInput(
            speaker_id=s.speaker_id,
            speaker_name=s.speaker_name,
            text=s.text,
            start_time=s.start_time,
            word_count=s.word_count or len(s.text.split()),
        )
        for s in request.segments
    ]

    open_statuses = [CommitmentStatus.OPEN, CommitmentStatus.MONITORED, CommitmentStatus.ESCALATED]
    commitment_rows = (
        db.query(Commitment)
        .filter(
            Commitment.organisation_id == request.organisation_id,
            Commitment.status.in_(open_statuses),
        )
        .order_by(Commitment.created_at.desc())
        .all()
    )

    if request.event_id:
        event_commitment_rows = (
            db.query(Commitment)
            .filter(Commitment.event_id == request.event_id)
            .all()
        )
        existing_ids = {str(c.id) for c in commitment_rows}
        for ec in event_commitment_rows:
            if str(ec.id) not in existing_ids:
                commitment_rows.append(ec)

    commitments = [
        CommitmentInput(
            commitment_id=str(c.id),
            commitment_text=c.commitment_text,
            commitment_type=c.commitment_type,
            speaker_name=c.speaker_name,
            deadline=c.deadline,
            has_quantitative_target=c.has_quantitative_target,
            quantitative_values=list(c.quantitative_values) if c.quantitative_values else [],
            confidence=c.confidence,
            status=c.status.value if hasattr(c.status, "value") else str(c.status),
        )
        for c in commitment_rows
    ]

    flag_rows = (
        db.query(ComplianceFlag)
        .filter(ComplianceFlag.organisation_id == request.organisation_id)
        .order_by(ComplianceFlag.created_at.desc())
        .limit(100)
        .all()
    )

    if request.event_id:
        event_flag_rows = (
            db.query(ComplianceFlag)
            .filter(ComplianceFlag.event_id == request.event_id)
            .all()
        )
        existing_flag_ids = {str(f.id) for f in flag_rows}
        for ef in event_flag_rows:
            if str(ef.id) not in existing_flag_ids:
                flag_rows.append(ef)

    compliance_flags = [
        ComplianceFlagInput(
            flag_id=str(f.id),
            flag_type=f.flag_type,
            severity=f.severity,
            speaker_name=f.speaker_name,
            matched_pattern=f.matched_pattern,
            segment_text=f.segment_text,
        )
        for f in flag_rows
    ]

    drift_rows = (
        db.query(DriftEvent)
        .filter(DriftEvent.organisation_id == request.organisation_id)
        .order_by(DriftEvent.created_at.desc())
        .limit(50)
        .all()
    )

    drifts = [
        DriftInput(
            drift_type=d.drift_type,
            severity=d.severity,
            commitment_id=str(d.commitment_id) if d.commitment_id else None,
            commitment_text=d.original_commitment_text,
            matched_text=d.matched_text,
            explanation=d.explanation,
            confidence=d.confidence,
        )
        for d in drift_rows
    ]

    briefing_ctx: BriefingContext | None = None
    if request.briefing_id:
        try:
            b_uid = uuid.UUID(request.briefing_id)
            briefing_row = db.query(Briefing).filter(Briefing.id == b_uid).first()
            if briefing_row:
                briefing_ctx = BriefingContext(
                    briefing_id=str(briefing_row.id),
                    likely_topics=briefing_row.likely_topics or [],
                    pressure_points=briefing_row.pressure_points or [],
                    sentiment_summary=briefing_row.sentiment_summary or {},
                    narrative_risk=briefing_row.narrative_risk or {},
                )
        except (ValueError, Exception):
            pass

    generator = GovernanceGenerator()
    result = generator.generate(
        event=event,
        segments=segments,
        commitments=commitments,
        compliance_flags=compliance_flags,
        drifts=drifts,
        briefing=briefing_ctx,
        analysis_job_id=request.analysis_job_id,
        include_matters_arising=request.include_matters_arising,
    )

    elapsed = round((time.monotonic() - start) * 1000, 1)

    record = GovernanceRecord(
        organisation_id=request.organisation_id,
        event_id=request.event_id,
        event_name=request.event_name,
        event_type=request.event_type,
        event_date=request.event_date,
        record_type="full",
        meeting_summary=_dc_to_dict(result.meeting_summary),
        commitment_register=_dc_to_dict(result.commitment_register),
        risk_compliance_summary=_dc_to_dict(result.risk_compliance_summary),
        matters_arising=_dc_to_dict(result.matters_arising),
        data_sources=_dc_to_dict(result.data_sources),
        confidence=result.confidence,
        duration_ms=elapsed,
    )
    db.add(record)

    try:
        db.commit()
        db.refresh(record)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist governance record: {exc}")

    ms = result.meeting_summary
    rcs = result.risk_compliance_summary

    return GovernanceRecordResponse(
        governance_record_id=str(record.id),
        organisation_id=request.organisation_id,
        event_id=request.event_id,
        event_name=request.event_name,
        event_type=request.event_type,
        event_date=request.event_date,
        record_type="full",
        meeting_summary=MeetingSummarySchema(
            title=ms.title,
            date=ms.date,
            event_type=ms.event_type,
            duration=ms.duration,
            total_speakers=ms.total_speakers,
            total_segments=ms.total_segments,
            key_topics=ms.key_topics,
            executive_summary=ms.executive_summary,
            speaker_contributions=ms.speaker_contributions,
        ),
        commitment_register=[
            CommitmentRegisterEntrySchema(
                commitment_id=c.commitment_id,
                speaker=c.speaker,
                commitment_text=c.commitment_text,
                commitment_type=c.commitment_type,
                deadline=c.deadline,
                has_quantitative_target=c.has_quantitative_target,
                quantitative_values=c.quantitative_values,
                status=c.status,
                confidence=c.confidence,
                drift_detected=c.drift_detected,
                drift_details=c.drift_details,
            )
            for c in result.commitment_register
        ],
        risk_compliance_summary=RiskComplianceSummarySchema(
            total_flags=rcs.total_flags,
            critical_flags=rcs.critical_flags,
            high_flags=rcs.high_flags,
            medium_flags=rcs.medium_flags,
            low_flags=rcs.low_flags,
            flags=[
                ComplianceFlagEntrySchema(
                    flag_id=f.flag_id,
                    flag_type=f.flag_type,
                    severity=f.severity,
                    speaker=f.speaker,
                    matched_pattern=f.matched_pattern,
                    segment_text=f.segment_text,
                )
                for f in rcs.flags
            ],
            drift_summary=rcs.drift_summary,
            narrative_risk=rcs.narrative_risk,
            overall_risk_level=rcs.overall_risk_level,
        ),
        matters_arising=[
            MattersArisingEntrySchema(
                source=m.source,
                reference_type=m.reference_type,
                reference_id=m.reference_id,
                description=m.description,
                status=m.status,
                original_event=m.original_event,
                current_position=m.current_position,
                severity=m.severity,
            )
            for m in result.matters_arising
        ],
        data_sources=DataSourcesSchema(
            analysis_job_id=result.data_sources.analysis_job_id,
            briefing_id=result.data_sources.briefing_id,
            commitments_count=result.data_sources.commitments_count,
            compliance_flags_count=result.data_sources.compliance_flags_count,
            drift_events_count=result.data_sources.drift_events_count,
            signals_count=result.data_sources.signals_count,
            segments_count=result.data_sources.segments_count,
        ),
        confidence=result.confidence,
        duration_ms=elapsed,
        created_at=record.created_at,
    )


@router.get("/{record_id}", response_model=GovernanceRetrieveResponse)
async def get_governance_record(
    record_id: str,
    db: Session = Depends(get_db),
) -> GovernanceRetrieveResponse:
    try:
        uid = uuid.UUID(record_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid record_id format")

    record = db.query(GovernanceRecord).filter(GovernanceRecord.id == uid).first()
    if not record:
        raise HTTPException(status_code=404, detail="Governance record not found")

    return GovernanceRetrieveResponse(
        governance_record_id=str(record.id),
        organisation_id=record.organisation_id,
        event_id=record.event_id,
        event_name=record.event_name,
        event_type=record.event_type,
        event_date=record.event_date,
        record_type=record.record_type,
        meeting_summary=record.meeting_summary or {},
        commitment_register=record.commitment_register or [],
        risk_compliance_summary=record.risk_compliance_summary or {},
        matters_arising=record.matters_arising or [],
        data_sources=record.data_sources or {},
        confidence=record.confidence,
        duration_ms=record.duration_ms,
        created_at=record.created_at,
    )
