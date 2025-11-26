import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join("backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found")
    sys.exit(1)

if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "+psycopg2")

engine = create_engine(DATABASE_URL)

def check_latest_pulse():
    with engine.connect() as conn:
        # Get the most recent pulse
        query = text("""
            SELECT id, user_id, content_text, posted_as_role, star_rating, created_at, deleted_at
            FROM pulses
            ORDER BY created_at DESC
            LIMIT 1
        """)
        result = conn.execute(query).fetchone()
        
        if result:
            print("\n--- Latest Pulse ---")
            print(f"ID: {result.id}")
            print(f"User ID: {result.user_id}")
            print(f"Content: {result.content_text}")
            print(f"Role: {result.posted_as_role}")
            print(f"Rating: {result.star_rating}")
            print(f"Created At: {result.created_at}")
            print(f"Deleted At: {result.deleted_at}")
            
            if "critic" in str(result.content_text).lower():
                print("\n✅ SUCCESS: Found the test critic post!")
            else:
                print("\n⚠️ WARNING: Latest post does not match the test content.")
        else:
            print("\n❌ No pulses found in database.")

if __name__ == "__main__":
    check_latest_pulse()
