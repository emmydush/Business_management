from datetime import datetime
from enum import Enum
from app import db

class PurchaseReturnStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SHIPPED = "shipped"
    RECEIVED_BY_SUPPLIER = "received_by_supplier"
    CREDITED = "credited"
    REJECTED = "rejected"

class PurchaseReturn(db.Model):
    __tablename__ = 'purchase_returns'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    
    # Identification
    return_id = db.Column(db.String(50), unique=True, nullable=False)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    
    # Return details
    return_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date())
    expected_credit_date = db.Column(db.Date)
    actual_credit_date = db.Column(db.Date)
    
    # Status and workflow
    status = db.Column(db.Enum(PurchaseReturnStatus), default=PurchaseReturnStatus.PENDING, nullable=False)
    
    # Financial details
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    credit_amount = db.Column(db.Numeric(10, 2), default=0)
    restock_fee = db.Column(db.Numeric(10, 2), default=0)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0)
    
    # Return reasons
    reason = db.Column(db.Text, nullable=False)
    return_type = db.Column(db.String(50), nullable=False)  # 'defective', 'wrong_item', 'overstock', 'expired'
    notes = db.Column(db.Text)
    
    # Tracking
    tracking_number = db.Column(db.String(100))
    carrier = db.Column(db.String(100))
    
    # Metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    business = db.relationship('Business', backref='purchase_returns')
    branch = db.relationship('Branch', backref='purchase_returns')
    purchase_order = db.relationship('PurchaseOrder', backref='purchase_returns')
    supplier = db.relationship('Supplier', backref='purchase_returns')
    creator = db.relationship('User', backref='created_purchase_returns')
    return_items = db.relationship('PurchaseReturnItem', backref='purchase_return', cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'return_id', name='_business_purchase_return_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'return_id': self.return_id,
            'purchase_order_id': self.purchase_order_id,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else 'Unknown Supplier',
            'purchase_order_number': self.purchase_order.order_number if self.purchase_order else 'Unknown PO',
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'expected_credit_date': self.expected_credit_date.isoformat() if self.expected_credit_date else None,
            'actual_credit_date': self.actual_credit_date.isoformat() if self.actual_credit_date else None,
            'status': self.status.value,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'credit_amount': float(self.credit_amount) if self.credit_amount else 0.0,
            'restock_fee': float(self.restock_fee) if self.restock_fee else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'reason': self.reason,
            'return_type': self.return_type,
            'notes': self.notes,
            'tracking_number': self.tracking_number,
            'carrier': self.carrier,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'creator_name': self.creator.username if self.creator else 'Unknown User',
            'items': [item.to_dict() for item in self.return_items] if self.return_items else []
        }

class PurchaseReturnItem(db.Model):
    __tablename__ = 'purchase_return_items'
    
    id = db.Column(db.Integer, primary_key=True)
    purchase_return_id = db.Column(db.Integer, db.ForeignKey('purchase_returns.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Item details
    quantity = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False)
    total_cost = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Return specifics
    return_reason = db.Column(db.Text, nullable=False)
    condition = db.Column(db.String(50), nullable=False)  # 'defective', 'damaged', 'wrong_spec', 'expired'
    batch_number = db.Column(db.String(100))
    expiry_date = db.Column(db.Date)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    product = db.relationship('Product', backref='purchase_return_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'purchase_return_id': self.purchase_return_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Unknown Product',
            'product_sku': self.product.sku if self.product else 'Unknown SKU',
            'quantity': self.quantity,
            'unit_cost': float(self.unit_cost) if self.unit_cost else 0.0,
            'total_cost': float(self.total_cost) if self.total_cost else 0.0,
            'return_reason': self.return_reason,
            'condition': self.condition,
            'batch_number': self.batch_number,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
