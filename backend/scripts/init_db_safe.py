"""Initialize database with retry logic.
This script should be run after the app starts to create tables and seed data.
Usage: python scripts/init_db_safe.py
"""
import time
import sys
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app import create_app, db
from app.models.user import User, UserRole

def wait_for_db(max_attempts=30, delay=1):
    """Wait for database to be available."""
    for attempt in range(max_attempts):
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print(f"✓ Database is ready after {attempt + 1} attempt(s)")
            return True
        except OperationalError as e:
            if attempt < max_attempts - 1:
                print(f"✗ Database not ready (attempt {attempt + 1}/{max_attempts}). Retrying in {delay}s...")
                time.sleep(delay)
            else:
                print(f"✗ Failed to connect to database after {max_attempts} attempts")
                return False
    return False

def init_db():
    """Initialize database and create default users."""
    app = create_app()
    
    with app.app_context():
        # Wait for database to be ready
        if not wait_for_db():
            print("ERROR: Could not connect to database. Exiting.")
            sys.exit(1)
        
        # Create all tables
        try:
            print("Creating database tables...")
            db.create_all()
            print("✓ Database tables created successfully")
        except Exception as e:
            print(f"✗ Error creating database tables: {e}")
            sys.exit(1)
        
        # Create default superadmin user
        try:
            superadmin_user = User.query.filter_by(username='superadmin').first()
            if not superadmin_user:
                print("Creating default superadmin user...")
                superadmin = User(
                    username='superadmin',
                    email='superadmin@business.com',
                    first_name='Super',
                    last_name='Admin',
                    role=UserRole.superadmin
                )
                superadmin.set_password('admin123')
                db.session.add(superadmin)
                db.session.commit()
                print("✓ Default superadmin user created (username: superadmin, password: admin123)")
            else:
                print("✓ Superadmin user already exists")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error creating superadmin user: {e}")
            sys.exit(1)

if __name__ == '__main__':
    init_db()
