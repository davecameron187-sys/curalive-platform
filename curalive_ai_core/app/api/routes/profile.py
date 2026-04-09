from __future__ import annotations

import dataclasses
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.org_profile import OrgProfile
from app.models.commitment import Commitment, CommitmentStatus
from app.models.compliance_flag import ComplianceFlag
from app.models.drift_event import DriftEvent
from app.models.stakeholder_signal import StakeholderSignal
from app.models.governance_record import GovernanceRecord
from app.schemas.profile import (
    ProfileUpdateRequest,
    ProfileResponse,
    ProfileRetrieveResponse,
    ProfileSummaryResponse,
    SpeakerProfileEntry as SpeakerProfileEntrySchema,
    ComplianceRiskProfileSchema,
    CommitmentDeliveryProfileSchema,
    StakeholderRelationshipProfileSchema,
    GovernanceTrajectoryProfileSchema,
    SectorContextSchema,
    ProfileSummarySchema,
)
from app.services.profile_generator import (
    ProfileGenerator,
    SpeakerData,
    CommitmentData,
    ComplianceFlagData,
    DriftData,
    SignalData,
    GovernanceData,
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


@router.post("/update", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db),
) -> ProfileResponse:
    start = time.monotonic()

    all_statuses = [
        CommitmentStatus.OPEN, CommitmentStatus.MONITORED,
        CommitmentStatus.ESCALATED, CommitmentStatus.RESOLVED,
        CommitmentStatus.SUPERSEDED, CommitmentStatus.EXPIRED,
    ]
    commitment_rows = (
        db.query(Commitment)
        .filter(
            Commitment.organisation_id == request.organisation_id,
            Commitment.status.in_(all_statuses),
        )
        .order_by(Commitment.created_at.desc())
        .all()
    )

    commitments = [
        CommitmentData(
            commitment_id=str(c.id),
            commitment_text=c.commitment_text,
            commitment_type=c.commitment_type,
            status=c.status.value if hasattr(c.status, "value") else str(c.status),
            confidence=c.confidence,
            has_quantitative_target=c.has_quantitative_target,
            speaker_name=c.speaker_name,
        )
        for c in commitment_rows
    ]

    flag_rows = (
        db.query(ComplianceFlag)
        .filter(ComplianceFlag.organisation_id == request.organisation_id)
        .order_by(ComplianceFlag.created_at.desc())
        .all()
    )

    compliance_flags = [
        ComplianceFlagData(
            flag_type=f.flag_type,
            severity=f.severity,
            speaker_name=f.speaker_name,
        )
        for f in flag_rows
    ]

    drift_rows = (
        db.query(DriftEvent)
        .filter(DriftEvent.organisation_id == request.organisation_id)
        .order_by(DriftEvent.created_at.desc())
        .all()
    )

    drifts = [
        DriftData(
            drift_type=d.drift_type,
            severity=d.severity,
            confidence=d.confidence,
            commitment_id=str(d.commitment_id) if d.commitment_id else None,
        )
        for d in drift_rows
    ]

    signal_rows = (
        db.query(StakeholderSignal)
        .filter(StakeholderSignal.organisation_id == request.organisation_id)
        .order_by(StakeholderSignal.created_at.desc())
        .limit(200)
        .all()
    )

    signals = [
        SignalData(
            signal_type=s.signal_type,
            source_name=s.source_name,
            sentiment=s.sentiment,
            sentiment_score=s.sentiment_score or 0.0,
            topics=s.topics or [],
        )
        for s in signal_rows
    ]

    gov_rows = (
        db.query(GovernanceRecord)
        .filter(GovernanceRecord.organisation_id == request.organisation_id)
        .order_by(GovernanceRecord.created_at.asc())
        .all()
    )

    governance_records = [
        GovernanceData(
            governance_record_id=str(g.id),
            risk_level=(g.risk_compliance_summary or {}).get("overall_risk_level", "low"),
            confidence=g.confidence,
            key_topics=(g.meeting_summary or {}).get("key_topics", []),
            matters_arising_count=len(g.matters_arising or []),
            flags_count=(g.risk_compliance_summary or {}).get("total_flags", 0),
            event_id=g.event_id,
        )
        for g in gov_rows
    ]

    speakers_by_event: list[list[SpeakerData]] = []
    for g in gov_rows:
        ms = g.meeting_summary or {}
        contributions = ms.get("speaker_contributions", [])
        if contributions:
            event_speakers = [
                SpeakerData(
                    speaker_name=sp.get("speaker_name", "Unknown"),
                    word_count=sp.get("word_count", 0),
                    segment_count=sp.get("segment_count", 0),
                    share_pct=sp.get("share_pct", 0.0),
                )
                for sp in contributions
            ]
            speakers_by_event.append(event_speakers)

    existing_profile_row = (
        db.query(OrgProfile)
        .filter(OrgProfile.organisation_id == request.organisation_id)
        .first()
    )

    generator = ProfileGenerator()
    result = generator.build_profile(
        organisation_id=request.organisation_id,
        speakers_by_event=speakers_by_event,
        commitments=commitments,
        compliance_flags=compliance_flags,
        drifts=drifts,
        signals=signals,
        governance_records=governance_records,
        event_id=request.event_id,
    )

    elapsed = round((time.monotonic() - start) * 1000, 1)

    speaker_dict = _dc_to_dict(result.speaker_profiles)
    crp_dict = _dc_to_dict(result.compliance_risk_profile)
    cdp_dict = _dc_to_dict(result.commitment_delivery_profile)
    srp_dict = _dc_to_dict(result.stakeholder_relationship_profile)
    gtp_dict = _dc_to_dict(result.governance_trajectory_profile)
    sc_dict = _dc_to_dict(result.sector_context)
    summary_dict = _dc_to_dict(result.profile_summary)

    if existing_profile_row and not request.force_rebuild:
        existing_profile_row.speaker_profiles = speaker_dict
        existing_profile_row.compliance_risk_profile = crp_dict
        existing_profile_row.commitment_delivery_profile = cdp_dict
        existing_profile_row.stakeholder_relationship_profile = srp_dict
        existing_profile_row.governance_trajectory_profile = gtp_dict
        existing_profile_row.sector_context = sc_dict
        existing_profile_row.profile_summary = summary_dict
        existing_profile_row.events_incorporated = result.events_incorporated
        existing_profile_row.last_event_id = request.event_id
        existing_profile_row.confidence = result.confidence
        existing_profile_row.version = (existing_profile_row.version or 0) + 1
        profile_row = existing_profile_row
    else:
        if existing_profile_row and request.force_rebuild:
            db.delete(existing_profile_row)
            db.flush()

        profile_row = OrgProfile(
            organisation_id=request.organisation_id,
            speaker_profiles=speaker_dict,
            compliance_risk_profile=crp_dict,
            commitment_delivery_profile=cdp_dict,
            stakeholder_relationship_profile=srp_dict,
            governance_trajectory_profile=gtp_dict,
            sector_context=sc_dict,
            profile_summary=summary_dict,
            events_incorporated=result.events_incorporated,
            last_event_id=request.event_id,
            confidence=result.confidence,
            version=1,
        )
        db.add(profile_row)

    try:
        db.commit()
        db.refresh(profile_row)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist profile: {exc}")

    ps = result.profile_summary
    crp = result.compliance_risk_profile
    cdp = result.commitment_delivery_profile
    srp = result.stakeholder_relationship_profile
    gtp = result.governance_trajectory_profile
    sc = result.sector_context

    return ProfileResponse(
        profile_id=str(profile_row.id),
        organisation_id=request.organisation_id,
        speaker_profiles=speaker_dict,
        compliance_risk_profile=ComplianceRiskProfileSchema(
            total_flags_historical=crp.total_flags_historical,
            flags_by_type=crp.flags_by_type,
            flags_by_severity=crp.flags_by_severity,
            avg_flags_per_event=crp.avg_flags_per_event,
            risk_trend=crp.risk_trend,
            latest_risk_level=crp.latest_risk_level,
        ),
        commitment_delivery_profile=CommitmentDeliveryProfileSchema(
            total_commitments=cdp.total_commitments,
            commitments_by_status=cdp.commitments_by_status,
            commitments_by_type=cdp.commitments_by_type,
            total_drifts=cdp.total_drifts,
            drifts_by_type=cdp.drifts_by_type,
            drift_rate=cdp.drift_rate,
            delivery_reliability=cdp.delivery_reliability,
            avg_confidence=cdp.avg_confidence,
        ),
        stakeholder_relationship_profile=StakeholderRelationshipProfileSchema(
            total_signals=srp.total_signals,
            signals_by_type=srp.signals_by_type,
            sentiment_distribution=srp.sentiment_distribution,
            avg_sentiment_score=srp.avg_sentiment_score,
            top_sources=srp.top_sources,
            key_themes=srp.key_themes,
            relationship_health=srp.relationship_health,
        ),
        governance_trajectory_profile=GovernanceTrajectoryProfileSchema(
            total_records=gtp.total_records,
            avg_confidence=gtp.avg_confidence,
            latest_risk_level=gtp.latest_risk_level,
            risk_level_history=gtp.risk_level_history,
            key_topics_frequency=gtp.key_topics_frequency,
            avg_matters_arising=gtp.avg_matters_arising,
            governance_quality=gtp.governance_quality,
        ),
        sector_context=SectorContextSchema(
            sector=sc.sector,
            sub_sector=sc.sub_sector,
            jurisdiction=sc.jurisdiction,
            regulatory_framework=sc.regulatory_framework,
            notes=sc.notes,
        ),
        profile_summary=ProfileSummarySchema(
            organisation_id=request.organisation_id,
            events_incorporated=ps.events_incorporated,
            overall_risk_level=ps.overall_risk_level,
            delivery_reliability=ps.delivery_reliability,
            relationship_health=ps.relationship_health,
            governance_quality=ps.governance_quality,
            key_concerns=ps.key_concerns,
            key_strengths=ps.key_strengths,
            confidence=ps.confidence,
        ),
        events_incorporated=result.events_incorporated,
        last_event_id=request.event_id,
        confidence=result.confidence,
        version=profile_row.version,
        duration_ms=elapsed,
        created_at=profile_row.created_at,
        updated_at=profile_row.updated_at,
    )


