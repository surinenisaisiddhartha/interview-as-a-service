"""Health and root endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/")
def home():
    """API status."""
    return {"message": "AI Recruitment API is Running"}
