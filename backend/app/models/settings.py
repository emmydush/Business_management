from app import db
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import json


# Predefined list of allowed currencies for validation
ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'RWF', 'KES', 'TZS', 'UGX', 'BIF', 'CDF', 'ZAR', 'NGN', 'GHS']

# Advanced Permission System
# ==========================

# Permission types - granular actions
class PermissionType:
    VIEW = 'view'
    CREATE = 'create'
    EDIT = 'edit'
    DELETE = 'delete'
    EXPORT = 'export'
    APPROVE = 'approve'
    ALL = 'all'
    
    @classmethod
    def get_all(cls):
        return [cls.VIEW, cls.CREATE, cls.EDIT, cls.DELETE, cls.EXPORT, cls.APPROVE, cls.ALL]
    
    @classmethod
    def get_labels(cls):
        return {
            cls.VIEW: 'View',
            cls.CREATE: 'Create',
            cls.EDIT: 'Edit',
            cls.DELETE: 'Delete',
            cls.EXPORT: 'Export',
            cls.APPROVE: 'Approve',
            cls.ALL: 'Full Access'
        }


# Module categories for better organization
class ModuleCategory:
    CORE = 'core'
    SALES = 'sales'
    INVENTORY = 'inventory'
    HR = 'hr'
    FINANCE = 'finance'
    OPERATIONS = 'operations'
    REPORTS = 'reports'
    ADMIN = 'admin'
    
    @classmethod
    def get_all(cls):
        return [cls.CORE, cls.SALES, cls.INVENTORY, cls.HR, cls.FINANCE, cls.OPERATIONS, cls.REPORTS, cls.ADMIN]


