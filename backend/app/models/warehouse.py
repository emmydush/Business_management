from app import db
from datetime import datetime
from enum import Enum


class WarehouseStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    FULL = "full"


class Warehouse(db.Model):
    __tablename__ = 'warehouses'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    warehouse_id = db.Column(db.String(20), nullable=False)  # Unique per business
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.Text)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # Manager of the warehouse
    status = db.Column(db.Enum(WarehouseStatus), default=WarehouseStatus.ACTIVE, nullable=False)
    capacity_percentage = db.Column(db.Integer, default=0)  # Current capacity percentage (0-100)
    total_items = db.Column(db.Integer, default=0)  # Current number of items
    max_capacity = db.Column(db.Integer, default=10000)  # Maximum capacity in items
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', back_populates='warehouses')
    branch = db.relationship('Branch', backref='warehouses')
    manager = db.relationship('User', backref='managed_warehouses')

    # Unique constraint for business-specific warehouse IDs
    __table_args__ = (db.UniqueConstraint('business_id', 'warehouse_id', name='_business_warehouse_id_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'warehouse_id': self.warehouse_id,
            'name': self.name,
            'location': self.location,
            'manager_id': self.manager_id,
            'manager': self.manager.to_dict() if self.manager else None,
            'status': self.status.value,
            'capacity_percentage': self.capacity_percentage,
            'total_items': self.total_items,
            'max_capacity': self.max_capacity,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }