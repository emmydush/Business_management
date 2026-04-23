"""
Fix Emmanuel's login issues: unlock account and set known password
"""

from app import create_app, db
from app.models.user import User
from datetime import datetime

def fix_emmanuel_login():
    app = create_app()
    
    with app.app_context():
        # Find Emmanuel's account
        user = User.query.filter_by(username='emmanuel').first()
        
        if not user:
            print("❌ Emmanuel's account not found!")
            return
        
        print("🔧 Fixing Emmanuel's login issues...")
        
        # Unlock the account
        if hasattr(user, 'locked_until'):
            user.locked_until = None
            print("✅ Account unlocked")
        
        # Reset failed login attempts
        if hasattr(user, 'failed_login_attempts'):
            user.failed_login_attempts = 0
            print("✅ Failed login attempts reset")
        
        # Set a known password
        new_password = "test123"
        user.set_password(new_password)
        print(f"✅ Password set to: {new_password}")
        
        # Ensure account is active
        user.is_active = True
        print("✅ Account marked as active")
        
        # Save changes
        db.session.commit()
        print("✅ Changes saved to database")
        
        print(f"\n🎉 Emmanuel's login has been fixed!")
        print(f"   Username: {user.username}")
        print(f"   Password: {new_password}")
        print(f"   Role: {user.role}")
        print(f"   Status: Active")
        
        # Verify the password works
        print(f"\n🔍 Verifying new password...")
        if user.check_password(new_password):
            print("✅ Password verification successful")
        else:
            print("❌ Password verification failed")

if __name__ == "__main__":
    fix_emmanuel_login()
