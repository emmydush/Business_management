"""
Script to seed subscription plans into the database
"""

from app import create_app, db
from app.models.subscription import Plan, PlanType

def seed_plans():
    app = create_app()
    
    with app.app_context():
        # Check if plans already exist
        existing_plans = Plan.query.count()
        if existing_plans > 0:
            print("Plans already exist in database. Skipping seeding.")
            return
        
        plans_data = [
            {
                'name': 'Free Plan',
                'plan_type': PlanType.FREE,
                'price': 0.00,
                'billing_cycle': 'monthly',
                'max_users': 1,
                'max_products': 50,
                'max_orders': 50,
                'max_branches': 1,
                'features': [
                    'Basic Dashboard',
                    'Limited Products (50)',
                    'Limited Orders (50)',
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
                'max_orders': 500,
                'max_branches': 2,
                'features': [
                    'Standard Dashboard',
                    'Products Management',
                    'Order Processing',
                    '2 Branches',
                    'Basic Reporting',
                    'Email Support'
                ]
            },
            {
                'name': 'Professional Plan',
                'plan_type': PlanType.PROFESSIONAL,
                'price': 79.99,
                'billing_cycle': 'monthly',
                'max_users': 999999,  # Unlimited for professional plan
                'max_products': 999999,  # Unlimited for professional plan
                'max_orders': 999999,  # Unlimited for professional plan
                'max_branches': 999999,  # Unlimited for professional plan
                'features': [
                    'Premium Dashboard',
                    'Unlimited Products',
                    'Unlimited Orders',
                    'Unlimited Branches',
                    'Advanced Reporting',
                    'Priority Email Support',
                    'Inventory Management',
                    'CRM Features',
                    'HR & Payroll',
                    'Purchase Orders',
                    'Returns Management',
                    'Multi-currency Support',
                    'Multi-branch',
                    'Asset Management',
                    'Custom Integrations',
                    'API Access',
                    'Dedicated Support',
                    'Advanced Analytics'
                ]
            },
            {
                'name': 'Enterprise Plan',
                'plan_type': PlanType.ENTERPRISE,
                'price': 199.99,
                'billing_cycle': 'monthly',
                'max_users': 999999,  # Unlimited
                'max_products': 999999,  # Unlimited
                'max_orders': 999999,  # Unlimited
                'max_branches': 999999,  # Unlimited
                'features': [
                    'Premium Dashboard',
                    'Unlimited Products',
                    'Unlimited Orders',
                    'Unlimited Branches',
                    'Advanced Reporting',
                    '24/7 Phone & Email Support',
                    'Dedicated Account Manager',
                    'Custom Integrations',
                    'API Access',
                    'Advanced Analytics',
                    'White-label Options',
                    'Training & Onboarding',
                    'SLA Guarantee',
                    'Multi-branch',
                    'HR & Payroll',
                    'Inventory Management',
                    'Asset Management'
                ]
            }
        ]
        
        for plan_data in plans_data:
            plan = Plan(**plan_data)
            db.session.add(plan)
            print(f"Created plan: {plan.name}")
        
        db.session.commit()
        print("Successfully seeded subscription plans!")

if __name__ == "__main__":
    seed_plans()