"""
Security middleware for input validation and protection
"""

import time
import hashlib
from functools import wraps
from flask import request, jsonify, g, session
from werkzeug.security import safe_join
import bleach
from .validation import SecurityValidator, ValidationError

class SecurityMiddleware:
    """Security middleware class"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security middleware with Flask app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Security headers
        @app.after_request
        def add_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            return response
    
    def before_request(self):
        """Before request security checks"""
        # Store request start time for rate limiting
        g.start_time = time.time()
        
        # Validate request size
        content_length = request.content_length or 0
        max_content_length = 10 * 1024 * 1024  # 10MB
        
        if content_length > max_content_length:
            return jsonify({'error': 'Request too large'}), 413
        
        # Check for suspicious patterns in URL
        if self.detect_suspicious_url(request.url):
            return jsonify({'error': 'Invalid request'}), 400
        
        # Validate headers
        if self.detect_suspicious_headers():
            return jsonify({'error': 'Invalid headers'}), 400
    
    def after_request(self, response):
        """After request security processing"""
        # Log security events
        if hasattr(g, 'security_event'):
            self.log_security_event(g.security_event)
        
        return response
    
    def detect_suspicious_url(self, url: str) -> bool:
        """Detect suspicious patterns in URL"""
        suspicious_patterns = [
            r'\.\./',  # Path traversal
            r'<script',  # XSS
            r'javascript:',  # XSS
            r'vbscript:',  # XSS
            r'onload=',  # XSS
            r'onerror=',  # XSS
            r'union\s+select',  # SQL injection
            r'drop\s+table',  # SQL injection
            r'insert\s+into',  # SQL injection
            r'delete\s+from',  # SQL injection
        ]
        
        for pattern in suspicious_patterns:
            if SecurityValidator.detect_sql_injection(url) or SecurityValidator.detect_xss(url):
                return True
        
        return False
    
    def detect_suspicious_headers(self) -> bool:
        """Detect suspicious patterns in headers"""
        suspicious_headers = [
            'User-Agent',
            'Referer',
            'X-Forwarded-For',
            'X-Real-IP',
        ]
        
        for header in suspicious_headers:
            value = request.headers.get(header, '')
            if SecurityValidator.detect_sql_injection(value) or SecurityValidator.detect_xss(value):
                return True
        
        return False
    
    def log_security_event(self, event_data: dict):
        """Log security events"""
        import logging
        logger = logging.getLogger('security')
        logger.warning(f"Security event: {event_data}")

# Rate limiting decorator
def rate_limit(max_requests: int = 100, window_seconds: int = 60, per_ip: bool = True):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Simple in-memory rate limiting (for production, use Redis)
            if not hasattr(rate_limit, 'requests'):
                rate_limit.requests = {}
            
            # Scope by endpoint + IP so different routes have separate counters
            endpoint = request.endpoint or func.__name__
            ip = request.remote_addr if per_ip else 'global'
            key = f"{endpoint}:{ip}"
            current_time = time.time()
            
            # Clean old entries
            if key in rate_limit.requests:
                rate_limit.requests[key] = [
                    req_time for req_time in rate_limit.requests[key]
                    if current_time - req_time < window_seconds
                ]
            else:
                rate_limit.requests[key] = []
            
            # Check rate limit
            if len(rate_limit.requests[key]) >= max_requests:
                return jsonify({'error': 'Rate limit exceeded. Please wait a few minutes and try again.'}), 429
            
            # Add current request
            rate_limit.requests[key].append(current_time)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def clear_rate_limits():
    """Clear all rate limit counters (useful for development/testing)"""
    if hasattr(rate_limit, 'requests'):
        rate_limit.requests = {}

# Input validation decorator
def validate_json_input(schema: dict = None):
    """Validate JSON input"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'JSON content required'}), 400
            
            try:
                data = request.get_json()
                if not isinstance(data, dict):
                    return jsonify({'error': 'Invalid JSON format'}), 400
                
                # Basic security checks
                for key, value in data.items():
                    if isinstance(value, str):
                        if SecurityValidator.detect_sql_injection(value):
                            g.security_event = {
                                'type': 'sql_injection_attempt',
                                'ip': request.remote_addr,
                                'endpoint': request.endpoint,
                                'data': {key: value}
                            }
                            return jsonify({'error': 'Invalid input detected'}), 400
                        
                        if SecurityValidator.detect_xss(value):
                            g.security_event = {
                                'type': 'xss_attempt',
                                'ip': request.remote_addr,
                                'endpoint': request.endpoint,
                                'data': {key: value}
                            }
                            return jsonify({'error': 'Invalid input detected'}), 400
                
                # Schema validation if provided
                if schema:
                    try:
                        sanitized_data = SecurityValidator.sanitize_dict(data, schema)
                        request.sanitized_data = sanitized_data
                    except ValidationError as e:
                        return jsonify({'error': str(e)}), 400
                else:
                    # Basic sanitization
                    sanitized_data = {}
                    for key, value in data.items():
                        if isinstance(value, str):
                            sanitized_data[key] = SecurityValidator.sanitize_string(value)
                        else:
                            sanitized_data[key] = value
                    request.sanitized_data = sanitized_data
                
                return func(*args, **kwargs)
            
            except Exception as e:
                return jsonify({'error': 'Invalid JSON data'}), 400
        
        return wrapper
    return decorator

# File upload validation decorator
def validate_file_upload(allowed_extensions: list = None, max_size_mb: int = 10):
    """Validate file uploads"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Validate file
            validation_result = SecurityValidator.validate_file_upload(
                file, allowed_extensions
            )
            
            if not validation_result['valid']:
                return jsonify({'error': validation_result['error']}), 400
            
            # Store validation result
            request.file_validation = validation_result
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

# CSRF protection decorator
def csrf_protect():
    """CSRF protection decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
                token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
                session_token = session.get('csrf_token')
                
                if not SecurityValidator.validate_csrf_token(token, session_token):
                    g.security_event = {
                        'type': 'csrf_attempt',
                        'ip': request.remote_addr,
                        'endpoint': request.endpoint
                    }
                    return jsonify({'error': 'Invalid CSRF token'}), 403
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

# Path traversal protection
def safe_path_join(base_path: str, *paths: str) -> str:
    """Safely join paths to prevent directory traversal"""
    result = safe_join(base_path, *paths)
    if result is None:
        raise ValueError("Path traversal detected")
    return result

# Input sanitization middleware
def sanitize_response_data(data):
    """Sanitize response data"""
    if isinstance(data, dict):
        return {key: sanitize_response_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_response_data(item) for item in data]
    elif isinstance(data, str):
        # Basic HTML escaping for string responses
        return SecurityValidator.sanitize_string(data)
    else:
        return data

# Security context manager
class SecurityContext:
    """Security context for request processing"""
    
    def __init__(self):
        self.events = []
    
    def log_event(self, event_type: str, details: dict = None):
        """Log security event"""
        event = {
            'type': event_type,
            'timestamp': time.time(),
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'endpoint': request.endpoint,
            'details': details or {}
        }
        self.events.append(event)
        g.security_event = event
    
    def get_events(self) -> list:
        """Get all security events for this request"""
        return self.events

# Initialize security context
def init_security_context():
    """Initialize security context for request"""
    g.security_context = SecurityContext()
