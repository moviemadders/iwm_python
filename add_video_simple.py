import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from sqlalchemy import text

async def add_video_simple(movie_id: int):
    """Add video URL to a movie using simple SQL"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Update using raw SQL
        sql = text("""
            UPDATE movies 
            SET video_url = :video_url,
                video_source = :video_source,
                is_free = :is_free
            WHERE id = :movie_id
            RETURNING id, title
        """)
        
        result = await session.execute(sql, {
            "movie_id": movie_id,
            "video_url": "https://www.youtube.com/watch?v=YoHD9XEInc0",
            "video_source": "youtube",
            "is_free": True
        })
        
        movie = result.fetchone()
        
        if movie:
            await session.commit()
            print(f"✅ Successfully added video to movie ID {movie[0]}: {movie[1]}")
            print(f"   Video URL: https://www.youtube.com/watch?v=YoHD9XEInc0")
            print(f"   Video Source: youtube")
            print(f"   Is Free: True")
        else:
            print(f"❌ Movie with ID {movie_id} not found.")

if __name__ == "__main__":
    movie_id = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(add_video_simple(movie_id))
