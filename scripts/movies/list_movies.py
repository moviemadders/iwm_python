import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db
from backend.src.models import Movie
from sqlalchemy import select

async def list_movies():
    """List all movies in the database"""
    await db.init_db()
    
    if db.SessionLocal is None:
        print("Failed to initialize database session.")
        return
    
    async with db.SessionLocal() as session:
        stmt = select(Movie).limit(10)
        result = await session.execute(stmt)
        movies = result.scalars().all()
        
        if not movies:
            print("No movies found in database.")
            return
        
        print(f"Found {len(movies)} movies:")
        print("-" * 80)
        for movie in movies:
            print(f"ID: {movie.id}")
            print(f"Title: {movie.title}")
            print(f"Year: {movie.year}")
            print(f"Video URL: {movie.video_url if hasattr(movie, 'video_url') else 'N/A'}")
            print(f"Video Source: {movie.video_source if hasattr(movie, 'video_source') else 'N/A'}")
            print("-" * 80)

if __name__ == "__main__":
    asyncio.run(list_movies())
