"""List all users in the database to find admin"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.src.db import init_db
import asyncio
from sqlalchemy import select
from backend.src.models import User

async def list_users():
    await init_db()
    from backend.src.db import SessionLocal
    
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        print(f"\nFound {len(users)} users:\n")
        for user in users:
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Is Admin: {user.is_admin}")
            print(f"Is Active: {user.is_active}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(list_users())
