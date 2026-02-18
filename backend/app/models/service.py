from app import db
from datetime import datetime
from enum import Enum

class AppointmentStatus(Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    appointment_id = db.Column(db.String(20), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    notes = db.Column(db.Text)
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_pattern = db.Column(db.String(50))  # daily, weekly, monthly
    
    reminder_sent = db.Column(db.Boolean, default=False)
    confirmation_sent = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='appointments')
    branch = db.relationship('Branch', backref='appointments')
    customer = db.relationship('Customer', backref='appointments')
    service = db.relationship('Service', backref='appointments')
    employee = db.relationship('Employee', backref='appointments')
    user = db.relationship('User', backref='appointments')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'appointment_id', name='_business_appointment_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'appointment_id': self.appointment_id,
            'customer_id': self.customer_id,
            'customer': self.customer.to_dict() if self.customer else None,
            'service_id': self.service_id,
            'service': self.service.to_dict() if self.service else None,
            'employee_id': self.employee_id,
            'employee': self.employee.to_dict() if self.employee else None,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status.value,
            'notes': self.notes,
            'is_recurring': self.is_recurring,
            'recurring_pattern': self.recurring_pattern,
            'reminder_sent': self.reminder_sent,
            'confirmation_sent': self.confirmation_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    service_id = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    
    duration_minutes = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    cost = db.Column(db.Numeric(10, 2))
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_interval = db.Column(db.Integer)  # days
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='services')
    branch = db.relationship('Branch', backref='services')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'service_id', name='_business_service_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'service_id': self.service_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'duration_minutes': self.duration_minutes,
            'price': float(self.price) if self.price else 0.0,
            'cost': float(self.cost) if self.cost else None,
            'is_active': self.is_active,
            'is_recurring': self.is_recurring,
            'recurring_interval': self.recurring_interval,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TimeEntry(db.Model):
    __tablename__ = 'time_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    entry_id = db.Column(db.String(20), nullable=False)
    
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Link to order/project/task if applicable
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    
    entry_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time)
    duration_minutes = db.Column(db.Integer, default=0)
    
    description = db.Column(db.Text)
    hourly_rate = db.Column(db.Numeric(10, 2))
    total_amount = db.Column(db.Numeric(10, 2), default=0.00)
    
    is_billable = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='time_entries')
    branch = db.relationship('Branch', backref='time_entries')
    employee = db.relationship('Employee', backref='time_entries')
    user = db.relationship('User', foreign_keys=[user_id], backref='time_entries')
    order = db.relationship('Order', backref='time_entries')
    task = db.relationship('Task', backref='time_entries')
    approver = db.relationship('User', foreign_keys=[approved_by])
    
    __table_args__ = (db.UniqueConstraint('business_id', 'entry_id', name='_business_entry_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'entry_id': self.entry_id,
            'employee_id': self.employee_id,
            'employee': self.employee.to_dict() if self.employee else None,
            'user_id': self.user_id,
            'order_id': self.order_id,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'description': self.description,
            'hourly_rate': float(self.hourly_rate) if self.hourly_rate else None,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'is_billable': self.is_billable,
            'is_approved': self.is_approved,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class QuoteStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CONVERTED = "converted"

class Quote(db.Model):
    __tablename__ = 'quotes'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    quote_id = db.Column(db.String(20), nullable=False)
    
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Link to converted order
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    
    quote_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    valid_until = db.Column(db.Date, nullable=False)
    
    status = db.Column(db.Enum(QuoteStatus), default=QuoteStatus.DRAFT, nullable=False)
    
    subtotal = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    
    notes = db.Column(db.Text)
    terms = db.Column(db.Text)
    
    viewed_at = db.Column(db.DateTime)
    converted_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='quotes')
    branch = db.relationship('Branch', backref='quotes')
    customer = db.relationship('Customer', back_populates='quotes')
    user = db.relationship('User', backref='quotes')
    order = db.relationship('Order', backref='quote')
    items = db.relationship('QuoteItem', back_populates='quote', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'quote_id', name='_business_quote_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'quote_id': self.quote_id,
            'customer_id': self.customer_id,
            'customer': self.customer.to_dict() if self.customer else None,
            'user_id': self.user_id,
            'order_id': self.order_id,
            'quote_date': self.quote_date.isoformat() if self.quote_date else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'status': self.status.value,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'notes': self.notes,
            'terms': self.terms,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
            'converted_at': self.converted_at.isoformat() if self.converted_at else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class QuoteItem(db.Model):
    __tablename__ = 'quote_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey('quotes.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    
    description = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0.00)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quote = db.relationship('Quote', back_populates='items')
    product = db.relationship('Product', backref='quote_items')
    service = db.relationship('Service', backref='quote_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quote_id': self.quote_id,
            'product_id': self.product_id,
            'service_id': self.service_id,
            'description': self.description,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'discount_percent': float(self.discount_percent) if self.discount_percent else 0.0,
            'line_total': float(self.line_total) if self.line_total else 0.0,
            'product_name': self.product.name if self.product else None,
            'service_name': self.service.name if self.service else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
