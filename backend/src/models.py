from __future__ import annotations

from typing import List
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, ForeignKey, Integer, Table, Column, Text, Float, Boolean, DateTime, UniqueConstraint, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.types import JSON, TypeDecorator
from .config import settings

# Monkeypatch for SQLite
if "sqlite" in (settings.database_url or ""):
    class SQLiteArray(TypeDecorator):
        impl = JSON
        def process_bind_param(self, value, dialect):
            return value
        def process_result_value(self, value, dialect):
            return value
            
    JSONB = JSON
    ARRAY = SQLiteArray


# Enums for multi-role profile system
class RoleType(str, PyEnum):
    """Enum for user role types in multi-role profile system"""
    LOVER = "lover"
    CRITIC = "critic"
    TALENT = "talent"
    INDUSTRY = "industry"
    MODERATOR = "moderator"
    ADMIN = "admin"


class ProfileVisibility(str, PyEnum):
    """Enum for role profile visibility settings"""
    PUBLIC = "public"
    PRIVATE = "private"
    FOLLOWERS_ONLY = "followers_only"


class CurationStatus(str, PyEnum):
    """Enum for movie curation status"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"


movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column("movie_id", ForeignKey("movies.id"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id"), primary_key=True),
)

movie_people = Table(
    "movie_people",
    Base.metadata,
    Column("movie_id", ForeignKey("movies.id"), primary_key=True),
    Column("person_id", ForeignKey("people.id"), primary_key=True),
    Column("role", String(20), nullable=False, default="actor"),
    Column("character_name", String(100), nullable=True),
)

collection_movies = Table(
    "collection_movies",
    Base.metadata,
    Column("collection_id", ForeignKey("collections.id"), primary_key=True),
    Column("movie_id", ForeignKey("movies.id"), primary_key=True),
)

collection_likes = Table(
    "collection_likes",
    Base.metadata,
    Column("collection_id", ForeignKey("collections.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)







class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))

    movies: Mapped[List["Movie"]] = relationship(
        back_populates="genres",
        secondary=movie_genres,
        lazy="selectin",
    )


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    tmdb_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    year: Mapped[str | None] = mapped_column(String(4), nullable=True)
    release_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    runtime: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Ratings and scores
    siddu_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    critics_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    imdb_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    rotten_tomatoes_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Content info
    rating: Mapped[str | None] = mapped_column(String(10), nullable=True)  # PG-13, R, etc.
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(50), nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Images
    poster_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    backdrop_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Financial
    budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    revenue: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Status
    status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="released")  # released, upcoming, in-production

    # Rich content (admin-only authoring) - Published
    trivia: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    timeline: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    awards: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Rich content - Draft versions for draft/publish workflow
    trivia_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    trivia_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    timeline_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    timeline_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    awards_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    awards_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    cast_crew_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    cast_crew_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    media_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    media_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    streaming_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    streaming_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    basic_info_draft: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    basic_info_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")

    # Curation fields (Phase 2)
    curation_status: Mapped[str | None] = mapped_column(String(20), nullable=True, default="draft")
    quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    curator_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    curated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    curated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    curated_by: Mapped["User | None"] = relationship(lazy="selectin")

    genres: Mapped[List[Genre]] = relationship(
        back_populates="movies",
        secondary=movie_genres,
        lazy="selectin",
    )

    people: Mapped[List["Person"]] = relationship(
        secondary=movie_people,
        back_populates="movies",
        lazy="selectin",
    )


class Person(Base):
    __tablename__ = "people"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    movies: Mapped[List["Movie"]] = relationship(
        secondary=movie_people,
        back_populates="people",
        lazy="selectin",
    )


# Association table for scene genres
scene_genres = Table(
    "scene_genres",
    Base.metadata,
    Column("scene_id", ForeignKey("scenes.id"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id"), primary_key=True),
)


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    duration_str: Mapped[str | None] = mapped_column(String(20), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    scene_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    director: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cinematographer: Mapped[str | None] = mapped_column(String(100), nullable=True)

    view_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    is_visual_treat: Mapped[bool] = mapped_column(Boolean, default=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    movie: Mapped["Movie"] = relationship(lazy="selectin")

    genres: Mapped[List["Genre"]] = relationship(
        secondary=scene_genres,
        lazy="selectin",
    )



class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    active_role: Mapped[str | None] = mapped_column(String(50), nullable=True, default="lover")  # Current active role for multi-role users
    username: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    reviews: Mapped[List["Review"]] = relationship(back_populates="author", lazy="selectin")
    critic_profile: Mapped["CriticProfile | None"] = relationship(back_populates="user", uselist=False, lazy="selectin")
    role_profiles: Mapped[List["UserRoleProfile"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    talent_profile: Mapped["TalentProfile | None"] = relationship(back_populates="user", uselist=False, lazy="selectin")
    industry_profile: Mapped["IndustryProfile | None"] = relationship(back_populates="user", uselist=False, lazy="selectin")


class UserRoleProfile(Base):
    """
    Multi-role profile system: allows users to have separate profiles for different roles.
    Each user can have one profile per role_type (e.g., one 'lover' profile, one 'critic' profile).
    Only one role profile per user can be marked as is_default=true.
    """
    __tablename__ = "user_role_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_type: Mapped[str] = mapped_column(String(20), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    visibility: Mapped[str] = mapped_column(String(20), nullable=False, default="public")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    handle: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="role_profiles", lazy="selectin")


class TalentProfile(Base):
    """
    Talent profile for users in the 'talent' role (actors, actresses, voice actors, stunt performers).
    Stores professional information including headshots, demo reels, IMDb links, and agent contact info.
    """
    __tablename__ = "talent_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    role_profile_id: Mapped[int | None] = mapped_column(ForeignKey("user_role_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    stage_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    headshot_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_reel_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    imdb_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    agent_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    agent_contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    skills: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    availability_status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="available")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="talent_profile", lazy="selectin")
    role_profile: Mapped["UserRoleProfile | None"] = relationship(lazy="selectin")


class IndustryProfile(Base):
    """
    Industry profile for users in the 'industry' role (producers, directors, cinematographers, etc.).
    Stores professional information including company details, notable works, and specializations.
    """
    __tablename__ = "industry_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    role_profile_id: Mapped[int | None] = mapped_column(ForeignKey("user_role_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    imdb_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notable_works: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    specializations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accepting_projects: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="industry_profile", lazy="selectin")
    role_profile: Mapped["UserRoleProfile | None"] = relationship(lazy="selectin")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(Float)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    has_spoilers: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    helpful_votes: Mapped[int] = mapped_column(Integer, default=0)
    unhelpful_votes: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    engagement_score: Mapped[int] = mapped_column(Integer, default=0)
    media_urls: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array as text
    gif_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # GIF URL from Tenor/Giphy

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))

    author: Mapped["User"] = relationship(back_populates="reviews", lazy="selectin")
    movie: Mapped["Movie"] = relationship(lazy="selectin")


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    followers: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array as text
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    creator: Mapped["User"] = relationship(lazy="selectin")
    movies: Mapped[List["Movie"]] = relationship(secondary=collection_movies, lazy="selectin")


class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        UniqueConstraint("user_id", "movie_id", name="uq_watchlist_user_movie"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    date_added: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(20), default="want-to-watch")  # want-to-watch, watching, watched
    priority: Mapped[str] = mapped_column(String(10), default="medium")  # high, medium, low
    progress: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))

    user: Mapped["User"] = relationship(lazy="selectin")
    movie: Mapped["Movie"] = relationship(lazy="selectin")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(20))  # movie, person, scene, article
    added_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    person_id: Mapped[int | None] = mapped_column(ForeignKey("people.id"), nullable=True)

    user: Mapped["User"] = relationship(lazy="selectin")
    movie: Mapped["Movie | None"] = relationship(lazy="selectin")
    person: Mapped["Person | None"] = relationship(lazy="selectin")





class AwardCeremony(Base):
    """
    Award ceremonies (e.g., Oscars, Filmfare, National Film Awards).
    Enhanced to support Indian and international awards with multi-language support.
    """
    __tablename__ = "award_ceremonies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # e.g., "oscars", "filmfare-hindi", "national-film-awards"
    name: Mapped[str] = mapped_column(String(200))
    short_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    background_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_ceremony_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # New fields for Indian awards support
    country: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # India, USA, UK, International
    language: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # Hindi, Tamil, Telugu, Malayalam, etc.
    category_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # Film, Television, Music, OTT
    prestige_level: Mapped[str | None] = mapped_column(String(50), nullable=True)  # national, state, industry, international
    established_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=True, index=True)
    display_order: Mapped[int | None] = mapped_column(Integer, nullable=True)

    years: Mapped[List["AwardCeremonyYear"]] = relationship(back_populates="ceremony", lazy="selectin")


class AwardCeremonyYear(Base):
    __tablename__ = "award_ceremony_years"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)  # e.g., "oscars-2024"
    year: Mapped[int] = mapped_column(Integer)
    date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hosted_by: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array as text
    background_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    highlights: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array as text

    ceremony_id: Mapped[int] = mapped_column(ForeignKey("award_ceremonies.id"))
    ceremony: Mapped["AwardCeremony"] = relationship(back_populates="years", lazy="selectin")

    categories: Mapped[List["AwardCategory"]] = relationship(back_populates="ceremony_year", lazy="selectin")


class AwardCategory(Base):
    __tablename__ = "award_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))

    ceremony_year_id: Mapped[int] = mapped_column(ForeignKey("award_ceremony_years.id"))
    ceremony_year: Mapped["AwardCeremonyYear"] = relationship(back_populates="categories", lazy="selectin")

    nominations: Mapped[List["AwardNomination"]] = relationship(back_populates="category", lazy="selectin")


class AwardNomination(Base):
    __tablename__ = "award_nominations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    nominee_type: Mapped[str] = mapped_column(String(30))  # movie | person | song | screenplay
    nominee_name: Mapped[str] = mapped_column(String(200))
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    entity_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)

    category_id: Mapped[int] = mapped_column(ForeignKey("award_categories.id"))
    category: Mapped["AwardCategory"] = relationship(back_populates="nominations", lazy="selectin")

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    person_id: Mapped[int | None] = mapped_column(ForeignKey("people.id"), nullable=True)

    movie: Mapped["Movie | None"] = relationship(lazy="selectin")
    person: Mapped["Person | None"] = relationship(lazy="selectin")



# Box Office domain models
class BoxOfficeWeekendEntry(Base):
    __tablename__ = "box_office_weekend_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    period_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rank: Mapped[int] = mapped_column(Integer)

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    movie: Mapped["Movie | None"] = relationship(lazy="selectin")

    weekend_gross_usd: Mapped[float] = mapped_column(Float)
    total_gross_usd: Mapped[float] = mapped_column(Float)
    change_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_positive: Mapped[bool] = mapped_column(Boolean, default=True)
    weeks_in_release: Mapped[int | None] = mapped_column(Integer, nullable=True)
    poster_url: Mapped[str | None] = mapped_column(String(255), nullable=True)


class BoxOfficeTrendPoint(Base):
    __tablename__ = "box_office_trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    date: Mapped[datetime] = mapped_column(DateTime)
    gross_millions_usd: Mapped[float] = mapped_column(Float)


class BoxOfficeYTD(Base):
    __tablename__ = "box_office_ytd"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    year: Mapped[int] = mapped_column(Integer, index=True)
    total_gross_usd: Mapped[float] = mapped_column(Float)
    change_percent: Mapped[float] = mapped_column(Float)
    is_positive: Mapped[bool] = mapped_column(Boolean, default=True)
    previous_year: Mapped[int] = mapped_column(Integer)
    previous_total_gross_usd: Mapped[float] = mapped_column(Float)

    top_movies: Mapped[List["BoxOfficeYTDTopMovie"]] = relationship(back_populates="ytd", lazy="selectin")


class BoxOfficeYTDTopMovie(Base):
    __tablename__ = "box_office_ytd_top_movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ytd_id: Mapped[int] = mapped_column(ForeignKey("box_office_ytd.id"))
    title: Mapped[str] = mapped_column(String(200))
    gross_usd: Mapped[float] = mapped_column(Float)

    ytd: Mapped["BoxOfficeYTD"] = relationship(back_populates="top_movies", lazy="selectin")


class BoxOfficeRecord(Base):
    __tablename__ = "box_office_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    category: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(200))
    value_text: Mapped[str] = mapped_column(String(50))
    year: Mapped[str] = mapped_column(String(10))
    poster_url: Mapped[str | None] = mapped_column(String(255), nullable=True)


class BoxOfficePerformanceGenre(Base):
    __tablename__ = "box_office_perf_genre"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    name: Mapped[str] = mapped_column(String(100))
    percent: Mapped[int] = mapped_column(Integer)
    color: Mapped[str] = mapped_column(String(20))


class BoxOfficePerformanceStudio(Base):
    __tablename__ = "box_office_perf_studio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    studio: Mapped[str] = mapped_column(String(100))
    gross_millions_usd: Mapped[float] = mapped_column(Float)


class BoxOfficePerformanceMonthly(Base):
    __tablename__ = "box_office_perf_monthly"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(50), index=True, default="global")
    month: Mapped[str] = mapped_column(String(10))
    gross_millions_usd: Mapped[float] = mapped_column(Float)



# Festivals domain models
class Festival(Base):
    __tablename__ = "festivals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # e.g., "cannes"
    name: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    founding_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    editions: Mapped[List["FestivalEdition"]] = relationship(back_populates="festival", lazy="selectin")


class FestivalEdition(Base):
    __tablename__ = "festival_editions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)  # e.g., "cannes-2024"
    year: Mapped[int] = mapped_column(Integer)
    edition_label: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "77th"
    dates: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # upcoming | live | past

    festival_id: Mapped[int] = mapped_column(ForeignKey("festivals.id"))
    festival: Mapped["Festival"] = relationship(back_populates="editions", lazy="selectin")

    program_sections: Mapped[List["FestivalProgramSection"]] = relationship(back_populates="edition", lazy="selectin")
    winner_categories: Mapped[List["FestivalWinnerCategory"]] = relationship(back_populates="edition", lazy="selectin")


class FestivalProgramSection(Base):
    __tablename__ = "festival_program_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80))  # competition | outOfCompetition | specialScreenings

    edition_id: Mapped[int] = mapped_column(ForeignKey("festival_editions.id"))
    edition: Mapped["FestivalEdition"] = relationship(back_populates="program_sections", lazy="selectin")

    entries: Mapped[List["FestivalProgramEntry"]] = relationship(back_populates="section", lazy="selectin")


class FestivalProgramEntry(Base):
    __tablename__ = "festival_program_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    director: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    premiere: Mapped[str | None] = mapped_column(String(50), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    movie: Mapped["Movie | None"] = relationship(lazy="selectin")

    section_id: Mapped[int] = mapped_column(ForeignKey("festival_program_sections.id"))
    section: Mapped["FestivalProgramSection"] = relationship(back_populates="entries", lazy="selectin")


class FestivalWinnerCategory(Base):
    __tablename__ = "festival_winner_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)  # e.g., "palme-dor"
    name: Mapped[str] = mapped_column(String(200))

    edition_id: Mapped[int] = mapped_column(ForeignKey("festival_editions.id"))
    edition: Mapped["FestivalEdition"] = relationship(back_populates="winner_categories", lazy="selectin")

    winners: Mapped[List["FestivalWinner"]] = relationship(back_populates="category", lazy="selectin")


class FestivalWinner(Base):
    __tablename__ = "festival_winners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    movie_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    movie_poster_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(100), nullable=True)
    director: Mapped[str | None] = mapped_column(String(100), nullable=True)
    citation: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    movie: Mapped["Movie | None"] = relationship(lazy="selectin")

    category_id: Mapped[int] = mapped_column(ForeignKey("festival_winner_categories.id"))
    category: Mapped["FestivalWinnerCategory"] = relationship(back_populates="winners", lazy="selectin")



# Visual Treats domain models
visual_treat_tags = Table(
    "visual_treat_tags",
    Base.metadata,
    Column("treat_id", ForeignKey("visual_treats.id"), primary_key=True),
    Column("tag_id", ForeignKey("visual_treat_tag_lookup.id"), primary_key=True),
)


class VisualTreatTagLookup(Base):
    __tablename__ = "visual_treat_tag_lookup"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)


class VisualTreat(Base):
    __tablename__ = "visual_treats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    category: Mapped[str] = mapped_column(String(80))
    director: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cinematographer: Mapped[str | None] = mapped_column(String(100), nullable=True)

    color_palette: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of hex strings
    likes: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)

    aspect_ratio: Mapped[str | None] = mapped_column(String(20), nullable=True)
    resolution: Mapped[str | None] = mapped_column(String(50), nullable=True)
    submitted_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    scene_id: Mapped[int | None] = mapped_column(ForeignKey("scenes.id"), nullable=True)

    movie: Mapped["Movie | None"] = relationship(lazy="selectin")
    scene: Mapped["Scene | None"] = relationship(lazy="selectin")

    tags: Mapped[List["VisualTreatTagLookup"]] = relationship(
        secondary=visual_treat_tags,
        lazy="selectin",
    )



# Pulse domain models
class UserFollow(Base):
    __tablename__ = "user_follows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Pulse(Base):
    __tablename__ = "pulses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(lazy="selectin")

    content_text: Mapped[str] = mapped_column(Text)
    content_media: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of {type,url,thumbnailUrl}

    linked_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # movie | cricket
    linked_external_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    linked_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    linked_poster_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linked_movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    linked_movie: Mapped["Movie | None"] = relationship(lazy="selectin")

    hashtags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of strings

    reactions_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON object with reaction counts
    reactions_total: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    shares_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    reactions: Mapped[List["PulseReaction"]] = relationship(back_populates="pulse", cascade="all, delete-orphan", lazy="selectin")
    comments: Mapped[List["PulseComment"]] = relationship(back_populates="pulse", cascade="all, delete-orphan", lazy="selectin")

class PulseReaction(Base):
    __tablename__ = "pulse_reactions"
    __table_args__ = (
        UniqueConstraint("user_id", "pulse_id", name="uq_pulse_reaction_user_pulse"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pulse_id: Mapped[int] = mapped_column(ForeignKey("pulses.id"))
    type: Mapped[str] = mapped_column(String(20))  # love, fire, mindblown, laugh, sad, angry
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(lazy="selectin")
    pulse: Mapped["Pulse"] = relationship(back_populates="reactions", lazy="selectin")


class PulseComment(Base):
    __tablename__ = "pulse_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pulse_id: Mapped[int] = mapped_column(ForeignKey("pulses.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship(lazy="selectin")
    pulse: Mapped["Pulse"] = relationship(back_populates="comments", lazy="selectin")


class PulseBookmark(Base):
    __tablename__ = "pulse_bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "pulse_id", name="uq_pulse_bookmark_user_pulse"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pulse_id: Mapped[int] = mapped_column(ForeignKey("pulses.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(lazy="selectin")
    pulse: Mapped["Pulse"] = relationship(lazy="selectin")




class TrendingTopic(Base):
    __tablename__ = "trending_topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str | None] = mapped_column(String(20), nullable=True)  # movie | cricket | event | general
    window_label: Mapped[str] = mapped_column(String(10), default="7d")
    count: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)



# Quiz domain models
class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    number_of_questions: Mapped[int] = mapped_column(Integer, default=10)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pass_score: Mapped[int] = mapped_column(Integer, default=70)
    is_verification_required: Mapped[bool] = mapped_column(Boolean, default=True)
    is_randomized: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)

    movie_id: Mapped[int | None] = mapped_column(ForeignKey("movies.id"), nullable=True)
    movie: Mapped["Movie | None"] = relationship(lazy="selectin")

    questions: Mapped[List["QuizQuestion"]] = relationship(back_populates="quiz", lazy="selectin", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    quiz: Mapped["Quiz"] = relationship(back_populates="questions", lazy="selectin")

    text: Mapped[str] = mapped_column(Text)
    media_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    media_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # image | video | audio
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    points: Mapped[int] = mapped_column(Integer, default=10)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str] = mapped_column(String(30), default="multiple-choice")  # multiple-choice | true-false | multiple-select

    options: Mapped[List["QuizQuestionOption"]] = relationship(back_populates="question", lazy="selectin", cascade="all, delete-orphan")


class QuizQuestionOption(Base):
    __tablename__ = "quiz_question_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"))
    question: Mapped["QuizQuestion"] = relationship(back_populates="options", lazy="selectin")

    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    score_percent: Mapped[int] = mapped_column(Integer, default=0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)

    answers: Mapped[List["QuizAnswer"]] = relationship(back_populates="attempt", lazy="selectin", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    attempt_id: Mapped[int] = mapped_column(ForeignKey("quiz_attempts.id"))
    attempt: Mapped["QuizAttempt"] = relationship(back_populates="answers", lazy="selectin")

    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"))
    question: Mapped["QuizQuestion"] = relationship(lazy="selectin")

    selected_option_ids: Mapped[str] = mapped_column(Text)  # JSON array of option external_ids
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)


class QuizLeaderboardEntry(Base):
    __tablename__ = "quiz_leaderboard_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    score_percent: Mapped[int] = mapped_column(Integer)
    completion_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)



# Talent Hub domain models
from sqlalchemy.dialects.postgresql import JSONB

class CastingCall(Base):
    __tablename__ = "casting_calls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    project_title: Mapped[str] = mapped_column(String(200))
    project_type: Mapped[str] = mapped_column(String(30), index=True)  # feature | short | tv-series | web-series | commercial | documentary
    production_company: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)

    production_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    production_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    location_city: Mapped[str] = mapped_column(String(120))
    location_state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location_country: Mapped[str] = mapped_column(String(120), index=True)

    budget_range: Mapped[str | None] = mapped_column(String(20), nullable=True)  # low | medium | high | undisclosed
    visibility: Mapped[str] = mapped_column(String(20), default="public", index=True)  # public | private

    submission_deadline: Mapped[datetime] = mapped_column(DateTime)
    posted_date: Mapped[datetime] = mapped_column(DateTime, index=True)

    poster_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)  # active | closed | draft

    roles: Mapped[List["CastingCallRole"]] = relationship(back_populates="call", lazy="selectin", cascade="all, delete-orphan")
    guidelines: Mapped[SubmissionGuidelines | None] = relationship(back_populates="call", lazy="selectin", uselist=False, cascade="all, delete-orphan")


class CastingCallRole(Base):
    __tablename__ = "casting_call_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    call_id: Mapped[int] = mapped_column(ForeignKey("casting_calls.id", ondelete="CASCADE"))
    call: Mapped["CastingCall"] = relationship(back_populates="roles", lazy="selectin")

    type: Mapped[str] = mapped_column(String(20), index=True)  # acting | crew
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50))
    department: Mapped[str | None] = mapped_column(String(80), nullable=True)

    compensation: Mapped[str] = mapped_column(String(20))  # paid | unpaid | deferred | credit-only
    payment_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # JSON: ageRange, gender, ethnicity, languages, skills, experienceLevel, unionStatus, physicalAttributes
    audition_type: Mapped[str] = mapped_column(String(20))  # in-person | self-tape | video-call


class SubmissionGuidelines(Base):
    __tablename__ = "submission_guidelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    call_id: Mapped[int] = mapped_column(ForeignKey("casting_calls.id", ondelete="CASCADE"), unique=True)
    call: Mapped["CastingCall"] = relationship(back_populates="guidelines", lazy="selectin")

    required_materials: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    submission_method: Mapped[str] = mapped_column(String(20))  # siddu | email | website
    contact_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)


# --- Admin domain models ---
from sqlalchemy.dialects.postgresql import JSONB as _JSONB

class AdminUserMeta(Base):
    __tablename__ = "admin_user_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)

    email: Mapped[str] = mapped_column(String(200), index=True)
    roles: Mapped[list] = mapped_column(_JSONB, default=list)  # ["User", "Admin", ...]
    status: Mapped[str] = mapped_column(String(20), default="Active", index=True)

    joined_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    profile_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    verification_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    account_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(40), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)

    user: Mapped["User"] = relationship(lazy="selectin")


class ModerationItem(Base):
    __tablename__ = "moderation_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    content_type: Mapped[str] = mapped_column(String(20), index=True)  # review | comment | pulse
    content_title: Mapped[str] = mapped_column(String(255))
    report_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending | flagged | resolved
    reporter_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    content_ref: Mapped[str | None] = mapped_column(String(80), nullable=True)  # external id of review/comment/pulse

    actions: Mapped[List["ModerationAction"]] = relationship(back_populates="item", lazy="selectin", cascade="all, delete-orphan")


class ModerationAction(Base):
    __tablename__ = "moderation_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    item_id: Mapped[int] = mapped_column(ForeignKey("moderation_items.id", ondelete="CASCADE"), index=True)
    moderator_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    action: Mapped[str] = mapped_column(String(20))  # approve | reject | escalate
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    item: Mapped["ModerationItem"] = relationship(back_populates="actions", lazy="selectin")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(40), unique=True, index=True, default="default")
    data: Mapped[dict] = mapped_column(_JSONB, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdminMetricSnapshot(Base):
    __tablename__ = "admin_metric_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    metrics: Mapped[dict] = mapped_column(_JSONB, default=dict)



# --- Notifications domain models ---
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(20), index=True)  # social | release | system | club | quiz
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    action_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    meta: Mapped[dict | None] = mapped_column("metadata", _JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    user: Mapped["User"] = relationship(lazy="selectin")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)

    channels: Mapped[dict] = mapped_column(_JSONB, default=dict)  # per-category: { social: {inApp,email,push}, ... }
    global_settings: Mapped[dict] = mapped_column(_JSONB, default=dict)  # {emailFrequency, pushEnabled, ...}
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(lazy="selectin")




# Streaming Platform models
class StreamingPlatform(Base):
    __tablename__ = "streaming_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    streaming_options: Mapped[List["MovieStreamingOption"]] = relationship(back_populates="platform", lazy="selectin")


class MovieStreamingOption(Base):
    __tablename__ = "movie_streaming_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    platform_id: Mapped[int] = mapped_column(ForeignKey("streaming_platforms.id"))

    region: Mapped[str] = mapped_column(String(10), index=True)  # US, UK, IN, AU, etc.
    type: Mapped[str] = mapped_column(String(20))  # subscription, rent, buy, free
    price: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "$3.99", "₹99", etc.
    quality: Mapped[str | None] = mapped_column(String(10), nullable=True)  # HD, 4K, SD
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    movie: Mapped["Movie"] = relationship(lazy="selectin")
    platform: Mapped["StreamingPlatform"] = relationship(back_populates="streaming_options", lazy="selectin")


# --- Settings domain models ---
class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)

    account: Mapped[dict] = mapped_column(_JSONB, default=dict)       # name, email, phone, avatar, bio, etc.
    profile: Mapped[dict] = mapped_column(_JSONB, default=dict)       # username, fullName, avatarUrl, bio
    privacy: Mapped[dict] = mapped_column(_JSONB, default=dict)       # profileVisibility, activitySharing, messageRequests, dataDownloadRequested
    display: Mapped[dict] = mapped_column(_JSONB, default=dict)       # theme, fontSize, highContrastMode, reduceMotion
    preferences: Mapped[dict] = mapped_column(_JSONB, default=dict)   # language, region, hideSpoilers, excludedGenres, contentRating
    security: Mapped[dict] = mapped_column(_JSONB, default=dict)      # twoFactorEnabled, loginNotifications
    integrations: Mapped[dict] = mapped_column(_JSONB, default=dict)  # connected apps statuses
    data: Mapped[dict] = mapped_column(_JSONB, default=dict)          # data export/deletion requests

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(lazy="selectin")


# --- Critic Hub domain models ---
class CriticProfile(Base):
    __tablename__ = "critic_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    role_profile_id: Mapped[int | None] = mapped_column(ForeignKey("user_role_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    banner_video_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    verification_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)  # Admin can suspend/activate critics
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    avg_engagement: Mapped[float] = mapped_column(Float, default=0.0)
    total_views: Mapped[int] = mapped_column(Integer, default=0)
    review_philosophy: Mapped[str | None] = mapped_column(Text, nullable=True)
    equipment_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    background_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="critic_profile", lazy="selectin")
    role_profile: Mapped["UserRoleProfile | None"] = relationship(lazy="selectin")
    social_links: Mapped[List["CriticSocialLink"]] = relationship(back_populates="critic", cascade="all, delete-orphan", lazy="selectin")
    reviews: Mapped[List["CriticReview"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    followers: Mapped[List["CriticFollower"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    analytics: Mapped[List["CriticAnalytics"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    blog_posts: Mapped[List["CriticBlogPost"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    recommendations: Mapped[List["CriticRecommendation"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    pinned_content: Mapped[List["CriticPinnedContent"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    affiliate_links: Mapped[List["CriticAffiliateLink"]] = relationship(back_populates="critic", cascade="all, delete-orphan")
    brand_deals: Mapped[List["CriticBrandDeal"]] = relationship(back_populates="critic", cascade="all, delete-orphan")


class CriticSocialLink(Base):
    __tablename__ = "critic_social_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)
    platform: Mapped[str] = mapped_column(String(50))
    url: Mapped[str] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="social_links", lazy="selectin")


class CriticReview(Base):
    __tablename__ = "critic_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    rating_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    rating_value: Mapped[str | None] = mapped_column(String(20), nullable=True)
    numeric_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    youtube_embed_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_gallery: Mapped[list] = mapped_column(JSONB, default=list)
    watch_links: Mapped[list] = mapped_column(JSONB, default=list)
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    share_count: Mapped[int] = mapped_column(Integer, default=0)
    slug: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="reviews", lazy="selectin")
    movie: Mapped["Movie"] = relationship(lazy="selectin")
    comments: Mapped[List["CriticReviewComment"]] = relationship(back_populates="review", cascade="all, delete-orphan")
    likes: Mapped[List["CriticReviewLike"]] = relationship(back_populates="review", cascade="all, delete-orphan")
    sponsor_disclosure: Mapped["CriticSponsorDisclosure | None"] = relationship(back_populates="review", uselist=False)


class CriticReviewComment(Base):
    __tablename__ = "critic_review_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("critic_reviews.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("critic_review_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    review: Mapped["CriticReview"] = relationship(back_populates="comments", lazy="selectin")
    user: Mapped["User"] = relationship(lazy="selectin")
    parent: Mapped["CriticReviewComment | None"] = relationship(remote_side=[id], lazy="selectin")
    replies: Mapped[List["CriticReviewComment"]] = relationship(back_populates="parent", cascade="all, delete-orphan")


class CriticFollower(Base):
    __tablename__ = "critic_followers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    followed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="followers", lazy="selectin")
    user: Mapped["User"] = relationship(lazy="selectin")


class CriticReviewLike(Base):
    __tablename__ = "critic_review_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("critic_reviews.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    liked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    review: Mapped["CriticReview"] = relationship(back_populates="likes", lazy="selectin")
    user: Mapped["User"] = relationship(lazy="selectin")


class CriticVerificationApplication(Base):
    __tablename__ = "critic_verification_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    requested_username: Mapped[str] = mapped_column(String(100))
    requested_display_name: Mapped[str] = mapped_column(String(200))
    bio: Mapped[str] = mapped_column(Text)
    platform_links: Mapped[list] = mapped_column(JSONB, default=list)
    metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    sample_review_urls: Mapped[list] = mapped_column(JSONB, default=list)
    other_platforms: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id], lazy="selectin")
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by], lazy="selectin")


class CriticAnalytics(Base):
    __tablename__ = "critic_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    total_views: Mapped[int] = mapped_column(Integer, default=0)
    total_likes: Mapped[int] = mapped_column(Integer, default=0)
    total_comments: Mapped[int] = mapped_column(Integer, default=0)
    total_shares: Mapped[int] = mapped_column(Integer, default=0)
    new_followers: Mapped[int] = mapped_column(Integer, default=0)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="analytics", lazy="selectin")


class CriticBlogPost(Base):
    """Blog posts written by critics"""
    __tablename__ = "critic_blog_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(250), unique=True, index=True)
    content: Mapped[str] = mapped_column(Text)  # Markdown
    excerpt: Mapped[str | None] = mapped_column(String(500), nullable=True)

    cover_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)

    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft, published, archived
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)

    view_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="blog_posts")
    sponsor_disclosure: Mapped["CriticSponsorDisclosure | None"] = relationship(back_populates="blog_post", uselist=False)


class CriticRecommendation(Base):
    """Movie recommendations by critics"""
    __tablename__ = "critic_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), index=True)

    recommendation_type: Mapped[str] = mapped_column(String(50), index=True)  # must_watch, hidden_gem, guilty_pleasure, etc.
    reason: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="recommendations")
    movie: Mapped["Movie"] = relationship()


class CriticPinnedContent(Base):
    """Content pinned to critic profile"""
    __tablename__ = "critic_pinned_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)

    content_type: Mapped[str] = mapped_column(String(50))  # review, blog_post, recommendation
    content_id: Mapped[int] = mapped_column(Integer)  # ID of the content item

    display_order: Mapped[int] = mapped_column(Integer, default=0)
    pinned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="pinned_content")


class CriticAffiliateLink(Base):
    """Affiliate links managed by critics"""
    __tablename__ = "critic_affiliate_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)

    label: Mapped[str] = mapped_column(String(100))  # "Watch on Netflix", "Buy on Amazon"
    platform: Mapped[str] = mapped_column(String(50))  # netflix, amazon, apple_tv, etc.
    url: Mapped[str] = mapped_column(String(500))

    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(100), nullable=True)

    click_count: Mapped[int] = mapped_column(Integer, default=0)
    conversion_count: Mapped[int] = mapped_column(Integer, default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="affiliate_links")


class CriticBrandDeal(Base):
    """Brand deals and sponsorships for critics"""
    __tablename__ = "critic_brand_deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    critic_id: Mapped[int] = mapped_column(ForeignKey("critic_profiles.id", ondelete="CASCADE"), index=True)

    brand_name: Mapped[str] = mapped_column(String(200))
    campaign_title: Mapped[str] = mapped_column(String(200))
    brief: Mapped[str] = mapped_column(Text)

    rate_card: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, accepted, completed, cancelled

    deliverables: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    disclosure_required: Mapped[bool] = mapped_column(Boolean, default=True)

    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    critic: Mapped["CriticProfile"] = relationship(back_populates="brand_deals")


class CriticSponsorDisclosure(Base):
    """FTC-compliant sponsor disclosures for content"""
    __tablename__ = "critic_sponsor_disclosures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    review_id: Mapped[int | None] = mapped_column(ForeignKey("critic_reviews.id", ondelete="CASCADE"), nullable=True, index=True)
    blog_post_id: Mapped[int | None] = mapped_column(ForeignKey("critic_blog_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    brand_deal_id: Mapped[int | None] = mapped_column(ForeignKey("critic_brand_deals.id", ondelete="SET NULL"), nullable=True)

    disclosure_text: Mapped[str] = mapped_column(Text)
    disclosure_type: Mapped[str] = mapped_column(String(50))  # sponsored, affiliate, gifted, partnership

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    review: Mapped["CriticReview | None"] = relationship(back_populates="sponsor_disclosure")
    blog_post: Mapped["CriticBlogPost | None"] = relationship(back_populates="sponsor_disclosure")
    brand_deal: Mapped["CriticBrandDeal | None"] = relationship()


class FeatureFlag(Base):
    """Feature flag for controlling application features"""
    __tablename__ = "feature_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    feature_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    feature_name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    def to_dict(self) -> dict:
        """Convert to dictionary with all fields"""
        return {
            "id": self.id,
            "feature_key": self.feature_key,
            "feature_name": self.feature_name,
            "is_enabled": self.is_enabled,
            "category": self.category,
            "description": self.description,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "updated_by": self.updated_by,
        }

    def to_public_dict(self) -> dict:
        """Convert to public dictionary (minimal info)"""
        return {
            "feature_key": self.feature_key,
            "is_enabled": self.is_enabled,
        }
