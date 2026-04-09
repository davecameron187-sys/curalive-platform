from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.api.routes.events import router as events_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.drift import router as drift_router
from app.api.routes.stakeholder import router as stakeholder_router
from app.api.routes.briefing import router as briefing_router
from app.api.routes.governance import router as governance_router
from app.db.base import Base
from app.db.session import engine

import app.models.analysis_job
import app.models.analysis_result
import app.models.commitment
import app.models.compliance_flag
import app.models.drift_event
import app.models.stakeholder_signal
import app.models.briefing
import app.models.governance_record
import app.models.event


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    print("[CuraLive AI Core] Database tables created/verified")
    yield


app = FastAPI(
    title="CuraLive AI Core",
    version="0.3.0",
    description="Canonical event ingestion, normalization, and AI analysis service.",
    lifespan=lifespan,
)

app.include_router(events_router, prefix="/api/events", tags=["events"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])
app.include_router(drift_router, prefix="/api/drift", tags=["drift"])
app.include_router(stakeholder_router, prefix="/api/stakeholder", tags=["stakeholder"])
app.include_router(briefing_router, prefix="/api/briefing", tags=["briefing"])
app.include_router(governance_router, prefix="/api/governance", tags=["governance"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
