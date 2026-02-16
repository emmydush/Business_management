from app import db
from datetime import datetime
from enum import Enum

class OrderStatus(Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    order_id = db.Column(db.String(20), nullable=False)  # Unique per business
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Sales person
    order_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    required_date = db.Column(db.Date)
    shipped_date = db.Column(db.Date)
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', back_populates='orders')
    branch = db.relationship('Branch', backref='orders')
    customer = db.relationship('Customer', back_populates='orders')
    user = db.relationship('User', backref='orders')  # Sales person
    order_items = db.relationship('OrderItem', back_populates='order', lazy=True, cascade='all, delete-orphan')
    invoice = db.relationship('Invoice', back_populates='order', uselist=False, cascade='all, delete-orphan')
    returns = db.relationship('Return', back_populates='order', cascade='all, delete-orphan')
    
    # Unique constraint per business
    __table_args__ = (db.UniqueConstraint('business_id', 'order_id', name='_business_order_id_uc'),)
    
    def get_payment_status(self):
        """Determine payment status based on invoice amount_due and amount_paid"""
        if not self.invoice:
            return 'unpaid'
        
        if self.invoice.amount_due <= 0:
            return 'paid'
        elif self.invoice.amount_paid > 0 and self.invoice.amount_due > 0:
            return 'partial'
        else:
            # When amount_paid is 0 but there's an invoice, it's unpaid
            return 'unpaid'
    
    def to_dict(self):
        # Calculate total cost for the order with null safety
        total_cost = 0.0
        try:
            for item in self.order_items:
                if item.product and item.product.cost_price:
                    total_cost += float(item.quantity) * float(item.product.cost_price)
        except Exception:
            total_cost = 0.0
        
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'customer': self.customer.to_dict() if self.customer else None,
            'user_id': self.user_id,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'required_date': self.required_date.isoformat() if self.required_date else None,
            'shipped_date': self.shipped_date.isoformat() if self.shipped_date else None,
            'status': self.status.value,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'total_cost': float(total_cost) if total_cost else 0.0,
            'profit': float(self.total_amount - total_cost) if self.total_amount and total_cost else 0.0,
            'items': len(self.order_items),
            'payment': self.get_payment_status(),
            'invoice_status': self.invoice.status.value if self.invoice else 'no_invoice',
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0.00)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', back_populates='order_items')
    product = db.relationship('Product', back_populates='order_items', lazy='joined')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Unknown Product',
            'product_description': self.product.description if self.product else '',
            'product_sku': self.product.sku if self.product else '',
            'product_category': self.product.category_obj.name if self.product and self.product.category_obj else '',
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'cost_price': float(self.product.cost_price) if self.product and self.product.cost_price else 0.0,
            'discount_percent': float(self.discount_percent) if self.discount_percent else 0.0,
            'line_total': float(self.line_total) if self.line_total else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }