from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import staff_required
from app.utils.middleware import module_required, get_business_id
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        
        # Proactively check for things that need notification
        from app.models.product import Product
        from app.models.leave_request import LeaveRequest, LeaveStatus
        from app.utils.notifications import notify_managers
        from datetime import date, timedelta
        
        # 1. Check Low Stock
        low_stock_products = Product.query.filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level,
            Product.is_active == True
        ).all()
        
        for product in low_stock_products:
            title = "Low Stock Alert"
            msg = f"Product '{product.name}' is low on stock ({product.stock_quantity})."
            if product.stock_quantity == 0:
                title = "Out of Stock Alert"
                msg = f"Product '{product.name}' is out of stock!"
            
            # Check if notification already exists for this product today
            existing = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.message.contains(product.name),
                Notification.created_at >= datetime.utcnow() - timedelta(days=1)
            ).first()
            
            if not existing:
                notify_managers(business_id, title, msg, 'warning' if product.stock_quantity > 0 else 'danger')

        # 2. Check Expired Products
        today = date.today()
        expired_products = Product.query.filter(
            Product.business_id == business_id,
            Product.expiry_date <= today,
            Product.is_active == True
        ).all()
        
        for product in expired_products:
            title = "Expired Product Alert"
            msg = f"Product '{product.name}' expired on {product.expiry_date}!"
            
            existing = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.message.contains(product.name)
            ).first()
            
            if not existing:
                notify_managers(business_id, title, msg, 'danger')

        # 3. Check Pending Leave Requests (for managers/admins)
        user = User.query.get(user_id)
        from app.models.user import UserRole
        if user.role in [UserRole.admin, UserRole.manager, UserRole.superadmin]:
            pending_leaves = LeaveRequest.query.filter(
                LeaveRequest.business_id == business_id,
                LeaveRequest.status == LeaveStatus.PENDING
            ).all()
            
            for leave in pending_leaves:
                title = "Pending Leave Request"
                msg = f"New leave request from {leave.employee.user.first_name} {leave.employee.user.last_name}."
                
                existing = Notification.query.filter(
                    Notification.business_id == business_id,
                    Notification.user_id == user_id,
                    Notification.title == title,
                    Notification.message.contains(leave.employee.user.last_name)
                ).first()
                
                if not existing:
                    notify_managers(business_id, title, msg, 'info')

        # 4. Check Overdue Invoices
        from app.models.invoice import Invoice, InvoiceStatus
        overdue_invoices = Invoice.query.filter(
            Invoice.business_id == business_id,
            Invoice.due_date < today,
            Invoice.status != InvoiceStatus.PAID
        ).all()
        
        for inv in overdue_invoices:
            title = "Overdue Invoice"
            msg = f"Invoice {inv.invoice_id} for {inv.customer.first_name} {inv.customer.last_name} is overdue!"
            
            existing = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.message.contains(inv.invoice_id)
            ).first()
            
            if not existing:
                notify_managers(business_id, title, msg, 'danger')

        # Now fetch all notifications
        query = Notification.query.filter_by(business_id=business_id, user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications],
            'pagination': {
                'total_unread': Notification.query.filter_by(business_id=business_id, user_id=user_id, is_read=False).count()
            }
        }), 200
        
    except Exception as e:
        print(f"Notification Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/notifications/<int:notification_id>', methods=['PUT'])
@jwt_required()
@module_required('communication')
def mark_notification_read(notification_id):
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            business_id=business_id,
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        
        db.session.query(Notification).filter_by(
            business_id=business_id,
            user_id=user_id,
            is_read=False
        ).update({Notification.is_read: True}, synchronize_session=False)
        
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        message_type = request.args.get('type', 'inbox')  # inbox, sent
        
        if message_type == 'sent':
            messages = Message.query.filter_by(business_id=business_id, sender_id=user_id).order_by(Message.created_at.desc()).all()
        else:
            messages = Message.query.filter_by(business_id=business_id, recipient_id=user_id).order_by(Message.created_at.desc()).all()
        
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Ensure recipient belongs to the same business
        recipient = User.query.filter_by(business_id=business_id, username=data.get('recipient')).first()
        if not recipient:
            return jsonify({'error': 'Recipient not found for this business'}), 404
        
        message = Message(
            business_id=business_id,
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        
        message = Message.query.filter(
            Message.business_id == business_id,
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
        business_id = get_business_id()
        user_id = get_jwt_identity()
        
        message = Message.query.filter_by(
            id=message_id,
            business_id=business_id,
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
        business_id = get_business_id()
        
        announcements = Announcement.query.filter_by(
            business_id=business_id,
            is_published=True
        ).order_by(Announcement.published_at.desc()).all()
        
        return jsonify({
            'announcements': [announcement.to_dict() for announcement in announcements]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements', methods=['POST'])
@jwt_required()
@module_required('communication')
@staff_required
def create_announcement():
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        announcement = Announcement(
            business_id=business_id,
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
@staff_required
def update_announcement(announcement_id):
    try:
        business_id = get_business_id()
        
        announcement = Announcement.query.filter_by(id=announcement_id, business_id=business_id).first()
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
@staff_required
def delete_announcement(announcement_id):
    try:
        business_id = get_business_id()
        announcement = Announcement.query.filter_by(id=announcement_id, business_id=business_id).first()
        if not announcement:
            return jsonify({'error': 'Announcement not found'}), 404
            
        db.session.delete(announcement)
        db.session.commit()
        
        return jsonify({'message': 'Announcement deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
