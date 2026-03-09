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
from services.embedding_service import upsert_candidate_vector, upsert_job_vector


# ---------------------------------------------------------------------------
# Resume / Candidate
# ---------------------------------------------------------------------------


def save_candidate_from_resume(
    parsed_resume: dict,
    s3_link: Optional[str] = None,
    s3_candidate_id: Optional[str] = None,
    s3_job_id: Optional[str] = None
) -> Candidate:
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
    
    # Check for LLM errors early
    if "error" in candidate_data:
        raise ValueError(f"Cannot save candidate: LLM parsing error - {candidate_data['error']}")

    email = candidate_data.get("email")
    if not email:
        raise ValueError("Resume JSON must contain a non-empty 'email' field.")

    location = candidate_data.get("current_location", {}) or {}
    education = candidate_data.get("education", {}) or {}
    degrees = candidate_data.get("degrees", []) or []
    
    # Defensive check: if degrees are strings, they won't have a '.get' method
    gpa = education.get("gpa")
    if not gpa and degrees:
        first_degree = degrees[0]
        if isinstance(first_degree, dict):
            gpa = first_degree.get("gpa")
        # if it's a string, we just leave gpa as None (it's likely already in education.gpa anyway)

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
        summary=candidate_data.get("summary"),
        highest_degree=education.get("highest_degree"),
        highest_degree_name=education.get("highest_degree_name"),
        institution=education.get("institution"),
        graduation_year=education.get("graduation_year"),
        gpa=gpa,
        work_experience=candidate_data.get("work_experience"),
        skills=candidate_data.get("Key Skills"),
        projects=candidate_data.get("projects"),
        raw_resume_json=parsed_resume,
        s3_link=s3_link,
        s3_candidate_id=s3_candidate_id,
        s3_job_id=s3_job_id,
    )

    db = SessionLocal()
    try:
        # Check if candidate already exists by email
        existing_candidate = db.query(Candidate).filter(Candidate.email == email).first()
        
        if existing_candidate:
            log_tool.log_info("Candidate with email %s already exists. Updating record id=%s" % (email, existing_candidate.s3_candidate_id))
            # Update fields
            existing_candidate.full_name = candidate.full_name
            existing_candidate.phone_number = candidate.phone_number
            existing_candidate.phone_country_code = candidate.phone_country_code
            existing_candidate.city = candidate.city
            existing_candidate.state = candidate.state
            existing_candidate.country = candidate.country
            existing_candidate.current_designation = candidate.current_designation
            existing_candidate.current_company = candidate.current_company
            existing_candidate.overall_experience_years = candidate.overall_experience_years
            existing_candidate.summary = candidate.summary
            existing_candidate.highest_degree = candidate.highest_degree
            existing_candidate.highest_degree_name = candidate.highest_degree_name
            existing_candidate.institution = candidate.institution
            existing_candidate.graduation_year = candidate.graduation_year
            existing_candidate.gpa = candidate.gpa
            existing_candidate.work_experience = candidate.work_experience
            existing_candidate.skills = candidate.skills
            existing_candidate.projects = candidate.projects
            existing_candidate.raw_resume_json = candidate.raw_resume_json
            existing_candidate.s3_link = s3_link
            
            # if s3_candidate_id:
            #     existing_candidate.s3_candidate_id = s3_candidate_id
            # NOTE: We do NOT update the primary key s3_candidate_id if the candidate already exists.
            # This avoids violating foreign key constraints in table 'matches'.
            if s3_job_id:
                existing_candidate.s3_job_id = s3_job_id
                
            candidate = existing_candidate
        else:
            db.add(candidate)
            
        db.commit()
        db.refresh(candidate)
        
        if not existing_candidate:
            log_tool.log_info("Inserted new candidate id=%s email=%s" % (candidate.s3_candidate_id, candidate.email))

        # Store candidate's skills/profile as a vector in Qdrant (always do this to ensure cloud is in sync)
        try:
            upsert_candidate_vector(candidate.s3_candidate_id, candidate)
        except Exception as emb_err:
            log_tool.log_warning("Embedding upsert skipped for candidate id=%s: %s" % (candidate.s3_candidate_id, emb_err))

        return candidate
    except SQLAlchemyError as exc:
        db.rollback()
        log_tool.log_error("DB error processing candidate: %s" % exc)
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Job Description
# ---------------------------------------------------------------------------


def save_job_from_jd(
    parsed_jd: dict, 
    company_name: Optional[str] = None, 
    client_company: Optional[str] = None,
    s3_link: Optional[str] = None,
    s3_job_id: Optional[str] = None
) -> Job:
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
        log_tool.log_warning("Job parsing failed to extract a title. Using 'Untitled Job' as fallback.")
        title = "Untitled Job"

    job = Job(
        s3_job_id=s3_job_id,
        title=title,
        company_name=company_name,
        client_company=client_company,
        min_required_experience_years=job_data.get("min_required_experience_years"),
        max_required_experience_years=job_data.get("max_required_experience_years"),
        location=job_data.get("location"),
        employment_type=job_data.get("employment_type"),
        summary=job_data.get("job_description_summary"),
        required_skills=job_data.get("required_skills"),
        preferred_skills=job_data.get("preferred_skills"),
        raw_job_json=parsed_jd,
        s3_link=s3_link,
    )

    db = SessionLocal()
    try:
        db.add(job)
        db.commit()
        db.refresh(job)
        log_tool.log_info("Inserted job id=%s title=%s" % (job.s3_job_id, job.title))

        # Store job's skills/description as a vector in Qdrant
        try:
            upsert_job_vector(job.s3_job_id, job)
        except Exception as emb_err:
            log_tool.log_warning("Embedding upsert skipped for job id=%s: %s" % (job.s3_job_id, emb_err))

        return job
    except SQLAlchemyError as exc:
        db.rollback()
        log_tool.log_error("DB error inserting job: %s" % exc)
        raise
    finally:
        db.close()
