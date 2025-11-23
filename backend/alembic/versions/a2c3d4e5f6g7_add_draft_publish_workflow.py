"""add draft/publish workflow fields to movies

Revision ID: a2c3d4e5f6g7
Revises: df12a3b9a6c1
Create Date: 2025-11-02 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a2c3d4e5f6g7"
down_revision: Union[str, Sequence[str], None] = "df12a3b9a6c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add draft/publish workflow fields for all 7 categories"""
    
    # Trivia draft/status
    op.add_column("movies", sa.Column("trivia_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("trivia_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Timeline draft/status
    op.add_column("movies", sa.Column("timeline_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("timeline_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Awards draft/status
    op.add_column("movies", sa.Column("awards_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("awards_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Cast & Crew draft/status
    op.add_column("movies", sa.Column("cast_crew_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("cast_crew_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Media draft/status
    op.add_column("movies", sa.Column("media_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("media_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Streaming draft/status
    op.add_column("movies", sa.Column("streaming_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("streaming_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Basic Info draft/status
    op.add_column("movies", sa.Column("basic_info_draft", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("movies", sa.Column("basic_info_status", sa.String(20), nullable=True, server_default="draft"))
    
    # Create indexes for status fields
    op.create_index("ix_movies_trivia_status", "movies", ["trivia_status"])
    op.create_index("ix_movies_timeline_status", "movies", ["timeline_status"])
    op.create_index("ix_movies_awards_status", "movies", ["awards_status"])
    op.create_index("ix_movies_cast_crew_status", "movies", ["cast_crew_status"])
    op.create_index("ix_movies_media_status", "movies", ["media_status"])
    op.create_index("ix_movies_streaming_status", "movies", ["streaming_status"])
    op.create_index("ix_movies_basic_info_status", "movies", ["basic_info_status"])


def downgrade() -> None:
    """Remove draft/publish workflow fields"""
    
    # Drop indexes
    op.drop_index("ix_movies_basic_info_status", table_name="movies")
    op.drop_index("ix_movies_streaming_status", table_name="movies")
    op.drop_index("ix_movies_media_status", table_name="movies")
    op.drop_index("ix_movies_cast_crew_status", table_name="movies")
    op.drop_index("ix_movies_awards_status", table_name="movies")
    op.drop_index("ix_movies_timeline_status", table_name="movies")
    op.drop_index("ix_movies_trivia_status", table_name="movies")
    
    # Drop columns
    op.drop_column("movies", "basic_info_status")
    op.drop_column("movies", "basic_info_draft")
    op.drop_column("movies", "streaming_status")
    op.drop_column("movies", "streaming_draft")
    op.drop_column("movies", "media_status")
    op.drop_column("movies", "media_draft")
    op.drop_column("movies", "cast_crew_status")
    op.drop_column("movies", "cast_crew_draft")
    op.drop_column("movies", "awards_status")
    op.drop_column("movies", "awards_draft")
    op.drop_column("movies", "timeline_status")
    op.drop_column("movies", "timeline_draft")
    op.drop_column("movies", "trivia_status")
    op.drop_column("movies", "trivia_draft")

