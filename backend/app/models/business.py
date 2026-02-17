from app import db
from datetime import datetime

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    
    # Extended business information
    registration_number = db.Column(db.String(50), nullable=True)  # Business registration number
    tax_id = db.Column(db.String(50), nullable=True)  # Tax identification number
    industry = db.Column(db.String(100), nullable=True)  # Industry type (e.g., Retail, Manufacturing)
    company_size = db.Column(db.String(20), nullable=True)  # small, medium, large, enterprise
    website = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    # Business type
    business_type = db.Column(db.String(50), nullable=True)  # sole_proprietorship, partnership, corporation, llc
    
    # Country and currency
    country = db.Column(db.String(100), nullable=True)
    currency = db.Column(db.String(3), default='USD')
    timezone = db.Column(db.String(50), default='UTC')
    
    # Logo
    logo = db.Column(db.String(255), nullable=True)
    
    # Verification status
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', back_populates='business', cascade='all, delete-orphan')
    customers = db.relationship('Customer', back_populates='business', cascade='all, delete-orphan')
    products = db.relationship('Product', back_populates='business', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='business', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', back_populates='business', cascade='all, delete-orphan')
    employees = db.relationship('Employee', back_populates='business', cascade='all, delete-orphan')
    suppliers = db.relationship('Supplier', back_populates='business', cascade='all, delete-orphan')
    categories = db.relationship('Category', back_populates='business', cascade='all, delete-orphan')
    purchase_orders = db.relationship('PurchaseOrder', back_populates='business', cascade='all, delete-orphan')
    invoices = db.relationship('Invoice', back_populates='business', cascade='all, delete-orphan')
    attendance_records = db.relationship('Attendance', back_populates='business', cascade='all, delete-orphan')
    leave_requests = db.relationship('LeaveRequest', back_populates='business', cascade='all, delete-orphan')
    payrolls = db.relationship('Payroll', back_populates='business', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='business', cascade='all, delete-orphan')
    messages = db.relationship('Message', back_populates='business', cascade='all, delete-orphan')
    announcements = db.relationship('Announcement', back_populates='business', cascade='all, delete-orphan')
    inventory_transactions = db.relationship('InventoryTransaction', back_populates='business', cascade='all, delete-orphan')
    company_profile = db.relationship('CompanyProfile', back_populates='business', uselist=False, cascade='all, delete-orphan')
    permissions = db.relationship('UserPermission', back_populates='business', cascade='all, delete-orphan')
    system_settings = db.relationship('SystemSetting', back_populates='business', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', back_populates='business', cascade='all, delete-orphan')
    returns = db.relationship('Return', back_populates='business', cascade='all, delete-orphan')
    warehouses = db.relationship('Warehouse', back_populates='business', cascade='all, delete-orphan')
    assets = db.relationship('Asset', back_populates='business', cascade='all, delete-orphan')
    branches = db.relationship('Branch', back_populates='business', cascade='all, delete-orphan')
    subscriptions = db.relationship('Subscription', back_populates='business', cascade='all, delete-orphan')
    leads = db.relationship('Lead', back_populates='business', cascade='all, delete-orphan')
    tasks = db.relationship('Task', back_populates='business', cascade='all, delete-orphan')
    documents = db.relationship('Document', back_populates='business', cascade='all, delete-orphan')
    supplier_bills = db.relationship('SupplierBill', back_populates='business', cascade='all, delete-orphan')
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'registration_number': self.registration_number,
            'tax_id': self.tax_id,
            'industry': self.industry,
            'company_size': self.company_size,
            'website': self.website,
            'description': self.description,
            'business_type': self.business_type,
            'country': self.country,
            'currency': self.currency,
            'timezone': self.timezone,
            'logo': self.logo,
            'is_verified': self.is_verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
