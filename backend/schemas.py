"""
Request/response schemas for API payloads.
Centralized Pydantic models for data validation and serialization.

HOW TO UNDERSTAND THIS FILE:
1. These classes are 'blueprints' for data. 
2. When data enters the API (Request), Pydantic checks if it's correct.
3. When data leaves the API (Response), Pydantic formats it nicely.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


# ── COMMON SCHEMAS ───────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """
    Standard response to check if the server is running.
    Example: {"status": "ok", "message": "Server is healthy"}
    """
    status: str = "ok"
    message: str


# ── CANDIDATE SCHEMAS ────────────────────────────────────────────────────────

class CandidateSchema(BaseModel):
    """
    Blueprint for a Candidate's technical profile.
    This matches exactly how a candidate is stored in the database.
    """
    id: int                                      # Unique database ID
    full_name: str                               # Candidate's full name
    email: str                                   # Email address
    phone_number: Optional[str] = None           # Optional phone
    phone_country_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    current_designation: Optional[str] = None    # Current job title
    current_company: Optional[str] = None        # Where they work now
    overall_experience_years: Optional[float] = 0.0
    summary: Optional[str] = None                # AI-generated bio summary
    highest_degree: Optional[str] = None
    highest_degree_name: Optional[str] = None
    institution: Optional[str] = None            # University name
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None
    
    # JSON Data: Lists of dictionaries for complex data
    work_experience: Optional[List[Dict[str, Any]]] = []
    skills: Optional[Dict[str, List[str]]] = {}
    projects: Optional[List[Dict[str, Any]]] = []
    
    s3_link: Optional[str] = None                # Link to the PDF resume in the cloud
    created_at: datetime                         # When the record was created

    class Config:
        # This allows Pydantic to read data directly from database objects (SQLAlchemy)
        from_attributes = True


# ── JOB SCHEMAS ──────────────────────────────────────────────────────────────

class JobSchema(BaseModel):
    """
    Blueprint for a Job Description.
    """
    id: int
    title: str                                   # Job title (e.g. Python Developer)
    company_name: Optional[str] = None
    min_required_experience_years: Optional[float] = 0.0
    max_required_experience_years: Optional[float] = 0.0
    location: Optional[str] = None
    employment_type: Optional[str] = None
    summary: Optional[str] = None                # AI summary of the job roles
    required_skills: Optional[List[str]] = []    # Must-have skills
    preferred_skills: Optional[List[str]] = []   # Nice-to-have skills
    s3_link: Optional[str] = None                # Link to the original JD file
    created_at: datetime

    class Config:
        from_attributes = True


# ── MATCHING SCHEMAS ─────────────────────────────────────────────────────────

class MatchCandidatesToJobRequest(BaseModel):
    """
    What the frontend sends to start a match.
    Example: Match these 5 candidate IDs to this 1 Job ID.
    """
    candidate_ids: List[int]
    job_id: int


class MatchScores(BaseModel):
    """
    The mathematical scores calculated by the Match Engine.
    Scales from 0.0 to 1.0 (or percentage).
    """
    required_skills_score: float
    preferred_skills_score: float
    experience_score: float
    final_match_percentage: float


class MatchingResult(BaseModel):
    """
    Detailed explanation of WHY a candidate matched a job.
    Includes what skills they had and what they were missing.
    """
    candidate_id: Optional[int] = None
    candidate_name: str
    job_title: str
    candidate_experience_years: float
    min_required_experience: float
    matched_required_skills: List[str]
    missing_required_skills: List[str]
    matched_preferred_skills: List[str]
    match_scores: MatchScores                    # Uses the MatchScores blueprint above
    error: Optional[str] = None                  # If matching failed for some reason


class BatchMatchResponse(BaseModel):
    """
    Response when matching many candidates at once.
    """
    job_id: int
    total_matched: int
    results: List[MatchingResult]


class IndividualRankedMatch(BaseModel):
    """
    Simplified data for a candidate appearing in a 'Top 10' list.
    """
    rank: int                                    # 1, 2, 3...
    candidate_id: int
    candidate_name: str
    experience_years: float
    match_scores: MatchScores
    matched_required_skills: List[str]
    missing_required_skills: List[str]
    matched_preferred_skills: List[str]


class RankedMatchesResponse(BaseModel):
    """
    The final list of ranked candidates for a specific job.
    """
    job_id: int
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    total_candidates: int
    candidates: List[IndividualRankedMatch]


class MatchModelResponse(BaseModel):
    """
    Blueprint for reading a saved match record from the 'matches' table.
    """
    id: int
    candidate_id: int
    job_id: int
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    required_skills_score: float
    preferred_skills_score: float
    experience_score: float
    final_match_percentage: float
    matched_required_skills: List[str]
    missing_required_skills: List[str]
    matched_preferred_skills: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── RETELL AI SCHEMAS ────────────────────────────────────────────────────────

class UpdateLlmPayload(BaseModel):
    """
    Data sent to give the Retell AI Voice bot 'context' before a call.
    It needs to know who the candidate is and what the job is.
    """
    candidate_id: int
    job_id: int


class RetellAgentResponse(BaseModel):
    """
    Response from the system after creating a Voice Agent.
    """
    status: str
    agent_id: str
    message: str


class RetellLlmResponse(BaseModel):
    """
    Response from the system when the AI 'Brain' (LLM) is configured.
    """
    status: str
    llm_id: str
    message: Optional[str] = None
