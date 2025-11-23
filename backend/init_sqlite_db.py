import sys
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Monkeypatch PostgreSQL types to work with SQLite
import sqlalchemy.dialects.postgresql
from sqlalchemy.types import JSON, String, TypeDecorator

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

async def init_db():
    print(f"🔹 Initializing SQLite database at {DATABASE_URL}...")
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("🔹 Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables created successfully")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
