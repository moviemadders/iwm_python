"""add curation fields to movies table

Revision ID: a1b2c3d4e5f7
Revises: df12a3b9a6c1
Create Date: 2025-01-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, Sequence[str], None] = "df12a3b9a6c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add curation fields to movies table"""
    
    # Create enum type for curation_status
    op.execute("""
        CREATE TYPE curation_status_enum AS ENUM (
            'draft',
            'pending_review',
            'approved',
            'rejected'
        )
    """)
    
    # Add curation columns
    op.add_column("movies", sa.Column(
        "curation_status",
        sa.String(20),
        nullable=True,
        default="draft",
        comment="Status of movie curation: draft, pending_review, approved, rejected"
    ))
    
    op.add_column("movies", sa.Column(
        "quality_score",
        sa.Integer(),
        nullable=True,
        comment="Quality score for the movie (0-100)"
    ))
    
    op.add_column("movies", sa.Column(
        "curator_notes",
        sa.Text(),
        nullable=True,
        comment="Notes from the curator about the movie"
    ))
    
    op.add_column("movies", sa.Column(
        "curated_by_id",
        sa.Integer(),
        nullable=True,
        comment="ID of the user who curated this movie"
    ))
    
    op.add_column("movies", sa.Column(
        "curated_at",
        sa.DateTime(),
        nullable=True,
        comment="Timestamp when the movie was curated"
    ))
    
    op.add_column("movies", sa.Column(
        "last_reviewed_at",
        sa.DateTime(),
        nullable=True,
        comment="Timestamp of the last review"
    ))
    
    # Add foreign key constraint for curated_by_id
    op.create_foreign_key(
        "fk_movies_curated_by_id",
        "movies",
        "users",
        ["curated_by_id"],
        ["id"],
        ondelete="SET NULL"
    )
    
    # Add indexes for efficient querying
    op.create_index(
        "ix_movies_curation_status",
        "movies",
        ["curation_status"]
    )

    op.create_index(
        "ix_movies_quality_score",
        "movies",
        ["quality_score"]
    )

    op.create_index(
        "ix_movies_curated_by_id",
        "movies",
        ["curated_by_id"]
    )

    op.create_index(
        "ix_movies_curated_at",
        "movies",
        ["curated_at"]
    )


def downgrade() -> None:
    """Remove curation fields from movies table"""
    
    # Drop indexes
    op.drop_index("ix_movies_curated_at", table_name="movies")
    op.drop_index("ix_movies_curated_by_id", table_name="movies")
    op.drop_index("ix_movies_quality_score", table_name="movies")
    op.drop_index("ix_movies_curation_status", table_name="movies")
    
    # Drop foreign key
    op.drop_constraint("fk_movies_curated_by_id", "movies", type_="foreignkey")
    
    # Drop columns
    op.drop_column("movies", "last_reviewed_at")
    op.drop_column("movies", "curated_at")
    op.drop_column("movies", "curated_by_id")
    op.drop_column("movies", "curator_notes")
    op.drop_column("movies", "quality_score")
    op.drop_column("movies", "curation_status")
    
    # Drop enum type
    op.execute("DROP TYPE curation_status_enum")

