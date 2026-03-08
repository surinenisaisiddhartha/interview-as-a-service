from datetime import datetime, timezone
import enum

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Index, ForeignKey, UniqueConstraint, Enum, text, BigInteger, Boolean
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from db.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    s3_candidate_id         = Column(String, primary_key=True)
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
    s3_job_id               = Column(String, index=True)

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
        return f"<Candidate s3_id={self.s3_candidate_id} email={self.email}>"


class Job(Base):
    __tablename__ = "jobs"

    s3_job_id                       = Column(String, primary_key=True)
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
        return f"<Job s3_id={self.s3_job_id} title={self.title}>"


class Match(Base):
    __tablename__ = "matches"

    id                      = Column(Integer, primary_key=True)
    candidate_id            = Column(String, ForeignKey("candidates.s3_candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    job_id                  = Column(String, ForeignKey("jobs.s3_job_id", ondelete="CASCADE"), nullable=False, index=True)

    candidate_name          = Column(String)
    job_title               = Column(String)

    # Individual scores (out of their max weight)
    required_skills_score   = Column(Float)   # max 40
    preferred_skills_score  = Column(Float)   # max 15
    education_score         = Column(Float)   # max 15
    experience_score        = Column(Float)   # max 20
    location_score          = Column(Float)   # max 10
    final_match_percentage  = Column(Float)   # max 100

    # Skill detail (JSONB lists)
    matched_required_skills  = Column(JSONB)
    missing_required_skills  = Column(JSONB)
    matched_preferred_skills = Column(JSONB)

    # Qualification Status
    qualification_status     = Column(String)  # e.g., "Qualified" or "Disqualified"

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


class Role(enum.Enum):
    superadmin = "superadmin"
    company_admin = "company_admin"
    recruiter = "recruiter"


class Company(Base):
    __tablename__ = "companies"

    # id is the S3 slug-ID (e.g. "tcs-india-ab12ef34") — set explicitly on insert
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Company id={self.id} name={self.name}>"


class User(Base):
    __tablename__ = "users"

    # id is the S3 slug-ID (e.g. "recruiter-ab12ef34") — set explicitly on insert
    id = Column(String, primary_key=True)
    cognito_sub = Column(String, nullable=True, unique=True)
    email = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    role = Column(
        Enum(Role, name="Role"),
        nullable=False,
        server_default=text("'recruiter'::\"Role\""),
    )
    company_id = Column(String, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_users_company_id", "company_id"),
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


class InterviewCall(Base):
    __tablename__ = "interview_calls"

    id                      = Column(Integer, primary_key=True)

    call_id                 = Column(String, unique=True, nullable=False, index=True)
    agent_id                = Column(String)

    call_status             = Column(String)
    direction               = Column(String)

    candidate_id            = Column(String, ForeignKey("candidates.s3_candidate_id", ondelete="SET NULL"), nullable=True, index=True)
    job_id                  = Column(String, ForeignKey("jobs.s3_job_id", ondelete="SET NULL"), nullable=True, index=True)

    from_number             = Column(String)
    to_number               = Column(String)

    start_timestamp         = Column(BigInteger)
    duration_ms             = Column(Integer)

    transcript              = Column(String)
    recording_url           = Column(String)
    public_log_url          = Column(String)

    call_summary            = Column(String)
    user_sentiment          = Column(String)

    interview_score         = Column(Float)
    technical_assessment    = Column(String)
    communication_quality   = Column(String)
    strengths               = Column(String)
    weaknesses              = Column(String)
    recommend_hire          = Column(Boolean)
    interview_outcome       = Column(String)

    combined_cost           = Column(Float)

    metadata_json           = Column(JSONB)  # Renamed because metadata is a reserved attribute on SQLAlchemy models

    created_at              = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<InterviewCall call_id={self.call_id} status={self.call_status}>"
