import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

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

# Add current directory to sys.path
sys.path.append(os.getcwd())

from src.db import Base
from src import models  # Import all models to register them
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./moviemadders.db")
DB_FILE = "moviemadders.db"

async def clean_and_init():
    print(f"🚀 Starting clean initialization for {DATABASE_URL}...")

    # 1. Delete existing database
    if os.path.exists(DB_FILE):
        print(f"🔹 Deleting existing {DB_FILE}...")
        try:
            os.remove(DB_FILE)
            print("✅ Database file deleted")
        except Exception as e:
            print(f"❌ Failed to delete database file: {e}")
            return False
    else:
        print(f"🔹 No existing {DB_FILE} found")

    # 2. Initialize schema
    print("🔹 Creating tables...")
    try:
        engine = create_async_engine(DATABASE_URL, echo=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()
        print("✅ Tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

    # 3. Seed database
    print("🔹 Seeding database...")
    try:
        # Import seed function here to ensure it uses the fresh schema
        from seed_database import main as seed_main
        await seed_main()
        print("✅ Database seeded successfully")
    except Exception as e:
        print(f"❌ Failed to seed database: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n✨ Clean initialization completed successfully! ✨")
    return True

if __name__ == "__main__":
    if asyncio.run(clean_and_init()):
        sys.exit(0)
    else:
        sys.exit(1)
