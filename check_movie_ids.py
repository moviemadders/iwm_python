import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from sqlalchemy import text

async def check_movie_ids():
    """Check movie IDs and external IDs"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Get all movies with their IDs
        stmt = text("""
            SELECT id, external_id, title, video_url 
            FROM movies 
            ORDER BY id 
            LIMIT 20
        """)
        result = await session.execute(stmt)
        movies = result.fetchall()
        
        print("=" * 100)
        print(f"{'ID':<5} | {'External ID':<30} | {'Title':<40} | {'Has Video'}")
        print("=" * 100)
        
        for movie in movies:
            has_video = "✓" if movie[3] else "✗"
            print(f"{movie[0]:<5} | {movie[1]:<30} | {movie[2]:<40} | {has_video}")

if __name__ == "__main__":
    asyncio.run(check_movie_ids())
