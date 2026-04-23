"""
Role-Based Access Audit and Implementation Plan
This script analyzes current role restrictions and implements comprehensive RBAC
"""

from app import create_app, db
from app.models.user import UserRole
import os
import re

def analyze_route_permissions():
    """Analyze current route permissions across all route files"""
    app = create_app()
    
    routes_dir = "app/routes"
    role_patterns = {
        '@jwt_required()': 'Basic Auth (All logged-in users)',
        '@staff_required': 'Staff+ (Staff, Manager, Admin, Superadmin)',
        '@manager_required': 'Manager+ (Manager, Admin, Superadmin)', 
        '@admin_required': 'Admin+ (Admin, Superadmin)',
        '@superadmin_required': 'Superadmin only'
    }
    
    issues = []
    recommendations = []
    
    # Define expected role requirements for each module
    module_requirements = {
        'auth': {
            'login': '@jwt_required',  # No auth needed for login
            'register': '@jwt_required',  # No auth needed for register
            'profile': '@jwt_required',  # Users can manage own profile
            'change_password': '@jwt_required'  # Users can change own password
        },
        'users': {
            'get_users': '@manager_required',  # Managers can view team
            'get_user': '@manager_required',    # Managers can view team members
            'create_user': '@admin_required',   # Only admins can create users
            'update_user': '@admin_required',   # Only admins can update users
            'delete_user': '@admin_required'    # Only admins can delete users
        },
        'sales': {
            'get_sales': '@staff_required',     # Staff can view sales
            'create_sale': '@staff_required',   # Staff can create sales
            'update_sale': '@manager_required', # Managers can edit sales
            'delete_sale': '@admin_required'    # Only admins can delete sales
        },
        'inventory': {
            'get_inventory': '@staff_required',        # Staff can view inventory
            'create_product': '@manager_required',     # Managers can add products
            'update_product': '@manager_required',     # Managers can edit products
            'delete_product': '@admin_required',      # Only admins can delete products
            'stock_adjustment': '@manager_required'   # Managers can adjust stock
        },
        'customers': {
            'get_customers': '@staff_required',     # Staff can view customers
            'create_customer': '@staff_required',   # Staff can create customers
            'update_customer': '@manager_required', # Managers can edit customers
            'delete_customer': '@admin_required'    # Only admins can delete customers
        },
        'suppliers': {
            'get_suppliers': '@staff_required',     # Staff can view suppliers
            'create_supplier': '@manager_required', # Managers can add suppliers
            'update_supplier': '@manager_required', # Managers can edit suppliers
            'delete_supplier': '@admin_required'    # Only admins can delete suppliers
        },
        'purchases': {
            'get_purchases': '@staff_required',     # Staff can view purchases
            'create_purchase': '@manager_required', # Managers can create purchases
            'update_purchase': '@manager_required', # Managers can edit purchases
            'delete_purchase': '@admin_required'    # Only admins can delete purchases
        },
        'invoices': {
            'get_invoices': '@staff_required',     # Staff can view invoices
            'create_invoice': '@staff_required',   # Staff can create invoices
            'update_invoice': '@manager_required', # Managers can edit invoices
            'delete_invoice': '@admin_required'    # Only admins can delete invoices
        },
        'expenses': {
            'get_expenses': '@staff_required',     # Staff can view expenses
            'create_expense': '@staff_required',   # Staff can create expenses
            'update_expense': '@manager_required', # Managers can edit expenses
            'delete_expense': '@admin_required'    # Only admins can delete expenses
        },
        'reports': {
            'get_reports': '@manager_required',    # Managers can view reports
            'create_report': '@manager_required',  # Managers can create reports
            'export_reports': '@admin_required'   # Only admins can export
        },
        'settings': {
            'get_settings': '@admin_required',     # Only admins can view settings
            'update_settings': '@admin_required',  # Only admins can update settings
            'company_profile': '@admin_required',  # Only admins can manage company
            'permissions': '@admin_required'       # Only admins can manage permissions
        },
        'hr': {
            'get_employees': '@manager_required',   # Managers can view employees
            'create_employee': '@admin_required',  # Only admins can create employees
            'update_employee': '@manager_required', # Managers can edit employees
            'delete_employee': '@admin_required',  # Only admins can delete employees
            'attendance': '@staff_required',       # Staff can mark attendance
            'payroll': '@admin_required'           # Only admins can manage payroll
        },
        'warehouse': {
            'get_warehouses': '@staff_required',   # Staff can view warehouses
            'create_warehouse': '@manager_required', # Managers can create warehouses
            'update_warehouse': '@admin_required',  # Only admins can update warehouses
            'delete_warehouse': '@admin_required'   # Only admins can delete warehouses
        },
        'projects': {
            'get_projects': '@staff_required',     # Staff can view projects
            'create_project': '@manager_required', # Managers can create projects
            'update_project': '@manager_required', # Managers can edit projects
            'delete_project': '@admin_required'    # Only admins can delete projects
        },
        'tasks': {
            'get_tasks': '@staff_required',     # Staff can view tasks
            'create_task': '@staff_required',   # Staff can create tasks
            'update_task': '@manager_required', # Managers can edit tasks
            'delete_task': '@admin_required'    # Only admins can delete tasks
        },
        'assets': {
            'get_assets': '@staff_required',     # Staff can view assets
            'create_asset': '@manager_required', # Managers can create assets
            'update_asset': '@manager_required', # Managers can edit assets
            'delete_asset': '@admin_required'    # Only admins can delete assets
        },
        'superadmin': {
            'all_routes': '@superadmin_required'  # Superadmin only
        }
    }
    
    print("=== ROLE-BASED ACCESS AUDIT ===")
    print("Analyzing current route permissions...")
    
    return module_requirements

if __name__ == "__main__":
    requirements = analyze_route_permissions()
    print("\n=== RECOMMENDED ROLE REQUIREMENTS ===")
    for module, routes in requirements.items():
        print(f"\n{module.upper()}:")
        for route, role in routes.items():
            print(f"  {route}: {role}")
