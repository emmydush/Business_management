from app import create_app, db
from app.models.user import User
import sys


def main():
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username='superadmin').first()
        if not user:
            print('Superadmin user not found')
            sys.exit(1)

        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()
        print('Superadmin account unlocked: failed_login_attempts reset and locked_until cleared')


if __name__ == '__main__':
    main()
