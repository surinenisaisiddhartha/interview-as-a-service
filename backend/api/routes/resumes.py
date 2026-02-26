"""Resume parsing endpoint."""

from fastapi import APIRouter, UploadFile, File, HTTPException

from log import log_tool
from application.services.parse_resume_service import ParseResumeService

router = APIRouter(prefix="/parse-resume", tags=["Resumes"])

_parse_resume_service = ParseResumeService()


@router.post("", response_model=None)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a resume file (PDF or TXT). Saves candidate to PostgreSQL.
    Matching is triggered when a JD is uploaded (job vs all candidates).
    """
    if not file.filename or not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Upload .pdf or .txt"
        )

    try:
        content = await file.read()
        result = _parse_resume_service.run(content, file.filename)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        log_tool.log_exception("Error processing resume", e)
        raise HTTPException(status_code=500, detail=str(e))
