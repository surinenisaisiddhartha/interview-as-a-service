"""Health and root endpoint."""

from fastapi import APIRouter
from application.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/", response_model=HealthResponse)
def home():
    """API status."""
    return {"status": "ok", "message": "AI Recruitment API is Running"}
