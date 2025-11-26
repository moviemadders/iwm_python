import asyncio
from sqlalchemy import text
import src.db as db

async def check_pulses():
    await db.init_db()
    async with db.engine.connect() as conn:
        result = await conn.execute(
            text('SELECT id, external_id, content_text, created_at FROM pulses ORDER BY created_at DESC LIMIT 5')
        )
        rows = result.fetchall()
        print(f'Found {len(rows)} pulses in database:')
        for r in rows:
            print(f'  - ID: {r[0]}, External: {r[1]}, Text: {r[2][:50] if len(r[2]) > 50 else r[2]}, Created: {r[3]}')

if __name__ == "__main__":
    asyncio.run(check_pulses())
