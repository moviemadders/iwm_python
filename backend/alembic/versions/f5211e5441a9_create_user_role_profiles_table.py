"""create_user_role_profiles_table

Revision ID: f5211e5441a9
Revises: bcad9138a49a
Create Date: 2025-10-29 14:36:13.768965

Multi-role profile system: allows users to have separate profiles for different roles.
Each user can have one profile per role_type (e.g., one 'lover' profile, one 'critic' profile).
Only one role profile per user can be marked as is_default=true.

Schema:
- id: INTEGER, primary key, auto-increment
- user_id: INTEGER, foreign key to users.id with ON DELETE CASCADE
- role_type: VARCHAR(20), allowed values: 'lover', 'critic', 'talent', 'industry', 'moderator', 'admin'
- enabled: BOOLEAN, default true (controls whether this role profile is active)
- visibility: VARCHAR(20), allowed values: 'public', 'private', 'followers_only', default 'public'
- is_default: BOOLEAN, default false (only one role per user should have is_default=true)
- handle: VARCHAR(100), nullable (allows custom username per role)
- created_at: TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP
- updated_at: TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP, auto-update on modification

Constraints:
- UNIQUE (user_id, role_type) - ensures one profile per role per user
- FOREIGN KEY user_id → users.id with ON DELETE CASCADE
- CHECK role_type IN ('lover', 'critic', 'talent', 'industry', 'moderator', 'admin')
- CHECK visibility IN ('public', 'private', 'followers_only')

Indexes:
- Composite index on (user_id, role_type) for fast lookups
- Index on visibility for filtering queries
- Partial index on user_id WHERE is_default=true AND enabled=true for default role lookups
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5211e5441a9'
down_revision: Union[str, Sequence[str], None] = 'bcad9138a49a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_role_profiles table
    op.create_table(
        'user_role_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('role_type', sa.String(length=20), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='public'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('handle', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_type', name='uq_user_role_type'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("role_type IN ('lover', 'critic', 'talent', 'industry', 'moderator', 'admin')", name='ck_role_type'),
        sa.CheckConstraint("visibility IN ('public', 'private', 'followers_only')", name='ck_visibility'),
    )

    # Create indexes
    op.create_index('idx_user_role_type', 'user_role_profiles', ['user_id', 'role_type'])
    op.create_index('idx_visibility', 'user_role_profiles', ['visibility'])
    op.create_index('idx_user_default_role', 'user_role_profiles', ['user_id'],
                    postgresql_where=sa.text('is_default = true AND enabled = true'))

    # Seed default 'lover' role profile for all existing users
    op.execute("""
        INSERT INTO user_role_profiles (user_id, role_type, enabled, visibility, is_default, created_at, updated_at)
        SELECT id, 'lover', true, 'public', true, NOW(), NOW()
        FROM users
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_role_profiles')
