"""merge_heads

Revision ID: ebd7593a9a5e
Revises: 58c375e0c9ff, a2c3d4e5f6g8
Create Date: 2025-11-03 12:04:40.291026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ebd7593a9a5e'
down_revision: Union[str, Sequence[str], None] = ('58c375e0c9ff', 'a2c3d4e5f6g8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
