from app import create_app, db
from app.models.user import User
from datetime import datetime
import sys


def main():
    if len(sys.argv) < 3:
        print('Usage: python reset_user_password.py <username> <new_password>')
        sys.exit(1)

    username = sys.argv[1]
    new_password = sys.argv[2]

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f'User {username} not found')
            sys.exit(1)

        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        try:
            user.failed_login_attempts = 0
            user.locked_until = None
        except Exception:
            pass

        db.session.commit()
        print(f'Password for user {username} has been reset')


if __name__ == '__main__':
    main()
