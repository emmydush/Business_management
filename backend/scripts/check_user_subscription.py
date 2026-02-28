import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add the backend directory to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, '.env'))

from app import create_app, db
from app.models.user import User
from app.models.business import Business
from app.models.subscription import Subscription, SubscriptionStatus, Plan
from app.utils.middleware import check_subscription_status


def main():
    app = create_app()
    with app.app_context():
        # Get all users to find your account
        users = User.query.all()
        print(f"Found {len(users)} users in the system:")
        
        for user in users:
            print(f"\nUser: {user.username} (ID: {user.id})")
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Business ID: {user.business_id}")
            
            if user.business_id:
                business = Business.query.get(user.business_id)
                if business:
                    print(f"  Business: {business.name} (ID: {business.id})")
                    print(f"  Business Active: {business.is_active}")
                    
                    # Check subscription status using the same function the API uses
                    has_subscription, subscription = check_subscription_status(user.business_id)
                    print(f"  Has Active Subscription: {has_subscription}")
                    
                    if subscription:
                        print(f"  Subscription ID: {subscription.id}")
                        print(f"  Subscription Status: {subscription.status}")
                        print(f"  Subscription Active: {subscription.is_active}")
                        print(f"  Start Date: {subscription.start_date}")
                        print(f"  End Date: {subscription.end_date}")
                        print(f"  Current Time: {datetime.utcnow()}")
                        print(f"  End Date >= Now: {subscription.end_date >= datetime.utcnow()}")
                        
                        if subscription.plan:
                            print(f"  Plan: {subscription.plan.name} ({subscription.plan.plan_type})")
                            print(f"  Plan Features: {subscription.plan.features[:5] if subscription.plan.features else []}")
                    else:
                        print("  No active subscription found")
                        
                        # Show all subscriptions for this business
                        all_subs = Subscription.query.filter_by(business_id=user.business_id).all()
                        if all_subs:
                            print(f"  All subscriptions for this business:")
                            for sub in all_subs:
                                print(f"    ID: {sub.id}, Status: {sub.status}, Active: {sub.is_active}")
                                print(f"    Start: {sub.start_date}, End: {sub.end_date}")
                                print(f"    Plan ID: {sub.plan_id}")
                                if sub.plan:
                                    print(f"    Plan: {sub.plan.name} ({sub.plan.plan_type})")
                        else:
                            print("  No subscriptions found for this business")
                            
                        # Check if there are any plans available
                        plans = Plan.query.all()
                        print(f"  Available plans:")
                        for plan in plans:
                            print(f"    {plan.id}: {plan.name} ({plan.plan_type})")
                else:
                    print(f"  Business ID {user.business_id} not found in database")
            else:
                print("  No business associated with this user")


if __name__ == '__main__':
    main()