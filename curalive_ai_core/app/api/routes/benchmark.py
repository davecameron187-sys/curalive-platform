from __future__ import annotations

import dataclasses
import time
from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.benchmark import Benchmark
from app.models.commitment import Commitment, CommitmentStatus
from app.models.compliance_flag import ComplianceFlag
from app.models.drift_event import DriftEvent
from app.models.stakeholder_signal import StakeholderSignal
from app.models.governance_record import GovernanceRecord
from app.models.org_profile import OrgProfile
from app.schemas.benchmark import (
    BenchmarkBuildRequest,
    BenchmarkBuildResponse,
    BenchmarkListResponse,
    BenchmarkResponse,
    BenchmarkRetrieveResponse,
    BenchmarkSummary,
    CommitmentBaselines,
    ComplianceBaselines,
    DriftBaselines,
    GovernanceBaselines,
    SectorEnrichmentRequest,
    SectorEnrichmentResponse,
    SentimentBaselines,
    TopicBaselines,
)
from app.services.benchmark_generator import (
    BenchmarkGenerator,
    EventBucket,
    OrgBucket,
    make_segment_key,
)

router = APIRouter()


def _collect_event_buckets(db: Session, segment_type: str | None, segment_value: str | None) -> tuple[list[EventBucket], set[str]]:
    gov_rows = db.query(GovernanceRecord).order_by(GovernanceRecord.created_at.asc()).all()

    event_map: dict[str, EventBucket] = {}
    orgs_seen: set[str] = set()

    for g in gov_rows:
        eid = g.event_id or str(g.id)
        etype = g.event_type
        org = g.organisation_id

        if segment_type == "event_type" and segment_value and etype != segment_value:
            continue

        orgs_seen.add(org)

        ms = g.meeting_summary or {}
        rcs = g.risk_compliance_summary or {}

        topics = ms.get("key_topics", [])
        risk_level = rcs.get("overall_risk_level", "low")
        matters_count = len(g.matters_arising or [])
        flags_count = rcs.get("total_flags", 0)

        bucket = EventBucket(
            event_id=eid,
            organisation_id=org,
            event_type=etype,
            governance_risk_level=risk_level,
            governance_confidence=g.confidence,
            governance_matters_arising=matters_count,
            governance_flags_count=flags_count,
            governance_topics=topics,
        )
        event_map[f"{org}:{eid}"] = bucket

    all_statuses = [
        CommitmentStatus.OPEN, CommitmentStatus.MONITORED,
        CommitmentStatus.ESCALATED, CommitmentStatus.RESOLVED,
        CommitmentStatus.SUPERSEDED, CommitmentStatus.EXPIRED,
    ]
    commit_rows = db.query(Commitment).filter(Commitment.status.in_(all_statuses)).all()
    org_commit_counts: dict[str, Counter[str]] = {}
    org_commit_status_counts: dict[str, Counter[str]] = {}
    org_commit_confidences: dict[str, list[float]] = {}
    org_commit_quant: dict[str, int] = {}

    for c in commit_rows:
        org = c.organisation_id
        orgs_seen.add(org)
        if org not in org_commit_counts:
            org_commit_counts[org] = Counter()
            org_commit_status_counts[org] = Counter()
            org_commit_confidences[org] = []
            org_commit_quant[org] = 0
        org_commit_counts[org][c.commitment_type] += 1
        status_val = c.status.value if hasattr(c.status, "value") else str(c.status)
        org_commit_status_counts[org][status_val] += 1
        org_commit_confidences[org].append(c.confidence)
        if c.has_quantitative_target:
            org_commit_quant[org] += 1

    flag_rows = db.query(ComplianceFlag).all()
    org_flag_type_counts: dict[str, Counter[str]] = {}
    org_flag_severity_counts: dict[str, Counter[str]] = {}

    for f in flag_rows:
        org = f.organisation_id
        orgs_seen.add(org)
        if org not in org_flag_type_counts:
            org_flag_type_counts[org] = Counter()
            org_flag_severity_counts[org] = Counter()
        org_flag_type_counts[org][f.flag_type] += 1
        org_flag_severity_counts[org][f.severity] += 1

    drift_rows = db.query(DriftEvent).all()
    org_drift_type_counts: dict[str, Counter[str]] = {}
    org_drift_severity_counts: dict[str, Counter[str]] = {}
    org_drift_confidences: dict[str, list[float]] = {}

    for d in drift_rows:
        org = d.organisation_id
        orgs_seen.add(org)
        if org not in org_drift_type_counts:
            org_drift_type_counts[org] = Counter()
            org_drift_severity_counts[org] = Counter()
            org_drift_confidences[org] = []
        org_drift_type_counts[org][d.drift_type] += 1
        org_drift_severity_counts[org][d.severity] += 1
        org_drift_confidences[org].append(d.confidence)

    if segment_type == "organisation":
        if segment_value:
            orgs_seen = {segment_value} if segment_value in orgs_seen else set()

    for key, bucket in event_map.items():
        org = bucket.organisation_id
        if segment_type == "organisation" and segment_value and org != segment_value:
            continue

        type_c = org_flag_type_counts.get(org, Counter())
        sev_c = org_flag_severity_counts.get(org, Counter())
        bucket.flags_count = sum(type_c.values())
        bucket.flags_by_type = dict(type_c)
        bucket.flags_by_severity = dict(sev_c)

        ct_counts = org_commit_counts.get(org, Counter())
        cs_counts = org_commit_status_counts.get(org, Counter())
        cc_list = org_commit_confidences.get(org, [])
        bucket.commitments_count = sum(ct_counts.values())
        bucket.commitments_by_type = dict(ct_counts)
        bucket.commitments_by_status = dict(cs_counts)
        bucket.avg_commitment_confidence = round(sum(cc_list) / max(len(cc_list), 1), 2) if cc_list else 0.0
        bucket.quantitative_target_count = org_commit_quant.get(org, 0)

        dt_counts = org_drift_type_counts.get(org, Counter())
        ds_counts = org_drift_severity_counts.get(org, Counter())
        dc_list = org_drift_confidences.get(org, [])
        bucket.drifts_count = sum(dt_counts.values())
        bucket.drifts_by_type = dict(dt_counts)
        bucket.drifts_by_severity = dict(ds_counts)
        bucket.avg_drift_confidence = round(sum(dc_list) / max(len(dc_list), 1), 2) if dc_list else 0.0

    buckets = list(event_map.values())
    if segment_type == "organisation" and segment_value:
        buckets = [b for b in buckets if b.organisation_id == segment_value]
        orgs_seen = {segment_value} if buckets else set()

    if not buckets and orgs_seen:
        for org in list(orgs_seen):
            type_c = org_flag_type_counts.get(org, Counter())
            sev_c = org_flag_severity_counts.get(org, Counter())
            ct_counts = org_commit_counts.get(org, Counter())
            cs_counts = org_commit_status_counts.get(org, Counter())
            cc_list = org_commit_confidences.get(org, [])
            dt_counts = org_drift_type_counts.get(org, Counter())
            ds_counts = org_drift_severity_counts.get(org, Counter())
            dc_list = org_drift_confidences.get(org, [])

            bucket = EventBucket(
                event_id=f"synthetic-{org}",
                organisation_id=org,
                flags_count=sum(type_c.values()),
                flags_by_type=dict(type_c),
                flags_by_severity=dict(sev_c),
                commitments_count=sum(ct_counts.values()),
                commitments_by_type=dict(ct_counts),
                commitments_by_status=dict(cs_counts),
                avg_commitment_confidence=round(sum(cc_list) / max(len(cc_list), 1), 2) if cc_list else 0.0,
                quantitative_target_count=org_commit_quant.get(org, 0),
                drifts_count=sum(dt_counts.values()),
                drifts_by_type=dict(dt_counts),
                drifts_by_severity=dict(ds_counts),
                avg_drift_confidence=round(sum(dc_list) / max(len(dc_list), 1), 2) if dc_list else 0.0,
            )
            buckets.append(bucket)

    return buckets, orgs_seen


