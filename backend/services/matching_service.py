"""
Matching use cases: match candidates to job by IDs; get ranked matches for a job.
"""

from fastapi import HTTPException

from db.database import SessionLocal
from db.models import Candidate as CandidateModel, Job as JobModel
from match_engine.candidate_job_matcher import Matcher


class MatchingService:
    """Orchestrates matching operations and ranked results."""

    def __init__(self):
        self._matcher = Matcher()

    def match_candidates_to_job(
        self, candidate_ids: list[str], job_id: str
    ) -> dict:
        """
        Match a list of candidates to one job; persist results to matches table.

        Returns:
            Dict with job_id, total_matched, and results list.
        """
        results = self._matcher.match_candidates_to_job(candidate_ids, job_id)

        # --- RE-RANKING PROCESS ---
        # Sort manually matched candidates by their final scores.
        from log import log_tool
        log_tool.log_info(f"Starting Re-ranking for manual match (job_id={job_id})...")
        
        re_ranked_results = sorted(
            [m for m in results if "error" not in m],
            key=lambda m: m["match_scores"]["final_match_percentage"],
            reverse=True
        )

        # Re-attach any error entries at the bottom
        errors = [m for m in results if "error" in m]
        final_results = re_ranked_results + errors

        log_tool.log_info(f"Re-ranking complete for {len(re_ranked_results)} candidates.")

        return {
            "job_id": job_id,
            "total_matched": len(re_ranked_results),
            "results": final_results,
        }

    def get_ranked_matches_for_job(
        self, 
        job_id: str, 
        min_score: float = None, 
        top_n: int = None, 
        status: str = None
    ) -> dict:
        """
        Retrieves job details, matches candidates, and sorts the results.
        If filters are provided, it slices down the final array before returning.
        """
        db = SessionLocal()
        job_title = None
        company_name = None
        try:
            job = db.query(JobModel).filter(JobModel.s3_job_id == job_id).first()
            if not job:
                raise HTTPException(
                    status_code=404, detail="Job with id=%s not found." % job_id
                )
            job_title = job.title
            company_name = job.company_name
            candidates = db.query(CandidateModel).filter(CandidateModel.s3_job_id == job_id).all()
            if not candidates:
                raise HTTPException(
                    status_code=404, detail=f"No candidates found mapped to job id={job_id} in the database."
                )
        finally:
            db.close()

        match_results = self._matcher.match_all_candidates_for_job(job_id)
        if not match_results:
            raise HTTPException(
                status_code=404, detail="Matching produced no results."
            )

        # --- RE-RANKING AND FILTERING PROCESS ---
        from log import log_tool
        log_tool.log_info(f"Starting Re-ranking process for job_id={job_id}...")

        # 1. Apply any dynamic filters requested by the frontend
        filtered_candidates = []
        for match in match_results:
            if min_score is not None and match["match_scores"]["final_match_percentage"] < min_score:
                continue
            if status is not None and match.get("qualification_status", "").lower() != status.lower():
                continue
            filtered_candidates.append(match)

        # 2. Sort remaining candidates by score descending
        re_ranked_candidates = sorted(
            filtered_candidates,
            key=lambda m: m["match_scores"]["final_match_percentage"],
            reverse=True,
        )

        # 3. Trim to top exactly N if requested
        if top_n is not None and top_n > 0:
            re_ranked_candidates = re_ranked_candidates[:top_n]

        log_tool.log_info(f"Re-ranking complete. Found {len(re_ranked_candidates)} candidates matching criteria.")

        return {
            "job_id": job_id,
            "job_title": job_title,
            "company_name": company_name,
            "total_candidates": len(re_ranked_candidates),
            "candidates": [
                {
                    "rank": idx + 1,
                    "candidate_id": candidate_match.get("candidate_id"),
                    "candidate_name": candidate_match["candidate_name"],
                    "qualification_status": candidate_match.get("qualification_status"),
                    "experience_years": candidate_match.get("candidate_experience_years"),
                    "embedding_similarity": candidate_match.get("embedding_similarity", 0.0),
                    "match_scores": candidate_match["match_scores"],
                    "matched_required_skills": candidate_match["matched_required_skills"],
                    "missing_required_skills": candidate_match["missing_required_skills"],
                    "matched_preferred_skills": candidate_match["matched_preferred_skills"],
                }
                for idx, candidate_match in enumerate(re_ranked_candidates)
            ],
        }
