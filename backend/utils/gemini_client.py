import json
import os

from dotenv import load_dotenv
from google import genai

from log import log_tool

load_dotenv()


class GeminiClient:
    """
    Client for interacting with Google's Gemini LLM using the new google-genai SDK.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            log_tool.log_error("API key for Gemini is missing.")
            raise ValueError("Use .env file or export GEMINI_API_KEY/GOOGLE_API_KEY to proceed.")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
        log_tool.log_info("Using Gemini Model: %s" % self.model_name)

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Sends a request to Gemini and returns the parsed JSON response.

        Args:
            system_prompt: High-level instructions (e.g., "You are a parser...")
            user_prompt: The specific content to process.

        Returns:
            dict: Parsed JSON data. Empty dict on error or rate limit.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config={
                    "system_instruction": system_prompt,
                    "response_mime_type": "application/json",
                },
            )

            response_text = response.text
            json_text = self._strip_markdown_fences(response_text)
            return json.loads(json_text)

        except Exception as e:
            log_tool.log_error("Gemini API Error: %s" % e)
            if "429" in str(e) or "Quota exceeded" in str(e):
                log_tool.log_warning(
                    "Rate limit hit for model %s. You might be on a free tier." % self.model_name
                )
                return {
                    "error": "Rate limit exceeded. Please try again in a minute or switch to a faster model like gemini-1.5-flash."
                }
            return {}

    @staticmethod
    def _strip_markdown_fences(json_string: str) -> str:
        if json_string.strip().startswith("```json"):
            json_string = json_string.strip().replace("```json", "", 1)
        elif json_string.strip().startswith("```"):
            json_string = json_string.strip().replace("```", "", 1)
        
        if json_string.strip().endswith("```"):
            json_string = json_string.strip().rstrip("`").strip()
        return json_string.strip()

    def list_available_models(self) -> list[str]:
        """
        Lists all available Gemini models.
        """
        log_tool.log_info("Listing available Gemini models...")
        available_models = []
        try:
            for model in self.client.models.list():
                available_models.append(model.name)
            return available_models
        except Exception as e:
            log_tool.log_error(f"Error listing models: {e}")
            return []

