from app import db
from datetime import datetime

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
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
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
