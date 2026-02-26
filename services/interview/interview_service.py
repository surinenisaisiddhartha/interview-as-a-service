"""
interview/interview_service.py
===============================
Service layer for Retell AI voice interview integration.

Responsibilities:
  - Trigger outbound phone call interviews
  - Create web call (browser-based) interviews
  - Verify incoming webhooks from Retell
  - Save interview transcripts and analysis to PostgreSQL
  - Retrieve call details
"""

import os
import json
import logging
from typing import Optional
from datetime import datetime, timezone

from retell import Retell
from dotenv import load_dotenv

from db.database import SessionLocal
from db.models import Candidate, Job, Match, Interview

load_dotenv()
logger = logging.getLogger(__name__)

# ── Retell configuration — read dynamically so .env changes are always picked up ─
_RETELL_API_KEY    = lambda: os.getenv("RETELL_API_KEY", "")
_RETELL_AGENT_ID   = lambda: os.getenv("RETELL_AGENT_ID", "")
_RETELL_PHONE_FROM = lambda: os.getenv("RETELL_PHONE_NUMBER", "")

# Qualification threshold — only call candidates above this match %
INTERVIEW_THRESHOLD = float(os.getenv("INTERVIEW_THRESHOLD", "60.0"))


def _get_client() -> Retell:
    api_key = _RETELL_API_KEY()
    if not api_key:
        raise RuntimeError(
            "RETELL_API_KEY is not set. Add it to your .env file."
        )
    return Retell(api_key=api_key)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_candidate_and_job(candidate_id: int, job_id: int):
    """Fetch candidate + job from DB. Returns (candidate, job) or raises."""
    db = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        job       = db.query(Job).filter(Job.id == job_id).first()
        if not candidate:
            raise ValueError(f"Candidate id={candidate_id} not found.")
        if not job:
            raise ValueError(f"Job id={job_id} not found.")
        return candidate, job
    finally:
        db.close()


def _get_match_percent(candidate_id: int, job_id: int) -> float:
    """Fetch the matching percentage from the matches table."""
    db = SessionLocal()
    try:
        match = (
            db.query(Match)
            .filter(Match.candidate_id == candidate_id, Match.job_id == job_id)
            .first()
        )
        return match.final_match_percentage if match else 0.0
    finally:
        db.close()


def _build_dynamic_variables(candidate, job, match_percent: float) -> dict:
    """
    Build the retell_llm_dynamic_variables passed into the LLM prompt.
    Maps to {{placeholders}} in setup.py's general_prompt.

    Variables injected:
        {{candidate_name}}, {{job_title}}, {{company_name}},
        {{primary_skills}}, {{required_skills}}, {{skills_gap}},
        {{matching_percent}}, {{experience_years}}, {{required_experience}},
        {{focus_area}}, {{interview_mode}}
    """
    # ── Flatten candidate skills from JSONB dict ──────────────────────────────
    candidate_skills_raw = []
    if isinstance(candidate.skills, dict):
        for category_skills in candidate.skills.values():
            if isinstance(category_skills, list):
                candidate_skills_raw.extend(category_skills)
    # Normalise to lowercase set for gap comparison
    candidate_skills_set = {s.lower().strip() for s in candidate_skills_raw}
    primary_skills = ", ".join(candidate_skills_raw[:10]) if candidate_skills_raw else "Not specified"

    # ── Job required skills from JSONB list ───────────────────────────────────
    job_required_skills: list = []
    if isinstance(job.required_skills, list):
        job_required_skills = [str(s) for s in job.required_skills]
    required_skills_str = ", ".join(job_required_skills) if job_required_skills else "Not specified"

    # ── Skills gap: required skills the candidate is missing ──────────────────
    gap_skills = [
        s for s in job_required_skills
        if s.lower().strip() not in candidate_skills_set
    ]
    skills_gap_str = ", ".join(gap_skills) if gap_skills else "None"

    return {
        "candidate_name":      candidate.full_name or "Candidate",
        "job_title":           job.title or "the position",
        "company_name":        job.company_name or "our company",
        # Candidate skill snapshot
        "primary_skills":      primary_skills,
        "experience_years":    str(round(candidate.overall_experience_years or 0, 1)),
        # Job requirements
        "required_skills":     required_skills_str,
        "required_experience": str(job.min_required_experience_years or 0),
        "focus_area":          job.title or "",          # no department column → use job title
        "interview_mode":      "dynamic",
        # Match-derived
        "matching_percent":    str(round(match_percent, 1)),
        "skills_gap":          skills_gap_str,
    }


