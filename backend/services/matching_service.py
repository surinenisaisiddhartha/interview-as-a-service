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
        self, candidate_ids: list[int], job_id: int
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

    def get_ranked_matches_for_job(self, job_id: int) -> dict:
        """
        Run matching for all candidates vs job, then return candidates ranked by score.

        Returns:
            Dict with job_id, job_title, company_name, total_candidates, candidates (ranked).
        """
        db = SessionLocal()
        job_title = None
        company_name = None
        try:
            job = db.query(JobModel).filter(JobModel.id == job_id).first()
            if not job:
                raise HTTPException(
                    status_code=404, detail="Job with id=%s not found." % job_id
                )
            job_title = job.title
            company_name = job.company_name
            candidates = db.query(CandidateModel).all()
            if not candidates:
                raise HTTPException(
                    status_code=404, detail="No candidates found in the database."
                )
        finally:
            db.close()

        match_results = self._matcher.match_all_candidates_for_job(job_id)
        if not match_results:
            raise HTTPException(
                status_code=404, detail="Matching produced no results."
            )

        # --- RE-RANKING PROCESS ---
        # We re-rank all matches strictly based on the final_match_percentage calculate by the Matcher.
        from log import log_tool
        log_tool.log_info(f"Starting Re-ranking process for job_id={job_id}...")

        re_ranked_candidates = sorted(
            match_results,
            key=lambda m: m["match_scores"]["final_match_percentage"],
            reverse=True,
        )

        log_tool.log_info(f"Re-ranking complete. Found {len(re_ranked_candidates)} candidates.")

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
