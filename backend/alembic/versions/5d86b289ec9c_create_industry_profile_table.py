"""create_industry_profile_table

Revision ID: 5d86b289ec9c
Revises: 2a761137faa8
Create Date: 2025-10-29 15:09:48.177660

Industry profile system: allows users to create professional industry profiles for production/film roles.
Each user can have one industry profile. The profile is linked to a user_role_profile for the 'industry' role.

Schema:
- id: INTEGER, primary key, auto-increment
- user_id: INTEGER, foreign key to users.id with ON DELETE CASCADE, UNIQUE (one profile per user)
- role_profile_id: INTEGER, foreign key to user_role_profiles.id with ON DELETE SET NULL, NULLABLE (backward compatibility)
- company_name: VARCHAR(200), nullable - production company or studio name
- job_title: VARCHAR(200), nullable - e.g., "Producer", "Director", "Cinematographer"
- bio: TEXT, nullable - professional biography
- profile_image_url: VARCHAR(500), nullable - profile image URL
- website_url: VARCHAR(500), nullable - company or personal website
- imdb_url: VARCHAR(500), nullable - IMDb profile link
- linkedin_url: VARCHAR(500), nullable - LinkedIn profile URL
- notable_works: JSONB, nullable - array of notable projects (e.g., [{"title": "Movie Name", "year": 2023, "role": "Producer"}])
- specializations: JSONB, nullable - array of industry specializations (e.g., ["Film Production", "Post-Production", "Visual Effects"])
- experience_years: INTEGER, nullable - years of professional experience
- accepting_projects: BOOLEAN, NOT NULL, default true - whether currently accepting new projects
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, default CURRENT_TIMESTAMP
- updated_at: TIMESTAMP WITH TIME ZONE, NOT NULL, default CURRENT_TIMESTAMP, auto-update on modification

Constraints:
- PRIMARY KEY on id
- UNIQUE constraint on user_id with name uq_industry_profile_user_id
- FOREIGN KEY user_id → users.id with ON DELETE CASCADE
- FOREIGN KEY role_profile_id → user_role_profiles.id with ON DELETE SET NULL

Indexes:
- Index on user_id
- Index on role_profile_id
- Index on accepting_projects
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '5d86b289ec9c'
down_revision: Union[str, Sequence[str], None] = '2a761137faa8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create industry_profiles table
    op.create_table(
        'industry_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, unique=True, index=True),
        sa.Column('role_profile_id', sa.Integer(), nullable=True, index=True),
        sa.Column('company_name', sa.String(length=200), nullable=True),
        sa.Column('job_title', sa.String(length=200), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('profile_image_url', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('imdb_url', sa.String(length=500), nullable=True),
        sa.Column('linkedin_url', sa.String(length=500), nullable=True),
        sa.Column('notable_works', JSONB(), nullable=True),
        sa.Column('specializations', JSONB(), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('accepting_projects', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_industry_profile_user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_profile_id'], ['user_role_profiles.id'], ondelete='SET NULL'),
    )

    # Create indexes
    op.create_index('idx_industry_profile_user_id', 'industry_profiles', ['user_id'])
    op.create_index('idx_industry_profile_role_profile_id', 'industry_profiles', ['role_profile_id'])
    op.create_index('idx_industry_accepting_projects', 'industry_profiles', ['accepting_projects'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('industry_profiles')
