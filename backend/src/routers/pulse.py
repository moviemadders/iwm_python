from __future__ import annotations

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from ..db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.pulse import PulseRepository
from ..dependencies.auth import get_current_user, get_current_user_optional
from ..models import User, UserRoleProfile

router = APIRouter(prefix="/pulse", tags=["pulse"])


class PulseCreateBody(BaseModel):
    contentText: str = Field(..., max_length=280)
    contentMedia: Optional[List[str]] = None
    linkedMovieId: Optional[str] = None
    hashtags: Optional[List[str]] = None
    postedAsRole: Optional[str] = None  # 'critic', 'industry_pro', 'talent_pro'
    starRating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 stars


async def get_user_roles(user_id: int, session: AsyncSession) -> List[str]:
    """
    Get active roles for user from user_role_profiles table.
    Maps role_type to posted_as_role format.
    
    Returns: List of roles like ['critic', 'industry_pro', 'talent_pro']
    """
    result = await session.execute(
        select(UserRoleProfile.role_type)
        .where(UserRoleProfile.user_id == user_id)
        .where(UserRoleProfile.enabled == True)
    )
    role_types = [row[0] for row in result]
    
    # Map role_type to posted_as_role format
    role_mapping = {
        'critic': 'critic',
        'industry': 'industry_pro',
        'talent': 'talent_pro'
    }
    
    return [role_mapping.get(r) for r in role_types if r in role_mapping]


