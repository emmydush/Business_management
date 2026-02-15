from app import create_app, db
from app.models.user import User, UserApprovalStatus, UserRole


def main():
    app = create_app()
    with app.app_context():
        username = "emmanuel"
        new_password = "Admin@1234"

        user = User.query.filter_by(username=username).first()
        if not user:
            print(f'User "{username}" not found.')
            return

        user.set_password(new_password)
        user.is_active = True
        user.approval_status = UserApprovalStatus.APPROVED
        if user.role != UserRole.admin:
            user.role = UserRole.admin

        db.session.commit()
        print("Password reset successful.")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"New password: {new_password}")


if __name__ == "__main__":
    main()
