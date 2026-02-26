import json
import os

from dotenv import load_dotenv
import google.generativeai as genai

from log import log_tool

load_dotenv()


class GeminiClient:
    """
    Client for interacting with Google's Gemini LLM.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            log_tool.log_error("GEMINI_API_KEY environment variable is missing.")
            raise ValueError("Use .env file or export GEMINI_API_KEY to proceed.")

        genai.configure(api_key=self.api_key)
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
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt,
            )
            try:
                response = model.generate_content(
                    user_prompt,
                    generation_config={"response_mime_type": "application/json"},
                )
            except Exception as e:
                if "429" in str(e) or "Quota exceeded" in str(e):
                    log_tool.log_warning(
                        "Rate limit hit for model %s. You might be on a free tier." % self.model_name
                    )
                raise

            response_text = response.text
            json_text = self._strip_markdown_fences(response_text)
            return json.loads(json_text)

        except Exception as e:
            log_tool.log_error("Gemini API Error: %s" % e)
            if "429" in str(e):
                return {
                    "error": "Rate limit exceeded. Please try again in a minute or switch to a faster model like gemini-1.5-flash."
                }
            return {}

    @staticmethod
    def _strip_markdown_fences(json_string: str) -> str:
        if json_string.strip().startswith("```json"):
            json_string = json_string.strip().replace("```json", "", 1)
        if json_string.strip().startswith("```"):
            json_string = json_string.strip().replace("```", "", 1)
        if json_string.strip().endswith("```"):
            json_string = json_string.strip().rstrip("`").strip()
        return json_string.strip()
