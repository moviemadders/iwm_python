from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..repositories.movies import MovieRepository
from ..models import User, Watchlist, Movie
from ..dependencies.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import select

router = APIRouter(prefix="/movies", tags=["movies"])

@router.get("")
async def list_movies(
    page: int = 1,
    limit: int = 20,
    genre: str | None = None,
    yearMin: int | None = None,
    yearMax: int | None = None,
    countries: str | None = None,
    languages: str | None = None,
    ratingMin: float | None = None,
    ratingMax: float | None = None,
    status: str | None = None,  # accepted but not used currently
    sortBy: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> Any:
    repo = MovieRepository(session)
    country_list = [c.strip() for c in countries.split(",")] if countries else None
    language_list = [l.strip() for l in languages.split(",")] if languages else None
    return await repo.list(
        page=page,
        limit=limit,
        genre_slug=genre,
        year_min=yearMin,
        year_max=yearMax,
        countries=country_list,
        languages=language_list,
        rating_min=ratingMin,
        rating_max=ratingMax,
        sort_by=sortBy,
    )


@router.get("/search")
async def search_movies(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    session: AsyncSession = Depends(get_session),
) -> Any:
    """
    Search movies by title, description, or genre name.
    Returns results ordered by relevance.
    """
    repo = MovieRepository(session)
    results = await repo.search(query=q, limit=limit)
    return {"results": results, "total": len(results)}


@router.get("/{movie_id}")
async def get_movie(movie_id: str, session: AsyncSession = Depends(get_session)) -> Any:
    repo = MovieRepository(session)
    data = await repo.get(movie_id)
    if not data:
        raise HTTPException(status_code=404, detail="Movie not found")
    return data


class MovieProgressUpdate(BaseModel):
    progress_seconds: int
    total_duration_seconds: int
    status: str  # playing, paused, ended


@router.post("/{movie_id}/progress")
async def update_movie_progress(
    movie_id: str,
    body: MovieProgressUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update movie progress and watchlist status.
    Automatically adds to watchlist if not present.
    """
    # 1. Verify movie exists
    repo = MovieRepository(session)
    movie = await repo.get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # 2. Find or create watchlist item
    # We need the internal ID for the foreign key
    stmt = select(Watchlist).where(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie["id"] # repo.get returns dict, need to check if it returns dict or model
    )
    # Wait, repo.get returns a dict or object? 
    # Looking at movies.py: data = await repo.get(movie_id) -> returns data.
    # I should check MovieRepository.get implementation to be sure.
    # Assuming it returns a dict-like object or model. 
    # If it returns a dict, I might need to fetch the model to get the ID if it's not in the dict.
    # Actually, let's just fetch the movie model directly to be safe and get the ID.
    
    movie_stmt = select(Movie).where(Movie.external_id == movie_id)
    movie_res = await session.execute(movie_stmt)
    movie_model = movie_res.scalar_one_or_none()
    
    if not movie_model:
         raise HTTPException(status_code=404, detail="Movie not found")

    stmt = select(Watchlist).where(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie_model.id
    )
    result = await session.execute(stmt)
    watchlist_item = result.scalar_one_or_none()

    if not watchlist_item:
        # Create new watchlist item
        import uuid
        watchlist_item = Watchlist(
            external_id=str(uuid.uuid4()),
            user_id=current_user.id,
            movie_id=movie_model.id,
            status="watching", # Default to watching since they are updating progress
            progress=0,
            progress_seconds=0,
            total_duration_seconds=body.total_duration_seconds,
            last_watched_at=datetime.utcnow()
        )
        session.add(watchlist_item)
    
    # 3. Update fields
    watchlist_item.progress_seconds = body.progress_seconds
    watchlist_item.total_duration_seconds = body.total_duration_seconds
    watchlist_item.last_watched_at = datetime.utcnow()
    
    # Calculate percentage
    percent = 0
    if body.total_duration_seconds > 0:
        percent = int((body.progress_seconds / body.total_duration_seconds) * 100)
    watchlist_item.progress = percent

    # 4. Update status logic
    if body.status == "playing":
        if watchlist_item.status != "watching" and watchlist_item.status != "watched":
            watchlist_item.status = "watching"
    
    if body.status == "ended" or percent >= 95:
        watchlist_item.status = "watched"

    await session.commit()
    
    return {"ok": True, "status": watchlist_item.status, "progress": percent}
