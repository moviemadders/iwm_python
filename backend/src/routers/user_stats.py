from __future__ import annotations

from datetime import date
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import User
from ..dependencies.auth import get_current_user
from ..repositories.user_stats import UserStatsRepository

router = APIRouter(prefix="/users", tags=["user-stats"])


@router.get("/{user_id}/stats/today")
async def get_todays_stats(
    user_id: str = Path(..., description="User external ID"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get today's activity stats for a user.
    
    Returns counts for:
    - Pulses posted today
    - Likes received today
    - New followers today
    - Comments received today
    """
    # Verify user exists and get their internal ID
    from sqlalchemy import select
    stmt = select(User.id).where(User.external_id == user_id)
    result = await session.execute(stmt)
    internal_user_id = result.scalar_one_or_none()
    
    if not internal_user_id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stats
    repo = UserStatsRepository(session)
    stats = await repo.get_todays_stats(internal_user_id)
    
    return stats


@router.get("/{user_id}/stats/week")
async def get_weekly_stats(
    user_id: str = Path(..., description="User external ID"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get last 7 days of activity stats for a user.
    
    Returns:
    - Total counts across all 7 days
    - Daily breakdown for each day
    """
    # Verify user exists and get their internal ID
    from sqlalchemy import select
    stmt = select(User.id).where(User.external_id == user_id)
    result = await session.execute(stmt)
    internal_user_id = result.scalar_one_or_none()
    
    if not internal_user_id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stats
    repo = UserStatsRepository(session)
    stats = await repo.get_weekly_stats(internal_user_id)
    
    return stats


@router.get("/{user_id}/stats/month")
async def get_monthly_stats(
    user_id: str = Path(..., description="User external ID"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get last 30 days of activity stats for a user.
    
    Returns:
    - Total counts across all 30 days
    - Daily breakdown for each day
    """
    # Verify user exists and get their internal ID
    from sqlalchemy import select
    stmt = select(User.id).where(User.external_id == user_id)
    result = await session.execute(stmt)
    internal_user_id = result.scalar_one_or_none()
    
    if not internal_user_id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stats
    repo = UserStatsRepository(session)
    stats = await repo.get_monthly_stats(internal_user_id)
    
    return stats


@router.get("/{user_id}/stats/range")
async def get_stats_range(
    user_id: str = Path(..., description="User external ID"),
    start_date: str = Path(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Path(..., description="End date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get activity stats for a custom date range.
    
    Returns:
    - Total counts across the date range
    - Daily breakdown for each day
    """
    # Verify user exists and get their internal ID
    from sqlalchemy import select
    stmt = select(User.id).where(User.external_id == user_id)
    result = await session.execute(stmt)
    internal_user_id = result.scalar_one_or_none()
    
    if not internal_user_id:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse dates
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Get stats
    repo = UserStatsRepository(session)
    stats = await repo.get_stats_range(internal_user_id, start, end)
    
    return stats
