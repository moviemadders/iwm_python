
import asyncio
import sys
import os

# Add the parent directory to sys.path to allow importing backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from sqlalchemy import select
from backend.src.db import init_db, SessionLocal
from backend.src.models import User, UserRoleProfile

async def check_admins():
    await init_db()
    
    if SessionLocal is None:
        print("Failed to initialize database session.")
        return

    async with SessionLocal() as session:
        # Find users with admin role profile
        stmt = select(User).join(UserRoleProfile).where(UserRoleProfile.role_type == "admin")
        result = await session.execute(stmt)
        admins = result.scalars().all()
        
        print(f"Found {len(admins)} admin users:")
        for admin in admins:
            print(f"- {admin.email} (ID: {admin.id})")
            
        # List all users and their roles
        print("\nAll users and their roles:")
        stmt = select(User)
        result = await session.execute(stmt)
        users = result.scalars().all()
        
        for user in users:
            # We need to fetch role_profiles eagerly or join them
            # Since we didn't do that in the query, we might get an error if we try to access them
            # Let's do a separate query for each user's roles to be safe/simple for this script
            role_stmt = select(UserRoleProfile).where(UserRoleProfile.user_id == user.id)
            role_result = await session.execute(role_stmt)
            roles = role_result.scalars().all()
            
            active_roles = [rp.role_type for rp in roles if rp.enabled]
            print(f"- {user.email}: {active_roles}")

if __name__ == "__main__":
    asyncio.run(check_admins())
