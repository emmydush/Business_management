from app import db
from datetime import datetime
from enum import Enum

class PayrollStatus(Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"

class Payroll(db.Model):
    __tablename__ = 'payrolls'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    pay_period_start = db.Column(db.Date, nullable=False)
    pay_period_end = db.Column(db.Date, nullable=False)
    basic_salary = db.Column(db.Numeric(10, 2), nullable=False)
    allowances = db.Column(db.Numeric(10, 2), default=0.00)
    overtime_pay = db.Column(db.Numeric(10, 2), default=0.00)
    bonuses = db.Column(db.Numeric(10, 2), default=0.00)
    gross_pay = db.Column(db.Numeric(10, 2), nullable=False)
    tax_deductions = db.Column(db.Numeric(10, 2), default=0.00)
    other_deductions = db.Column(db.Numeric(10, 2), default=0.00)
    net_pay = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum(PayrollStatus), default=PayrollStatus.DRAFT, nullable=False)
    payment_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='payroll_records')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_payrolls')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_payrolls')
    business = db.relationship('Business', back_populates='payrolls')
    branch = db.relationship('Branch', backref='payrolls')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'employee_id': self.employee_id,
            'pay_period_start': self.pay_period_start.isoformat() if self.pay_period_start else None,
            'pay_period_end': self.pay_period_end.isoformat() if self.pay_period_end else None,
            'basic_salary': float(self.basic_salary) if self.basic_salary else 0.0,
            'allowances': float(self.allowances) if self.allowances else 0.0,
            'overtime_pay': float(self.overtime_pay) if self.overtime_pay else 0.0,
            'bonuses': float(self.bonuses) if self.bonuses else 0.0,
            'gross_pay': float(self.gross_pay) if self.gross_pay else 0.0,
            'tax_deductions': float(self.tax_deductions) if self.tax_deductions else 0.0,
            'other_deductions': float(self.other_deductions) if self.other_deductions else 0.0,
            'net_pay': float(self.net_pay) if self.net_pay else 0.0,
            'status': self.status.value,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'notes': self.notes,
            'created_by': self.created_by,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'employee': {'id': self.employee.id, 'employee_id': self.employee.employee_id, 'first_name': self.employee.user.first_name if self.employee and self.employee.user else None, 'last_name': self.employee.user.last_name if self.employee and self.employee.user else None, 'department': self.employee.department, 'position': self.employee.position} if self.employee else None,
            'creator': {'id': self.creator.id, 'first_name': self.creator.first_name, 'last_name': self.creator.last_name, 'username': self.creator.username} if self.creator else None,
            'approver': {'id': self.approver.id, 'first_name': self.approver.first_name, 'last_name': self.approver.last_name, 'username': self.approver.username} if self.approver else None
        }