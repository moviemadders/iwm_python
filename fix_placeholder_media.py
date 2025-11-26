import asyncio
import sys
import os

# Add backend/src to path correctly
current_dir = os.getcwd()
backend_src = os.path.join(current_dir, 'backend', 'src')
sys.path.insert(0, backend_src)

print(f"Added to path: {backend_src}")

try:
    from db import get_session, init_db
    from sqlalchemy import text
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure you are running this from the project root.")
    sys.exit(1)

async def clean():
    print("🔌 Initializing database connection...")
    await init_db()
    
    print("🔍 Cleaning placeholder media from pulses...")
    try:
        async for session in get_session():
            if session is None:
                print("❌ Failed to get session. Database URL might be missing.")
                return

            result = await session.execute(
                text("UPDATE pulses SET content_media = NULL WHERE content_media LIKE '%placeholder%'")
            )
            await session.commit()
            print(f"✅ Cleaned {result.rowcount} pulses with placeholder media")
            print("🎉 Database cleaned! Refresh your browser to see the changes.")
            break
    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(clean())
