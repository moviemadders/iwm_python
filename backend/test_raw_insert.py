import asyncio
import uuid
import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=True)

async def test_raw_insert():
    async with engine.begin() as conn:
        print("Testing raw SQL insert...")
        try:
            await conn.execute(text("""
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
                "eid": str(uuid.uuid4()),
                "title": "Test Review",
                "content": "Test Content",
                "rating": 8.0,
                "uid": 1,  # Assuming user ID 1 exists
                "mid": 1   # Assuming movie ID 1 exists
            })
            print("✅ Raw insert successful!")
        except Exception as e:
            print(f"❌ Raw insert failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_raw_insert())
