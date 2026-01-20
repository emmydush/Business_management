from app import db
from datetime import datetime

class AssetStatus:
    ASSIGNED = "Assigned"
    AVAILABLE = "Available"
    IN_REPAIR = "In Repair"
    RETIRED = "Retired"

class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    name = db.Column(db.String(200), nullable=False)  # Asset name
    category = db.Column(db.String(100))  # Category (Electronics, Furniture, etc.)
    serial_number = db.Column(db.String(100), unique=True)  # Serial number
    asset_tag = db.Column(db.String(50), unique=True)  # Asset tag/ID
    description = db.Column(db.Text)  # Description of the asset
    value = db.Column(db.Numeric(10, 2))  # Monetary value of the asset
    status = db.Column(db.String(20), default=AssetStatus.AVAILABLE)  # Status of the asset
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Who it's assigned to
    assigned_date = db.Column(db.Date)  # Date it was assigned
    purchase_date = db.Column(db.Date)  # Date of purchase
    warranty_expiry = db.Column(db.Date)  # Warranty expiry date
    location = db.Column(db.String(200))  # Physical location of the asset
    notes = db.Column(db.Text)  # Additional notes
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', back_populates='assets')
    branch = db.relationship('Branch', backref='assets')
    assignee = db.relationship('User', backref=db.backref('assigned_assets', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'name': self.name,
            'category': self.category,
            'serial_number': self.serial_number,
            'asset_tag': self.asset_tag,
            'description': self.description,
            'value': float(self.value) if self.value else 0.0,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'warranty_expiry': self.warranty_expiry.isoformat() if self.warranty_expiry else None,
            'location': self.location,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': {
                'id': self.assignee.id if self.assignee else None,
                'first_name': self.assignee.first_name if self.assignee else None,
                'last_name': self.assignee.last_name if self.assignee else None
            } if self.assignee else None
        }