def _create_interview_record(candidate_id: int, job_id: int, call_id: str,
                              call_type: str, match_percent: float):
    """Insert a new interview record into the interviews table."""
    db = SessionLocal()
    try:
        interview = Interview(
            candidate_id      = candidate_id,
            job_id            = job_id,
            call_id           = call_id,
            call_type         = call_type,
            status            = "initiated",
            match_percent     = match_percent,
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)
        logger.info("Interview record created: id=%s call_id=%s", interview.id, call_id)
        return interview.id
    except Exception as e:
        db.rollback()
        logger.error("Failed to create interview record: %s", e)
        raise
    finally:
        db.close()


# ── Public API: Trigger Interviews ────────────────────────────────────────────

def trigger_phone_interview(candidate_id: int, job_id: int) -> dict:
    """
    Trigger an outbound phone call interview for a qualified candidate.

    Checks match percentage against INTERVIEW_THRESHOLD first.
    If qualified, dials the candidate's phone number via Retell API.

    Returns:
        dict with call_id, status, match_percent, and interview_id
    """
    candidate, job = _get_candidate_and_job(candidate_id, job_id)

    # Check qualification threshold
    match_percent = _get_match_percent(candidate_id, job_id)
    if match_percent < INTERVIEW_THRESHOLD:
        return {
            "status":        "not_qualified",
            "message":       f"Candidate match {match_percent}% is below threshold {INTERVIEW_THRESHOLD}%.",
            "match_percent": match_percent,
            "candidate_id":  candidate_id,
            "job_id":        job_id,
        }

    if not candidate.phone_number:
        return {
            "status":       "error",
            "message":      "Candidate has no phone number on record.",
            "candidate_id": candidate_id,
        }

    if not _RETELL_PHONE_FROM():
        raise RuntimeError(
            "RETELL_PHONE_NUMBER is not set. Run python -m interview.setup first."
        )
    if not _RETELL_AGENT_ID():
        raise RuntimeError(
            "RETELL_AGENT_ID is not set. Run python -m interview.setup first."
        )

    client = _get_client()
    dynamic_vars = _build_dynamic_variables(candidate, job, match_percent)

    # Format phone number — Retell requires E.164 format (+12345678900)
    phone_to = candidate.phone_number.strip()
    if not phone_to.startswith("+"):
        # Prepend country code if missing (default +1 for US/India +91)
        code = candidate.phone_country_code or "+91"
        if not code.startswith("+"):
            code = "+" + code
        phone_to = code + phone_to.lstrip("0")

    call = client.call.create_phone_call(
        from_number  = _RETELL_PHONE_FROM(),
        to_number    = phone_to,
        retell_llm_dynamic_variables = dynamic_vars,
        metadata     = {
            "candidate_id": str(candidate_id),
            "job_id":       str(job_id),
        },
    )

    interview_id = _create_interview_record(
        candidate_id  = candidate_id,
        job_id        = job_id,
        call_id       = call.call_id,
        call_type     = "phone",
        match_percent = match_percent,
    )

    logger.info(
        "Phone interview initiated: candidate=%s job=%s call_id=%s match=%.1f%%",
        candidate_id, job_id, call.call_id, match_percent
    )

    return {
        "status":        "initiated",
        "call_type":     "phone",
        "call_id":       call.call_id,
        "interview_id":  interview_id,
        "candidate_id":  candidate_id,
        "candidate_name": candidate.full_name,
        "job_id":        job_id,
        "job_title":     job.title,
        "match_percent": match_percent,
        "phone_called":  phone_to,
    }


