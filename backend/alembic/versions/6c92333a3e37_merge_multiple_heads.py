"""merge_multiple_heads

Revision ID: 6c92333a3e37
Revises: 1131c429e4be, a1b2c3d4e5f7
Create Date: 2025-10-31 09:02:32.404290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c92333a3e37'
down_revision: Union[str, Sequence[str], None] = ('1131c429e4be', 'a1b2c3d4e5f7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
