from app import db
from datetime import datetime

class Branch(db.Model):
    """
    Branch/Location model for multi-location businesses
    Each business can have multiple branches/locations
    """
    __tablename__ = 'branches'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # e.g., "Main Office", "Downtown Branch"
    code = db.Column(db.String(20))  # Branch code for easier identification (e.g., "BR001")
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Branch manager
    is_headquarters = db.Column(db.Boolean, default=False)  # Flag for main branch
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(20), default='approved', nullable=False)  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='branches')
    manager = db.relationship('User', foreign_keys=[manager_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'name': self.name,
            'code': self.code,
            'address': self.address,
            'city': self.city,
            'phone': self.phone,
            'email': self.email,
            'manager_id': self.manager_id,
            'manager_name': f"{self.manager.first_name} {self.manager.last_name}" if self.manager else None,
            'is_headquarters': self.is_headquarters,
            'is_active': self.is_active,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserBranchAccess(db.Model):
    """
    Maps which users have access to which branches
    Allows flexible permission management
    """
    __tablename__ = 'user_branch_access'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    is_default = db.Column(db.Boolean, default=False)  # User's default/home branch
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='branch_access')
    branch = db.relationship('Branch', backref='user_access')
    
    # Unique constraint: one user can't have duplicate access to same branch
    __table_args__ = (
        db.UniqueConstraint('user_id', 'branch_id', name='_user_branch_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'branch_id': self.branch_id,
            'branch_name': self.branch.name if self.branch else None,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
