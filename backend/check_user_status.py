"""
Script to check user and business status for login issues
"""
from app import create_app, db
from app.models.user import User
from app.models.business import Business

app = create_app()

with app.app_context():
    print("\n=== User & Business Status Check ===\n")
    
    # Get all users
    users = User.query.all()
    
    for user in users:
        print(f"User: {user.username} (ID: {user.id})")
        print(f"  Email: {user.email}")
        print(f"  Role: {user.role}")
        print(f"  Active: {user.is_active}")
        print(f"  Business ID: {user.business_id}")
        
        if user.business_id:
            business = db.session.get(Business, user.business_id)
            if business:
                print(f"  Business Name: {business.name}")
                print(f"  Business Active: {business.is_active}")
                # Check if business has any subscriptions
                if hasattr(business, 'subscriptions') and business.subscriptions:
                    latest_sub = business.subscriptions[0]  # Assuming first is latest
                    print(f"  Has Subscription: Yes")
                    print(f"  Subscription Status: Active" if latest_sub else "  Has Subscription: No")
            else:
                print(f"  ⚠️  Business not found!")
        else:
            if user.role.value != 'superadmin':
                print(f"  ⚠️  No business association (non-superadmin)!")
        
        print()
    
    print("=== Check Complete ===\n")
