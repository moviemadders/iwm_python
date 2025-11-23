"""add_is_active_to_critic_profiles

Revision ID: 25598acb4f30
Revises: 5d063dcaa8ab
Create Date: 2025-11-07 21:27:29.736665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25598acb4f30'
down_revision: Union[str, Sequence[str], None] = '5d063dcaa8ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_active, suspended_at, and suspension_reason columns to critic_profiles
    op.add_column('critic_profiles', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('critic_profiles', sa.Column('suspended_at', sa.DateTime(), nullable=True))
    op.add_column('critic_profiles', sa.Column('suspension_reason', sa.Text(), nullable=True))

    # Create index on is_active for faster filtering
    op.create_index(op.f('ix_critic_profiles_is_active'), 'critic_profiles', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index and columns
    op.drop_index(op.f('ix_critic_profiles_is_active'), table_name='critic_profiles')
    op.drop_column('critic_profiles', 'suspension_reason')
    op.drop_column('critic_profiles', 'suspended_at')
    op.drop_column('critic_profiles', 'is_active')
