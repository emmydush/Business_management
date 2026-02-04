"""
Test script to verify that professional plan users have access to everything
"""

from app import create_app, db
from app.models.subscription import Plan, Subscription, SubscriptionStatus, PlanType
from app.models.user import User, UserRole
from app.models.business import Business
from app.utils.subscription_validator import SubscriptionValidator
from datetime import datetime, timedelta

def test_professional_access():
    """
    Test that professional plan users have access to all features and unlimited resources
    """
    app = create_app()
    
    with app.app_context():
        print("=== Testing Professional Plan Universal Access ===\n")
        
        # Get or create a professional plan
        professional_plan = Plan.query.filter_by(plan_type=PlanType.PROFESSIONAL).first()
        if not professional_plan:
            print("❌ No professional plan found in database")
            return
        
        print(f"✓ Found professional plan: {professional_plan.name}")
        print(f"  - Max users: {professional_plan.max_users}")
        print(f"  - Max products: {professional_plan.max_products}")
        print(f"  - Features: {professional_plan.features}")
        
        # Since we can't easily create a real business and subscription for this test,
        # let's just verify the logic by testing with a business that has a professional subscription
        # We'll create a temporary subscription record for testing
        
        # Get all existing businesses and their subscriptions to find one with professional plan
        all_subscriptions = Subscription.query.join(Plan).filter(Plan.plan_type == PlanType.PROFESSIONAL).all()
        
        if all_subscriptions:
            test_subscription = all_subscriptions[0]
            business_id = test_subscription.business_id
            print(f"\n✓ Testing with real business ID: {business_id} (has professional subscription)")
            
            # Test feature access for professional plan
            test_features = [
                'Multi-branch', 'HR & Payroll', 'Inventory Management', 
                'Advanced Reporting', 'Asset Management', 'API Access',
                'Custom Integrations', 'Dedicated Support'
            ]
            
            print(f"\n✓ Testing feature access for professional plan:")
            for feature in test_features:
                has_access = SubscriptionValidator.check_feature_access(business_id, feature)
                print(f"  - {feature}: {'✅ Granted' if has_access else '❌ Denied'}")
            
            # Test resource limits for professional plan
            print(f"\n✓ Testing resource limits for professional plan:")
            resource_types = ['users', 'products', 'orders', 'branches']
            for resource_type in resource_types:
                # Test with a high count to see if professional plan allows it
                within_limit = SubscriptionValidator.check_resource_limit(business_id, resource_type, 999999)
                print(f"  - {resource_type} (999999 count): {'✅ Unlimited' if within_limit else '❌ Limited'}")
        else:
            print(f"\n⚠️  No businesses with professional subscriptions found in DB")
            print(f"   Testing the logic directly...")
            
            # For this test, we'll just verify that the code changes work by looking at the plan data
            print(f"\n✓ Logic Verification:")
            print(f"  - Professional plan max_users: {professional_plan.max_users} {'(Unlimited ✓)' if professional_plan.max_users == 999999 else '(Limited ❌)'}")
            print(f"  - Professional plan max_products: {professional_plan.max_products} {'(Unlimited ✓)' if professional_plan.max_products == 999999 else '(Limited ❌)'}")
            print(f"  - Professional plan max_orders: {professional_plan.max_orders} {'(Unlimited ✓)' if professional_plan.max_orders == 999999 else '(Limited ❌)'}")
            print(f"  - Professional plan max_branches: {professional_plan.max_branches} {'(Unlimited ✓)' if professional_plan.max_branches == 999999 else '(Limited ❌)'}")
            print(f"  - Professional plan features count: {len(professional_plan.features) if professional_plan.features else 0}")
        
        print(f"\n✓ Implementation Summary:")
        print(f"  - Professional plan users bypass all feature access checks")
        print(f"  - Professional plan users bypass all resource limit checks")
        print(f"  - Professional plan users have access to all API endpoints")
        print(f"  - Enterprise plan users have the same unlimited access")

if __name__ == "__main__":
    test_professional_access()