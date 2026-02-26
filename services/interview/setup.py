"""
interview/setup.py
==================
One-time setup: Creates a Retell LLM, an Interview Agent, and purchases
a phone number — everything done programmatically via the Retell API.

Run once:
    python -m interview.setup

Outputs (save these into your .env):
    RETELL_LLM_ID=...
    RETELL_AGENT_ID=...
    RETELL_PHONE_NUMBER=...
"""

import os
import logging
from retell import Retell
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_interview_llm(client: Retell) -> str:
    """
    Creates a Retell LLM with a professional interview prompt.
    Uses dynamic variables injected per-call:
        {{candidate_name}}, {{job_title}}, {{primary_skills}},
        {{matching_percent}}, {{required_experience}}, {{company_name}}
    Returns the llm_id.
    """
    llm = client.llm.create(
        model="gpt-4o",
        begin_message=(
            "Hello {{candidate_name}}, welcome! "
            "I'm calling from {{company_name}} regarding the {{job_title}} position. "
            "I'll be conducting a brief technical interview today. Are you ready to begin?"
        ),
        general_prompt="""
You are a professional technical interviewer representing {{company_name}}.
You are interviewing {{candidate_name}} for the {{job_title}} position.

Candidate profile:
- Primary Skills: {{primary_skills}}
- Resume-to-Job Match: {{matching_percent}}%
- Required Experience: {{required_experience}} years

Interview Guidelines:
1. Start with a brief introduction and confirm the candidate is ready.
2. Ask 5–7 relevant technical questions based on their primary skills and the job role.
3. Ask at least one question about their relevant project experience.
4. Ask one behavioral/situational question (e.g., "Tell me about a challenging project...").
5. Ask about their availability and expected timeline to join.
6. Give the candidate a chance to ask questions at the end.
7. End professionally, thank them, and let them know the next steps.

Tone: Professional, friendly, and conversational. Do NOT read from a script.
Adjust question depth based on the candidate's responses.
If the candidate seems confused, rephrase or simplify.
""",
        general_tools=[
            {
                "type": "end_call",
                "name": "end_call",
                "description": (
                    "End the interview call after all questions are complete "
                    "and the candidate has had a chance to ask their questions."
                ),
            }
        ],
    )
    logger.info("Created Retell LLM: llm_id=%s", llm.llm_id)
    return llm.llm_id


def create_interview_agent(client: Retell, llm_id: str, webhook_url: str) -> str:
    """
    Creates a Retell AI voice agent that uses the LLM above.
    Configures post-call analysis to extract structured interview results.
    Returns the agent_id.
    """
    agent = client.agent.create(
        agent_name="AI Recruitment Interview Agent",
        voice_id="11labs-Adrian",          # Professional male voice; change as needed
        language="en-US",
        response_engine={"type": "retell-llm", "llm_id": llm_id},
        webhook_url=webhook_url,
        # Enable post-call analysis
        post_call_analysis_data=[
            {
                "type": "string",
                "name": "interview_score",
                "description": (
                    "Rate the candidate's overall interview performance on a scale of 1–10 "
                    "based on their technical knowledge, communication, and problem-solving."
                ),
            },
            {
                "type": "string",
                "name": "technical_assessment",
                "description": (
                    "Brief assessment of the candidate's technical skills demonstrated "
                    "during the interview. Mention specific strengths and gaps."
                ),
            },
            {
                "type": "string",
                "name": "communication_quality",
                "description": (
                    "Assess the candidate's communication skills: clarity, confidence, "
                    "and ability to explain technical concepts."
                ),
            },
            {
                "type": "string",
                "name": "strengths",
                "description": "Top 3 strengths demonstrated during the interview.",
            },
            {
                "type": "string",
                "name": "weaknesses",
                "description": "Top 2–3 areas where the candidate needs improvement.",
            },
            {
                "type": "boolean",
                "name": "recommend_hire",
                "description": (
                    "True if the candidate is recommended for the next round based on "
                    "their interview performance. False otherwise."
                ),
            },
            {
                "type": "string",
                "name": "interview_outcome",
                "description": (
                    "One of: 'Selected', 'On Hold', 'Rejected'. "
                    "Selected = strong performance. On Hold = borderline. Rejected = poor fit."
                ),
            },
        ],
        analysis_summary_prompt=(
            "Summarize this technical interview in 3–5 sentences. "
            "Include the candidate's name, position applied for, key technical strengths, "
            "notable weaknesses, and your overall hiring recommendation."
        ),
        # Interruption sensitivity (0.0 = never interrupted, 1.0 = easily interrupted)
        interruption_sensitivity=0.8,
        # Max call duration in seconds (30 minutes)
        max_call_duration_ms=1800000,
    )
    logger.info("Created Retell Agent: agent_id=%s", agent.agent_id)
    return agent.agent_id


