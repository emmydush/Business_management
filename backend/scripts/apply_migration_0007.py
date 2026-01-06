import sys
import os

# Add the backend directory to sys.path to import app
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app import create_app, db

def apply_migration():
    app = create_app()
    with app.app_context():
        print("Applying migration 0007: Create assets table...")
        
        # Execute the SQL commands from the migration file
        try:
            with open('db_migrations/0007_add_assets_table.sql', 'r') as f:
                sql_content = f.read()
            
            # Split and execute each statement separately
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            for statement in statements:
                if statement:  # Skip empty statements
                    db.session.execute(db.text(statement))
            
            db.session.commit()
            print("Migration 0007 applied successfully!")
        except Exception as e:
            print(f"Error applying migration: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    apply_migration()