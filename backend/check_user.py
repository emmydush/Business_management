from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    user = User.query.get(7)
    if user:
        print(f'User details (ID: {user.id}):')
        print(f'  Username: "{user.username}" (length: {len(user.username)})')
        print(f'  Username repr: {repr(user.username)}')
        print(f'  Role: {user.role.value}')
        print(f'  Status: Active={user.is_active}, Approved={user.approval_status.value}')
        print(f'  Business ID: {user.business_id}')
        print(f'  Email: {user.email}')
        print(f'  First name: {user.first_name}')
        print(f'  Last name: {user.last_name}')
        print(f'  Phone: {user.phone}')
    else:
        print('User with ID 7 not found')