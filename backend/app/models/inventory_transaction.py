from app import db
from datetime import datetime
from enum import Enum

class TransactionType(Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    ADJUSTMENT_IN = "adjustment_in"
    ADJUSTMENT_OUT = "adjustment_out"
    RETURN = "return"
    DAMAGED = "damaged"

class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    transaction_id = db.Column(db.String(20), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2))
    reference_id = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', back_populates='inventory_transactions')
    user = db.relationship('User', backref='inventory_transactions')
    business = db.relationship('Business', back_populates='inventory_transactions')

    # Unique constraint for business-specific transaction IDs
    __table_args__ = (db.UniqueConstraint('business_id', 'transaction_id', name='_business_inventory_transaction_id_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'transaction_id': self.transaction_id,
            'product_id': self.product_id,
            'transaction_type': self.transaction_type.value,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'reference_id': self.reference_id,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'product': self.product.to_dict() if self.product else None,
            'user': self.user.to_dict() if self.user else None
        }