from __future__ import annotations

from typing import Any, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..db import get_session
from ..models import User, Review, Watchlist, Favorite, Collection, UserSettings, UserFollow
from ..dependencies.auth import get_current_user_optional

router = APIRouter(prefix="/users", tags=["users"])


class UserStatsResponse(BaseModel):
    reviews: int
    watchlist: int
    favorites: int
    collections: int
    following: int
    followers: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    avatarUrl: Optional[str] = None
    bannerUrl: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    username: str
    name: str
    email: str
    bio: str | None
    avatarUrl: str | None
    bannerUrl: str | None
    joinedDate: str
    location: str | None
    website: str | None
    stats: UserStatsResponse
    isVerified: bool

    class Config:
        from_attributes = True


class SuggestedUser(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str | None
    isVerified: bool
    mutualCount: int = 0


@router.get("/suggested", response_model=List[SuggestedUser])
async def get_suggested_users(
    limit: int = Query(5, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
) -> Any:
    """
    Get suggested users to follow.
    For now, returns random users.
    """
    # Simple implementation: get random users
    query = select(User).order_by(func.random()).limit(limit)
    
    # If logged in, exclude self
    if current_user:
        query = query.where(User.id != current_user.id)
        
    result = await session.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": str(user.id),  # Use internal ID for now as frontend expects string
            "username": user.username or user.email.split("@")[0],
            "displayName": user.name or "User",
            "avatarUrl": user.avatar_url,
            "isVerified": False,  # TODO: Add verification logic
            "mutualCount": 0,
        }
        for user in users
    ]


