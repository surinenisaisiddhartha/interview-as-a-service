"""
AI Recruitment API — Modular monolith entry point.

Wires FastAPI app, registers API routers, and runs startup (DB tables).
"""

from fastapi import FastAPI

from log import log_tool
from api.routes import health_router, resumes_router, jobs_router, matching_router

# Import so SQLAlchemy Base has all models; required before create_all
import db.models  # noqa: F401
from db.database import Base, engine

app = FastAPI(title="AI Recruitment API")

# ── Register API routers ─────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(matching_router)


@app.on_event("startup")
def create_tables():
    """Ensure database tables exist on startup."""
    try:
        Base.metadata.create_all(bind=engine)
        log_tool.log_info("Database tables verified / created.")
    except Exception as e:
        log_tool.log_exception("Failed to create DB tables", e)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
