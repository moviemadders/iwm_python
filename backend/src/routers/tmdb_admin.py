"""
TMDB Admin Router

Provides admin endpoints for browsing, searching, and importing movies from TMDB.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..db import get_session
from ..models import Movie, Genre, Person, StreamingPlatform, MovieStreamingOption, movie_genres, movie_people, User
from ..dependencies.admin import require_admin
from ..integrations.tmdb_client import search_movie, fetch_movie_by_id, TMDBError, TMDBNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tmdb", tags=["TMDB Admin"])


# ============================================================================
# Pydantic Models
# ============================================================================

class TMDBMoviePreview(BaseModel):
    """Preview of a TMDB movie for browsing/searching"""
    tmdb_id: int
    title: str
    release_date: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    overview: Optional[str] = None
    vote_average: Optional[float] = None
    already_imported: bool = False
    our_movie_id: Optional[int] = None


class TMDBSearchResponse(BaseModel):
    """Response for TMDB search/browse endpoints"""
    movies: List[TMDBMoviePreview]
    total_results: int
    total_pages: int
    current_page: int


class TMDBImportResponse(BaseModel):
    """Response after importing a movie from TMDB"""
    id: int
    title: str
    tmdb_id: int
    external_id: str
    message: str


class TMDBExistsResponse(BaseModel):
    """Response for checking if a movie exists"""
    exists: bool
    movie_id: Optional[int] = None
    title: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

async def check_movie_exists_by_tmdb_id(session: AsyncSession, tmdb_id: int) -> Optional[Movie]:
    """Check if a movie with given TMDB ID already exists in database"""
    result = await session.execute(
        select(Movie).where(Movie.tmdb_id == tmdb_id)
    )
    return result.scalar_one_or_none()


async def create_movie_from_tmdb_data(
    session: AsyncSession,
    tmdb_data: Dict[str, Any],
    current_user: User,
) -> Movie:
    """
    Create a movie record from TMDB data.
    
    Handles creation of related entities (genres, cast, crew, streaming options).
    """
    # Create or get genres
    genres_list = []
    for genre_name in tmdb_data.get("genres", []):
        result = await session.execute(
            select(Genre).where(Genre.name == genre_name)
        )
        genre = result.scalar_one_or_none()
        if not genre:
            genre = Genre(slug=genre_name.lower(), name=genre_name)
            session.add(genre)
            await session.flush()
        genres_list.append(genre)
    
    # Create movie
    movie = Movie(
        external_id=tmdb_data.get("external_id"),
        tmdb_id=tmdb_data.get("tmdb_id"),
        title=tmdb_data.get("title"),
        tagline=tmdb_data.get("tagline"),
        year=tmdb_data.get("year"),
        release_date=tmdb_data.get("release_date"),
        runtime=tmdb_data.get("runtime"),
        language=tmdb_data.get("language"),
        country=tmdb_data.get("country"),
        overview=tmdb_data.get("overview"),
        poster_url=tmdb_data.get("poster_url"),
        backdrop_url=tmdb_data.get("backdrop_url"),
        budget=tmdb_data.get("budget"),
        revenue=tmdb_data.get("revenue"),
        status=tmdb_data.get("status", "released"),
    )
    session.add(movie)
    await session.flush()
    
    # Add genres
    for genre in genres_list:
        await session.execute(
            insert(movie_genres).values(movie_id=movie.id, genre_id=genre.id)
        )
    
    # Add cast and crew
    for director in tmdb_data.get("directors", []):
        person = await _get_or_create_person(session, director)
        # Use on_conflict_do_nothing to handle duplicates
        stmt = pg_insert(movie_people).values(
            movie_id=movie.id,
            person_id=person.id,
            role="director",
            character_name=None,
        ).on_conflict_do_nothing()
        await session.execute(stmt)

    for writer in tmdb_data.get("writers", []):
        person = await _get_or_create_person(session, writer)
        stmt = pg_insert(movie_people).values(
            movie_id=movie.id,
            person_id=person.id,
            role="writer",
            character_name=None,
        ).on_conflict_do_nothing()
        await session.execute(stmt)

    for actor in tmdb_data.get("cast", []):
        person = await _get_or_create_person(session, actor)
        stmt = pg_insert(movie_people).values(
            movie_id=movie.id,
            person_id=person.id,
            role="actor",
            character_name=actor.get("character"),
        ).on_conflict_do_nothing()
        await session.execute(stmt)
    
    await session.commit()
    return movie


async def _get_or_create_person(session: AsyncSession, person_data: Dict[str, Any]) -> Person:
    """Get or create a person record"""
    external_id = f"tmdb-person-{person_data.get('name', '').lower().replace(' ', '-')}"
    result = await session.execute(
        select(Person).where(Person.external_id == external_id)
    )
    person = result.scalar_one_or_none()
    if not person:
        person = Person(
            external_id=external_id,
            name=person_data.get("name"),
            image_url=person_data.get("image"),
        )
        session.add(person)
        await session.flush()
    return person


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/new-releases", response_model=TMDBSearchResponse)
async def get_new_releases(
    category: str = Query("now_playing", regex="^(now_playing|upcoming|popular|top_rated)$"),
    page: int = Query(1, ge=1),
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> TMDBSearchResponse:
    """
    Fetch latest movies from TMDB by category.
    
    Categories:
    - now_playing: Currently in theaters
    - upcoming: Coming soon
    - popular: Most popular movies
    - top_rated: Highest rated movies
    """
    try:
        import httpx
        from ..config import settings
        
        if not settings.tmdb_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API key not configured",
            )
        
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(
                f"https://api.themoviedb.org/3/movie/{category}",
                params={
                    "api_key": settings.tmdb_api_key,
                    "page": page,
                    "language": "en-US",
                },
            )
            
            if response.status_code != 200:
                logger.error(f"TMDB API returned status {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"TMDB API error (HTTP {response.status_code})",
                )
            
            data = response.json()
            movies = []
            
            for movie_data in data.get("results", []):
                tmdb_id = movie_data.get("id")
                existing = await check_movie_exists_by_tmdb_id(session, tmdb_id)
                
                movies.append(TMDBMoviePreview(
                    tmdb_id=tmdb_id,
                    title=movie_data.get("title"),
                    release_date=movie_data.get("release_date"),
                    poster_url=(
                        f"https://image.tmdb.org/t/p/w500{movie_data.get('poster_path')}"
                        if movie_data.get("poster_path")
                        else None
                    ),
                    backdrop_url=(
                        f"https://image.tmdb.org/t/p/original{movie_data.get('backdrop_path')}"
                        if movie_data.get("backdrop_path")
                        else None
                    ),
                    overview=movie_data.get("overview"),
                    vote_average=movie_data.get("vote_average"),
                    already_imported=existing is not None,
                    our_movie_id=existing.id if existing else None,
                ))
            
            return TMDBSearchResponse(
                movies=movies,
                total_results=data.get("total_results", 0),
                total_pages=data.get("total_pages", 0),
                current_page=page,
            )
    
    except httpx.ConnectError as e:
        logger.error(f"Cannot connect to TMDB API: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to TMDB API. Please check your network connection or firewall settings.",
        )
    except httpx.TimeoutException as e:
        logger.error(f"TMDB API timeout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="TMDB API request timed out. Please try again.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching new releases: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching movies: {str(e)}",
        )


@router.get("/search", response_model=TMDBSearchResponse)
async def search_tmdb_movies(
    query: str = Query(..., min_length=1),
    year: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> TMDBSearchResponse:
    """Search for movies on TMDB by title"""
    try:
        import httpx
        from ..config import settings
        
        if not settings.tmdb_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API key not configured",
            )
        
        async with httpx.AsyncClient(timeout=60) as client:
            params = {
                "api_key": settings.tmdb_api_key,
                "query": query,
                "page": page,
                "language": "en-US",
            }
            if year:
                params["year"] = year
            
            response = await client.get(
                "https://api.themoviedb.org/3/search/movie",
                params=params,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to search TMDB API",
                )
            
            data = response.json()
            movies = []
            
            for movie_data in data.get("results", []):
                tmdb_id = movie_data.get("id")
                existing = await check_movie_exists_by_tmdb_id(session, tmdb_id)
                
                movies.append(TMDBMoviePreview(
                    tmdb_id=tmdb_id,
                    title=movie_data.get("title"),
                    release_date=movie_data.get("release_date"),
                    poster_url=(
                        f"https://image.tmdb.org/t/p/w500{movie_data.get('poster_path')}"
                        if movie_data.get("poster_path")
                        else None
                    ),
                    backdrop_url=(
                        f"https://image.tmdb.org/t/p/original{movie_data.get('backdrop_path')}"
                        if movie_data.get("backdrop_path")
                        else None
                    ),
                    overview=movie_data.get("overview"),
                    vote_average=movie_data.get("vote_average"),
                    already_imported=existing is not None,
                    our_movie_id=existing.id if existing else None,
                ))
            
            return TMDBSearchResponse(
                movies=movies,
                total_results=data.get("total_results", 0),
                total_pages=data.get("total_pages", 0),
                current_page=page,
            )
    
    except Exception as e:
        logger.error(f"Error searching TMDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching movies: {str(e)}",
        )


@router.post("/import/{tmdb_id}", response_model=TMDBImportResponse, status_code=status.HTTP_201_CREATED)
async def import_tmdb_movie(
    tmdb_id: int,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> TMDBImportResponse:
    """Import a movie from TMDB by its TMDB ID"""
    try:
        # Check if already exists
        existing = await check_movie_exists_by_tmdb_id(session, tmdb_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Movie already exists with ID {existing.id}",
            )
        
        # Fetch from TMDB
        tmdb_data = await fetch_movie_by_id(tmdb_id)
        if not tmdb_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Movie not found on TMDB",
            )
        
        # Create movie
        movie = await create_movie_from_tmdb_data(session, tmdb_data, current_user)
        
        logger.info(f"Imported movie from TMDB: {movie.title} (ID: {movie.id})")
        
        return TMDBImportResponse(
            id=movie.id,
            title=movie.title,
            tmdb_id=movie.tmdb_id,
            external_id=movie.external_id,
            message=f"Successfully imported '{movie.title}'",
        )
    
    except HTTPException:
        raise
    except TMDBNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found on TMDB",
        )
    except TMDBError as e:
        logger.error(f"TMDB error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TMDB API error: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error importing movie: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing movie: {str(e)}",
        )


@router.get("/check-exists/{tmdb_id}", response_model=TMDBExistsResponse)
async def check_movie_exists(
    tmdb_id: int,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> TMDBExistsResponse:
    """Check if a movie with given TMDB ID already exists in our database"""
    try:
        existing = await check_movie_exists_by_tmdb_id(session, tmdb_id)
        
        if existing:
            return TMDBExistsResponse(
                exists=True,
                movie_id=existing.id,
                title=existing.title,
            )
        else:
            return TMDBExistsResponse(exists=False)
    
    except Exception as e:
        logger.error(f"Error checking movie existence: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking movie: {str(e)}",
        )

