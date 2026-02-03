from app import create_app, db
from app.models.subscription import Plan

app = create_app()

with app.app_context():
    print("=== Available Plans ===")
    plans = Plan.query.all()
    for plan in plans:
        print(f"Name: {plan.name}")
        print(f"Type: {plan.plan_type.value}")
        print(f"Max branches: {plan.max_branches}")
        print(f"Features: {plan.features}")
        print("-" * 30)