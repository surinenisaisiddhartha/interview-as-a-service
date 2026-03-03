"""Company onboarding — create company and S3 folder structure."""

from fastapi import APIRouter, HTTPException

from log import log_tool
from pydantic import BaseModel
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Companies"])

_storage = TenantStorageService()


class CompanyOnboardRequest(BaseModel):
    company_name: str


class CompanyOnboardResponse(BaseModel):
    company_id: str


@router.post("", response_model=CompanyOnboardResponse)
def onboard_company(body: CompanyOnboardRequest):
    """
    Onboard a new company. Creates S3 structure: companies/{company_id}/, companies/{company_id}/users/
    """
    try:
        company_id = _storage.onboard_company(body.company_name)
        return CompanyOnboardResponse(company_id=company_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_tool.log_exception("Company onboarding failed", e)
        raise HTTPException(status_code=500, detail=str(e))