def _collect_org_buckets(db: Session, orgs: set[str]) -> list[OrgBucket]:
    signal_rows = db.query(StakeholderSignal).all()

    org_data: dict[str, OrgBucket] = {}
    for org in orgs:
        org_data[org] = OrgBucket(organisation_id=org)

    for s in signal_rows:
        org = s.organisation_id
        if org not in org_data:
            continue
        ob = org_data[org]
        ob.signals_count += 1
        stype = s.signal_type or "unknown"
        ob.signals_by_type[stype] = ob.signals_by_type.get(stype, 0) + 1
        sent = s.sentiment or "unknown"
        ob.sentiment_distribution[sent] = ob.sentiment_distribution.get(sent, 0) + 1
        if s.source_name:
            ob.top_sources.append(s.source_name)
        for t in (s.topics or []):
            ob.top_themes.append(t)

    for ob in org_data.values():
        sigs = [s for s in signal_rows if s.organisation_id == ob.organisation_id]
        scores = [s.sentiment_score or 0.0 for s in sigs]
        ob.avg_sentiment_score = round(sum(scores) / max(len(scores), 1), 2) if scores else 0.0

        source_counts: Counter[str] = Counter(ob.top_sources)
        ob.top_sources = [s for s, _ in source_counts.most_common(5)]
        theme_counts: Counter[str] = Counter(ob.top_themes)
        ob.top_themes = [t for t, _ in theme_counts.most_common(8)]

    return list(org_data.values())


def _determine_segments(db: Session, req: BenchmarkBuildRequest) -> list[tuple[str, str]]:
    if req.segment_type and req.segment_value:
        return [(req.segment_type, req.segment_value)]

    segments: list[tuple[str, str]] = [("global", "all")]

    gov_rows = db.query(GovernanceRecord).all()
    event_types: set[str] = set()
    for g in gov_rows:
        if g.event_type:
            event_types.add(g.event_type)
    for et in event_types:
        segments.append(("event_type", et))

    all_orgs: set[str] = set()
    for g in gov_rows:
        all_orgs.add(g.organisation_id)
    commit_rows = db.query(Commitment).all()
    for c in commit_rows:
        all_orgs.add(c.organisation_id)
    flag_rows = db.query(ComplianceFlag).all()
    for f in flag_rows:
        all_orgs.add(f.organisation_id)

    for org in all_orgs:
        segments.append(("organisation", org))

    return segments


def _build_response(bm_row: Benchmark, duration_ms: float | None = None) -> BenchmarkResponse:
    cb = bm_row.compliance_baselines or {}
    cmb = bm_row.commitment_baselines or {}
    db_ = bm_row.drift_baselines or {}
    sb = bm_row.sentiment_baselines or {}
    gb = bm_row.governance_baselines or {}
    tb = bm_row.topic_baselines or {}
    sm = bm_row.summary or {}

    return BenchmarkResponse(
        benchmark_id=str(bm_row.id),
        segment_key=bm_row.segment_key,
        segment_type=bm_row.segment_type,
        segment_value=bm_row.segment_value,
        event_count=bm_row.event_count,
        organisation_count=bm_row.organisation_count,
        compliance_baselines=ComplianceBaselines(**cb) if cb else ComplianceBaselines(),
        commitment_baselines=CommitmentBaselines(**cmb) if cmb else CommitmentBaselines(),
        drift_baselines=DriftBaselines(**db_) if db_ else DriftBaselines(),
        sentiment_baselines=SentimentBaselines(**sb) if sb else SentimentBaselines(),
        governance_baselines=GovernanceBaselines(**gb) if gb else GovernanceBaselines(),
        topic_baselines=TopicBaselines(**tb) if tb else TopicBaselines(),
        summary=BenchmarkSummary(**sm) if sm else BenchmarkSummary(segment_key=bm_row.segment_key, segment_type=bm_row.segment_type, segment_value=bm_row.segment_value),
        confidence=bm_row.confidence,
        version=bm_row.version,
        last_refresh_source=bm_row.last_refresh_source,
        refresh_scope=bm_row.refresh_scope,
        low_sample=bm_row.low_sample or False,
        fallback_segment_used=bm_row.fallback_segment_used,
        duration_ms=duration_ms,
        created_at=bm_row.created_at,
        updated_at=bm_row.updated_at,
    )


