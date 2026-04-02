from app import db
from datetime import datetime
from enum import Enum
from flask import request
from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity

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
    EXPORT = "export"
    IMPORT = "import"
    BACKUP = "backup"
    RESTORE = "restore"

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

# Enhanced audit log function that also creates event monitoring entries
def create_audit_log(user_id, business_id, action, entity_type, entity_id, branch_id=None, 
                   old_values=None, new_values=None, ip_address=None, user_agent=None, 
                   metadata=None, severity=None, description=None):
    """Create audit log entry and corresponding event monitoring entry"""
    
    # Get request context if not provided
    if not ip_address and request:
        ip_address = request.remote_addr
    if not user_agent and request:
        user_agent = request.headers.get('User-Agent', '')
    
    # Create audit log entry
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
    
    # Create corresponding event monitoring entry
    try:
        # Map audit actions to event types
        event_type_mapping = {
            AuditAction.LOGIN: EventType.LOGIN_SUCCESS,
            AuditAction.LOGOUT: EventType.LOGOUT,
            AuditAction.CREATE: EventType.DATA_MODIFIED,
            AuditAction.UPDATE: EventType.DATA_MODIFIED,
            AuditAction.DELETE: EventType.DATA_DELETED,
            AuditAction.APPROVE: EventType.DATA_MODIFIED,
            AuditAction.REJECT: EventType.DATA_MODIFIED,
            AuditAction.PERMISSION_CHANGE: EventType.PERMISSION_GRANTED,
            AuditAction.SETTINGS_UPDATE: EventType.CONFIGURATION_CHANGED,
            AuditAction.FILE_UPLOAD: EventType.DATA_IMPORTED,
            AuditAction.FILE_DOWNLOAD: EventType.DATA_EXPORT,
            AuditAction.EXPORT: EventType.DATA_EXPORT,
            AuditAction.IMPORT: EventType.DATA_IMPORT,
            AuditAction.BACKUP: EventType.SYSTEM_BACKUP,
            AuditAction.RESTORE: EventType.SYSTEM_RESTORE,
            AuditAction.IMPERSONATE: EventType.SUSPICIOUS_ACTIVITY,
        }
        
        # Determine event category and severity
        if action in [AuditAction.LOGIN, AuditAction.LOGOUT]:
            category = EventCategory.SECURITY
            event_type = event_type_mapping.get(action, EventType.LOGIN_SUCCESS)
            severity = EventSeverity.INFO
        elif action in [AuditAction.PERMISSION_CHANGE, AuditAction.IMPERSONATE]:
            category = EventCategory.SECURITY
            event_type = event_type_mapping.get(action, EventType.PERMISSION_GRANTED)
            severity = EventSeverity.HIGH
        elif action in [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE]:
            category = EventCategory.BUSINESS
            event_type = event_type_mapping.get(action, EventType.DATA_MODIFIED)
            severity = EventSeverity.MEDIUM
        elif action in [AuditAction.EXPORT, AuditAction.IMPORT]:
            category = EventCategory.DATA
            event_type = event_type_mapping.get(action, EventType.DATA_EXPORT)
            severity = EventSeverity.MEDIUM
        elif action in [AuditAction.BACKUP, AuditAction.RESTORE]:
            category = EventCategory.SYSTEM
            event_type = event_type_mapping.get(action, EventType.SYSTEM_BACKUP)
            severity = EventSeverity.HIGH
        else:
            category = EventCategory.USER
            event_type = EventType.DATA_MODIFIED
            severity = EventSeverity.INFO
        
        # Override severity if provided
        if severity:
            try:
                severity = EventSeverity(severity) if isinstance(severity, str) else severity
            except ValueError:
                severity = EventSeverity.INFO
        
        # Create event description
        if not description:
            description = f"Audit action: {action.value} on {entity_type}"
            if entity_id:
                description += f" (ID: {entity_id})"
            if user_id:
                description += f" by user {user_id}"
        
        # Create event monitoring entry
        event_monitor.log_event(
            category=category,
            event_type=event_type,
            severity=severity,
            description=description,
            details={
                'audit_action': action.value,
                'audit_log_id': audit_log.id,
                'metadata': metadata or {}
            },
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            old_values=old_values,
            new_values=new_values,
            user_id=str(user_id) if user_id else None,
            business_id=str(business_id) if business_id else None,
            tags=['audit', action.value, entity_type]
        )
        
    except Exception as e:
        # Don't let event monitoring errors break audit logging
        print(f"Failed to create event monitoring entry: {str(e)}")
    
    db.session.commit()
    return audit_log

# Decorator for automatic audit logging
def audit_action(action: AuditAction, entity_type: str, get_entity_id=None, 
                get_old_values=None, get_new_values=None, severity=None):
    """Decorator to automatically log function calls as audit entries"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Execute the function
            result = func(*args, **kwargs)
            
            try:
                # Get user and business context
                from flask_jwt_extended import get_jwt_identity
                user_id = get_jwt_identity()
                business_id = getattr(g, 'business_id', None)
                
                # Get entity ID
                entity_id = None
                if get_entity_id:
                    entity_id = get_entity_id(result, *args, **kwargs)
                elif hasattr(result, 'id'):
                    entity_id = result.id
                
                # Get old and new values
                old_values = None
                new_values = None
                if get_old_values:
                    old_values = get_old_values(*args, **kwargs)
                if get_new_values:
                    new_values = get_new_values(result, *args, **kwargs)
                
                # Create audit log
                create_audit_log(
                    user_id=user_id,
                    business_id=business_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    old_values=old_values,
                    new_values=new_values,
                    severity=severity,
                    description=f"Automatic audit: {action.value} on {entity_type}"
                )
                
            except Exception as e:
                # Don't let audit logging errors break the application
                print(f"Failed to create automatic audit log for {func.__name__}: {str(e)}")
            
            return result
        return wrapper
    return decorator
