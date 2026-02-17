from app import db, bcrypt
from datetime import datetime
from enum import Enum
from datetime import date

class UserApprovalStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class UserRole(Enum):
    superadmin = "superadmin"
    admin = "admin"
    manager = "manager"
    staff = "staff"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('business_id', 'username', name='_business_username_uc'),
        db.UniqueConstraint('business_id', 'email', name='_business_email_uc'),
    )
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(255), nullable=True)  # URL to profile image
    role = db.Column(db.Enum(UserRole), default=UserRole.staff, nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    approval_status = db.Column(db.Enum(UserApprovalStatus, native_enum=False), default=UserApprovalStatus.PENDING, nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    failed_login_attempts = db.Column(db.Integer, default=0)  # Track failed login attempts
    locked_until = db.Column(db.DateTime, nullable=True)  # Account lockout until
    
    # Relationships
    business = db.relationship('Business', back_populates='users')
    employee = db.relationship('Employee', back_populates='user', uselist=False, cascade='all, delete-orphan')
    approver = db.relationship('User', remote_side=[id], back_populates='approved_users')
    approved_users = db.relationship('User', back_populates='approver')
    audit_logs = db.relationship('AuditLog', back_populates='user', cascade='all, delete-orphan')
    branch_access = db.relationship('UserBranchAccess', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False, include_business=True):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'role': self.role.value,
            'business_id': self.business_id,
            'business_name': self.business.name if self.business and include_business else None,
            'is_active': self.is_active,
            'approval_status': self.approval_status.value,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'permissions': [p.module for p in self.permissions if p.granted] if hasattr(self, 'permissions') else []
        }
        return data