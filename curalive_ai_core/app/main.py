from fastapi import FastAPI

from app.api.routes.events import router as events_router

app = FastAPI(
    title="CuraLive AI Core",
    version="0.1.0",
    description="Canonical event ingestion and normalization service.",
)

app.include_router(events_router, prefix="/api/events", tags=["events"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
