"""add_mentioned_movies_to_pulses

Revision ID: 805bc3415044
Revises: e9f4a2b8c7d6
Create Date: 2025-11-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '805bc3415044'
down_revision = 'ebf089c70aa9'
branch_labels = None
depends_on = None


def upgrade():
    # Add mentioned_movies JSON column to pulses table
    op.add_column('pulses', sa.Column('mentioned_movies', postgresql.JSONB, nullable=True))
    
    # Add GIN index for mentioned_movies for faster queries
    op.execute("""
        CREATE INDEX idx_pulses_mentioned_movies 
        ON pulses USING GIN (mentioned_movies)
        WHERE mentioned_movies IS NOT NULL
    """)


def downgrade():
    op.drop_index('idx_pulses_mentioned_movies', table_name='pulses')
    op.drop_column('pulses', 'mentioned_movies')
