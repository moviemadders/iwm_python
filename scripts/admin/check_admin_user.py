import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os
from dotenv import load_dotenv

load_dotenv()

# Import User model
import sys
sys.path.append('backend/src')
from models import User

async def check_admin_user():
    # Get database URL
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/moviemadders")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find user by email
        query = select(User).where(User.email == "admin@moviemadders.com")
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        
        if user:
            print(f"✓ Found user by email: admin@moviemadders.com")
            print(f"  - ID: {user.id}")
            print(f"  - External ID: {user.external_id}")
            print(f"  - Username: {user.username}")
            print(f"  - Name: {user.name}")
            print(f"  - Email: {user.email}")
            print(f"  - Avatar: {user.avatar_url}")
            print(f"  - Banner: {user.banner_url}")
        else:
            print("✗ No user found with email: admin@moviemadders.com")
            
        # Also check for admin@iwm.com
        query2 = select(User).where(User.email == "admin@iwm.com")
        result2 = await session.execute(query2)
        user2 = result2.scalar_one_or_none()
        
        if user2:
            print(f"\n✓ Found user by email: admin@iwm.com")
            print(f"  - ID: {user2.id}")
            print(f"  - External ID: {user2.external_id}")
            print(f"  - Username: {user2.username}")
            print(f"  - Name: {user2.name}")
            print(f"  - Email: {user2.email}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_admin_user())
