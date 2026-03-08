from typing import Optional

from log import log_tool

from db.candidate_job_repository import save_job_from_jd
from parsers.jd_parser import JDParser
from utils.text_extractor import TextExtractor


class JDIngestService:
    """
    Lightweight JD ingestion service:
    - extract text from the uploaded JD file
    - parse it via the JDParser (Gemini)
    - persist the Job in the database
    - DOES NOT run any matching
    """

    def __init__(self) -> None:
        # Reuse the same helpers as ParseJDService but without matching.
        self._text_extractor = TextExtractor
        self._jd_parser = JDParser()

    def run(
        self,
        file_bytes: bytes,
        filename: str,
        company_name: Optional[str] = None,
        s3_link: Optional[str] = None,
        s3_job_id: Optional[str] = None,
    ) -> dict:
        """
        Parse JD from file content and save a Job row to the database.

        Args:
            file_bytes: Raw file content (PDF or TXT).
            filename: Original filename (used for format detection).
            company_name: Optional company name to store with the job.
            s3_link: Optional S3 URL where the file is stored.

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

        try:
            job = save_job_from_jd(result, company_name=company_name, s3_link=s3_link, s3_job_id=s3_job_id)
            log_tool.log_info("💼 JD ingested to DB: job id=%s company=%s" % (job.s3_job_id, company_name))
        except Exception as insert_error:
            # We intentionally do not re-raise here: parsing succeeded, but DB insert may be a duplicate, etc.
            log_tool.log_warning("⚠️ JD ingest DB insert skipped (duplicate or error): %s" % insert_error)

        return result
