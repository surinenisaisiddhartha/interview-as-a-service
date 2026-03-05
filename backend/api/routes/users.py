"""User creation inside a company — create user in DB and S3 folder structure."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Role, User
from log import log_tool
from pydantic import BaseModel
from s3_utils.tenant_onboarder import TenantStorageService

router = APIRouter(prefix="/companies", tags=["Users"])

_storage = TenantStorageService()


class UserCreateRequest(BaseModel):
    email: str
    name: str
    role: str
    phone_number: str
    cognito_sub: str


class UserCreateResponse(BaseModel):
    user_id: str


@router.post("/{company_id}/users", response_model=UserCreateResponse)
def create_user(
    company_id: str,
    body: UserCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Create a user under a company.

    - Persists a User row in PostgreSQL (linked to Cognito via cognito_sub)
    - Creates S3 structure: companies/{company_id}/users/{user_id}/, .../jds/
    """
    try:
        # Validate role value against Role enum
        try:
            role_enum = Role(body.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

        # Enforce uniqueness on email and cognito_sub
        existing_by_email = db.query(User).filter(User.email == body.email).first()
        if existing_by_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        existing_by_sub = (
            db.query(User).filter(User.cognito_sub == body.cognito_sub).first()
        )
        if existing_by_sub:
            raise HTTPException(
                status_code=400, detail="User with this Cognito subject already exists"
            )

        # Create DB user record (company_id left null here because FastAPI
        # uses an S3-specific company identifier, not the DB UUID primary key)
        db_user = User(
            cognito_sub=body.cognito_sub,
            email=body.email,
            name=body.name,
            phone_number=body.phone_number,
            role=role_enum,
        )
        db.add(db_user)

        # Create S3 structure for this user; if S3 fails we roll back DB as well
        user_id = _storage.onboard_user(
            company_id=company_id,
            email=body.email,
            name=body.name,
            phone_number=body.phone_number,
            role=body.role,
        )

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
