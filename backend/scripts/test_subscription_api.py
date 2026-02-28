import os
import sys
import requests
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


def test_api_subscription_status():
    """Test the actual API endpoint that the frontend calls"""
    app = create_app()
    with app.app_context():
        # Find a user with active subscription (like 'adnan')
        user = User.query.filter(User.username == 'adnan').first()
        if not user:
            print("User 'adnan' not found")
            return
            
        print(f"Testing subscription status for user: {user.username}")
        print(f"User ID: {user.id}")
        print(f"Business ID: {user.business_id}")
        
        # Test the check_subscription_status function directly
        has_subscription, subscription = check_subscription_status(user.business_id)
        print(f"\nDirect function check:")
        print(f"  Has subscription: {has_subscription}")
        if subscription:
            print(f"  Subscription ID: {subscription.id}")
            print(f"  Status: {subscription.status}")
            print(f"  Active: {subscription.is_active}")
            print(f"  End date: {subscription.end_date}")
            print(f"  Current time: {datetime.utcnow()}")
            print(f"  End date >= now: {subscription.end_date >= datetime.utcnow()}")
        
        # Now let's simulate what the API endpoint does
        print(f"\nAPI endpoint simulation:")
        if user.role.name == 'superadmin':
            response_data = {
                'has_subscription': True,
                'can_write': True,
                'subscription': None,
                'is_superadmin': True
            }
        else:
            if not user.business_id:
                response_data = {
                    'has_subscription': False,
                    'can_write': False,
                    'subscription': None,
                    'error': 'No business association'
                }
            else:
                has_sub, sub = check_subscription_status(user.business_id)
                features = []
                plan_type = None
                plan_name = None
                if sub and sub.plan:
                    features = sub.get_features() if hasattr(sub, 'get_features') else (sub.plan.features or [])
                    if sub.plan.plan_type and hasattr(sub.plan.plan_type, 'value'):
                        plan_type = sub.plan.plan_type.value.lower()
                    plan_name = sub.plan.name
                
                response_data = {
                    'has_subscription': has_sub,
                    'can_write': has_sub,
                    'subscription': sub.to_dict() if sub else None,
                    'is_superadmin': False,
                    'features': features,
                    'plan_type': plan_type,
                    'plan_name': plan_name
                }
        
        print("API Response:")
        for key, value in response_data.items():
            print(f"  {key}: {value}")
        
        # Check if this would trigger the subscription banner
        print(f"\nWould show subscription banner: {not response_data.get('has_subscription', False)}")


if __name__ == '__main__':
    # Import datetime here to avoid circular import issues
    from datetime import datetime
    test_api_subscription_status()