# Available modules with metadata
class AppModule:
    # Core modules
    DASHBOARD = 'dashboard'
    
    # Sales modules
    SALES = 'sales'
    POS = 'pos'
    INVOICES = 'invoices'
    CUSTOMERS = 'customers'
    
    # Inventory modules
    INVENTORY = 'inventory'
    PRODUCTS = 'products'
    WAREHOUSE = 'warehouse'
    
    # Purchase modules
    PURCHASES = 'purchases'
    SUPPLIERS = 'suppliers'
    
    # HR modules
    HR = 'hr'
    EMPLOYEES = 'employees'
    ATTENDANCE = 'attendance'
    LEAVE = 'leave'
    PAYROLL = 'payroll'
    
    # Finance modules
    EXPENSES = 'expenses'
    PAYMENTS = 'payments'
    TAXES = 'taxes'
    
    # Operations modules
    PROJECTS = 'projects'
    TASKS = 'tasks'
    DOCUMENTS = 'documents'
    ASSETS = 'assets'
    
    # Reports
    REPORTS = 'reports'
    SALES_REPORTS = 'sales_reports'
    INVENTORY_REPORTS = 'inventory_reports'
    FINANCIAL_REPORTS = 'financial_reports'
    
    # Admin/Settings
    SETTINGS = 'settings'
    USERS = 'users'
    ROLES = 'roles'
    WORKFLOWS = 'workflows'
    BRANCHES = 'branches'
    
    # CRM & Service
    LEADS = 'leads'
    SERVICES = 'services'
    RETURNS = 'returns'
    
    @classmethod
    def get_all(cls):
        return [
            # Core
            cls.DASHBOARD,
            # Sales
            cls.SALES, cls.POS, cls.INVOICES, cls.CUSTOMERS,
            # Inventory
            cls.INVENTORY, cls.PRODUCTS, cls.WAREHOUSE,
            # Purchases
            cls.PURCHASES, cls.SUPPLIERS,
            # HR
            cls.HR, cls.EMPLOYEES, cls.ATTENDANCE, cls.LEAVE, cls.PAYROLL,
            # Finance
            cls.EXPENSES, cls.PAYMENTS, cls.TAXES,
            # Operations
            cls.PROJECTS, cls.TASKS, cls.DOCUMENTS, cls.ASSETS,
            # Reports
            cls.REPORTS, cls.SALES_REPORTS, cls.INVENTORY_REPORTS, cls.FINANCIAL_REPORTS,
            # Admin
            cls.SETTINGS, cls.USERS, cls.ROLES, cls.WORKFLOWS, cls.BRANCHES,
            # CRM & Service
            cls.LEADS, cls.SERVICES, cls.RETURNS
        ]
    
    @classmethod
    def get_module_info(cls):
        """Get all modules with their metadata"""
        return {
            # Core
            cls.DASHBOARD: {'label': 'Dashboard', 'category': ModuleCategory.CORE, 'icon': 'grid'},
            
            # Sales
            cls.SALES: {'label': 'Sales', 'category': ModuleCategory.SALES, 'icon': 'shopping-cart'},
            cls.POS: {'label': 'Point of Sale', 'category': ModuleCategory.SALES, 'icon': 'credit-card'},
            cls.INVOICES: {'label': 'Invoices', 'category': ModuleCategory.SALES, 'icon': 'file-text'},
            cls.CUSTOMERS: {'label': 'Customers', 'category': ModuleCategory.SALES, 'icon': 'users'},
            
            # Inventory
            cls.INVENTORY: {'label': 'Inventory', 'category': ModuleCategory.INVENTORY, 'icon': 'package'},
            cls.PRODUCTS: {'label': 'Products', 'category': ModuleCategory.INVENTORY, 'icon': 'box'},
            cls.WAREHOUSE: {'label': 'Warehouse', 'category': ModuleCategory.INVENTORY, 'icon': 'home'},
            
            # Purchases
            cls.PURCHASES: {'label': 'Purchases', 'category': ModuleCategory.INVENTORY, 'icon': 'shopping-bag'},
            cls.SUPPLIERS: {'label': 'Suppliers', 'category': ModuleCategory.INVENTORY, 'icon': 'truck'},
            
            # HR
            cls.HR: {'label': 'Human Resources', 'category': ModuleCategory.HR, 'icon': 'user-check'},
            cls.EMPLOYEES: {'label': 'Employees', 'category': ModuleCategory.HR, 'icon': 'user'},
            cls.ATTENDANCE: {'label': 'Attendance', 'category': ModuleCategory.HR, 'icon': 'clock'},
            cls.LEAVE: {'label': 'Leave Management', 'category': ModuleCategory.HR, 'icon': 'calendar'},
            cls.PAYROLL: {'label': 'Payroll', 'category': ModuleCategory.HR, 'icon': 'dollar-sign'},
            
            # Finance
            cls.EXPENSES: {'label': 'Expenses', 'category': ModuleCategory.FINANCE, 'icon': 'credit-card'},
            cls.PAYMENTS: {'label': 'Payments', 'category': ModuleCategory.FINANCE, 'icon': 'repeat'},
            cls.TAXES: {'label': 'Taxes', 'category': ModuleCategory.FINANCE, 'icon': 'percent'},
            
            # Operations
            cls.PROJECTS: {'label': 'Projects', 'category': ModuleCategory.OPERATIONS, 'icon': 'folder'},
            cls.TASKS: {'label': 'Tasks', 'category': ModuleCategory.OPERATIONS, 'icon': 'check-square'},
            cls.DOCUMENTS: {'label': 'Documents', 'category': ModuleCategory.OPERATIONS, 'icon': 'file'},
            cls.ASSETS: {'label': 'Assets', 'category': ModuleCategory.OPERATIONS, 'icon': 'monitor'},
            
            # Reports
            cls.REPORTS: {'label': 'Reports', 'category': ModuleCategory.REPORTS, 'icon': 'bar-chart'},
            cls.SALES_REPORTS: {'label': 'Sales Reports', 'category': ModuleCategory.REPORTS, 'icon': 'pie-chart'},
            cls.INVENTORY_REPORTS: {'label': 'Inventory Reports', 'category': ModuleCategory.REPORTS, 'icon': 'package'},
            cls.FINANCIAL_REPORTS: {'label': 'Financial Reports', 'category': ModuleCategory.REPORTS, 'icon': 'trending-up'},
            
            # Admin
            cls.SETTINGS: {'label': 'Settings', 'category': ModuleCategory.ADMIN, 'icon': 'settings'},
            cls.USERS: {'label': 'User Management', 'category': ModuleCategory.ADMIN, 'icon': 'user-plus'},
            cls.ROLES: {'label': 'Roles', 'category': ModuleCategory.ADMIN, 'icon': 'shield'},
            cls.WORKFLOWS: {'label': 'Workflows', 'category': ModuleCategory.ADMIN, 'icon': 'git-branch'},
            cls.BRANCHES: {'label': 'Branches', 'category': ModuleCategory.ADMIN, 'icon': 'home'},
            
            # CRM & Service
            cls.LEADS: {'label': 'Leads', 'category': ModuleCategory.SALES, 'icon': 'user-check'},
            cls.SERVICES: {'label': 'Services', 'category': ModuleCategory.OPERATIONS, 'icon': 'tool'},
            cls.RETURNS: {'label': 'Returns', 'category': ModuleCategory.SALES, 'icon': 'rotate-ccw'}
        }


