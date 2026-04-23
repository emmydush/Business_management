from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Check jmv02 user
    jmv02 = User.query.filter_by(username='jmv02').first()
    
    if jmv02:
        print(f"User: {jmv02.first_name} {jmv02.last_name}")
        print(f"Username: {jmv02.username}")
        print(f"Email: {jmv02.email}")
        print(f"Role: {jmv02.role.value}")
        print(f"Active: {jmv02.is_active}")
        print(f"Created: {jmv02.created_at}")
        print(f"Password hash exists: {bool(jmv02.password_hash)}")
        
        if jmv02.password_hash:
            print(f"Password hash: {jmv02.password_hash[:50]}...")
            print(f"Hash type: {'scrypt' if jmv02.password_hash.startswith('scrypt:') else 'bcrypt' if jmv02.password_hash.startswith('$2') else 'unknown'}")
        else:
            print("NO PASSWORD HASH - User cannot login!")
            
        # Test if user can login with common passwords
        test_passwords = ['password', '123456', 'test', 'jmv02', 'password123']
        print("\nTesting common passwords:")
        for pwd in test_passwords:
            try:
                result = jmv02.check_password(pwd)
                print(f"Password '{pwd}': {result}")
            except Exception as e:
                print(f"Password '{pwd}': ERROR - {e}")
    else:
        print("User jmv02 not found!")
