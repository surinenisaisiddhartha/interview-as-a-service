"""
Parse Resume use case: extract text from file → parse via LLM → save candidate to DB.
"""

from log import log_tool

from db.candidate_job_repository import save_candidate_from_resume
from parsers.resume_parser import ResumeParser
from utils.text_extractor import TextExtractor


class ParseResumeService:
    """Orchestrates: file bytes → text → parsed resume JSON → persist candidate."""

    def __init__(self):
        self._text_extractor = TextExtractor
        self._resume_parser = ResumeParser()

    def run(self, file_bytes: bytes, filename: str) -> dict:
        """
        Parse resume from file content and optionally save candidate to DB.

        Args:
            file_bytes: Raw file content (PDF or TXT).
            filename: Original filename (used for format detection).

        Returns:
            Parsed resume JSON (dict with "candidate" key).

        Raises:
            ValueError: If text extraction or parsing fails (empty or invalid).
        """
        text_content = self._text_extractor.extract_text(file_bytes, filename)
        if not text_content:
            raise ValueError("Could not extract text from file or file is empty")

        result = self._resume_parser.parse(text_content)
        if not result:
            raise ValueError("Resume parsing failed or returned empty data")

        try:
            candidate = save_candidate_from_resume(result)
            log_tool.log_info("Resume saved to DB: candidate id=%s" % candidate.id)
        except Exception as insert_error:
            log_tool.log_warning("DB insert skipped (duplicate or error): %s" % insert_error)

        return result
