from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Dict, Any, Union
import logging

from parsers.resume_parser import ResumeParser
from parsers.jd_parser import JDParser
from match_engine.matcher import Matcher
from utils.text_extractor import TextExtractor
from db.insert import insert_resume_json, insert_job_json

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


# Initialize engines
try:
    resume_parser = ResumeParser()
    jd_parser     = JDParser()
    matcher       = Matcher()
except Exception as e:
    logger.error(f"Failed to initialize parsing engines: {e}")
    raise


@app.get("/")
def home():
    return {"message": "AI Recruitment API is Running"}


@app.post("/parse-resume")
async def extract_resume(file: UploadFile = File(...)):
    """
    Parse a resume file (PDF or TXT).
    → Saves candidate to PostgreSQL.
    → Auto-matches candidate against ALL existing jobs in DB.
    → Match results saved to matches table automatically.
    """
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload .pdf or .txt")

    try:
        content      = await file.read()
        text_content = TextExtractor.extract_text(content, file.filename)

        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from file or file is empty")

        result = resume_parser.parse(text_content)

        # Save to candidates table only — matching is triggered by JD upload
        try:
            candidate = insert_resume_json(result)
            logger.info("Resume saved to DB: candidate id=%s", candidate.id)
        except Exception as db_err:
            logger.warning("DB insert skipped (duplicate or error): %s", db_err)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/parse-jd")
async def extract_jd(
    file: UploadFile = File(...),
    company_name: str = Form(None),   # optional — type in Swagger or pass as form field
):
    """
    Parse a job description file (PDF or TXT).
    → Saves job to PostgreSQL.
    → Auto-matches job against ALL existing candidates in DB.
    → Match results saved to matches table automatically.
    """
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload .pdf or .txt")

    try:
        content      = await file.read()
        text_content = TextExtractor.extract_text(content, file.filename)

        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from file or file is empty")

        result = jd_parser.parse(text_content)

        # Save to jobs table
        job = None
        try:
            job = insert_job_json(result, company_name=company_name)
            logger.info("JD saved to DB: job id=%s company=%s", job.id, company_name)
        except Exception as db_err:
            logger.warning("DB insert skipped (duplicate or error): %s", db_err)

        # Auto-match this job against all existing candidates in DB
        if job:
            try:
                matches = matcher.match_all_candidates_for_job(job.id)
                logger.info("Auto-matched job id=%s against %d candidate(s).", job.id, len(matches))
            except Exception as match_err:
                logger.warning("Auto-match skipped: %s", match_err)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))





class MatchByIdsRequest(BaseModel):
    candidate_ids: list[int]
    job_id: int

@app.post("/match/candidates-to-job")
def match_candidates_to_job(payload: MatchByIdsRequest):
    """
    Match multiple candidates against one job using PostgreSQL IDs.

    Input:
        candidate_ids: [1, 2, 3]   ← list of candidate IDs
        job_id: 1                  ← single job ID

    Scoring per candidate:
        Required Skills  → 50%
        Preferred Skills → 20%
        Work Experience  → 30%

    All results are saved to the matches table in PostgreSQL.
    """
    try:
        results = matcher.match_candidates_to_job(payload.candidate_ids, payload.job_id)
        return {
            "job_id":        payload.job_id,
            "total_matched": len([r for r in results if "error" not in r]),
            "results":       results,
        }
    except Exception as e:
        logger.error(f"Error in match/candidates-to-job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from db.database import SessionLocal
from db.models import Job as JobModel, Candidate as CandidateModel

@app.get("/matches/job/{job_id}")
def get_matches_for_job(job_id: int):
    """
    Given a job_id:
    1. Fetches the job from the jobs table.
    2. Fetches ALL candidates from the candidates table.
    3. Runs matching for each candidate against that job.
    4. Saves/updates results in the matches table.
    5. Returns all candidates ranked by final_match_percentage (highest first).
    """
    db = SessionLocal()
    try:
        # Verify job exists
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail=f"Job with id={job_id} not found.")

        # Fetch all candidates
        candidates = db.query(CandidateModel).all()
        if not candidates:
            raise HTTPException(status_code=404, detail="No candidates found in the database.")

    finally:
        db.close()

    # Run live matching for all candidates against this job (saves to matches table)
    match_results = matcher.match_all_candidates_for_job(job_id)

    if not match_results:
        raise HTTPException(status_code=404, detail="Matching produced no results.")

    # Sort by final_match_percentage descending
    ranked = sorted(match_results, key=lambda r: r["match_scores"]["final_match_percentage"], reverse=True)

    return {
        "job_id":           job_id,
        "job_title":        job.title,
        "company_name":     job.company_name,
        "total_candidates": len(ranked),
        "candidates": [
            {
                "rank":                     idx + 1,
                "candidate_id":             r.get("candidate_id"),
                "candidate_name":           r["candidate_name"],
                "experience_years":         r.get("candidate_experience_years"),
                "match_scores":             r["match_scores"],
                "matched_required_skills":  r["matched_required_skills"],
                "missing_required_skills":  r["missing_required_skills"],
                "matched_preferred_skills": r["matched_preferred_skills"],
            }
            for idx, r in enumerate(ranked)
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
