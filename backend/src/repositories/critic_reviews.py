"""Critic Hub - Critic Reviews Repository"""
from typing import List, Optional
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid
import re

from ..models import CriticReview, CriticReviewComment, CriticReviewLike, CriticProfile, Movie, User


class CriticReviewRepository:
    """Repository for critic review operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_slug(self, movie_title: str, critic_username: str) -> str:
        """Generate URL slug from movie title and critic username"""
        # Combine movie title and critic username
        text = f"{movie_title}-{critic_username}"
        # Convert to lowercase
        text = text.lower()
        # Replace spaces and special chars with hyphens
        text = re.sub(r'[^a-z0-9]+', '-', text)
        # Remove leading/trailing hyphens
        text = text.strip('-')
        # Add timestamp with microseconds to ensure uniqueness
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        # Add random component for extra uniqueness
        random_suffix = str(uuid.uuid4())[:8]
        return f"{text}-{timestamp}-{random_suffix}"

    async def create_review(
        self,
        critic_id: int,
        movie_id: int,
        content: str,
        rating_type: str | None = None,
        rating_value: str | None = None,
        numeric_rating: float | None = None,
        title: str | None = None,
        youtube_embed_url: str | None = None,
        image_gallery: list | None = None,
        watch_links: list | None = None,
        is_draft: bool = False,
        meta_description: str | None = None,
    ) -> CriticReview:
        """Create a new critic review"""
        # Get critic and movie for slug generation
        critic_result = await self.db.execute(
            select(CriticProfile).where(CriticProfile.id == critic_id)
        )
        critic = critic_result.scalar_one()
        
        movie_result = await self.db.execute(
            select(Movie).where(Movie.id == movie_id)
        )
        movie = movie_result.scalar_one()
        
        slug = self._generate_slug(movie.title, critic.username)
        
        review = CriticReview(
            external_id=str(uuid.uuid4()),
            critic_id=critic_id,
            movie_id=movie_id,
            title=title,
            content=content,
            rating_type=rating_type,
            rating_value=rating_value,
            numeric_rating=numeric_rating,
            youtube_embed_url=youtube_embed_url,
            image_gallery=image_gallery or [],
            watch_links=watch_links or [],
            is_draft=is_draft,
            slug=slug,
            meta_description=meta_description,
        )
        self.db.add(review)
        
        # Increment critic's total_reviews if not draft
        if not is_draft:
            await self.db.execute(
                update(CriticProfile)
                .where(CriticProfile.id == critic_id)
                .values(total_reviews=CriticProfile.total_reviews + 1)
            )
        
        await self.db.commit()
        await self.db.refresh(review)

        # Explicitly load relationships
        await self.db.refresh(review, ["critic", "movie"])

        return review

    async def get_review_by_id(self, review_id: int) -> Optional[CriticReview]:
        """Get review by ID"""
        result = await self.db.execute(
            select(CriticReview)
            .where(CriticReview.id == review_id)
            .options(selectinload(CriticReview.critic), selectinload(CriticReview.movie))
        )
        return result.scalar_one_or_none()

    async def get_review_by_external_id(self, external_id: str) -> Optional[CriticReview]:
        """Get review by external ID"""
        result = await self.db.execute(
            select(CriticReview)
            .where(CriticReview.external_id == external_id)
            .options(selectinload(CriticReview.critic), selectinload(CriticReview.movie))
        )
        return result.scalar_one_or_none()

    async def get_review_by_slug(self, slug: str) -> Optional[CriticReview]:
        """Get review by slug"""
        result = await self.db.execute(
            select(CriticReview)
            .where(CriticReview.slug == slug)
            .options(selectinload(CriticReview.critic), selectinload(CriticReview.movie))
        )
        return result.scalar_one_or_none()

    async def update_review(self, review_id: int, **kwargs) -> Optional[CriticReview]:
        """Update a review"""
        kwargs['updated_at'] = datetime.utcnow()
        await self.db.execute(
            update(CriticReview)
            .where(CriticReview.id == review_id)
            .values(**kwargs)
        )
        await self.db.commit()
        return await self.get_review_by_id(review_id)

    async def delete_review(self, review_id: int) -> bool:
        """Delete a review"""
        # Get review to check if it's published
        review = await self.get_review_by_id(review_id)
        if not review:
            return False
        
        # Decrement critic's total_reviews if not draft
        if not review.is_draft:
            await self.db.execute(
                update(CriticProfile)
                .where(CriticProfile.id == review.critic_id)
                .values(total_reviews=CriticProfile.total_reviews - 1)
            )
        
        result = await self.db.execute(
            delete(CriticReview).where(CriticReview.id == review_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def list_reviews_by_critic(
        self,
        critic_id: int,
        include_drafts: bool = False,
        limit: int = 20,
        offset: int = 0
    ) -> List[CriticReview]:
        """List reviews by critic"""
        query = (
            select(CriticReview)
            .where(CriticReview.critic_id == critic_id)
            .options(selectinload(CriticReview.critic), selectinload(CriticReview.movie))
        )
        
        if not include_drafts:
            query = query.where(CriticReview.is_draft == False)
        
        query = query.order_by(CriticReview.published_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_reviews_by_movie(
        self,
        movie_id: int,
        limit: int = 20,
        offset: int = 0
    ) -> List[CriticReview]:
        """List reviews for a movie"""
        """List reviews for a movie"""
        query = (
            select(CriticReview)
            .where(
                (CriticReview.movie_id == movie_id) &
                (CriticReview.is_draft == False)
            )
            .options(selectinload(CriticReview.critic), selectinload(CriticReview.movie))
            .order_by(CriticReview.published_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def increment_view_count(self, review_id: int) -> None:
        """Increment view count for a review"""
        await self.db.execute(
            update(CriticReview)
            .where(CriticReview.id == review_id)
            .values(view_count=CriticReview.view_count + 1)
        )
        await self.db.commit()

    async def like_review(self, review_id: int, user_id: int) -> CriticReviewLike:
        """Like a review"""
        like = CriticReviewLike(
            review_id=review_id,
            user_id=user_id
        )
        self.db.add(like)
        
        # Increment like count
        await self.db.execute(
            update(CriticReview)
            .where(CriticReview.id == review_id)
            .values(like_count=CriticReview.like_count + 1)
        )
        
        await self.db.commit()
        await self.db.refresh(like)
        return like

    async def unlike_review(self, review_id: int, user_id: int) -> bool:
        """Unlike a review"""
        result = await self.db.execute(
            delete(CriticReviewLike).where(
                (CriticReviewLike.review_id == review_id) &
                (CriticReviewLike.user_id == user_id)
            )
        )
        
        if result.rowcount > 0:
            # Decrement like count
            await self.db.execute(
                update(CriticReview)
                .where(CriticReview.id == review_id)
                .values(like_count=CriticReview.like_count - 1)
            )
            await self.db.commit()
            return True
        
        return False

    async def has_liked_review(self, review_id: int, user_id: int) -> bool:
        """Check if user has liked a review"""
        result = await self.db.execute(
            select(CriticReviewLike).where(
                (CriticReviewLike.review_id == review_id) &
                (CriticReviewLike.user_id == user_id)
            )
        )
        return result.scalar_one_or_none() is not None

    async def add_comment(
        self,
        review_id: int,
        user_id: int,
        content: str,
        parent_id: int | None = None
    ) -> CriticReviewComment:
        """Add a comment to a review"""
        comment = CriticReviewComment(
            external_id=str(uuid.uuid4()),
            review_id=review_id,
            user_id=user_id,
            content=content,
            parent_id=parent_id
        )
        self.db.add(comment)
        
        # Increment comment count
        await self.db.execute(
            update(CriticReview)
            .where(CriticReview.id == review_id)
            .values(comment_count=CriticReview.comment_count + 1)
        )
        
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def get_comments(
        self,
        review_id: int,
        parent_id: int | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CriticReviewComment]:
        """Get comments for a review"""
        query = select(CriticReviewComment).where(
            (CriticReviewComment.review_id == review_id) &
            (CriticReviewComment.is_deleted == False)
        )
        
        if parent_id is None:
            query = query.where(CriticReviewComment.parent_id.is_(None))
        else:
            query = query.where(CriticReviewComment.parent_id == parent_id)
        
        query = query.order_by(CriticReviewComment.created_at.asc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete_comment(self, comment_id: int) -> bool:
        """Soft delete a comment"""
        result = await self.db.execute(
            update(CriticReviewComment)
            .where(CriticReviewComment.id == comment_id)
            .values(is_deleted=True, updated_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0

