"""
Comprehensive Database Seeding Script for IWM Application
Populates all tables with realistic test data
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Monkeypatch PostgreSQL types to work with SQLite
import sqlalchemy.dialects.postgresql
from sqlalchemy.types import JSON, TypeDecorator

class SQLiteArray(TypeDecorator):
    impl = JSON
    def process_bind_param(self, value, dialect):
        return value
    def process_result_value(self, value, dialect):
        return value

sqlalchemy.dialects.postgresql.JSONB = JSON
sqlalchemy.dialects.postgresql.ARRAY = SQLiteArray

from src.models import (
    User, Movie, Review, Watchlist, Collection, Favorite, 
    Pulse, Scene, VisualTreat, CriticReview, Genre,
    collection_movies, movie_genres
)
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed_users(session: AsyncSession):
    """Create test users and critic profiles"""
    print("🔹 Seeding users...")
    users_data = [
        {
            "email": "user1@iwm.com",
            "username": "user1",
            "password": "rmrnn0077",
            "name": "John Doe",
            "is_critic": False,
        },
        {
            "email": "user2@iwm.com",
            "username": "user2",
            "password": "password123",
            "name": "Jane Smith",
            "is_critic": False,
        },
        {
            "email": "user3@iwm.com",
            "username": "user3",
            "password": "password123",
            "name": "Mike Johnson",
            "is_critic": False,
        },
        {
            "email": "critic1@iwm.com",
            "username": "critic1",
            "password": "password123",
            "name": "Roger Ebert Jr.",
            "is_critic": True,
            "bio": "Professional film critic with 10 years experience",
        },
        {
            "email": "critic2@iwm.com",
            "username": "critic2",
            "password": "password123",
            "name": "Pauline Kael II",
            "is_critic": True,
            "bio": "Critic specializing in independent cinema",
        },
    ]

    users = []
    critic_profiles = []

    for user_data in users_data:
        user = User(
            external_id=str(uuid.uuid4()),
            email=user_data["email"],
            hashed_password=pwd_context.hash(user_data["password"]),
            name=user_data["name"],
            created_at=datetime.now() - timedelta(days=365),
        )
        session.add(user)
        users.append(user)

    await session.flush()

    # Create critic profiles for critic users
    from src.models import CriticProfile
    for user, user_data in zip(users, users_data):
        if user_data["is_critic"]:
            critic_profile = CriticProfile(
                external_id=str(uuid.uuid4()),
                user_id=user.id,
                username=user_data["username"],
                display_name=user_data["name"],
                bio=user_data.get("bio", ""),
                is_verified=True,
                created_at=datetime.now() - timedelta(days=300),
            )
            session.add(critic_profile)
            critic_profiles.append(critic_profile)

    await session.flush()
    print(f"✅ Created {len(users)} users and {len(critic_profiles)} critic profiles")
    return users


async def seed_genres(session: AsyncSession):
    """Create movie genres"""
    print("🔹 Seeding genres...")
    genres_data = [
        {"name": "Action", "slug": "action"},
        {"name": "Drama", "slug": "drama"},
        {"name": "Thriller", "slug": "thriller"},
        {"name": "Sci-Fi", "slug": "sci-fi"},
        {"name": "Crime", "slug": "crime"},
        {"name": "Mystery", "slug": "mystery"},
        {"name": "Fantasy", "slug": "fantasy"},
        {"name": "Romance", "slug": "romance"},
        {"name": "Comedy", "slug": "comedy"},
        {"name": "Horror", "slug": "horror"},
    ]

    genres = []
    for genre_data in genres_data:
        genre = Genre(
            name=genre_data["name"],
            slug=genre_data["slug"],
        )
        session.add(genre)
        genres.append(genre)
    
    await session.flush()
    print(f"✅ Created {len(genres)} genres")
    return genres


async def seed_movies(session: AsyncSession, genres: list):
    """Create movies with complete data"""
    print("🔹 Seeding movies...")
    import random

    # Simplified movie data matching actual Movie model fields
    movies_data = [
        {"title": "The Shawshank Redemption", "year": "1994", "overview": "Two imprisoned men bond over a number of years.", "runtime": 142, "imdb_rating": 9.3, "genres": ["Drama", "Crime"]},
        {"title": "The Godfather", "year": "1972", "overview": "The aging patriarch of an organized crime dynasty.", "runtime": 175, "imdb_rating": 9.2, "genres": ["Crime", "Drama"]},
        {"title": "The Dark Knight", "year": "2008", "overview": "Batman must accept one of the greatest psychological tests.", "runtime": 152, "imdb_rating": 9.0, "genres": ["Action", "Crime"]},
        {"title": "Inception", "year": "2010", "overview": "A thief who steals corporate secrets through dream-sharing technology.", "runtime": 148, "imdb_rating": 8.8, "genres": ["Action", "Sci-Fi"]},
        {"title": "Pulp Fiction", "year": "1994", "overview": "The lives of two mob hitmen intertwine in four tales.", "runtime": 154, "imdb_rating": 8.9, "genres": ["Crime", "Drama"]},
        {"title": "Forrest Gump", "year": "1994", "overview": "The presidencies of Kennedy and Johnson unfold.", "runtime": 142, "imdb_rating": 8.8, "genres": ["Drama", "Romance"]},
        {"title": "The Matrix", "year": "1999", "overview": "A computer hacker learns about the true nature of reality.", "runtime": 136, "imdb_rating": 8.7, "genres": ["Action", "Sci-Fi"]},
        {"title": "Goodfellas", "year": "1990", "overview": "The story of Henry Hill and his life in the mob.", "runtime": 146, "imdb_rating": 8.7, "genres": ["Crime", "Drama"]},
        {"title": "Interstellar", "year": "2014", "overview": "A team of explorers travel through a wormhole in space.", "runtime": 169, "imdb_rating": 8.6, "genres": ["Sci-Fi", "Drama"]},
        {"title": "The Silence of the Lambs", "year": "1991", "overview": "A young FBI cadet must receive help from a cannibal killer.", "runtime": 118, "imdb_rating": 8.6, "genres": ["Crime", "Thriller"]},
        {"title": "Saving Private Ryan", "year": "1998", "overview": "Following the Normandy Landings, soldiers go behind enemy lines.", "runtime": 169, "imdb_rating": 8.6, "genres": ["Drama", "Action"]},
        {"title": "The Green Mile", "year": "1999", "overview": "The lives of guards on Death Row are affected.", "runtime": 189, "imdb_rating": 8.6, "genres": ["Drama", "Crime"]},
        {"title": "Parasite", "year": "2019", "overview": "Greed and class discrimination threaten the relationship.", "runtime": 132, "imdb_rating": 8.6, "genres": ["Drama", "Thriller"]},
        {"title": "The Prestige", "year": "2006", "overview": "Two stage magicians engage in competitive one-upmanship.", "runtime": 130, "imdb_rating": 8.5, "genres": ["Drama", "Mystery"]},
        {"title": "The Departed", "year": "2006", "overview": "An undercover cop and a mole attempt to identify each other.", "runtime": 151, "imdb_rating": 8.5, "genres": ["Crime", "Thriller"]},
        {"title": "Gladiator", "year": "2000", "overview": "A former Roman General sets out to exact vengeance.", "runtime": 155, "imdb_rating": 8.5, "genres": ["Action", "Drama"]},
        {"title": "The Lion King", "year": "1994", "overview": "Lion prince Simba flees his kingdom.", "runtime": 88, "imdb_rating": 8.5, "genres": ["Drama", "Fantasy"]},
        {"title": "Back to the Future", "year": "1985", "overview": "Marty McFly travels back in time.", "runtime": 116, "imdb_rating": 8.5, "genres": ["Sci-Fi", "Comedy"]},
        {"title": "The Usual Suspects", "year": "1995", "overview": "A sole survivor tells of the twisty events.", "runtime": 106, "imdb_rating": 8.5, "genres": ["Crime", "Mystery"]},
        {"title": "The Pianist", "year": "2002", "overview": "A Polish Jewish musician struggles to survive.", "runtime": 150, "imdb_rating": 8.5, "genres": ["Drama"]},
        {"title": "Terminator 2", "year": "1991", "overview": "A cyborg protects a boy from a more advanced terminator.", "runtime": 137, "imdb_rating": 8.5, "genres": ["Action", "Sci-Fi"]},
        {"title": "American History X", "year": "1998", "overview": "A former neo-nazi tries to prevent his brother.", "runtime": 119, "imdb_rating": 8.5, "genres": ["Drama"]},
        {"title": "Spirited Away", "year": "2001", "overview": "A girl enters a world of spirits.", "runtime": 125, "imdb_rating": 8.6, "genres": ["Fantasy", "Drama"]},
        {"title": "Psycho", "year": "1960", "overview": "A Phoenix secretary embezzles money.", "runtime": 109, "imdb_rating": 8.5, "genres": ["Horror", "Thriller"]},
        {"title": "Casablanca", "year": "1942", "overview": "A cynical expatriate must choose.", "runtime": 102, "imdb_rating": 8.5, "genres": ["Drama", "Romance"]},
    ]

    movies = []
    genre_map = {g.name: g for g in genres}

    for movie_data in movies_data:
        movie = Movie(
            external_id=str(uuid.uuid4()),
            title=movie_data["title"],
            year=movie_data["year"],
            overview=movie_data["overview"],
            runtime=movie_data["runtime"],
            imdb_rating=movie_data["imdb_rating"],
            country="USA",
            language="English",
            poster_url=f"https://placehold.co/500x750?text=Movie+{i}",
            backdrop_url=f"https://image.tmdb.org/t/p/original/backdrop_{random.randint(1,100)}.jpg",
            release_date=datetime(int(movie_data["year"]), 1, 1),
            status="released",
        )
        session.add(movie)
        movies.append(movie)

    await session.flush()

    # Add genre associations
    for movie, movie_data in zip(movies, movies_data):
        for genre_name in movie_data["genres"]:
            if genre_name in genre_map:
                await session.execute(
                    movie_genres.insert().values(
                        movie_id=movie.id,
                        genre_id=genre_map[genre_name].id
                    )
                )

    await session.flush()
    print(f"✅ Created {len(movies)} movies with genres")
    return movies


async def seed_reviews(session: AsyncSession, users: list, movies: list):
    """Create reviews for movies"""
    print("🔹 Seeding reviews...")
    import random

    review_templates = [
        "An absolute masterpiece! {title} delivers on every level. The performances are outstanding, the direction is flawless, and the story keeps you engaged from start to finish.",
        "I was blown away by {title}. This film is a testament to great storytelling and exceptional filmmaking. Highly recommended!",
        "{title} is a cinematic triumph. Every frame is carefully crafted, and the emotional depth is remarkable.",
        "While {title} has its moments, I found it somewhat overrated. The pacing drags in the middle, though the ending redeems it.",
        "A solid film with great performances. {title} may not be perfect, but it's definitely worth watching.",
        "{title} exceeded all my expectations. The cinematography is breathtaking and the score is unforgettable.",
        "I had high hopes for {title}, but it fell short. The plot feels predictable and the characters lack depth.",
        "An entertaining watch! {title} delivers exactly what it promises - great action, compelling drama, and memorable moments.",
        "{title} is a thought-provoking film that stays with you long after the credits roll. Brilliant work!",
        "Not my cup of tea. {title} has technical merit, but the story didn't resonate with me personally.",
    ]

    reviews = []
    ratings = [9.5, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 10.0, 8.8, 9.2]

    for movie in movies[:20]:  # Reviews for first 20 movies
        # 2-3 reviews per movie
        num_reviews = random.randint(2, 3)
        for i in range(num_reviews):
            user = random.choice(users[:3])  # Only regular users write reviews
            template = random.choice(review_templates)

            review = Review(
                external_id=str(uuid.uuid4()),
                movie_id=movie.id,
                user_id=user.id,
                rating=random.choice(ratings),
                title=f"My thoughts on {movie.title}",
                content=template.format(title=movie.title),
                has_spoilers=random.choice([True, False]),
                date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365)),
            )
            session.add(review)
            reviews.append(review)

    await session.flush()
    print(f"✅ Created {len(reviews)} reviews")
    return reviews


async def seed_watchlist(session: AsyncSession, users: list, movies: list):
    """Create watchlist items"""
    print("🔹 Seeding watchlist...")
    import random

    watchlist_items = []
    statuses = ["want-to-watch"] * 4 + ["watching"] * 3 + ["watched"] * 3
    priorities = ["high", "medium", "low"]

    for user in users[:3]:  # Regular users only
        # Each user gets 10-12 watchlist items
        user_movies = random.sample(movies, random.randint(10, 12))
        for movie in user_movies:
            status = random.choice(statuses)
            progress = random.randint(10, 90) if status == "watching" else 0

            item = Watchlist(
                external_id=str(uuid.uuid4()),
                user_id=user.id,
                movie_id=movie.id,
                status=status,
                priority=random.choice(priorities),
                progress=progress,
                date_added=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 180)),
            )
            session.add(item)
            watchlist_items.append(item)

    await session.flush()
    print(f"✅ Created {len(watchlist_items)} watchlist items")
    return watchlist_items


async def seed_collections(session: AsyncSession, users: list, movies: list):
    """Create collections"""
    print("🔹 Seeding collections...")
    import random

    collections_data = [
        {"title": "Best Sci-Fi Movies", "description": "My favorite science fiction films", "is_public": True},
        {"title": "Classic Thrillers", "description": "Timeless thriller masterpieces", "is_public": True},
        {"title": "Oscar Winners", "description": "Academy Award winning films", "is_public": True},
        {"title": "Mind-Bending Films", "description": "Movies that make you think", "is_public": True},
        {"title": "Crime Dramas", "description": "Best crime and gangster films", "is_public": True},
        {"title": "Personal Favorites", "description": "My all-time favorite movies", "is_public": False},
        {"title": "Watch Later", "description": "Movies I want to watch soon", "is_public": False},
        {"title": "90s Classics", "description": "Great films from the 1990s", "is_public": True},
        {"title": "Epic Dramas", "description": "Long-form dramatic masterpieces", "is_public": True},
        {"title": "Hidden Gems", "description": "Underrated films worth watching", "is_public": True},
    ]

    collections = []
    for i, coll_data in enumerate(collections_data):
        user = users[i % 3]  # Distribute across users

        collection = Collection(
            external_id=str(uuid.uuid4()),
            user_id=user.id,
            title=coll_data["title"],
            description=coll_data["description"],
            is_public=coll_data["is_public"],
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365)),
        )
        session.add(collection)
        collections.append(collection)

    await session.flush()

    # Add movies to collections
    for collection in collections:
        # Each collection gets 3-5 movies
        coll_movies = random.sample(movies, random.randint(3, 5))
        for movie in coll_movies:
            await session.execute(
                collection_movies.insert().values(
                    collection_id=collection.id,
                    movie_id=movie.id
                )
            )

    await session.flush()
    print(f"✅ Created {len(collections)} collections")
    return collections


async def seed_favorites(session: AsyncSession, users: list, movies: list):
    """Create favorite items"""
    print("🔹 Seeding favorites...")
    import random

    favorites = []
    for user in users[:3]:  # Regular users only
        # Each user gets 5-10 favorites
        user_movies = random.sample(movies, random.randint(5, 10))
        for movie in user_movies:
            favorite = Favorite(
                external_id=str(uuid.uuid4()),
                user_id=user.id,
                movie_id=movie.id,
                date_added=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365)),
            )
            session.add(favorite)
            favorites.append(favorite)

    await session.flush()
    print(f"✅ Created {len(favorites)} favorites")
    return favorites


async def main():
    """Main seeding function"""
    print("🚀 Starting database seeding...")

    async with async_session() as session:
        try:
            # Seed in order (respecting foreign keys)
            users = await seed_users(session)
            genres = await seed_genres(session)
            movies = await seed_movies(session, genres)

            # TODO: Fix field name mismatches in these functions
            # reviews = await seed_reviews(session, users, movies)
            # watchlist_items = await seed_watchlist(session, users, movies)
            # collections = await seed_collections(session, users, movies)
            # favorites = await seed_favorites(session, users, movies)

            await session.commit()
            print("\n✅ Database seeding completed successfully!")
            print(f"   - Users: {len(users)}")
            print(f"   - Genres: {len(genres)}")
            print(f"   - Movies: {len(movies)}")
            # print(f"   - Reviews: {len(reviews)}")
            # print(f"   - Watchlist Items: {len(watchlist_items)}")
            # print(f"   - Collections: {len(collections)}")
            # print(f"   - Favorites: {len(favorites)}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(main())

