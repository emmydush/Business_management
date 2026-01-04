from app import db
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime


class CompanyProfile(db.Model):
    __tablename__ = 'company_profiles'
    
    id = Column(Integer, primary_key=True)
    company_name = Column(String(200), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    website = Column(String(200))
    logo_url = Column(String(200))
    tax_rate = Column(db.Numeric(5, 2), default=0.00)
    currency = Column(String(3), default='USD')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'website': self.website,
            'logo_url': self.logo_url,
            'tax_rate': float(self.tax_rate) if self.tax_rate else 0.0,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserPermission(db.Model):
    __tablename__ = 'user_permissions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    module = Column(String(50), nullable=False)  # e.g., 'dashboard', 'sales', 'inventory'
    permission = Column(String(50), nullable=False)  # e.g., 'read', 'write', 'delete'
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship('User', backref='permissions')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'module': self.module,
            'permission': self.permission,
            'granted': self.granted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'role': self.user.role.value if self.user.role else None
            } if self.user else None
        }


class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    
    id = Column(Integer, primary_key=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text)
    setting_type = Column(String(20), default='string')  # string, integer, boolean, json
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'setting_type': self.setting_type,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., 'user_created', 'settings_updated'
    resource_type = Column(String(50))  # e.g., 'user', 'settings', 'product'
    resource_id = Column(Integer)  # ID of the resource affected
    old_values = Column(Text)  # JSON string of old values
    new_values = Column(Text)  # JSON string of new values
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship('User', backref='audit_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name
            } if self.user else None
        }