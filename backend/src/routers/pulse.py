from __future__ import annotations

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field

from ..db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.pulse import PulseRepository
from ..dependencies.auth import get_current_user
from ..models import User

router = APIRouter(prefix="/pulse", tags=["pulse"])


class PulseCreateBody(BaseModel):
    contentText: str = Field(..., max_length=280)
    contentMedia: Optional[List[str]] = None
    linkedMovieId: Optional[str] = None
    hashtags: Optional[List[str]] = None


@router.get("/")
@router.get("/feed")
async def get_feed(
    filter: str = Query("latest", pattern="^(latest|popular|following|trending)$"),
    window: str = Query("7d", pattern="^(24h|7d|30d)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    viewerId: Optional[str] = Query(None),
    hashtag: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    repo = PulseRepository(session)
    return await repo.list_feed(
        filter_type=filter,
        window=window,
        page=page,
        limit=limit,
        viewer_external_id=viewerId,
        hashtag=hashtag
    )


@router.get("/trending-topics")
async def get_trending_topics(
    window: str = Query("7d", pattern="^(24h|7d|30d)$"),
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    repo = PulseRepository(session)
    return await repo.trending_topics(window=window, limit=limit)


@router.post("")
async def create_pulse(
    body: PulseCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new pulse"""
    repo = PulseRepository(session)
    try:
        result = await repo.create(
            user_id=current_user.id,
            content_text=body.contentText,
            content_media=body.contentMedia,
            linked_movie_id=body.linkedMovieId,
            hashtags=body.hashtags,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create pulse")


@router.delete("/{pulse_id}")
async def delete_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a pulse. User must own the pulse."""
    repo = PulseRepository(session)
    try:
        result = await repo.delete(pulse_id=pulse_id, user_id=current_user.id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pulse not found")
        await session.commit()
        return {"deleted": True}
    except ValueError as e:
        await session.rollback()
        if "does not own" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete pulse")


class ReactionBody(BaseModel):
    type: str = Field(..., pattern="^(love|fire|mindblown|laugh|sad|angry)$")


class CommentBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


@router.post("/{pulse_id}/reactions")
async def toggle_reaction(
    pulse_id: str,
    body: ReactionBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Toggle a reaction on a pulse"""
    repo = PulseRepository(session)
    try:
        result = await repo.toggle_reaction(
            user_id=current_user.id,
            pulse_id=pulse_id,
            reaction_type=body.type,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to toggle reaction")


@router.post("/{pulse_id}/comments")
async def add_comment(
    pulse_id: str,
    body: CommentBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Add a comment to a pulse"""
    repo = PulseRepository(session)
    try:
        result = await repo.add_comment(
            user_id=current_user.id,
            pulse_id=pulse_id,
            content=body.content,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to add comment")


@router.get("/{pulse_id}/comments")
async def get_comments(
    pulse_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> Any:
    """Get comments for a pulse"""
    repo = PulseRepository(session)
    return await repo.get_comments(pulse_id=pulse_id, page=page, limit=limit)
