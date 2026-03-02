import json
import os

from log import log_tool
from prompts.resume_prompt import ResumePrompt
from utils.gemini_client import GeminiClient
from utils.json_file_saver import JsonFileSaver


class ResumeParser:
    """Orchestrates the resume parsing process: prompt + LLM + optional save to disk."""

    def __init__(self):
        self.llm_client = GeminiClient()
        self.output_dir = os.path.join(os.getcwd(), "resume_outputs")

    def parse(self, resume_text: str) -> dict:
        """
        Parses resume text into structured JSON.

        Args:
            resume_text: The raw text of the resume.

        Returns:
            The structured JSON data (dict with "candidate" key), or empty dict on failure.
        """
        if not resume_text:
            log_tool.log_error("Empty resume text provided.")
            return {}

        log_tool.log_info("Starting resume parsing...")
        system_prompt = ResumePrompt.SYSTEM_PROMPT
        user_prompt = ResumePrompt.format_user_message(resume_text)
        llm_response = self.llm_client.generate_json(system_prompt, user_prompt)

        parsed_resume = {}
        if isinstance(llm_response, dict):
            parsed_resume = llm_response
        elif isinstance(llm_response, str):
            try:
                parsed_resume = json.loads(llm_response)
            except json.JSONDecodeError:
                log_tool.log_error("Failed to decode LLM response string to JSON.")
                return {}

        if parsed_resume:
            saved_path = JsonFileSaver.save_json(
                parsed_resume, self.output_dir, "resume_parsed"
            )
            log_tool.log_info("Resume parsed and saved to: %s" % saved_path)
            return parsed_resume
        log_tool.log_error("Resume parsing failed or returned empty data.")
        return {}
