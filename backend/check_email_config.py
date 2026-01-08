from app import create_app
from app.models.settings import SystemSetting

def check_email_config():
    app = create_app()
    
    with app.app_context():
        print("Checking email configuration in database...\n")
        
        # Query all email-related settings
        email_settings = SystemSetting.query.filter(
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        if email_settings:
            print(f"Found {len(email_settings)} email configuration entries:\n")
            
            for setting in email_settings:
                print(f"Setting Key: {setting.setting_key}")
                print(f"Setting Value: {setting.setting_value}")
                print(f"Business ID: {setting.business_id}")
                print("-" * 40)
        else:
            print("No email configuration found in the database.")
            
        # Check specifically for business_id 1 (which we used in our test)
        print(f"\nChecking specifically for business_id = 1:")
        business_specific_settings = SystemSetting.query.filter(
            SystemSetting.business_id == 1,
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        if business_specific_settings:
            print(f"Found {len(business_specific_settings)} business-specific email settings:")
            for setting in business_specific_settings:
                print(f"  - {setting.setting_key}: {setting.setting_value}")
        else:
            print("No business-specific email settings found for business_id = 1")
            
        # Check for global settings (business_id is NULL)
        print(f"\nChecking for global email settings (business_id = NULL):")
        global_settings = SystemSetting.query.filter(
            SystemSetting.business_id.is_(None),
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        if global_settings:
            print(f"Found {len(global_settings)} global email settings:")
            for setting in global_settings:
                print(f"  - {setting.setting_key}: {setting.setting_value}")
        else:
            print("No global email settings found")

if __name__ == "__main__":
    check_email_config()