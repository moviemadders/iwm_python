"""
Seed script for Reviews, Votes, Comments, and Comment Likes using Raw SQL.
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Import models to fetch IDs
from src.models import User, Movie

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_reviews_and_interactions(session: AsyncSession):
    print("Fetching users and movies...")
    
    # Fetch Users
    result = await session.execute(select(User))
    users = result.scalars().all()
    if not users:
        print("No users found. Please run the main seed script first.")
        return

    # Fetch Movies
    result = await session.execute(select(Movie))
    movies = result.scalars().all()
    if not movies:
        print("No movies found. Please run the main seed script first.")
        return

    print(f"Found {len(users)} users and {len(movies)} movies.")

    # 1. Seed Reviews
    print("\nSeeding Reviews...")
    review_templates = [
        "An absolute masterpiece! {title} delivers on every level.",
        "I was blown away by {title}. Highly recommended!",
        "{title} is a cinematic triumph.",
        "While {title} has its moments, I found it somewhat overrated.",
        "A solid film with great performances. {title} is worth watching.",
        "{title} exceeded all my expectations.",
        "I had high hopes for {title}, but it fell short.",
        "An entertaining watch! {title} delivers exactly what it promises.",
        "{title} is a thought-provoking film.",
        "Not my cup of tea. {title} didn't resonate with me.",
    ]
    
    reviews_created = []
    # Create 3-5 reviews for a random selection of 10 movies
    target_movies = random.sample(movies, min(len(movies), 10))
    
    for movie in target_movies:
        num_reviews = random.randint(3, 5)
        for _ in range(num_reviews):
            user = random.choice(users)
            template = random.choice(review_templates)
            
            review_id = str(uuid.uuid4())
            title = f"Thoughts on {movie.title}"
            content = template.format(title=movie.title)
            rating = random.choice([6.0, 7.0, 8.0, 9.0, 10.0])
            date = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365))
            
            # Raw SQL Insert with literals for non-string types to avoid parameter mapping issues
            await session.execute(text("""
                INSERT INTO reviews (
                    external_id, title, content, rating, date, 
                    has_spoilers, is_verified, helpful_votes, unhelpful_votes, 
                    comment_count, engagement_score, user_id, movie_id
                ) VALUES (
                    :eid, :title, :content, :rating, NOW(), 
                    false, false, 0, 0, 
                    0, 0, :uid, :mid
                )
            """), {
                "eid": review_id,
                "title": title,
                "content": content,
                "rating": rating,
                # "date": date, # Using NOW()
                # "spoilers": random.choice([True, False]), # Using false
                # "verified": False, # Using false
                "uid": user.id,
                "mid": movie.id
            })
            
            # Store for next steps (we need the DB ID, but we only have external_id easily unless we fetch back)
            # We can fetch back using external_id
            reviews_created.append({"external_id": review_id, "user_id": user.id})
    
    await session.flush() # Ensure reviews are in DB
    print(f"Created {len(reviews_created)} new reviews.")

    # Fetch back reviews to get their integer IDs
    print("Fetching created reviews...")
    review_map = {} # external_id -> id
    for r in reviews_created:
        res = await session.execute(text("SELECT id FROM reviews WHERE external_id = :eid"), {"eid": r["external_id"]})
        rid = res.scalar()
        if rid:
            review_map[r["external_id"]] = rid

    # 2. Seed Review Votes
    print("\nSeeding Review Votes...")
    votes_count = 0
    for r_data in reviews_created:
        rid = review_map.get(r_data["external_id"])
        if not rid: continue
        
        if random.random() < 0.3: continue
        
        num_votes = random.randint(1, 5)
        voters = random.sample(users, min(len(users), num_votes))
        
        helpful_count = 0
        unhelpful_count = 0
        
        for voter in voters:
            if voter.id == r_data["user_id"]: continue
            
            vote_type = random.choice(["helpful", "unhelpful"])
            
            try:
                await session.execute(text("""
                    INSERT INTO review_votes (
                        external_id, user_id, review_id, vote_type, created_at
                    ) VALUES (
                        :eid, :uid, :rid, :vtype, NOW()
                    )
                """), {
                    "eid": str(uuid.uuid4()),
                    "uid": voter.id,
                    "rid": rid,
                    "vtype": vote_type
                })
                
                if vote_type == "helpful": helpful_count += 1
                else: unhelpful_count += 1
                votes_count += 1
            except Exception as e:
                print(f"Failed to vote: {e}")

        # Update counts
        if helpful_count > 0 or unhelpful_count > 0:
            await session.execute(text("""
                UPDATE reviews 
                SET helpful_votes = helpful_votes + :h, unhelpful_votes = unhelpful_votes + :u
                WHERE id = :rid
            """), {"h": helpful_count, "u": unhelpful_count, "rid": rid})

    print(f"Created {votes_count} review votes.")

    # 3. Seed Review Comments
    print("\nSeeding Review Comments...")
    comment_templates = [
        "Totally agree!", "Great review.", "I disagree.", "Well said.",
        "Interesting perspective.", "Thanks for the review."
    ]
    
    comments_created = []
    for r_data in reviews_created:
        rid = review_map.get(r_data["external_id"])
        if not rid: continue
        
        if random.random() < 0.5: continue
        
        num_comments = random.randint(1, 3)
        for _ in range(num_comments):
            commenter = random.choice(users)
            cid = str(uuid.uuid4())
            
            await session.execute(text("""
                INSERT INTO review_comments (
                    external_id, user_id, review_id, content, created_at, likes_count, is_deleted
                ) VALUES (
                    :eid, :uid, :rid, :content, NOW(), 0, false
                )
            """), {
                "eid": cid,
                "uid": commenter.id,
                "rid": rid,
                "content": random.choice(comment_templates)
            })
            
            comments_created.append({"external_id": cid})
            
            # Update comment count
            await session.execute(text("UPDATE reviews SET comment_count = comment_count + 1 WHERE id = :rid"), {"rid": rid})

    print(f"Created {len(comments_created)} comments.")

async def main():
    async with async_session() as session:
        try:
            await seed_reviews_and_interactions(session)
            await session.commit()
            print("\nSeeding completed successfully!")
        except Exception as e:
            await session.rollback()
            print(f"\nSeeding failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
