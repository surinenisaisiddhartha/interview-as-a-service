# """Resume upload — upload resume linked to a specific JD."""

# from fastapi import APIRouter, File, HTTPException, UploadFile

# from log import log_tool
# from s3_utils.tenant_onboarder import TenantStorageService

# router = APIRouter(prefix="/companies", tags=["Resume Upload"])

# _storage = TenantStorageService()


# @router.post("/{company_id}/users/{user_id}/jds/{jd_id}/resumes")
# async def upload_resume(
#     company_id: str,
#     user_id: str,
#     jd_id: str,
#     file: UploadFile = File(...),
# ):
#     """
#     Upload a resume for a candidate under a specific JD. Generates unique path and uploads to S3.
#     """
#     if not file.filename:
#         raise HTTPException(status_code=400, detail="Missing filename")
#     if not file.filename.lower().endswith((".pdf", ".txt")):
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid file type. Upload .pdf or .txt",
#         )
#     try:
#         content = await file.read()
#         candidate_id, s3_key = _storage.generate_resume_upload_path(
#             company_id=company_id,
#             user_id=user_id,
#             jd_id=jd_id,
#             original_filename=file.filename,
#         )
#         content_type = file.content_type or "application/octet-stream"
#         _storage.upload_file(content, s3_key, content_type)
#         return {
#             "candidate_id": candidate_id,
#             "s3_key": s3_key,
#             "filename": file.filename,
#         }
#     except Exception as e:
#         log_tool.log_exception("Resume upload failed", e)
#         raise HTTPException(status_code=500, detail=str(e))
"""Resume upload — upload multiple resumes linked to a specific JD."""

from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from log import log_tool
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Resume Upload"])

_storage = TenantStorageService()

ALLOWED_EXTENSIONS = (".pdf", ".txt")


class ResumeUploadResult(BaseModel):
    filename: str
    status: str  # "success" | "failed"
    candidate_id: Optional[str] = None
    s3_key: Optional[str] = None
    error: Optional[str] = None


class ResumeUploadResponse(BaseModel):
    uploaded: int
    failed: int
    results: List[ResumeUploadResult]


def _validate_file(file: UploadFile) -> None:
    """Validate a single file's name and extension."""
    if not file.filename:
        raise HTTPException(
            status_code=400, detail="One or more files are missing a filename"
        )
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for '{file.filename}'. Upload .pdf or .txt only",
        )


@router.post(
    "/{company_id}/users/{user_id}/jds/{jd_id}/resumes",
    response_model=ResumeUploadResponse,
)
async def upload_resumes(
    company_id: str,
    user_id: str,
    jd_id: str,
    files: List[UploadFile] = File(...),
) -> ResumeUploadResponse:
    """
    Upload one or more resumes for candidates under a specific JD.
    Each file gets a unique path and is uploaded to S3.
    Returns a list of results, including any per-file errors.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate all files up front before uploading anything
    for file in files:
        _validate_file(file)

    results: list[ResumeUploadResult] = []
    for file in files:
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
            results.append(
                ResumeUploadResult(
                    candidate_id=candidate_id,
                    s3_key=s3_key,
                    filename=file.filename,
                    status="success",
                )
            )
        except Exception as e:
            log_tool.log_exception(f"Resume upload failed for '{file.filename}'", e)
            results.append(
                ResumeUploadResult(
                    filename=file.filename,
                    status="failed",
                    error=str(e),
                )
            )

    failed = [r for r in results if r.status == "failed"]
    if len(failed) == len(files):
        # All failed – include detailed per-file errors in the response body
        raise HTTPException(
            status_code=500,
            detail={
                "message": "All uploads failed",
                "results": [r.model_dump() for r in results],
            },
        )

    return ResumeUploadResponse(
        uploaded=len(files) - len(failed),
        failed=len(failed),
        results=results,
    )