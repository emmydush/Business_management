from app import create_app
from app.models.user import User


def main():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found in database.")
            return

        for u in users:
            print(u.to_dict(include_sensitive=False))


if __name__ == "__main__":
    main()
