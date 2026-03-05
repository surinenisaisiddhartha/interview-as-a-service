"""Add name and phone_number columns to users table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-05

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def _column_exists(bind, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    cols = inspector.get_columns(table_name)
    return any(c.get("name") == column_name for c in cols)


def upgrade() -> None:
    bind = op.get_bind()

    if not _column_exists(bind, "users", "name"):
        op.add_column("users", sa.Column("name", sa.String(), nullable=True))

    if not _column_exists(bind, "users", "phone_number"):
        op.add_column("users", sa.Column("phone_number", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()

    if _column_exists(bind, "users", "phone_number"):
        op.drop_column("users", "phone_number")

    if _column_exists(bind, "users", "name"):
        op.drop_column("users", "name")
