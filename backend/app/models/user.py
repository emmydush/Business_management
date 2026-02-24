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
    approval_status = db.Column(db.Enum(UserApprovalStatus, native_enum=False), default=UserApprovalStatus.APPROVED, nullable=False)
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
    
    def has_module_access(self, module, permission_type='view'):
        """
        Check if user has access to a specific module with a specific permission type.
        Returns True if:
        1. User is superadmin (full access)
        2. User has the specific permission granted
        3. Role-based default permissions allow it
        """
        # Superadmin has full access
        if self.role == UserRole.superadmin:
            return True
        
        # Admin has full access
        if self.role == UserRole.admin:
            return True
        
        # Check if user has explicit permission
        if hasattr(self, 'permissions') and self.permissions:
            for perm in self.permissions:
                if perm.module == module and perm.granted:
                    # Check if permission type is granted
                    if perm.permissions:
                        if 'all' in perm.permissions:
                            return True
                        if permission_type in perm.permissions:
                            return True
        
        # Check role-based default permissions
        from app.models.settings import ROLE_DEFAULT_PERMISSIONS, PermissionType
        role_perms = ROLE_DEFAULT_PERMISSIONS.get(self.role.value, {})
        if module in role_perms:
            perms = role_perms[module]
            if PermissionType.ALL in perms:
                return True
            if permission_type in perms:
                return True
        
        return False
    
    def get_all_permissions(self):
        """
        Get all permissions for the user (explicit + role-based defaults).
        Returns dict of {module: [permissions]}
        """
        from app.models.settings import ROLE_DEFAULT_PERMISSIONS, PermissionType
        
        # Start with role-based defaults
        all_perms = {}
        role_perms = ROLE_DEFAULT_PERMISSIONS.get(self.role.value, {})
        
        # If admin or superadmin, give full access to everything
        if self.role in [UserRole.superadmin, UserRole.admin]:
            from app.models.settings import AppModule
            for module in AppModule.get_all():
                all_perms[module] = [PermissionType.ALL]
            return all_perms
        
        # Add role-based permissions
        for module, perms in role_perms.items():
            all_perms[module] = perms.copy() if perms else []
        
        # Override with explicit user permissions (with error handling)
        try:
            if hasattr(self, 'permissions') and self.permissions:
                for perm in self.permissions:
                    if perm.granted and perm.permissions:
                        all_perms[perm.module] = perm.permissions
        except Exception as e:
            # If there's an error, just use role-based permissions
            pass
        
        return all_perms
    
    def get_accessible_modules(self):
        """Get list of modules the user has any access to."""
        perms = self.get_all_permissions()
        return [module for module, perms_list in perms.items() if perms_list]
    
    def can_access_module(self, module):
        """Check if user has any access to a module."""
        return len(self.get_all_permissions().get(module, [])) > 0
    
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
            'industry': self.business.industry if self.business and include_business else None,
            'is_active': self.is_active,
            'approval_status': self.approval_status.value,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Get permissions - with fallback for backward compatibility
        try:
            data['permissions'] = self.get_all_permissions()
        except Exception:
            # Fallback to old format if there's an error
            data['permissions'] = [p.module for p in self.permissions if p.granted] if hasattr(self, 'permissions') else []
        
        return data