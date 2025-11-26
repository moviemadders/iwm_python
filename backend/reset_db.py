"""
Script to reset and initialize the PostgreSQL database.
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def reset_database():
    """Drop and recreate the database."""
    # Connect to postgres database to create/drop our target database
    admin_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    db_name = "movie_madders"
    
    engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
    
    try:
        async with engine.connect() as conn:
            # Drop database if exists
            print(f"Dropping database '{db_name}' if it exists...")
            await conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            
            # Create database
            print(f"Creating database '{db_name}'...")
            await conn.execute(text(f"CREATE DATABASE {db_name}"))
            
            print(f"✅ Database '{db_name}' created successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_database())
