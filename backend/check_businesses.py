#!/usr/bin/env python
"""
Script to check existing businesses in the database
"""

from app import create_app
from app.models.business import Business

def check_businesses():
    """
    Check existing businesses in the database
    """
    print("=== Checking Existing Businesses ===\n")
    
    app = create_app()
    
    with app.app_context():
        businesses = Business.query.all()
        
        if businesses:
            print(f"Found {len(businesses)} businesses:")
            for business in businesses:
                print(f"  ID: {business.id}, Name: {business.name}, Email: {business.email}")
        else:
            print("No businesses found in the database.")
        
        # Check specifically for the duplicate email
        duplicate_email = "kubwimanatheophile02@gmail.com"
        existing_business = Business.query.filter_by(email=duplicate_email).first()
        
        if existing_business:
            print(f"\nFound existing business with email '{duplicate_email}':")
            print(f"  ID: {existing_business.id}")
            print(f"  Name: {existing_business.name}")
            print(f"  Active: {existing_business.is_active}")
        else:
            print(f"\nNo existing business found with email '{duplicate_email}'")


if __name__ == "__main__":
    check_businesses()