import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.security.password import hash_password

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")

async def reset_admin_password():
    """Reset admin password to admin123"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Hash the password
    new_password = "admin123"
    hashed = hash_password(new_password)
    
    async with engine.begin() as conn:
        # Update password
        await conn.execute(
            text("""
                UPDATE users 
                SET hashed_password = :hashed_password
                WHERE email = 'admin@iwm.com'
            """),
            {"hashed_password": hashed}
        )
        print(f"✅ Updated password for admin@iwm.com")
        print(f"   New password: {new_password}")
        print(f"\n📝 You can now log in with:")
        print(f"   Email: admin@iwm.com")
        print(f"   Password: {new_password}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_admin_password())
