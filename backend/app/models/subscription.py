from app import db
from datetime import datetime
from enum import Enum

class PlanType(Enum):
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    TRIAL = "trial"
    PENDING = "pending"

class Plan(db.Model):
    __tablename__ = 'plans'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    plan_type = db.Column(db.Enum(PlanType), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, yearly
    max_users = db.Column(db.Integer, default=1)
    max_products = db.Column(db.Integer, default=100)
    max_orders = db.Column(db.Integer, default=1000)
    max_branches = db.Column(db.Integer, default=1)
    features = db.Column(db.JSON)  # JSON array of feature names
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = db.relationship('Subscription', back_populates='plan', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'plan_type': self.plan_type.value,
            'price': float(self.price) if self.price else 0.0,
            'billing_cycle': self.billing_cycle,
            'max_users': self.max_users,
            'max_products': self.max_products,
            'max_orders': self.max_orders,
            'max_branches': self.max_branches,
            'features': self.features or [],
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    status = db.Column(db.Enum(SubscriptionStatus), default=SubscriptionStatus.PENDING, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    auto_renew = db.Column(db.Boolean, default=True, nullable=False)
    payment_method = db.Column(db.String(50))
    last_payment_date = db.Column(db.DateTime)
    next_billing_date = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='subscriptions')
    plan = db.relationship('Plan', back_populates='subscriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'plan_id': self.plan_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'status': self.status.value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'auto_renew': self.auto_renew,
            'payment_method': self.payment_method,
            'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None,
            'next_billing_date': self.next_billing_date.isoformat() if self.next_billing_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
