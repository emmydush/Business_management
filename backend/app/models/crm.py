from app import db
from datetime import datetime
from enum import Enum

class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignType(Enum):
    EMAIL = "email"
    SMS = "sms"
    SOCIAL = "social"
    AD = "ad"
    LOYALTY = "loyalty"
    PROMOTION = "promotion"

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    campaign_id = db.Column(db.String(20), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    campaign_type = db.Column(db.Enum(CampaignType), nullable=False)
    status = db.Column(db.Enum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Scheduling
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    schedule_time = db.Column(db.Time)
    
    # Content
    subject = db.Column(db.String(500))
    body = db.Column(db.Text)
    template_id = db.Column(db.String(50))
    
    # Targeting
    segment_id = db.Column(db.Integer, db.ForeignKey('segments.id'), nullable=True)
    
    # Metrics
    target_count = db.Column(db.Integer, default=0)
    sent_count = db.Column(db.Integer, default=0)
    delivered_count = db.Column(db.Integer, default=0)
    opened_count = db.Column(db.Integer, default=0)
    clicked_count = db.Column(db.Integer, default=0)
    converted_count = db.Column(db.Integer, default=0)
    
    budget = db.Column(db.Numeric(10, 2), default=0.00)
    actual_cost = db.Column(db.Numeric(10, 2), default=0.00)
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='campaigns')
    branch = db.relationship('Branch', backref='campaigns')
    segment = db.relationship('Segment', backref='campaigns')
    creator = db.relationship('User', backref='campaigns')
    emails = db.relationship('CampaignEmail', back_populates='campaign', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'campaign_id', name='_business_campaign_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'campaign_id': self.campaign_id,
            'name': self.name,
            'description': self.description,
            'campaign_type': self.campaign_type.value,
            'status': self.status.value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'schedule_time': self.schedule_time.strftime('%H:%M') if self.schedule_time else None,
            'subject': self.subject,
            'body': self.body,
            'template_id': self.template_id,
            'segment_id': self.segment_id,
            'segment': self.segment.to_dict() if self.segment else None,
            'target_count': self.target_count,
            'sent_count': self.sent_count,
            'delivered_count': self.delivered_count,
            'opened_count': self.opened_count,
            'clicked_count': self.clicked_count,
            'converted_count': self.converted_count,
            'budget': float(self.budget) if self.budget else 0.0,
            'actual_cost': float(self.actual_cost) if self.actual_cost else 0.0,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class CampaignEmail(db.Model):
    __tablename__ = 'campaign_emails'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    
    email = db.Column(db.String(120), nullable=False)
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    opened_at = db.Column(db.DateTime)
    clicked_at = db.Column(db.DateTime)
    
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    campaign = db.relationship('Campaign', back_populates='emails')
    customer = db.relationship('Customer', backref='campaign_emails')
    lead = db.relationship('Lead', backref='campaign_emails')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'customer_id': self.customer_id,
            'lead_id': self.lead_id,
            'email': self.email,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Segment(db.Model):
    __tablename__ = 'segments'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    segment_id = db.Column(db.String(20), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Dynamic segment criteria stored as JSON
    criteria = db.Column(db.JSON)  # {"field": "total_spent", "operator": ">", "value": 1000}
    criteria_logic = db.Column(db.String(10), default='AND')  # AND, OR
    
    # Static segment - manually added contacts
    is_static = db.Column(db.Boolean, default=False)
    
    # Counts (cached)
    customer_count = db.Column(db.Integer, default=0)
    lead_count = db.Column(db.Integer, default=0)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='segments')
    branch = db.relationship('Branch', backref='segments')
    creator = db.relationship('User', backref='segments')
    members = db.relationship('SegmentMember', back_populates='segment', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'segment_id', name='_business_segment_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'segment_id': self.segment_id,
            'name': self.name,
            'description': self.description,
            'criteria': self.criteria,
            'criteria_logic': self.criteria_logic,
            'is_static': self.is_static,
            'customer_count': self.customer_count,
            'lead_count': self.lead_count,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SegmentMember(db.Model):
    __tablename__ = 'segment_members'
    
    id = db.Column(db.Integer, primary_key=True)
    segment_id = db.Column(db.Integer, db.ForeignKey('segments.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    segment = db.relationship('Segment', back_populates='members')
    customer = db.relationship('Customer', backref='segment_members')
    lead = db.relationship('Lead', backref='segment_members')
    
    __table_args__ = (db.UniqueConstraint('segment_id', 'customer_id', name='_segment_customer_uc'),)
    

class LoyaltyProgram(db.Model):
    __tablename__ = 'loyalty_programs'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    program_id = db.Column(db.String(20), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Points configuration
    points_per_currency = db.Column(db.Numeric(10, 2), default=1.00)  # Points earned per currency unit
    currency_per_point = db.Column(db.Numeric(10, 2), default=0.01)  # Currency value per point
    
    # Membership tiers
    has_tiers = db.Column(db.Boolean, default=False)
    tiers = db.Column(db.JSON)  # [{"name": "Silver", "min_points": 0}, {"name": "Gold", "min_points": 1000}]
    
    # Expiration
    points_expire_days = db.Column(db.Integer)  # Days until points expire, null = never
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='loyalty_programs')
    branch = db.relationship('Branch', backref='loyalty_programs')
    members = db.relationship('LoyaltyMember', back_populates='program', lazy=True, cascade='all, delete-orphan')
    rewards = db.relationship('LoyaltyReward', back_populates='program', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'program_id', name='_business_program_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'program_id': self.program_id,
            'name': self.name,
            'description': self.description,
            'points_per_currency': float(self.points_per_currency) if self.points_per_currency else 1.0,
            'currency_per_point': float(self.currency_per_point) if self.currency_per_point else 0.01,
            'has_tiers': self.has_tiers,
            'tiers': self.tiers,
            'points_expire_days': self.points_expire_days,
            'is_active': self.is_active,
            'member_count': len(self.members),
            'reward_count': len(self.rewards),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LoyaltyMember(db.Model):
    __tablename__ = 'loyalty_members'
    
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('loyalty_programs.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    
    member_number = db.Column(db.String(20), nullable=False)
    points_balance = db.Column(db.Integer, default=0)
    points_earned = db.Column(db.Integer, default=0)
    points_redeemed = db.Column(db.Integer, default=0)
    points_expired = db.Column(db.Integer, default=0)
    
    # Tier status
    current_tier = db.Column(db.String(50))
    tier_start_date = db.Column(db.Date)
    lifetime_value = db.Column(db.Numeric(10, 2), default=0.00)
    
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    program = db.relationship('LoyaltyProgram', back_populates='members')
    customer = db.relationship('Customer', backref='loyalty_members')
    transactions = db.relationship('LoyaltyTransaction', back_populates='member', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('program_id', 'customer_id', name='_program_customer_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'program_id': self.program_id,
            'program': self.program.to_dict() if self.program else None,
            'customer_id': self.customer_id,
            'customer': self.customer.to_dict() if self.customer else None,
            'member_number': self.member_number,
            'points_balance': self.points_balance,
            'points_earned': self.points_earned,
            'points_redeemed': self.points_redeemed,
            'points_expired': self.points_expired,
            'current_tier': self.current_tier,
            'tier_start_date': self.tier_start_date.isoformat() if self.tier_start_date else None,
            'lifetime_value': float(self.lifetime_value) if self.lifetime_value else 0.0,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'last_activity_at': self.last_activity_at.isoformat() if self.last_activity_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LoyaltyTransaction(db.Model):
    __tablename__ = 'loyalty_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('loyalty_members.id'), nullable=False)
    
    transaction_type = db.Column(db.String(20), nullable=False)  # earn, redeem, expire, adjust
    points = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    
    # Reference to order/invoice/reward
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    reward_id = db.Column(db.Integer, db.ForeignKey('loyalty_rewards.id'), nullable=True)
    
    description = db.Column(db.String(500))
    expires_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    member = db.relationship('LoyaltyMember', back_populates='transactions')
    order = db.relationship('Order', backref='loyalty_transactions')
    invoice = db.relationship('Invoice', backref='loyalty_transactions')
    reward = db.relationship('LoyaltyReward', backref='loyalty_transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'transaction_type': self.transaction_type,
            'points': self.points,
            'balance_after': self.balance_after,
            'order_id': self.order_id,
            'invoice_id': self.invoice_id,
            'reward_id': self.reward_id,
            'description': self.description,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LoyaltyReward(db.Model):
    __tablename__ = 'loyalty_rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('loyalty_programs.id'), nullable=False)
    reward_id = db.Column(db.String(20), nullable=False)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    reward_type = db.Column(db.String(50), nullable=False)  # discount, product, service, voucher
    
    points_required = db.Column(db.Integer, nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2))
    discount_amount = db.Column(db.Numeric(10, 2))
    free_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    free_service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    voucher_code = db.Column(db.String(50))
    
    quantity_available = db.Column(db.Integer)
    quantity_claimed = db.Column(db.Integer, default=0)
    
    valid_from = db.Column(db.Date)
    valid_until = db.Column(db.Date)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    program = db.relationship('LoyaltyProgram', back_populates='rewards')
    free_product = db.relationship('Product', backref='loyalty_rewards')
    free_service = db.relationship('Service', backref='loyalty_rewards')
    
    __table_args__ = (db.UniqueConstraint('program_id', 'reward_id', name='_program_reward_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'program_id': self.program_id,
            'reward_id': self.reward_id,
            'name': self.name,
            'description': self.description,
            'reward_type': self.reward_type,
            'points_required': self.points_required,
            'discount_percent': float(self.discount_percent) if self.discount_percent else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount else None,
            'free_product_id': self.free_product_id,
            'free_service_id': self.free_service_id,
            'voucher_code': self.voucher_code,
            'quantity_available': self.quantity_available,
            'quantity_claimed': self.quantity_claimed,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
