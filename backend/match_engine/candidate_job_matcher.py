import json
import os
from typing import Union

from log import log_tool
from db.database import SessionLocal
from db.models import Candidate, Job, Match
from utils.json_file_saver import JsonFileSaver
from utils.gemini_client import GeminiClient

# ── Scoring weights (must sum to 100) ────────────────────────────────────────
WEIGHT_REQUIRED_SKILLS = 60
WEIGHT_PREFERRED_SKILLS = 20
WEIGHT_EDUCATION = 5
WEIGHT_EXPERIENCE = 10
WEIGHT_LOCATION = 5

class Matcher:

    def __init__(self):
        self.output_dir = os.path.join(os.getcwd(), "match_outputs")
        self.gemini = GeminiClient()

    # ── AUTO: new candidate vs ALL jobs ──────────────────────────────────────
    def match_all_jobs_for_candidate(self, candidate_id: str) -> list:
        db = SessionLocal()
        try:
            candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == candidate_id).first()
            if not candidate:
                log_tool.log_warning("Auto-match skipped: candidate id=%s not found." % candidate_id)
                return []

            if candidate.s3_job_id:
                jobs = db.query(Job).filter(Job.s3_job_id == candidate.s3_job_id).all()
            else:
                jobs = []

            if not jobs:
                log_tool.log_info("Auto-match: no matching job in DB yet for candidate id=%s (mapped to job=%s)." % (candidate_id, candidate.s3_job_id))
                return []

            results = []
            for job in jobs:
                match_result = self._calculate_scores(candidate, job)
                self._save_match(db, candidate, job, match_result)
                results.append(match_result)

                log_tool.log_info(
                    "Auto-matched candidate=%s vs job=%s → %.2f%%"
                    % (candidate.s3_candidate_id, job.s3_job_id, match_result["match_scores"]["final_match_percentage"])
                )

            db.commit()
            return results

        except Exception as e:
            db.rollback()
            log_tool.log_error("Error in match_all_jobs_for_candidate: %s" % e)
            return []
        finally:
            db.close()

    # ── AUTO: new job vs ALL candidates ──────────────────────────────────────
    def match_all_candidates_for_job(self, job_id: str) -> list:

        db = SessionLocal()

        try:
            job = db.query(Job).filter(Job.s3_job_id == job_id).first()

            if not job:
                log_tool.log_warning("Auto-match skipped: job id=%s not found." % job_id)
                return []

            candidates = db.query(Candidate).filter(Candidate.s3_job_id == job_id).all()

            if not candidates:
                log_tool.log_info("Auto-match: no candidates in DB yet for job id=%s." % job_id)
                return []

            results = []

            for candidate in candidates:
                match_result = self._calculate_scores(candidate, job)

                match_result["candidate_id"] = candidate.s3_candidate_id
                match_result["job_id"] = job.s3_job_id

                self._save_match(db, candidate, job, match_result)

                results.append(match_result)

                log_tool.log_info(
                    "Auto-matched candidate=%s vs job=%s → %.2f%%"
                    % (candidate.s3_candidate_id, job.s3_job_id, match_result["match_scores"]["final_match_percentage"])
                )

            db.commit()

            return results

        except Exception as e:

            db.rollback()
            log_tool.log_error("Error in match_all_candidates_for_job: %s" % e)
            return []

        finally:
            db.close()

    # ── MANUAL: specific candidate IDs vs one job ─────────────────────────────
    def match_candidates_to_job(self, candidate_ids: list, job_id: int) -> list:

        db = SessionLocal()

        try:

            job = db.query(Job).filter(Job.s3_job_id == job_id).first()

            if not job:
                return [{"error": f"Job with id={job_id} not found in database."}]

            results = []

            for candidate_id in candidate_ids:

                candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == candidate_id).first()

                if not candidate:
                    results.append({"error": f"Candidate with id={candidate_id} not found.", "candidate_id": candidate_id})
                    continue

                match_result = self._calculate_scores(candidate, job)

                match_result["candidate_id"] = candidate.s3_candidate_id
                match_result["job_id"] = job.s3_job_id

                self._save_match(db, candidate, job, match_result)

                results.append(match_result)

                log_tool.log_info(
                    "Matched candidate=%s vs job=%s → %.2f%%"
                    % (candidate.s3_candidate_id, job.s3_job_id, match_result["match_scores"]["final_match_percentage"])
                )

            db.commit()

            return results

        except Exception as e:

            db.rollback()
            log_tool.log_error("Error in match_candidates_to_job: %s" % e)
            raise

        finally:
            db.close()

    # ── INTERNAL: calculate scores ───────────────────────────
    def _calculate_scores(self, candidate: Candidate, job: Job) -> dict:

        from services.embedding_service import get_category_similarities

        sims = get_category_similarities(candidate.s3_candidate_id, job.s3_job_id)

        req_sim = sims.get("required_skills_sim", 0.0)
        pref_sim = sims.get("preferred_skills_sim", 0.0)
        edu_sim = sims.get("education_sim", 0.0)

        embedding_sim = (req_sim + pref_sim + edu_sim) / 3.0

        # If the job has no preferred skills defined, shift the 20% weight to required skills!
        if not job.preferred_skills or len(job.preferred_skills) == 0:
            req_score = req_sim * (WEIGHT_REQUIRED_SKILLS + WEIGHT_PREFERRED_SKILLS)
            pref_score = 0.0
        else:
            req_score = req_sim * WEIGHT_REQUIRED_SKILLS
            pref_score = pref_sim * WEIGHT_PREFERRED_SKILLS

        edu_score = edu_sim * WEIGHT_EDUCATION

        # ── Experience Match
        exp_score = 0.0
        cand_exp = candidate.overall_experience_years or 0
        job_min = job.min_required_experience_years or 0
        job_max = getattr(job, "max_required_experience_years", 0) or 0

        # Score Calculation: 
        # 1. Below Minimum = 0%
        # 2. Equal or Above Maximum = 100%
        # 3. Between Min and Max = Fraction of max

        if job_min > 0 and cand_exp < job_min:
            exp_score = 0.0
        elif job_max > 0:
            if cand_exp >= job_max:
                exp_score = float(WEIGHT_EXPERIENCE)
            else:
                exp_score = float(cand_exp / float(job_max)) * float(WEIGHT_EXPERIENCE)
        elif job_min > 0:
            if cand_exp >= job_min:
                exp_score = float(WEIGHT_EXPERIENCE)
            else:
                exp_score = 0.0 # Under min is 0 based on above check
        else:
            exp_score = float(WEIGHT_EXPERIENCE)

        # ── Location Match
        loc_score = 0.0
        job_loc = (job.location or "").lower().strip()

        cand_locs = [
            (candidate.city or "").lower().strip(),
            (candidate.state or "").lower().strip(),
            (candidate.country or "").lower().strip()
        ]

        if not job_loc or any(job_loc in c_loc or c_loc in job_loc for c_loc in cand_locs if c_loc):
            loc_score = float(WEIGHT_LOCATION)

        final = round(req_score + pref_score + edu_score + loc_score + exp_score, 2)

        # ── FIX 1: SKILL EXTRACTION IMPROVED ──────────────────
        candidate_skills_list = []

        skills_data = getattr(candidate, "skills", None) or getattr(candidate, "key_skills", None)

        if isinstance(skills_data, dict):
            for cat in skills_data.values():
                if isinstance(cat, list):
                    candidate_skills_list.extend(cat)
                elif isinstance(cat, str):
                    candidate_skills_list.append(cat)

        elif isinstance(skills_data, list):
            candidate_skills_list = skills_data

        candidate_skills_list = [str(s).strip() for s in candidate_skills_list if s]

        log_tool.log_info(f"Candidate Skills Parsed: {candidate_skills_list}")

        # ── Text-based Skill Extraction ─────────────────
        matched_required = []
        missing_required = []
        matched_preferred = []

        candidate_text_parts = []
        candidate_text_parts.extend(candidate_skills_list)

        if candidate.current_designation:
            candidate_text_parts.append(candidate.current_designation)

        if candidate.summary:
            candidate_text_parts.append(candidate.summary)

        candidate_text = " ".join(candidate_text_parts).lower()

        for skill in (job.required_skills or []):
            if skill.lower() in candidate_text:
                matched_required.append(skill)
            else:
                missing_required.append(skill)

        for skill in (job.preferred_skills or []):
            if skill.lower() in candidate_text:
                matched_preferred.append(skill)

        # Determine qualification status based strictly on whether they met the minimum experience
        if job_min > 0:
            qualification_status = "Qualified" if cand_exp >= job_min else "Disqualified"
        else:
            qualification_status = "Qualified"

        return {
            "candidate_name": candidate.full_name or "Unknown",
            "job_title": job.title,
            "candidate_experience_years": candidate.overall_experience_years or 0,
            "min_required_experience": job.min_required_experience_years or 0,
            "qualification_status": qualification_status,
            "matched_required_skills": matched_required,
            "missing_required_skills": missing_required,
            "matched_preferred_skills": matched_preferred,
            "embedding_similarity": round(embedding_sim, 4),
            "match_scores": {
                "required_skills_score": round(req_score, 2),
                "preferred_skills_score": round(pref_score, 2),
                "education_score": round(edu_score, 2),
                "experience_score": round(exp_score, 2),
                "location_score": round(loc_score, 2),
                "final_match_percentage": final,
            },
        }

    # ── SAVE MATCH ───────────────────────────────────────────
    def _save_match(self, db, candidate: Candidate, job: Job, match_result: dict):

        existing = (
            db.query(Match)
            .filter(Match.candidate_id == candidate.s3_candidate_id, Match.job_id == job.s3_job_id)
            .first()
        )

        scores = match_result["match_scores"]

        if existing:

            existing.required_skills_score = scores["required_skills_score"]
            existing.preferred_skills_score = scores["preferred_skills_score"]
            existing.education_score = scores["education_score"]
            existing.experience_score = scores["experience_score"]
            existing.location_score = scores["location_score"]
            existing.final_match_percentage = scores["final_match_percentage"]

            existing.matched_required_skills = match_result["matched_required_skills"]
            existing.missing_required_skills = match_result["missing_required_skills"]
            existing.matched_preferred_skills = match_result["matched_preferred_skills"]
            
            existing.qualification_status = match_result.get("qualification_status")

        else:

            match_row = Match(

                candidate_id=candidate.s3_candidate_id,
                job_id=job.s3_job_id,

                candidate_name=match_result["candidate_name"],
                job_title=match_result["job_title"],

                required_skills_score=scores["required_skills_score"],
                preferred_skills_score=scores["preferred_skills_score"],
                education_score=scores["education_score"],
                experience_score=scores["experience_score"],
                location_score=scores["location_score"],
                final_match_percentage=scores["final_match_percentage"],

                matched_required_skills=match_result["matched_required_skills"],
                missing_required_skills=match_result["missing_required_skills"],
                matched_preferred_skills=match_result["matched_preferred_skills"],
                
                qualification_status=match_result.get("qualification_status"),
            )

            db.add(match_row)