"""
candidate_job_repository.py — Persist Candidate and Job records from parsed data.

Usage:
    from db.candidate_job_repository import save_candidate_from_resume, save_job_from_jd

    save_candidate_from_resume(parsed_resume)
    save_job_from_jd(parsed_jd, company_name=...)
"""

from typing import Optional

from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from log import log_tool
from db.database import SessionLocal
from db.models import Candidate, Job


# ---------------------------------------------------------------------------
# Resume / Candidate
# ---------------------------------------------------------------------------


def save_candidate_from_resume(parsed_resume: dict) -> Candidate:
    """
    Create a Candidate row from parsed resume JSON and persist it.

    Args:
        parsed_resume: Full parsed resume dict (top-level dict containing "candidate").

    Returns:
        The persisted Candidate ORM object.

    Raises:
        ValueError:        If required fields (email) are missing.
        IntegrityError:    If a candidate with the same email already exists.
        SQLAlchemyError:   On any other DB error (transaction is rolled back).
    """
    candidate_data: dict = parsed_resume.get("candidate", parsed_resume)

    email = candidate_data.get("email")
    if not email:
        raise ValueError("Resume JSON must contain a non-empty 'email' field.")

    location = candidate_data.get("current_location", {}) or {}
    education = candidate_data.get("education", {}) or {}
    degrees = candidate_data.get("degrees", []) or []
    gpa = education.get("gpa") or (degrees[0].get("gpa") if degrees else None)

    candidate = Candidate(
        full_name=candidate_data.get("full_name"),
        email=email,
        phone_number=candidate_data.get("phone_number"),
        phone_country_code=candidate_data.get("phone_country_code"),
        city=location.get("city"),
        state=location.get("state"),
        country=location.get("country"),
        current_designation=candidate_data.get("current_designation"),
        current_company=candidate_data.get("current_company"),
        overall_experience_years=candidate_data.get("overall_experience_years"),
        highest_degree=education.get("highest_degree"),
        highest_degree_name=education.get("highest_degree_name"),
        institution=education.get("institution"),
        graduation_year=education.get("graduation_year"),
        gpa=gpa,
        work_experience=candidate_data.get("work_experience"),
        skills=candidate_data.get("Key Skills"),
        projects=candidate_data.get("projects"),
        raw_resume_json=parsed_resume,
    )

    db = SessionLocal()
    try:
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        log_tool.log_info("Inserted candidate id=%s email=%s" % (candidate.id, candidate.email))
        return candidate
    except IntegrityError:
        db.rollback()
        log_tool.log_warning("Duplicate email – candidate already exists: %s" % email)
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        log_tool.log_error("DB error inserting candidate: %s" % exc)
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Job Description
# ---------------------------------------------------------------------------


def save_job_from_jd(parsed_jd: dict, company_name: Optional[str] = None) -> Job:
    """
    Create a Job row from parsed JD JSON and persist it.

    Args:
        parsed_jd: Full parsed JD dict (top-level dict containing "job").
        company_name: Optional company name (can override or supplement parsed data).

    Returns:
        The persisted Job ORM object.

    Raises:
        ValueError:      If required fields (title) are missing.
        SQLAlchemyError: On any DB error (transaction is rolled back).
    """
    job_data: dict = parsed_jd.get("job", parsed_jd)

    title = job_data.get("title")
    if not title:
        raise ValueError("Job JSON must contain a non-empty 'title' field.")

    job = Job(
        title=title,
        company_name=company_name,
        min_required_experience_years=job_data.get("min_required_experience_years"),
        max_required_experience_years=job_data.get("max_required_experience_years"),
        location=job_data.get("location"),
        employment_type=job_data.get("employment_type"),
        required_skills=job_data.get("required_skills"),
        preferred_skills=job_data.get("preferred_skills"),
        raw_job_json=parsed_jd,
    )

    db = SessionLocal()
    try:
        db.add(job)
        db.commit()
        db.refresh(job)
        log_tool.log_info("Inserted job id=%s title=%s" % (job.id, job.title))
        return job
    except SQLAlchemyError as exc:
        db.rollback()
        log_tool.log_error("DB error inserting job: %s" % exc)
        raise
    finally:
        db.close()
