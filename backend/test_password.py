from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Test password checking for a user
    user = User.query.filter_by(username='emmanuel').first()
    if user:
        print('Testing password for user:', user.username)
        # Test with a common password
        test_passwords = ['password', '123456', 'admin', 'test']
        for test_pwd in test_passwords:
            result = user.check_password(test_pwd)
            print(f'Password "{test_pwd}": {result}')
        
        # Test if user can check their own hash format
        print('Hash format:', user.password_hash[:30] if user.password_hash else 'None')
    else:
        print('User not found')
