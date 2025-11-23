"""add published awards column to movies

Revision ID: a2c3d4e5f6g8
Revises: a2c3d4e5f6g7
Create Date: 2025-11-02 10:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a2c3d4e5f6g8"
down_revision: Union[str, Sequence[str], None] = "a2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add published awards column to movies table"""
    
    # Add published awards column (alongside awards_draft)
    op.add_column("movies", sa.Column("awards", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Remove published awards column"""
    
    # Drop the awards column
    op.drop_column("movies", "awards")

