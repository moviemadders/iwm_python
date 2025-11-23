"""
Add unique constraint on watchlist (user_id, movie_id) and clean duplicates

Revision ID: a1b2c3d4e5f6
Revises: 53572f1cd932
Create Date: 2025-10-28 20:08:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '53572f1cd932'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Remove duplicates, keep the most recent by id
    op.execute(
        """
        DELETE FROM watchlist w
        USING watchlist w2
        WHERE w.user_id = w2.user_id
          AND w.movie_id = w2.movie_id
          AND w.id < w2.id;
        """
    )

    # 2) Add unique constraint
    op.create_unique_constraint(
        constraint_name='uq_watchlist_user_movie',
        table_name='watchlist',
        columns=['user_id', 'movie_id'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_watchlist_user_movie', 'watchlist', type_='unique')

