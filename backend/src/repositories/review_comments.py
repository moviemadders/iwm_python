"""
Repository for review comment operations.
Handles creating, listing, and liking comments on user reviews.
"""

from __future__ import annotations
from sqlalchemy.orm import selectinload
from typing import Any, Optional, List
from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import ReviewComment, ReviewCommentLike, Review, User
import uuid


class ReviewCommentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_comment(
        self,
        review_id: str,
        user_id: int,
        content: str,
        parent_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new comment on a review."""
        # Get review
        review_result = await self.session.execute(
            select(Review).where(Review.external_id == review_id)
        )
        review = review_result.scalar_one_or_none()
        if not review:
            raise ValueError(f"Review {review_id} not found")

        # If parent_id, verify parent comment exists
        parent_comment_internal_id = None
        if parent_id:
            parent_result = await self.session.execute(
                select(ReviewComment).where(ReviewComment.external_id == parent_id)
            )
            parent_comment = parent_result.scalar_one_or_none()
            if not parent_comment:
                raise ValueError(f"Parent comment {parent_id} not found")
            parent_comment_internal_id = parent_comment.id

        try:
            # Create comment
            comment = ReviewComment(
                external_id=str(uuid.uuid4()),
                user_id=user_id,
                review_id=review.id,
                content=content,
                parent_id=parent_comment_internal_id,
            )
            self.session.add(comment)

            # Update review comment count
            review.comment_count += 1

            # Flush to persist the comment
            await self.session.flush()
            
            # Refresh with explicit user loading
            await self.session.refresh(comment, attribute_names=['user'])

            return self._format_comment(comment)
        except Exception as e:
            import traceback
            print(f"Error creating comment: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise ValueError(f"Failed to create comment: {str(e)}")

    async def list_comments(
        self,
        review_id: str,
        parent_id: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict[str, Any]:
        """List comments for a review. If parent_id is None, returns top-level comments."""
        # Get review
        review_result = await self.session.execute(
            select(Review).where(Review.external_id == review_id)
        )
        review = review_result.scalar_one_or_none()
        if not review:
            raise ValueError(f"Review {review_id} not found")

        # Build query
        query = select(ReviewComment).where(
            and_(
                ReviewComment.review_id == review.id,
                ReviewComment.is_deleted == False
            )
        )

        if parent_id is None:
            # Top-level comments only
            query = query.where(ReviewComment.parent_id.is_(None))
        else:
            # Replies to a specific comment
            parent_result = await self.session.execute(
                select(ReviewComment).where(ReviewComment.external_id == parent_id)
            )
            parent_comment = parent_result.scalar_one_or_none()
            if not parent_comment:
                raise ValueError(f"Parent comment {parent_id} not found")
            query = query.where(ReviewComment.parent_id == parent_comment.id)

        # Order by creation date (oldest first for threading)
        query = query.order_by(ReviewComment.created_at.asc())
        query = query.limit(limit).offset((page - 1) * limit)
        
        # Explicitly load replies and their authors
        query = query.options(
            selectinload(ReviewComment.replies).selectinload(ReviewComment.user),
            selectinload(ReviewComment.user)
        )

        result = await self.session.execute(query)
        comments = result.scalars().all()

        return {
            "comments": [self._format_comment(c) for c in comments],
            "total": len(comments),
            "page": page,
            "limit": limit,
        }

    async def like_comment(self, comment_id: str, user_id: int) -> dict[str, Any]:
        """Like a comment."""
        # Get comment
        comment_result = await self.session.execute(
            select(ReviewComment).where(ReviewComment.external_id == comment_id)
        )
        comment = comment_result.scalar_one_or_none()
        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        # Check if already liked
        existing_like_result = await self.session.execute(
            select(ReviewCommentLike).where(
                and_(
                    ReviewCommentLike.comment_id == comment.id,
                    ReviewCommentLike.user_id == user_id
                )
            )
        )
        existing_like = existing_like_result.scalar_one_or_none()

        if existing_like:
            return {"liked": True, "likesCount": comment.likes_count}

        # Create like
        like = ReviewCommentLike(
            external_id=str(uuid.uuid4()),
            user_id=user_id,
            comment_id=comment.id,
        )
        self.session.add(like)

        # Update count
        comment.likes_count += 1

        return {"liked": True, "likesCount": comment.likes_count}

    async def unlike_comment(self, comment_id: str, user_id: int) -> dict[str, Any]:
        """Unlike a comment."""
        # Get comment
        comment_result = await self.session.execute(
            select(ReviewComment).where(ReviewComment.external_id == comment_id)
        )
        comment = comment_result.scalar_one_or_none()
        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        # Find and delete like
        like_result = await self.session.execute(
            select(ReviewCommentLike).where(
                and_(
                    ReviewCommentLike.comment_id == comment.id,
                    ReviewCommentLike.user_id == user_id
                )
            )
        )
        like = like_result.scalar_one_or_none()

        if not like:
            return {"liked": False, "likesCount": comment.likes_count}

        await self.session.delete(like)

        # Update count
        comment.likes_count = max(0, comment.likes_count - 1)

        return {"liked": False, "likesCount": comment.likes_count}

    async def get_user_like(self, comment_id: str, user_id: int) -> Optional[bool]:
        """Check if user has liked a comment."""
        comment_result = await self.session.execute(
            select(ReviewComment).where(ReviewComment.external_id == comment_id)
        )
        comment = comment_result.scalar_one_or_none()
        if not comment:
            return None

        like_result = await self.session.execute(
            select(ReviewCommentLike).where(
                and_(
                    ReviewCommentLike.comment_id == comment.id,
                    ReviewCommentLike.user_id == user_id
                )
            )
        )
        like = like_result.scalar_one_or_none()
        return like is not None

    def _format_comment(self, comment: ReviewComment, include_replies: bool = True) -> dict[str, Any]:
        """Format comment for API response with optional nested replies."""
        try:
            formatted = {
                "id": comment.external_id,
                "content": comment.content,
                "createdAt": comment.created_at.isoformat() if comment.created_at else None,
                "editedAt": comment.edited_at.isoformat() if comment.edited_at else None,
                "author": {
                    "id": comment.user.external_id if comment.user else "",
                    "username": (comment.user.username or comment.user.name) if comment.user else "Unknown",
                    "avatarUrl": comment.user.avatar_url if (comment.user and comment.user.avatar_url) else "",
                },
                "likes": comment.likes_count,
                "userHasLiked": False,  # Will be populated by endpoint if user is authenticated
            }
            
            # Add nested replies if requested (for YouTube-style threading)
            if include_replies:
                try:
                    # Check if replies relationship is loaded
                    replies = getattr(comment, 'replies', [])
                    if replies:
                        # Filter out deleted replies and format recursively
                        formatted["replies"] = [
                            self._format_comment(reply, include_replies=True) 
                            for reply in replies 
                            if not reply.is_deleted
                        ]
                    else:
                        formatted["replies"] = []
                except Exception as e:
                    print(f"Error loading replies for comment {comment.external_id}: {str(e)}")
                    formatted["replies"] = []
            else:
                formatted["replies"] = []
            
            return formatted
        except Exception as e:
            print(f"Error formatting comment {comment.external_id if hasattr(comment, 'external_id') else 'unknown'}: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return a minimal valid response
            return {
                "id": getattr(comment, 'external_id', 'error'),
                "content": getattr(comment, 'content', 'Error loading comment'),
                "createdAt": None,
                "editedAt": None,
                "author": {"id": "", "username": "Unknown", "avatarUrl": ""},
                "likes": 0,
                "userHasLiked": False,
                "replies": []
            }


