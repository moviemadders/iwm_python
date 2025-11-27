"""
Populate database with 200 test movies for pagination and search testing
"""
import asyncio
import os
import sys

# Set environment to use the backend's .env
os.chdir('backend')

from sqlalchemy import select
from src.db import SessionLocal, init_db
from src.models import Movie
import uuid
from datetime import datetime, timedelta
import random

# Sample movie data
MOVIE_TITLES = [
    "The Dark Knight", "Inception", "Interstellar", "The Prestige", "Memento",
    "The Matrix", "The Matrix Reloaded", "The Matrix Revolutions", "The Godfather",
    "The Godfather Part II", "Pulp Fiction", "Fight Club", "Forrest Gump",
    "The Shawshank Redemption", "Goodfellas", "The Silence of the Lambs",
    "Saving Private Ryan", "Schindler's List", "The Green Mile", "The Departed",
    "Gladiator", "Braveheart", "Troy", "300", "Spartacus",
    "Avatar", "Titanic", "The Terminator", "Terminator 2", "Alien",
    "Aliens", "Predator", "The Thing", "Blade Runner", "Total Recall",
    "Star Wars", "The Empire Strikes Back", "Return of the Jedi",
    "The Phantom Menace", "Attack of the Clones", "Revenge of the Sith",
    "The Force Awakens", "The Last Jedi", "The Rise of Skywalker",
    "Rogue One", "Solo", "Lord of the Rings: Fellowship",
    "Lord of the Rings: Two Towers", "Lord of the Rings: Return of the King",
    "The Hobbit: An Unexpected Journey", "The Hobbit: Desolation of Smaug"
]

GENRES = [
    "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi",
    "Thriller", "Romance", "Crime", "Fantasy", "Mystery", "War"
]

DIRECTORS = [
    "Christopher Nolan", "Quentin Tarantino", "Martin Scorsese",
    "Steven Spielberg", "James Cameron", "Ridley Scott", "Peter Jackson",
    "George Lucas", "The Wachowskis", "David Fincher", "Francis Ford Coppola"
]

COUNTRIES = ["USA", "UK", "France", "Germany", "Japan", "South Korea", "India", "Australia"]
LANGUAGES = ["English", "French", "Spanish", "German", "Japanese", "Korean", "Hindi", "Mandarin"]

async def create_test_movies():
    """Create 200 test movies in the database"""
    print("🎬 Starting to populate database with 200 movies...")
    
    # Initialize database first
    await init_db()
    
    if SessionLocal is None:
        print("❌ Database not initialized!")
        return
    
    async with SessionLocal() as session:
        try:
            # Check existing movies
            result = await session.execute(select(Movie))
            existing = result.scalars().all()
            print(f"📊 Current movies in database: {len(existing)}")
            
            movies_created = 0
            
            # Create 200 unique movies
            for i in range(200):
                # Generate unique title
                base_title = random.choice(MOVIE_TITLES)
                year = random.randint(1990, 2024)
                title = f"{base_title} {i+1}" if i >= len(MOVIE_TITLES) else f"{base_title} ({year})"
                
                # Check if movie already exists
                check = await session.execute(
                    select(Movie).where(Movie.title == title)
                )
                if check.scalar_one_or_none():
                    print(f"⏭️  Skipping '{title}' - already exists")
                    continue
                
                # Random data
                genre_names = random.sample(GENRES, random.randint(1, 3))
                director = random.choice(DIRECTORS)
                country = random.choice(COUNTRIES)
                language = random.choice(LANGUAGES)
                runtime = random.randint(90, 180)
                siddu_score = round(random.uniform(6.0, 9.5), 1)
                
                # Release date
                days_ago = random.randint(0, 365 * 30)  # Within last 30 years
                release_date = datetime.now() - timedelta(days=days_ago)
                
                # Create movie
                movie = Movie(
                    external_id=str(uuid.uuid4()),
                    title=title,
                    overview=f"An epic {genre_names[0].lower()} masterpiece directed by {director}. "
                             f"Set in {year}, this thrilling adventure captivates audiences worldwide.",
                    release_date=release_date,
                    runtime=runtime,
                    language=language,
                    country=country,
                    poster_url=f"/placeholder-poster-{i % 10 + 1}.jpg",
                    backdrop_url=f"/placeholder-backdrop-{i % 10 + 1}.jpg",
                    siddu_score=siddu_score,
                    popularity=round(random.uniform(10, 100), 2),
                    status="released",
                    rating=random.choice(["PG", "PG-13", "R", "NR"]),
                    budget=random.randint(10_000_000, 200_000_000) if random.random() > 0.3 else None,
                    revenue=random.randint(50_000_000, 2_000_000_000) if random.random() > 0.3 else None,
                    tagline=f"Experience the ultimate {genre_names[0].lower()} adventure"
                )
                
                session.add(movie)
                movies_created += 1
                
                if movies_created % 10 == 0:
                    await session.commit()
                    print(f"✅ Created {movies_created} movies...")
            
            # Final commit
            await session.commit()
            
            # Verify final count
            result = await session.execute(select(Movie))
            final_count = len(result.scalars().all())
            
            print(f"\n🎉 Success! Database now has {final_count} movies")
            print(f"   📝 Created {movies_created} new movies")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(create_test_movies())
