import asyncio
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from backend.src.models import Movie
from sqlalchemy import select

async def add_video_to_movie(movie_id: str, video_url: str, video_source: str = "youtube", is_free: bool = True):
    """Add video URL to a movie"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Find the movie
        stmt = select(Movie).where(Movie.id == movie_id)
        result = await session.execute(stmt)
        movie = result.scalar_one_or_none()
        
        if not movie:
            print(f"Movie with ID {movie_id} not found.")
            return
        
        # Update video fields
        movie.video_url = video_url
        movie.video_source = video_source
        movie.is_free = is_free
        
        await session.commit()
        print(f"Successfully added video to movie: {movie.title}")
        print(f"  Video URL: {video_url}")
        print(f"  Video Source: {video_source}")
        print(f"  Is Free: {is_free}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_video_to_movie.py <movie_id> <video_url> [video_source] [is_free]")
        print("\nExample (YouTube):")
        print('  python add_video_to_movie.py "tt1375666" "https://www.youtube.com/watch?v=YoHD9XEInc0" "youtube" "true"')
        print("\nExample (Direct Video):")
        print('  python add_video_to_movie.py "tt1375666" "https://example.com/movie.mp4" "direct" "false"')
        sys.exit(1)
    
    movie_id = sys.argv[1]
    video_url = sys.argv[2]
    video_source = sys.argv[3] if len(sys.argv) > 3 else "youtube"
    is_free = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else True
    
    asyncio.run(add_video_to_movie(movie_id, video_url, video_source, is_free))
