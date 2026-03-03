"""Add summary and s3_link columns to candidates and jobs tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to candidates table
    op.add_column("candidates", sa.Column("summary", sa.String(), nullable=True))
    op.add_column("candidates", sa.Column("s3_link", sa.String(), nullable=True))

    # Add columns to jobs table
    op.add_column("jobs", sa.Column("summary", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("s3_link", sa.String(), nullable=True))


def downgrade() -> None:
    # Remove columns from jobs table
    op.drop_column("jobs", "s3_link")
    op.drop_column("jobs", "summary")

    # Remove columns from candidates table
    op.drop_column("candidates", "s3_link")
    op.drop_column("candidates", "summary")
