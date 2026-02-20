from app import db
from datetime import datetime
from enum import Enum

class AuditAction(Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    PERMISSION_CHANGE = "permission_change"
    SETTINGS_UPDATE = "settings_update"
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    IMPERSONATE = "impersonate"

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for system events
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    action = db.Column(db.Enum(AuditAction), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # e.g., 'user', 'product', 'customer'
    entity_id = db.Column(db.Integer)  # ID of the entity affected
    old_values = db.Column(db.JSON)  # Store old values before change
    new_values = db.Column(db.JSON)  # Store new values after change
    ip_address = db.Column(db.String(45))  # Support IPv6
    user_agent = db.Column(db.String(500))
    additional_metadata = db.Column(db.JSON)  # Additional context
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='audit_logs')
    business = db.relationship('Business', back_populates='audit_logs')
    branch = db.relationship('Branch', backref='audit_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'action': self.action.value,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'metadata': self.additional_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Function to create an audit log entry
def create_audit_log(user_id, business_id, action, entity_type, entity_id, branch_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None, metadata=None):
    audit_log = AuditLog(
        user_id=user_id,
        business_id=business_id,
        branch_id=branch_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
        additional_metadata=metadata or {}
    )
    db.session.add(audit_log)
    db.session.commit()
    return audit_log
