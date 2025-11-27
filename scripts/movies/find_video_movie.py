import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from sqlalchemy import text

async def find_video_movie():
    """Find the movie with video URL"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Get movie with video URL
        stmt = text("""
            SELECT id, external_id, title, video_url, video_source, is_free
            FROM movies 
            WHERE video_url IS NOT NULL
            LIMIT 5
        """)
        result = await session.execute(stmt)
        movies = result.fetchall()
        
        if movies:
            print("\n" + "=" * 100)
            print("MOVIES WITH VIDEO URLs:")
            print("=" * 100)
            for movie in movies:
                print(f"\nDatabase ID: {movie[0]}")
                print(f"External ID (use this in URL): {movie[1]}")
                print(f"Title: {movie[2]}")
                print(f"Video URL: {movie[3]}")
                print(f"Video Source: {movie[4]}")
                print(f"Is Free: {movie[5]}")
                print(f"\n✅ TEST URL: http://localhost:3000/movies/{movie[1]}")
                print("-" * 100)
        else:
            print("\n❌ No movies with video URLs found in database!")

if __name__ == "__main__":
    asyncio.run(find_video_movie())
