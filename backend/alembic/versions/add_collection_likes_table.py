"""add collection_likes table

Revision ID: add_collection_likes
Revises: 001_feature_flags
Create Date: 2025-01-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_collection_likes'
down_revision: Union[str, None] = '001_feature_flags'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create collection_likes table
    op.create_table(
        'collection_likes',
        sa.Column('collection_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('collection_id', 'user_id')
    )


def downgrade() -> None:
    # Drop collection_likes table
    op.drop_table('collection_likes')

