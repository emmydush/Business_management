from app import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)  # original filename
    path = db.Column(db.String(1024), nullable=False)    # stored relative path
    mimetype = db.Column(db.String(100))
    size = db.Column(db.Integer)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    view_count = db.Column(db.Integer, default=0)
    download_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'filename': self.filename,
            'path': self.path,
            'mimetype': self.mimetype,
            'size': self.size,
            'uploaded_by': self.uploaded_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'view_count': self.view_count,
            'download_count': self.download_count
        }