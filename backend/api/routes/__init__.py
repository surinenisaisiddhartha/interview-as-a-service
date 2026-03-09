from api.routes.health import router as health_router
from api.routes.resumes import router as resumes_router
from api.routes.jobs import router as jobs_router
from api.routes.matching import router as matching_router
from api.routes.retell import router as retell_router
from api.routes.companies import router as companies_router
from api.routes.users import router as users_router
from api.routes.jd_upload import router as jd_upload_router
from api.routes.resume_upload import router as resume_upload_router
from api.routes.candidates import router as candidates_router

__all__ = [
    "health_router",
    "resumes_router",
    "jobs_router",
    "matching_router",
    "retell_router",
    "companies_router",
    "users_router",
    "jd_upload_router",
    "resume_upload_router",
    "candidates_router",
]
