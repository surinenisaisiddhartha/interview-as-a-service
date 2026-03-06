"""make_cognito_sub_nullable

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-05 18:37:12.725376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('users', 'cognito_sub',
               existing_type=sa.VARCHAR(),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('users', 'cognito_sub',
               existing_type=sa.VARCHAR(),
               nullable=False)
