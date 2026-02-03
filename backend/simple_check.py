# Simple diagnostic script
from app import create_app, db
from app.models.subscription import Plan, Subscription
from app.models.user import User
from app.models.business import Business

app = create_app()

with app.app_context():
    print("=== Database Diagnostic ===")
    
    # Check plans
    plans = Plan.query.all()
    print(f"Total plans: {len(plans)}")
    for plan in plans:
        print(f"- {plan.name} ({plan.plan_type.value}): {plan.max_branches} branches")
        if plan.features:
            print(f"  Features: {', '.join(plan.features)}")
    
    print("\n=== Subscriptions ===")
    subscriptions = Subscription.query.all()
    print(f"Total subscriptions: {len(subscriptions)}")
    for sub in subscriptions:
        print(f"- Business {sub.business_id}: {sub.plan.name} ({sub.status.value})")
    
    print("\n=== Users ===")
    users = User.query.all()
    print(f"Total users: {len(users)}")
    for user in users:
        if user.business_id:
            print(f"- {user.username} ({user.role.value}) - Business: {user.business_id}")