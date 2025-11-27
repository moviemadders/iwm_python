from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db import get_session
from ..models import User
from ..security.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_id = int(sub)
    except ValueError:
        with open("C:/Users/bilva_labs/Videos/movie madders/backend/auth_debug.log", "a") as f:
            f.write(f"[AUTH DEBUG] Invalid subject: {sub}\n")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject")
    
    with open("C:/Users/bilva_labs/Videos/movie madders/backend/auth_debug.log", "a") as f:
        f.write(f"[AUTH DEBUG] Looking up user_id: {user_id}\n")
    
    res = await session.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    
    if not user:
        with open("C:/Users/bilva_labs/Videos/movie madders/backend/auth_debug.log", "a") as f:
            f.write(f"[AUTH DEBUG] User not found for id: {user_id}\n")
            # List all users to debug
            all_users = await session.execute(select(User.id, User.email))
            f.write(f"[AUTH DEBUG] All users: {all_users.all()}\n")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    """
    Get current user if authenticated, otherwise return None.
    Used for endpoints that need to check authentication but don't require it.
    """
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        user_id = int(sub)
        res = await session.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        return user
    except Exception:
        return None

