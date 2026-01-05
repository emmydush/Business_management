from app import db
from datetime import datetime
from enum import Enum

class ExpenseCategory(Enum):
    OFFICE_SUPPLIES = "office_supplies"
    TRAVEL = "travel"
    MEALS = "meals"
    EQUIPMENT = "equipment"
    RENT = "rent"
    UTILITIES = "utilities"
    MARKETING = "marketing"
    OTHER = "other"

class ExpenseStatus(Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    expense_id = db.Column(db.String(20), nullable=False)  # Unique per business
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.Enum(ExpenseCategory), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(ExpenseStatus), default=ExpenseStatus.PENDING_APPROVAL, nullable=False)
    receipt_image = db.Column(db.String(255))  # Path to receipt image
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.Date)
    paid_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', back_populates='expenses')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_expenses')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_expenses')
    
    # Unique constraint per business
    __table_args__ = (db.UniqueConstraint('business_id', 'expense_id', name='_business_expense_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'expense_id': self.expense_id,
            'description': self.description,
            'amount': float(self.amount) if self.amount else 0.0,
            'category': self.category.value,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'status': self.status.value,
            'receipt_image': self.receipt_image,
            'notes': self.notes,
            'created_by': self.created_by,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }