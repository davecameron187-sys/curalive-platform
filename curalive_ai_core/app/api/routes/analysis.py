from __future__ import annotations

import dataclasses
import time
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.analysis_job import AnalysisJob, JobStatus
from app.models.analysis_result import AnalysisResult
from app.models.commitment import Commitment
from app.models.compliance_flag import ComplianceFlag as ComplianceFlagModel
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    JobResultsResponse,
    JobSummaryResponse,
    ModuleOutput,
)
from app.services.sentiment import SentimentService
from app.services.engagement import EngagementService
from app.services.compliance_signals import ComplianceSignalService
from app.services.commitment_extraction import CommitmentExtractionService

router = APIRouter()

MODULE_REGISTRY: dict[str, Any] = {
    "sentiment": SentimentService,
    "engagement": EngagementService,
    "compliance_signals": ComplianceSignalService,
    "commitment_extraction": CommitmentExtractionService,
}


def _dataclass_to_dict(obj: Any) -> Any:
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: _dataclass_to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [_dataclass_to_dict(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _dataclass_to_dict(v) for k, v in obj.items()}
    return obj


def _persist_commitments(
    db: Session,
    job_id: uuid.UUID,
    event_id: str,
    organisation_id: str,
    result_dict: dict,
) -> int:
    commitments = result_dict.get("commitments", [])
    count = 0
    for c in commitments:
        db.add(Commitment(
            job_id=job_id,
            event_id=event_id,
            organisation_id=organisation_id,
            speaker_id=c["speaker_id"],
            speaker_name=c.get("speaker_name"),
            commitment_text=c["commitment_text"],
            full_segment_text=c["full_segment_text"],
            commitment_type=c["commitment_type"],
            deadline=c.get("deadline"),
            has_quantitative_target=c.get("has_quantitative_target", False),
            quantitative_values=c.get("quantitative_values", []),
            confidence=c.get("confidence", 0.0),
            segment_index=c["segment_index"],
            start_time=c.get("start_time"),
        ))
        count += 1
    return count


def _persist_compliance_flags(
    db: Session,
    job_id: uuid.UUID,
    event_id: str,
    organisation_id: str,
    result_dict: dict,
) -> int:
    flags = result_dict.get("flags", [])
    count = 0
    for f in flags:
        db.add(ComplianceFlagModel(
            job_id=job_id,
            event_id=event_id,
            organisation_id=organisation_id,
            segment_index=f["segment_index"],
            speaker_id=f["speaker_id"],
            speaker_name=f.get("speaker_name"),
            flag_type=f["flag_type"],
            matched_pattern=f["matched_pattern"],
            severity=f["severity"],
            segment_text=f["text"],
            start_time=f.get("start_time"),
        ))
        count += 1
    return count


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest, db: Session = Depends(get_db)) -> AnalysisResponse:
    start = time.monotonic()

    job = AnalysisJob(
        event_id=request.canonical_event.event_id,
        organisation_id=request.canonical_event.organisation_id,
        requested_modules=request.modules,
        completed_modules=[],
        failed_modules=[],
        overall_status=JobStatus.RUNNING,
    )
    db.add(job)
    db.flush()

    outputs: list[ModuleOutput] = []
    completed: list[str] = []
    failed: list[str] = []
    commitments_count = 0
    flags_count = 0

    for module_name in request.modules:
        service_cls = MODULE_REGISTRY.get(module_name)
        if not service_cls:
            failed.append(module_name)
            db.add(AnalysisResult(
                job_id=job.id,
                event_id=request.canonical_event.event_id,
                module_name=module_name,
                status="error",
                result_payload={},
                error_message=f"Unknown module: {module_name}",
            ))
            outputs.append(ModuleOutput(
                module=module_name, status="error", result={},
                error=f"Unknown module: {module_name}",
            ))
            continue

        try:
            service = service_cls()
            result = service.analyze(request.canonical_event)
            result_dict = _dataclass_to_dict(result)

            db.add(AnalysisResult(
                job_id=job.id,
                event_id=request.canonical_event.event_id,
                module_name=module_name,
                status="ok",
                result_payload=result_dict,
            ))

            if module_name == "commitment_extraction":
                commitments_count = _persist_commitments(
                    db, job.id, request.canonical_event.event_id,
                    request.canonical_event.organisation_id, result_dict,
                )

            if module_name == "compliance_signals":
                flags_count = _persist_compliance_flags(
                    db, job.id, request.canonical_event.event_id,
                    request.canonical_event.organisation_id, result_dict,
                )

            completed.append(module_name)
            outputs.append(ModuleOutput(
                module=module_name, status="ok", result=result_dict,
            ))
        except Exception as exc:
            failed.append(module_name)
            db.add(AnalysisResult(
                job_id=job.id,
                event_id=request.canonical_event.event_id,
                module_name=module_name,
                status="error",
                result_payload={},
                error_message=str(exc),
            ))
            outputs.append(ModuleOutput(
                module=module_name, status="error", result={}, error=str(exc),
            ))

    elapsed = round((time.monotonic() - start) * 1000, 1)

    if failed and not completed:
        status = JobStatus.ERROR
    elif failed:
        status = JobStatus.PARTIAL
    else:
        status = JobStatus.COMPLETE

    job.completed_modules = completed
    job.failed_modules = failed
    job.overall_status = status
    job.duration_ms = elapsed
    if failed:
        job.error_message = f"Failed modules: {', '.join(failed)}"

    db.commit()
    db.refresh(job)

    return AnalysisResponse(
        job_id=str(job.id),
        event_id=request.canonical_event.event_id,
        organisation_id=request.canonical_event.organisation_id,
        overall_status=status.value,
        modules_requested=request.modules,
        modules_completed=completed,
        modules_failed=failed,
        outputs=outputs,
        duration_ms=elapsed,
        created_at=job.created_at,
    )


@router.get("/jobs/{job_id}", response_model=JobSummaryResponse)
async def get_job(job_id: str, db: Session = Depends(get_db)) -> JobSummaryResponse:
    try:
        uid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    job = db.query(AnalysisJob).filter(AnalysisJob.id == uid).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobSummaryResponse(
        job_id=str(job.id),
        event_id=job.event_id,
        organisation_id=job.organisation_id,
        overall_status=job.overall_status.value if isinstance(job.overall_status, JobStatus) else job.overall_status,
        requested_modules=job.requested_modules or [],
        completed_modules=job.completed_modules or [],
        failed_modules=job.failed_modules or [],
        duration_ms=job.duration_ms,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("/jobs/{job_id}/results", response_model=JobResultsResponse)
async def get_job_results(job_id: str, db: Session = Depends(get_db)) -> JobResultsResponse:
    try:
        uid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    job = db.query(AnalysisJob).filter(AnalysisJob.id == uid).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = db.query(AnalysisResult).filter(AnalysisResult.job_id == uid).all()

    modules = [
        ModuleOutput(
            module=r.module_name,
            status=r.status,
            result=r.result_payload or {},
            error=r.error_message,
        )
        for r in results
    ]

    commitment_count = db.query(Commitment).filter(Commitment.job_id == uid).count()
    flag_count = db.query(ComplianceFlagModel).filter(ComplianceFlagModel.job_id == uid).count()

    return JobResultsResponse(
        job_id=str(job.id),
        event_id=job.event_id,
        organisation_id=job.organisation_id,
        overall_status=job.overall_status.value if isinstance(job.overall_status, JobStatus) else job.overall_status,
        modules=modules,
        commitments_persisted=commitment_count,
        compliance_flags_persisted=flag_count,
    )
