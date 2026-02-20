"""
Script to seed subscription plans into the database
All plans now have access to EVERYTHING except superadmin features.
"""

from app import create_app, db
from app.models.subscription import Plan, PlanType

# All features - available to ALL plans (except superadmin)
ALL_FEATURES = [
    # Core Module
    'Dashboard Access',
    'Company Profile',
    'User Management (Unlimited)',
    'Role & Permissions',
    'Multi-Branch Support',
    'Multi-branch',
    
    # Sales Module
    'Sales Orders',
    'Invoices',
    'POS (Single Terminal)',
    'Point of Sale (POS)',
    'Payments Tracking',
    'Returns Management',
    'Debtors Management',
    'Sales Reports',
    
    # Inventory Module
    'Product Management (Unlimited)',
    'Category Management',
    'Stock Movements',
    'Warehouse Management',
    'Low Stock Alerts',
    'Inventory Reports',
    'Barcode Scanning',
    'Inventory Management',
    
    # Finance Module
    'Expense Tracking',
    'Income Management',
    'Accounting',
    'Tax Management',
    'Financial Reports',
    
    # HR Module
    'HR & Payroll',
    'Employee Management (Unlimited)',
    'Attendance Tracking',
    'Leave Management',
    'Payroll Processing',
    'Performance Reviews',
    'Department Management',
    'HR Reports',
    
    # Purchases Module
    'Purchase Orders',
    'Goods Received',
    'Supplier Bills',
    'Supplier Management',
    'Purchase Reports',
    
    # Operations Module
    'Document Management',
    'Asset Management',
    'Approval Workflows',
    'Task Management',
    'Workflows',
    
    # CRM & Marketing Module
    'Lead Management',
    'Customer CRM',
    'Advanced Reporting',
    'Custom Reports Builder',
    'Data Export',
    
    # Projects Module
    'Project Management',
    
    # Manufacturing Module
    'Manufacturing Management',
    'Production Planning',
    'Bill of Materials',
    
    # Services Module
    'Service Management',
    'Service Scheduling',
    'Service Tracking',
    
    # Platform Features
    'Audit Logs',
    'API Access',
    'Automated Backups',
    'White-label Options',
    
    # Support Features
    'Email Support',
    'Priority Email Support',
    '24/7 Phone Support',
    'Dedicated Account Manager',
    'Training & Onboarding',
    'SLA Guarantee',
]

def seed_plans():
    app = create_app()
    
    with app.app_context():
        # Clear existing plans and create new ones
        Plan.query.delete()
        
        plans_data = [
            {
                'name': 'Free Plan',
                'plan_type': PlanType.FREE,
                'price': 0.00,
                'billing_cycle': 'monthly',
                'max_users': 999999,
                'max_products': 999999,
                'max_orders': 999999,
                'max_branches': 999999,
                'features': ALL_FEATURES
            },
            {
                'name': 'Starter Plan',
                'plan_type': PlanType.BASIC,
                'price': 29.99,
                'billing_cycle': 'monthly',
                'max_users': 999999,
                'max_products': 999999,
                'max_orders': 999999,
                'max_branches': 999999,
                'features': ALL_FEATURES
            },
            {
                'name': 'Professional Plan',
                'plan_type': PlanType.PROFESSIONAL,
                'price': 79.99,
                'billing_cycle': 'monthly',
                'max_users': 999999,
                'max_products': 999999,
                'max_orders': 999999,
                'max_branches': 999999,
                'features': ALL_FEATURES
            },
            {
                'name': 'Enterprise Plan',
                'plan_type': PlanType.ENTERPRISE,
                'price': 199.99,
                'billing_cycle': 'monthly',
                'max_users': 999999,
                'max_products': 999999,
                'max_orders': 999999,
                'max_branches': 999999,
                'features': ALL_FEATURES
            }
        ]
        
        for plan_data in plans_data:
            plan = Plan(**plan_data)
            db.session.add(plan)
            print(f"Created plan: {plan.name} with {len(plan_data['features'])} features")
        
        db.session.commit()
        print("Successfully seeded professional subscription plans!")

if __name__ == "__main__":
    seed_plans()
