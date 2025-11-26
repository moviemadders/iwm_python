import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.src.db import init_db, get_session_factory
from backend.src.models import Pulse
from sqlalchemy import select, func

async def check():
    await init_db()
    async with get_session_factory()() as session:
        result = await session.execute(select(func.count(Pulse.id)))
        count = result.scalar()
        print(f'Total Pulses in DB: {count}')
        
        if count > 0:
            # Print the latest pulse
            latest = await session.execute(select(Pulse).order_by(Pulse.created_at.desc()).limit(1))
            p = latest.scalar_one()
            print(f"Latest Pulse ID: {p.id}")
            print(f"Latest Pulse Content: {p.content_text}")
            print(f"Latest Pulse User ID: {p.user_id}")

if __name__ == "__main__":
    asyncio.run(check())
