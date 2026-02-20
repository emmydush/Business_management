import os
import sys
from dotenv import load_dotenv

# Ensure backend package is importable
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, '.env'))

from app import create_app, db
from app.models.user import User
from app.utils.subscription_validator import SubscriptionValidator
from app.models.subscription import SubscriptionStatus


def summarize_user(u):
    return {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'first_name': getattr(u, 'first_name', None),
        'last_name': getattr(u, 'last_name', None),
        'phone': getattr(u, 'phone', None),
        'business_id': u.business_id,
        'role': getattr(u.role, 'value', str(u.role)),
        'is_active': u.is_active
    }


def main():
    app = create_app()
    with app.app_context():
        name = 'adnan'
        # search by username/email/first_name
        users = User.query.filter(
            db.or_(
                db.func.lower(User.username) == name.lower(),
                db.func.lower(User.email).like(f"%{name.lower()}%"),
                db.func.lower(User.first_name) == name.lower()
            )
        ).all()

        if not users:
            print('No user named adnan found')
            return

        for u in users:
            info = summarize_user(u)
            print('User:')
            for k, v in info.items():
                print(f'  {k}: {v}')

            if not u.business_id:
                print('  No business associated with this user.')
                continue

            limits = SubscriptionValidator.get_business_limits(u.business_id)
            print('\nBusiness subscription limits:')
            print(f"  plan_name: {limits.get('plan_name')}")
            print(f"  plan_type: {limits.get('plan_type')}")
            print(f"  features: {limits.get('features')[:10]}{'...' if len(limits.get('features', []))>10 else ''}")

            active_sub = SubscriptionValidator.get_active_subscription(u.business_id)
            if active_sub:
                print('\nActive subscription:')
                print(f"  id: {active_sub.id}")
                print(f"  plan_id: {active_sub.plan_id}")
                print(f"  status: {active_sub.status.value}")
                print(f"  start_date: {active_sub.start_date}")
                print(f"  end_date: {active_sub.end_date}")
            else:
                print('\nNo active subscription found for this business')

            # Check access to HR & Payroll
            has_hr = SubscriptionValidator.check_feature_access(u.business_id, 'HR & Payroll')
            has_payroll = SubscriptionValidator.check_feature_access(u.business_id, 'Payroll Processing')
            print(f"\nFeature access checks:")
            print(f"  HR & Payroll: {has_hr}")
            print(f"  Payroll Processing: {has_payroll}")

            print('\n' + '='*40 + '\n')

if __name__ == '__main__':
    main()
