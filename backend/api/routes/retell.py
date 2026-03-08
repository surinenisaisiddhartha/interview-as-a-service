from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
import os
from dotenv import set_key
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Candidate, Job, InterviewCall
from application.services.retell_service import RetellService

from application.schemas import (
    UpdateLlmPayload,
    RetellAgentResponse, 
    RetellLlmResponse, 
    CreateCallPayload, 
    CreateBatchCallPayload, 
    CallResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/retell", tags=["Retell AI"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

retell_service = RetellService()

def update_env_id(key: str, value: str):
    """Updates a specific key in the .env file."""
    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        try:
            set_key(env_path, key, value)
            logger.info(f"Successfully updated {key} in .env to {value}")
        except Exception as e:
            logger.error(f"Failed to update {key} in .env: {e}")
    else:
        logger.warning(f".env file not found at {env_path}. Skipping automatic update.")


# ── 1. Create Retell Agent ────────────────────────────────────────────────────
@router.post("/create-agent", response_model=RetellAgentResponse)
def retell_create_agent(llm_id: str):
    """
    Creates a Retell voice agent linked to the given LLM.

    Query param:
        llm_id — the RETELL_LLM_ID returned from /create-llm

    Returns:
        agent_id — save this in your .env as RETELL_AGENT_ID
    """
    try:
        agent_id = retell_service.create_agent(llm_id)
        
        # Automatically update .env
        update_env_id("RETELL_AGENT_ID", agent_id)

        return {
            "status": "created",
            "agent_id": agent_id,
            "message": f"Automatically updated .env → RETELL_AGENT_ID={agent_id}",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error creating Retell Agent: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Create Retell LLM ──────────────────────────────────────────────────────
@router.post("/create-llm", response_model=RetellLlmResponse)
def retell_create_llm():
    """
    Creates a Retell LLM (The 'Brain') with the base interview prompt.

    Returns:
        llm_id — save this in your .env as RETELL_LLM_ID
    """
    try:
        llm_id = retell_service.create_llm_dynamic()
        
        # Automatically update .env
        update_env_id("RETELL_LLM_ID", llm_id)

        return {
            "status": "created",
            "llm_id": llm_id,
            "message": f"Automatically updated .env → RETELL_LLM_ID={llm_id}",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error creating Retell LLM: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Update Retell LLM by Injecting SQL Variables ───────────────────────────
@router.patch("/update-retell-llm/{llm_id}", response_model=RetellLlmResponse)
def retell_update_llm_dynamic(llm_id: str, payload: UpdateLlmPayload, db: Session = Depends(get_db)):
    """
    Updates an existing Retell LLM by injecting dynamic variables from SQL into the prompt.
    """
    try:
        updated_llm_id = retell_service.update_llm_dynamic(llm_id, payload.candidate_id, payload.job_id, db)
        return {
            "status": "updated",
            "llm_id": updated_llm_id,
            "message": "Variables from SQL injected into prompt successfully."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error updating Retell LLM dynamically: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Create Phone Call ──────────────────────────────────────────────────────
@router.post("/create-phone-call", response_model=CallResponse)
def create_phone_call(payload: CreateCallPayload, db: Session = Depends(get_db)):
    """
    Triggers an outbound phone call to a candidate.
    """
    try:
        # Use existing Agent and LLM from .env, but inject candidate-specific variables for this call.
        # Ignore default Swagger "string" values
        payload_from = payload.from_number if payload.from_number != "string" else None
        payload_agent = payload.agent_id if payload.agent_id != "string" else None
        payload_to = payload.to_number if payload.to_number != "string" else None

        def format_phone(num: str) -> str:
            if not num: return num
            num = num.strip()
            # 1. Already in E.164 format? Leave it.
            if num.startswith("+"):
                return num
            # 2. Is it a 10-digit number? Assume it's Indian and add +91
            if len(num) == 10 and num.isdigit():
                return f"+91{num}"
            # 3. Otherwise, just add '+' (Fallback)
            return f"+{num}"

        if payload.candidate_id and payload.job_id:
            # Check if Candidate and Job exist
            candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
            job = db.query(Job).filter(Job.id == payload.job_id).first()

            if not candidate:
                raise HTTPException(status_code=404, detail=f"Candidate {payload.candidate_id} not found")
            if not job:
                raise HTTPException(status_code=404, detail=f"Job {payload.job_id} not found")

            to_number = format_phone(payload_to)
            if not to_number:
                if not candidate.phone_number:
                    raise HTTPException(status_code=400, detail="Candidate does not have a phone number and no to_number was provided.")
                to_number = format_phone(candidate.phone_number)

        else:
            to_number = format_phone(payload_to)
            if not to_number:
                raise HTTPException(status_code=400, detail="If candidate_id is not provided, to_number must be provided.")

        from_number = format_phone(payload_from or os.getenv("RETELL_PHONE_NUMBER"))
        if not from_number:
            raise HTTPException(status_code=400, detail="from_number is required. Provide it or set RETELL_PHONE_NUMBER in .env")

        # Combine candidate/job into metadata for tracking
        enhanced_metadata = payload.metadata or {}
        if payload.candidate_id: enhanced_metadata["candidate_id"] = payload.candidate_id
        if payload.job_id: enhanced_metadata["job_id"] = payload.job_id

        dynamic_vars = {}
        if payload.candidate_id and payload.job_id:
            dynamic_vars = retell_service.get_dynamic_variables(candidate, job)

        call = retell_service.create_phone_call(
            from_number=from_number,
            to_number=to_number,
            agent_id=payload_agent or os.getenv("RETELL_AGENT_ID"),
            metadata=enhanced_metadata,
            retell_llm_dynamic_variables=dynamic_vars
        )
        
        return {
            "call_id": call.call_id,
            "agent_id": call.agent_id,
            "call_status": call.call_status,
            "to_number": getattr(call, "to_number", None),
            "from_number": getattr(call, "from_number", None),
            "metadata": getattr(call, "metadata", None),
            "transcript": getattr(call, 'transcript', None),
            "recording_url": getattr(call, 'recording_url', None),
            "public_log_url": getattr(call, 'public_log_url', None)
        }
    except Exception as e:
        logger.error("Error creating phone call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Get Call Details ───────────────────────────────────────────────────────
@router.get("/get-call/{call_id}", response_model=CallResponse)
def get_call(call_id: str, db: Session = Depends(get_db)):
    """
    Retrieves call details from Retell and stores them in DB automatically.
    """
    try:
        call = retell_service.get_call(call_id)

        # Extract candidate/job from metadata if available
        metadata = getattr(call, "metadata", {}) or {}
        candidate_id = metadata.get("candidate_id")
        job_id = metadata.get("job_id")

        analysis = getattr(call, "call_analysis", None)
        custom = getattr(analysis, "custom_analysis_data", None) if analysis else None

        logger.info(f"Retrieved call details for {call_id}. Status: {call.call_status}. Has Analysis: {analysis is not None}")

        # Prepare call data for DB
        call_data = {
            "agent_id": call.agent_id,
            "call_status": call.call_status,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "direction": getattr(call, "direction", None),
            "from_number": getattr(call, "from_number", None),
            "to_number": getattr(call, "to_number", None),
            "start_timestamp": getattr(call, "start_timestamp", None),
            "duration_ms": getattr(call, "duration_ms", None),
            "transcript": getattr(call, "transcript", None),
            "recording_url": getattr(call, "recording_url", None),
            "public_log_url": getattr(call, "public_log_url", None),
            
            # Standard Retell Analysis
            "user_sentiment": getattr(analysis, "user_sentiment", None) if analysis else None,
            
            # Use custom summary if provided in config, otherwise fall back to standard summary
            "call_summary": (custom.get("call_summary") or getattr(analysis, "call_summary", None)) if analysis else None,
            
            # Custom Analysis Data from Config
            "interview_score": custom.get("interview_score") if custom else None,
            "technical_assessment": custom.get("technical_assessment") if custom else None,
            "communication_quality": custom.get("communication_quality") if custom else None,
            "strengths": custom.get("strengths") if custom else None,
            "weaknesses": custom.get("weaknesses") if custom else None,
            "recommend_hire": custom.get("recommend_hire") if custom else None,
            "interview_outcome": custom.get("interview_outcome") if custom else None,
            
            "combined_cost": getattr(getattr(call, "call_cost", None), "combined_cost", None) if hasattr(call, "call_cost") else None,
            "metadata_json": getattr(call, "metadata", None)
        }

        # Check if this call already exists in DB to avoid IntegrityError (duplicate call_id)
        existing_call = db.query(InterviewCall).filter(InterviewCall.call_id == call.call_id).first()

        if existing_call:
            # Update existing record with latest data
            for key, value in call_data.items():
                setattr(existing_call, key, value)
            logger.info(f"Updated existing call record in DB: {call.call_id}")
        else:
            # Create new record
            interview_call = InterviewCall(
                call_id=call.call_id,
                **call_data
            )
            db.add(interview_call)
            logger.info(f"Created new call record in DB: {call.call_id}")

        db.commit()

        # Return the call object (FastAPI/Pydantic will handle serialization to CallResponse)
        return call

    except Exception as e:
        logger.error("Error getting/storing call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. Update Call Metadata ───────────────────────────────────────────────────
@router.patch("/update-call/{call_id}")
def update_call(call_id: str, metadata: dict):
    """
    Updates the metadata of a call.
    """
    try:
        call = retell_service.update_call(call_id, metadata)
        return {"status": "updated", "call_id": call.call_id}
    except Exception as e:
        logger.error("Error updating call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 7. Delete Call ────────────────────────────────────────────────────────────
@router.delete("/delete-call/{call_id}")
def delete_call(call_id: str):
    """
    Permanently deletes a call record from Retell AI.
    """
    try:
        retell_service.delete_call(call_id)
        return {"status": "deleted", "call_id": call_id}
    except Exception as e:
        logger.error("Error deleting call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 8. Create Batch Calls ─────────────────────────────────────────────────────
@router.post("/create-batch-call")
def create_batch_call(payload: CreateBatchCallPayload, db: Session = Depends(get_db)):
    """
    Triggers multiple phone calls simultaneously for a list of candidates applying to a job.
    """
    try:
        payload_from = payload.from_number if payload.from_number != "string" else None
        payload_agent = payload.agent_id if payload.agent_id != "string" else None

        def format_phone(num: str) -> str:
            if not num: return num
            num = num.strip()
            if num.startswith("+"): return num
            if len(num) == 10 and num.isdigit(): return f"+91{num}"
            return f"+{num}"

        from_number = format_phone(payload_from or os.getenv("RETELL_PHONE_NUMBER"))
        if not from_number:
            raise HTTPException(status_code=400, detail="from_number is required. Provide it or set RETELL_PHONE_NUMBER in .env")

        agent_id = payload_agent or os.getenv("RETELL_AGENT_ID")

        job = db.query(Job).filter(Job.id == payload.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {payload.job_id} not found")

        candidates = db.query(Candidate).filter(Candidate.id.in_(payload.candidate_ids)).all()
        if not candidates:
            raise HTTPException(status_code=404, detail="No matching candidates found from the provided list")

        tasks = []
        for candidate in candidates:
            if not candidate.phone_number:
                logger.warning(f"Skipping Candidate {candidate.id} as they lack a phone number")
                continue

            dynamic_vars = retell_service.get_dynamic_variables(candidate, job)
            
            tasks.append({
                "to_number": format_phone(candidate.phone_number),
                "retell_llm_dynamic_variables": dynamic_vars,
                "override_agent_id": agent_id,
                "metadata": {
                    "candidate_id": candidate.id,
                    "job_id": job.id
                }
            })
        
        if not tasks:
            raise HTTPException(status_code=400, detail="No valid candidates with phone numbers were found to call.")

        batch_call = retell_service.create_batch_call(from_number, tasks)
        return {
            "status": "batch_triggered",
            "batch_id": getattr(batch_call, 'batch_call_id', 'unknown'),
            "message": f"Triggered {len(tasks)} parallel calls successfully."
        }
    except Exception as e:
        logger.error("Error creating batch call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
