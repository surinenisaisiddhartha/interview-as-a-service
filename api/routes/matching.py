"""Matching endpoints: match candidates to job, get ranked matches for a job."""

from fastapi import APIRouter, HTTPException

from log import log_tool
from application.schemas import MatchCandidatesToJobRequest, BatchMatchResponse, RankedMatchesResponse
from application.services.matching_service import MatchingService

router = APIRouter(tags=["Matching"])

_matching_service = MatchingService()


@router.post("/match/candidates-to-job", response_model=BatchMatchResponse)
def match_candidates_to_job(payload: MatchCandidatesToJobRequest):
    """
    Match multiple candidates against one job using PostgreSQL IDs.

    Input:
        candidate_ids: [1, 2, 3]
        job_id: 1

    Scoring: Required Skills 50%, Preferred Skills 20%, Work Experience 30%.
    All results are saved to the matches table.
    """
    try:
        return _matching_service.match_candidates_to_job(
            payload.candidate_ids, payload.job_id
        )
    except Exception as e:
        log_tool.log_exception("Error in match/candidates-to-job", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/job/{job_id}", response_model=RankedMatchesResponse)
def get_matches_for_job(job_id: int):
    """
    For the given job_id: runs matching for all candidates against that job,
    saves/updates results in the matches table, and returns candidates ranked
    by final_match_percentage (highest first).
    """
    try:
        return _matching_service.get_ranked_matches_for_job(job_id)
    except HTTPException:
        raise
    except Exception as e:
        log_tool.log_exception("Error in get_matches_for_job", e)
        raise HTTPException(status_code=500, detail=str(e))
