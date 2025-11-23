"""Add feature flags table

Revision ID: 001_feature_flags
Revises: 71be9198b431
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_feature_flags'
down_revision = '71be9198b431'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create feature_flags table
    op.create_table(
        'feature_flags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feature_key', sa.String(length=100), nullable=False),
        sa.Column('feature_name', sa.String(length=200), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('feature_key'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL')
    )

    # Create indexes for performance
    op.create_index('idx_feature_flags_enabled', 'feature_flags', ['is_enabled'])
    op.create_index('idx_feature_flags_category', 'feature_flags', ['category'])
    op.create_index('idx_feature_flags_display_order', 'feature_flags', ['display_order'])

    # Seed initial feature flags data
    op.execute("""
        INSERT INTO feature_flags (feature_key, feature_name, is_enabled, category, description, display_order) VALUES
        -- Core Navigation (4 features)
        ('home', 'Home', true, 'core_navigation', 'Homepage with movie sections', 1),
        ('explore', 'Explore', true, 'core_navigation', 'Browse movies by categories', 2),
        ('movies', 'Movies', true, 'core_navigation', 'Movie listing and search', 3),
        ('search', 'Search', true, 'core_navigation', 'Global search functionality', 4),
        
        -- Content Features (10 features)
        ('visual_treats', 'Visual Treats', false, 'content', 'Cinematic moments and visual treats', 10),
        ('cricket', 'Cricket', false, 'content', 'Cricket content and updates', 11),
        ('scene_explorer', 'Scene Explorer', false, 'content', 'Explore memorable movie scenes', 12),
        ('awards', 'Awards', false, 'content', 'Movie awards and nominations', 13),
        ('festivals', 'Festivals', false, 'content', 'Film festivals and events', 14),
        ('box_office', 'Box Office', false, 'content', 'Box office data and statistics', 15),
        ('movie_calendar', 'Movie Calendar', false, 'content', 'Movie release calendar', 16),
        ('quiz_system', 'Quiz System', false, 'content', 'Movie quizzes and trivia', 17),
        ('people', 'People Directory', true, 'content', 'Cast and crew directory', 18),
        ('tv_shows', 'TV Shows', false, 'content', 'TV shows and series', 19),
        
        -- Community Features (3 features)
        ('pulse', 'Pulse', false, 'community', 'Social feed and community posts', 20),
        ('talent_hub', 'Talent Hub', false, 'community', 'Talent profiles and portfolios', 21),
        ('industry_hub', 'Industry Hub', false, 'community', 'Industry professionals network', 22),
        
        -- Personal Features (5 features)
        ('profile', 'My Profile', true, 'personal', 'User profile and activity', 30),
        ('watchlist', 'Watchlist', true, 'personal', 'Movies to watch later', 31),
        ('favorites', 'Favorites', true, 'personal', 'Favorite movies collection', 32),
        ('collections', 'Collections', true, 'personal', 'Custom movie collections', 33),
        ('notifications', 'Notifications', true, 'personal', 'User notifications', 34),
        
        -- Critic Features (4 features)
        ('critics_directory', 'Critics Directory', false, 'critic', 'Browse verified critics', 40),
        ('critic_applications', 'Apply as Critic', false, 'critic', 'Critic application form', 41),
        ('critic_dashboard', 'Critic Dashboard', false, 'critic', 'Critic management dashboard', 42),
        ('critic_profile', 'Critic Profile', false, 'critic', 'Individual critic profiles', 43),
        
        -- Discovery Features (4 features)
        ('compare_movies', 'Compare Movies', false, 'discovery', 'Compare multiple movies', 50),
        ('recent_views', 'Recent Views', false, 'discovery', 'Recently viewed movies', 51),
        ('search_demo', 'Search Demo', false, 'discovery', 'Search demo page', 52),
        ('dashboard', 'User Dashboard', false, 'discovery', 'User activity dashboard', 53),
        
        -- Settings Features (10 features)
        ('settings_profile', 'Profile Settings', true, 'settings', 'Edit profile information', 60),
        ('settings_account', 'Account Settings', true, 'settings', 'Account security settings', 61),
        ('settings_privacy', 'Privacy Settings', true, 'settings', 'Privacy and data controls', 62),
        ('settings_display', 'Display Settings', true, 'settings', 'Display preferences', 63),
        ('settings_preferences', 'Preferences', true, 'settings', 'User preferences', 64),
        ('settings_notifications', 'Notification Preferences', true, 'settings', 'Notification settings', 65),
        ('settings_roles', 'Roles Management', false, 'settings', 'User role selection', 66),
        ('settings_critic', 'Critic Settings', false, 'settings', 'Critic-specific settings', 67),
        ('settings_talent', 'Talent Settings', false, 'settings', 'Talent-specific settings', 68),
        ('settings_industry', 'Industry Settings', false, 'settings', 'Industry professional settings', 69),
        
        -- Support Features (2 features)
        ('help_center', 'Help Center', true, 'support', 'Help and support resources', 70),
        ('landing_page', 'Landing Page', false, 'support', 'Public landing page', 71),
        
        -- Review Features (2 features)
        ('reviews', 'Reviews', true, 'reviews', 'User reviews and ratings', 80),
        ('movie_reviews', 'Movie Reviews', true, 'reviews', 'Movie-specific reviews', 81)
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_feature_flags_display_order', table_name='feature_flags')
    op.drop_index('idx_feature_flags_category', table_name='feature_flags')
    op.drop_index('idx_feature_flags_enabled', table_name='feature_flags')
    
    # Drop table
    op.drop_table('feature_flags')

