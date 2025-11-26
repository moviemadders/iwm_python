import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")

async def enable_admin_role():
    """Enable admin role for user"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        # Update the role to be enabled
        await conn.execute(
            text("""
                UPDATE user_role_profiles 
                SET role_type = 'admin', enabled = true
                WHERE user_id = 1
            """)
        )
        print("✅ Updated role_type to 'admin' and enabled=true")
        
        # Verify the update
        result = await conn.execute(
            text("SELECT id, user_id, role_type, enabled FROM user_role_profiles WHERE user_id = 1")
        )
        role = result.fetchone()
        print(f"\nCurrent role for user 1:")
        print(f"  ID: {role[0]}, User ID: {role[1]}, Role Type: {role[2]}, Enabled: {role[3]}")
        
        if role[2] == 'admin' and role[3] == True:
            print("\n✅ SUCCESS! Admin role is enabled!")
            print("📝 IMPORTANT: Log out and log back in to get a fresh token with admin privileges.")
        else:
            print(f"\n❌ Issue: Role={role[2]}, Enabled={role[3]}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(enable_admin_role())
