"""add_bio_location_website_to_users

Revision ID: f62516a11780
Revises: 6e013abec488
Create Date: 2025-10-29 20:07:06.586864

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f62516a11780'
down_revision: Union[str, Sequence[str], None] = '6e013abec488'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add bio, location, and website columns to users table
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(length=200), nullable=True))
    op.add_column('users', sa.Column('website', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove bio, location, and website columns from users table
    op.drop_column('users', 'website')
    op.drop_column('users', 'location')
    op.drop_column('users', 'bio')
