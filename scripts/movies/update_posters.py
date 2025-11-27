import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

# Real TMDB poster URLs
POSTERS = {
    "The Shawshank Redemption": "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    "The Godfather": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "The Dark Knight": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "Inception": "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "Pulp Fiction": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    "Forrest Gump": "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    "The Matrix": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpFUk5H.jpg",
    "Goodfellas": "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    "Interstellar": "https://image.tmdb.org/t/p/w500/gEU2QniL6E8AHtMY4kRFVs53xp1.jpg",
    "The Silence of the Lambs": "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    "Saving Private Ryan": "https://image.tmdb.org/t/p/w500/uqx37cS8cpzv8UucRvwhilHyM5t.jpg",
    "The Green Mile": "https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
    "Parasite": "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    "The Prestige": "https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg",
    "The Departed": "https://image.tmdb.org/t/p/w500/nRRybdjjeUEUg5fXyZ3q3pXbL5l.jpg",
    "Gladiator": "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    "The Lion King": "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
    "Back to the Future": "https://image.tmdb.org/t/p/w500/fNOH9f1aA7XRTzl1sA1xaU0e0Id.jpg",
    "The Usual Suspects": "https://image.tmdb.org/t/p/w500/bUP537WvK777j8c9N6k9X9k8z9.jpg",
    "The Pianist": "https://image.tmdb.org/t/p/w500/2hFvxCCWrTmCYw9sz0cM4VnoXl.jpg",
    "Terminator 2": "https://image.tmdb.org/t/p/w500/vmaq1k0suxtdGwVRo3n2qY8s9y.jpg",
    "American History X": "https://image.tmdb.org/t/p/w500/c2gsmSQ2Cqv8zosqKOCwRS0GFBS.jpg",
    "Spirited Away": "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUKGnSxQbYTl.jpg",
    "Psycho": "https://image.tmdb.org/t/p/w500/81d8oyEFgj7Z5QFj0GJ8GxM2QX.jpg",
    "Casablanca": "https://image.tmdb.org/t/p/w500/5K7cFA3yYggugbse3IGn70HFkMN.jpg"
}

async def update_posters():
    print(f"🔌 Connecting to database...")
    try:
        engine = create_async_engine(DATABASE_URL)
        
        async with engine.begin() as conn:
            print("🔍 Updating movie posters...")
            updated = 0
            for title, url in POSTERS.items():
                result = await conn.execute(
                    text("UPDATE movies SET poster_url = :url WHERE title = :title"),
                    {"url": url, "title": title}
                )
                if result.rowcount > 0:
                    updated += 1
                    print(f"  ✅ Updated {title}")
                else:
                    print(f"  ⚠️ Could not find {title}")
            
            print(f"\n✨ Updated {updated} movies with real posters!")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(update_posters())
