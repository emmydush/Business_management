"""
Script to seed subscription plans into the database
Comprehensive plan structure based on all application features - CORRECTED
"""

from app import create_app, db
from app.models.subscription import Plan, PlanType

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
                'max_users': 1,
                'max_products': 20,
                'max_orders': 50,
                'max_branches': 1,
                'features': [
                    # Core
                    'Dashboard Access',
                    'Company Profile',
                    'User Management (1 user)',
                    
                    # Sales
                    'Sales Orders',
                    'Invoices',
                    
                    # Inventory
                    'Product Management (up to 20)',
                    'Low Stock Alerts',
                    
                    # Basic
                    'Basic Reports'
                ]
            },
            {
                'name': 'Starter Plan',
                'plan_type': PlanType.BASIC,
                'price': 29.99,
                'billing_cycle': 'monthly',
                'max_users': 3,
                'max_products': 200,
                'max_orders': 500,
                'max_branches': 1,
                'features': [
                    # Core - All Free features +
                    'Dashboard Access',
                    'Company Profile',
                    'User Management (up to 3 users)',
                    'Role & Permissions',
                    'Single Branch',
                    
                    # Sales
                    'Sales Orders',
                    'Invoices',
                    'POS (Single Terminal)',
                    'Payments Tracking',
                    'Returns Management',
                    
                    # Inventory
                    'Product Management (up to 200)',
                    'Category Management',
                    'Low Stock Alerts',
                    
                    # Finance
                    'Expense Tracking',
                    'Income Management',
                    
                    # Customers & Suppliers
                    'Customer CRM',
                    'Supplier Management',
                    
                    # Basic Reports
                    'Basic Reports',
                    
                    # Support
                    'Email Support'
                ]
            },
            {
                'name': 'Business Plan',
                'plan_type': PlanType.PROFESSIONAL,
                'price': 79.99,
                'billing_cycle': 'monthly',
                'max_users': 10,
                'max_products': 2000,
                'max_orders': 5000,
                'max_branches': 3,
                'features': [
                    # Core - All Starter +
                    'Dashboard Access',
                    'Company Profile',
                    'User Management (up to 10 users)',
                    'Role & Permissions',
                    'Multi-Branch (up to 3 branches)',
                    
                    # Sales - All
                    'Sales Orders',
                    'Invoices',
                    'Point of Sale (POS)',
                    'Payments Tracking',
                    'Returns Management',
                    'Debtors Management',
                    'Sales Reports',
                    
                    # Inventory - All
                    'Product Management (up to 2000)',
                    'Category Management',
                    'Stock Movements',
                    'Warehouse Management',
                    'Low Stock Alerts',
                    'Inventory Reports',
                    
                    # Finance - All
                    'Expense Tracking',
                    'Income Management',
                    'Accounting',
                    'Tax Management',
                    'Financial Reports',
                    
                    # HR - Basic
                    'Employee Management (up to 50)',
                    'Attendance Tracking',
                    'Leave Management',
                    'Basic HR Reports',
                    
                    # Purchases
                    'Purchase Orders',
                    'Supplier Management',
                    'Supplier Bills',
                    'Purchase Reports',
                    
                    # Operations
                    'Document Management',
                    'Asset Management',
                    'Task Management',
                    
                    # CRM & Advanced
                    'Lead Management',
                    'Customer CRM',
                    'Advanced Reporting',
                    'Data Export',
                    
                    # Support
                    'Priority Email Support'
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
                    # Core - Unlimited
                    'Dashboard Access',
                    'Company Profile',
                    'User Management (Unlimited)',
                    'Role & Permissions',
                    'Multi-Branch (Unlimited)',
                    
                    # Sales - All
                    'Sales Orders',
                    'Invoices',
                    'Point of Sale (POS) - Multiple Terminals',
                    'Payments Tracking',
                    'Returns Management',
                    'Debtors Management',
                    'Sales Reports',
                    
                    # Inventory - All
                    'Product Management (Unlimited)',
                    'Category Management',
                    'Stock Movements',
                    'Warehouse Management',
                    'Low Stock Alerts',
                    'Inventory Reports',
                    'Barcode Scanning',
                    
                    # Finance - All
                    'Expense Tracking',
                    'Income Management',
                    'Accounting',
                    'Tax Management',
                    'Financial Reports',
                    
                    # HR - All
                    'Employee Management (Unlimited)',
                    'Attendance Tracking',
                    'Leave Management',
                    'Performance Reviews',
                    'Department Management',
                    'Payroll Processing',
                    'HR Reports',
                    
                    # Purchases - All
                    'Purchase Orders',
                    'Goods Received',
                    'Supplier Bills',
                    'Supplier Management',
                    'Purchase Reports',
                    
                    # Operations - All
                    'Document Management',
                    'Asset Management',
                    'Approval Workflows',
                    'Task Management',
                    'Project Management',
                    
                    # CRM & Advanced - All
                    'Lead Management',
                    'Customer CRM',
                    'Advanced Reporting',
                    'Custom Reports Builder',
                    'Data Export',
                    
                    # Platform
                    'Audit Logs',
                    'Automated Backups',
                    
                    # Support - All
                    'Priority Email Support',
                    '24/7 Phone Support',
                    'Dedicated Account Manager',
                    'Training & Onboarding',
                    'SLA Guarantee',
                    
                    # Enterprise Only
                    'API Access',
                    'White-label Options'
                ]
            }
        ]
        
        for plan_data in plans_data:
            plan = Plan(**plan_data)
            db.session.add(plan)
            print(f"Created plan: {plan.name} with {len(plan_data['features'])} features")
        
        db.session.commit()
        print("Successfully seeded comprehensive subscription plans!")

if __name__ == "__main__":
    seed_plans()
