#!/usr/bin/env python
"""
Script to enable email settings in the database
"""

from app import create_app
from app.models.settings import SystemSetting
from app import db

def enable_email_settings():
    """
    Enable email settings in the database
    """
    print("=== Enabling Email Settings ===\n")
    
    app = create_app()
    
    with app.app_context():
        # Update the email_enabled setting to True for business_id = 1
        email_enabled_setting = SystemSetting.query.filter_by(
            business_id=1,
            setting_key='email_enabled'
        ).first()
        
        if email_enabled_setting:
            print(f"Current email_enabled value: {email_enabled_setting.setting_value}")
            email_enabled_setting.setting_value = 'true'
            print(f"Updated email_enabled to: {email_enabled_setting.setting_value}")
        else:
            # Create the setting if it doesn't exist
            email_enabled_setting = SystemSetting(
                business_id=1,
                setting_key='email_enabled',
                setting_value='true'
            )
            db.session.add(email_enabled_setting)
            print("Created email_enabled setting with value: true")
        
        # Commit the changes
        db.session.commit()
        print("\n✓ Email settings updated successfully!")
        
        # Verify the update
        updated_setting = SystemSetting.query.filter_by(
            business_id=1,
            setting_key='email_enabled'
        ).first()
        
        print(f"Verification - email_enabled is now: {updated_setting.setting_value}")
        
        # Show all email settings for business_id = 1
        print("\nAll email settings for business_id = 1:")
        email_settings = SystemSetting.query.filter(
            SystemSetting.business_id == 1,
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        for setting in email_settings:
            print(f"  {setting.setting_key}: {setting.setting_value}")


if __name__ == "__main__":
    enable_email_settings()