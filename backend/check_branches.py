from app import create_app, db
from app.models.branch import Branch

app = create_app()
with app.app_context():
    branches = Branch.query.all()
    for b in branches:
        print(f"ID: {b.id}, Name: {b.name}")
