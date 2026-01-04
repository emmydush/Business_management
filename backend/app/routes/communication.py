from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import staff_required
from app.utils.middleware import module_required
from datetime import datetime
from sqlalchemy import func

communication_bp = Blueprint('communication', __name__)

# Import the models from the models module
from app.models.communication import Notification, Message, Announcement

# Notifications API
@communication_bp.route('/notifications', methods=['GET'])
@jwt_required()
@module_required('communication')
def get_notifications():
    try:
        user_id = get_jwt_identity()
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).all()
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/notifications/<int:notification_id>', methods=['PUT'])
@jwt_required()
@module_required('communication')
def mark_notification_read(notification_id):
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
            
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
@module_required('communication')
def mark_all_notifications_read():
    try:
        user_id = get_jwt_identity()
        
        db.session.query(Notification).filter_by(
            user_id=user_id,
            is_read=False
        ).update({Notification.is_read: True})
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Messages API
@communication_bp.route('/messages', methods=['GET'])
@jwt_required()
@module_required('communication')
def get_messages():
    try:
        user_id = get_jwt_identity()
        message_type = request.args.get('type', 'inbox')  # inbox, sent
        
        if message_type == 'sent':
            messages = Message.query.filter_by(sender_id=user_id).order_by(Message.created_at.desc()).all()
        else:
            messages = Message.query.filter_by(recipient_id=user_id).order_by(Message.created_at.desc()).all()
        
        return jsonify({
            'messages': [message.to_dict() for message in messages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/messages', methods=['POST'])
@jwt_required()
@module_required('communication')
def send_message():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        recipient = User.query.filter_by(username=data.get('recipient')).first()
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
        
        message = Message(
            sender_id=user_id,
            recipient_id=recipient.id,
            subject=data.get('subject'),
            content=data.get('content')
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': 'Message sent successfully',
            'message_data': message.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/messages/<int:message_id>', methods=['GET'])
@jwt_required()
@module_required('communication')
def get_message(message_id):
    try:
        user_id = get_jwt_identity()
        
        message = Message.query.filter(
            ((Message.sender_id == user_id) | (Message.recipient_id == user_id)),
            Message.id == message_id
        ).first()
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
            
        # Mark as read if recipient
        if message.recipient_id == user_id and not message.is_read:
            message.is_read = True
            db.session.commit()
        
        return jsonify({'message': message.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/messages/<int:message_id>', methods=['PUT'])
@jwt_required()
@module_required('communication')
def update_message(message_id):
    try:
        user_id = get_jwt_identity()
        
        message = Message.query.filter_by(
            id=message_id,
            recipient_id=user_id
        ).first()
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
            
        data = request.get_json()
        if 'is_read' in data:
            message.is_read = data['is_read']
            db.session.commit()
        
        return jsonify({'message': 'Message updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Announcements API
@communication_bp.route('/announcements', methods=['GET'])
@jwt_required()
@module_required('communication')
def get_announcements():
    try:
        user_id = get_jwt_identity()
        
        announcements = Announcement.query.filter_by(is_published=True).order_by(Announcement.published_at.desc()).all()
        
        return jsonify({
            'announcements': [announcement.to_dict() for announcement in announcements]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements', methods=['POST'])
@jwt_required()
@module_required('communication')
@staff_required  # Only staff can create announcements
def create_announcement():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        announcement = Announcement(
            author_id=user_id,
            title=data.get('title'),
            content=data.get('content'),
            priority=data.get('priority', 'normal')
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements/<int:announcement_id>', methods=['PUT'])
@jwt_required()
@module_required('communication')
@staff_required  # Only staff can update announcements
def update_announcement(announcement_id):
    try:
        user_id = get_jwt_identity()
        
        announcement = Announcement.query.filter_by(id=announcement_id).first()
        if not announcement:
            return jsonify({'error': 'Announcement not found'}), 404
            
        data = request.get_json()
        if 'title' in data:
            announcement.title = data['title']
        if 'content' in data:
            announcement.content = data['content']
        if 'priority' in data:
            announcement.priority = data['priority']
        if 'is_published' in data:
            announcement.is_published = data['is_published']
        
        db.session.commit()
        
        return jsonify({'message': 'Announcement updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
@module_required('communication')
@staff_required  # Only staff can delete announcements
def delete_announcement(announcement_id):
    try:
        announcement = Announcement.query.filter_by(id=announcement_id).first()
        if not announcement:
            return jsonify({'error': 'Announcement not found'}), 404
            
        db.session.delete(announcement)
        db.session.commit()
        
        return jsonify({'message': 'Announcement deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


