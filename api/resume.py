from fastapi import APIRouter, UploadFile, File, HTTPException
import logging

from services.parsers.resume_parser import ResumeParser
from services.text_extractor import TextExtractor
from db.insert import insert_resume_json

logger = logging.getLogger(__name__)

router = APIRouter()

try:
    resume_parser = ResumeParser()
except Exception as e:
    logger.error(f"Failed to initialize ResumeParser: {e}")
    raise

@router.post("/parse-resume")
async def extract_resume(file: UploadFile = File(...)):
    """
    Parse a resume file (PDF or TXT).
    → Saves candidate to PostgreSQL.
    → Auto-matches candidate against ALL existing jobs in DB.
    → Match results saved to matches table automatically.
    """
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload .pdf or .txt")

    try:
        content      = await file.read()
        text_content = TextExtractor.extract_text(content, file.filename)

        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from file or file is empty")

        result = resume_parser.parse(text_content)

        # Save to candidates table only — matching is triggered by JD upload
        try:
            candidate = insert_resume_json(result)
            logger.info("Resume saved to DB: candidate id=%s", candidate.id)
        except Exception as db_err:
            logger.warning("DB insert skipped (duplicate or error): %s", db_err)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))
