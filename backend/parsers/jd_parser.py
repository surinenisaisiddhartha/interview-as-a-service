import json
import os

from log import log_tool
from prompts.job_description_prompt import JDPrompt
from utils.gemini_client import GeminiClient
from utils.json_file_saver import JsonFileSaver


class JDParser:
    """Orchestrates the Job Description parsing process: prompt + LLM + optional save to disk."""

    def __init__(self):
        self.llm_client = GeminiClient()
        self.output_dir = os.path.join(os.getcwd(), "jd_outputs")

    def parse(self, jd_text: str) -> dict:
        """
        Parses job description text into structured JSON.

        Args:
            jd_text: The raw text of the JD.

        Returns:
            The structured JSON data (dict with "job" key), or empty dict on failure.
        """
        if not jd_text:
            log_tool.log_error("Empty JD text provided.")
            return {}

        log_tool.log_info("Starting JD parsing...")
        system_prompt = JDPrompt.SYSTEM_PROMPT
        user_prompt = JDPrompt.format_user_message(jd_text)
        llm_response = self.llm_client.generate_json(system_prompt, user_prompt)

        parsed_jd = {}
        if isinstance(llm_response, dict):
            parsed_jd = llm_response
        elif isinstance(llm_response, str):
            try:
                parsed_jd = json.loads(llm_response)
            except json.JSONDecodeError:
                log_tool.log_error("Failed to decode LLM response string to JSON.")
                return {}

        if parsed_jd:
            saved_path = JsonFileSaver.save_json(parsed_jd, self.output_dir, "jd_parsed")
            log_tool.log_info("JD parsed and saved to: %s" % saved_path)
            return parsed_jd
        log_tool.log_error("JD parsing failed or returned empty data.")
        return {}
