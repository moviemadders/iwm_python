import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/movie_madders"

async def inspect_and_clean():
    print(f"🔌 Connecting to database...")
    try:
        engine = create_async_engine(DATABASE_URL)
        
        async with engine.connect() as conn:
            print("🔍 Checking other columns...")
            
            # Check movies backdrop_url
            result = await conn.execute(
                text("UPDATE movies SET backdrop_url = NULL WHERE backdrop_url LIKE '%placeholder%'")
            )
            if result.rowcount > 0:
                print(f"✅ Cleaned {result.rowcount} movies backdrop_url")
                await conn.commit()
            
            # Check users avatar_url
            # Check columns first
            columns_res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            columns = [r[0] for r in columns_res.fetchall()]
            
            if 'avatar_url' in columns:
                result = await conn.execute(
                    text("UPDATE users SET avatar_url = NULL WHERE avatar_url LIKE '%placeholder%'")
                )
                if result.rowcount > 0:
                    print(f"✅ Cleaned {result.rowcount} users avatar_url")
                    await conn.commit()
            
            print("🎉 All done!")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(inspect_and_clean())
