from app import db
from datetime import datetime


class PaymentStatus:
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    provider = db.Column(db.String(50))
    provider_reference = db.Column(db.String(200), unique=True)
    status = db.Column(db.String(50), default=PaymentStatus.PENDING)
    meta = db.Column('metadata', db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', backref='payments')
    subscription = db.relationship('Subscription', backref='payments')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'subscription_id': self.subscription_id,
            'amount': float(self.amount) if self.amount is not None else 0.0,
            'provider': self.provider,
            'provider_reference': self.provider_reference,
            'status': self.status,
            'metadata': self.meta,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
