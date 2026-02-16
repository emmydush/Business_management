import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db

app = create_app()

with app.app_context():
    try:
        # Check current columns in employees table
        result = db.session.execute(db.text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
        """))
        columns = [row[0] for row in result]
        print(f"Current columns in employees table: {columns}")
        
        # Check if user_id exists
        if 'user_id' in columns:
            print("user_id column already exists!")
        else:
            print("Adding user_id column to employees table...")
            # First, let's see what columns exist
            print("Columns before migration:", columns)
            
            # Add the column (allowing NULL initially, then we'll update it)
            db.session.execute(db.text("""
                ALTER TABLE employees ADD COLUMN user_id INTEGER REFERENCES users(id)
            """))
            db.session.commit()
            print("Column added successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
