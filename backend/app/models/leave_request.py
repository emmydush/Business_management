from app import db
from datetime import datetime
from enum import Enum

class LeaveType(Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    UNPAID = "unpaid"
    OTHER = "other"

class LeaveStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.Enum(LeaveType), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    days_requested = db.Column(db.Integer, nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='leave_requests')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_leaves')
    business = db.relationship('Business', back_populates='leave_requests')
    branch = db.relationship('Branch', backref='leave_requests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'employee_id': self.employee_id,
            'leave_type': self.leave_type.value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'reason': self.reason,
            'status': self.status.value,
            'days_requested': self.days_requested,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'employee': {'id': self.employee.id, 'employee_id': self.employee.employee_id, 'first_name': self.employee.user.first_name if self.employee and self.employee.user else None, 'last_name': self.employee.user.last_name if self.employee and self.employee.user else None, 'department': self.employee.department, 'position': self.employee.position} if self.employee else None,
            'approver': {'id': self.approver.id, 'first_name': self.approver.first_name, 'last_name': self.approver.last_name, 'username': self.approver.username} if self.approver else None
        }