@router.post("/build", response_model=BenchmarkBuildResponse)
async def build_benchmarks(
    request: BenchmarkBuildRequest,
    db: Session = Depends(get_db),
) -> BenchmarkBuildResponse:
    start = time.monotonic()

    segments = _determine_segments(db, request)
    generator = BenchmarkGenerator()
    responses: list[BenchmarkResponse] = []

    for seg_type, seg_value in segments:
        event_buckets, orgs = _collect_event_buckets(db, seg_type if seg_type != "global" else None, seg_value if seg_type != "global" else None)
        org_buckets = _collect_org_buckets(db, orgs)

        result = generator.build_benchmark(seg_type, seg_value, event_buckets, org_buckets)

        seg_key = make_segment_key(seg_type, seg_value)
        existing = db.query(Benchmark).filter(Benchmark.segment_key == seg_key).first()

        if existing and not request.force_rebuild:
            existing.event_count = result.event_count
            existing.organisation_count = result.organisation_count
            existing.compliance_baselines = result.compliance_baselines
            existing.commitment_baselines = result.commitment_baselines
            existing.drift_baselines = result.drift_baselines
            existing.sentiment_baselines = result.sentiment_baselines
            existing.governance_baselines = result.governance_baselines
            existing.topic_baselines = result.topic_baselines
            existing.summary = result.summary
            existing.confidence = result.confidence
            existing.version = (existing.version or 0) + 1
            existing.last_refresh_source = "manual_build"
            existing.refresh_scope = "full"
            existing.low_sample = result.quality.low_sample
            existing.fallback_segment_used = None
            bm_row = existing
        else:
            if existing and request.force_rebuild:
                db.delete(existing)
                db.flush()

            bm_row = Benchmark(
                segment_key=seg_key,
                segment_type=seg_type,
                segment_value=seg_value,
                event_count=result.event_count,
                organisation_count=result.organisation_count,
                compliance_baselines=result.compliance_baselines,
                commitment_baselines=result.commitment_baselines,
                drift_baselines=result.drift_baselines,
                sentiment_baselines=result.sentiment_baselines,
                governance_baselines=result.governance_baselines,
                topic_baselines=result.topic_baselines,
                summary=result.summary,
                confidence=result.confidence,
                version=1,
                last_refresh_source="manual_build",
                refresh_scope="full",
                low_sample=result.quality.low_sample,
            )
            db.add(bm_row)

        try:
            db.commit()
            db.refresh(bm_row)
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to persist benchmark: {exc}")

        elapsed = round((time.monotonic() - start) * 1000, 1)
        responses.append(_build_response(bm_row, elapsed))

    total_elapsed = round((time.monotonic() - start) * 1000, 1)

    return BenchmarkBuildResponse(
        benchmarks_built=len(responses),
        segments=responses,
        duration_ms=total_elapsed,
    )


