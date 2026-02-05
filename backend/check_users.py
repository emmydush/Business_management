from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    users = User.query.all()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"User: {user.username}, Email: {user.email}, Role: {user.role}, Approved: {user.approval_status}")