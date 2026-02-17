from app import db
from datetime import datetime
from enum import Enum

class BOMStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    OBSOLETE = "obsolete"

class ProductionOrderStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BillOfMaterials(db.Model):
    __tablename__ = 'bills_of_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    bom_id = db.Column(db.String(20), nullable=False)
    
    # Finished product
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    version = db.Column(db.String(20), default='1.0')
    
    # Quantity produced
    quantity = db.Column(db.Integer, default=1, nullable=False)
    
    # Costs
    material_cost = db.Column(db.Numeric(10, 2), default=0.00)
    labor_cost = db.Column(db.Numeric(10, 2), default=0.00)
    overhead_cost = db.Column(db.Numeric(10, 2), default=0.00)
    total_cost = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Status
    status = db.Column(db.Enum(BOMStatus), default=BOMStatus.DRAFT, nullable=False)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='bills_of_materials')
    branch = db.relationship('Branch', backref='bills_of_materials')
    product = db.relationship('Product', backref='bills_of_materials')
    creator = db.relationship('User', backref='bills_of_materials')
    items = db.relationship('BOMItem', back_populates='bom', lazy=True, cascade='all, delete-orphan')
    production_orders = db.relationship('ProductionOrder', back_populates='bom', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'bom_id', name='_business_bom_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'bom_id': self.bom_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'name': self.name,
            'description': self.description,
            'version': self.version,
            'quantity': self.quantity,
            'material_cost': float(self.material_cost) if self.material_cost else 0.0,
            'labor_cost': float(self.labor_cost) if self.labor_cost else 0.0,
            'overhead_cost': float(self.overhead_cost) if self.overhead_cost else 0.0,
            'total_cost': float(self.total_cost) if self.total_cost else 0.0,
            'status': self.status.value,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class BOMItem(db.Model):
    __tablename__ = 'bom_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bom_id = db.Column(db.Integer, db.ForeignKey('bills_of_materials.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    quantity_required = db.Column(db.Numeric(10, 3), nullable=False)
    unit_of_measure = db.Column(db.String(20), nullable=False)
    
    scrap_percent = db.Column(db.Numeric(5, 2), default=0.00)  # Expected scrap
    sequence = db.Column(db.Integer, default=0)
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bom = db.relationship('BillOfMaterials', back_populates='items')
    product = db.relationship('Product', backref='bom_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'bom_id': self.bom_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'quantity_required': float(self.quantity_required) if self.quantity_required else 0.0,
            'unit_of_measure': self.unit_of_measure,
            'scrap_percent': float(self.scrap_percent) if self.scrap_percent else 0.0,
            'sequence': self.sequence,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ProductionOrder(db.Model):
    __tablename__ = 'production_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    order_id = db.Column(db.String(20), nullable=False)
    
    # Reference to BOM
    bom_id = db.Column(db.Integer, db.ForeignKey('bills_of_materials.id'), nullable=False)
    
    # Production details
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity_to_produce = db.Column(db.Integer, nullable=False)
    quantity_produced = db.Column(db.Integer, default=0)
    
    # Scheduling
    planned_start_date = db.Column(db.Date)
    planned_end_date = db.Column(db.Date)
    actual_start_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    
    # Status
    status = db.Column(db.Enum(ProductionOrderStatus), default=ProductionOrderStatus.DRAFT, nullable=False)
    
    # Costs
    estimated_cost = db.Column(db.Numeric(10, 2), default=0.00)
    actual_cost = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Notes
    notes = db.Column(db.Text)
    
    # Priority
    priority = db.Column(db.Integer, default=0)  # Higher = more urgent
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='production_orders')
    branch = db.relationship('Branch', backref='production_orders')
    bom = db.relationship('BillOfMaterials', back_populates='production_orders')
    product = db.relationship('Product', backref='production_orders')
    creator = db.relationship('User', backref='production_orders')
    materials = db.relationship('ProductionMaterial', back_populates='order', lazy=True, cascade='all, delete-orphan')
    operations = db.relationship('ProductionOperation', back_populates='order', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'order_id', name='_business_production_order_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'order_id': self.order_id,
            'bom_id': self.bom_id,
            'bom': self.bom.to_dict() if self.bom else None,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity_to_produce': self.quantity_to_produce,
            'quantity_produced': self.quantity_produced,
            'planned_start_date': self.planned_start_date.isoformat() if self.planned_start_date else None,
            'planned_end_date': self.planned_end_date.isoformat() if self.planned_end_date else None,
            'actual_start_date': self.actual_start_date.isoformat() if self.actual_start_date else None,
            'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
            'status': self.status.value,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else 0.0,
            'actual_cost': float(self.actual_cost) if self.actual_cost else 0.0,
            'notes': self.notes,
            'priority': self.priority,
            'created_by': self.created_by,
            'materials': [m.to_dict() for m in self.materials],
            'operations': [op.to_dict() for op in self.operations],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ProductionMaterial(db.Model):
    __tablename__ = 'production_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('production_orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    quantity_required = db.Column(db.Numeric(10, 3), nullable=False)
    quantity_issued = db.Column(db.Numeric(10, 3), default=0)
    quantity_remaining = db.Column(db.Numeric(10, 3), default=0)
    
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=True)
    
    status = db.Column(db.String(20), default='pending')  # pending, issued, partial, cancelled
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('ProductionOrder', back_populates='materials')
    product = db.relationship('Product', backref='production_materials')
    warehouse = db.relationship('Warehouse', backref='production_materials')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity_required': float(self.quantity_required) if self.quantity_required else 0.0,
            'quantity_issued': float(self.quantity_issued) if self.quantity_issued else 0.0,
            'quantity_remaining': float(self.quantity_remaining) if self.quantity_remaining else 0.0,
            'warehouse_id': self.warehouse_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ProductionOperation(db.Model):
    __tablename__ = 'production_operations'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('production_orders.id'), nullable=False)
    
    sequence = db.Column(db.Integer, nullable=False)
    operation_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Work center
    work_center = db.Column(db.String(100))
    
    # Time estimates (in minutes)
    setup_time = db.Column(db.Integer, default=0)
    run_time = db.Column(db.Integer, default=0)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Employee assigned
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('ProductionOrder', back_populates='operations')
    employee = db.relationship('Employee', backref='production_operations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'sequence': self.sequence,
            'operation_name': self.operation_name,
            'description': self.description,
            'work_center': self.work_center,
            'setup_time': self.setup_time,
            'run_time': self.run_time,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'employee_id': self.employee_id,
            'employee': self.employee.to_dict() if self.employee else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
