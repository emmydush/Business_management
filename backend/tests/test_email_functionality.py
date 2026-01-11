from app import create_app
from app.utils.email_service import EmailService
from app.models.settings import SystemSetting
from app import db

def test_email_functionality():
    app = create_app()
    
    with app.app_context():
        # Test getting email config
        print("Testing email configuration retrieval...")
        
        # Let's test with a business_id of 1 (or any existing business)
        # For now, let's just see what happens when we try to get settings
        email_config = EmailService.get_email_config(business_id=1)
        print(f"Email config for business 1: {email_config}")
        
        # Test sending a test email if config exists
        if email_config:
            print("\nTesting email sending...")
            result = EmailService.send_email(
                to_email="test@example.com",
                subject="Test Email from Backend",
                body="This is a test email to verify email functionality.",
                business_id=1
            )
            print(f"Email sending result: {result}")
        else:
            print("\nNo email configuration found for business 1. Need to set up email settings first.")
        
        # Test connection
        print("\nTesting email connection...")
        connection_result = EmailService.test_connection(business_id=1)
        print(f"Connection test result: {connection_result}")

def setup_test_email_settings():
    """Helper function to set up test email settings in the database"""
    app = create_app()
    
    with app.app_context():
        business_id = 1  # Using business_id 1 for testing
        
        # Define test email settings
        test_settings = {
            'email_smtp_host': 'smtp.gmail.com',
            'email_smtp_port': '587',
            'email_smtp_username': 'your_email@gmail.com',
            'email_smtp_password': 'your_app_password',
            'email_sender_email': 'your_email@gmail.com',
            'email_sender_name': 'Business Management System',
            'email_encryption': 'tls',
            'email_enable_ssl': 'false',
            'email_enable_tls': 'true',
            'email_timeout': '30',
            'email_enabled': 'true'
        }
        
        # Add these settings to the database
        for key, value in test_settings.items():
            # Check if setting already exists
            existing_setting = SystemSetting.query.filter_by(
                business_id=business_id,
                setting_key=key
            ).first()
            
            if existing_setting:
                existing_setting.setting_value = value
                print(f"Updated existing setting: {key}")
            else:
                new_setting = SystemSetting(
                    business_id=business_id,
                    setting_key=key,
                    setting_value=value
                )
                db.session.add(new_setting)
                print(f"Added new setting: {key}")
        
        db.session.commit()
        print("Test email settings saved to database.")

if __name__ == "__main__":
    print("Setting up test email settings...")
    setup_test_email_settings()
    
    print("\nTesting email functionality...")
    test_email_functionality()