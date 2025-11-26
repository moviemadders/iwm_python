import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=False)

async def inspect_reviews_table():
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT column_name, data_type, character_maximum_length "
            "FROM information_schema.columns "
            "WHERE table_name = 'reviews';"
        ))
        columns = result.fetchall()
        print("🔹 Reviews Table Schema:")
        for col in columns:
            print(f" - {col.column_name}: {col.data_type} ({col.character_maximum_length})")

if __name__ == "__main__":
    asyncio.run(inspect_reviews_table())
