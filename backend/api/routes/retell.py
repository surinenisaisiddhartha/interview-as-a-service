from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
import logging
import os
from dotenv import set_key
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Role, User, Company, Candidate, Job, InterviewCall, RetellAgent
from services.retell_service import RetellService
from log import log_tool
from schemas import (
    UpdateLlmPayload,
    RetellAgentResponse,
    RetellLlmResponse,
    CreateCallPayload,
    CreateBatchCallPayload,
    CallResponse,
    AgentAssignmentRequest,
    RetellAgentSchema,
    InterviewCallSchema
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
def retell_create_agent(llm_id: str, db: Session = Depends(get_db)):
    """
    Creates a Retell voice agent linked to the given LLM.
    """
    try:
        agent_id = retell_service.create_agent(llm_id)
        
        # PERSIST to DB
        agent_count = db.query(RetellAgent).count()
        new_agent = RetellAgent(
            agent_id=agent_id,
            agent_name=f"Voice Agent #{agent_count + 1}",
            llm_id=llm_id
        )
        db.add(new_agent)
        db.commit()

        # Automatically update .env
        update_env_id("RETELL_AGENT_ID", agent_id)

        return {
            "status": "created",
            "agent_id": agent_id,
            "message": f"Automatically updated .env and DB → RETELL_AGENT_ID={agent_id}",
        }
    except Exception as e:
        db.rollback()
        logger.error("Error creating Retell Agent: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[RetellAgentSchema])
def list_agents(db: Session = Depends(get_db)):
    """Lists all created Retell agents from the database."""
    return db.query(RetellAgent).order_by(RetellAgent.created_at.desc()).all()


@router.post("/assign-agent")
def assign_agent_to_company(payload: AgentAssignmentRequest, db: Session = Depends(get_db)):
    """Assigns an existing agent to a specific company."""
    agent = db.query(RetellAgent).filter(RetellAgent.agent_id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    agent.company_id = payload.company_id
    db.commit()

    return {"status": "success", "message": f"Agent {payload.agent_id} assigned to {company.name}"}


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


# # ── 3. Update Retell LLM by Injecting SQL Variables ───────────────────────────
# @router.patch("/update-retell-llm/{llm_id}", response_model=RetellLlmResponse)
# def retell_update_llm_dynamic(llm_id: str, payload: UpdateLlmPayload, db: Session = Depends(get_db)):
#     """
#     Updates an existing Retell LLM by injecting dynamic variables from SQL into the prompt.
#     """
#     try:
#         updated_llm_id = retell_service.update_llm_dynamic(llm_id, payload.candidate_id, payload.job_id, db)
#         return {
#             "status": "updated",
#             "llm_id": updated_llm_id,
#             "message": "Variables from SQL injected into prompt successfully."
#         }
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         logger.error("Error updating Retell LLM dynamically: %s", e)
#         raise HTTPException(status_code=500, detail=str(e))


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
            # Remove all spaces and special characters, keep '+' and digits
            cleaned = "".join(c for c in num if c.isdigit() or c == "+")
            
            if cleaned.startswith("+"):
                return cleaned
            if len(cleaned) == 10 and cleaned.isdigit():
                return f"+91{cleaned}"
            return f"+{cleaned}"

        if payload.candidate_id and payload.job_id:
            # Check if Candidate and Job exist
            candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == payload.candidate_id).first()
            job = db.query(Job).filter(Job.s3_job_id == payload.job_id).first()

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
        
        # SAVE INITIAL CALL TO DB SO MATCHING SERVICE CAN SEE IT AS LATEST
        try:
            new_call_record = InterviewCall(
                call_id=call.call_id,
                agent_id=call.agent_id,
                call_status=call.call_status,
                candidate_id=payload.candidate_id if payload.candidate_id != "string" else None,
                job_id=payload.job_id if payload.job_id != "string" else None,
                from_number=from_number,
                to_number=to_number,
                direction="outbound",
                metadata_json=enhanced_metadata
            )
            db.add(new_call_record)
            db.commit()
            logger.info(f"Initialized call record in DB for call_id: {call.call_id}")
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not initialize call record in DB: {e}. It will be saved later during get-call/webhook.")

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
@router.get("/get-call/{call_id}", response_model=InterviewCallSchema)
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

        # Re-fetch from DB to get the populated relationships
        final_call = db.query(InterviewCall).filter(InterviewCall.call_id == call.call_id).first()
        if final_call.candidate: final_call.candidate_name = final_call.candidate.full_name
        if final_call.job: final_call.job_title = final_call.job.title

        return final_call

    except Exception as e:
        logger.error("Error getting/storing call: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# # ── 6. Update Call Metadata ───────────────────────────────────────────────────
# @router.patch("/update-call/{call_id}")
# def update_call(call_id: str, metadata: dict):
#     """
#     Updates the metadata of a call.
#     """
#     try:
#         call = retell_service.update_call(call_id, metadata)
#         return {"status": "updated", "call_id": call.call_id}
#     except Exception as e:
#         logger.error("Error updating call: %s", e)
#         raise HTTPException(status_code=500, detail=str(e))


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
            cleaned = "".join(c for c in num if c.isdigit() or c == "+")
            if cleaned.startswith("+"): return cleaned
            if len(cleaned) == 10 and cleaned.isdigit(): return f"+91{cleaned}"
            return f"+{cleaned}"

        from_number = format_phone(payload_from or os.getenv("RETELL_PHONE_NUMBER"))
        if not from_number:
            raise HTTPException(status_code=400, detail="from_number is required. Provide it or set RETELL_PHONE_NUMBER in .env")

        agent_id = payload_agent or os.getenv("RETELL_AGENT_ID")

        job = db.query(Job).filter(Job.s3_job_id == payload.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {payload.job_id} not found")

        candidates = db.query(Candidate).filter(Candidate.s3_candidate_id.in_(payload.candidate_ids)).all()
        if not candidates:
            raise HTTPException(status_code=404, detail="No matching candidates found from the provided list")

        tasks = []
        for candidate in candidates:
            if not candidate.phone_number:
                logger.warning(f"Skipping Candidate {candidate.s3_candidate_id} as they lack a phone number")
                continue

            dynamic_vars = retell_service.get_dynamic_variables(candidate, job)
            
            tasks.append({
                "to_number": format_phone(candidate.phone_number),
                "retell_llm_dynamic_variables": dynamic_vars,
                "override_agent_id": agent_id,
                "metadata": {
                    "candidate_id": candidate.s3_candidate_id,
                    "job_id": job.s3_job_id
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
@router.get("/calls", response_model=List[InterviewCallSchema])
def list_all_calls(
    candidate_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lists all interview calls from the database with optional filters.
    """
    query = db.query(InterviewCall)
    if candidate_id:
        query = query.filter(InterviewCall.candidate_id == candidate_id)
    if job_id:
        query = query.filter(InterviewCall.job_id == job_id)
    
    calls = query.order_by(InterviewCall.created_at.desc()).all()
    for c in calls:
        if c.candidate: c.candidate_name = c.candidate.full_name
        if c.job: c.job_title = c.job.title
    return calls


