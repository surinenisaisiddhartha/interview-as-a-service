"""User creation inside a company — create user and S3 folder structure."""

from fastapi import APIRouter, HTTPException

from log import log_tool
from pydantic import BaseModel
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Users"])

_storage = TenantStorageService()


class UserCreateRequest(BaseModel):
    email: str
    role: str


class UserCreateResponse(BaseModel):
    user_id: str


@router.post("/{company_id}/users", response_model=UserCreateResponse)
def create_user(company_id: str, body: UserCreateRequest):
    """
    Create a user under a company. Creates S3 structure: companies/{company_id}/users/{user_id}/, .../jds/
    """
    try:
        user_id = _storage.onboard_user(
            company_id=company_id,
            email=body.email,
            role=body.role,
        )
        return UserCreateResponse(user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_tool.log_exception("User creation failed", e)
        raise HTTPException(status_code=500, detail=str(e))
