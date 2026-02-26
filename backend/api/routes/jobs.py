"""Job description parsing endpoint."""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from log import log_tool
from application.services.parse_jd_service import ParseJDService

router = APIRouter(prefix="/parse-jd", tags=["Jobs"])

_parse_jd_service = ParseJDService()


@router.post("", response_model=None)
async def parse_jd(
    file: UploadFile = File(...),
    company_name: str = Form(None),
):
    """
    Parse a job description file (PDF or TXT). Saves job to PostgreSQL and
    auto-matches this job against all existing candidates (results saved to matches table).
    """
    if not file.filename or not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Upload .pdf or .txt"
        )

    try:
        content = await file.read()
        result = _parse_jd_service.run(
            content, file.filename, company_name=company_name
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        log_tool.log_exception("Error processing JD", e)
        raise HTTPException(status_code=500, detail=str(e))
