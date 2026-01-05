from app import create_app, db
from app.models.user import User, UserRole

app = create_app()
with app.app_context():
    # Try to find 'admin' user
    user = User.query.filter_by(username='admin').first()
    if user:
        user.role = UserRole.superadmin
        db.session.commit()
        print(f"User '{user.username}' promoted to superadmin.")
    else:
        # Create a new superadmin
        superadmin = User(
            username='superadmin',
            email='superadmin@business.com',
            first_name='Super',
            last_name='Admin',
            role=UserRole.superadmin
        )
        superadmin.set_password('superadmin123')
        db.session.add(superadmin)
        db.session.commit()
        print("New superadmin user created: superadmin / superadmin123")
