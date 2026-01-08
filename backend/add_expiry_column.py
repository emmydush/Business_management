import os
import sys
import urllib.parse
from sqlalchemy import text, create_engine

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

db_url = os.getenv('DATABASE_URL')
if not db_url:
    password = urllib.parse.quote_plus("Jesuslove@12")
    db_url = f"postgresql://postgres:{password}@localhost/all_inone"

engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE products ADD COLUMN expiry_date DATE"))
        conn.commit()
        print("Successfully added expiry_date column to products table.")
    except Exception as e:
        print(f"Error adding column: {e}")
        if "already exists" in str(e):
            print("Column already exists, skipping.")
