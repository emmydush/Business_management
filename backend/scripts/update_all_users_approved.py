"""Update all users to have approved status for deployment."""
from app import create_app, db
from app.models.user import User, UserApprovalStatus

app = create_app()

with app.app_context():
    users = User.query.all()
    updated_count = 0
    
    for user in users:
        if user.approval_status != UserApprovalStatus.APPROVED:
            user.approval_status = UserApprovalStatus.APPROVED
            updated_count += 1
    
    if updated_count > 0:
        db.session.commit()
        print(f'Updated {updated_count} users to approved status')
    else:
        print('All users are already approved')
    
    # Print all users and their status
    print("\nUser approval status:")
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Role: {user.role.value}, Status: {user.approval_status.value}")