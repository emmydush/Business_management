from app import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.Time)
    check_out_time = db.Column(db.Time)
    status = db.Column(db.String(20), default='present')  # present, absent, late, early_departure
    hours_worked = db.Column(db.Numeric(4, 2), default=0.00)
    work_location = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='attendance_records')
    business = db.relationship('Business', back_populates='attendance_records')
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'employee_id': self.employee_id,
            'date': self.date.isoformat() if self.date else None,
            'check_in_time': self.check_in_time.strftime('%H:%M:%S') if self.check_in_time else None,
            'check_out_time': self.check_out_time.strftime('%H:%M:%S') if self.check_out_time else None,
            'status': self.status,
            'hours_worked': float(self.hours_worked) if self.hours_worked else 0.0,
            'work_location': self.work_location,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'employee': {'id': self.employee.id, 'employee_id': self.employee.employee_id, 'first_name': self.employee.user.first_name if self.employee.user else None, 'last_name': self.employee.user.last_name if self.employee.user else None, 'department': self.employee.department, 'position': self.employee.position} if self.employee else None
        }