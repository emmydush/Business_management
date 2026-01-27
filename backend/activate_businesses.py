"""
Script to activate blocked business accounts
"""
from app import create_app, db
from app.models.business import Business

app = create_app()

with app.app_context():
    print("\n=== Activating Business Accounts ===\n")
    
    # Get all inactive businesses
    inactive_businesses = Business.query.filter_by(is_active=False).all()
    
    if not inactive_businesses:
        print("No inactive businesses found.")
    else:
        print(f"Found {len(inactive_businesses)} inactive business(es):\n")
        
        for business in inactive_businesses:
            print(f"Business: {business.name} (ID: {business.id})")
            print(f"  Current Status: Inactive")
            
            # Activate the business
            business.is_active = True
            db.session.commit()
            
            print(f"  [OK] Status changed to: Active\n")
        
        print("All businesses have been activated!")
    
    print("\n=== Activation Complete ===\n")
