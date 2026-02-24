"""
insert.py — Insert functions for Candidate and Job records.

Usage:
    from db.insert import insert_resume_json, insert_job_json

    insert_resume_json(resume_dict)
    insert_job_json(job_dict)
"""

import logging
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from db.database import SessionLocal
from db.models import Candidate, Job

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Resume / Candidate
# ---------------------------------------------------------------------------

def insert_resume_json(resume_json: dict) -> Candidate:
    """
    Parse the structured resume JSON and insert a Candidate row.

    Args:
        resume_json: Full parsed resume dict (the top-level dict containing "candidate").

    Returns:
        The persisted Candidate ORM object.

    Raises:
        ValueError:        If required fields (email) are missing.
        IntegrityError:    If a candidate with the same email already exists.
        SQLAlchemyError:   On any other DB error (transaction is rolled back).
    """
    # ── Unpack nested structure ──────────────────────────────────────────
    candidate_data: dict = resume_json.get("candidate", resume_json)

    email = candidate_data.get("email")
    if not email:
        raise ValueError("Resume JSON must contain a non-empty 'email' field.")

    location     = candidate_data.get("current_location", {}) or {}
    education    = candidate_data.get("education", {}) or {}

    # Flatten GPA from degrees list (take first degree if present)
    degrees      = candidate_data.get("degrees", []) or []
    gpa          = education.get("gpa") or (degrees[0].get("gpa") if degrees else None)

    candidate = Candidate(
        full_name                = candidate_data.get("full_name"),
        email                    = email,
        phone_number             = candidate_data.get("phone_number"),
        phone_country_code       = candidate_data.get("phone_country_code"),

        city                     = location.get("city"),
        state                    = location.get("state"),
        country                  = location.get("country"),

        current_designation      = candidate_data.get("current_designation"),
        current_company          = candidate_data.get("current_company"),
        overall_experience_years = candidate_data.get("overall_experience_years"),

        highest_degree           = education.get("highest_degree"),
        highest_degree_name      = education.get("highest_degree_name"),
        institution              = education.get("institution"),
        graduation_year          = education.get("graduation_year"),
        gpa                      = gpa,

        work_experience          = candidate_data.get("work_experience"),
        skills                   = candidate_data.get("Key Skills"),
        projects                 = candidate_data.get("projects"),
        raw_resume_json          = resume_json,
    )

    db = SessionLocal()
    try:
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        logger.info("Inserted candidate id=%s email=%s", candidate.id, candidate.email)
        return candidate
    except IntegrityError:
        db.rollback()
        logger.warning("Duplicate email – candidate already exists: %s", email)
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error inserting candidate: %s", exc)
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Job Description
# ---------------------------------------------------------------------------

def insert_job_json(job_json: dict, company_name: str = None) -> Job:
    """
    Parse the structured JD JSON and insert a Job row.

    Args:
        job_json: Full parsed JD dict (the top-level dict containing "job").

    Returns:
        The persisted Job ORM object.

    Raises:
        ValueError:      If required fields (title) are missing.
        SQLAlchemyError: On any DB error (transaction is rolled back).
    """
    job_data: dict = job_json.get("job", job_json)

    title = job_data.get("title")
    if not title:
        raise ValueError("Job JSON must contain a non-empty 'title' field.")

    job = Job(
        title                         = title,
        company_name                  = company_name,
        min_required_experience_years = job_data.get("min_required_experience_years"),
        max_required_experience_years = job_data.get("max_required_experience_years"),
        location                      = job_data.get("location"),
        employment_type               = job_data.get("employment_type"),
        required_skills               = job_data.get("required_skills"),
        preferred_skills              = job_data.get("preferred_skills"),
        raw_job_json                  = job_json,
    )

    db = SessionLocal()
    try:
        db.add(job)
        db.commit()
        db.refresh(job)
        logger.info("Inserted job id=%s title=%s", job.id, job.title)
        return job
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error inserting job: %s", exc)
        raise
    finally:
        db.close()
