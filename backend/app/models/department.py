from app import db
from datetime import datetime

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    head_id = db.Column(db.Integer, db.ForeignKey('employees.id'))  # Department head
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = db.relationship('Business', backref='departments')
    head = db.relationship('Employee', foreign_keys=[head_id], backref='headed_departments')
    employees = db.relationship('Employee', backref='department_obj', foreign_keys='Employee.department_id')
    
    # Unique constraint per business
    __table_args__ = (db.UniqueConstraint('business_id', 'name', name='_business_department_name_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'name': self.name,
            'description': self.description,
            'head_id': self.head_id,
            'head_name': f"{self.head.user.first_name} {self.head.user.last_name}" if self.head and self.head.user else None,
            'employee_count': len(self.employees),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }