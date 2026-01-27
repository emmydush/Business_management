#!/usr/bin/env python3
"""
Script to validate and fix currency values in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.settings import CompanyProfile, ALLOWED_CURRENCIES

def validate_and_fix_currencies():
    """Validate all currency values and fix invalid ones"""
    app = create_app()
    
    with app.app_context():
        print("Validating currency values in database...")
        
        # Get all company profiles
        profiles = CompanyProfile.query.all()
        invalid_count = 0
        fixed_count = 0
        
        for profile in profiles:
            if profile.currency not in ALLOWED_CURRENCIES:
                print(f"Invalid currency found: {profile.currency} for business {profile.business_id}")
                invalid_count += 1
                
                # Fix by setting to default currency (RWF)
                profile.currency = 'RWF'
                fixed_count += 1
                print(f"Fixed to RWF for business {profile.business_id}")
        
        if invalid_count > 0:
            print(f"\nFound {invalid_count} invalid currency values.")
            print(f"Fixed {fixed_count} records.")
            
            # Commit changes
            try:
                db.session.commit()
                print("Changes committed successfully!")
            except Exception as e:
                print(f"Error committing changes: {e}")
                db.session.rollback()
        else:
            print("All currency values are valid!")

if __name__ == '__main__':
    validate_and_fix_currencies()