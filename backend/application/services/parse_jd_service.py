"""
Parse JD use case: extract text from file → parse via LLM → save job to DB → auto-match all candidates.
"""

from typing import Optional

from log import log_tool

from db.candidate_job_repository import save_job_from_jd
from match_engine.candidate_job_matcher import Matcher
from parsers.jd_parser import JDParser
from utils.text_extractor import TextExtractor


class ParseJDService:
    """Orchestrates: file bytes → text → parsed JD JSON → persist job → match all candidates."""

    def __init__(self):
        self._text_extractor = TextExtractor
        self._jd_parser = JDParser()
        self._matcher = Matcher()

    def run(self, file_bytes: bytes, filename: str, company_name: Optional[str] = None, s3_link: Optional[str] = None) -> dict:
        """
        Parse JD from file content, save job to DB, and match against all candidates.

        Args:
            file_bytes: Raw file content (PDF or TXT).
            filename: Original filename (used for format detection).
            company_name: Optional company name to store with the job.
            s3_link: S3 URL where the file is stored.

        Returns:
            Parsed JD JSON (dict with "job" key).

        Raises:
            ValueError: If text extraction or parsing fails.
        """
        text_content = self._text_extractor.extract_text(file_bytes, filename)
        if not text_content:
            raise ValueError("Could not extract text from file or file is empty")

        result = self._jd_parser.parse(text_content)
        if not result:
            raise ValueError("JD parsing failed or returned empty data")

        job = None
        try:
            job = save_job_from_jd(result, company_name=company_name, s3_link=s3_link)
            log_tool.log_info("💼 JD saved to DB: job id=%s company=%s" % (job.id, company_name))
        except Exception as insert_error:
            log_tool.log_warning("⚠️ DB insert skipped (duplicate or error): %s" % insert_error)

        if job:
            try:
                matches = self._matcher.match_all_candidates_for_job(job.id)
                log_tool.log_info(
                    "📊 Auto-matched job id=%s against %d candidate(s)." % (job.id, len(matches))
                )
            except Exception as match_error:
                log_tool.log_warning("⚠️ Auto-match skipped: %s" % match_error)

        return result
