from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

import app.models.event
import app.models.analysis_job
import app.models.commitment
import app.models.drift_event


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    print("[CuraLive AI Core] Database tables created/verified")
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
