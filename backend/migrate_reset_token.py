import os
import urllib.parse
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

load_dotenv()

def migrate():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        password = urllib.parse.quote_plus("Jesuslove@12")
        db_url = f"postgresql://postgres:{password}@localhost/all_inone"
    
    engine = create_engine(db_url)
    
    with engine.connect() as connection:
        print("Checking for missing columns in 'users' table...")
        
        # Add reset_token column if it doesn't exist
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100)"))
            connection.commit()
            print("Added 'reset_token' column.")
        except Exception as e:
            print(f"'reset_token' column might already exist or error: {e}")
            
        # Add reset_token_expiry column if it doesn't exist
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP"))
            connection.commit()
            print("Added 'reset_token_expiry' column.")
        except Exception as e:
            print(f"'reset_token_expiry' column might already exist or error: {e}")

if __name__ == "__main__":
    migrate()
