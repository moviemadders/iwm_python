import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")

async def list_users():
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        result = await conn.execute(
            text("""
                SELECT id, email, username, name
                FROM users
                ORDER BY id
            """)
        )
        users = result.fetchall()
    
    await engine.dispose()
    
    print("\n📊 All users in database:")
    print("-" * 80)
    for user in users:
        print(f"ID: {user[0]:<5} Email: {user[1]:<30} Username: {user[2]:<20} Name: {user[3]}")
    
    return users

if __name__ == "__main__":
    asyncio.run(list_users())
