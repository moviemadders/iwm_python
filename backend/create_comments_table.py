import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "+psycopg2")

engine = create_engine(DATABASE_URL)

def create_pulse_comments_table():
    with engine.connect() as conn:
        print("Creating pulse_comments table...")
        
        # Drop if exists and recreate
        conn.execute(text("DROP TABLE IF EXISTS pulse_comments CASCADE"))
        
        # Create table
        conn.execute(text("""
            CREATE TABLE pulse_comments (
                id SERIAL PRIMARY KEY,
                pulse_id INTEGER NOT NULL REFERENCES pulses(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 500),
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                CONSTRAINT pulse_comments_content_not_empty CHECK (TRIM(content) != '')
            )
        """))
        
        # Create indexes
        print("Creating indexes...")
        conn.execute(text("""
            CREATE INDEX idx_pulse_comments_pulse_id 
            ON pulse_comments(pulse_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX idx_pulse_comments_created 
            ON pulse_comments(created_at DESC)
        """))
        
        conn.commit()
        print("✅ pulse_comments table created successfully!")

if __name__ == "__main__":
    create_pulse_comments_table()
