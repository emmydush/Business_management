from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    user = User.query.filter_by(username='kubwimana').first()
    if user:
        print(f'Verification: User found with clean username: "{user.username}"')
        print(f'User ID: {user.id}')
        print(f'User is active: {user.is_active}')
        print(f'User approval status: {user.approval_status.value}')
        print('Login should now work correctly!')
    else:
        print('User not found after fix')