@router.get("/list", response_model=BenchmarkListResponse)
async def list_benchmarks(
    segment_type: str | None = Query(None),
    db: Session = Depends(get_db),
) -> BenchmarkListResponse:
    query = db.query(Benchmark)
    if segment_type:
        query = query.filter(Benchmark.segment_type == segment_type)
    rows = query.order_by(Benchmark.segment_key.asc()).all()

    benchmarks = [
        BenchmarkRetrieveResponse(
            benchmark_id=str(r.id),
            segment_key=r.segment_key,
            segment_type=r.segment_type,
            segment_value=r.segment_value,
            event_count=r.event_count,
            organisation_count=r.organisation_count,
            compliance_baselines=r.compliance_baselines or {},
            commitment_baselines=r.commitment_baselines or {},
            drift_baselines=r.drift_baselines or {},
            sentiment_baselines=r.sentiment_baselines or {},
            governance_baselines=r.governance_baselines or {},
            topic_baselines=r.topic_baselines or {},
            summary=r.summary or {},
            confidence=r.confidence,
            version=r.version,
            last_refresh_source=r.last_refresh_source,
            refresh_scope=r.refresh_scope,
            low_sample=r.low_sample or False,
            fallback_segment_used=r.fallback_segment_used,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]

    return BenchmarkListResponse(benchmarks=benchmarks, total=len(benchmarks))


@router.get("/{segment_key:path}", response_model=BenchmarkRetrieveResponse)
async def get_benchmark(
    segment_key: str,
    db: Session = Depends(get_db),
) -> BenchmarkRetrieveResponse:
    bm = db.query(Benchmark).filter(Benchmark.segment_key == segment_key).first()
    if not bm:
        raise HTTPException(status_code=404, detail=f"Benchmark not found for segment: {segment_key}")

    return BenchmarkRetrieveResponse(
        benchmark_id=str(bm.id),
        segment_key=bm.segment_key,
        segment_type=bm.segment_type,
        segment_value=bm.segment_value,
        event_count=bm.event_count,
        organisation_count=bm.organisation_count,
        compliance_baselines=bm.compliance_baselines or {},
        commitment_baselines=bm.commitment_baselines or {},
        drift_baselines=bm.drift_baselines or {},
        sentiment_baselines=bm.sentiment_baselines or {},
        governance_baselines=bm.governance_baselines or {},
        topic_baselines=bm.topic_baselines or {},
        summary=bm.summary or {},
        confidence=bm.confidence,
        version=bm.version,
        last_refresh_source=bm.last_refresh_source,
        refresh_scope=bm.refresh_scope,
        low_sample=bm.low_sample or False,
        fallback_segment_used=bm.fallback_segment_used,
        created_at=bm.created_at,
        updated_at=bm.updated_at,
    )


@router.post("/enrich-sector", response_model=SectorEnrichmentResponse)
async def enrich_sector_context(
    request: SectorEnrichmentRequest,
    db: Session = Depends(get_db),
) -> SectorEnrichmentResponse:
    start = time.monotonic()

    profile = db.query(OrgProfile).filter(OrgProfile.organisation_id == request.organisation_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for this organisation")

    org_profile_dict = {
        "compliance_risk_profile": profile.compliance_risk_profile or {},
        "commitment_delivery_profile": profile.commitment_delivery_profile or {},
        "stakeholder_relationship_profile": profile.stakeholder_relationship_profile or {},
        "governance_trajectory_profile": profile.governance_trajectory_profile or {},
        "sector_context": profile.sector_context or {},
        "events_incorporated": profile.events_incorporated,
    }

    global_bm = db.query(Benchmark).filter(Benchmark.segment_key == "global:all").first()
    bm_dict = None
    if global_bm:
        bm_dict = {
            "segment_key": global_bm.segment_key,
            "compliance_baselines": global_bm.compliance_baselines or {},
            "commitment_baselines": global_bm.commitment_baselines or {},
            "drift_baselines": global_bm.drift_baselines or {},
            "sentiment_baselines": global_bm.sentiment_baselines or {},
            "governance_baselines": global_bm.governance_baselines or {},
            "summary": global_bm.summary or {},
        }

    generator = BenchmarkGenerator()
    enrichment = generator.build_sector_enrichment(org_profile_dict, bm_dict)

    if request.apply and bm_dict:
        profile.sector_context = enrichment["sector_context"]
        existing_summary = dict(profile.profile_summary or {})
        if enrichment.get("profile_summary_updates"):
            updates = enrichment["profile_summary_updates"]
            existing_concerns = existing_summary.get("key_concerns", [])
            existing_strengths = existing_summary.get("key_strengths", [])
            for c in updates.get("benchmark_concerns", []):
                if c not in existing_concerns:
                    existing_concerns.append(c)
            for s in updates.get("benchmark_strengths", []):
                if s not in existing_strengths:
                    existing_strengths.append(s)
            existing_summary["key_concerns"] = existing_concerns[:10]
            existing_summary["key_strengths"] = existing_strengths[:10]
            profile.profile_summary = existing_summary
        profile.version = (profile.version or 0) + 1
        try:
            db.commit()
            db.refresh(profile)
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to apply enrichment: {exc}")

    elapsed = round((time.monotonic() - start) * 1000, 1)

    return SectorEnrichmentResponse(
        organisation_id=request.organisation_id,
        sector_context=enrichment["sector_context"],
        benchmark_comparison=enrichment["benchmark_comparison"],
        profile_summary_updates=enrichment.get("profile_summary_updates"),
        applied=request.apply and bm_dict is not None,
        duration_ms=elapsed,
    )
