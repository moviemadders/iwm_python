from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import UserNotification, User, Pulse, PulseComment, NotificationType


def _slugify_username(name: str | None) -> str:
    if not name:
        return "user"
    return "".join(ch.lower() if ch.isalnum() else "" for ch in name) or "user"


class PulseNotificationsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ==================== CREATE NOTIFICATIONS ====================

    async def create_notification(
        self,
        user_id: int,
        actor_id: int,
        notification_type: NotificationType,
        pulse_id: Optional[int] = None,
        comment_id: Optional[int] = None,
        content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new notification"""
        # Don't notify users about their own actions
        if user_id == actor_id:
            return {}
        
        # Create notification
        notification = UserNotification(
            external_id=str(uuid.uuid4()),
            user_id=user_id,
            type=notification_type,
            actor_id=actor_id,
            pulse_id=pulse_id,
            comment_id=comment_id,
            content=content,
            is_read=False,
            created_at=datetime.utcnow()
        )
        self.session.add(notification)
        await self.session.flush()
        await self.session.refresh(notification, ["actor", "pulse", "comment"])
        
        return self._notification_to_dto(notification)

    # ==================== READ NOTIFICATIONS ====================

    async def list_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        page: int = 1,
        limit:int = 20
    ) -> List[Dict[str, Any]]:
        """List notifications for a user"""
        conditions = [UserNotification.user_id == user_id]
        
        if unread_only:
            conditions.append(UserNotification.is_read == False)
        
        stmt = (
            select(UserNotification)
            .where(and_(*conditions))
            .options(
                selectinload(UserNotification.actor),
                selectinload(UserNotification.pulse),
                selectinload(UserNotification.comment)
            )
            .order_by(desc(UserNotification.created_at))
            .limit(limit)
            .offset((page - 1) * limit)
        )
        
        notifications = (await self.session.execute(stmt)).scalars().all()
        
        return [self._notification_to_dto(n) for n in notifications]

    async def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications"""
        stmt = select(func.count(UserNotification.id)).where(
            UserNotification.user_id == user_id,
            UserNotification.is_read == False
        )
        
        count = (await self.session.execute(stmt)).scalar()
        return count or 0

    # ==================== UPDATE NOTIFICATIONS ====================

    async def mark_as_read(self, notification_id: str, user_id: int) -> bool:
        """Mark a notification as read"""
        stmt = select(UserNotification).where(
            UserNotification.external_id == notification_id,
            UserNotification.user_id == user_id
        )
        notification = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not notification:
            return False
        
        notification.is_read = True
        await self.session.flush()
        
        return True

    async def mark_all_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        stmt = select(UserNotification).where(
            UserNotification.user_id == user_id,
            UserNotification.is_read == False
        )
        notifications = (await self.session.execute(stmt)).scalars().all()
        
        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1
        
        await self.session.flush()
        
        return count

    # ==================== DELETE NOTIFICATIONS ====================

    async def delete_notification(self, notification_id: str, user_id: int) -> bool:
        """Delete a notification"""
        stmt = select(UserNotification).where(
            UserNotification.external_id == notification_id,
            UserNotification.user_id == user_id
        )
        notification = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not notification:
            return False
        
        await self.session.delete(notification)
        await self.session.flush()
        
        return True

    # ==================== HELPERS ====================

    def _notification_to_dto(self, notification: UserNotification) -> Dict[str, Any]:
        """Convert notification to DTO"""
        actor = notification.actor
        
        dto = {
            "id": notification.external_id,
            "type": notification.type.value if hasattr(notification.type, 'value') else notification.type,
            "actor": {
                "userId": actor.external_id,
                "username": _slugify_username(actor.name),
                "displayName": actor.name,
                "avatarUrl": actor.avatar_url
            },
            "content": notification.content,
            "isRead": notification.is_read,
            "createdAt": notification.created_at.isoformat() + "Z"
        }
        
        # Add pulse reference if available
        if notification.pulse:
            dto["pulse"] = {
                "id": notification.pulse.external_id,
                "contentText": notification.pulse.content_text[:100]  # Preview
            }
        
        # Add comment reference if available
        if notification.comment:
            dto["comment"] = {
                "id": notification.comment.external_id,
                "content": notification.comment.content[:100]  # Preview
            }
        
        return dto
