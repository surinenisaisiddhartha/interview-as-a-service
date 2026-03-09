from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import SessionLocal
from db.models import Candidate
from schemas import CandidateSchema
from log import log_tool

router = APIRouter(prefix="/candidates", tags=["Candidates"])

from db.database import get_db

@router.get("/{candidate_id}", response_model=CandidateSchema)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    """
    Fetch a single candidate's full profile by their S3 ID.
    """
    candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == candidate_id).first()
    if not candidate:
        log_tool.log_warning(f"Candidate not found: {candidate_id}")
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return candidate

@router.get("/job/{job_id}", response_model=List[CandidateSchema])
def get_candidates_for_job(job_id: str, db: Session = Depends(get_db)):
    """
    Fetch all candidates mapped to a specific job ID.
    """
    candidates = db.query(Candidate).filter(Candidate.s3_job_id == job_id).all()
    return candidates
