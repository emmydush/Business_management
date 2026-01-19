from app import db
from datetime import datetime
from enum import Enum

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    invoice_id = db.Column(db.String(20), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    issue_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(InvoiceStatus), default=InvoiceStatus.SENT, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    amount_due = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    notes = db.Column(db.Text)
    terms = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', back_populates='invoice', uselist=False)
    customer = db.relationship('Customer', back_populates='invoices')
    business = db.relationship('Business', back_populates='invoices')
    returns = db.relationship('Return', back_populates='invoice', cascade='all, delete-orphan')

    # Unique constraint for business-specific invoice IDs
    __table_args__ = (db.UniqueConstraint('business_id', 'invoice_id', name='_business_invoice_id_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'invoice_id': self.invoice_id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status.value,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0.0,
            'amount_due': float(self.amount_due) if self.amount_due else 0.0,
            'notes': self.notes,
            'terms': self.terms,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'order': self.order.to_dict() if self.order else None,
            'customer': self.customer.to_dict() if self.customer else None,
            'business': self.business.to_dict() if self.business else None,
            'items': [item.to_dict() for item in self.order.order_items] if self.order and self.order.order_items else []
        }