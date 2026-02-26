"""Initial schema — candidates and jobs tables with JSONB + GIN indexes

Revision ID: 0001
Revises: 
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # candidates                                                           #
    # ------------------------------------------------------------------ #
    op.create_table(
        "candidates",
        sa.Column("id",                       sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("full_name",                sa.String(),     nullable=False),
        sa.Column("email",                    sa.String(),     nullable=False),
        sa.Column("phone_number",             sa.String(),     nullable=True),
        sa.Column("phone_country_code",       sa.String(),     nullable=True),

        # location
        sa.Column("city",                     sa.String(),     nullable=True),
        sa.Column("state",                    sa.String(),     nullable=True),
        sa.Column("country",                  sa.String(),     nullable=True),

        # role
        sa.Column("current_designation",      sa.String(),     nullable=True),
        sa.Column("current_company",          sa.String(),     nullable=True),
        sa.Column("overall_experience_years", sa.Float(),      nullable=True),

        # education
        sa.Column("highest_degree",           sa.String(),     nullable=True),
        sa.Column("highest_degree_name",      sa.String(),     nullable=True),
        sa.Column("institution",              sa.String(),     nullable=True),
        sa.Column("graduation_year",          sa.String(),     nullable=True),
        sa.Column("gpa",                      sa.String(),     nullable=True),

        # JSONB
        sa.Column("work_experience",          postgresql.JSONB(), nullable=True),
        sa.Column("skills",                   postgresql.JSONB(), nullable=True),
        sa.Column("projects",                 postgresql.JSONB(), nullable=True),
        sa.Column("raw_resume_json",          postgresql.JSONB(), nullable=True),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.UniqueConstraint("email", name="uq_candidates_email"),
    )

    # Regular B-tree indexes
    op.create_index("ix_candidates_id",    "candidates", ["id"],    unique=False)
    op.create_index("ix_candidates_email", "candidates", ["email"], unique=True)

    # GIN indexes for JSONB columns
    op.create_index(
        "ix_candidates_skills_gin",
        "candidates",
        ["skills"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_candidates_work_exp_gin",
        "candidates",
        ["work_experience"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_candidates_projects_gin",
        "candidates",
        ["projects"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_candidates_raw_resume_gin",
        "candidates",
        ["raw_resume_json"],
        postgresql_using="gin",
    )

    # ------------------------------------------------------------------ #
    # jobs                                                                 #
    # ------------------------------------------------------------------ #
    op.create_table(
        "jobs",
        sa.Column("id",                             sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title",                          sa.String(),  nullable=False),
        sa.Column("min_required_experience_years",  sa.Float(),   nullable=True),
        sa.Column("max_required_experience_years",  sa.Float(),   nullable=True),
        sa.Column("location",                       sa.String(),  nullable=True),
        sa.Column("employment_type",                sa.String(),  nullable=True),

        # JSONB
        sa.Column("required_skills",  postgresql.JSONB(), nullable=True),
        sa.Column("preferred_skills", postgresql.JSONB(), nullable=True),
        sa.Column("raw_job_json",     postgresql.JSONB(), nullable=True),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_index("ix_jobs_id", "jobs", ["id"], unique=False)

    # GIN indexes
    op.create_index(
        "ix_jobs_required_skills_gin",
        "jobs",
        ["required_skills"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_jobs_preferred_skills_gin",
        "jobs",
        ["preferred_skills"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_jobs_raw_job_gin",
        "jobs",
        ["raw_job_json"],
        postgresql_using="gin",
    )


def downgrade() -> None:
    op.drop_table("jobs")
    op.drop_table("candidates")
