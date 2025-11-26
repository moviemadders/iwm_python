import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def check_tmdb_ids():
    print(f"🔌 Connecting to database...")
    try:
        engine = create_async_engine(DATABASE_URL)
        
        async with engine.connect() as conn:
            # Check if tmdb_id column exists and has data
            result = await conn.execute(
                text("SELECT id, title, tmdb_id FROM movies LIMIT 5")
            )
            rows = result.fetchall()
            print(f"Sample movies:")
            for row in rows:
                print(f"  {row[1]} (TMDB ID: {row[2]})")
                
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_tmdb_ids())
