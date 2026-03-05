"""add education_score to matches

Revision ID: f434c0bd238d
Revises: 4e1574fe97a2
Create Date: 2026-03-03 11:43:18.271984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f434c0bd238d'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('matches', sa.Column('education_score', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    pass
