import logging
import os
import json
from typing import Union

from db.database import SessionLocal
from db.models import Candidate, Job, Match
from utils.response_saver import ResponseSaver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Scoring weights (must sum to 100) ────────────────────────────────────────
WEIGHT_REQUIRED_SKILLS  = 50   # %
WEIGHT_PREFERRED_SKILLS = 20   # %
WEIGHT_EXPERIENCE       = 30   # %


class Matcher:
    """
    Matches Candidates against Jobs using data stored in PostgreSQL.

    Matching is triggered automatically (internally):
      - When a resume is uploaded  → matched against ALL existing jobs in DB
      - When a JD is uploaded      → matched against ALL existing candidates in DB

    Scoring:
        Required Skills  → 50%
        Preferred Skills → 20%
        Work Experience  → 30%
    """

    def __init__(self):
        self.output_dir = os.path.join(os.getcwd(), "match_outputs")

    # ── AUTO: new candidate vs ALL jobs ──────────────────────────────────────
    def match_all_jobs_for_candidate(self, candidate_id: int) -> list:
        """
        Called automatically after a resume is saved.
        Matches the candidate against every job in DB → saves all to matches table.
        """
        db = SessionLocal()
        try:
            candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                logger.warning("Auto-match skipped: candidate id=%s not found.", candidate_id)
                return []

            jobs = db.query(Job).all()
            if not jobs:
                logger.info("Auto-match: no jobs in DB yet for candidate id=%s.", candidate_id)
                return []

            results = []
            for job in jobs:
                result = self._calculate_scores(candidate, job)
                self._save_match(db, candidate, job, result)
                results.append(result)
                logger.info(
                    "Auto-matched candidate=%s vs job=%s → %.2f%%",
                    candidate.id, job.id, result["match_scores"]["final_match_percentage"]
                )
            db.commit()
            return results

        except Exception as e:
            db.rollback()
            logger.error("Error in match_all_jobs_for_candidate: %s", e)
            return []
        finally:
            db.close()

    # ── AUTO: new job vs ALL candidates ──────────────────────────────────────
    def match_all_candidates_for_job(self, job_id: int) -> list:
        """
        Called automatically after a JD is saved.
        Matches every candidate in DB against this job → saves all to matches table.
        """
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                logger.warning("Auto-match skipped: job id=%s not found.", job_id)
                return []

            candidates = db.query(Candidate).all()
            if not candidates:
                logger.info("Auto-match: no candidates in DB yet for job id=%s.", job_id)
                return []

            results = []
            for candidate in candidates:
                result = self._calculate_scores(candidate, job)
                result["candidate_id"] = candidate.id   # ← include for API response
                result["job_id"]       = job.id
                self._save_match(db, candidate, job, result)
                results.append(result)
                logger.info(
                    "Auto-matched candidate=%s vs job=%s → %.2f%%",
                    candidate.id, job.id, result["match_scores"]["final_match_percentage"]
                )
            db.commit()
            return results

        except Exception as e:
            db.rollback()
            logger.error("Error in match_all_candidates_for_job: %s", e)
            return []
        finally:
            db.close()

    # ── MANUAL: specific candidate IDs vs one job ─────────────────────────────
    def match_candidates_to_job(self, candidate_ids: list, job_id: int) -> list:
        """
        Match a specific list of candidates against one job.
        Saves each match result to the matches table.
        Returns list of match result dicts.
        """
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                return [{"error": f"Job with id={job_id} not found in database."}]

            results = []
            for candidate_id in candidate_ids:
                candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
                if not candidate:
                    results.append({"error": f"Candidate with id={candidate_id} not found.", "candidate_id": candidate_id})
                    continue

                result = self._calculate_scores(candidate, job)
                result["candidate_id"] = candidate.id
                result["job_id"]       = job.id
                self._save_match(db, candidate, job, result)
                results.append(result)
                logger.info(
                    "Matched candidate=%s vs job=%s → %.2f%%",
                    candidate.id, job.id, result["match_scores"]["final_match_percentage"]
                )

            db.commit()
            return results

        except Exception as e:
            db.rollback()
            logger.error("Error in match_candidates_to_job: %s", e)
            raise
        finally:
            db.close()

    # ── MANUAL: match via JSON (POST /match endpoint) ─────────────────────────
    def match(self, resume_data: Union[dict, str], jd_data: Union[dict, str]) -> dict:
        """
        Accepts raw JSON dicts (or file paths).
        Looks up candidate by email + job by title in PostgreSQL,
        then triggers auto-match (saved to matches table).
        Falls back to in-memory scoring if not found in DB.
        """
        if isinstance(resume_data, str):
            try:
                with open(resume_data, "r", encoding="utf-8") as f:
                    resume_data = json.load(f)
            except Exception as e:
                return {"error": f"Failed to load resume JSON: {e}"}

        if isinstance(jd_data, str):
            try:
                with open(jd_data, "r", encoding="utf-8") as f:
                    jd_data = json.load(f)
            except Exception as e:
                return {"error": f"Failed to load JD JSON: {e}"}

        candidate_data = resume_data.get("candidate", resume_data)
        job_data       = jd_data.get("job", jd_data)
        email          = candidate_data.get("email")
        job_title      = job_data.get("title")

        db = SessionLocal()
        try:
            candidate = db.query(Candidate).filter(Candidate.email == email).first() if email else None
            job       = db.query(Job).filter(Job.title == job_title).first() if job_title else None
        finally:
            db.close()

        if candidate and job:
            db2 = SessionLocal()
            try:
                result = self._calculate_scores(candidate, job)
                self._save_match(db2, candidate, job, result)
                db2.commit()
                return result
            finally:
                db2.close()

        # Fallback: in-memory only (not saved to DB)
        logger.warning(
            "Candidate (email=%s) or Job (title=%s) not found in DB — in-memory match only.",
            email, job_title
        )
        return self._score_from_json(candidate_data, job_data)

    # ── INTERNAL: calculate scores from ORM objects ───────────────────────────
    def _calculate_scores(self, candidate: Candidate, job: Job) -> dict:
        """Core scoring logic using ORM objects."""

        # Flatten candidate skills from JSONB dict of categories
        candidate_skills_raw = []
        if isinstance(candidate.skills, dict):
            for category_skills in candidate.skills.values():
                if isinstance(category_skills, list):
                    candidate_skills_raw.extend(category_skills)

        candidate_skills  = set(s.lower().strip() for s in candidate_skills_raw)
        required_skills   = set(s.lower().strip() for s in (job.required_skills  or []))
        preferred_skills  = set(s.lower().strip() for s in (job.preferred_skills or []))

        matched_required  = candidate_skills & required_skills
        missing_required  = required_skills  - candidate_skills
        matched_preferred = candidate_skills & preferred_skills

        # Required skills score → max 50
        req_score = (
            (len(matched_required) / len(required_skills)) * WEIGHT_REQUIRED_SKILLS
            if required_skills else float(WEIGHT_REQUIRED_SKILLS)
        )

        # Preferred skills score → max 20
        pref_score = (
            (len(matched_preferred) / len(preferred_skills)) * WEIGHT_PREFERRED_SKILLS
            if preferred_skills else 0.0
        )

        # Work experience score → max 30
        candidate_exp = float(candidate.overall_experience_years or 0)
        min_exp       = float(job.min_required_experience_years  or 0)

        if min_exp == 0:
            exp_score = float(WEIGHT_EXPERIENCE)
        elif candidate_exp >= min_exp:
            exp_score = float(WEIGHT_EXPERIENCE)
        else:
            exp_score = (candidate_exp / min_exp) * WEIGHT_EXPERIENCE

        final = round(req_score + pref_score + exp_score, 2)

        return {
            "candidate_name":             candidate.full_name or "Unknown",
            "job_title":                  job.title,
            "candidate_experience_years": candidate_exp,
            "min_required_experience":    min_exp,
            "matched_required_skills":    sorted(matched_required),
            "missing_required_skills":    sorted(missing_required),
            "matched_preferred_skills":   sorted(matched_preferred),
            "match_scores": {
                "required_skills_score":  round(req_score,  2),  # out of 50
                "preferred_skills_score": round(pref_score, 2),  # out of 20
                "experience_score":       round(exp_score,  2),  # out of 30
                "final_match_percentage": final,                  # out of 100
            },
            "score_weights": {
                "required_skills":  f"{WEIGHT_REQUIRED_SKILLS}%",
                "preferred_skills": f"{WEIGHT_PREFERRED_SKILLS}%",
                "work_experience":  f"{WEIGHT_EXPERIENCE}%",
            },
        }

    # ── INTERNAL: save match row to DB (no commit — caller commits) ───────────
    def _save_match(self, db, candidate: Candidate, job: Job, result: dict):
        """Upsert a match row — updates if already exists, inserts if not."""
        existing = (
            db.query(Match)
            .filter(Match.candidate_id == candidate.id, Match.job_id == job.id)
            .first()
        )
        scores = result["match_scores"]
        if existing:
            existing.required_skills_score   = scores["required_skills_score"]
            existing.preferred_skills_score  = scores["preferred_skills_score"]
            existing.experience_score        = scores["experience_score"]
            existing.final_match_percentage  = scores["final_match_percentage"]
            existing.matched_required_skills  = result["matched_required_skills"]
            existing.missing_required_skills  = result["missing_required_skills"]
            existing.matched_preferred_skills = result["matched_preferred_skills"]
        else:
            match_row = Match(
                candidate_id             = candidate.id,
                job_id                   = job.id,
                candidate_name           = result["candidate_name"],
                job_title                = result["job_title"],
                required_skills_score    = scores["required_skills_score"],
                preferred_skills_score   = scores["preferred_skills_score"],
                experience_score         = scores["experience_score"],
                final_match_percentage   = scores["final_match_percentage"],
                matched_required_skills  = result["matched_required_skills"],
                missing_required_skills  = result["missing_required_skills"],
                matched_preferred_skills = result["matched_preferred_skills"],
            )
            db.add(match_row)

    # ── INTERNAL: in-memory fallback scoring ──────────────────────────────────
    def _score_from_json(self, candidate_data: dict, job_data: dict) -> dict:
        candidate_skills_raw = []
        if isinstance(candidate_data.get("Key Skills"), dict):
            for cat in candidate_data["Key Skills"].values():
                if isinstance(cat, list):
                    candidate_skills_raw.extend(cat)

        candidate_skills  = set(s.lower().strip() for s in candidate_skills_raw)
        required_skills   = set(s.lower().strip() for s in (job_data.get("required_skills")  or []))
        preferred_skills  = set(s.lower().strip() for s in (job_data.get("preferred_skills") or []))

        matched_required  = candidate_skills & required_skills
        missing_required  = required_skills  - candidate_skills
        matched_preferred = candidate_skills & preferred_skills

        req_score  = (len(matched_required)  / len(required_skills)  * WEIGHT_REQUIRED_SKILLS)  if required_skills  else float(WEIGHT_REQUIRED_SKILLS)
        pref_score = (len(matched_preferred) / len(preferred_skills) * WEIGHT_PREFERRED_SKILLS) if preferred_skills else 0.0

        candidate_exp = float(candidate_data.get("overall_experience_years") or 0)
        min_exp       = float(job_data.get("min_required_experience_years")  or 0)
        exp_score     = float(WEIGHT_EXPERIENCE) if min_exp == 0 else min(candidate_exp / min_exp, 1.0) * WEIGHT_EXPERIENCE

        final = round(req_score + pref_score + exp_score, 2)
        result = {
            "candidate_name":  candidate_data.get("full_name", "Unknown"),
            "job_title":       job_data.get("title", "Unknown"),
            "note":            "In-memory match — not saved to PostgreSQL",
            "matched_required_skills":  sorted(matched_required),
            "missing_required_skills":  sorted(missing_required),
            "matched_preferred_skills": sorted(matched_preferred),
            "match_scores": {
                "required_skills_score":  round(req_score,  2),
                "preferred_skills_score": round(pref_score, 2),
                "experience_score":       round(exp_score,  2),
                "final_match_percentage": final,
            },
            "score_weights": {
                "required_skills":  f"{WEIGHT_REQUIRED_SKILLS}%",
                "preferred_skills": f"{WEIGHT_PREFERRED_SKILLS}%",
                "work_experience":  f"{WEIGHT_EXPERIENCE}%",
            },
        }
        ResponseSaver.save_json(result, self.output_dir, "match_result")
        return result
