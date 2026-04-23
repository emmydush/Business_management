from app import create_app, db
from app.models.user import User
from werkzeug.security import check_password_hash

app = create_app()
with app.app_context():
    # Test the login process manually
    username = 'emmanuel'
    password = 'password123'  # Try a common password
    
    print(f"Testing login for: {username}")
    
    # Find user by username or email (like the login endpoint does)
    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user:
        print("User not found!")
    else:
        print(f"Found user: {user.username}")
        print(f"User is_active: {user.is_active}")
        print(f"Password hash: {user.password_hash[:50]}...")
        
        # Test the password checking
        print("\nTesting password check:")
        try:
            result = user.check_password(password)
            print(f"Password check result: {result}")
        except Exception as e:
            print(f"Password check error: {e}")
        
        # Test different password checking methods
        print("\nTesting different password methods:")
        try:
            # Test bcrypt method
            if user.password_hash.startswith('$2b$'):
                from app import bcrypt
                bcrypt_result = bcrypt.check_password_hash(user.password_hash, password)
                print(f"bcrypt check result: {bcrypt_result}")
            
            # Test werkzeug method  
            if user.password_hash.startswith("scrypt:"):
                werkzeug_result = check_password_hash(user.password_hash, password)
                print(f"werkzeug check result: {werkzeug_result}")
                
        except Exception as e:
            print(f"Alternative method error: {e}")
