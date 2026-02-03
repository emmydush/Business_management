"""
Diagnostic script to check branch creation access for professional plan users
"""
from app import create_app, db
from app.models.user import User
from app.models.business import Business
from app.models.subscription import Subscription, Plan, SubscriptionStatus
from app.utils.subscription_validator import SubscriptionValidator

def diagnose_branch_access():
    app = create_app()
    
    with app.app_context():
        print("=== Branch Creation Access Diagnostic ===\n")
        
        # Get all users with professional plans
        professional_plans = Plan.query.filter_by(plan_type='professional').all()
        professional_plan_ids = [plan.id for plan in professional_plans]
        
        if not professional_plan_ids:
            print("❌ No professional plans found in database")
            return
            
        print(f"Found {len(professional_plans)} professional plan(s)")
        for plan in professional_plans:
            print(f"  - {plan.name} (ID: {plan.id})")
            print(f"    Features: {plan.features}")
            print(f"    Max branches: {plan.max_branches}")
            print()
        
        # Find businesses with professional subscriptions
        professional_subscriptions = Subscription.query.filter(
            Subscription.plan_id.in_(professional_plan_ids),
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
            Subscription.is_active == True
        ).all()
        
        print(f"Found {len(professional_subscriptions)} active professional subscriptions\n")
        
        for subscription in professional_subscriptions:
            business = Business.query.get(subscription.business_id)
            if not business:
                print(f"❌ Business {subscription.business_id} not found")
                continue
                
            print(f"Business: {business.name} (ID: {business.id})")
            print(f"Subscription: {subscription.plan.name}")
            print(f"Status: {subscription.status.value}")
            print(f"End date: {subscription.end_date}")
            
            # Check feature access
            has_multi_branch = SubscriptionValidator.check_feature_access(business.id, 'Multi-branch')
            print(f"Multi-branch feature access: {'✅ Yes' if has_multi_branch else '❌ No'}")
            
            # Check branch limits
            current_branches = SubscriptionValidator.get_current_counts(business.id)['branches']
            limits = SubscriptionValidator.get_business_limits(business.id)
            print(f"Current branches: {current_branches}")
            print(f"Branch limit: {limits['max_branches']}")
            print(f"Can create more branches: {'✅ Yes' if current_branches < limits['max_branches'] else '❌ No'}")
            
            # Check users in this business
            users = User.query.filter_by(business_id=business.id, is_active=True).all()
            print(f"Active users: {len(users)}")
            
            for user in users:
                print(f"  - {user.username} ({user.role.value})")
                if user.role.value in ['admin', 'superadmin']:
                    print(f"    ✅ Has admin privileges for branch creation")
                else:
                    print(f"    ❌ No admin privileges")
            
            print("-" * 50)

def check_specific_user(username):
    """Check access for a specific user"""
    app = create_app()
    
    with app.app_context():
        print(f"\n=== Checking access for user: {username} ===\n")
        
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"❌ User '{username}' not found")
            return
            
        print(f"User: {user.username}")
        print(f"Role: {user.role.value}")
        print(f"Business ID: {user.business_id}")
        print(f"Active: {user.is_active}")
        
        if not user.business_id:
            print("❌ User not associated with any business")
            return
            
        business = Business.query.get(user.business_id)
        if not business:
            print("❌ Business not found")
            return
            
        print(f"Business: {business.name}")
        
        # Check subscription
        subscription = SubscriptionValidator.get_active_subscription(business.id)
        if not subscription:
            print("❌ No active subscription found")
            pending = SubscriptionValidator.get_pending_subscription(business.id)
            if pending:
                print(f"📝 Pending subscription: {pending.plan.name}")
            return
            
        print(f"Active subscription: {subscription.plan.name}")
        print(f"Status: {subscription.status.value}")
        
        # Check branch access
        has_multi_branch = SubscriptionValidator.check_feature_access(business.id, 'Multi-branch')
        print(f"Multi-branch feature: {'✅ Available' if has_multi_branch else '❌ Not available'}")
        
        current_branches = SubscriptionValidator.get_current_counts(business.id)['branches']
        limits = SubscriptionValidator.get_business_limits(business.id)
        print(f"Branch usage: {current_branches}/{limits['max_branches']}")
        
        # Check if user can create branches
        can_create = (user.role.value in ['admin', 'superadmin'] and 
                     has_multi_branch and 
                     current_branches < limits['max_branches'])
        print(f"Can create branches: {'✅ Yes' if can_create else '❌ No'}")
        
        if not can_create:
            if user.role.value not in ['admin', 'superadmin']:
                print("  Reason: User doesn't have admin privileges")
            if not has_multi_branch:
                print("  Reason: Multi-branch feature not available in plan")
            if current_branches >= limits['max_branches']:
                print("  Reason: Branch limit reached")

if __name__ == '__main__':
    # Check all professional plan users
    diagnose_branch_access()
    
    # Check specific user (replace 'your_username' with actual username)
    # check_specific_user('your_username')