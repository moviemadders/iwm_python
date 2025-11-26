from __future__ import annotations

from typing import Any, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid

from ..models import Review, User, Movie


class ReviewRepository:
    def __init__(self, session: AsyncSession | None) -> None:
        self.session = session

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        movie_id: str | None = None,
        user_id: str | None = None,
        sort_by: str = "date_desc",
    ) -> List[dict[str, Any]]:
        if not self.session:
            return []
        q = select(Review)
        if movie_id:
            q = q.join(Review.movie).where(Movie.external_id == movie_id)
        if user_id:
            q = q.join(Review.author).where(User.external_id == user_id)

        if sort_by == "date_desc":
            q = q.order_by(desc(Review.date))
        elif sort_by == "date_asc":
            q = q.order_by(Review.date)
        elif sort_by == "rating_desc":
            q = q.order_by(desc(Review.rating))
        elif sort_by == "rating_asc":
            q = q.order_by(Review.rating)
        elif sort_by == "helpful_desc":
            q = q.order_by(desc(Review.helpful_votes))

        q = q.limit(limit).offset((page - 1) * limit)
        res = await self.session.execute(q)
        reviews = res.scalars().all()
        return [
            {
                "id": r.external_id,
                "title": r.title,
                "content": r.content,
                "rating": r.rating,
                "date": r.date.isoformat(),
                "hasSpoilers": r.has_spoilers,
                "isVerified": r.is_verified,
                "helpfulVotes": r.helpful_votes,
                "unhelpfulVotes": r.unhelpful_votes,
                "commentCount": r.comment_count,
                "engagementScore": r.engagement_score,
                "mediaUrls": r.media_urls.split(",") if r.media_urls else [],
                "gifUrl": r.gif_url,
                "author": {
                    "id": r.author.external_id,
                    "name": r.author.name,
                    "avatarUrl": r.author.avatar_url,
                },
                "movie": {
                    "id": r.movie.external_id,
                    "title": r.movie.title,
                    "posterUrl": r.movie.poster_url,
                    "year": int(r.movie.year) if r.movie.year else None,
                    "genres": [g.name for g in r.movie.genres],
                    "country": r.movie.country,
                    "language": r.movie.language,
                },
            }
            for r in reviews
        ]

    async def get(self, external_id: str) -> dict[str, Any] | None:
        if not self.session:
            return None
        q = select(Review).where(Review.external_id == external_id)
        res = await self.session.execute(q)
        r = res.scalar_one_or_none()
        if not r:
            return None

        # Get reviewer stats
        reviewer_reviews_count = await self.session.execute(
            select(Review).where(Review.user_id == r.user_id)
        )
        total_reviews = len(reviewer_reviews_count.scalars().all())

        return {
            "id": r.external_id,
            "title": r.title,
            "content": r.content,
            "rating": r.rating,
            "createdAt": r.date.isoformat(),
            "isSpoiler": r.has_spoilers,
            "isVerified": r.is_verified,
            "helpfulVotes": r.helpful_votes,
            "unhelpfulVotes": r.unhelpful_votes,
            "commentCount": r.comment_count,
            "engagementScore": r.engagement_score,
            "mediaUrls": r.media_urls.split(",") if r.media_urls else [],
            "gifUrl": r.gif_url,
            "reviewer": {
                "id": r.author.external_id,
                "username": r.author.name,
                "avatarUrl": r.author.avatar_url,
                "isVerifiedReviewer": r.is_verified,
                "totalReviews": total_reviews,
                "followerCount": 0,  # TODO: Implement followers system
            },
            "movie": {
                "id": r.movie.external_id,
                "title": r.movie.title,
                "releaseYear": int(r.movie.year) if r.movie.year else None,
                "posterUrl": r.movie.poster_url,
                "backdropUrl": r.movie.backdrop_url,
                "sidduScore": r.movie.siddu_score or 0,
                "genres": [g.name for g in r.movie.genres],
                "country": r.movie.country,
                "language": r.movie.language,
            },
            "engagement": {
                "likes": r.helpful_votes,
                "commentsCount": r.comment_count,
                "userHasLiked": False,  # TODO: Implement user-specific like tracking
            },
            "comments": [],  # TODO: Implement comments system
        }

    async def create(
        self,
        movie_id: str,
        user_id: str,
        rating: float,
        content: str,
        title: Optional[str] = None,
        spoilers: bool = False,
        gif_url: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new review"""
        if not self.session:
            return {}

        # Get user and movie
        user_res = await self.session.execute(select(User).where(User.external_id == user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            raise ValueError(f"User {user_id} not found")

        movie_res = await self.session.execute(select(Movie).where(Movie.external_id == movie_id))
        movie = movie_res.scalar_one_or_none()
        if not movie:
            raise ValueError(f"Movie {movie_id} not found")

        # Validate rating
        if not (0 <= rating <= 10):
            raise ValueError("Rating must be between 0 and 10")

        # Create review
        review = Review(
            external_id=str(uuid.uuid4()),
            user_id=user.id,
            movie_id=movie.id,
            title=title or "Untitled Review",
            content=content,
            rating=rating,
            has_spoilers=spoilers,
            date=datetime.utcnow(),
            is_verified=False,
            helpful_votes=0,
            unhelpful_votes=0,
            comment_count=0,
            engagement_score=0,
            gif_url=gif_url,
        )
        self.session.add(review)
        await self.session.flush()

        return {
            "id": review.external_id,
            "title": review.title,
            "content": review.content,
            "rating": review.rating,
            "date": review.date.isoformat(),
            "hasSpoilers": review.has_spoilers,
            "author": {
                "id": user.external_id,
                "name": user.name,
                "avatarUrl": user.avatar_url,
            },
            "movie": {
                "id": movie.external_id,
                "title": movie.title,
            },
            "gifUrl": review.gif_url,
        }

    async def update(
        self,
        review_id: str,
        user_id: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        rating: Optional[float] = None,
        has_spoilers: Optional[bool] = None,
        gif_url: Optional[str] = None,
    ) -> dict[str, Any] | None:
        """Update an existing review"""
        if not self.session:
            return None

        # Get review
        q = select(Review).where(Review.external_id == review_id)
        res = await self.session.execute(q)
        review = res.scalar_one_or_none()
        if not review:
            return None

        # Verify ownership
        if review.user_id != user_id:
            raise ValueError("User does not own this review")

        # Update fields
        if title is not None:
            review.title = title
        if content is not None:
            review.content = content
        if rating is not None:
            if not (0 <= rating <= 10):
                raise ValueError("Rating must be between 0 and 10")
            review.rating = rating
        if has_spoilers is not None:
            review.has_spoilers = has_spoilers
        if gif_url is not None:
            review.gif_url = gif_url

        await self.session.flush()

        return {
            "id": review.external_id,
            "title": review.title,
            "content": review.content,
            "rating": review.rating,
            "date": review.date.isoformat(),
            "hasSpoilers": review.has_spoilers,
            "gifUrl": review.gif_url,
        }

    async def delete(self, review_id: str, user_id: int) -> bool:
        """Delete a review"""
        if not self.session:
            return False

        # Get review
        q = select(Review).where(Review.external_id == review_id)
        res = await self.session.execute(q)
        review = res.scalar_one_or_none()
        if not review:
            return False

        # Verify ownership
        if review.user_id != user_id:
            raise ValueError("User does not own this review")

        await self.session.delete(review)
        await self.session.flush()
        return True