@router.get("/{organisation_id}", response_model=ProfileRetrieveResponse)
async def get_profile(
    organisation_id: str,
    db: Session = Depends(get_db),
) -> ProfileRetrieveResponse:
    profile = (
        db.query(OrgProfile)
        .filter(OrgProfile.organisation_id == organisation_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for this organisation")

    return ProfileRetrieveResponse(
        profile_id=str(profile.id),
        organisation_id=profile.organisation_id,
        speaker_profiles=profile.speaker_profiles or {},
        compliance_risk_profile=profile.compliance_risk_profile or {},
        commitment_delivery_profile=profile.commitment_delivery_profile or {},
        stakeholder_relationship_profile=profile.stakeholder_relationship_profile or {},
        governance_trajectory_profile=profile.governance_trajectory_profile or {},
        sector_context=profile.sector_context or {},
        profile_summary=profile.profile_summary or {},
        events_incorporated=profile.events_incorporated,
        last_event_id=profile.last_event_id,
        confidence=profile.confidence,
        version=profile.version,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/{organisation_id}/summary", response_model=ProfileSummaryResponse)
async def get_profile_summary(
    organisation_id: str,
    db: Session = Depends(get_db),
) -> ProfileSummaryResponse:
    profile = (
        db.query(OrgProfile)
        .filter(OrgProfile.organisation_id == organisation_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for this organisation")

    ps = profile.profile_summary or {}

    return ProfileSummaryResponse(
        organisation_id=profile.organisation_id,
        profile_summary=ProfileSummarySchema(
            organisation_id=profile.organisation_id,
            events_incorporated=ps.get("events_incorporated", 0),
            overall_risk_level=ps.get("overall_risk_level", "low"),
            delivery_reliability=ps.get("delivery_reliability", "unknown"),
            relationship_health=ps.get("relationship_health", "unknown"),
            governance_quality=ps.get("governance_quality", "unknown"),
            key_concerns=ps.get("key_concerns", []),
            key_strengths=ps.get("key_strengths", []),
            confidence=ps.get("confidence", 0.0),
        ),
        events_incorporated=profile.events_incorporated,
        last_event_id=profile.last_event_id,
        confidence=profile.confidence,
        version=profile.version,
        updated_at=profile.updated_at,
    )
