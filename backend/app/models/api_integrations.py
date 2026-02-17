from app import db
from datetime import datetime
from enum import Enum

class APIClientType(Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    PARTNER = "partner"

class WebhookEvent(Enum):
    ORDER_CREATED = "order.created"
    ORDER_UPDATED = "order.updated"
    ORDER_STATUS_CHANGED = "order.status_changed"
    INVOICE_CREATED = "invoice.created"
    INVOICE_PAID = "invoice.paid"
    CUSTOMER_CREATED = "customer.created"
    CUSTOMER_UPDATED = "customer.updated"
    LEAD_CREATED = "lead.created"
    LEAD_CONVERTED = "lead.converted"
    PAYMENT_RECEIVED = "payment.received"
    PAYMENT_FAILED = "payment.failed"
    PRODUCT_CREATED = "product.created"
    PRODUCT_UPDATED = "product.updated"
    INVENTORY_LOW = "inventory.low"
    APPOINTMENT_CREATED = "appointment.created"
    APPOINTMENT_UPDATED = "appointment.updated"
    QUOTE_CREATED = "quote.created"
    QUOTE_ACCEPTED = "quote.accepted"

class APIClient(db.Model):
    __tablename__ = 'api_clients'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    
    client_id = db.Column(db.String(50), unique=True, nullable=False)
    client_name = db.Column(db.String(200), nullable=False)
    client_type = db.Column(db.Enum(APIClientType), default=APIClientType.PRIVATE, nullable=False)
    
    # Authentication
    client_secret = db.Column(db.String(255), nullable=False)
    
    # Permissions
    scopes = db.Column(db.JSON)  # List of allowed scopes
    
    # Rate limiting
    rate_limit_per_hour = db.Column(db.Integer, default=1000)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_used_at = db.Column(db.DateTime)
    
    # Metadata
    redirect_uris = db.Column(db.JSON)  # For OAuth
    allowed_ips = db.Column(db.JSON)  # IP whitelist
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='api_clients')
    creator = db.relationship('User', backref='api_clients')
    access_tokens = db.relationship('APIAccessToken', back_populates='client', lazy=True, cascade='all, delete-orphan')
    webhook_subscriptions = db.relationship('WebhookSubscription', back_populates='client', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_secret=False):
        result = {
            'id': self.id,
            'business_id': self.business_id,
            'client_id': self.client_id,
            'client_name': self.client_name,
            'client_type': self.client_type.value,
            'scopes': self.scopes,
            'rate_limit_per_hour': self.rate_limit_per_hour,
            'is_active': self.is_active,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'redirect_uris': self.redirect_uris,
            'allowed_ips': self.allowed_ips,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_secret:
            result['client_secret'] = self.client_secret
        return result


class APIAccessToken(db.Model):
    __tablename__ = 'api_access_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('api_clients.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Optional user association
    
    token = db.Column(db.String(255), unique=True, nullable=False)
    token_type = db.Column(db.String(20), default='Bearer')
    
    # Scopes for this specific token
    scopes = db.Column(db.JSON)
    
    expires_at = db.Column(db.DateTime)
    last_used_at = db.Column(db.DateTime)
    
    is_revoked = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    client = db.relationship('APIClient', back_populates='access_tokens')
    user = db.relationship('User', backref='api_access_tokens')
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'user_id': self.user_id,
            'token_type': self.token_type,
            'scopes': self.scopes,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'is_revoked': self.is_revoked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class WebhookSubscription(db.Model):
    __tablename__ = 'webhook_subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('api_clients.id'), nullable=False)
    
    subscription_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    
    # Events to subscribe to
    events = db.Column(db.JSON, nullable=False)  # List of WebhookEvent values
    
    # Webhook URL
    webhook_url = db.Column(db.String(500), nullable=False)
    
    # Secret for signature verification
    webhook_secret = db.Column(db.String(255), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Delivery settings
    retry_count = db.Column(db.Integer, default=3)
    timeout_seconds = db.Column(db.Integer, default=30)
    
    # Filters
    filters = db.Column(db.JSON)  # Optional filters for events
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = db.relationship('APIClient', back_populates='webhook_subscriptions')
    creator = db.relationship('User', backref='webhook_subscriptions')
    deliveries = db.relationship('WebhookDelivery', back_populates='subscription', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_secret=False):
        result = {
            'id': self.id,
            'client_id': self.client_id,
            'subscription_id': self.subscription_id,
            'name': self.name,
            'events': self.events,
            'webhook_url': self.webhook_url,
            'is_active': self.is_active,
            'retry_count': self.retry_count,
            'timeout_seconds': self.timeout_seconds,
            'filters': self.filters,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_secret:
            result['webhook_secret'] = self.webhook_secret
        return result


class WebhookDelivery(db.Model):
    __tablename__ = 'webhook_deliveries'
    
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('webhook_subscriptions.id'), nullable=False)
    
    delivery_id = db.Column(db.String(50), unique=True, nullable=False)
    event = db.Column(db.String(100), nullable=False)
    
    # Payload
    payload = db.Column(db.JSON, nullable=False)
    payload_signature = db.Column(db.String(255))
    
    # Delivery status
    status = db.Column(db.String(20), nullable=False)  # pending, success, failed
    
    # Response
    response_status_code = db.Column(db.Integer)
    response_body = db.Column(db.Text)
    
    # Retry tracking
    attempt = db.Column(db.Integer, default=1)
    next_retry_at = db.Column(db.DateTime)
    
    delivered_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    subscription = db.relationship('WebhookSubscription', back_populates='deliveries')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'delivery_id': self.delivery_id,
            'event': self.event,
            'payload': self.payload,
            'status': self.status,
            'response_status_code': self.response_status_code,
            'response_body': self.response_body,
            'attempt': self.attempt,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Currency(db.Model):
    __tablename__ = 'currencies'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(3), unique=True, nullable=False)  # ISO 4217 code
    name = db.Column(db.String(100), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    
    # Exchange rate to base currency (USD)
    exchange_rate = db.Column(db.Numeric(15, 6), default=1.0)
    is_base = db.Column(db.Boolean, default=False)
    
    # Formatting
    decimal_places = db.Column(db.Integer, default=2)
    decimal_separator = db.Column(db.String(1), default='.')
    thousands_separator = db.Column(db.String(1), default=',')
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'symbol': self.symbol,
            'exchange_rate': float(self.exchange_rate) if self.exchange_rate else 1.0,
            'is_base': self.is_base,
            'decimal_places': self.decimal_places,
            'decimal_separator': self.decimal_separator,
            'thousands_separator': self.thousands_separator,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ExchangeRate(db.Model):
    __tablename__ = 'exchange_rates'
    
    id = db.Column(db.Integer, primary_key=True)
    from_currency = db.Column(db.String(3), db.ForeignKey('currencies.code'), nullable=False)
    to_currency = db.Column(db.String(3), db.ForeignKey('currencies.code'), nullable=False)
    
    rate = db.Column(db.Numeric(15, 6), nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    from_curr = db.relationship('Currency', foreign_keys=[from_currency])
    to_curr = db.relationship('Currency', foreign_keys=[to_currency])
    
    __table_args__ = (
        db.UniqueConstraint('from_currency', 'to_currency', 'effective_date', name='_exchange_rate_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'from_currency': self.from_currency,
            'to_currency': self.to_currency,
            'rate': float(self.rate) if self.rate else 1.0,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CustomField(db.Model):
    __tablename__ = 'custom_fields'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    
    field_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Field type
    field_type = db.Column(db.String(50), nullable=False)  # text, number, date, datetime, select, multiselect, boolean, file, currency
    
    # Options for select/multiselect
    options = db.Column(db.JSON)  # {"choices": ["Option 1", "Option 2"]}
    
    # Validation
    is_required = db.Column(db.Boolean, default=False)
    default_value = db.Column(db.String(500))
    min_value = db.Column(db.Numeric(15, 2))
    max_value = db.Column(db.Numeric(15, 2))
    pattern = db.Column(db.String(500))  # Regex pattern
    
    # Entity type this field applies to
    entity_type = db.Column(db.String(50), nullable=False)  # customer, order, invoice, product, lead, employee
    
    # Display settings
    display_order = db.Column(db.Integer, default=0)
    is_visible = db.Column(db.Boolean, default=True)
    is_searchable = db.Column(db.Boolean, default=False)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='custom_fields')
    creator = db.relationship('User', backref='custom_fields')
    values = db.relationship('CustomFieldValue', back_populates='field', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'entity_type', 'field_id', name='_business_entity_field_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'field_id': self.field_id,
            'name': self.name,
            'description': self.description,
            'field_type': self.field_type,
            'options': self.options,
            'is_required': self.is_required,
            'default_value': self.default_value,
            'min_value': float(self.min_value) if self.min_value else None,
            'max_value': float(self.max_value) if self.max_value else None,
            'pattern': self.pattern,
            'entity_type': self.entity_type,
            'display_order': self.display_order,
            'is_visible': self.is_visible,
            'is_searchable': self.is_searchable,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class CustomFieldValue(db.Model):
    __tablename__ = 'custom_field_values'
    
    id = db.Column(db.Integer, primary_key=True)
    field_id = db.Column(db.Integer, db.ForeignKey('custom_fields.id'), nullable=False)
    
    # Entity reference
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    
    value = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    field = db.relationship('CustomField', back_populates='values')
    
    __table_args__ = (db.UniqueConstraint('field_id', 'entity_type', 'entity_id', name='_field_entity_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'field_id': self.field_id,
            'field': self.field.to_dict() if self.field else None,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'value': self.value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class DocumentTemplate(db.Model):
    __tablename__ = 'document_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    
    template_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Template type
    template_type = db.Column(db.String(50), nullable=False)  # invoice, quote, receipt, order, purchase_order, delivery_note
    
    # Template content
    content = db.Column(db.Text, nullable=False)  # HTML/JSON template
    template_format = db.Column(db.String(20), default='html')  # html, json, markdown
    
    # Default settings
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Styling
    header_color = db.Column(db.String(7))  # Hex color
    logo_url = db.Column(db.String(500))
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='document_templates')
    branch = db.relationship('Branch', backref='document_templates')
    creator = db.relationship('User', backref='document_templates')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'template_type', 'template_id', name='_business_template_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'template_id': self.template_id,
            'name': self.name,
            'description': self.description,
            'template_type': self.template_type,
            'content': self.content,
            'template_format': self.template_format,
            'is_default': self.is_default,
            'is_active': self.is_active,
            'header_color': self.header_color,
            'logo_url': self.logo_url,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
