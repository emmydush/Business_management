import os
import urllib.parse
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

def check_columns():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        password = urllib.parse.quote_plus("Jesuslove@12")
        db_url = f"postgresql://postgres:{password}@localhost/all_inone"
    
    engine = create_engine(db_url)
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    print(f"Columns in 'users' table: {columns}")
    
    if 'reset_token' in columns and 'reset_token_expiry' in columns:
        print("SUCCESS: Columns exist.")
    else:
        print("FAILURE: Columns missing.")

if __name__ == "__main__":
    check_columns()
