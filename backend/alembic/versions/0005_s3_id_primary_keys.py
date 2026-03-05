"""Replace UUID primary keys with TEXT (S3 slug-IDs) in companies and users tables.

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-05

Changes:
  - Drop `users` table (has FK dependency on companies)
  - Drop `companies` table
  - Recreate `companies` with id TEXT PRIMARY KEY (no auto-generation)
  - Recreate `users` with id TEXT PRIMARY KEY and company_id TEXT FK
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Drop users first (FK dependency)
    if inspector.has_table("users"):
        op.drop_index("ix_users_company_id", table_name="users")
        op.drop_index("ix_users_email", table_name="users")
        op.drop_table("users")

    # 2. Drop companies
    if inspector.has_table("companies"):
        op.drop_index("ix_companies_name", table_name="companies")
        op.drop_table("companies")

    # 3. Recreate companies — id is now TEXT (the S3 slug-ID)
    op.create_table(
        "companies",
        sa.Column("id", sa.String(), nullable=False, primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("name", name="uq_companies_name"),
    )
    op.create_index("ix_companies_name", "companies", ["name"], unique=True)

    # Reuse existing Role enum (created in migration 0003) — do NOT create it again
    role_enum = postgresql.ENUM(
        "superadmin",
        "company_admin",
        "recruiter",
        name="Role",
        create_type=False,   # enum already exists from migration 0003
    )

    # 4. Recreate users — id is now TEXT (the S3 slug-ID)
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False, primary_key=True),
        sa.Column("cognito_sub", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column(
            "role",
            role_enum,
            nullable=False,
            server_default=sa.text("'recruiter'::\"Role\""),
        ),
        sa.Column("company_id", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["company_id"],
            ["companies.id"],
            ondelete="SET NULL",
            name="fk_users_company_id",
        ),
        sa.UniqueConstraint("cognito_sub", name="uq_users_cognito_sub"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_company_id", "users", ["company_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    """
    Reverse: drop TEXT-keyed tables. The old UUID versions are not restored
    since historical data cannot be recovered automatically.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("users"):
        op.drop_index("ix_users_company_id", table_name="users")
        op.drop_index("ix_users_email", table_name="users")
        op.drop_table("users")

    if inspector.has_table("companies"):
        op.drop_index("ix_companies_name", table_name="companies")
        op.drop_table("companies")
