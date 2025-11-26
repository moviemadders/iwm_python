from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Any, Dict, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import UserDailyStats, User


class UserStatsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ==================== READ STATS ====================

    async def get_todays_stats(self, user_id: int) -> Dict[str, Any]:
        """Get today's activity stats for a user"""
        today = date.today()
        
        stmt = select(UserDailyStats).where(
            UserDailyStats.user_id == user_id,
            UserDailyStats.date == today
        )
        stats = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not stats:
            # Return zeros if no stats exist yet
            return {
                "date": today.isoformat(),
                "pulsesPosted": 0,
                "likesReceived": 0,
                "newFollowers": 0,
                "commentsReceived": 0
            }
        
        return self._stats_to_dto(stats)

    async def get_weekly_stats(self, user_id: int) -> Dict[str, Any]:
        """Get last 7 days of activity stats"""
        end_date = date.today()
        start_date = end_date - timedelta(days=6)
        
        return await self.get_stats_range(user_id, start_date, end_date)

    async def get_monthly_stats(self, user_id: int) -> Dict[str, Any]:
        """Get last 30 days of activity stats"""
        end_date = date.today()
        start_date = end_date - timedelta(days=29)
        
        return await self.get_stats_range(user_id, start_date, end_date)

    async def get_stats_range(
        self, 
        user_id: int, 
        start_date: date, 
        end_date: date
    ) -> Dict[str, Any]:
        """Get aggregated stats for a date range"""
        stmt = select(
            func.sum(UserDailyStats.pulses_posted).label('total_pulses'),
            func.sum(UserDailyStats.likes_received).label('total_likes'),
            func.sum(UserDailyStats.new_followers).label('total_followers'),
            func.sum(UserDailyStats.comments_received).label('total_comments')
        ).where(
            and_(
                UserDailyStats.user_id == user_id,
                UserDailyStats.date >= start_date,
                UserDailyStats.date <= end_date
            )
        )
        
        result = (await self.session.execute(stmt)).first()
        
        # Get daily breakdown
        daily_stmt = select(UserDailyStats).where(
            and_(
                UserDailyStats.user_id == user_id,
                UserDailyStats.date >= start_date,
                UserDailyStats.date <= end_date
            )
        ).order_by(UserDailyStats.date)
        
        daily_stats = (await self.session.execute(daily_stmt)).scalars().all()
        
        return {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "totals": {
                "pulsesPosted": int(result.total_pulses or 0),
                "likesReceived": int(result.total_likes or 0),
                "newFollowers": int(result.total_followers or 0),
                "commentsReceived": int(result.total_comments or 0)
            },
            "daily": [self._stats_to_dto(s) for s in daily_stats]
        }

    # ==================== UPDATE STATS ====================

    async def increment_pulses_posted(self, user_id: int, increment: int = 1) -> None:
        """Increment pulses posted count for today"""
        await self._increment_stat(user_id, "pulses_posted", increment)

    async def increment_likes_received(self, user_id: int, increment: int = 1) -> None:
        """Increment likes received count for today"""
        await self._increment_stat(user_id, "likes_received", increment)

    async def increment_new_followers(self, user_id: int, increment: int = 1) -> None:
        """Increment new followers count for today"""
        await self._increment_stat(user_id, "new_followers", increment)

    async def increment_comments_received(self, user_id: int, increment: int = 1) -> None:
        """Increment comments received count for today"""
        await self._increment_stat(user_id, "comments_received", increment)

    async def _increment_stat(self, user_id: int, field: str, increment: int = 1) -> None:
        """Helper to increment a specific stat field"""
        today = date.today()
        
        # Try to find existing stats for today
        stmt = select(UserDailyStats).where(
            UserDailyStats.user_id == user_id,
            UserDailyStats.date == today
        )
        stats = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not stats:
            # Create new stats entry for today
            stats = UserDailyStats(
                user_id=user_id,
                date=today,
                pulses_posted=0,
                likes_received=0,
                new_followers=0,
                comments_received=0
            )
            self.session.add(stats)
            await self.session.flush()
        
        # Increment the specified field
        current_value = getattr(stats, field)
        setattr(stats, field, current_value + increment)
        
        await self.session.flush()

    # ==================== HELPERS ====================

    def _stats_to_dto(self, stats: UserDailyStats) -> Dict[str, Any]:
        """Convert stats to DTO"""
        return {
            "date": stats.date.isoformat(),
            "pulsesPosted": stats.pulses_posted,
            "likesReceived": stats.likes_received,
            "newFollowers": stats.new_followers,
            "commentsReceived": stats.comments_received
        }
