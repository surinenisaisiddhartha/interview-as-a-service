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


# ── RETELL POST-CALL ANALYSIS CONFIG ─────────────────────────────────────────

RETELL_POST_CALL_ANALYSIS_CONFIG = [
    {
        "name": "call_summary",
        "type": "string",
        "description": "Provide a concise 3–5 sentence summary of the interview conversation including candidate background, key skills mentioned, and overall interview performance."
    },
    {
        "name": "interview_score",
        "type": "number",
        "description": "Overall evaluation score for the candidate from 1 to 10. Consider technical knowledge, clarity of answers, confidence, and relevance of experience. 10 indicates an exceptional candidate."
    },
    {
        "name": "technical_assessment",
        "type": "string",
        "description": "Evaluate the candidate's technical knowledge based on their answers. Mention technologies discussed, depth of understanding, and whether their knowledge appears practical or theoretical."
    },
    {
        "name": "communication_quality",
        "type": "string",
        "description": "Assess the candidate’s communication skills including clarity, confidence, articulation, and ability to explain technical concepts clearly."
    },
    {
        "name": "strengths",
        "type": "string",
        "description": "List the candidate’s strongest qualities observed during the interview such as technical expertise, problem-solving ability, relevant project experience, or strong communication."
    },
    {
        "name": "weaknesses",
        "type": "string",
        "description": "Identify skill gaps, unclear responses, lack of experience in required areas, or any weaknesses noticed during the interview."
    },
    {
        "name": "recommend_hire",
        "type": "boolean",
        "description": "Return true if the candidate demonstrated sufficient skills and communication ability to proceed in the hiring process, otherwise return false."
    },
    {
        "name": "interview_outcome",
        "type": "string",
        "description": "Final hiring recommendation such as 'Strong Hire', 'Hire', 'Hold for Further Evaluation', or 'Reject' based on the overall interview performance."
    }
]


class CreateCallPayload(BaseModel):
    """
    Payload to trigger a single phone call.
    """
    from_number: Optional[str] = None
    to_number: Optional[str] = None
    agent_id: Optional[str] = None
    candidate_id: Optional[int] = None
    job_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = {}


class CreateBatchCallPayload(BaseModel):
    """
    Payload to trigger multiple phone calls at once for a single job.
    """
    job_id: int
    candidate_ids: List[int]
    from_number: Optional[str] = None
    agent_id: Optional[str] = None


class LatencyMetrics(BaseModel):
    p50: Optional[float] = None
    p90: Optional[float] = None
    p95: Optional[float] = None
    p99: Optional[float] = None

class CallLatency(BaseModel):
    e2e: Optional[LatencyMetrics] = None
    asr: Optional[LatencyMetrics] = None
    llm: Optional[LatencyMetrics] = None

class CallAnalysis(BaseModel):
    call_summary: Optional[str] = None
    user_sentiment: Optional[str] = None
    call_successful: Optional[bool] = None
    call_outcome: Optional[str] = None
    custom_analysis_data: Optional[Dict[str, Any]] = None

class CallCost(BaseModel):
    combined_cost: Optional[float] = None

class CallResponse(BaseModel):
    """
    Detailed response containing status, transcript, recording, 
    and advanced post-call analysis/metrics.
    """
    call_id: str
    agent_id: str
    call_status: str
    start_timestamp: Optional[int] = None
    duration_ms: Optional[int] = None
    call_type: Optional[str] = None
    to_number: Optional[str] = None
    from_number: Optional[str] = None
    direction: Optional[str] = None
    disconnection_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    transcript: Optional[str] = None
    recording_url: Optional[str] = None
    public_log_url: Optional[str] = None
    call_analysis: Optional[CallAnalysis] = None
    call_cost: Optional[CallCost] = None
    latency: Optional[CallLatency] = None
