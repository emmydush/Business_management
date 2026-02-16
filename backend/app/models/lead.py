from app import db
from datetime import datetime

class Lead(db.Model):
    __tablename__ = 'leads'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200))
    contact_name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    value = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='new')  # new, contacted, qualified, proposal, negotiation, won, lost
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', back_populates='leads')
    branch = db.relationship('Branch', backref=db.backref('leads', lazy=True))
    assignee = db.relationship('User', backref=db.backref('assigned_leads', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'title': self.title,
            'company': self.company,
            'contact_name': self.contact_name,
            'email': self.email,
            'phone': self.phone,
            'value': self.value,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'assignee_name': f"{self.assignee.first_name} {self.assignee.last_name}" if self.assignee else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
