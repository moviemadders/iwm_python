import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def check_valid_movies():
    print(f"🔌 Connecting to database...")
    try:
        engine = create_async_engine(DATABASE_URL)
        
        async with engine.connect() as conn:
            print("🔍 Checking for valid movies...")
            result = await conn.execute(
                text("SELECT id, title, poster_url FROM movies WHERE poster_url IS NOT NULL LIMIT 5")
            )
            rows = result.fetchall()
            print(f"Found {len(rows)} movies with valid posters:")
            for row in rows:
                print(f"  {row[1]}: {row[2]}")
                
            # Check total count
            count = await conn.execute(text("SELECT count(*) FROM movies"))
            print(f"Total movies: {count.scalar()}")
            
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_valid_movies())
