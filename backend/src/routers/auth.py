from __future__ import annotations

from typing import Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db import get_session
from ..models import User
from ..security.password import hash_password, verify_password
from ..security.jwt import create_access_token, create_refresh_token, decode_token
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupBody(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    username: str
    avatarUrl: str | None = None
    bannerUrl: str | None = None
    is_admin: bool = False


class AuthMeResponse(BaseModel):
    """
    Enhanced /me endpoint response with roles and profile presence information.

    Fields:
    - user_id: Internal database user ID
    - external_id: External user identifier (email-based)
    - email: User's email address
    - username: Username derived from email prefix
    - name: User's full name
    - avatar_url: URL to user's avatar image
    - roles: List of roles assigned to this user (e.g., ["User", "Critic", "Talent"])
    - has_critic_profile: Whether user has an active CriticProfile
    - has_talent_profile: Whether user has an active TalentProfile (future)
    - has_industry_profile: Whether user has an active IndustryProfile (future)
    - default_role: User's default role for profile display (future, from user_role_profiles)
    """
    user_id: int
    external_id: str
    email: EmailStr
    username: str
    name: str
    avatar_url: str | None = None
    banner_url: str | None = None
    roles: list[str] = []
    has_critic_profile: bool = False
    has_talent_profile: bool = False
    has_industry_profile: bool = False
    default_role: str | None = None


@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupBody, session: AsyncSession = Depends(get_session)) -> Any:
    # email uniqueness
    existing = (await session.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Generate default avatar using DiceBear (random selection from 4 presets)
    import random
    default_avatars = [
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Zack",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Midnight"
    ]
    default_avatar = random.choice(default_avatars)
    
    user = User(
        external_id=body.email,  # use email as external_id for now
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        avatar_url=default_avatar,
    )
    session.add(user)
    await session.flush()

    # Create AdminUserMeta with only "lover" role by default
    # Users can enable additional roles (critic, talent, industry) from settings
    from ..models import AdminUserMeta, UserRoleProfile
    import logging
    logger = logging.getLogger(__name__)

    admin_meta = AdminUserMeta(
        user_id=user.id,
        email=user.email,
        roles=["lover"],  # Only lover role by default - users can enable others from settings
        status="Active",
    )
    logger.info(f"Creating AdminUserMeta for user {user.id} with roles: {admin_meta.roles}")
    session.add(admin_meta)
    await session.flush()

    # Create UserRoleProfile entries for all roles
    # Only lover role is enabled by default, others are disabled
    all_roles = ["lover", "critic", "talent", "industry"]
    for role_type in all_roles:
        is_enabled = role_type == "lover"  # Only lover is enabled by default
        role_profile = UserRoleProfile(
            user_id=user.id,
            role_type=role_type,
            enabled=is_enabled,
            visibility="public" if is_enabled else "private",
            is_default=is_enabled,  # Only lover is default
        )
        session.add(role_profile)
        logger.info(f"Created UserRoleProfile for user {user.id}, role {role_type}, enabled={is_enabled}")

    await session.commit()
    logger.info(f"AdminUserMeta and UserRoleProfiles created successfully for user {user.id}")

    sub = str(user.id)

    # Include role_profiles in the access token for middleware admin role checking
    # Query role_profiles explicitly to avoid lazy loading after commit
    role_profiles_result = await session.execute(
        select(UserRoleProfile).where(UserRoleProfile.user_id == user.id)
    )
    role_profiles_list = role_profiles_result.scalars().all()

    role_profiles = [
        {
            "role_type": rp.role_type,
            "enabled": rp.enabled
        }
        for rp in role_profiles_list
    ]

    return TokenResponse(
        access_token=create_access_token(sub, role_profiles=role_profiles),
        refresh_token=create_refresh_token(sub)
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, session: AsyncSession = Depends(get_session)) -> Any:
    res = await session.execute(select(User).where(User.email == body.email))
    user = res.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    sub = str(user.id)

    # Include role_profiles in the access token for middleware admin role checking
    # Query role_profiles explicitly to avoid lazy loading issues
    from ..models import UserRoleProfile
    role_profiles_result = await session.execute(
        select(UserRoleProfile).where(UserRoleProfile.user_id == user.id)
    )
    role_profiles_list = role_profiles_result.scalars().all()

    role_profiles = [
        {
            "role_type": rp.role_type,
            "enabled": rp.enabled
        }
        for rp in role_profiles_list
    ]

    return TokenResponse(
        access_token=create_access_token(sub, role_profiles=role_profiles),
        refresh_token=create_refresh_token(sub)
    )


class RefreshBody(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshBody) -> Any:
    try:
        payload = decode_token(body.refresh_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return TokenResponse(access_token=create_access_token(sub), refresh_token=create_refresh_token(sub))


@router.post("/logout")
async def logout() -> Any:
    # Stateless JWT: nothing to do server-side; client should discard tokens
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
async def me(user: User = Depends(get_current_user)) -> Any:
    # Check if user has admin role
    is_admin = any(
        role_profile.role_type == "admin" and role_profile.enabled
        for role_profile in user.role_profiles
    )
    # Extract username from email
    username = user.email.split('@')[0] if '@' in user.email else user.email

    return MeResponse(
        id=user.external_id,
        email=user.email,
        name=user.name,
        username=username,
        avatarUrl=user.avatar_url,
        is_admin=is_admin
    )


@router.get("/me/enhanced", response_model=AuthMeResponse)
async def me_enhanced(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Any:
    """
    Get current authenticated user with roles and profile presence information.

    Returns:
    - User ID, email, name, avatar
    - Roles from AdminUserMeta.roles JSONB array
    - Profile presence flags (has_critic_profile, has_talent_profile, has_industry_profile)
    - Default role (from user_role_profiles when available)

    Requires: Valid JWT access token
    Returns: 401 Unauthorized if token is invalid or missing
    """
    from sqlalchemy import exists
    from ..models import AdminUserMeta, CriticProfile

    # Extract username from email (email prefix before @)
    username = user.email.split('@')[0] if '@' in user.email else user.email

    # Fetch AdminUserMeta to get roles
    admin_meta_query = select(AdminUserMeta).where(AdminUserMeta.user_id == user.id)
    admin_meta_result = await session.execute(admin_meta_query)
    admin_meta = admin_meta_result.scalar_one_or_none()

    roles = admin_meta.roles if admin_meta else []

    # Check for CriticProfile existence using EXISTS query for performance
    critic_exists_query = select(exists(select(1).select_from(CriticProfile).where(CriticProfile.user_id == user.id)))
    critic_exists_result = await session.execute(critic_exists_query)
    has_critic_profile = critic_exists_result.scalar() or False

    # TalentProfile and IndustryProfile checks will be added after tables are created
    has_talent_profile = False
    has_industry_profile = False
    default_role = None  # Will be populated from user_role_profiles after table creation

    return AuthMeResponse(
        user_id=user.id,
        external_id=user.external_id,
        email=user.email,
        username=username,
        name=user.name,
        avatar_url=user.avatar_url,
        banner_url=user.banner_url,
        roles=roles,
        has_critic_profile=has_critic_profile,
        has_talent_profile=has_talent_profile,
        has_industry_profile=has_industry_profile,
        default_role=default_role,
    )


class UpdateProfileBody(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    banner_url: str | None = None
    bio: str | None = None
    location: str | None = None
    website: str | None = None


@router.put("/me")
async def update_me(
    body: UpdateProfileBody,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MeResponse:
    """Update current user profile"""
    if body.name is not None:
        user.name = body.name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    if body.banner_url is not None:
        user.banner_url = body.banner_url
    if body.bio is not None:
        user.bio = body.bio
    if body.location is not None:
        user.location = body.location
    if body.website is not None:
        user.website = body.website

    await session.commit()
    await session.refresh(user)

    # Extract username from email
    username = user.email.split('@')[0] if '@' in user.email else user.email

    return MeResponse(
        id=user.external_id, 
        email=user.email, 
        name=user.name, 
        username=username,
        avatarUrl=user.avatar_url,
        bannerUrl=user.banner_url
    )


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    body: ChangePasswordBody,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Change user password"""
    # Verify current password
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    # Update password
    user.hashed_password = hash_password(body.new_password)
    await session.commit()

    return {"ok": True, "message": "Password changed successfully"}

