import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from sqlalchemy import text

async def check_video_url():
    """Check if video URL was saved"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Check for the specific YouTube URL
        stmt = text("""
            SELECT id, external_id, title, video_url, video_source, is_free 
            FROM movies 
            WHERE video_url LIKE '%YoHD9XEInc0%'
        """)
        result = await session.execute(stmt)
        movies = result.fetchall()
        
        print("\n" + "=" * 100)
        print("MOVIES WITH VIDEO URL (YoHD9XEInc0):")
        print("=" * 100)
        
        if movies:
            for movie in movies:
                print(f"\n✅ FOUND!")
                print(f"Database ID: {movie[0]}")
                print(f"External ID: {movie[1]}")
                print(f"Title: {movie[2]}")
                print(f"Video URL: {movie[3]}")
                print(f"Video Source: {movie[4]}")
                print(f"Is Free: {movie[5]}")
                print(f"\n🔗 Frontend URL: http://localhost:3000/movies/{movie[1]}")
                print("-" * 100)
        else:
            print("\n❌ NO MOVIES FOUND with this video URL!")
            print("The video URL was NOT saved to the database.")
            
        # Also check The Matrix specifically
        print("\n" + "=" * 100)
        print("CHECKING THE MATRIX MOVIE:")
        print("=" * 100)
        
        stmt = text("""
            SELECT id, external_id, title, video_url, video_source, is_free 
            FROM movies 
            WHERE external_id = 'b22df09d-cc47-49ff-a1c7-d1fbf639c470'
        """)
        result = await session.execute(stmt)
        matrix = result.fetchone()
        
        if matrix:
            print(f"\nDatabase ID: {matrix[0]}")
            print(f"External ID: {matrix[1]}")
            print(f"Title: {matrix[2]}")
            print(f"Video URL: {matrix[3] if matrix[3] else '❌ NULL (not saved!)'}")
            print(f"Video Source: {matrix[4] if matrix[4] else '❌ NULL'}")
            print(f"Is Free: {matrix[5] if matrix[5] is not None else '❌ NULL'}")
        else:
            print("\n❌ The Matrix movie not found with that external ID!")

if __name__ == "__main__":
    asyncio.run(check_video_url())
