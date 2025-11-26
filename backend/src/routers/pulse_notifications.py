from __future__ import annotations

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import User
from ..dependencies.auth import get_current_user
from ..repositories.pulse_notifications import PulseNotificationsRepository

router = APIRouter(prefix="/pulse/notifications", tags=["pulse-notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = Query(False, description="Only show unread notifications"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    List pulse notifications for the current user.
    
    Returns notifications for:
    - New followers
    - Likes on your pulses
    - Comments on your pulses
    - Mentions in pulses
    - Shares of your pulses
    """
    repo = PulseNotificationsRepository(session)
    notifications = await repo.list_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        page=page,
        limit=limit
    )
    
    return {
        "notifications": notifications,
        "page": page,
        "limit": limit
    }


@router.get("/unread-count")
async def get_unread_count(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get count of unread notifications"""
    repo = PulseNotificationsRepository(session)
    count = await repo.get_unread_count(current_user.id)
    
    return {"unreadCount": count}


@router.put("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_as_read(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read"""
    repo = PulseNotificationsRepository(session)
    success = await repo.mark_as_read(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    await session.commit()
    return None


@router.post("/mark-all-read")
async def mark_all_read(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark all notifications as read"""
    repo = PulseNotificationsRepository(session)
    count = await repo.mark_all_read(current_user.id)
    
    await session.commit()
    
    return {"markedCount": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification"""
    repo = PulseNotificationsRepository(session)
    success = await repo.delete_notification(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    await session.commit()
    return None
