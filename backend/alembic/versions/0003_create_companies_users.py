"""Create companies and users tables (and Role enum) for multi-tenant onboarding

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-05

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def _role_enum_exists(bind) -> bool:
    return bool(
        bind.execute(
            sa.text(
                """
                SELECT 1
                FROM pg_type t
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = :type_name
                """
            ),
            {"type_name": "Role"},
        ).first()
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Ensure pgcrypto extension exists before using gen_random_uuid()
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # Ensure enum exists (Prisma likely created it already)
    if not _role_enum_exists(bind):
        op.execute(
            "CREATE TYPE \"Role\" AS ENUM ('superadmin', 'company_admin', 'recruiter')"
        )

    if not inspector.has_table("companies"):
        op.create_table(
            "companies",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
                server_default=sa.text("gen_random_uuid()"),
            ),
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

    role_enum = postgresql.ENUM(
        "superadmin",
        "company_admin",
        "recruiter",
        name="Role",
        create_type=False,
    )

    if not inspector.has_table("users"):
        op.create_table(
            "users",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
                server_default=sa.text("gen_random_uuid()"),
            ),
            sa.Column("cognito_sub", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column(
                "role",
                role_enum,
                nullable=False,
                server_default=sa.text("'recruiter'::\"Role\""),
            ),
            sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True),
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
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("users"):
        op.drop_index("ix_users_company_id", table_name="users")
        op.drop_index("ix_users_email", table_name="users")
        op.drop_table("users")

    if inspector.has_table("companies"):
        op.drop_index("ix_companies_name", table_name="companies")
        op.drop_table("companies")

    op.execute('DROP TYPE IF EXISTS "Role"')
