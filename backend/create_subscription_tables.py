"""
Create subscription tables
Run this once to create subscription and plan tables
"""
from app import create_app, db

app = create_app()

def create_subscription_tables():
    with app.app_context():
        # Import models to ensure they're registered
        from app.models.subscription import Subscription, Plan
        
        # Create tables
        db.create_all()
        print("Subscription tables created successfully!")

if __name__ == '__main__':
    create_subscription_tables()
