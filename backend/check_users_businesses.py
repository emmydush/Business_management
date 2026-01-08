#!/usr/bin/env python
"""
Script to check users and their business associations
"""

from app import create_app
from app.models.user import User
from app.models.business import Business

def check_users_and_businesses():
    """
    Check users and their business associations
    """
    print("=== Checking Users and Business Associations ===\n")
    
    app = create_app()
    
    with app.app_context():
        # Check all users
        users = User.query.all()
        
        print(f"Found {len(users)} users:")
        print(f"{'ID':<3} {'Username':<20} {'Email':<30} {'Role':<12} {'Business ID':<10} {'Status':<12} {'Approval':<12}")
        print("-" * 100)
        
        for user in users:
            print(f"{user.id:<3} {user.username:<20} {user.email:<30} {user.role.value:<12} {user.business_id:<10} {'Active' if user.is_active else 'Inactive':<12} {user.approval_status.value:<12}")
        
        print("\n" + "="*100)
        
        # Check all businesses
        businesses = Business.query.all()
        
        print(f"\nFound {len(businesses)} businesses:")
        print(f"{'ID':<3} {'Name':<30} {'Email':<35} {'Active':<8}")
        print("-" * 80)
        
        for business in businesses:
            print(f"{business.id:<3} {business.name[:28]:<30} {business.email[:33]:<35} {'Yes' if business.is_active else 'No':<8}")
        
        print("\n" + "="*100)
        
        # Check specifically for the conflicting email
        conflicting_emails = [
            "kubwimanatheophile02@gmail.com",
            "emmychris915@gmail.com",
            "ishimwe@gmail.com"
        ]
        
        print(f"\nDetailed check for specific emails:")
        for email in conflicting_emails:
            user = User.query.filter_by(email=email).first()
            business = Business.query.filter_by(email=email).first()
            
            print(f"\nEmail: {email}")
            if user:
                print(f"  -> Found in Users: ID {user.id}, Username: {user.username}, Business ID: {user.business_id}, Role: {user.role.value}")
            else:
                print(f"  -> Not found in Users")
                
            if business:
                print(f"  -> Found in Businesses: ID {business.id}, Name: {business.name}")
            else:
                print(f"  -> Not found in Businesses")


if __name__ == "__main__":
    check_users_and_businesses()