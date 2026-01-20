from app import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project = db.Column(db.String(100)) # Optional project name
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    due_date = db.Column(db.Date)
    priority = db.Column(db.String(20), default='medium') # low, medium, high, critical
    status = db.Column(db.String(50), default='pending') # pending, in-progress, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = db.relationship('Business', backref=db.backref('tasks', lazy=True))
    branch = db.relationship('Branch', backref=db.backref('tasks', lazy=True))
    assignee = db.relationship('User', backref=db.backref('assigned_tasks', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'title': self.title,
            'description': self.description,
            'project': self.project,
            'assigned_to': self.assigned_to,
            'assignee_name': f"{self.assignee.first_name} {self.assignee.last_name}" if self.assignee else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
