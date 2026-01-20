from app import db
from datetime import datetime
from enum import Enum

class ReturnStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSED = "processed"

class Return(db.Model):
    __tablename__ = 'returns'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    return_id = db.Column(db.String(20), nullable=False)  # Unique per business
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    return_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    status = db.Column(db.Enum(ReturnStatus), default=ReturnStatus.PENDING, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    refund_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', back_populates='returns')
    branch = db.relationship('Branch', backref='returns')
    order = db.relationship('Order', back_populates='returns')
    customer = db.relationship('Customer', back_populates='returns')
    invoice = db.relationship('Invoice', back_populates='returns')
    return_items = db.relationship('ReturnItem', back_populates='return_obj', cascade='all, delete-orphan')

    # Unique constraint per business
    __table_args__ = (db.UniqueConstraint('business_id', 'return_id', name='_business_return_id_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'return_id': self.return_id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'invoice_id': self.invoice_id,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'status': self.status.value,
            'reason': self.reason,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'refund_amount': float(self.refund_amount) if self.refund_amount else 0.0,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ReturnItem(db.Model):
    __tablename__ = 'return_items'

    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('returns.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    return_obj = db.relationship('Return', back_populates='return_items')
    product = db.relationship('Product', back_populates='return_items')

    def to_dict(self):
        return {
            'id': self.id,
            'return_id': self.return_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'line_total': float(self.line_total) if self.line_total else 0.0,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }