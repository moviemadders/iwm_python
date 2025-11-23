"""add_critic_hub_tables

Revision ID: e8688c242c92
Revises: df12a3b9a6c1
Create Date: 2025-10-23 00:00:25.594893

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8688c242c92'
down_revision: Union[str, Sequence[str], None] = 'df12a3b9a6c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy.dialects.postgresql import JSONB

    # 1. critic_profiles table
    op.create_table(
        'critic_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('external_id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=255), nullable=True),
        sa.Column('banner_url', sa.String(length=255), nullable=True),
        sa.Column('banner_video_url', sa.String(length=255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verification_level', sa.String(length=50), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('follower_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_reviews', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_engagement', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('review_philosophy', sa.Text(), nullable=True),
        sa.Column('equipment_info', sa.Text(), nullable=True),
        sa.Column('background_info', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id'),
        sa.UniqueConstraint('username')
    )
    op.create_index('ix_critic_profiles_external_id', 'critic_profiles', ['external_id'])
    op.create_index('ix_critic_profiles_username', 'critic_profiles', ['username'])
    op.create_index('ix_critic_profiles_user_id', 'critic_profiles', ['user_id'])
    op.create_index('ix_critic_profiles_is_verified', 'critic_profiles', ['is_verified'])

    # 2. critic_social_links table
    op.create_table(
        'critic_social_links',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('critic_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['critic_id'], ['critic_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_critic_social_links_critic_id', 'critic_social_links', ['critic_id'])

    # 3. critic_reviews table
    op.create_table(
        'critic_reviews',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('external_id', sa.String(length=50), nullable=False),
        sa.Column('critic_id', sa.Integer(), nullable=False),
        sa.Column('movie_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('rating_type', sa.String(length=50), nullable=True),
        sa.Column('rating_value', sa.String(length=20), nullable=True),
        sa.Column('numeric_rating', sa.Float(), nullable=True),
        sa.Column('youtube_embed_url', sa.String(length=500), nullable=True),
        sa.Column('image_gallery', JSONB, nullable=False, server_default='[]'),
        sa.Column('watch_links', JSONB, nullable=False, server_default='[]'),
        sa.Column('published_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_draft', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('share_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('slug', sa.String(length=500), nullable=False),
        sa.Column('meta_description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['critic_id'], ['critic_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['movie_id'], ['movies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('ix_critic_reviews_external_id', 'critic_reviews', ['external_id'])
    op.create_index('ix_critic_reviews_critic_id', 'critic_reviews', ['critic_id'])
    op.create_index('ix_critic_reviews_movie_id', 'critic_reviews', ['movie_id'])
    op.create_index('ix_critic_reviews_published_at', 'critic_reviews', ['published_at'])
    op.create_index('ix_critic_reviews_slug', 'critic_reviews', ['slug'])
    op.create_index('ix_critic_reviews_is_draft', 'critic_reviews', ['is_draft'])

    # 4. critic_review_comments table
    op.create_table(
        'critic_review_comments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('external_id', sa.String(length=50), nullable=False),
        sa.Column('review_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['review_id'], ['critic_reviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['critic_review_comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id')
    )
    op.create_index('ix_critic_review_comments_external_id', 'critic_review_comments', ['external_id'])
    op.create_index('ix_critic_review_comments_review_id', 'critic_review_comments', ['review_id'])
    op.create_index('ix_critic_review_comments_user_id', 'critic_review_comments', ['user_id'])
    op.create_index('ix_critic_review_comments_parent_id', 'critic_review_comments', ['parent_id'])

    # 5. critic_followers table
    op.create_table(
        'critic_followers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('critic_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('followed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['critic_id'], ['critic_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('critic_id', 'user_id', name='uq_critic_follower')
    )
    op.create_index('ix_critic_followers_critic_id', 'critic_followers', ['critic_id'])
    op.create_index('ix_critic_followers_user_id', 'critic_followers', ['user_id'])

    # 6. critic_review_likes table
    op.create_table(
        'critic_review_likes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('review_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('liked_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['review_id'], ['critic_reviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('review_id', 'user_id', name='uq_review_like')
    )
    op.create_index('ix_critic_review_likes_review_id', 'critic_review_likes', ['review_id'])
    op.create_index('ix_critic_review_likes_user_id', 'critic_review_likes', ['user_id'])

    # 7. critic_verification_applications table
    op.create_table(
        'critic_verification_applications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('external_id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('requested_username', sa.String(length=100), nullable=False),
        sa.Column('requested_display_name', sa.String(length=200), nullable=False),
        sa.Column('bio', sa.Text(), nullable=False),
        sa.Column('platform_links', JSONB, nullable=False, server_default='[]'),
        sa.Column('metrics', JSONB, nullable=True),
        sa.Column('sample_review_urls', JSONB, nullable=False, server_default='[]'),
        sa.Column('other_platforms', JSONB, nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id')
    )
    op.create_index('ix_critic_verification_applications_external_id', 'critic_verification_applications', ['external_id'])
    op.create_index('ix_critic_verification_applications_user_id', 'critic_verification_applications', ['user_id'])
    op.create_index('ix_critic_verification_applications_status', 'critic_verification_applications', ['status'])
    op.create_index('ix_critic_verification_applications_submitted_at', 'critic_verification_applications', ['submitted_at'])

    # 8. critic_analytics table
    op.create_table(
        'critic_analytics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('critic_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_comments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_shares', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('new_followers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('engagement_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['critic_id'], ['critic_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('critic_id', 'date', name='uq_critic_analytics_date')
    )
    op.create_index('ix_critic_analytics_critic_id', 'critic_analytics', ['critic_id'])
    op.create_index('ix_critic_analytics_date', 'critic_analytics', ['date'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('critic_analytics')
    op.drop_table('critic_verification_applications')
    op.drop_table('critic_review_likes')
    op.drop_table('critic_followers')
    op.drop_table('critic_review_comments')
    op.drop_table('critic_reviews')
    op.drop_table('critic_social_links')
    op.drop_table('critic_profiles')
