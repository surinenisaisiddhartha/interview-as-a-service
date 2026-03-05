"""Company onboarding — create company in DB and S3 folder structure."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Company
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
def onboard_company(body: CompanyOnboardRequest, db: Session = Depends(get_db)):
    """
    Onboard a new company.

    - Creates a Company row in PostgreSQL (if it does not already exist)
    - Creates S3 structure: companies/{company_id}/, companies/{company_id}/users/
    """
    try:
        # Ensure we do not create duplicate companies by name
        existing = db.query(Company).filter(Company.name == body.company_name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Company with this name already exists")

        company_row = Company(name=body.company_name)
        db.add(company_row)

        # Create S3 structure; if this fails we roll back the DB transaction
        company_id = _storage.onboard_company(body.company_name)

        db.commit()

        return CompanyOnboardResponse(company_id=company_id)
    except HTTPException:
        db.rollback()
        raise
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        log_tool.log_exception("Company onboarding failed", e)
        raise HTTPException(status_code=500, detail="Internal server error while onboarding company")
