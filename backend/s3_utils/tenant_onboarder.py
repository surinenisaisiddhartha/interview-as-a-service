import os
import re
import uuid
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from log import log_tool

# Load Environment Variables

load_dotenv()

# ID GENERATION UTILITIES

def generate_slug(name: str) -> str:
    """
    Convert name to URL-safe slug
    Example: 'TCS India Pvt Ltd' -> 'tcs-india-pvt-ltd'
    """
    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = name.strip('-')
    return name


def generate_short_uuid(length: int = 8) -> str:
    """
    Generate short unique ID (default 8 chars)
    """
    return uuid.uuid4().hex[:length]


# TENANT STORAGE SERVICE

class TenantStorageService:
    """
    Handles:
        - Company onboarding
        - User onboarding
        - JD workspace creation
        - Resume upload path generation
    """

    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.region_name = os.getenv("AWS_REGION_NAME")

        if not self.bucket_name:
            raise ValueError("S3_BUCKET_NAME not set in environment")

        if not self.region_name:
            raise ValueError("AWS_REGION_NAME not set in environment")

        self.s3 = boto3.client("s3", region_name=self.region_name)

    # INTERNAL FOLDER CREATION

    def _create_folder(self, folder_path: str):
        """
        Create folder in S3 (S3 is object-based)
        """
        if not folder_path.endswith("/"):
            folder_path += "/"

        try:
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=folder_path
            )
            log_tool.log_info(f"Created folder: {folder_path}")
        except ClientError as e:
            log_tool.log_error(f"Failed creating folder {folder_path}: {str(e)}")
            raise

    # COMPANY ONBOARDING

    def onboard_company(self, company_name: str) -> str:
        """
        Creates:
            companies/{company_slug-shortuuid}/
            companies/{company_slug-shortuuid}/users/
        """

        slug = generate_slug(company_name)
        short_id = generate_short_uuid()
        company_id = f"{slug}-{short_id}"

        base_path = f"companies/{company_id}/"

        log_tool.log_info(f"Onboarding company: {company_name} ({company_id})")

        folders = [
            base_path,
            f"{base_path}users/"
        ]

        for folder in folders:
            self._create_folder(folder)

        # Store metadata
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=f"{base_path}metadata.json",
            Body=f'{{"company_name": "{company_name}"}}',
            ContentType="application/json"
        )

        log_tool.log_info(f"Company onboarded successfully: {company_id}")
        return company_id

    # USER ONBOARDING

    def onboard_user(self, company_id: str, email: str, name: str, phone_number: str, role: str) -> str:
        """
        Creates:
            companies/{company_id}/users/{role-shortuuid}/
            companies/{company_id}/users/{role-shortuuid}/jds/
        """

        short_id = generate_short_uuid()
        first_name = name.split(" ")[0]
        name_slug = generate_slug(first_name)
        user_id = f"{name_slug}-{role}-{short_id}"

        base_path = f"companies/{company_id}/users/{user_id}/"

        # log_tool.log_info(f"Onboarding user: {email} ({user_id})")
        log_tool.log_info(f"Onboarding user: {email} ({user_id}), phone_number:: {phone_number}")

        folders = [
            base_path,
            f"{base_path}jds/"
        ]

        for folder in folders:
            self._create_folder(folder)

        log_tool.log_info(f"User onboarded successfully: {user_id}")
        return user_id

    # JD WORKSPACE CREATION

    def create_jd_workspace(self, company_id: str, user_id: str, role: str) -> str:
        """
        Creates JD folder structure with readable name: jds/{role_slug}-{short_id}/
        That folder contains: resumes/, parsed/, embeddings/ and JD metadata.
        role: Job role/title for this JD (e.g. "Backend Engineer") — used in folder name for readability.
        """
        role_slug = generate_slug(role)
        short_id = generate_short_uuid()
        jd_id = f"{role_slug}-{short_id}"

        base_path = f"companies/{company_id}/users/{user_id}/jds/{jd_id}/"

        log_tool.log_info(f"Creating JD workspace: {jd_id} (role: {role})")

        folders = [
            base_path,
            f"{base_path}resumes/",
            f"{base_path}parsed/",
            f"{base_path}embeddings/"
        ]

        for folder in folders:
            self._create_folder(folder)

        # JD metadata in this folder (job description can be uploaded here later)
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=f"{base_path}metadata.json",
            Body=f'{{"role": "{role}", "jd_id": "{jd_id}"}}',
            ContentType="application/json"
        )

        log_tool.log_info(f"JD workspace created: {jd_id}")
        return jd_id

    # RESUME PATH GENERATION

    def generate_resume_upload_path(
        self,
        company_id: str,
        user_id: str,
        jd_id: str,
        original_filename: str
    ):
        """
        Generates unique resume storage path
        """

        candidate_id = str(uuid.uuid4())
        sanitized_name = original_filename.replace(" ", "_")

        s3_key = (
            f"companies/{company_id}/users/{user_id}/"
            f"jds/{jd_id}/resumes/{candidate_id}_{sanitized_name}"
        )

        log_tool.log_info(f"Generated resume path: {s3_key}")

        return candidate_id, s3_key

    # FILE UPLOAD

    def upload_file(self, file_bytes: bytes, s3_key: str, content_type: str):
        """
        Upload file to S3
        """

        try:
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type
            )
            log_tool.log_info(f"Uploaded file to {s3_key}")
        except ClientError as e:
            log_tool.log_error(f"Upload failed: {str(e)}")
            raise


# LOCAL TEST RUNNER

# if __name__ == "__main__":

#     log_tool.log_info("Running TenantStorageService test...")

#     storage = TenantStorageService()

#     # 1️⃣ Company
#     company_id = storage.onboard_company("Infosys")
#     log_tool.log_info(f"Company Created: {company_id}")

#     # 2️⃣ User
#     user_id = storage.onboard_user(
#         company_id=company_id,
#         email="admin@tcs.com",
#         role="company-admin"
#     )
#     log_tool.log_info(f"User Created: {user_id}")

#     # 3️⃣ JD (role makes folder name readable, e.g. backend-engineer-a74bee88)
#     jd_id = storage.create_jd_workspace(
#         company_id=company_id,
#         user_id=user_id,
#         role="Backend Engineer"
#     )
#     log_tool.log_info(f"JD Created: {jd_id}")

#     # 4️⃣ Resume Path
#     candidate_id, s3_key = storage.generate_resume_upload_path(
#         company_id=company_id,
#         user_id=user_id,
#         jd_id=jd_id,
#         original_filename="resume.pdf"
#     )

#     log_tool.log_info(f"Candidate ID: {candidate_id}")
#     log_tool.log_info(f"Resume Path: {s3_key}")

#     log_tool.log_info("\n✅ Test Completed Successfully")