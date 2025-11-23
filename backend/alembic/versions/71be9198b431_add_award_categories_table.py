"""add_award_categories_table

Revision ID: 71be9198b431
Revises: ebd7593a9a5e
Create Date: 2025-11-03 12:04:52.718360

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71be9198b431'
down_revision: Union[str, Sequence[str], None] = 'ebd7593a9a5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add Indian awards support to existing award_ceremonies table."""
    # Add new columns to award_ceremonies table for Indian awards support
    op.add_column('award_ceremonies', sa.Column('country', sa.String(length=100), nullable=True))
    op.add_column('award_ceremonies', sa.Column('language', sa.String(length=100), nullable=True))
    op.add_column('award_ceremonies', sa.Column('category_type', sa.String(length=100), nullable=True))
    op.add_column('award_ceremonies', sa.Column('prestige_level', sa.String(length=50), nullable=True))
    op.add_column('award_ceremonies', sa.Column('established_year', sa.Integer(), nullable=True))
    op.add_column('award_ceremonies', sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('award_ceremonies', sa.Column('display_order', sa.Integer(), nullable=True))

    # Create indexes for better query performance
    op.create_index('ix_award_ceremonies_country', 'award_ceremonies', ['country'])
    op.create_index('ix_award_ceremonies_language', 'award_ceremonies', ['language'])
    op.create_index('ix_award_ceremonies_category_type', 'award_ceremonies', ['category_type'])
    op.create_index('ix_award_ceremonies_is_active', 'award_ceremonies', ['is_active'])

    # Update existing records with default values
    op.execute("UPDATE award_ceremonies SET country = 'USA', prestige_level = 'high', is_active = true WHERE country IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_award_ceremonies_is_active', table_name='award_ceremonies')
    op.drop_index('ix_award_ceremonies_category_type', table_name='award_ceremonies')
    op.drop_index('ix_award_ceremonies_language', table_name='award_ceremonies')
    op.drop_index('ix_award_ceremonies_country', table_name='award_ceremonies')

    # Drop columns
    op.drop_column('award_ceremonies', 'display_order')
    op.drop_column('award_ceremonies', 'is_active')
    op.drop_column('award_ceremonies', 'established_year')
    op.drop_column('award_ceremonies', 'prestige_level')
    op.drop_column('award_ceremonies', 'category_type')
    op.drop_column('award_ceremonies', 'language')
    op.drop_column('award_ceremonies', 'country')
