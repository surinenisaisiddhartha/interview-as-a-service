import os
import logging
from retell import Retell
from db.models import Candidate, Job
from sqlalchemy.orm import Session
from prompts.retell_prompt import RETELL_INTERVIEW_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

class RetellService:
    def __init__(self):
        self.api_key = os.getenv("RETELL_API_KEY", "")
        if self.api_key:
            self.client = Retell(api_key=self.api_key)
        else:
            self.client = None

    def create_agent(self, llm_id: str):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        if not llm_id:
            raise ValueError("llm_id is required")

        webhook_url = os.getenv("RETELL_WEBHOOK_URL", "")

        try:
            # We try a common default voice ID, but if it fails, we fetch the first available one
            voice_id = "11labs-Adrian" 
            
            try:
                agent = self.client.agent.create(
                    agent_name="Interview Agent",
                    voice_id=voice_id,
                    response_engine={
                        "type": "retell-llm",
                        "llm_id": llm_id
                    },
                    webhook_url=webhook_url
                )
                return agent.agent_id
            except Exception as voice_err:
                if "not found from voice" in str(voice_err).lower():
                    logger.warning(f"Default voice {voice_id} not found. Attempting to fetch first available voice...")
                    voices = self.client.voice.list()
                    if voices:
                        first_voice_id = voices[0].voice_id
                        logger.info(f"Using first available voice: {first_voice_id}")
                        agent = self.client.agent.create(
                            agent_name="Interview Agent",
                            voice_id=first_voice_id,
                            response_engine={
                                "type": "retell-llm",
                                "llm_id": llm_id
                            },
                            webhook_url=webhook_url
                        )
                        return agent.agent_id
                raise voice_err
        except Exception as e:
            logger.error("Error creating Retell Agent: %s", e)
            raise

    def create_llm_dynamic(self):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        # Use the prompt directly as requested
        prompt = RETELL_INTERVIEW_PROMPT_TEMPLATE

        try:
            llm = self.client.llm.create(
                model="gpt-4o",
                begin_message="Hello, welcome to the technical interview! Are you ready to begin?",
                general_prompt=prompt.strip(),
                general_tools=[
                    {
                        "type": "end_call",
                        "name": "end_call",
                        "description": "End the interview call after all questions are complete."
                    }
                ]
            )
            return llm.llm_id
        except Exception as e:
            logger.error("Error creating Retell LLM dynamically: %s", e)
            raise

    def update_llm_dynamic(self, llm_id: str, candidate_id: int, job_id: int, db: Session):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
            
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()

        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found")
        if not job:
            raise ValueError(f"Job {job_id} not found")

        # Basic Info
        company_name = job.company_name or "our company"
        candidate_name = candidate.full_name or "Candidate"
        job_title = job.title or "this position"

        # Summaries
        jd_summary = "Not specified"
        if job.summary:
            jd_summary = job.summary
        elif isinstance(job.raw_job_json, dict):
             jd_data = job.raw_job_json.get("job", {})
             jd_summary = jd_data.get("job_description_summary") or jd_data.get("description", "Not specified")
        
        resume_summary = "Not specified"
        if candidate.summary:
            resume_summary = candidate.summary
        elif isinstance(candidate.raw_resume_json, dict):
            res_data = candidate.raw_resume_json.get("candidate", {})
            resume_summary = res_data.get("summary") 
            
        if not resume_summary:
            designation = candidate.current_designation or "Professional"
            company = candidate.current_company or "their previous company"
            exp = f"{candidate.overall_experience_years} years" if candidate.overall_experience_years else "relevant"
            resume_summary = f"A {designation} with {exp} of experience at {company}."

        # Extract Candidate Skills
        candidate_skills_list = []
        if isinstance(candidate.skills, dict):
            for val in candidate.skills.values():
                if isinstance(val, list):
                    candidate_skills_list.extend(val)
        elif isinstance(candidate.skills, list):
            candidate_skills_list = candidate.skills

        candidate_skills_str = ", ".join([str(s) for s in candidate_skills_list]) if candidate_skills_list else "Not specified"
        
        # Extract Experience
        experience_str = str(candidate.overall_experience_years) if candidate.overall_experience_years is not None else "0"

        # Extract Projects
        projects_list = []
        if isinstance(candidate.projects, list):
            for p in candidate.projects:
                if isinstance(p, dict):
                    title = p.get("title") or p.get("name") or "Unnamed Project"
                    projects_list.append(title)
                elif isinstance(p, str):
                    projects_list.append(p)
        projects_str = ", ".join(projects_list) if projects_list else "No projects specified"

        # Extract Job Skills
        job_skills_list = job.required_skills if isinstance(job.required_skills, list) else []
        job_skills_str = ", ".join([str(s) for s in job_skills_list]) if job_skills_list else "Not specified"

        new_prompt = RETELL_INTERVIEW_PROMPT_TEMPLATE.replace(
            "{{company_name}}", company_name
        ).replace(
            "{{candidate_name}}", candidate_name
        ).replace(
            "{{job_title}}", job_title
        ).replace(
            "{{jd_summary}}", jd_summary
        ).replace(
            "{{resume_summary}}", resume_summary
        ).replace(
            "{{candidate_skills}}", candidate_skills_str
        ).replace(
            "{{candidate_experience}}", experience_str
        ).replace(
            "{{candidate_projects}}", projects_str
        ).replace(
            "{{job_skills}}", job_skills_str
        )

        # First Step dynamic intro (Begin Message)
        begin_message = f"Hi {candidate_name}, this is calling from {company_name} regarding the {job_title} position. Am I speaking with {candidate_name}? Is now a good time for a quick 5-minute chat?"

        try:
            updated_llm = self.client.llm.update(
                llm_id=llm_id,
                general_prompt=new_prompt.strip(),
                begin_message=begin_message
            )
            return updated_llm.llm_id
        except Exception as e:
            logger.error("Error updating Retell LLM dynamically: %s", e)
            raise
