import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app import create_app

def create_database():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:Jesuslove%4012@localhost:5432/all_inone')
    
    # Extract the database name from the URL
    db_name = database_url.split('/')[-1]
    
    # Create an engine without specifying the database
    base_url = database_url.rsplit('/', 1)[0]  # Remove database name from URL
    base_url = base_url.replace(f'/{db_name}', '')  # Ensure we remove the database name
    
    # Connect to the default postgres database to create our database
    default_db_url = base_url + '/postgres'
    
    try:
        # Create engine for default database
        engine = create_engine(default_db_url)
        
        # Connect and create the database
        with engine.connect() as conn:
            # Need to execute this outside of a transaction
            conn.execute(text("COMMIT"))
            try:
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                print(f"Database '{db_name}' created successfully!")
            except OperationalError as e:
                if "already exists" in str(e):
                    print(f"Database '{db_name}' already exists.")
                else:
                    print(f"Error creating database: {e}")
                    return False
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        # If we can't connect to postgres db, try to connect directly
        try:
            engine = create_engine(database_url)
            print("Database connection successful!")
        except Exception as e2:
            print(f"Could not connect to database: {e2}")
            return False
    
    return True

def init_tables():
    try:
        app = create_app()
        with app.app_context():
            from app import db
            db.create_all()
            print("Tables created successfully!")
        return True
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

if __name__ == "__main__":
    print("Creating database...")
    if create_database():
        print("Initializing tables...")
        if init_tables():
            print("Database and tables created successfully!")
        else:
            print("Failed to initialize tables.")
    else:
        print("Failed to create database.")