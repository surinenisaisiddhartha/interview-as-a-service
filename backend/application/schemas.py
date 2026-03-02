"""Request/response schemas for API payloads."""

from pydantic import BaseModel


class MatchCandidatesToJobRequest(BaseModel):
    """Request body for POST /match/candidates-to-job."""

    candidate_ids: list[int]
    job_id: int

