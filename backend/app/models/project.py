from app import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    client = db.Column(db.String(200), nullable=False)
    budget = db.Column(db.Numeric(10, 2), default=0.00)
    spent = db.Column(db.Numeric(10, 2), default=0.00)
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default='new')  # new, planning, active, in-progress, on-hold, completed
    progress = db.Column(db.Integer, default=0)  # 0-100
    members = db.Column(db.Integer, default=1)
    description = db.Column(db.Text)
    
    # Foreign key to business
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    business = db.relationship('Business', back_populates='projects')
    tasks = db.relationship('Task', back_populates='project', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'client': self.client,
            'budget': float(self.budget) if self.budget else 0,
            'spent': float(self.spent) if self.spent else 0,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'progress': self.progress,
            'members': self.members,
            'description': self.description,
            'business_id': self.business_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Project {self.title}>'
