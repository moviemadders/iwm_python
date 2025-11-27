import asyncio
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

from sqlalchemy import select
import src.db
from src.models import User
from src.config import settings

async def main():
    print(f"Database URL: {settings.database_url}")
    await src.db.init_db()
    if src.db.SessionLocal is None:
        print("Failed to initialize DB (SessionLocal is None)")
        return

    async with src.db.SessionLocal() as session:
        # List all users
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, ExternalID: {u.external_id}")

if __name__ == "__main__":
    asyncio.run(main())
