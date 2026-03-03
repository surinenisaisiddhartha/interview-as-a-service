"""Resume upload — upload resume linked to a specific JD."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from log import log_tool
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Resume Upload"])

_storage = TenantStorageService()


@router.post("/{company_id}/users/{user_id}/jds/{jd_id}/resumes")
async def upload_resume(
    company_id: str,
    user_id: str,
    jd_id: str,
    file: UploadFile = File(...),
):
    """
    Upload a resume for a candidate under a specific JD. Generates unique path and uploads to S3.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload .pdf or .txt",
        )
    try:
        content = await file.read()
        candidate_id, s3_key = _storage.generate_resume_upload_path(
            company_id=company_id,
            user_id=user_id,
            jd_id=jd_id,
            original_filename=file.filename,
        )
        content_type = file.content_type or "application/octet-stream"
        _storage.upload_file(content, s3_key, content_type)
        return {
            "candidate_id": candidate_id,
            "s3_key": s3_key,
            "filename": file.filename,
        }
    except Exception as e:
        log_tool.log_exception("Resume upload failed", e)
        raise HTTPException(status_code=500, detail=str(e))
