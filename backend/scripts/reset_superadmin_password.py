from app import create_app, db
from app.models.user import User
from datetime import datetime
import sys


def main():
    if len(sys.argv) < 2:
        print('Usage: python reset_superadmin_password.py <new_password>')
        sys.exit(1)

    new_password = sys.argv[1]

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username='superadmin').first()
        if not user:
            print('Superadmin user not found')
            sys.exit(1)

        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        # Also clear failed attempts and lock just in case
        try:
            user.failed_login_attempts = 0
            user.locked_until = None
        except Exception:
            pass

        db.session.commit()
        print('Superadmin password reset successfully')


if __name__ == '__main__':
    main()
