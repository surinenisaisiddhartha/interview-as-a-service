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
import os
import json
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, BackgroundTasks
from pydantic import BaseModel

from log import log_tool
from s3_utils.tenant_onboarder import TenantStorageService
from utils.text_extractor import TextExtractor
from parsers.resume_parser import ResumeParser
from db.candidate_job_repository import save_candidate_from_resume
from services.matching_service import MatchingService

router = APIRouter(prefix="/companies", tags=["Resume Upload"])

_storage = TenantStorageService()
_matching_service = MatchingService()

ALLOWED_EXTENSIONS = (".pdf", ".txt", ".doc", ".docx")


from schemas import ResumeUploadResult, ResumeUploadResponse

def _validate_file(file: UploadFile) -> None:
    """Validate a single file's name and extension."""
    if not file.filename:
        raise HTTPException(
            status_code=400, detail="One or more files are missing a filename"
        )
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for '{file.filename}'. Upload .pdf, .txt, .doc, or .docx only",
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
            
            # Extract Text and Store Locally Temporarily
            raw_text = TextExtractor.extract_text(content, file.filename)
            
            if not raw_text.strip():
                raise ValueError(f"Could not extract any readable text from '{file.filename}'. It may be an unsupported image/scan or corrupted file.")
                
            temp_dir = os.path.join(os.getcwd(), "temp_extracted_resumes")
            os.makedirs(temp_dir, exist_ok=True)
            
            local_raw_path = os.path.join(temp_dir, f"{candidate_id}_raw.txt")
            with open(local_raw_path, "w", encoding="utf-8") as f:
                f.write(raw_text)
                
            log_tool.log_info(f"Temporarily saved raw text for '{file.filename}' to {local_raw_path}")

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


from schemas import ProcessResumeRequest, BulkProcessResumeRequest

@router.post(
    "/jds/{jd_id}/resumes/process",
)
async def process_resume_from_temp(
    jd_id: str,
    req: BulkProcessResumeRequest,
):
    """
    Processes the temporarily stored raw text resumes in bulk.
    - Parses JSON via LLM for each.
    - Uploads JSON to S3 for each.
    - Stores structured candidate in DB linked to jd_id.
    - Matches all candidates globally after the loop completes.
    """
    temp_dir = os.path.join(os.getcwd(), "temp_extracted_resumes")
    
    processed = []
    failed = []

    for candidate_req in req.candidates:
        local_raw_path = os.path.join(temp_dir, f"{candidate_req.candidate_id}_raw.txt")
        
        if not os.path.exists(local_raw_path):
            failed.append({"candidate_id": candidate_req.candidate_id, "error": "Temporary raw resume not found locally"})
            continue
            
        try:
            with open(local_raw_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
                
            parser = ResumeParser()
            parsed_result = parser.parse(raw_text)
            
            if not parsed_result:
                raise ValueError("LLM parsing returned empty data")
                
            # 1. Store JSON to S3 (derive path dynamically to decouple endpoint)
            if "resumes/" in candidate_req.s3_key:
                json_key = candidate_req.s3_key.split("resumes/")[0] + f"parsed/{candidate_req.candidate_id}_parsed.json"
                json_bytes = json.dumps(parsed_result).encode('utf-8')
                _storage.upload_file(json_bytes, json_key, "application/json")
            
            # 2. Save candidate to PostgreSQL
            save_candidate_from_resume(
                parsed_resume=parsed_result,
                s3_link=candidate_req.s3_key,  # URL to original pdf
                s3_candidate_id=candidate_req.candidate_id,
                s3_job_id=jd_id
            )
            
            # 3. Clean up temp local document
            os.remove(local_raw_path)
            log_tool.log_info(f"Deleted temporary raw text file: {local_raw_path}")
            
            processed.append(candidate_req.candidate_id)
            
        except Exception as e:
            log_tool.log_exception(f"Resume processing failed for candidate '{candidate_req.candidate_id}'", e)
            failed.append({"candidate_id": candidate_req.candidate_id, "error": str(e)})

    # 4. Instantly Match ALL the processed candidates Against the Job Globally
    rank_data_map = {}
    if processed:
        try:
            ranked_payload = _matching_service.get_ranked_matches_for_job(jd_id)
            for candidate in ranked_payload.get("candidates", []):
                if candidate.get("candidate_id") in processed:
                    rank_data_map[candidate.get("candidate_id")] = candidate
        except Exception as me:
            log_tool.log_exception("Bulk matching phase failed", me)

    return {
        "status": "success" if not failed else "partial_success",
        "message": f"Successfully processed {len(processed)} resumes. Failed {len(failed)}.",
        "processed_candidates": processed,
        "failed_candidates": failed,
        "match_data": rank_data_map
    }