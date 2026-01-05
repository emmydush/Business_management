from app import create_app, db
from app.models.user import User, UserApprovalStatus

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='admin').first()
    if not user:
        print('Admin user not found')
    else:
        user.set_password('password123')
        user.approval_status = UserApprovalStatus.APPROVED
        user.is_active = True
        db.session.commit()
        print('Admin password reset and approved')
