from app import db
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime


# Predefined list of allowed currencies for validation
ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'RWF', 'KES', 'TZS', 'UGX', 'BIF', 'CDF', 'ZAR', 'NGN', 'GHS']

class CompanyProfile(db.Model):
    __tablename__ = 'company_profiles'
    # Allowed currencies: USD, EUR, GBP, RWF, KES, TZS, UGX, BIF, CDF, ZAR, NGN, GHS
    ALLOWED_CURRENCIES = ALLOWED_CURRENCIES  # Make available to instances
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    company_name = Column(String(200), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    website = Column(String(200))
    logo_url = Column(String(200))
    tax_rate = Column(db.Numeric(5, 2), default=0.00)
    currency = Column(String(3), default='RWF')  # Must be in ALLOWED_CURRENCIES list
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    business = relationship('Business', back_populates='company_profile')

    def is_valid_currency(self):
        """Validate if the currency is in the allowed list"""
        return self.currency in self.ALLOWED_CURRENCIES
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
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
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    module = Column(String(50), nullable=False)  # e.g., 'dashboard', 'sales', 'inventory'
    permission = Column(String(50), nullable=False)  # e.g., 'read', 'write', 'delete'
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='permissions')
    business = relationship('Business', back_populates='permissions')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
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
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=True) # Null for global settings
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(Text)
    setting_type = Column(String(20), default='string')  # string, integer, boolean, json
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    business = relationship('Business', back_populates='system_settings')

    # Unique constraint for business-specific settings
    __table_args__ = (db.UniqueConstraint('business_id', 'setting_key', name='_business_setting_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'setting_type': self.setting_type,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


