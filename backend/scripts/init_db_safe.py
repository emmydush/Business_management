"""Initialize database with retry logic.
This script should be run after the app starts to create tables and seed data.
Usage: python scripts/init_db_safe.py
"""
import time
import sys
import os
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError
from app import create_app, db
from app.models.user import User, UserRole

def test_db_connection(db_url, max_attempts=60, delay=2):
    """Test database connection directly without Flask app context."""
    print(f"\nDirect database connectivity test...")
    print(f"Testing connection to: {db_url.split('@')[1] if '@' in db_url else db_url}")
    
    for attempt in range(max_attempts):
        try:
            engine = create_engine(db_url)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print(f"✓ Database connection successful after {attempt + 1} attempt(s)")
            engine.dispose()
            return True
        except Exception as e:
            elapsed = (attempt + 1) * delay
            if attempt < max_attempts - 1:
                print(f"✗ Attempt {attempt + 1}/{max_attempts} failed ({elapsed}s elapsed). Retrying in {delay}s...")
                time.sleep(delay)
            else:
                print(f"✗ Failed after {max_attempts} attempts ({elapsed}s total)")
                print(f"  Last error: {str(e)[:150]}")
                return False
    return False

def init_db():
    """Initialize database and create default users."""
    print("=" * 60)
    print("Starting database initialization...")
    print("=" * 60)
    
    # First test connection directly without Flask context
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        import urllib.parse
        password = urllib.parse.quote_plus("Jesuslove@12")
        db_url = f"postgresql://postgres:{password}@localhost/all_inone"
    
    if not test_db_connection(db_url):
        print("\n" + "=" * 60)
        print("ERROR: Database is not accessible")
        print("=" * 60)
        sys.exit(1)
    
    # Now create Flask app and initialize database
    print("\nCreating Flask app...")
    app = create_app()
    
    with app.app_context():
        # Create all tables
        try:
            print("Creating database tables...")
            db.create_all()
            print("✓ Database tables created successfully")
        except Exception as e:
            print(f"✗ Error creating database tables: {e}")
            import traceback
            traceback.print_exc()
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
            import traceback
            traceback.print_exc()
            sys.exit(1)
        
        print("\n" + "=" * 60)
        print("Database initialization completed successfully!")
        print("=" * 60)

if __name__ == '__main__':
    init_db()
