"""
AI Recruitment API — Modular monolith entry point.

Wires FastAPI app, registers API routers, and runs startup (DB tables).
"""

from fastapi import FastAPI

from log import log_tool
from api.routes import health_router, resumes_router, jobs_router, matching_router, retell_router

# Import so SQLAlchemy Base has all models; required before create_all
import db.models  # noqa: F401
from db.database import Base, engine

from alembic.config import Config
from alembic import command


app = FastAPI(title="AI Recruitment API")


@app.on_event("startup")
def run_migrations():
    """Ensure database tables are up to date via Alembic on startup."""
    try:
        # 1. Create tables if they don't exist (Base.metadata fallback)
        Base.metadata.create_all(bind=engine)
        
        # 2. Run Alembic upgrade head programmatically
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        
        log_tool.log_info("✅ Database migrations Applied and schema verified.")
    except Exception as e:
        log_tool.log_exception("❌ Failed to run database migrations", e)


# ── Register API routers ─────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(matching_router)
app.include_router(retell_router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
