"""
Repository for review vote operations.
Handles voting on reviews with automatic count updates.
"""

from __future__ import annotations
from typing import Any, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import ReviewVote, Review
import uuid


class ReviewVoteRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_vote(self, review_id: str, user_id: int) -> Optional[dict[str, Any]]:
        """Get a user's vote on a specific review."""
        # Get review internal ID
        review_result = await self.session.execute(
            select(Review).where(Review.external_id == review_id)
        )
        review = review_result.scalar_one_or_none()
        if not review:
            return None

        # Get vote
        result = await self.session.execute(
            select(ReviewVote).where(
                ReviewVote.review_id == review.id,
                ReviewVote.user_id == user_id
            )
        )
        vote = result.scalar_one_or_none()
        
        if not vote:
            return None
            
        return {
            "id": vote.external_id,
            "voteType": vote.vote_type,
            "createdAt": vote.created_at.isoformat() if vote.created_at else None,
        }

    async def create_or_update_vote(
        self, review_id: str, user_id: int, vote_type: str
    ) -> dict[str, Any]:
        """
        Create or update a user's vote on a review.
        Automatically updates review vote counts.
        """
        if vote_type not in ["helpful", "unhelpful"]:
            raise ValueError("vote_type must be 'helpful' or 'unhelpful'")

        # Get review
        review_result = await self.session.execute(
            select(Review).where(Review.external_id == review_id)
        )
        review = review_result.scalar_one_or_none()
        if not review:
            raise ValueError(f"Review {review_id} not found")

        # Check for existing vote
        existing_vote_result = await self.session.execute(
            select(ReviewVote).where(
                ReviewVote.review_id == review.id,
                ReviewVote.user_id == user_id
            )
        )
        existing_vote = existing_vote_result.scalar_one_or_none()

        if existing_vote:
            # Update existing vote
            old_vote_type = existing_vote.vote_type
            
            if old_vote_type == vote_type:
                # Same vote type - no change needed
                return {
                    "id": existing_vote.external_id,
                    "voteType": existing_vote.vote_type,
                    "changed": False,
                }
            
            # Different vote type - update counts
            if old_vote_type == "helpful":
                review.helpful_votes = max(0, review.helpful_votes - 1)
                review.unhelpful_votes += 1
            else:
                review.unhelpful_votes = max(0, review.unhelpful_votes - 1)
                review.helpful_votes += 1
            
            existing_vote.vote_type = vote_type
            
            return {
                "id": existing_vote.external_id,
                "voteType": existing_vote.vote_type,
                "changed": True,
            }
        else:
            # Create new vote
            vote = ReviewVote(
                external_id=str(uuid.uuid4()),
                user_id=user_id,
                review_id=review.id,
                vote_type=vote_type,
            )
            self.session.add(vote)
            
            # Update counts
            if vote_type == "helpful":
                review.helpful_votes += 1
            else:
                review.unhelpful_votes += 1
            
            return {
                "id": vote.external_id,
                "voteType": vote.vote_type,
                "changed": True,
            }

    async def delete_vote(self, review_id: str, user_id: int) -> bool:
        """
        Remove a user's vote from a review.
        Automatically updates review vote counts.
        """
        # Get review
        review_result = await self.session.execute(
            select(Review).where(Review.external_id == review_id)
        )
        review = review_result.scalar_one_or_none()
        if not review:
            return False

        # Get existing vote
        existing_vote_result = await self.session.execute(
            select(ReviewVote).where(
                ReviewVote.review_id == review.id,
                ReviewVote.user_id == user_id
            )
        )
        existing_vote = existing_vote_result.scalar_one_or_none()
        
        if not existing_vote:
            return False
        
        # Update counts
        if existing_vote.vote_type == "helpful":
            review.helpful_votes = max(0, review.helpful_votes - 1)
        else:
            review.unhelpful_votes = max(0, review.unhelpful_votes - 1)
        
        # Delete vote
        await self.session.execute(
            delete(ReviewVote).where(ReviewVote.id == existing_vote.id)
        )
        
        return True
