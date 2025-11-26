import asyncio
from sqlalchemy import inspect, text
import src.db as db
from src.models import Pulse

async def check_schema():
    await db.init_db()
    async with db.engine.connect() as conn:
        await conn.run_sync(lambda sync_conn: print_columns(sync_conn))

def print_columns(conn):
    inspector = inspect(conn)
    columns = inspector.get_columns('pulses')
    print("\nDatabase Columns for 'pulses':")
    db_cols = set()
    for col in columns:
        print(f"- {col['name']} ({col['type']})")
        db_cols.add(col['name'])
    
    print("\nModel Fields:")
    model_cols = set()
    for col in Pulse.__table__.columns:
        print(f"- {col.name}")
        model_cols.add(col.name)
        
    print("\nMissing in DB:")
    print(model_cols - db_cols)
    
    print("\nExtra in DB:")
    print(db_cols - model_cols)

if __name__ == "__main__":
    asyncio.run(check_schema())
