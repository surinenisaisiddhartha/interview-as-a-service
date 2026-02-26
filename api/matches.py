from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from services.match_engine.matcher import Matcher
from db.database import SessionLocal
from db.models import Job as JobModel, Candidate as CandidateModel

logger = logging.getLogger(__name__)

router = APIRouter()

try:
    matcher = Matcher()
except Exception as e:
    logger.error(f"Failed to initialize Matching engine: {e}")
    raise

class MatchByIdsRequest(BaseModel):
    candidate_ids: list[int]
    job_id: int

@router.post("/candidates-to-job")
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


@router.get("/job/{job_id}")
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
