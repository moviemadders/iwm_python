import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def list_titles():
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT title FROM movies"))
            rows = result.fetchall()
            print("Movies:")
            for r in rows:
                print(f"- {r[0]}")
        await engine.dispose()
    except Exception as e:
        print(e)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(list_titles())