# Role-based default permissions
ROLE_DEFAULT_PERMISSIONS = {
    'superadmin': {
        # Full access to everything
    },
    'admin': {
        # Full access to all modules except user management
        'dashboard': [PermissionType.ALL],
        'sales': [PermissionType.ALL],
        'pos': [PermissionType.ALL],
        'invoices': [PermissionType.ALL],
        'customers': [PermissionType.ALL],
        'inventory': [PermissionType.ALL],
        'products': [PermissionType.ALL],
        'warehouse': [PermissionType.ALL],
        'purchases': [PermissionType.ALL],
        'suppliers': [PermissionType.ALL],
        'hr': [PermissionType.ALL],
        'employees': [PermissionType.ALL],
        'attendance': [PermissionType.ALL],
        'leave': [PermissionType.ALL],
        'payroll': [PermissionType.ALL],
        'expenses': [PermissionType.ALL],
        'payments': [PermissionType.ALL],
        'taxes': [PermissionType.ALL],
        'projects': [PermissionType.ALL],
        'tasks': [PermissionType.ALL],
        'documents': [PermissionType.ALL],
        'assets': [PermissionType.ALL],
        'reports': [PermissionType.ALL],
        'sales_reports': [PermissionType.ALL],
        'inventory_reports': [PermissionType.ALL],
        'financial_reports': [PermissionType.ALL],
        'settings': [PermissionType.VIEW, PermissionType.EDIT],
        'users': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'roles': [PermissionType.VIEW],
        'workflows': [PermissionType.ALL],
        'branches': [PermissionType.ALL],
        'leads': [PermissionType.ALL],
        'services': [PermissionType.ALL],
        'returns': [PermissionType.ALL]
    },
    'manager': {
        'dashboard': [PermissionType.ALL],
        'sales': [PermissionType.ALL],
        'pos': [PermissionType.ALL],
        'invoices': [PermissionType.ALL],
        'customers': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'inventory': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'products': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'warehouse': [PermissionType.VIEW],
        'purchases': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'suppliers': [PermissionType.VIEW, PermissionType.CREATE],
        'hr': [PermissionType.VIEW],
        'employees': [PermissionType.VIEW],
        'attendance': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'leave': [PermissionType.VIEW, PermissionType.EDIT, PermissionType.APPROVE],
        'payroll': [PermissionType.VIEW],
        'expenses': [PermissionType.ALL],
        'payments': [PermissionType.VIEW, PermissionType.CREATE],
        'taxes': [PermissionType.VIEW],
        'projects': [PermissionType.ALL],
        'tasks': [PermissionType.ALL],
        'documents': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'assets': [PermissionType.VIEW],
        'reports': [PermissionType.VIEW, PermissionType.EXPORT],
        'sales_reports': [PermissionType.VIEW, PermissionType.EXPORT],
        'inventory_reports': [PermissionType.VIEW, PermissionType.EXPORT],
        'financial_reports': [PermissionType.VIEW],
        'settings': [PermissionType.VIEW],
        'users': [PermissionType.VIEW],
        'leads': [PermissionType.ALL],
        'services': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'returns': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.APPROVE]
    },
    'staff': {
        'dashboard': [PermissionType.VIEW],
        'sales': [PermissionType.VIEW, PermissionType.CREATE],
        'pos': [PermissionType.VIEW, PermissionType.CREATE],
        'invoices': [PermissionType.VIEW, PermissionType.CREATE],
        'customers': [PermissionType.VIEW],
        'inventory': [PermissionType.VIEW],
        'products': [PermissionType.VIEW],
        'warehouse': [PermissionType.VIEW],
        'purchases': [PermissionType.VIEW],
        'suppliers': [PermissionType.VIEW],
        'hr': [PermissionType.VIEW],
        'employees': [PermissionType.VIEW],
        'attendance': [PermissionType.VIEW, PermissionType.CREATE],
        'leave': [PermissionType.VIEW, PermissionType.CREATE],
        'payroll': [PermissionType.VIEW],
        'expenses': [PermissionType.VIEW, PermissionType.CREATE],
        'payments': [PermissionType.VIEW, PermissionType.CREATE],
        'taxes': [PermissionType.VIEW],
        'projects': [PermissionType.VIEW],
        'tasks': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT],
        'documents': [PermissionType.VIEW, PermissionType.CREATE],
        'assets': [PermissionType.VIEW],
        'reports': [PermissionType.VIEW],
        'leads': [PermissionType.VIEW, PermissionType.CREATE],
        'services': [PermissionType.VIEW, PermissionType.CREATE],
        'returns': [PermissionType.VIEW]
    }
}


