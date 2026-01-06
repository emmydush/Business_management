from app import create_app
from app import db
from app.models.user import User, UserRole

def create_admin_user():
    app = create_app()
    
    with app.app_context():
        # Check if admin user already exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                username='admin',
                email='admin@tradeflow.com',
                first_name='Admin',
                last_name='User',
                phone='+1234567890',
                role=UserRole.ADMIN,
                profile_picture='https://via.placeholder.com/80'
            )
            admin_user.set_password('password123')
            db.session.add(admin_user)
            db.session.commit()
            print('Admin user created successfully!')
            print(f'Username: admin')
            print(f'Password: password123')
        else:
            print('Admin user already exists')

if __name__ == '__main__':
    create_admin_user()