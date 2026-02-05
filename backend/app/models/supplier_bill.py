from app import db
from datetime import datetime


class SupplierBill(db.Model):
    __tablename__ = 'supplier_bills'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=True)  # Link to PO if applicable
    
    bill_number = db.Column(db.String(50), nullable=False)
    bill_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    
    subtotal = db.Column(db.Numeric(10, 2), default=0.00)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.00)
    discount_amount = db.Column(db.Numeric(10, 2), default=0.00)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0.00)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    status = db.Column(db.String(20), default='pending')  # pending, partial, paid, overdue, cancelled
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', back_populates='supplier_bills')
    branch = db.relationship('Branch', backref='supplier_bills')
    supplier = db.relationship('Supplier', backref='bills')
    purchase_order = db.relationship('PurchaseOrder', backref='supplier_bills')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'supplier_id': self.supplier_id,
            'purchase_order_id': self.purchase_order_id,
            'bill_number': self.bill_number,
            'bill_date': self.bill_date.isoformat() if self.bill_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }