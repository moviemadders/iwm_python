import sqlite3
import os

DB_FILE = "moviemadders.db"

def inspect_db():
    if not os.path.exists(DB_FILE):
        print(f"❌ Database file {DB_FILE} not found!")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print(f"🔹 Inspecting {DB_FILE}...")
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f" - {table[0]}")
        
    # Inspect users table
    print("\n🔹 Schema of 'users' table:")
    try:
        cursor.execute("PRAGMA table_info(users);")
        columns = cursor.fetchall()
        for col in columns:
            print(f" - {col[1]} ({col[2]})")
    except Exception as e:
        print(f"❌ Error inspecting users table: {e}")
        
    conn.close()

if __name__ == "__main__":
    inspect_db()
