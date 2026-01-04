from app import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(20), unique=True, nullable=False)  # Unique product identifier
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    sku = db.Column(db.String(50), unique=True)  # Stock Keeping Unit
    barcode = db.Column(db.String(100), unique=True)  # UPC or EAN code
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    cost_price = db.Column(db.Numeric(10, 2))
    unit_of_measure = db.Column(db.String(20))  # pieces, kg, liters, etc.
    stock_quantity = db.Column(db.Integer, default=0, nullable=False)
    reorder_level = db.Column(db.Integer, default=0, nullable=False)
    min_stock_level = db.Column(db.Integer, default=0, nullable=False)
    max_stock_level = db.Column(db.Integer)
    weight = db.Column(db.Numeric(8, 2))  # in kg
    dimensions = db.Column(db.String(50))  # length x width x height
    color = db.Column(db.String(30))
    size = db.Column(db.String(30))
    brand = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_transactions = db.relationship('InventoryTransaction', back_populates='product', lazy=True)
    order_items = db.relationship('OrderItem', back_populates='product', lazy=True)
    purchase_order_items = db.relationship('PurchaseOrderItem', back_populates='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'name': self.name,
            'description': self.description,
            'sku': self.sku,
            'barcode': self.barcode,
            'category_id': self.category_id,
            'supplier_id': self.supplier_id,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'cost_price': float(self.cost_price) if self.cost_price else 0.0,
            'unit_of_measure': self.unit_of_measure,
            'stock_quantity': self.stock_quantity,
            'reorder_level': self.reorder_level,
            'min_stock_level': self.min_stock_level,
            'max_stock_level': self.max_stock_level,
            'weight': float(self.weight) if self.weight else None,
            'dimensions': self.dimensions,
            'color': self.color,
            'size': self.size,
            'brand': self.brand,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'category': self.category.to_dict() if self.category else None,
            'supplier': self.supplier.to_dict() if self.supplier else None
        }