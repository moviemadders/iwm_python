import asyncio
import sys
sys.path.append('backend/src')

from database import get_session
from sqlalchemy import text

async def check_pulse_media():
    async for session in get_session():
        # Check what media URLs exist
        result = await session.execute(
            text("SELECT id, content_media FROM pulses WHERE content_media IS NOT NULL LIMIT 10")
        )
        rows = result.fetchall()
        print(f"Found {len(rows)} pulses with media:")
        for row in rows:
            print(f"  Pulse {row[0]}: {row[1]}")
        break

if __name__ == "__main__":
    asyncio.run(check_pulse_media())
