"""add_role_profile_id_to_critic_profiles

Revision ID: 6e013abec488
Revises: 5d86b289ec9c
Create Date: 2025-10-29 15:26:14.777548

Add role_profile_id column to critic_profiles table to link CriticProfile to UserRoleProfile.
This enables multi-role system integration where a critic profile can be associated with a specific role profile.

Schema Changes:
- Add column: role_profile_id (INTEGER, nullable, indexed)
- Add foreign key: fk_critic_profile_role_profile_id → user_role_profiles.id with ON DELETE SET NULL
- Add index: idx_critic_profile_role_profile_id on role_profile_id

Rationale:
- Nullable: Existing critic profiles may not have an associated role profile (backward compatibility)
- ON DELETE SET NULL: When a role profile is deleted, the critic profile's role_profile_id is set to NULL
  rather than deleting the critic profile, preserving the critic profile data
- Indexed: Efficient lookups and joins by role profile
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e013abec488'
down_revision: Union[str, Sequence[str], None] = '5d86b289ec9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add role_profile_id column
    op.add_column('critic_profiles', sa.Column('role_profile_id', sa.Integer(), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_critic_profile_role_profile_id',
        'critic_profiles',
        'user_role_profiles',
        ['role_profile_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Create index
    op.create_index(
        'idx_critic_profile_role_profile_id',
        'critic_profiles',
        ['role_profile_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index first
    op.drop_index('idx_critic_profile_role_profile_id', table_name='critic_profiles')

    # Drop foreign key constraint
    op.drop_constraint('fk_critic_profile_role_profile_id', 'critic_profiles', type_='foreignkey')

    # Drop column last
    op.drop_column('critic_profiles', 'role_profile_id')
