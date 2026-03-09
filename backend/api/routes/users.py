"""User creation inside a company — create user in DB and S3 folder structure."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Role, User, Company
from log import log_tool
from pydantic import BaseModel
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Users"])

_storage = TenantStorageService()


from schemas import UserCreateRequest, UserCreateResponse

@router.post("/{company_id}/users", response_model=UserCreateResponse)
def create_user(
    company_id: str,
    body: UserCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Create a user under a company.

    - Creates S3 structure: companies/{company_id}/users/{user_id}/, .../jds/
    - Persists a User row in PostgreSQL using the S3 user_id as the primary key
    - Links the user to the company via company_id (the S3 company slug-ID)
    """
    try:
        # Validate role value against Role enum
        try:
            role_enum = Role(body.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

        # Validate that the company exists
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Enforce uniqueness on email and cognito_sub
        existing_by_email = db.query(User).filter(User.email == body.email).first()
        if existing_by_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        # Only checking email uniqueness during initial creation. cognito_sub is populated later.
        # Create S3 folder structure first — the returned user_id IS the PK
        user_id = _storage.onboard_user(
            company_id=company_id,
            email=body.email,
            name=body.name,
            phone_number=body.phone_number,
            role=body.role,
        )

        # Persist to DB using the S3 ID as the primary key, linked to the company
        db_user = User(
            id=user_id,
            cognito_sub=None,
            email=body.email,
            name=body.name,
            phone_number=body.phone_number,
            role=role_enum,
            company_id=company_id,
        )
        db.add(db_user)
        db.commit()

        return UserCreateResponse(user_id=user_id)
    except HTTPException:
        db.rollback()
        raise
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        log_tool.log_exception("User creation failed", e)
        raise HTTPException(status_code=500, detail="Internal server error while creating user")
