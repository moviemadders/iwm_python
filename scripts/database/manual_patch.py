"""
Manual patch to add columns and assign role.
This handles the case where Alembic thinks migration is applied but columns are missing.
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def patch_db():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("🔧 Patching database...")
        
        # 1. Add columns if missing
        try:
            await conn.execute(text("ALTER TABLE pulses ADD COLUMN IF NOT EXISTS posted_as_role VARCHAR(20)"))
            await conn.execute(text("ALTER TABLE pulses ADD COLUMN IF NOT EXISTS star_rating SMALLINT CHECK (star_rating >= 1 AND star_rating <= 5)"))
            await conn.execute(text("ALTER TABLE pulses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP"))
            print("✅ Columns added (if they were missing)")
        except Exception as e:
            print(f"⚠️ Error adding columns: {e}")

        # 2. Create indexes
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pulses_role_created ON pulses(posted_as_role, created_at DESC)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pulses_movie_role ON pulses(linked_movie_id, posted_as_role)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pulses_user_role ON pulses(user_id, posted_as_role)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pulses_deleted_at ON pulses(deleted_at)"))
            print("✅ Indexes created")
        except Exception as e:
            print(f"⚠️ Error creating indexes: {e}")

        # 3. Assign role to user
        # Get user ID for user1@iwm.com
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'user1@iwm.com'"))
        user = result.fetchone()
        
        if user:
            user_id = user[0]
            print(f"👤 Found user1 (ID: {user_id})")
            
            # Check if role exists
            role_res = await conn.execute(text(
                f"SELECT 1 FROM user_role_profiles WHERE user_id = {user_id} AND role_type = 'critic'"
            ))
            if not role_res.fetchone():
                # Insert role
                await conn.execute(text(
                    f"INSERT INTO user_role_profiles (user_id, role_type, enabled, created_at, updated_at) VALUES ({user_id}, 'critic', true, NOW(), NOW())"
                ))
                print("✅ Assigned 'critic' role to user1")
            else:
                print("ℹ️ User1 already has 'critic' role")
        else:
            print("❌ User1 not found!")

if __name__ == "__main__":
    asyncio.run(patch_db())
