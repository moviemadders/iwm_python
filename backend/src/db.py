from __future__ import annotations

from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


async def init_db() -> None:
    global engine, SessionLocal
    if settings.database_url:
        print(f"[DB DEBUG] Initializing DB with URL: {settings.database_url}")
        url = settings.database_url
        connect_args = {}
        
        # Handle SSL for asyncpg if needed (Neon DB support)
        if "sslmode" in url or "neon.tech" in url:
            import ssl
            import re
            
            # Create SSL context
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context
            
            # asyncpg doesn't support sslmode in URL, so we need to strip it
            if "sslmode=" in url:
                url = re.sub(r'[?&]sslmode=[^&]+', '', url)
                if "?" not in url and "&" in url:
                    url = url.replace("&", "?", 1)
        
        engine = create_async_engine(url, echo=False, pool_pre_ping=True, connect_args=connect_args)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    else:
        engine = None
        SessionLocal = None


async def get_session() -> AsyncIterator[AsyncSession | None]:
    if SessionLocal is None:
        # Allow None to enable mock/stub repositories in development
        yield None
        return
    async with SessionLocal() as session:
        yield session

