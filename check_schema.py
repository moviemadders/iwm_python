"""Check pulses table schema"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def check_schema():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pulses'"
        ))
        columns = result.fetchall()
        print("Columns in pulses table:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            
        # Check specifically for new columns
        col_names = [c[0] for c in columns]
        missing = []
        for req in ['posted_as_role', 'star_rating', 'deleted_at']:
            if req not in col_names:
                missing.append(req)
        
        if missing:
            print(f"\n❌ MISSING COLUMNS: {missing}")
            print("   Migration needs to be run!")
        else:
            print("\n✅ All columns present.")

if __name__ == "__main__":
    asyncio.run(check_schema())