class PermissionGroup(db.Model):
    """Permission groups for easy management"""
    __tablename__ = 'permission_groups'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    permissions = Column(JSON, default=dict)  # Store as {module: [permissions]}
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship('Business', back_populates='permission_groups')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions or {},
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserPermission(db.Model):
    """
    Advanced User Permission Model with granular permissions
    Stores individual permission grants per module with specific permission types
    """
    __tablename__ = 'user_permissions'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    module = Column(String(50), nullable=False)
    permissions = Column(JSON, default=list)  # List of permission types: ['view', 'create', 'edit', 'delete', 'export', 'approve']
    granted = Column(Boolean, default=True)
    granted_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='permissions', foreign_keys=[user_id])
    business = relationship('Business', back_populates='permissions')
    granter = relationship('User', foreign_keys=[granted_by])
    
    __table_args__ = (
        db.UniqueConstraint('business_id', 'user_id', 'module', name='_user_module_permission_uc'),
    )
    
    def has_permission(self, permission_type):
        """Check if user has specific permission type"""
        if not self.granted:
            return False
        if not self.permissions:
            return False
        return permission_type in self.permissions or PermissionType.ALL in self.permissions
    
    def to_dict(self, include_user=False):
        data = {
            'id': self.id,
            'business_id': self.business_id,
            'user_id': self.user_id,
            'module': self.module,
            'module_info': AppModule.get_module_info().get(self.module, {}),
            'permissions': self.permissions or [],
            'granted': self.granted,
            'granted_by': self.granted_by,
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_user and self.user:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'role': self.user.role.value if self.user.role else None
            }
        return data

class CompanyProfile(db.Model):
    __tablename__ = 'company_profiles'
    # Allowed currencies: USD, EUR, GBP, RWF, KES, TZS, UGX, BIF, CDF, ZAR, NGN, GHS
    ALLOWED_CURRENCIES = ALLOWED_CURRENCIES  # Make available to instances
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    company_name = Column(String(200), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    website = Column(String(200))
    logo_url = Column(String(200))
    tax_rate = Column(Numeric(5, 2), default=0.00)
    currency = Column(String(3), default='RWF')  # Must be in ALLOWED_CURRENCIES list
    # New fields
    business_type = Column(String(50))  # retail, wholesale, manufacturing, services, restaurant
    registration_number = Column(String(50))  # Tax/VAT ID
    fiscal_year_start = Column(String(2), default='01')  # Month (01-12)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    business = relationship('Business', back_populates='company_profile')

    def is_valid_currency(self):
        """Validate if the currency is in the allowed list"""
        return self.currency in self.ALLOWED_CURRENCIES
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'company_name': self.company_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'website': self.website,
            'logo_url': self.logo_url,
            'tax_rate': float(self.tax_rate) if self.tax_rate else 0.0,
            'currency': self.currency,
            'business_type': self.business_type,
            'registration_number': self.registration_number,
            'fiscal_year_start': self.fiscal_year_start,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=True) # Null for global settings
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(Text)
    setting_type = Column(String(20), default='string')  # string, integer, boolean, json
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    business = relationship('Business', back_populates='system_settings')

    # Unique constraint for business-specific settings
    __table_args__ = (db.UniqueConstraint('business_id', 'setting_key', name='_business_setting_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'setting_type': self.setting_type,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