def create_web_interview(candidate_id: int, job_id: int) -> dict:
    """
    Create a browser-based (web call) interview session.
    Returns an access_token for the frontend to start the call via Retell Web SDK.

    Flow:
        Backend  → POST /interview/web/{candidate_id}/{job_id}
        Response → { access_token, call_id }
        Frontend → uses access_token with @retell-ai/retell-client-js-sdk
    """
    candidate, job = _get_candidate_and_job(candidate_id, job_id)

    match_percent = _get_match_percent(candidate_id, job_id)
    if match_percent < INTERVIEW_THRESHOLD:
        return {
            "status":        "not_qualified",
            "message":       f"Candidate match {match_percent}% is below threshold {INTERVIEW_THRESHOLD}%.",
            "match_percent": match_percent,
        }

    if not _RETELL_AGENT_ID():
        raise RuntimeError(
            "RETELL_AGENT_ID is not set. Run python -m interview.setup first."
        )

    client = _get_client()
    dynamic_vars = _build_dynamic_variables(candidate, job, match_percent)

    call = client.call.create_web_call(
        agent_id     = _RETELL_AGENT_ID(),
        retell_llm_dynamic_variables = dynamic_vars,
        metadata     = {
            "candidate_id": str(candidate_id),
            "job_id":       str(job_id),
        },
    )

    interview_id = _create_interview_record(
        candidate_id  = candidate_id,
        job_id        = job_id,
        call_id       = call.call_id,
        call_type     = "web",
        match_percent = match_percent,
    )

    logger.info(
        "Web interview created: candidate=%s job=%s call_id=%s",
        candidate_id, job_id, call.call_id
    )

    return {
        "status":        "ready",
        "call_type":     "web",
        "access_token":  call.access_token,  # frontend uses this
        "call_id":       call.call_id,
        "interview_id":  interview_id,
        "candidate_id":  candidate_id,
        "candidate_name": candidate.full_name,
        "job_id":        job_id,
        "job_title":     job.title,
        "match_percent": match_percent,
    }


# ── Webhook Handler ────────────────────────────────────────────────────────────

def verify_webhook(body_raw: str, signature: str) -> bool:
    """Verify that the incoming webhook is genuinely from Retell."""
    client = _get_client()
    return client.verify(
        body_raw,
        api_key   = _RETELL_API_KEY(),
        signature = signature,
    )


def handle_webhook_event(event: str, call: dict):
    """
    Process a Retell webhook event and update the interviews table.

    Supported events:
        call_started  → mark interview as 'in_progress'
        call_ended    → save transcript, duration, mark 'completed'
        call_analyzed → save full post-call analysis (score, recommendation, etc.)
    """
    call_id  = call.get("call_id", "")
    metadata = call.get("metadata", {})

    if event == "call_started":
        _update_interview_status(call_id, "in_progress")
        logger.info("Call started: call_id=%s", call_id)

    elif event == "call_ended":
        transcript    = call.get("transcript", "")
        recording_url = call.get("recording_url", "")
        duration_ms   = call.get("duration_ms")
        duration_sec  = round(duration_ms / 1000, 1) if duration_ms else None

        _update_interview_on_end(
            call_id       = call_id,
            transcript    = transcript,
            recording_url = recording_url,
            duration_sec  = duration_sec,
        )
        logger.info("Call ended: call_id=%s duration=%ss", call_id, duration_sec)

    elif event == "call_analyzed":
        analysis = call.get("call_analysis", {})
        custom   = analysis.get("custom_analysis_data", {})

        _update_interview_analysis(
            call_id               = call_id,
            call_summary          = analysis.get("call_summary"),
            user_sentiment        = analysis.get("user_sentiment"),
            call_successful       = analysis.get("call_successful"),
            interview_score       = custom.get("interview_score"),
            technical_assessment  = custom.get("technical_assessment"),
            communication_quality = custom.get("communication_quality"),
            strengths             = custom.get("strengths"),
            weaknesses            = custom.get("weaknesses"),
            recommend_hire        = custom.get("recommend_hire"),
            interview_outcome     = custom.get("interview_outcome"),
        )
        logger.info("Call analyzed: call_id=%s", call_id)


