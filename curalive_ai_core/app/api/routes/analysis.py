from __future__ import annotations

import dataclasses
from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas.analysis import AnalysisRequest, AnalysisResponse, ModuleOutput
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


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest) -> AnalysisResponse:
    outputs: list[ModuleOutput] = []
    completed: list[str] = []
    failed: list[str] = []

    for module_name in request.modules:
        service_cls = MODULE_REGISTRY.get(module_name)
        if not service_cls:
            failed.append(module_name)
            outputs.append(ModuleOutput(
                module=module_name,
                status="error",
                result={},
                error=f"Unknown module: {module_name}",
            ))
            continue

        try:
            service = service_cls()
            result = service.analyze(request.canonical_event)
            result_dict = _dataclass_to_dict(result)
            completed.append(module_name)
            outputs.append(ModuleOutput(
                module=module_name,
                status="ok",
                result=result_dict,
            ))
        except Exception as exc:
            failed.append(module_name)
            outputs.append(ModuleOutput(
                module=module_name,
                status="error",
                result={},
                error=str(exc),
            ))

    return AnalysisResponse(
        event_id=request.canonical_event.event_id,
        modules_requested=request.modules,
        modules_completed=completed,
        modules_failed=failed,
        outputs=outputs,
    )
