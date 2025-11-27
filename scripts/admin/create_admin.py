
import asyncio
import sys
import os
import logging
from pathlib import Path

# Add the parent directory to sys.path to allow importing backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.src import db  # Import the module, not the variable
from backend.src.config import settings
from backend.src.models import User, UserRoleProfile, AdminUserMeta
from backend.src.security.password import hash_password
from sqlalchemy import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_admin(email, password, name="Admin User"):
    print(f"DEBUG: settings.database_url = {settings.database_url}")
    
    await db.init_db()
    
    if db.SessionLocal is None:
        logger.error("Failed to initialize database session.")
        return

    async with db.SessionLocal() as session:
        # Check if user exists
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            logger.info(f"User {email} already exists. Updating to admin...")
            # Update password if provided
            if password:
                user.hashed_password = hash_password(password)
        else:
            logger.info(f"Creating new admin user {email}...")
            user = User(
                email=email,
                name=name,
                hashed_password=hash_password(password),
                external_id=email, # Simple external ID for now
                avatar_url="https://api.dicebear.com/9.x/adventurer/svg?seed=Admin"
            )
            session.add(user)
            await session.flush() # Get ID

        # Check/Create AdminUserMeta
        stmt = select(AdminUserMeta).where(AdminUserMeta.user_id == user.id)
        result = await session.execute(stmt)
        admin_meta = result.scalar_one_or_none()

        if not admin_meta:
            admin_meta = AdminUserMeta(
                user_id=user.id,
                email=user.email,
                roles=["admin", "lover"],
                status="Active"
            )
            session.add(admin_meta)
        else:
            if "admin" not in admin_meta.roles:
                admin_meta.roles = list(set(admin_meta.roles + ["admin"]))

        # Check/Create UserRoleProfile for admin
        stmt = select(UserRoleProfile).where(
            UserRoleProfile.user_id == user.id,
            UserRoleProfile.role_type == "admin"
        )
        result = await session.execute(stmt)
        admin_profile = result.scalar_one_or_none()

        if not admin_profile:
            admin_profile = UserRoleProfile(
                user_id=user.id,
                role_type="admin",
                enabled=True,
                visibility="public",
                is_default=False
            )
            session.add(admin_profile)
        else:
            admin_profile.enabled = True

        await session.commit()
        logger.info(f"Successfully configured {email} as admin.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password> [name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else "Admin User"
    
    asyncio.run(create_admin(email, password, name))