# ── DB Update Helpers ─────────────────────────────────────────────────────────

def _update_interview_status(call_id: str, status: str):
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.call_id == call_id).first()
        if interview:
            interview.status = status
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error updating interview status: %s", e)
    finally:
        db.close()


def _update_interview_on_end(call_id: str, transcript: str,
                              recording_url: str, duration_sec: Optional[float]):
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.call_id == call_id).first()
        if interview:
            interview.status        = "completed"
            interview.transcript    = transcript
            interview.recording_url = recording_url
            interview.duration_sec  = duration_sec
            interview.ended_at      = datetime.now(timezone.utc)
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error updating interview on end: %s", e)
    finally:
        db.close()


def _update_interview_analysis(call_id: str, call_summary: str, user_sentiment: str,
                                call_successful: bool, interview_score: str,
                                technical_assessment: str, communication_quality: str,
                                strengths: str, weaknesses: str,
                                recommend_hire: bool, interview_outcome: str):
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.call_id == call_id).first()
        if interview:
            interview.status               = "analyzed"
            interview.call_summary         = call_summary
            interview.user_sentiment       = user_sentiment
            interview.call_successful      = call_successful
            interview.interview_score      = interview_score
            interview.technical_assessment = technical_assessment
            interview.communication_quality= communication_quality
            interview.strengths            = strengths
            interview.weaknesses           = weaknesses
            interview.recommend_hire       = recommend_hire
            interview.interview_outcome    = interview_outcome
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error updating interview analysis: %s", e)
    finally:
        db.close()


# ── Retrieve Call Details ─────────────────────────────────────────────────────

def get_call_details(call_id: str) -> dict:
    """
    Fetch live call details from Retell API.
    Useful as polling alternative to webhooks.
    """
    client = _get_client()
    call = client.call.retrieve(call_id)
    return {
        "call_id":       call.call_id,
        "call_status":   call.call_status,
        "transcript":    call.transcript,
        "recording_url": call.recording_url,
        "duration_ms":   getattr(call, "duration_ms", None),
        "call_analysis": call.call_analysis.model_dump() if call.call_analysis else None,
    }


def get_interview_by_candidate(candidate_id: int) -> list:
    """Return all interview records for a candidate from PostgreSQL."""
    db = SessionLocal()
    try:
        interviews = (
            db.query(Interview)
            .filter(Interview.candidate_id == candidate_id)
            .order_by(Interview.created_at.desc())
            .all()
        )
        return [_interview_to_dict(i) for i in interviews]
    finally:
        db.close()


def get_interview_by_id(interview_id: int) -> Optional[dict]:
    """Return a single interview record by its DB id."""
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        return _interview_to_dict(interview) if interview else None
    finally:
        db.close()


def _interview_to_dict(i: Interview) -> dict:
    return {
        "id":                    i.id,
        "candidate_id":          i.candidate_id,
        "job_id":                i.job_id,
        "call_id":               i.call_id,
        "call_type":             i.call_type,
        "status":                i.status,
        "match_percent":         i.match_percent,
        "duration_sec":          i.duration_sec,
        "recording_url":         i.recording_url,
        "transcript":            i.transcript,
        "call_summary":          i.call_summary,
        "user_sentiment":        i.user_sentiment,
        "call_successful":       i.call_successful,
        "interview_score":       i.interview_score,
        "technical_assessment":  i.technical_assessment,
        "communication_quality": i.communication_quality,
        "strengths":             i.strengths,
        "weaknesses":            i.weaknesses,
        "recommend_hire":        i.recommend_hire,
        "interview_outcome":     i.interview_outcome,
        "created_at":            i.created_at.isoformat() if i.created_at else None,
        "ended_at":              i.ended_at.isoformat() if i.ended_at else None,
    }
