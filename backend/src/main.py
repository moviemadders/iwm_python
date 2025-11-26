"""
FastAPI Main Application Entry Point

This is the heart of the Movie Madders backend API server.
It initializes the FastAPI application, sets up middleware, configures CORS,
and registers all API routes.

Key Concepts for Beginners:
- FastAPI: A modern, fast web framework for building APIs with Python
- Async/Await: Allows handling multiple requests concurrently for better performance
- Lifespan: Manages startup and shutdown events (like connecting to database)
- CORS: Cross-Origin Resource Sharing - allows frontend to call backend API
- Router: Organizes API endpoints into logical groups (movies, users, etc.)

Technology Stack:
- FastAPI: Web framework
- PostgreSQL 18: Database (with async support via AsyncPG)
- SQLAlchemy 2.0: ORM (Object-Relational Mapping) for database operations
- Pydantic: Data validation and settings management
- Structlog: Structured logging for better debugging

Author: Movie Madders Development Team
Last Updated: 2025-11-04
"""

# Enable future annotations for better type hints
from __future__ import annotations

# Standard library imports
import os  # Operating system utilities (not used here, but commonly needed)
from contextlib import asynccontextmanager  # For managing async context (startup/shutdown)
from pathlib import Path  # Modern way to handle file paths
import json  # For exporting OpenAPI schema

# FastAPI core imports
from fastapi import FastAPI, APIRouter  # Main framework and router for organizing endpoints
from fastapi.middleware.cors import CORSMiddleware  # Middleware for handling CORS

# Application-specific imports
from .config import settings  # Application configuration (loaded from .env file)
from .logging_config import setup_logging, log  # Structured logging setup
from .db import init_db  # Database initialization function

# Import all API routers (each router handles a specific domain)
# These are organized by feature/domain for better code organization
from .routers import health as health_router  # Health check endpoint
from .routers import genres as genres_router  # Movie genres (Action, Drama, etc.)
from .routers import movies as movies_router  # Movie catalog and details
from .routers import people as people_router  # Actors, directors, writers
from .routers import search as search_router  # Search functionality
from .routers import reviews as reviews_router  # User reviews and ratings
from .routers import collections as collections_router  # User-created movie collections
from .routers import watchlist as watchlist_router  # User watchlist
from .routers import favorites as favorites_router  # User favorites
from .routers import awards as awards_router  # Award ceremonies (Oscars, Golden Globes, etc.)
from .routers import box_office as box_office_router  # Box office data and trends
from .routers import festivals as festivals_router  # Film festivals (Cannes, Sundance, etc.)
from .routers import scene_explorer as scene_explorer_router  # Movie scenes
from .routers import visual_treats as visual_treats_router  # Visually stunning scenes
from .routers import pulse as pulse_router  # Social features (posts, likes, comments)
from .routers import pulse_notifications as pulse_notifications_router  # Pulse notifications
from .routers import messages as messages_router  # Direct messaging
from .routers import quiz as quiz_router  # Movie quizzes
from .routers import talent_hub as talent_hub_router  # Casting calls and opportunities
from .routers import admin as admin_router  # Admin panel features
from .routers import notifications as notifications_router  # User notifications
from .routers import settings as settings_router  # User settings and preferences
from .routers import auth as auth_router  # Authentication (login, signup, JWT)
from .routers import critics as critics_router  # Critic Hub - Critic profiles
from .routers import critic_reviews as critic_reviews_router  # Critic Hub - Critic reviews
from .routers import critic_verification as critic_verification_router  # Critic Hub - Verification
from .routers import critic_blog as critic_blog_router  # Critic Hub - Blog posts
from .routers import critic_recommendations as critic_recommendations_router  # Critic Hub - Recommendations
from .routers import critic_pinned as critic_pinned_router  # Critic Hub - Pinned content
from .routers import critic_affiliate as critic_affiliate_router  # Critic Hub - Affiliate links
from .routers import critic_brand_deals as critic_brand_deals_router  # Critic Hub - Brand deals
from .routers import users as users_router  # User profiles
from .routers import user_stats as user_stats_router  # User activity stats
from .routers import roles as roles_router  # Role management (multi-role profiles)
from .routers import user_roles as user_roles_router  # User roles switcher
from .routers import tmdb_admin as tmdb_admin_router  # TMDB Admin - Browse and import movies
from .routers import movie_export_import as movie_export_import_router  # Movie Export/Import - Categorized data enrichment
from .routers import award_ceremonies as award_ceremonies_router  # Award Ceremonies - Indian and international awards
from .routers import feature_flags as feature_flags_router  # Feature Flags - Admin feature toggle system
from .routers import upload as upload_router  # File Upload - Avatar and banner images



