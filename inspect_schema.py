import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv(os.path.join("backend", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "+psycopg2")

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = inspector.get_columns('pulses')
print("Columns in 'pulses' table:")
for column in columns:
    print(f"- {column['name']} ({column['type']})")
