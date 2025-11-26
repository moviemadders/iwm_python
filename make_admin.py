import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")

async def check_and_fix_admin():
    """Check schema and make user admin"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        # Get user ID
        result = await conn.execute(
            text("SELECT id, email, name FROM users WHERE email = 'admin@iwm.com'")
        )
        user = result.fetchone()
        
        if not user:
            print("❌ User admin@iwm.com not found!")
            await engine.dispose()
            return False
        
        user_id = user[0]
        print(f"✅ Found user: {user[1]} (ID: {user_id}, Name: {user[2]})")
        
        # Check current role profile
        result = await conn.execute(
            text("SELECT * FROM user_role_profiles WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        current_role = result.fetchone()
        print(f"Current role profile: {current_role}")
        
        # Get column names for user_role_profiles
        result = await conn.execute(
            text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_role_profiles'
                ORDER BY ordinal_position
            """)
        )
        columns = [row[0] for row in result.fetchall()]
        print(f"\nColumns in user_role_profiles: {columns}")
        
        # Update or insert admin role
        if current_role:
            # Update existing role
            await conn.execute(
                text("""
                    UPDATE user_role_profiles 
                    SET role_type = 'admin'
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            print(f"✅ Updated role to admin for user {user_id}")
        else:
            # Insert new admin role
            await conn.execute(
                text("""
                    INSERT INTO user_role_profiles (user_id, role_type)
                    VALUES (:user_id, 'admin')
                """),
                {"user_id": user_id}
            )
            print(f"✅ Created admin role for user {user_id}")
        
        # Check if admin_user_meta table exists
        result = await conn.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'admin_user_meta'
                )
            """)
        )
        table_exists = result.scalar()
        
        if table_exists:
            # Get columns for admin_user_meta
            result = await conn.execute(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'admin_user_meta'
                    ORDER BY ordinal_position
                """)
            )
            admin_columns = [row[0] for row in result.fetchall()]
            print(f"\nColumns in admin_user_meta: {admin_columns}")
            
            # Check if record exists
            result = await conn.execute(
                text("SELECT * FROM admin_user_meta WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            admin_meta = result.fetchone()
            
            if not admin_meta:
                # Insert new admin meta
                await conn.execute(
                    text("""
                        INSERT INTO admin_user_meta (user_id, email, status)
                        VALUES (:user_id, :email, 'active')
                    """),
                    {"user_id": user_id, "email": user[1]}
                )
                print(f"✅ Created admin_user_meta for user {user_id}")
            else:
                print(f"✅ admin_user_meta already exists for user {user_id}")
        
        print(f"\n✅ Successfully granted admin privileges!")
        print(f"📝 Please log out and log back in for changes to take effect.")
    
    await engine.dispose()
    return True

if __name__ == "__main__":
    success = asyncio.run(check_and_fix_admin())
    import sys
    sys.exit(0 if success else 1)
