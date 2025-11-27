import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from backend.src.models import Movie
from sqlalchemy import select, text

async def check_movies():
    """Check movies and their video URLs"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        # Check for Parasite
        stmt = select(Movie).where(Movie.title.ilike("%parasite%"))
        result = await session.execute(stmt)
        parasite = result.scalars().all()
        
        print("=" * 80)
        print("PARASITE MOVIES:")
        print("=" * 80)
        if parasite:
            for movie in parasite:
                print(f"ID: {movie.id}")
                print(f"Title: {movie.title}")
                print(f"Status: {movie.status}")
                print(f"Video URL: {movie.video_url if hasattr(movie, 'video_url') else 'N/A'}")
                print("-" * 80)
        else:
            print("No Parasite movie found!")
        
        print("\n")
        
        # Check for The Matrix
        stmt = select(Movie).where(Movie.title.ilike("%matrix%"))
        result = await session.execute(stmt)
        matrix = result.scalars().all()
        
        print("=" * 80)
        print("MATRIX MOVIES:")
        print("=" * 80)
        if matrix:
            for movie in matrix:
                print(f"ID: {movie.id}")
                print(f"Title: {movie.title}")
                print(f"Status: {movie.status}")
                print(f"Video URL: {movie.video_url if hasattr(movie, 'video_url') else 'N/A'}")
                print(f"Video Source: {movie.video_source if hasattr(movie, 'video_source') else 'N/A'}")
                print(f"Is Free: {movie.is_free if hasattr(movie, 'is_free') else 'N/A'}")
                print("-" * 80)
        else:
            print("No Matrix movie found!")
        
        print("\n")
        
        # Check all movies with video URLs
        stmt = text("SELECT id, title, video_url, video_source, is_free FROM movies WHERE video_url IS NOT NULL")
        result = await session.execute(stmt)
        movies_with_video = result.fetchall()
        
        print("=" * 80)
        print("ALL MOVIES WITH VIDEO URLs:")
        print("=" * 80)
        if movies_with_video:
            for movie in movies_with_video:
                print(f"ID: {movie[0]}")
                print(f"Title: {movie[1]}")
                print(f"Video URL: {movie[2]}")
                print(f"Video Source: {movie[3]}")
                print(f"Is Free: {movie[4]}")
                print("-" * 80)
        else:
            print("No movies with video URLs found!")

if __name__ == "__main__":
    asyncio.run(check_movies())
