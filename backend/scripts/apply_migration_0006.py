import sys
import os

# Add the backend directory to sys.path to import app
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app import create_app, db

def apply_migration():
    app = create_app()
    with app.app_context():
        print("Applying migration 0006: Add document tracking columns...")
        
        # Execute the SQL commands
        try:
            db.session.execute(db.text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;"))
            db.session.execute(db.text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;"))
            db.session.commit()
            print("Migration 0006 applied successfully!")
        except Exception as e:
            print(f"Error applying migration: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    apply_migration()