"""
Debug script to call list_feed and print traceback.
"""
import asyncio
import traceback
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.repositories.pulse import PulseRepository

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def debug_feed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        repo = PulseRepository(session)
        print("🔍 Calling list_feed()...")
        try:
            feed = await repo.list_feed(limit=5)
            print(f"✅ Success! Got {len(feed)} items.")
            for item in feed:
                print(f"   - {item['id']} (Role: {item['userInfo'].get('role')})")
        except Exception:
            print("❌ Error in list_feed:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_feed())
