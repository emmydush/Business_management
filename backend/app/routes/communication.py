from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import staff_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        user_id = get_jwt_identity()
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        
        # Proactively check for things that need notification
        from app.models.product import Product
        from app.models.leave_request import LeaveRequest, LeaveStatus
        from app.utils.notifications import notify_managers
        from datetime import date, timedelta
        
        # 1. Check Low Stock
        low_stock_query = Product.query.filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level,
            Product.is_active == True
        )
        if branch_id:
            low_stock_query = low_stock_query.filter(Product.branch_id == branch_id)
        
        low_stock_products = low_stock_query.all()
        
        for product in low_stock_products:
            title = "Low Stock Alert"
            msg = f"Product '{product.name}' is low on stock ({product.stock_quantity})."
            if product.stock_quantity == 0:
                title = "Out of Stock Alert"
                msg = f"Product '{product.name}' is out of stock!"
            
            # Check if notification already exists for this business/branch today
            existing_query = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.title == title,
                Notification.message.contains(product.name),
                Notification.created_at >= datetime.utcnow() - timedelta(days=1)
            )
            if branch_id:
                existing_query = existing_query.filter(Notification.branch_id == branch_id)
            
            existing = existing_query.first()
            
            if not existing:
                # Note: notify_managers might need to be updated to accept branch_id
                # For now, we'll just create the notification manually if needed, 
                # but let's assume notify_managers handles it or we'll update it later.
                notify_managers(business_id, title, msg, 'warning' if product.stock_quantity > 0 else 'danger')

        # 2. Check Expired Products
        today = date.today()
        expired_query = Product.query.filter(
            Product.business_id == business_id,
            Product.expiry_date <= today,
            Product.is_active == True
        )
        if branch_id:
            expired_query = expired_query.filter(Product.branch_id == branch_id)
            
        expired_products = expired_query.all()
        
        for product in expired_products:
            title = "Expired Product Alert"
            msg = f"Product '{product.name}' expired on {product.expiry_date}!"
            
            existing_query = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.title == title,
                Notification.message.contains(product.name),
                Notification.created_at >= datetime.utcnow() - timedelta(days=1)
            )
            if branch_id:
                existing_query = existing_query.filter(Notification.branch_id == branch_id)
                
            existing = existing_query.first()
            
            if not existing:
                notify_managers(business_id, title, msg, 'danger')

        # 3. Check Pending Leave Requests (for managers/admins)
        user = User.query.get(user_id)
        from app.models.user import UserRole
        if user.role in [UserRole.admin, UserRole.manager, UserRole.superadmin]:
            pending_leaves_query = LeaveRequest.query.filter(
                LeaveRequest.business_id == business_id,
                LeaveRequest.status == LeaveStatus.PENDING
            )
            # Leave requests are linked to employees, which are linked to branches
            # So we might need to join or filter by employee's branch
            
            pending_leaves = pending_leaves_query.all()
            
            for leave in pending_leaves:
                # Filter by branch if requested
                if branch_id and leave.employee.branch_id != branch_id:
                    continue
                    
                title = "Pending Leave Request"
                msg = f"New leave request from {leave.employee.user.first_name} {leave.employee.user.last_name}."
                
                existing_query = Notification.query.filter(
                    Notification.business_id == business_id,
                    Notification.title == title,
                    Notification.message.contains(leave.employee.user.last_name),
                    Notification.created_at >= datetime.utcnow() - timedelta(days=1)
                )
                if branch_id:
                    existing_query = existing_query.filter(Notification.branch_id == branch_id)
                    
                existing = existing_query.first()
                
                if not existing:
                    notify_managers(business_id, title, msg, 'info')

        # 4. Check Overdue Invoices
        from app.models.invoice import Invoice, InvoiceStatus
        overdue_invoices_query = Invoice.query.filter(
            Invoice.business_id == business_id,
            Invoice.due_date < today,
            Invoice.status != InvoiceStatus.PAID
        )
        if branch_id:
            overdue_invoices_query = overdue_invoices_query.filter(Invoice.branch_id == branch_id)
            
        overdue_invoices = overdue_invoices_query.all()
        
        for inv in overdue_invoices:
            title = "Overdue Invoice"
            msg = f"Invoice {inv.invoice_id} for {inv.customer.first_name} {inv.customer.last_name} is overdue!"
            
            existing_query = Notification.query.filter(
                Notification.business_id == business_id,
                Notification.title == title,
                Notification.message.contains(inv.invoice_id),
                Notification.created_at >= datetime.utcnow() - timedelta(days=1)
            )
            if branch_id:
                existing_query = existing_query.filter(Notification.branch_id == branch_id)
                
            existing = existing_query.first()
            
            if not existing:
                notify_managers(business_id, title, msg, 'danger')

        # Now fetch all notifications
        query = Notification.query.filter_by(business_id=business_id, user_id=user_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
        
        unread_count_query = Notification.query.filter_by(business_id=business_id, user_id=user_id, is_read=False)
        if branch_id:
            unread_count_query = unread_count_query.filter_by(branch_id=branch_id)
            
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications],
            'pagination': {
                'total_unread': unread_count_query.count()
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = db.session.query(Notification).filter_by(
            business_id=business_id,
            user_id=user_id,
            is_read=False
        )
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
            
        query.update({Notification.is_read: True}, synchronize_session=False)
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
@module_required('communication')
def delete_notification(notification_id):
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
            
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notification deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/notifications/clear-all', methods=['DELETE'])
@jwt_required()
@module_required('communication')
def clear_all_notifications():
    try:
        business_id = get_business_id()
        user_id = get_jwt_identity()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = Notification.query.filter_by(
            business_id=business_id,
            user_id=user_id
        )
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
            
        query.delete(synchronize_session=False)
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications cleared'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Messages API
@communication_bp.route('/messages', methods=['GET'])
@jwt_required()
@module_required('communication')
def get_messages():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        user_id = get_jwt_identity()
        message_type = request.args.get('type', 'inbox')  # inbox, sent
        
        query = Message.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
            
        if message_type == 'sent':
            messages = query.filter_by(sender_id=user_id).order_by(Message.created_at.desc()).all()
        else:
            messages = query.filter_by(recipient_id=user_id).order_by(Message.created_at.desc()).all()
        
        return jsonify({
            'messages': [message.to_dict() for message in messages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/messages', methods=['POST'])
@jwt_required()
@module_required('communication')
@subscription_required
def send_message():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Ensure recipient belongs to the same business
        recipient = User.query.filter_by(business_id=business_id, username=data.get('recipient')).first()
        if not recipient:
            return jsonify({'error': 'Recipient not found for this business'}), 404
        
        message = Message(
            business_id=business_id,
            branch_id=branch_id,
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
@subscription_required
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
        if 'branch_id' in data:
            message.branch_id = data['branch_id']
            
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = Announcement.query.filter_by(
            business_id=business_id,
            is_published=True
        )
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
            
        announcements = query.order_by(Announcement.published_at.desc()).all()
        
        return jsonify({
            'announcements': [announcement.to_dict() for announcement in announcements]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements', methods=['POST'])
@jwt_required()
@module_required('communication')
@staff_required
@subscription_required
def create_announcement():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        announcement = Announcement(
            business_id=business_id,
            branch_id=branch_id,
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
@subscription_required
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
        if 'branch_id' in data:
            announcement.branch_id = data['branch_id']
        
        db.session.commit()
        
        return jsonify({'message': 'Announcement updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@communication_bp.route('/announcements/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
@module_required('communication')
@staff_required
@subscription_required
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
