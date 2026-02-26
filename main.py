from fastapi import FastAPI
import logging

from api.resume import router as resume_router
from api.jd import router as jd_router
from api.matches import router as matches_router
from api.retell import router as retell_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Recruitment API")

# ── Auto-create DB tables on startup ─────────────────────────────────────────
import db.models  # noqa: F401 — registers models with Base
from db.database import engine, Base

@app.on_event("startup")
def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified / created.")
    except Exception as e:
        logger.error(f"Failed to create DB tables: {e}")

@app.get("/")
def home():
    return {"message": "AI Recruitment API is Running"}

# Call the endpoint routers
app.include_router(resume_router, tags=["resume"])
app.include_router(jd_router, tags=["jd"])
app.include_router(matches_router, prefix="/matches", tags=["matches"])
app.include_router(retell_router, prefix="/retell", tags=["retell"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
