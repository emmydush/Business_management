from app import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    product_id = db.Column(db.String(20), nullable=False)  # Unique per business
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    sku = db.Column(db.String(50))  # Unique per business
    barcode = db.Column(db.String(100))  # Unique per business
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
    image = db.Column(db.String(255))
    expiry_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', back_populates='products')
    category_obj = db.relationship('Category', back_populates='product_list')
    supplier_obj = db.relationship('Supplier', back_populates='product_list')
    inventory_transactions = db.relationship('InventoryTransaction', back_populates='product', lazy=True)
    order_items = db.relationship('OrderItem', back_populates='product', lazy=True)
    purchase_order_items = db.relationship('PurchaseOrderItem', back_populates='product', lazy=True)
    return_items = db.relationship('ReturnItem', back_populates='product', cascade='all, delete-orphan')
    
    # Unique constraints per business
    __table_args__ = (
        db.UniqueConstraint('business_id', 'product_id', name='_business_product_id_uc'),
        db.UniqueConstraint('business_id', 'sku', name='_business_sku_uc'),
        db.UniqueConstraint('business_id', 'barcode', name='_business_barcode_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
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
            'image': self.image,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'category': self.category_obj.to_dict() if self.category_obj else None,
            'supplier': self.supplier_obj.to_dict() if self.supplier_obj else None
        }