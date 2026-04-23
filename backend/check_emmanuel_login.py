"""
Check Emmanuel's login status and credentials
"""

from app import create_app, db
from app.models.user import User
from werkzeug.security import check_password_hash
import bcrypt

def check_emmanuel_account():
    app = create_app()
    
    with app.app_context():
        # Find Emmanuel's account
        user = User.query.filter_by(username='emmanuel').first()
        
        if not user:
            print("❌ Emmanuel's account not found!")
            return
        
        print(f"📋 Emmanuel's Account Details:")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Active: {user.is_active}")
        print(f"   Business ID: {user.business_id}")
        print(f"   Created: {user.created_at}")
        
        # Check password hash
        print(f"\n🔐 Password Hash Details:")
        print(f"   Hash: {user.password_hash[:50]}...")
        print(f"   Hash type: {'bcrypt' if user.password_hash.startswith('$2b$') else 'scrypt' if user.password_hash.startswith('scrypt:') else 'unknown'}")
        
        # Test common passwords we set for debugging
        test_passwords = ['test123', 'password', 'emmanuel', 'admin']
        
        print(f"\n🔍 Testing Passwords:")
        for password in test_passwords:
            if user.password_hash.startswith("scrypt:"):
                from werkzeug.security import check_password_hash
                is_valid = check_password_hash(user.password_hash, password)
            else:
                try:
                    is_valid = bcrypt.check_password_hash(user.password_hash, password)
                except:
                    is_valid = False
            
            status = "✅" if is_valid else "❌"
            print(f"   {status} '{password}': {'Valid' if is_valid else 'Invalid'}")
        
        # Check account status issues
        print(f"\n⚠️  Account Status Check:")
        
        # Check if account is locked
        if hasattr(user, 'locked_until') and user.locked_until:
            from datetime import datetime
            if user.locked_until > datetime.utcnow():
                print(f"   ❌ Account is locked until: {user.locked_until}")
            else:
                print(f"   ✅ Account is not locked")
        
        # Check failed login attempts
        if hasattr(user, 'failed_login_attempts'):
            print(f"   Failed login attempts: {user.failed_login_attempts}")
        
        # Check business status
        if user.business_id:
            from app.models.business import Business
            business = Business.query.get(user.business_id)
            if business:
                print(f"   Business: {business.name}")
                print(f"   Business Active: {business.is_active}")
            else:
                print(f"   ❌ Business not found!")
        
        print(f"\n💡 Login Credentials:")
        print(f"   Username: emmanuel")
        print(f"   Try these passwords: {', '.join(test_passwords)}")

if __name__ == "__main__":
    check_emmanuel_account()
