"""
Pulse Comments Repository
Handles CRUD operations for pulse comments
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid

from ..models import PulseComment, User, Pulse


class PulseCommentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_comment(
        self,
        pulse_id: int,
        user_id: int,
        content: str,
    ) -> Dict[str, Any]:
        """Create a new comment on a pulse"""
        # Validate content
        content = content.strip()
        if not content:
            raise ValueError("Comment content cannot be empty")
        if len(content) > 500:
            raise ValueError("Comment content must be 500 characters or less")

        # Verify pulse exists
        pulse_res = await self.session.execute(
            select(Pulse).where(Pulse.id == pulse_id)
        )
        pulse = pulse_res.scalar_one_or_none()
        if not pulse:
            raise ValueError(f"Pulse with id {pulse_id} not found")

        # Create comment
        comment = PulseComment(
            external_id=str(uuid.uuid4()),
            pulse_id=pulse_id,
            user_id=user_id,
            content=content,
            created_at=datetime.utcnow(),
        )
        self.session.add(comment)
        await self.session.flush()
        await self.session.refresh(comment, ["user"])

        return self._to_dto(comment)

    async def list_comments(
        self,
        pulse_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """List comments for a pulse with pagination"""
        offset = (page - 1) * limit

        query = (
            select(PulseComment)
            .where(PulseComment.pulse_id == pulse_id)
            .order_by(PulseComment.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        comments = result.scalars().all()

        return [self._to_dto(comment) for comment in comments]

    async def get_comment_count(self, pulse_id: int) -> int:
        """Get total number of comments for a pulse"""
        result = await self.session.execute(
            select(func.count(PulseComment.id)).where(
                PulseComment.pulse_id == pulse_id
            )
        )
        return result.scalar() or 0

    async def delete_comment(
        self,
        comment_id: str,
        user_id: int,
    ) -> bool:
        """Delete a comment (only by owner)"""
        # Get comment
        result = await self.session.execute(
            select(PulseComment).where(PulseComment.external_id == comment_id)
        )
        comment = result.scalar_one_or_none()

        if not comment:
            return False

        # Verify ownership
        if comment.user_id != user_id:
            raise ValueError("You can only delete your own comments")

        await self.session.delete(comment)
        await self.session.flush()

        return True

    def _to_dto(self, comment: PulseComment) -> Dict[str, Any]:
        """Convert comment model to DTO"""
        return {
            "id": comment.external_id,
            "pulseId": comment.pulse_id,
            "content": comment.content,
            "createdAt": comment.created_at.isoformat() if comment.created_at else None,
            "user": {
                "id": comment.user.external_id if comment.user else None,
                "displayName": comment.user.display_name if comment.user else "Unknown",
                "username": comment.user.username if comment.user else "unknown",
                "avatarUrl": comment.user.avatar_url if comment.user else None,
            } if comment.user else None,
        }
