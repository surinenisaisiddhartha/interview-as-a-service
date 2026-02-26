import json
import logging
from api.api_client import APIClient
from services.response_saver import ResponseSaver
from prompts.resume_prompt import ResumePrompt
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeParser:
    """
    Orchestrates the resume parsing process.
    """
    
    def __init__(self):
        self.api_client = APIClient()
        self.output_dir = os.path.join(os.getcwd(), 'resume_outputs')

    def parse(self, resume_text: str) -> dict:
        """
        Parses resume text into structured JSON.
        
        Args:
            resume_text (str): The raw text of the resume.
            
        Returns:
            dict: The structured JSON data.
        """
        if not resume_text:
            logger.error("Empty resume text provided.")
            return {}

        logger.info("Starting resume parsing...")
        
        # Prepare prompts
        system_msg = ResumePrompt.SYSTEM_PROMPT
        user_msg = ResumePrompt.format_usage(resume_text)
        
        # Call LLM
        response_data = self.api_client.generate_content(system_msg, user_msg)
        
        extracted_data = {}
        
        if isinstance(response_data, dict):
             extracted_data = response_data
        elif isinstance(response_data, str):
             # Try to parse string to json if api client returned string (though it should return dict)
             try:
                 extracted_data = json.loads(response_data)
             except json.JSONDecodeError:
                 logger.error("Failed to decode LLM response string to JSON.")
                 return {}

        if extracted_data:
            # Save the result
            saved_path = ResponseSaver.save_json(extracted_data, self.output_dir, "resume_parsed")
            logger.info(f"Resume parsed and saved to: {saved_path}")
            return extracted_data
        else:
            logger.error("Resume parsing failed or returned empty data.")
            return {}