"""
Lifespan Context Manager

This function manages the application's lifecycle - what happens when the app starts
and what happens when it shuts down. This is a FastAPI best practice for managing
resources like database connections, caches, and background tasks.

Why use lifespan instead of @app.on_event("startup")?
- Lifespan is the modern, recommended approach (FastAPI 0.93+)
- Better error handling and cleanup guarantees
- Supports async context managers properly
- Ensures resources are cleaned up even if startup fails

What happens during startup (before 'yield'):
1. Set up structured logging
2. Initialize database connection pool
3. Export OpenAPI schema for frontend type generation

What happens during shutdown (after 'yield'):
4. Log shutdown event
5. Database connections are automatically closed by SQLAlchemy

For Beginners:
- @asynccontextmanager: Decorator that creates an async context manager
- yield: Separates startup code (before) from shutdown code (after)
- await: Waits for async operations to complete before continuing
"""
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ========== STARTUP PHASE ==========

    # Step 1: Configure structured logging
    # This sets up JSON-formatted logs with timestamps, log levels, and context
    setup_logging(settings.log_level)
    log.info("starting_app", env=settings.env)

    # Step 2: Initialize database connection pool
    # This creates a pool of reusable database connections for better performance
    # Instead of creating a new connection for each request (slow), we reuse
    # connections from the pool (fast)
    await init_db()

    # Step 3: Export OpenAPI schema (optional, for development)
    # OpenAPI is a standard format for describing REST APIs
    # We export it so the frontend can auto-generate TypeScript types
    # This ensures frontend and backend stay in sync
    if settings.export_openapi_on_startup:
        # Find the project root directory by looking for 'packages/shared' folder
        here = Path(__file__).resolve()  # Current file path
        root = None

        # Search up the directory tree to find project root
        try:
            for depth in range(2, 6):
                if depth >= len(here.parents):
                    break
                cand = here.parents[depth]  # Go up 'depth' levels
                if (cand / "packages" / "shared").exists():
                    root = cand
                    break
        except Exception:
            pass

        # Fallback if we can't find it
        if root is None:
            root = here.parents[4]  # Assume 4 levels up

        # Create the target path for OpenAPI JSON file
        target = root / "packages" / "shared" / "openapi" / "openapi.json"
        target.parent.mkdir(parents=True, exist_ok=True)  # Create directories if needed

        # Write the OpenAPI schema to file
        with target.open("w", encoding="utf-8") as f:
            json.dump(app.openapi(), f, ensure_ascii=False, indent=2)

        log.info("openapi_exported", path=str(target))

    # ========== APPLICATION RUNNING ==========
    # The 'yield' statement separates startup from shutdown
    # Everything after this runs when the app is shutting down
    yield

    # ========== SHUTDOWN PHASE ==========
    log.info("stopping_app")
    # Note: Database connections are automatically closed by SQLAlchemy's engine.dispose()
    # which is called when the engine is garbage collected


"""
FastAPI Application Initialization

This section creates the main FastAPI application instance and configures it.

Security Best Practice:
- In production, we disable the auto-generated API documentation (/docs, /redoc)
  to prevent exposing our API structure to potential attackers
- In development, we keep docs enabled for easier testing and debugging

For Beginners:
- FastAPI automatically generates interactive API documentation (Swagger UI)
- This is great for development but should be disabled in production
"""

# Check if we're running in production environment
is_prod = settings.env.lower() == "production"

# Create the FastAPI application instance
app = FastAPI(
    title=settings.app_name,  # Application name (shown in docs)
    docs_url=None if is_prod else "/docs",  # Swagger UI endpoint (disabled in prod)
    redoc_url=None if is_prod else "/redoc",  # ReDoc endpoint (disabled in prod)
    version="1.0.0",  # API version
    lifespan=lifespan,  # Attach our lifespan context manager
)

"""
CORS (Cross-Origin Resource Sharing) Configuration

CORS is a security feature that controls which websites can call your API.
Without CORS, a malicious website could make requests to your API on behalf of users.

Why do we need CORS?
- Our frontend (http://localhost:3000) needs to call our backend (http://localhost:8000)
- Browsers block this by default for security (different origins)
- We configure CORS to allow specific origins

Security Considerations:
- In development: We allow specific localhost origins for testing
- In production: We should only allow specific domains (e.g., https://moviemadders.com)
- Credentials (cookies, auth headers) can't be used with wildcard origins

Configuration:
- CORS origins are configured via the CORS_ORIGINS environment variable
- See .env.example for configuration examples
- Supports both comma-separated and JSON array formats

For Beginners:
- allow_origins: Which websites can call this API
- allow_credentials: Whether to allow cookies/auth headers
- allow_methods: Which HTTP methods are allowed (GET, POST, etc.)
- allow_headers: Which HTTP headers are allowed
"""

# CORS Configuration
# Explicitly allow localhost:3000 for development
_allowed_origins = ["http://localhost:3000"]
if settings.cors_origins:
    _allowed_origins.extend([o for o in settings.cors_origins if o != "http://localhost:3000"])

# Deduplicate
_allowed_origins = list(set(_allowed_origins))

