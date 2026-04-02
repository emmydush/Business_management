"""
Comprehensive Event Monitoring and Audit Logging System
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from enum import Enum
from flask import request, g
from app import db
import logging
from dataclasses import dataclass, asdict
import traceback

class EventSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class EventCategory(Enum):
    SECURITY = "security"
    BUSINESS = "business"
    SYSTEM = "system"
    USER = "user"
    DATA = "data"
    COMPLIANCE = "compliance"
    PERFORMANCE = "performance"

class EventType(Enum):
    # Security Events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    MFA_VERIFICATION = "mfa_verification"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
    XSS_ATTEMPT = "xss_attempt"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    FILE_UPLOAD_BLOCKED = "file_upload_blocked"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    
    # Business Events
    ORDER_CREATED = "order_created"
    ORDER_UPDATED = "order_updated"
    ORDER_CANCELLED = "order_cancelled"
    PAYMENT_RECEIVED = "payment_received"
    INVOICE_GENERATED = "invoice_generated"
    PRODUCT_CREATED = "product_created"
    PRODUCT_UPDATED = "product_updated"
    PRODUCT_DELETED = "product_deleted"
    CUSTOMER_CREATED = "customer_created"
    CUSTOMER_UPDATED = "customer_updated"
    EXPENSE_CREATED = "expense_created"
    EXPENSE_APPROVED = "expense_approved"
    EXPENSE_REJECTED = "expense_rejected"
    
    # System Events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    ROLE_CHANGED = "role_changed"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    SYSTEM_BACKUP = "system_backup"
    SYSTEM_RESTORE = "system_restore"
    CONFIGURATION_CHANGED = "configuration_changed"
    
    # Data Events
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    DATA_MODIFIED = "data_modified"
    DATA_DELETED = "data_deleted"
    SENSITIVE_DATA_ACCESSED = "sensitive_data_accessed"
    
    # Compliance Events
    GDPR_REQUEST = "gdpr_request"
    AUDIT_LOG_ACCESSED = "audit_log_accessed"
    COMPLIANCE_VIOLATION = "compliance_violation"
    
    # Performance Events
    SLOW_QUERY = "slow_query"
    HIGH_MEMORY_USAGE = "high_memory_usage"
    API_RATE_LIMIT = "api_rate_limit"
    SYSTEM_ERROR = "system_error"

@dataclass
class Event:
    id: str
    timestamp: datetime
    category: EventCategory
    event_type: EventType
    severity: EventSeverity
    user_id: Optional[str]
    business_id: Optional[str]
    ip_address: str
    user_agent: str
    endpoint: str
    method: str
    description: str
    details: Dict[str, Any]
    entity_type: Optional[str]
    entity_id: Optional[str]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    session_id: Optional[str]
    correlation_id: str
    source: str
    tags: List[str]

class EventMonitor:
    """Comprehensive event monitoring system"""
    
    def __init__(self, app=None):
        self.app = app
        self.logger = logging.getLogger('event_monitor')
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize event monitor with Flask app"""
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        app.teardown_appcontext(self._teardown_request)
        
        # Configure event logger
        handler = logging.FileHandler(app.config.get('EVENT_LOG_FILE', 'logs/events.log'))
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def _before_request(self):
        """Store request context for event logging"""
        g.request_start_time = datetime.utcnow()
        g.correlation_id = str(uuid.uuid4())
        g.session_id = getattr(g, 'session_id', None)
    
    def _after_request(self, response):
        """Log request completion"""
        try:
            if hasattr(g, 'request_start_time'):
                duration = (datetime.utcnow() - g.request_start_time).total_seconds()
                
                # Log slow requests
                if duration > 5.0:  # 5 seconds threshold
                    self.log_event(
                        category=EventCategory.PERFORMANCE,
                        event_type=EventType.SLOW_QUERY,
                        severity=EventSeverity.MEDIUM,
                        description=f"Slow request: {request.endpoint} took {duration:.2f}s",
                        details={
                            'duration': duration,
                            'status_code': response.status_code,
                            'response_size': len(response.get_data())
                        }
                    )
        except Exception as e:
            self.logger.error(f"Error in after_request: {str(e)}")
        
        return response
    
    def _teardown_request(self, exception):
        """Log any unhandled exceptions"""
        if exception:
            self.log_event(
                category=EventCategory.SYSTEM,
                event_type=EventType.SYSTEM_ERROR,
                severity=EventSeverity.HIGH,
                description=f"Unhandled exception: {str(exception)}",
                details={
                    'exception_type': type(exception).__name__,
                    'traceback': traceback.format_exc()
                }
            )
    
    def log_event(self, 
                  category: EventCategory,
                  event_type: EventType,
                  severity: EventSeverity = EventSeverity.INFO,
                  description: str = "",
                  details: Dict[str, Any] = None,
                  entity_type: str = None,
                  entity_id: str = None,
                  old_values: Dict[str, Any] = None,
                  new_values: Dict[str, Any] = None,
                  user_id: str = None,
                  business_id: str = None,
                  tags: List[str] = None) -> str:
        """Log an event with comprehensive details"""
        
        try:
            # Create event object
            event = Event(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                category=category,
                event_type=event_type,
                severity=severity,
                user_id=user_id or getattr(g, 'user_id', None),
                business_id=business_id or getattr(g, 'business_id', None),
                ip_address=request.remote_addr if request else 'N/A',
                user_agent=request.headers.get('User-Agent', 'N/A') if request else 'N/A',
                endpoint=request.endpoint if request else 'N/A',
                method=request.method if request else 'N/A',
                description=description,
                details=details or {},
                entity_type=entity_type,
                entity_id=entity_id,
                old_values=old_values,
                new_values=new_values,
                session_id=getattr(g, 'session_id', None),
                correlation_id=getattr(g, 'correlation_id', str(uuid.uuid4())),
                source='application',
                tags=tags or []
            )
            
            # Store in database (if event model exists)
            self._store_event(event)
            
            # Log to file
            self._log_to_file(event)
            
            # Send real-time notifications for critical events
            if severity in [EventSeverity.CRITICAL, EventSeverity.HIGH]:
                self._send_notification(event)
            
            return event.id
            
        except Exception as e:
            self.logger.error(f"Failed to log event: {str(e)}")
            return None
    
    def _store_event(self, event: Event):
        """Store event in database"""
        try:
            from app.models.event import EventLog
            event_log = EventLog(
                id=event.id,
                timestamp=event.timestamp,
                category=event.category.value,
                event_type=event.event_type.value,
                severity=event.severity.value,
                user_id=event.user_id,
                business_id=event.business_id,
                ip_address=event.ip_address,
                user_agent=event.user_agent,
                endpoint=event.endpoint,
                method=event.method,
                description=event.description,
                details=json.dumps(event.details),
                entity_type=event.entity_type,
                entity_id=event.entity_id,
                old_values=json.dumps(event.old_values) if event.old_values else None,
                new_values=json.dumps(event.new_values) if event.new_values else None,
                session_id=event.session_id,
                correlation_id=event.correlation_id,
                source=event.source,
                tags=json.dumps(event.tags)
            )
            db.session.add(event_log)
            db.session.commit()
        except Exception as e:
            self.logger.error(f"Failed to store event in database: {str(e)}")
            db.session.rollback()
    
    def _log_to_file(self, event: Event):
        """Log event to file"""
        try:
            log_data = {
                'event_id': event.id,
                'timestamp': event.timestamp.isoformat(),
                'category': event.category.value,
                'event_type': event.event_type.value,
                'severity': event.severity.value,
                'user_id': event.user_id,
                'business_id': event.business_id,
                'ip_address': event.ip_address,
                'description': event.description,
                'details': event.details
            }
            
            if event.severity == EventSeverity.CRITICAL:
                self.logger.critical(json.dumps(log_data))
            elif event.severity == EventSeverity.HIGH:
                self.logger.error(json.dumps(log_data))
            elif event.severity == EventSeverity.MEDIUM:
                self.logger.warning(json.dumps(log_data))
            else:
                self.logger.info(json.dumps(log_data))
                
        except Exception as e:
            self.logger.error(f"Failed to log event to file: {str(e)}")
    
    def _send_notification(self, event: Event):
        """Send real-time notification for critical events"""
        try:
            # Here you can integrate with various notification systems
            # Email, Slack, SMS, Webhook, etc.
            
            notification_data = {
                'event_id': event.id,
                'severity': event.severity.value,
                'category': event.category.value,
                'event_type': event.event_type.value,
                'description': event.description,
                'timestamp': event.timestamp.isoformat(),
                'user_id': event.user_id,
                'business_id': event.business_id,
                'ip_address': event.ip_address
            }
            
            # Log notification attempt
            self.logger.info(f"Sending notification for critical event: {event.id}")
            
            # TODO: Implement actual notification channels
            # - Email notifications
            # - Slack webhook
            # - SMS alerts
            # - Push notifications
            
        except Exception as e:
            self.logger.error(f"Failed to send notification: {str(e)}")
    
    def get_events(self, 
                   filters: Dict[str, Any] = None,
                   limit: int = 100,
                   offset: int = 0) -> List[Event]:
        """Retrieve events with optional filters"""
        try:
            from app.models.event import EventLog
            query = EventLog.query
            
            if filters:
                if 'category' in filters:
                    query = query.filter(EventLog.category == filters['category'])
                if 'event_type' in filters:
                    query = query.filter(EventLog.event_type == filters['event_type'])
                if 'severity' in filters:
                    query = query.filter(EventLog.severity == filters['severity'])
                if 'user_id' in filters:
                    query = query.filter(EventLog.user_id == filters['user_id'])
                if 'business_id' in filters:
                    query = query.filter(EventLog.business_id == filters['business_id'])
                if 'start_date' in filters:
                    query = query.filter(EventLog.timestamp >= filters['start_date'])
                if 'end_date' in filters:
                    query = query.filter(EventLog.timestamp <= filters['end_date'])
            
            events = query.order_by(EventLog.timestamp.desc()).offset(offset).limit(limit).all()
            
            # Convert to Event objects
            result = []
            for event_log in events:
                event = Event(
                    id=event_log.id,
                    timestamp=event_log.timestamp,
                    category=EventCategory(event_log.category),
                    event_type=EventType(event_log.event_type),
                    severity=EventSeverity(event_log.severity),
                    user_id=event_log.user_id,
                    business_id=event_log.business_id,
                    ip_address=event_log.ip_address,
                    user_agent=event_log.user_agent,
                    endpoint=event_log.endpoint,
                    method=event_log.method,
                    description=event_log.description,
                    details=json.loads(event_log.details) if event_log.details else {},
                    entity_type=event_log.entity_type,
                    entity_id=event_log.entity_id,
                    old_values=json.loads(event_log.old_values) if event_log.old_values else None,
                    new_values=json.loads(event_log.new_values) if event_log.new_values else None,
                    session_id=event_log.session_id,
                    correlation_id=event_log.correlation_id,
                    source=event_log.source,
                    tags=json.loads(event_log.tags) if event_log.tags else []
                )
                result.append(event)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve events: {str(e)}")
            return []
    
    def get_event_statistics(self, 
                           business_id: str = None,
                           days: int = 30) -> Dict[str, Any]:
        """Get event statistics for monitoring dashboard"""
        try:
            from app.models.event import EventLog
            from sqlalchemy import func
            
            start_date = datetime.utcnow() - timedelta(days=days)
            query = EventLog.query.filter(EventLog.timestamp >= start_date)
            
            if business_id:
                query = query.filter(EventLog.business_id == business_id)
            
            # Event counts by category
            category_counts = query.with_entities(
                EventLog.category,
                func.count(EventLog.id)
            ).group_by(EventLog.category).all()
            
            # Event counts by severity
            severity_counts = query.with_entities(
                EventLog.severity,
                func.count(EventLog.id)
            ).group_by(EventLog.severity).all()
            
            # Top event types
            top_events = query.with_entities(
                EventLog.event_type,
                func.count(EventLog.id)
            ).group_by(EventLog.event_type).order_by(func.count(EventLog.id).desc()).limit(10).all()
            
            # Events over time (last 24 hours)
            last_24h = datetime.utcnow() - timedelta(hours=24)
            timeline = query.filter(EventLog.timestamp >= last_24h).with_entities(
                func.date_trunc('hour', EventLog.timestamp).label('hour'),
                func.count(EventLog.id)
            ).group_by('hour').order_by('hour').all()
            
            return {
                'total_events': query.count(),
                'category_counts': dict(category_counts),
                'severity_counts': dict(severity_counts),
                'top_events': dict(top_events),
                'timeline': [{'hour': str(t[0]), 'count': t[1]} for t in timeline],
                'period_days': days
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get event statistics: {str(e)}")
            return {}

# Global event monitor instance
event_monitor = EventMonitor()

# Decorator for automatic event logging
def log_event(category: EventCategory,
              event_type: EventType,
              severity: EventSeverity = EventSeverity.INFO,
              description: str = "",
              include_args: bool = False,
              include_result: bool = False):
    """Decorator to automatically log function calls as events"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            result = None
            error = None
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                try:
                    # Build event details
                    details = {
                        'function': func.__name__,
                        'module': func.__module__,
                        'duration': (datetime.utcnow() - start_time).total_seconds()
                    }
                    
                    if include_args:
                        details['args'] = str(args)[:500]  # Limit length
                        details['kwargs'] = str(kwargs)[:500]
                    
                    if include_result and result is not None:
                        details['result'] = str(result)[:500]
                    
                    if error:
                        details['error'] = str(error)
                        severity_level = EventSeverity.HIGH
                    else:
                        severity_level = severity
                    
                    # Extract entity information if available
                    entity_type = None
                    entity_id = None
                    old_values = None
                    new_values = None
                    
                    if hasattr(result, 'id'):
                        entity_id = str(result.id)
                    if hasattr(result, '__class__'):
                        entity_type = result.__class__.__name__.lower()
                    
                    # Log the event
                    event_monitor.log_event(
                        category=category,
                        event_type=event_type,
                        severity=severity_level,
                        description=description or f"Function {func.__name__} executed",
                        details=details,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        old_values=old_values,
                        new_values=new_values
                    )
                except Exception as log_error:
                    # Don't let logging errors break the application
                    print(f"Failed to log event for {func.__name__}: {str(log_error)}")
        
        return wrapper
    return decorator
