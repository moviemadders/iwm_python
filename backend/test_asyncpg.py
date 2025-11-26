import asyncio
import asyncpg
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/movie_madders")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def test_asyncpg_insert():
    print(f"Connecting to {DATABASE_URL}...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("Connected. Inserting review...")
        await conn.execute('''
            INSERT INTO reviews (
                external_id, title, content, rating, date, 
                has_spoilers, is_verified, helpful_votes, unhelpful_votes, 
                comment_count, engagement_score, user_id, movie_id
            ) VALUES (
                $1, $2, $3, $4, NOW(), 
                $5, $6, $7, $8, 
                $9, $10, $11, $12
            )
        ''', 
            str(uuid.uuid4()), # $1 external_id
            "Test Review Title", # $2 title
            "Test Content", # $3 content
            8.0, # $4 rating
            False, # $5 has_spoilers
            False, # $6 is_verified
            0, # $7 helpful_votes
            0, # $8 unhelpful_votes
            0, # $9 comment_count
            0, # $10 engagement_score
            1, # $11 user_id
            1  # $12 movie_id
        )
        print("✅ Asyncpg insert successful!")
    except Exception as e:
        print(f"❌ Asyncpg insert failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_asyncpg_insert())
