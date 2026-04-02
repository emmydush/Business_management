"""
Event model for comprehensive audit logging and monitoring
"""

from datetime import datetime
from app import db
import json

class EventLog(db.Model):
    """Event log model for storing all application events"""
    __tablename__ = 'event_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    event_type = db.Column(db.String(100), nullable=False, index=True)
    severity = db.Column(db.String(20), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=False, index=True)
    user_agent = db.Column(db.Text, nullable=True)
    endpoint = db.Column(db.String(255), nullable=True, index=True)
    method = db.Column(db.String(10), nullable=True)
    description = db.Column(db.Text, nullable=False)
    details = db.Column(db.JSON, nullable=True)
    entity_type = db.Column(db.String(100), nullable=True, index=True)
    entity_id = db.Column(db.String(36), nullable=True, index=True)
    old_values = db.Column(db.JSON, nullable=True)
    new_values = db.Column(db.JSON, nullable=True)
    session_id = db.Column(db.String(255), nullable=True, index=True)
    correlation_id = db.Column(db.String(36), nullable=False, index=True)
    source = db.Column(db.String(50), nullable=False, default='application')
    tags = db.Column(db.JSON, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='events', lazy='select')
    business = db.relationship('Business', backref='events', lazy='select')
    
    def __repr__(self):
        return f'<EventLog {self.id}: {self.category}.{self.event_type}>'
    
    def to_dict(self):
        """Convert event to dictionary"""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'category': self.category,
            'event_type': self.event_type,
            'severity': self.severity,
            'user_id': self.user_id,
            'business_id': self.business_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'method': self.method,
            'description': self.description,
            'details': self.details,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'session_id': self.session_id,
            'correlation_id': self.correlation_id,
            'source': self.source,
            'tags': self.tags
        }
    
    @classmethod
    def create_indexes(cls):
        """Create database indexes for better performance"""
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_category_severity ON event_logs(category, severity)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_user_timestamp ON event_logs(user_id, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_business_timestamp ON event_logs(business_id, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_entity ON event_logs(entity_type, entity_id)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_correlation ON event_logs(correlation_id)',
            'CREATE INDEX IF NOT EXISTS idx_event_logs_ip_timestamp ON event_logs(ip_address, timestamp)',
        ]
        
        for index_sql in indexes:
            try:
                db.session.execute(index_sql)
            except Exception as e:
                print(f"Index creation failed: {e}")
        
        db.session.commit()

class EventAlert(db.Model):
    """Event alert configuration for notifications"""
    __tablename__ = 'event_alerts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_category = db.Column(db.String(50), nullable=True)
    event_type = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(20), nullable=True)
    conditions = db.Column(db.JSON, nullable=True)  # Custom conditions for triggering
    notification_channels = db.Column(db.JSON, nullable=True)  # Email, Slack, etc.
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    business = db.relationship('Business', backref='event_alerts')
    creator = db.relationship('User', backref='created_alerts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'name': self.name,
            'description': self.description,
            'event_category': self.event_category,
            'event_type': self.event_type,
            'severity': self.severity,
            'conditions': self.conditions,
            'notification_channels': self.notification_channels,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }

class EventReport(db.Model):
    """Generated event reports for compliance and analysis"""
    __tablename__ = 'event_reports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    report_type = db.Column(db.String(50), nullable=False)  # security, business, compliance
    filters = db.Column(db.JSON, nullable=True)
    date_range_start = db.Column(db.DateTime, nullable=False)
    date_range_end = db.Column(db.DateTime, nullable=False)
    file_path = db.Column(db.String(500), nullable=True)
    file_size = db.Column(db.BigInteger, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, generating, completed, failed
    generated_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    business = db.relationship('Business', backref='event_reports')
    creator = db.relationship('User', backref='created_reports')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'name': self.name,
            'description': self.description,
            'report_type': self.report_type,
            'filters': self.filters,
            'date_range_start': self.date_range_start.isoformat() if self.date_range_start else None,
            'date_range_end': self.date_range_end.isoformat() if self.date_range_end else None,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'status': self.status,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_by': self.created_by
        }

# Import uuid for default values
import uuid
