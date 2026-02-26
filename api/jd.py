from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import logging

from services.parsers.jd_parser import JDParser
from services.match_engine.matcher import Matcher
from services.text_extractor import TextExtractor
from db.insert import insert_job_json

logger = logging.getLogger(__name__)

router = APIRouter()

try:
    jd_parser = JDParser()
    matcher   = Matcher()
except Exception as e:
    logger.error(f"Failed to initialize parsing or matching engines: {e}")
    raise

@router.post("/parse-jd")
async def extract_jd(
    file: UploadFile = File(...),
    company_name: str = Form(None),
):
    """
    Parse a job description file (PDF or TXT).
    → Saves job to PostgreSQL.
    → Auto-matches job against ALL existing candidates in DB.
    → Match results saved to matches table automatically.
    """
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload .pdf or .txt")

    try:
        content      = await file.read()
        text_content = TextExtractor.extract_text(content, file.filename)

        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from file or file is empty")

        result = jd_parser.parse(text_content)

        # Save to jobs table
        job = None
        try:
            job = insert_job_json(result, company_name=company_name)
            logger.info("JD saved to DB: job id=%s company=%s", job.id, company_name)
        except Exception as db_err:
            logger.warning("DB insert skipped (duplicate or error): %s", db_err)

        # Auto-match this job against all existing candidates in DB
        if job:
            try:
                matches = matcher.match_all_candidates_for_job(job.id)
                logger.info("Auto-matched job id=%s against %d candidate(s).", job.id, len(matches))
            except Exception as match_err:
                logger.warning("Auto-match skipped: %s", match_err)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))
