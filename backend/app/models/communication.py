from app import db
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default='info')  # info, success, warning, danger
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='notifications')
    business = relationship('Business', back_populates='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name
            } if self.user else None
        }


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    business = relationship('Business', back_populates='messages')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'subject': self.subject,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender': {
                'id': self.sender.id,
                'username': self.sender.username,
                'first_name': self.sender.first_name,
                'last_name': self.sender.last_name
            } if self.sender else None,
            'recipient': {
                'id': self.recipient.id,
                'username': self.recipient.username,
                'first_name': self.recipient.first_name,
                'last_name': self.recipient.last_name
            } if self.recipient else None
        }


class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey('businesses.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    author = relationship('User', backref='announcements')
    business = relationship('Business', back_populates='announcements')

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'author_id': self.author_id,
            'title': self.title,
            'content': self.content,
            'priority': self.priority,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'author': {
                'id': self.author.id,
                'username': self.author.username,
                'first_name': self.author.first_name,
                'last_name': self.author.last_name
            } if self.author else None
        }