@router.get("/{username}", response_model=UserProfileResponse)
async def get_user_by_username(
    username: str,
    session: AsyncSession = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
) -> Any:
    """
    Get user profile by username.
    Try multiple strategies:
    1. Exact email match
    2. Email prefix match (username@)
    3. External_id match

    Privacy: If profile is private, only the owner can view it.
    """
    user = None

    # Try exact username match first (new field)
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    # If not found, try exact email match
    if not user:
        query = select(User).where(User.email == username)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

    # If not found, try email prefix (limit to 1 to avoid MultipleResultsFound error)
    if not user:
        query = select(User).where(User.email.like(f"{username}@%")).limit(1)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

    # If still not found, try external_id
    if not user:
        query = select(User).where(User.external_id == username)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check privacy settings
    settings_query = select(UserSettings).where(UserSettings.user_id == user.id)
    settings_result = await session.execute(settings_query)
    user_settings = settings_result.scalar_one_or_none()

    # Get profile visibility setting (default to "public" if not set)
    profile_visibility = "public"
    if user_settings and user_settings.privacy:
        profile_visibility = user_settings.privacy.get("profileVisibility", "public")

    # Check if profile is private and viewer is not the owner
    is_owner = current_user and current_user.id == user.id

    if profile_visibility == "private" and not is_owner:
        # Return 404 to not reveal that the user exists
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get user stats
    stats = await get_user_stats_internal(user.id, session)

    # Determine display username
    display_username = user.username
    if not display_username:
        # Fallback to email prefix if username not set
        display_username = user.email.split('@')[0] if '@' in user.email else user.email

    # Determine verification status based on active role
    is_verified = False
    if user.active_role == "critic" and user.critic_profile:
        is_verified = user.critic_profile.is_verified
    
    return UserProfileResponse(
        id=user.external_id,
        username=display_username,
        name=user.name,
        email=user.email,
        bio=user.bio,
        avatarUrl=user.avatar_url,
        bannerUrl=user.banner_url,
        joinedDate=user.created_at.strftime("%B %Y"),
        location=user.location,
        website=user.website,
        stats=stats,
        isVerified=is_verified,
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    """
    Update current user's profile.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Update fields if provided
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.location is not None:
        current_user.location = user_update.location
    if user_update.website is not None:
        current_user.website = user_update.website
    if user_update.avatarUrl is not None:
        current_user.avatar_url = user_update.avatarUrl
    if user_update.bannerUrl is not None:
        current_user.banner_url = user_update.bannerUrl

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    # Get stats for response
    stats = await get_user_stats_internal(current_user.id, session)

    # Determine display username
    display_username = current_user.username
    if not display_username:
        display_username = current_user.email.split('@')[0] if '@' in current_user.email else current_user.email

    return UserProfileResponse(
        id=current_user.external_id,
        username=display_username,
        name=current_user.name,
        email=current_user.email,
        bio=current_user.bio,
        avatarUrl=current_user.avatar_url,
        bannerUrl=current_user.banner_url,
        joinedDate=current_user.created_at.strftime("%B %Y"),
        location=current_user.location,
        website=current_user.website,
        stats=stats,
        isVerified=False,
    )


@router.get("/{username}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    username: str,
    session: AsyncSession = Depends(get_session),
) -> Any:
    """Get user statistics (counts for reviews, watchlist, favorites, collections)"""
    # Find user by username
    query = select(User).where(User.email.like(f"{username}%"))
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return await get_user_stats_internal(user.id, session)


async def get_user_stats_internal(user_id: int, session: AsyncSession) -> UserStatsResponse:
    """Internal function to get user stats by user ID"""
    # Count reviews
    reviews_query = select(func.count(Review.id)).where(Review.user_id == user_id)
    reviews_result = await session.execute(reviews_query)
    reviews_count = reviews_result.scalar() or 0
    
    # Count watchlist items
    watchlist_query = select(func.count(Watchlist.id)).where(Watchlist.user_id == user_id)
    watchlist_result = await session.execute(watchlist_query)
    watchlist_count = watchlist_result.scalar() or 0
    
    # Count favorites
    favorites_query = select(func.count(Favorite.id)).where(
        Favorite.user_id == user_id,
        Favorite.type == "movie"
    )
    favorites_result = await session.execute(favorites_query)
    favorites_count = favorites_result.scalar() or 0
    
    
    # Count collections
    collections_query = select(func.count(Collection.id)).where(Collection.user_id == user_id)
    collections_result = await session.execute(collections_query)
    collections_count = collections_result.scalar() or 0
    
    # Get follow stats using PulseRepository
    # We need to import PulseRepository inside function to avoid circular import if it was at top level
    # But since we are in a function, it's fine. 
    # Actually, let's just use the queries directly here or import PulseRepository.
    # Since PulseRepository is in a different module, we should import it at top level or locally.
    from ..repositories.pulse import PulseRepository
    repo = PulseRepository(session)
    following_count = await repo.get_following_count(user_id)
    followers_count = await repo.get_follower_count(user_id)
    
    return UserStatsResponse(
        reviews=reviews_count,
        watchlist=watchlist_count,
        favorites=favorites_count,
        collections=collections_count,
        following=following_count,
        followers=followers_count,
    )


@router.post("/{username}/follow")
async def follow_user(
    username: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    """Follow a user"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Find user to follow
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    target_user = result.scalar_one_or_none()
    
    # Try email prefix if not found
    if not target_user:
        query = select(User).where(User.email.like(f"{username}@%")).limit(1)
        result = await session.execute(query)
        target_user = result.scalar_one_or_none()
        
    # Try external_id
    if not target_user:
        query = select(User).where(User.external_id == username)
        result = await session.execute(query)
        target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    from ..repositories.pulse import PulseRepository
    repo = PulseRepository(session)
    try:
        await repo.follow_user(current_user.id, target_user.id)
        await session.commit()
        return {"following": True}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{username}/follow")
async def unfollow_user(
    username: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user_optional),
) -> Any:
    """Unfollow a user"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Find user to unfollow
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    target_user = result.scalar_one_or_none()
    
    # Try email prefix
    if not target_user:
        query = select(User).where(User.email.like(f"{username}@%")).limit(1)
        result = await session.execute(query)
        target_user = result.scalar_one_or_none()
        
    # Try external_id
    if not target_user:
        query = select(User).where(User.external_id == username)
        result = await session.execute(query)
        target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    from ..repositories.pulse import PulseRepository
    repo = PulseRepository(session)
    await repo.unfollow_user(current_user.id, target_user.id)
    await session.commit()
    return {"following": False}

@router.get("/suggested", response_model=List[UserProfileResponse])
async def get_suggested_users(
    limit: int = Query(5, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
) -> Any:
    """
    Get suggested users to follow.
    For now, returns random users.
    """
    # Get IDs of users currently followed by the user
    followed_ids = []
    if current_user:
        followed_stmt = select(UserFollow.following_id).where(UserFollow.follower_id == current_user.id)
        followed_result = await session.execute(followed_stmt)
        followed_ids = followed_result.scalars().all()

    query = select(User).limit(limit)
    
    if current_user:
        # Exclude self
        query = query.where(User.id != current_user.id)
        # Exclude already followed users
        if followed_ids:
            query = query.where(User.id.not_in(followed_ids))
    
    # Randomize (PostgreSQL specific)
    query = query.order_by(func.random())
    
    result = await session.execute(query)
    users = result.scalars().all()
    
    response = []
    for user in users:
        # Get stats for each user
        stats = await get_user_stats_internal(user.id, session)
        
        # Determine display username
        display_username = user.username
        if not display_username:
            display_username = user.email.split('@')[0] if '@' in user.email else user.email
            
        response.append(UserProfileResponse(
            id=user.external_id,
            username=display_username,
            name=user.name,
            email=user.email,
            bio=user.bio,
            avatarUrl=user.avatar_url,
            bannerUrl=user.banner_url,
            joinedDate=user.created_at.strftime("%B %Y"),
            location=user.location,
            website=user.website,
            stats=stats,
            isVerified=False,
        ))
        
    return response