def purchase_phone_number(client: Retell, agent_id: str) -> str:
    """
    Purchases a Retell phone number and binds it to the interview agent.
    Returns the phone number string.
    """
    phone = client.phone_number.create(
        outbound_agent_id=agent_id,
        # area_code=415  # optional: specify US area code
    )
    logger.info("Purchased phone number: %s", phone.phone_number)
    return phone.phone_number


def run_setup():
    """
    Idempotent setup — only creates resources that don't exist yet.
    Safe to re-run anytime. Checks .env before creating anything.
    """
    api_key = os.getenv("RETELL_API_KEY")
    if not api_key:
        raise ValueError(
            "RETELL_API_KEY is not set in .env. "
            "Get your key from https://dashboard.retellai.com"
        )

    webhook_url = os.getenv("RETELL_WEBHOOK_URL", "")
    if not webhook_url:
        logger.warning(
            "RETELL_WEBHOOK_URL is not set. You MUST set this before going live. "
            "Use ngrok for local testing: ngrok http 8000"
        )

    client = Retell(api_key=api_key)

    print("\n" + "=" * 60)
    print("  Retell AI Interview Setup")
    print("=" * 60)

    # ── Step 1: LLM ───────────────────────────────────────────────
    existing_llm_id = os.getenv("RETELL_LLM_ID", "")
    if existing_llm_id:
        print(f"\n[1/3] LLM already exists — skipping creation.")
        print(f"      ✓ RETELL_LLM_ID={existing_llm_id}")
        llm_id = existing_llm_id
    else:
        print("\n[1/3] Creating Interview LLM...")
        llm_id = create_interview_llm(client)
        print(f"      ✓ RETELL_LLM_ID={llm_id}")

    # ── Step 2: Agent ─────────────────────────────────────────────
    existing_agent_id = os.getenv("RETELL_AGENT_ID", "")
    if existing_agent_id:
        print(f"\n[2/3] Agent already exists — skipping creation.")
        print(f"      ✓ RETELL_AGENT_ID={existing_agent_id}")
        agent_id = existing_agent_id
        # Still update the webhook URL in case it changed
        if webhook_url:
            client.agent.update(agent_id, webhook_url=webhook_url)
            print(f"      ↻ Webhook URL updated: {webhook_url}")
    else:
        print("\n[2/3] Creating Interview Agent...")
        agent_id = create_interview_agent(client, llm_id, webhook_url)
        print(f"      ✓ RETELL_AGENT_ID={agent_id}")

    # ── Step 3: Phone Number ──────────────────────────────────────
    existing_phone = os.getenv("RETELL_PHONE_NUMBER", "")
    if existing_phone and not existing_phone.startswith("+1xxxxxxxxxx"):
        print(f"\n[3/3] Phone number already exists — skipping purchase.")
        print(f"      ✓ RETELL_PHONE_NUMBER={existing_phone}")
        phone_number = existing_phone
    else:
        print("\n[3/3] Purchasing Phone Number...")
        try:
            phone_number = purchase_phone_number(client, agent_id)
            print(f"      ✓ RETELL_PHONE_NUMBER={phone_number}")
        except Exception as e:
            phone_number = ""
            logger.warning("Could not purchase phone number (may need billing): %s", e)

    print("\n" + "=" * 60)
    print("  Add these to your .env file (if not already set):")
    print("=" * 60)
    print(f"\nRETELL_LLM_ID={llm_id}")
    print(f"RETELL_AGENT_ID={agent_id}")
    if phone_number:
        print(f"RETELL_PHONE_NUMBER={phone_number}")
    print("\nSetup complete!\n")

    return {
        "llm_id":       llm_id,
        "agent_id":     agent_id,
        "phone_number": phone_number,
    }


if __name__ == "__main__":
    run_setup()
