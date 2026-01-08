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

def wait_for_db(max_attempts=60, delay=2):
    """Wait for database to be available with exponential backoff."""
    for attempt in range(max_attempts):
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print(f"✓ Database is ready after {attempt + 1} attempt(s) ({(attempt + 1) * delay}s elapsed)")
            return True
        except (OperationalError, Exception) as e:
            if attempt < max_attempts - 1:
                elapsed = (attempt + 1) * delay
                print(f"✗ Database not ready (attempt {attempt + 1}/{max_attempts}, {elapsed}s elapsed). Retrying in {delay}s...")
                print(f"  Error: {str(e)[:100]}")
                time.sleep(delay)
            else:
                print(f"✗ Failed to connect to database after {max_attempts} attempts ({max_attempts * delay}s)")
                print(f"  Last error: {str(e)}")
                return False
    return False

def init_db():
    """Initialize database and create default users."""
    print("=" * 60)
    print("Starting database initialization...")
    print("=" * 60)
    
    app = create_app()
    
    with app.app_context():
        print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        
        # Wait for database to be ready
        print("\nWaiting for PostgreSQL to be ready...")
        if not wait_for_db():
            print("\nERROR: Could not connect to database after all retry attempts.")
            print("The PostgreSQL container may not be running or not fully initialized.")
            print("Please check the database logs and try again.")
            sys.exit(1)
        
        # Create all tables
        try:
            print("\nCreating database tables...")
            db.create_all()
            print("✓ Database tables created successfully")
        except Exception as e:
            print(f"✗ Error creating database tables: {e}")
            sys.exit(1)
        
        # Create default superadmin user
        try:
            superadmin_user = User.query.filter_by(username='superadmin').first()
            if not superadmin_user:
                print("\nCreating default superadmin user...")
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
                print("\n✓ Superadmin user already exists")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error creating superadmin user: {e}")
            sys.exit(1)
        
        print("\n" + "=" * 60)
        print("Database initialization completed successfully!")
        print("=" * 60)

if __name__ == '__main__':
    init_db()
