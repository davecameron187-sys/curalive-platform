from fastapi import FastAPI

from app.api.routes.events import router as events_router
from app.api.routes.analysis import router as analysis_router

app = FastAPI(
    title="CuraLive AI Core",
    version="0.2.0",
    description="Canonical event ingestion, normalization, and AI analysis service.",
)

app.include_router(events_router, prefix="/api/events", tags=["events"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
