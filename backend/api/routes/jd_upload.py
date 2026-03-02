"""JD upload — on upload, create JD workspace (jd_id + folders) and store the file."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from log import log_tool
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["JD Upload"])

_storage = TenantStorageService()


@router.post("/{company_id}/users/{user_id}/jds/upload")
async def upload_jd(
    company_id: str,
    user_id: str,
    file: UploadFile = File(...),
    role: str = Form(..., description="Job role/title, e.g. 'Backend Engineer' — used for folder name"),
):
    """
    Upload a job description file. Creates the JD workspace (jd_id + resumes/, parsed/, embeddings/)
    and stores the file in one step. No separate JD creation endpoint needed.
    """
    if not file.filename or not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload .pdf or .txt",
        )
    try:
        # Create JD workspace (jd_id + folder structure)
        jd_id = _storage.create_jd_workspace(
            company_id=company_id,
            user_id=user_id,
            role=role,
        )
        # Upload the JD file into that workspace
        content = await file.read()
        content_type = file.content_type or "application/octet-stream"
        s3_key = (
            f"companies/{company_id}/users/{user_id}/jds/{jd_id}/"
            f"jd_{file.filename.replace(' ', '_')}"
        )
        _storage.upload_file(content, s3_key, content_type)
        return {
            "jd_id": jd_id,
            "s3_key": s3_key,
            "filename": file.filename,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_tool.log_exception("JD upload failed", e)
        raise HTTPException(status_code=500, detail=str(e))
