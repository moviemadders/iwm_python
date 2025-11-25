"""Add role-based posting to pulses

Revision ID: e9f4a2b8c7d6
Revises: d2ca5accbc79
Create Date: 2025-11-25 15:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e9f4a2b8c7d6'
down_revision = 'd2ca5accbc79'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add new columns to pulses table
    op.add_column('pulses', sa.Column('posted_as_role', sa.String(length=20), nullable=True))
    op.add_column('pulses', sa.Column('star_rating', sa.SmallInteger(), nullable=True))
    op.add_column('pulses', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Step 2: Add check constraint for star_rating (1-5 only)
    op.create_check_constraint(
        'ck_pulses_star_rating_range',
        'pulses',
        'star_rating >= 1 AND star_rating <= 5'
    )
    
    # Step 3: Set default values for existing records
    # All existing pulses are personal posts (posted_as_role = NULL)
    # No need to update since NULL is already the default
    
    # Step 4: Create composite indexes for performance
    # Index for "Pro Feed" - filter by role and sort by created_at
    op.create_index(
        'ix_pulses_role_created',
        'pulses',
        ['posted_as_role', sa.text('created_at DESC')],
        postgresql_using='btree'
    )
    
    # Index for filtering reviews on Movie Page (movie + role)
    op.create_index(
        'ix_pulses_movie_role',
        'pulses',
        ['linked_movie_id', 'posted_as_role'],
        postgresql_using='btree'
    )
    
    # Index for User Profile tabs (user + role)
    op.create_index(
        'ix_pulses_user_role',
        'pulses',
        ['user_id', 'posted_as_role'],
        postgresql_using='btree'
    )
    
    # Index for soft delete filtering
    op.create_index(
        'ix_pulses_deleted_at',
        'pulses',
        ['deleted_at'],
        postgresql_using='btree'
    )


def downgrade():
    # Drop indexes first
    op.drop_index('ix_pulses_deleted_at', table_name='pulses')
    op.drop_index('ix_pulses_user_role', table_name='pulses')
    op.drop_index('ix_pulses_movie_role', table_name='pulses')
    op.drop_index('ix_pulses_role_created', table_name='pulses')
    
    # Drop check constraint
    op.drop_constraint('ck_pulses_star_rating_range', 'pulses', type_='check')
    
    # Drop columns
    op.drop_column('pulses', 'deleted_at')
    op.drop_column('pulses', 'star_rating')
    op.drop_column('pulses', 'posted_as_role')
