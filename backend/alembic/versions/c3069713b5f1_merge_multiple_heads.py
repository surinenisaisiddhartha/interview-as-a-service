"""merge multiple heads

Revision ID: c3069713b5f1
Revises: 0006, c064088d66ae
Create Date: 2026-03-07 03:05:03.209908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3069713b5f1'
down_revision: Union[str, Sequence[str], None] = ('0006', 'c064088d66ae')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
