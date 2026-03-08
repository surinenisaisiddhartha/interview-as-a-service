import os
import logging
from retell import Retell
from db.models import Candidate, Job
from sqlalchemy.orm import Session
from prompts.retell_prompt import RETELL_INTERVIEW_PROMPT_TEMPLATE
from schemas import RETELL_POST_CALL_ANALYSIS_CONFIG

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

        webhook_url = os.getenv("RETELL_WEBHOOK_URL")
        # Ensure it's None if empty string to avoid API errors
        if not webhook_url:
            webhook_url = None
        logger.info(f"Creating Retell Agent linked to LLM: {llm_id}")

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
                    webhook_url=webhook_url,
                    post_call_analysis_data=RETELL_POST_CALL_ANALYSIS_CONFIG
                )
                logger.info(f"Successfully created Retell Agent: {agent.agent_id} with voice {voice_id}")
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
                            webhook_url=webhook_url,
                            post_call_analysis_data=RETELL_POST_CALL_ANALYSIS_CONFIG
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
        logger.info("Creating dynamic Retell LLM with base prompt template...")

        try:
            llm = self.client.llm.create(
                model="gemini-2.5-flash",
                begin_message="Hi {{candidate_name}}, this is calling from {{company_name}} regarding the {{job_title}} position. Am I speaking with {{candidate_name}}? Is now a good time for a quick 5-minute chat?",
                general_prompt=prompt.strip(),
                general_tools=[
                    {
                        "type": "end_call",
                        "name": "end_call",
                        "description": "End the interview call after all questions are complete."
                    }
                ]
            )
            logger.info(f"Successfully created Retell LLM: {llm.llm_id}")
            return llm.llm_id
        except Exception as e:
            logger.error("Error creating Retell LLM dynamically: %s", e)
            raise

    def get_dynamic_variables(self, candidate: Candidate, job: Job) -> dict:
        logger.info(f"Generating dynamic variables for Candidate: {candidate.id}, Job: {job.id}")
        
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

        logger.info(f"Dynamic variables generated successfully for {candidate_name}")

        return {
            "company_name": company_name,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "jd_summary": jd_summary,
            "resume_summary": resume_summary,
            "candidate_skills": candidate_skills_str,
            "candidate_experience": experience_str,
            "candidate_projects": projects_str,
            "job_skills": job_skills_str
        }

    def update_llm_dynamic(self, llm_id: str, candidate_id: int, job_id: int, db: Session):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
            
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()

        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found")
        if not job:
            raise ValueError(f"Job {job_id} not found")

        # Get variables
        vars = self.get_dynamic_variables(candidate, job)

        # Replace in base prompt
        new_prompt = RETELL_INTERVIEW_PROMPT_TEMPLATE
        for key, value in vars.items():
            new_prompt = new_prompt.replace(f"{{{{{key}}}}}", str(value))

        # First Step dynamic intro (Begin Message)
        begin_message = f"Hi {vars['candidate_name']}, this is calling from {vars['company_name']} regarding the {vars['job_title']} position. Am I speaking with {vars['candidate_name']}? Is now a good time for a quick 5-minute chat?"

        try:
            updated_llm = self.client.llm.update(
                llm_id=llm_id,
                model="gemini-2.5-flash",
                general_prompt=new_prompt.strip(),
                begin_message=begin_message
            )
            return updated_llm.llm_id
        except Exception as e:
            logger.error("Error updating Retell LLM dynamically: %s", e)
            raise

    def create_phone_call(self, from_number: str, to_number: str, agent_id: str = None, metadata: dict = None, retell_llm_dynamic_variables: dict = None):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        try:
            call = self.client.call.create_phone_call(
                from_number=from_number,
                to_number=to_number,
                override_agent_id=agent_id,
                metadata=metadata,
                retell_llm_dynamic_variables=retell_llm_dynamic_variables
            )
            logger.info(f"Successfully created phone call: {call.call_id} to {to_number}")
            return call
        except Exception as e:
            logger.error("Error creating Retell Phone Call: %s", e)
            raise

    def get_call(self, call_id: str):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        try:
            call = self.client.call.retrieve(call_id)
            return call
        except Exception as e:
            logger.error("Error retrieving Retell Call details: %s", e)
            raise

    def update_call(self, call_id: str, metadata: dict):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        try:
            # Note: PATCH /v2/update-call primarily updates metadata or data_storage_setting
            call = self.client.call.update(call_id, metadata=metadata)
            return call
        except Exception as e:
            logger.error("Error updating Retell Call: %s", e)
            raise

    def delete_call(self, call_id: str):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        try:
            self.client.call.delete(call_id)
            return True
        except Exception as e:
            logger.error("Error deleting Retell Call: %s", e)
            raise

    def create_batch_call(self, from_number: str, tasks: list):
        if not self.client:
            raise ValueError("RETELL_API_KEY is not set in .env")
        
        try:
            # Tasks should be a list of objects with to_number, optional metadata, etc.
            batch_call = self.client.batch_call.create_batch_call(
                from_number=from_number,
                tasks=tasks
            )
            logger.info(f"Successfully triggered Batch Call with {len(tasks)} tasks")
            return batch_call
        except Exception as e:
            logger.error("Error creating Retell Batch Call: %s", e)
            raise
