from app import db
from datetime import datetime

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    supplier_id = db.Column(db.String(20), nullable=False)  # Unique per business
    company_name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(50))
    state = db.Column(db.String(50))
    country = db.Column(db.String(50))
    zip_code = db.Column(db.String(10))
    tax_id = db.Column(db.String(50))
    payment_terms = db.Column(db.String(100))
    credit_limit = db.Column(db.Numeric(10, 2), default=0.00)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', back_populates='suppliers')
    branch = db.relationship('Branch', backref='suppliers')
    purchase_orders = db.relationship('PurchaseOrder', back_populates='supplier', lazy=True)
    product_list = db.relationship('Product', back_populates='supplier_obj', lazy=True)
    
    # Unique constraint per business
    __table_args__ = (db.UniqueConstraint('business_id', 'supplier_id', name='_business_supplier_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'supplier_id': self.supplier_id,
            'company_name': self.company_name,
            'contact_person': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'zip_code': self.zip_code,
            'tax_id': self.tax_id,
            'payment_terms': self.payment_terms,
            'credit_limit': float(self.credit_limit) if self.credit_limit else 0.0,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }