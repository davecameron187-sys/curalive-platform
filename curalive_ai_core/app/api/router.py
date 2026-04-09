from fastapi import APIRouter

from app.api.routes import events, jobs

api_router = APIRouter()
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
