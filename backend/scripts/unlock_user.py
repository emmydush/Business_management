from app import create_app, db
from app.models.user import User
import sys


def main():
    if len(sys.argv) < 2:
        print('Usage: python unlock_user.py <username>')
        sys.exit(1)

    username = sys.argv[1]

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f'User {username} not found')
            sys.exit(1)

        try:
            user.failed_login_attempts = 0
            user.locked_until = None
        except Exception:
            pass

        db.session.commit()
        print(f'User {username} unlocked: failed_login_attempts reset and locked_until cleared')


if __name__ == '__main__':
    main()
