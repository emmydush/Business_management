from app import create_app, db
from app.models.customer import Customer

app = create_app()
with app.app_context():
    print("Columns in customers table:")
    for column in Customer.__table__.columns:
        print(f"- {column.name}")
