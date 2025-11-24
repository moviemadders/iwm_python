from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..repositories.reviews import ReviewRepository
from ..dependencies.auth import get_current_user
from ..models import User

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewIn(BaseModel):
    movieId: str
    userId: str
    rating: float  # 0-10
    title: Optional[str] = None
    content: str
    spoilers: bool = False
    gifUrl: Optional[str] = None


class ReviewUpdateBody(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[float] = None
    hasSpoilers: Optional[bool] = None
    gifUrl: Optional[str] = None


@router.get("")
async def list_reviews(
    page: int = 1,
    limit: int = 20,
    movieId: str | None = None,
    userId: str | None = None,
    sortBy: str = "date_desc",
    session: AsyncSession = Depends(get_session),
) -> Any:
    """
    List reviews with optional filters.

    - page: page number (1-based)
    - limit: results per page
    - movieId: filter by movie external_id
    - userId: filter by user external_id
    - sortBy: date_desc, date_asc, rating_desc, rating_asc, helpful_desc
    """
    repo = ReviewRepository(session)
    return await repo.list(
        page=page, limit=limit, movie_id=movieId, user_id=userId, sort_by=sortBy
    )


@router.get("/{review_id}")
async def get_review(review_id: str, session: AsyncSession = Depends(get_session)) -> Any:
    repo = ReviewRepository(session)
    data = await repo.get(review_id)
    if not data:
        raise HTTPException(status_code=404, detail="Review not found")
    return data


@router.post("")
async def create_review(body: ReviewIn, session: AsyncSession = Depends(get_session)) -> Any:
    """Create a new review for a movie"""
    repo = ReviewRepository(session)
    try:
        result = await repo.create(
            movie_id=body.movieId,
            user_id=body.userId,
            rating=body.rating,
            title=body.title,
            content=body.content,
            spoilers=body.spoilers,
            gif_url=body.gifUrl,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create review")


@router.put("/{review_id}")
async def update_review(
    review_id: str,
    body: ReviewUpdateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update an existing review. User must own the review."""
    repo = ReviewRepository(session)
    try:
        result = await repo.update(
            review_id=review_id,
            user_id=current_user.id,
            title=body.title,
            content=body.content,
            rating=body.rating,
            has_spoilers=body.hasSpoilers,
            gif_url=body.gifUrl,
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        if "does not own" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update review")


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a review. User must own the review."""
    repo = ReviewRepository(session)
    try:
        result = await repo.delete(review_id=review_id, user_id=current_user.id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        await session.commit()
        return {"deleted": True}
    except ValueError as e:
        await session.rollback()
        if "does not own" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete review")


@router.post("/{review_id}/vote")
async def vote_on_review(
    review_id: str,
    vote_type: str,  # Query parameter: "helpful" or "unhelpful"
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Vote on a review (helpful or unhelpful)."""
    from ..repositories.review_votes import ReviewVoteRepository
    
    if vote_type not in ["helpful", "unhelpful"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="vote_type must be 'helpful' or 'unhelpful'"
        )
    
    repo = ReviewVoteRepository(session)
    try:
        result = await repo.create_or_update_vote(review_id, current_user.id, vote_type)
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to vote on review")


@router.delete("/{review_id}/vote")
async def remove_vote_from_review(
    review_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Remove user's vote from a review."""
    from ..repositories.review_votes import ReviewVoteRepository
    
    repo = ReviewVoteRepository(session)
    try:
        result = await repo.delete_vote(review_id, current_user.id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vote not found")
        await session.commit()
        return {"deleted": True}
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to remove vote")


@router.get("/{review_id}/vote")
async def get_user_vote_on_review(
    review_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get the current user's vote on a review."""
    from ..repositories.review_votes import ReviewVoteRepository
    
    repo = ReviewVoteRepository(session)
    result = await repo.get_user_vote(review_id, current_user.id)
    if not result:
        return {"voteType": None}
    return result


# Review Comments Endpoints

class CommentCreateBody(BaseModel):
    content: str
    parentId: Optional[str] = None


@router.post("/{review_id}/comments")
async def create_comment(
    review_id: str,
    body: CommentCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a comment on a review."""
    from ..repositories.review_comments import ReviewCommentRepository
    
    repo = ReviewCommentRepository(session)
    try:
        result = await repo.create_comment(
            review_id=review_id,
            user_id=current_user.id,
            content=body.content,
            parent_id=body.parentId,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        print(f"ERROR in create_comment endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create comment: {str(e)}")


@router.get("/{review_id}/comments")
async def list_comments(
    review_id: str,
    parentId: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user),
) -> Any:
    """List comments for a review."""
    from ..repositories.review_comments import ReviewCommentRepository
    
    repo = ReviewCommentRepository(session)
    try:
        result = await repo.list_comments(
            review_id=review_id,
            parent_id=parentId,
            page=page,
            limit=limit,
        )
        
        # If user is authenticated, populate userHasLiked for each comment
        if current_user:
            for comment in result["comments"]:
                has_liked = await repo.get_user_like(comment["id"], current_user.id)
                comment["userHasLiked"] = has_liked or False
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


@router.post("/{review_id}/comments/{comment_id}/like")
async def like_comment(
    review_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Like a comment."""
    from ..repositories.review_comments import ReviewCommentRepository
    
    repo = ReviewCommentRepository(session)
    try:
        result = await repo.like_comment(comment_id, current_user.id)
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to like comment")


@router.delete("/{review_id}/comments/{comment_id}/like")
async def unlike_comment(
    review_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Unlike a comment."""
    from ..repositories.review_comments import ReviewCommentRepository
    
    repo = ReviewCommentRepository(session)
    try:
        result = await repo.unlike_comment(comment_id, current_user.id)
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to unlike comment")

