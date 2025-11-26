import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=False)

async def inspect_triggers():
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT trigger_name, event_manipulation, event_object_table, action_statement "
            "FROM information_schema.triggers "
            "WHERE event_object_table = 'reviews';"
        ))
        triggers = result.fetchall()
        print("🔹 Reviews Table Triggers:")
        if not triggers:
            print(" - No triggers found.")
        for trig in triggers:
            print(f" - {trig.trigger_name}: {trig.event_manipulation} on {trig.event_object_table}")

if __name__ == "__main__":
    asyncio.run(inspect_triggers())
