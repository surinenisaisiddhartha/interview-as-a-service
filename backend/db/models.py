from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Index, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from db.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id                      = Column(Integer, primary_key=True)
    full_name               = Column(String, nullable=False)
    email                   = Column(String, unique=True, nullable=False, index=True)
    phone_number            = Column(String)
    phone_country_code      = Column(String)

    # Location
    city                    = Column(String)
    state                   = Column(String)
    country                 = Column(String)

    # Current role
    current_designation     = Column(String)
    current_company         = Column(String)
    overall_experience_years = Column(Float)
    summary                 = Column(String)  # Professional summary of the candidate

    # Education (flattened highest degree)
    highest_degree          = Column(String)
    highest_degree_name     = Column(String)
    institution             = Column(String)
    graduation_year         = Column(String)
    gpa                     = Column(String)

    # JSONB columns
    work_experience         = Column(JSONB)   # list of work experience dicts
    skills                  = Column(JSONB)   # Key Skills dict
    projects                = Column(JSONB)   # list of project dicts
    raw_resume_json         = Column(JSONB)   # full original parsed JSON

    s3_link                 = Column(String)  # S3 URL for the candidate's resume document

    created_at              = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        # GIN indexes for fast JSONB querying (@>, ?, ?|, ?&)
        Index("ix_candidates_skills_gin",       "skills",          postgresql_using="gin"),
        Index("ix_candidates_work_exp_gin",     "work_experience", postgresql_using="gin"),
        Index("ix_candidates_projects_gin",     "projects",        postgresql_using="gin"),
        Index("ix_candidates_raw_resume_gin",   "raw_resume_json", postgresql_using="gin"),
    )

    def __repr__(self):
        return f"<Candidate id={self.id} email={self.email}>"


class Job(Base):
    __tablename__ = "jobs"

    id                              = Column(Integer, primary_key=True)
    title                           = Column(String, nullable=False)
    company_name                    = Column(String)         
    min_required_experience_years   = Column(Float)
    max_required_experience_years   = Column(Float)
    location                        = Column(String)
    employment_type                 = Column(String)
    summary                         = Column(String)  # Concise summary of the role

    # JSONB columns
    required_skills                 = Column(JSONB)   # list of strings
    preferred_skills                = Column(JSONB)   # list of strings
    raw_job_json                    = Column(JSONB)   # full original parsed JSON

    s3_link                         = Column(String)  # S3 URL for the job description document

    created_at                      = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_jobs_required_skills_gin",  "required_skills",  postgresql_using="gin"),
        Index("ix_jobs_preferred_skills_gin", "preferred_skills", postgresql_using="gin"),
        Index("ix_jobs_raw_job_gin",          "raw_job_json",     postgresql_using="gin"),
    )

    def __repr__(self):
        return f"<Job id={self.id} title={self.title}>"


class Match(Base):
    __tablename__ = "matches"

    id                      = Column(Integer, primary_key=True)
    candidate_id            = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id                  = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    candidate_name          = Column(String)
    job_title               = Column(String)

    # Individual scores (out of their max weight)
    required_skills_score   = Column(Float)   # max 50
    preferred_skills_score  = Column(Float)   # max 20
    experience_score        = Column(Float)   # max 30
    final_match_percentage  = Column(Float)   # max 100

    # Skill detail (JSONB lists)
    matched_required_skills  = Column(JSONB)
    missing_required_skills  = Column(JSONB)
    matched_preferred_skills = Column(JSONB)

    created_at              = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        # Prevent duplicate matches for same candidate + job pair
        UniqueConstraint("candidate_id", "job_id", name="uq_matches_candidate_job"),
    )

    def __repr__(self):
        return f"<Match candidate={self.candidate_id} job={self.job_id} score={self.final_match_percentage}>"