print(f"DEBUG: Setting CORS origins to: {_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

log.info("cors_config", origins=_allowed_origins, allow_credentials=True)

"""
API Router Registration

This section organizes all API endpoints under a common prefix (/api/v1).

Why use API versioning?
- Allows us to make breaking changes in v2 while keeping v1 working
- Clients can migrate to new versions at their own pace
- Industry best practice for public APIs

Router Organization:
Each router handles a specific domain/feature of the application.
This keeps code organized and makes it easier to find and maintain.

For Beginners:
- APIRouter: Groups related endpoints together
- prefix="/api/v1": All endpoints will start with /api/v1
- include_router(): Adds a router's endpoints to the main app

Example:
- movies_router has endpoint "/movies"
- After include_router, it becomes "/api/v1/movies"
"""

# Create a main API router with version prefix
# All endpoints will be under /api/v1/...
api = APIRouter(prefix="/api/v1")

# Register all feature routers
# Each router is defined in its own file under src/routers/

# Core Features
api.include_router(health_router.router)  # GET /api/v1/health - Health check
api.include_router(auth_router.router)  # POST /api/v1/auth/login, /signup, etc.
api.include_router(users_router.router)  # GET /api/v1/users - User profiles
api.include_router(genres_router.router)  # GET /api/v1/genres - Movie genres
api.include_router(movies_router.router)  # GET /api/v1/movies - Movie catalog
api.include_router(people_router.router)  # GET /api/v1/people - Actors, directors
api.include_router(search_router.router)  # GET /api/v1/search - Search functionality

# User Features
api.include_router(reviews_router.router)  # POST /api/v1/reviews - User reviews
api.include_router(collections_router.router)  # GET /api/v1/collections - User collections
api.include_router(watchlist_router.router)  # GET /api/v1/watchlist - User watchlist
api.include_router(favorites_router.router)  # GET /api/v1/favorites - User favorites
api.include_router(settings_router.router)  # GET /api/v1/settings - User settings
api.include_router(notifications_router.router)  # GET /api/v1/notifications - Notifications
api.include_router(roles_router.router)  # GET/PUT /api/v1/roles - Role management
api.include_router(user_roles_router.router)  # GET/POST /api/v1/users/me/roles - Role switcher
api.include_router(upload_router.router)  # POST /api/v1/upload/avatar - File uploads
api.include_router(user_stats_router.router)  # GET /api/v1/users/{id}/stats/* - User activity stats


# Industry Features
api.include_router(box_office_router.router)  # GET /api/v1/box-office - Box office data
api.include_router(awards_router.router)  # GET /api/v1/awards - Award ceremonies
api.include_router(award_ceremonies_router.router)  # GET /api/v1/award-ceremonies - Award ceremonies management (Indian & International)
api.include_router(festivals_router.router)  # GET /api/v1/festivals - Film festivals

# Content Features
api.include_router(scene_explorer_router.router)  # GET /api/v1/scenes - Movie scenes
api.include_router(visual_treats_router.router)  # GET /api/v1/visual-treats - Stunning scenes

# Social Features
api.include_router(pulse_router.router)  # GET /api/v1/pulse - Social posts
api.include_router(pulse_notifications_router.router)  # GET /api/v1/pulse/notifications - Pulse notifications
api.include_router(messages_router.router)  # POST /api/v1/messages - Direct messaging

# Interactive Features
api.include_router(quiz_router.router)  # GET /api/v1/quiz - Movie quizzes
api.include_router(talent_hub_router.router)  # GET /api/v1/talent-hub - Casting calls

# Admin Features
api.include_router(admin_router.router)  # POST /api/v1/admin/import - Admin panel
api.include_router(tmdb_admin_router.router, prefix="/admin")  # GET /api/v1/admin/tmdb/* - TMDB browsing and import
api.include_router(movie_export_import_router.router)  # GET/POST /api/v1/admin/movies/{id}/export/* - Movie export/import
api.include_router(feature_flags_router.router)  # GET/PUT /api/v1/feature-flags - Feature toggle system

# Critic Hub Features
api.include_router(critics_router.router)  # GET /api/v1/critics - Critic profiles
api.include_router(critic_reviews_router.router)  # GET /api/v1/critic-reviews - Critic reviews
api.include_router(critic_verification_router.router)  # POST /api/v1/critic-verification - Verification
api.include_router(critic_blog_router.router)  # POST /api/v1/critic-blog - Blog posts
api.include_router(critic_recommendations_router.router)  # POST /api/v1/critic-recommendations - Recommendations
api.include_router(critic_pinned_router.router)  # POST /api/v1/critic-pinned - Pinned content
api.include_router(critic_affiliate_router.router)  # POST /api/v1/critic-affiliate - Affiliate links
api.include_router(critic_brand_deals_router.router)  # POST /api/v1/critic-brand-deals - Brand deals

# Attach the versioned API router to the main app
app.include_router(api)

"""
Application is now ready to handle requests!

To start the server:
    hypercorn src.main:app --bind 0.0.0.0:8000

To view API documentation (development only):
    http://localhost:8000/docs (Swagger UI)
    http://localhost:8000/redoc (ReDoc)

To test an endpoint:
    curl http://localhost:8000/api/v1/health

For Beginners:
- The app is now configured and ready to receive HTTP requests
- FastAPI will automatically validate requests and serialize responses
- All database queries use async/await for better performance
- Structured logging helps with debugging and monitoring
"""



