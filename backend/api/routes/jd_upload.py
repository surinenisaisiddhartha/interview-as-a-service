"""JD upload — on upload, create JD workspace (jd_id + folders), store the file, and ingest JD to DB."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from log import log_tool
from s3_utils.tenant_onboarder import TenantStorageService
from services.jd_ingest_service import JDIngestService

router = APIRouter(prefix="/companies", tags=["JD Upload"])

_storage = TenantStorageService()
_jd_ingest_service = JDIngestService()


@router.post("/{company_id}/users/{user_id}/jds/upload")
async def upload_jd(
    company_id: str,
    user_id: str,
    file: UploadFile = File(...),
    role: str = Form(..., description="Job role/title, e.g. 'Backend Engineer' — used for folder name"),
    client_company: str = Form(None, description="Optional custom client company name"),
):
    """
    Upload a job description file.

    - Creates the JD workspace (jd_id + resumes/, parsed/, embeddings/)
    - Stores the JD file in the company's S3 workspace
    - Parses the JD and saves a Job row in PostgreSQL (no matching is triggered)
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

        # Build a public-ish S3 link (if using standard AWS URL pattern)
        s3_link = (
            f"https://{_storage.bucket_name}.s3.{_storage.region_name}.amazonaws.com/{s3_key}"
        )

        # Ingest JD into the DB (parse + save Job, but DO NOT run matching)
        _jd_ingest_service.run(
            content,
            file.filename,
            company_name=company_id,
            client_company=client_company,
            s3_link=s3_link,
            s3_job_id=jd_id,
        )

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
