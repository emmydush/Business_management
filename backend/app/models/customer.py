from app import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    customer_id = db.Column(db.String(20), nullable=False)  # Unique per business
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    company = db.Column(db.String(100))
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(50))
    state = db.Column(db.String(50))
    country = db.Column(db.String(50))
    zip_code = db.Column(db.String(10))
    customer_type = db.Column(db.String(20), default='Individual')  # Individual, Company, VIP
    notes = db.Column(db.Text)
    credit_limit = db.Column(db.Numeric(10, 2), default=0.00)
    balance = db.Column(db.Numeric(10, 2), default=0.00)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', back_populates='customers')
    orders = db.relationship('Order', back_populates='customer', lazy=True)
    invoices = db.relationship('Invoice', back_populates='customer', lazy=True)
    returns = db.relationship('Return', back_populates='customer', cascade='all, delete-orphan')
    
    # Unique constraint for customer_id per business
    __table_args__ = (db.UniqueConstraint('business_id', 'customer_id', name='_business_customer_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'customer_id': self.customer_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company': self.company,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'zip_code': self.zip_code,
            'customer_type': self.customer_type,
            'notes': self.notes,
            'credit_limit': float(self.credit_limit) if self.credit_limit else 0.0,
            'balance': float(self.balance) if self.balance else 0.0,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }