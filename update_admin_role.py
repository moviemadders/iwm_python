import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")

async def update_to_admin():
    """Update user role to admin"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        # Update the role_type to admin
        await conn.execute(
            text("""
                UPDATE user_role_profiles 
                SET role_type = 'admin'
                WHERE user_id = 1
            """)
        )
        print("✅ Updated role_type to 'admin'")
        
        # Verify the update
        result = await conn.execute(
            text("SELECT id, user_id, role_type FROM user_role_profiles WHERE user_id = 1")
        )
        role = result.fetchone()
        print(f"\nCurrent role for user 1:")
        print(f"  ID: {role[0]}, User ID: {role[1]}, Role Type: {role[2]}")
        
        if role[2] == 'admin':
            print("\n✅ SUCCESS! User is now an admin!")
            print("📝 Please log out and log back in to see the admin role.")
        else:
            print(f"\n❌ Role is still: {role[2]}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_to_admin())
