"""
Event Monitoring and Audit API Routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
from app.models.event import EventLog, EventAlert, EventReport
from app.models.user import User
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func, desc
import json

# Create blueprint
events_bp = Blueprint('events', __name__)

@events_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    """Get events with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        category = request.args.get('category')
        event_type = request.args.get('event_type')
        severity = request.args.get('severity')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        user_filter = request.args.get('user_id')
        
        # Build query
        query = EventLog.query
        
        # Filter by business (non-superadmins can only see their business events)
        if user.role.value != 'superadmin':
            query = query.filter(EventLog.business_id == user.business_id)
        
        # Apply filters
        if category:
            query = query.filter(EventLog.category == category)
        if event_type:
            query = query.filter(EventLog.event_type == event_type)
        if severity:
            query = query.filter(EventLog.severity == severity)
        if user_filter:
            query = query.filter(EventLog.user_id == user_filter)
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(EventLog.timestamp >= start_dt)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format'}), 400
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(EventLog.timestamp <= end_dt)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format'}), 400
        
        # Order by timestamp descending
        query = query.order_by(desc(EventLog.timestamp))
        
        # Paginate
        events = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'events': [event.to_dict() for event in events.items],
            'pagination': {
                'page': events.page,
                'per_page': events.per_page,
                'total': events.total,
                'pages': events.pages,
                'has_next': events.has_next,
                'has_prev': events.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/statistics', methods=['GET'])
@jwt_required()
def get_event_statistics():
    """Get event statistics for dashboard"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        business_id = request.args.get('business_id')
        
        # Validate days parameter
        if days < 1 or days > 365:
            return jsonify({'error': 'Days must be between 1 and 365'}), 400
        
        # Determine business filter
        filter_business_id = business_id if user.role.value == 'superadmin' else user.business_id
        
        # Get statistics using event monitor
        stats = event_monitor.get_event_statistics(
            business_id=filter_business_id,
            days=days
        )
        
        # Add additional statistics
        start_date = datetime.utcnow() - timedelta(days=days)
        query = EventLog.query.filter(EventLog.timestamp >= start_date)
        
        if filter_business_id:
            query = query.filter(EventLog.business_id == filter_business_id)
        
        # Recent critical events
        critical_events = query.filter(EventLog.severity == 'critical').order_by(desc(EventLog.timestamp)).limit(5).all()
        
        # Top users by activity
        top_users = query.with_entities(
            EventLog.user_id,
            func.count(EventLog.id).label('count')
        ).filter(EventLog.user_id.isnot(None)).group_by(EventLog.user_id).order_by(desc('count')).limit(10).all()
        
        # Get user details for top users
        top_user_details = []
        for user_id, count in top_users:
            user_record = User.query.get(user_id)
            if user_record:
                top_user_details.append({
                    'user_id': user_id,
                    'username': user_record.username,
                    'first_name': user_record.first_name,
                    'last_name': user_record.last_name,
                    'event_count': count
                })
        
        stats['recent_critical_events'] = [event.to_dict() for event in critical_events]
        stats['top_users'] = top_user_details
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/<event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    """Get specific event details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get event
        event = EventLog.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check permissions (non-superadmins can only see their business events)
        if user.role.value != 'superadmin' and event.business_id != user.business_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(event.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/export', methods=['POST'])
@jwt_required()
def export_events():
    """Export events to CSV/Excel"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate export parameters
        format_type = data.get('format', 'csv')
        if format_type not in ['csv', 'excel']:
            return jsonify({'error': 'Format must be csv or excel'}), 400
        
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date are required'}), 400
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Limit date range to prevent excessive exports
        if (end_dt - start_dt).days > 90:
            return jsonify({'error': 'Date range cannot exceed 90 days'}), 400
        
        # Log export event
        event_monitor.log_event(
            category=EventCategory.DATA,
            event_type=EventType.DATA_EXPORT,
            severity=EventSeverity.MEDIUM,
            description=f"Events exported by user {user.username}",
            details={
                'format': format_type,
                'start_date': start_date,
                'end_date': end_date,
                'requested_by': user.id
            },
            entity_type='event_export',
            user_id=str(user.id),
            business_id=str(user.business_id),
            tags=['export', 'events', format_type]
        )
        
        # Create audit log
        from app.models.audit_log import create_audit_log, AuditAction
        create_audit_log(
            user_id=user.id,
            business_id=user.business_id,
            action=AuditAction.EXPORT,
            entity_type='events',
            entity_id=None,
            metadata={
                'format': format_type,
                'start_date': start_date,
                'end_date': end_date
            }
        )
        
        # TODO: Implement actual export logic
        # Generate CSV/Excel file and return download URL
        
        return jsonify({
            'message': 'Export request received',
            'format': format_type,
            'start_date': start_date,
            'end_date': end_date,
            'status': 'processing'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get event alerts for the business"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get alerts for this business
        alerts = EventAlert.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).order_by(EventAlert.created_at.desc()).all()
        
        return jsonify({
            'alerts': [alert.to_dict() for alert in alerts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/alerts', methods=['POST'])
@jwt_required()
def create_alert():
    """Create a new event alert"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'event_category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate category
        valid_categories = [cat.value for cat in EventCategory]
        if data['event_category'] not in valid_categories:
            return jsonify({'error': 'Invalid event_category'}), 400
        
        # Create alert
        alert = EventAlert(
            business_id=user.business_id,
            name=data['name'],
            description=data.get('description', ''),
            event_category=data['event_category'],
            event_type=data.get('event_type'),
            severity=data.get('severity'),
            conditions=data.get('conditions', {}),
            notification_channels=data.get('notification_channels', {}),
            created_by=user.id
        )
        
        db.session.add(alert)
        db.session.commit()
        
        # Log alert creation
        event_monitor.log_event(
            category=EventCategory.SYSTEM,
            event_type=EventType.CONFIGURATION_CHANGED,
            severity=EventSeverity.INFO,
            description=f"Event alert created: {alert.name}",
            details={
                'alert_id': alert.id,
                'alert_name': alert.name,
                'event_category': alert.event_category
            },
            entity_type='event_alert',
            entity_id=alert.id,
            user_id=str(user.id),
            business_id=str(user.business_id),
            tags=['alert', 'created', 'configuration']
        )
        
        return jsonify({
            'message': 'Alert created successfully',
            'alert': alert.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/alerts/<alert_id>', methods=['PUT'])
@jwt_required()
def update_alert(alert_id):
    """Update an event alert"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        alert = EventAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Check permissions
        if alert.business_id != user.business_id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Update alert
        if 'name' in data:
            alert.name = data['name']
        if 'description' in data:
            alert.description = data['description']
        if 'event_type' in data:
            alert.event_type = data['event_type']
        if 'severity' in data:
            alert.severity = data['severity']
        if 'conditions' in data:
            alert.conditions = data['conditions']
        if 'notification_channels' in data:
            alert.notification_channels = data['notification_channels']
        if 'is_active' in data:
            alert.is_active = data['is_active']
        
        alert.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log alert update
        event_monitor.log_event(
            category=EventCategory.SYSTEM,
            event_type=EventType.CONFIGURATION_CHANGED,
            severity=EventSeverity.INFO,
            description=f"Event alert updated: {alert.name}",
            details={
                'alert_id': alert.id,
                'alert_name': alert.name,
                'changes': data
            },
            entity_type='event_alert',
            entity_id=alert.id,
            user_id=str(user.id),
            business_id=str(user.business_id),
            tags=['alert', 'updated', 'configuration']
        )
        
        return jsonify({
            'message': 'Alert updated successfully',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/alerts/<alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    """Delete an event alert"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        alert = EventAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Check permissions
        if alert.business_id != user.business_id:
            return jsonify({'error': 'Access denied'}), 403
        
        alert_name = alert.name
        db.session.delete(alert)
        db.session.commit()
        
        # Log alert deletion
        event_monitor.log_event(
            category=EventCategory.SYSTEM,
            event_type=EventType.CONFIGURATION_CHANGED,
            severity=EventSeverity.INFO,
            description=f"Event alert deleted: {alert_name}",
            details={
                'alert_id': alert_id,
                'alert_name': alert_name
            },
            entity_type='event_alert',
            entity_id=alert_id,
            user_id=str(user.id),
            business_id=str(user.business_id),
            tags=['alert', 'deleted', 'configuration']
        )
        
        return jsonify({'message': 'Alert deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
