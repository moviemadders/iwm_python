"""merge_heads

Revision ID: bcad9138a49a
Revises: a1b2c3d4e5f6, e8688c242c92
Create Date: 2025-10-29 14:36:06.335617

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bcad9138a49a'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'e8688c242c92')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
