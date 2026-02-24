import google.generativeai as genai
import os
import json
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class APIClient:
    """
    Client for interacting with Google's Gemini LLM.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.error("GEMINI_API_KEY environment variable is missing.")
            raise ValueError("Use .env file or export GEMINI_API_KEY to proceed.")
        
        genai.configure(api_key=self.api_key)
        # Load model name from .env, default to gemini-1.5-flash if not set
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
        logger.info(f"Using Gemini Model: {self.model_name}")

    def generate_content(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Sends a request to Gemini and returns the parsed JSON response.
        
        Args:
           system_prompt: High-level instructions (e.g., "You are a parser...")
           user_prompt: The specific content to process.
        Returns:
           dict: Parsed JSON data.
        """
        try:
            # Create a model instance with system instruction
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt
            )
            
            # Request JSON response format specifically + User Prompt
            try:
                response = model.generate_content(
                    user_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
            except Exception as e:
                # Simple retry logic for checking if it's a quota issue usually handled by the caller, 
                # but let's log specifically.
                if "429" in str(e) or "Quota exceeded" in str(e):
                    logger.warning(f"Rate limit hit for model {self.model_name}. You might be on a free tier.")
                raise e
            
            raw_text = response.text
            
            # Clean up potential markdown if the model wraps output (sometimes happens even with JSON mode)
            cleaned_text = self._clean_json_string(raw_text)
            
            return json.loads(cleaned_text)

        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            if "429" in str(e):
                 return {"error": "Rate limit exceeded. Please try again in a minute or switch to a faster model like gemini-1.5-flash."}
            return {}

    @staticmethod
    def _clean_json_string(json_string: str) -> str:
        if json_string.strip().startswith("```json"):
            json_string = json_string.strip().replace("```json", "", 1)
        if json_string.strip().startswith("```"):
            json_string = json_string.strip().replace("```", "", 1)
        if json_string.strip().endswith("```"):
            json_string = json_string.strip().replace("```", "", 1)
        return json_string.strip()


