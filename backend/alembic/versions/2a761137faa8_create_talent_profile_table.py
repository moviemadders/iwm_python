"""create_talent_profile_table

Revision ID: 2a761137faa8
Revises: f5211e5441a9
Create Date: 2025-10-29 15:09:15.180078

Talent profile system: allows users to create professional talent profiles for acting/entertainment roles.
Each user can have one talent profile. The profile is linked to a user_role_profile for the 'talent' role.

Schema:
- id: INTEGER, primary key, auto-increment
- user_id: INTEGER, foreign key to users.id with ON DELETE CASCADE, UNIQUE (one profile per user)
- role_profile_id: INTEGER, foreign key to user_role_profiles.id with ON DELETE SET NULL, NULLABLE (backward compatibility)
- stage_name: VARCHAR(200), nullable - professional name for talent
- bio: TEXT, nullable - professional biography
- headshot_url: VARCHAR(500), nullable - professional headshot image URL
- demo_reel_url: VARCHAR(500), nullable - video portfolio link
- imdb_url: VARCHAR(500), nullable - IMDb profile link
- agent_name: VARCHAR(200), nullable - talent agent's name
- agent_contact: VARCHAR(200), nullable - talent agent's contact info
- skills: JSONB, nullable - array of skills/specialties (e.g., ["Acting", "Stunt Work", "Voice Acting"])
- experience_years: INTEGER, nullable - years of professional experience
- availability_status: VARCHAR(20), NOT NULL, default 'available', CHECK constraint for values: 'available', 'busy', 'not_available'
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, default CURRENT_TIMESTAMP
- updated_at: TIMESTAMP WITH TIME ZONE, NOT NULL, default CURRENT_TIMESTAMP, auto-update on modification

Constraints:
- PRIMARY KEY on id
- UNIQUE constraint on user_id with name uq_talent_profile_user_id
- FOREIGN KEY user_id → users.id with ON DELETE CASCADE
- FOREIGN KEY role_profile_id → user_role_profiles.id with ON DELETE SET NULL
- CHECK constraint on availability_status IN ('available', 'busy', 'not_available')

Indexes:
- Index on user_id
- Index on role_profile_id
- Index on availability_status
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '2a761137faa8'
down_revision: Union[str, Sequence[str], None] = 'f5211e5441a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create talent_profiles table
    op.create_table(
        'talent_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, unique=True, index=True),
        sa.Column('role_profile_id', sa.Integer(), nullable=True, index=True),
        sa.Column('stage_name', sa.String(length=200), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('headshot_url', sa.String(length=500), nullable=True),
        sa.Column('demo_reel_url', sa.String(length=500), nullable=True),
        sa.Column('imdb_url', sa.String(length=500), nullable=True),
        sa.Column('agent_name', sa.String(length=200), nullable=True),
        sa.Column('agent_contact', sa.String(length=200), nullable=True),
        sa.Column('skills', JSONB(), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('availability_status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_talent_profile_user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_profile_id'], ['user_role_profiles.id'], ondelete='SET NULL'),
        sa.CheckConstraint("availability_status IN ('available', 'busy', 'not_available')", name='ck_talent_availability_status'),
    )

    # Create indexes
    op.create_index('idx_talent_profile_user_id', 'talent_profiles', ['user_id'])
    op.create_index('idx_talent_profile_role_profile_id', 'talent_profiles', ['role_profile_id'])
    op.create_index('idx_talent_availability_status', 'talent_profiles', ['availability_status'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('talent_profiles')
