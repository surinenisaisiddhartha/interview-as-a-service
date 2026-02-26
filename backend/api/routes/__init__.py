from api.routes.health import router as health_router
from api.routes.resumes import router as resumes_router
from api.routes.jobs import router as jobs_router
from api.routes.matching import router as matching_router

__all__ = ["health_router", "resumes_router", "jobs_router", "matching_router"]
