"""
Direct test of Emmanuel's password
"""

from app import create_app, db
from app.models.user import User

def test_emmanuel_password():
    app = create_app()
    
    with app.app_context():
        # Find Emmanuel's account
        user = User.query.filter_by(username='emmanuel').first()
        
        if not user:
            print("❌ Emmanuel's account not found!")
            return
        
        print(f"🔍 Testing Emmanuel's password directly...")
        print(f"   Username: {user.username}")
        print(f"   Hash: {user.password_hash}")
        
        # Test the password directly
        test_password = "test123"
        is_valid = user.check_password(test_password)
        
        print(f"\n🔐 Password Test Results:")
        print(f"   Testing password: '{test_password}'")
        print(f"   Result: {'✅ VALID' if is_valid else '❌ INVALID'}")
        
        if is_valid:
            print(f"\n🎉 SUCCESS! Emmanuel can now login with:")
            print(f"   Username: emmanuel")
            print(f"   Password: {test_password}")
        else:
            print(f"\n❌ Password test failed. Let me debug further...")
            
            # Try manual bcrypt check
            import bcrypt
            try:
                manual_check = bcrypt.check_password_hash(user.password_hash, test_password)
                print(f"   Manual bcrypt check: {'✅ VALID' if manual_check else '❌ INVALID'}")
            except Exception as e:
                print(f"   Manual bcrypt check error: {e}")
            
            # Set password again to be sure
            print(f"\n🔧 Resetting password again...")
            user.set_password(test_password)
            db.session.commit()
            
            # Test again
            is_valid_after_reset = user.check_password(test_password)
            print(f"   After reset: {'✅ VALID' if is_valid_after_reset else '❌ INVALID'}")

if __name__ == "__main__":
    test_emmanuel_password()
