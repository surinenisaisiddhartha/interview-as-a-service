import json
import logging
from utils.api_client import APIClient
from utils.response_saver import ResponseSaver
from prompts.jd_prompt import JDPrompt
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JDParser:
    """
    Orchestrates the Job Description parsing process.
    """
    
    def __init__(self):
        self.api_client = APIClient()
        self.output_dir = os.path.join(os.getcwd(), 'jd_outputs')

    def parse(self, jd_text: str) -> dict:
        """
        Parses job description text into structured JSON.
        
        Args:
            jd_text (str): The raw text of the JD.
            
        Returns:
            dict: The structured JSON data.
        """
        if not jd_text:
            logger.error("Empty JD text provided.")
            return {}

        logger.info("Starting JD parsing...")
        
        # Prepare prompts
        system_msg = JDPrompt.SYSTEM_PROMPT
        user_msg = JDPrompt.format_usage(jd_text)
        
        # Call LLM
        response_data = self.api_client.generate_content(system_msg, user_msg)
        
        extracted_data = {}
        
        if isinstance(response_data, dict):
             extracted_data = response_data
        elif isinstance(response_data, str):
             try:
                 extracted_data = json.loads(response_data)
             except json.JSONDecodeError:
                 logger.error("Failed to decode LLM response string to JSON.")
                 return {}

        if extracted_data:
            # Save the result
            saved_path = ResponseSaver.save_json(extracted_data, self.output_dir, "jd_parsed")
            logger.info(f"JD parsed and saved to: {saved_path}")
            return extracted_data
        else:
            logger.error("JD parsing failed or returned empty data.")
            return {}
