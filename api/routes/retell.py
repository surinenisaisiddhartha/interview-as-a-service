from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.orm import Session
from db.database import SessionLocal
from application.services.retell_service import RetellService

from application.schemas import UpdateLlmPayload, RetellAgentResponse, RetellLlmResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/retell", tags=["Retell AI"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

retell_service = RetellService()


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
        return {
            "status": "created",
            "agent_id": agent_id,
            "message": f"Save this in your .env → RETELL_AGENT_ID={agent_id}",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error creating Retell Agent: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Create Retell LLM w/ Dynamic Variables Template ────────────────────────
@router.post("/create-retell-llm", response_model=RetellLlmResponse)
def retell_create_llm_dynamic():
    """
    Creates a Retell LLM configuration with a template prompt that includes dynamic variables.
    """
    try:
        llm_id = retell_service.create_llm_dynamic()
        return {
            "status":  "created",
            "llm_id":  llm_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error creating Retell LLM dynamically: %s", e)
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
