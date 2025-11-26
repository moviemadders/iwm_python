import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env vars
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "+psycopg2")

engine = create_engine(DATABASE_URL)

def add_mentioned_movies_column():
    with engine.connect() as conn:
        # Add column
        print("Adding mentioned_movies column...")
        conn.execute(text("""
            ALTER TABLE pulses 
            ADD COLUMN IF NOT EXISTS mentioned_movies JSONB
        """))
        
        # Add index
        print("Creating GIN index...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pulses_mentioned_movies 
            ON pulses USING GIN (mentioned_movies)
            WHERE mentioned_movies IS NOT NULL
        """))
        
        conn.commit()
        print("✅ Success! mentioned_movies column added.")

if __name__ == "__main__":
    add_mentioned_movies_column()
