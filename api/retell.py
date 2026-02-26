from fastapi import APIRouter, HTTPException
import logging
import os

from retell import Retell
from services.interview.setup import create_interview_llm, create_interview_agent

logger = logging.getLogger(__name__)

router = APIRouter()

# ── 1. Create Retell LLM (prompt config) ─────────────────────────────────────
@router.post("/create-llm")
def retell_create_llm():
    """
    Creates a Retell LLM configuration with the interview prompt.
    Uses GPT-4o as the underlying model.

    Returns:
        llm_id — save this in your .env as RETELL_LLM_ID
    """
    api_key = os.getenv("RETELL_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="RETELL_API_KEY is not set in .env")

    try:
        client = Retell(api_key=api_key)
        llm_id = create_interview_llm(client)
        return {
            "status":  "created",
            "llm_id":  llm_id,
            "message": f"Save this in your .env → RETELL_LLM_ID={llm_id}",
        }
    except Exception as e:
        logger.error("Error creating Retell LLM: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Create Retell Agent ────────────────────────────────────────────────────
@router.post("/create-agent")
def retell_create_agent(llm_id: str):
    """
    Creates a Retell voice agent linked to the given LLM.

    Query param:
        llm_id — the RETELL_LLM_ID returned from /create-llm

    Returns:
        agent_id — save this in your .env as RETELL_AGENT_ID
    """
    api_key     = os.getenv("RETELL_API_KEY", "")
    webhook_url = os.getenv("RETELL_WEBHOOK_URL", "")

    if not api_key:
        raise HTTPException(status_code=400, detail="RETELL_API_KEY is not set in .env")
    if not llm_id:
        raise HTTPException(status_code=400, detail="llm_id is required")

    try:
        client   = Retell(api_key=api_key)
        agent_id = create_interview_agent(client, llm_id, webhook_url)
        return {
            "status":   "created",
            "agent_id": agent_id,
            "message":  f"Save this in your .env → RETELL_AGENT_ID={agent_id}",
        }
    except Exception as e:
        logger.error("Error creating Retell Agent: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
