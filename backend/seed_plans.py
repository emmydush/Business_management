"""
Seed subscription plans
Run this script to populate initial subscription plans
"""
from app import create_app, db
from app.models.subscription import Plan, PlanType

app = create_app()

def seed_plans():
    with app.app_context():
        # Check if plans already exist
        existing_plans = Plan.query.count()
        if existing_plans > 0:
            print(f"Plans already exist ({existing_plans} plans found). Skipping seed.")
            return
        
        plans_data = [
            {
                'name': 'Free Trial',
                'plan_type': PlanType.FREE,
                'price': 0.00,
                'billing_cycle': 'monthly',
                'max_users': 1,
                'max_products': 50,
                'max_orders': 100,
                'max_branches': 1,
                'features': [
                    'Basic Dashboard',
                    'Up to 50 Products',
                    'Up to 100 Orders',
                    'Single Branch',
                    'Basic Reporting'
                ]
            },
            {
                'name': 'Basic Plan',
                'plan_type': PlanType.BASIC,
                'price': 29.99,
                'billing_cycle': 'monthly',
                'max_users': 5,
                'max_products': 500,
                'max_orders': 5000,
                'max_branches': 2,
                'features': [
                    'Advanced Dashboard',
                    'Up to 500 Products',
                    'Up to 5,000 Orders',
                    '2 Branches',
                    'Standard Reporting',
                    'Email Support',
                    'Inventory Management',
                    'Customer Management'
                ]
            },
            {
                'name': 'Professional Plan',
                'plan_type': PlanType.PROFESSIONAL,
                'price': 79.99,
                'billing_cycle': 'monthly',
                'max_users': 20,
                'max_products': 5000,
                'max_orders': 50000,
                'max_branches': 5,
                'features': [
                    'Premium Dashboard',
                    'Unlimited Products',
                    'Unlimited Orders',
                    '5 Branches',
                    'Advanced Reporting',
                    'Priority Email Support',
                    'Full Inventory Management',
                    'CRM Features',
                    'HR & Payroll',
                    'Purchase Orders',
                    'Returns Management',
                    'Multi-currency Support'
                ]
            },
            {
                'name': 'Enterprise Plan',
                'plan_type': PlanType.ENTERPRISE,
                'price': 199.99,
                'billing_cycle': 'monthly',
                'max_users': 100,
                'max_products': 999999,
                'max_orders': 999999,
                'max_branches': 50,
                'features': [
                    'Enterprise Dashboard',
                    'Unlimited Everything',
                    'Unlimited Branches',
                    'Custom Reporting',
                    '24/7 Phone & Email Support',
                    'Dedicated Account Manager',
                    'Custom Integrations',
                    'API Access',
                    'Advanced Analytics',
                    'White-label Options',
                    'Training & Onboarding',
                    'SLA Guarantee'
                ]
            }
        ]
        
        for plan_data in plans_data:
            plan = Plan(**plan_data)
            db.session.add(plan)
            print(f"Created plan: {plan.name}")
        
        db.session.commit()
        print("Successfully seeded subscription plans!")

if __name__ == '__main__':
    seed_plans()