@router.get("/")
@router.get("/feed")
async def get_feed(
    filter: str = Query("latest", pattern="^(latest|popular|following|trending)$"),
    window: str = Query("7d", pattern="^(24h|7d|30d)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    viewerId: Optional[str] = Query(None),
    hashtag: Optional[str] = Query(None),
    linkedMovieId: Optional[str] = Query(None),
    linkedType: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    # If viewerId is not provided but user is authenticated, use their ID
    if not viewerId and current_user:
        viewerId = current_user.external_id

    repo = PulseRepository(session)
    return await repo.list_feed(
        filter_type=filter,
        window=window,
        page=page,
        limit=limit,
        viewer_external_id=viewerId,
        hashtag=hashtag,
        linked_movie_id=linkedMovieId,
        linked_type=linkedType,
        target_user_external_id=userId
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
    # Verify user has claimed role if posting as professional
    if body.postedAsRole:
        if body.postedAsRole and body.postedAsRole != "personal":
            # Verify user has this role enabled
            user_roles = await get_user_roles(current_user.id, session)
            if body.postedAsRole not in user_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User does not have '{body.postedAsRole}' role. Available roles: {user_roles}"
                )
    
    repo = PulseRepository(session)
    try:
        result = await repo.create(
            user_id=current_user.id,
            content_text=body.contentText,
            content_media=body.contentMedia,
            linked_movie_id=body.linkedMovieId,
            hashtags=body.hashtags,
            posted_as_role=body.postedAsRole,
            star_rating=body.starRating,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create pulse: {str(e)}")


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


@router.post("/{pulse_id}/bookmark")
async def bookmark_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Bookmark a pulse"""
    repo = PulseRepository(session)
    try:
        await repo.bookmark_pulse(user_id=current_user.id, pulse_id=pulse_id)
        await session.commit()
        return {"bookmarked": True}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bookmark pulse: {str(e)}")


@router.delete("/{pulse_id}/bookmark")
async def unbookmark_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Unbookmark a pulse"""
    repo = PulseRepository(session)
    try:
        await repo.unbookmark_pulse(user_id=current_user.id, pulse_id=pulse_id)
        await session.commit()
        return {"bookmarked": False}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to unbookmark pulse")


@router.post("/{pulse_id}/share")
async def share_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Share a pulse (increment share count - legacy endpoint)"""
    repo = PulseRepository(session)
    try:
        count = await repo.share_pulse(pulse_id=pulse_id)
        await session.commit()
        return {"shared": True, "shares_count": count}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to share pulse")


# ==================== COMMENTS ====================

class CommentCreateBody(BaseModel):
    content: str = Field(..., max_length=500)


@router.post("/{pulse_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    pulse_id: str,
    body: CommentCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Add a comment to a pulse"""
    repo = PulseRepository(session)
    try:
        comment = await repo.add_comment(
            user_id=current_user.id,
            pulse_id=pulse_id,
            content=body.content
        )
        await session.commit()
        return comment
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
    try:
        comments = await repo.get_comments(pulse_id=pulse_id, page=page, limit=limit)
        return {"comments": comments, "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment"""
    repo = PulseRepository(session)
    success = await repo.delete_comment(user_id=current_user.id, comment_id=comment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or access denied"
        )
    await session.commit()
    return None


# ==================== COMMENT LIKES ====================

@router.post("/comments/{comment_id}/like")
async def like_comment(
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Like a comment"""
    repo = PulseRepository(session)
    try:
        result = await repo.like_comment(user_id=current_user.id, comment_id=comment_id)
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to like comment")


@router.delete("/comments/{comment_id}/like")
async def unlike_comment(
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Unlike a comment"""
    repo = PulseRepository(session)
    try:
        result = await repo.unlike_comment(user_id=current_user.id, comment_id=comment_id)
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to unlike comment")


# ==================== ENHANCED SHARE TRACKING ====================

class ShareCreateBody(BaseModel):
    shareType: str = Field("echo", pattern="^(echo|quote_echo)$")
    quoteContent: Optional[str] = Field(None, max_length=280)


@router.post("/{pulse_id}/share-detailed", status_code=status.HTTP_201_CREATED)
async def create_share(
    pulse_id: str,
    body: ShareCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a tracked share with user details and optional quote"""
    repo = PulseRepository(session)
    try:
        share = await repo.create_share(
            user_id=current_user.id,
            pulse_id=pulse_id,
            share_type=body.shareType,
            quote_content=body.quoteContent
        )
        await session.commit()
        return share
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create share")


@router.get("/{pulse_id}/shares")
async def get_shares(
    pulse_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
) -> Any:
    """Get users who shared a pulse"""
    repo = PulseRepository(session)
    try:
        shares = await repo.get_shares(pulse_id=pulse_id, page=page, limit=limit)
        return {"shares": shares, "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch shares")


@router.delete("/{pulse_id}/share-detailed", status_code=status.HTTP_204_NO_CONTENT)
async def delete_share(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a user's share"""
    repo = PulseRepository(session)
    success = await repo.delete_share(user_id=current_user.id, pulse_id=pulse_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    await session.commit()
    return None


# === COMMENT ENDPOINTS ===

class CommentCreateBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


@router.post("/{pulse_id}/comments")
async def create_comment(
    pulse_id: str,
    body: CommentCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new comment on a pulse"""
    from ..repositories.pulse_comments import PulseCommentRepository
    
    repo = PulseRepository(session)
    comment_repo = PulseCommentRepository(session)
    
    pulse = await repo.get_by_id(pulse_id)
    if not pulse:
        raise HTTPException(status_code=404, detail="Pulse not found")
    
    comment = await comment_repo.create_comment(
        pulse_id=pulse["id"],
        user_id=current_user.id,
        content=body.content
    )
    
    await session.commit()
    return comment


@router.get("/{pulse_id}/comments")
async def list_comments(
    pulse_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """List comments for a pulse with pagination"""
    from ..repositories.pulse_comments import PulseCommentRepository
    
    repo = PulseRepository(session)
    comment_repo = PulseCommentRepository(session)
    
    pulse = await repo.get_by_id(pulse_id)
    if not pulse:
        raise HTTPException(status_code=404, detail="Pulse not found")
    
    comments = await comment_repo.list_comments(pulse_id=pulse["id"], page=page, limit=limit)
    total = await comment_repo.get_comment_count(pulse["id"])
    
    return {
        "comments": comments,
        "total": total,
        "page": page,
        "limit": limit,
        "hasMore": (page * limit) < total
    }


@router.delete("/{pulse_id}/comments/{comment_id}")
async def delete_comment(
    pulse_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (only by owner)"""
    from ..repositories.pulse_comments import PulseCommentRepository
    
    comment_repo = PulseCommentRepository(session)
    
    try:
        deleted = await comment_repo.delete_comment(comment_id=comment_id, user_id=current_user.id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        await session.commit()
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

