"""
Comprehensive input validation and sanitization utilities
"""

import re
import html
import bleach
import hashlib
import secrets
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse
import bleach
import magic
from werkzeug.utils import secure_filename

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

class SecurityValidator:
    """Comprehensive security validation and sanitization"""
    
    # Dangerous patterns for SQL injection
    SQL_INJECTION_PATTERNS = [
        r'(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)',
        r'(--|#|\/\*|\*\/)',
        r'(\bOR\b.*\b1\s*=\s*1\b|\bAND\b.*\b1\s*=\s*1\b)',
        r'(\;\s*(DROP|DELETE|UPDATE|INSERT)\b)',
        r'(\b(INFORMATION_SCHEMA|SYS|MASTER|MSDB)\b)',
        r'(\b(LOAD_FILE|INTO\s+OUTFILE|DUMPFILE)\b)',
        r'(\b(BENCHMARK|SLEEP|WAITFOR|DELAY)\b)',
        r'(\b(USER|VERSION|DATABASE|@@)\b)',
        r'(\b(CONCAT|CHAR|ASCII|ORD|HEX)\b)',
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r'<\s*script[^>]*>.*?<\s*/\s*script\s*>',
        r'<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>',
        r'javascript\s*:',
        r'vbscript\s*:',
        r'on\w+\s*=',
        r'<\s*img[^>]*src\s*=\s*["\']?\s*javascript:',
        r'<\s*link[^>]*href\s*=\s*["\']?\s*javascript:',
        r'<\s*meta[^>]*http-equiv\s*=\s*["\']?\s*refresh',
        r'<\s*object[^>]*>.*?<\s*/\s*object\s*>',
        r'<\s*embed[^>]*>.*?<\s*/\s*embed\s*>',
        r'<\s*applet[^>]*>.*?<\s*/\s*applet\s*>',
        r'<\s*form[^>]*action\s*=\s*["\']?\s*javascript:',
    ]
    
    # File upload security
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/csv',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    def sanitize_string(cls, input_string: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        if not isinstance(input_string, str):
            return str(input_string) if input_string is not None else ''
        
        # Remove null bytes
        sanitized = input_string.replace('\x00', '')
        
        # Trim whitespace
        sanitized = sanitized.strip()
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        # HTML entity encoding
        sanitized = html.escape(sanitized)
        
        return sanitized
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """Validate email format"""
        if not isinstance(email, str):
            return False
        
        email = email.strip().lower()
        
        # Basic email regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False
        
        # Length validation
        if len(email) > 254:
            return False
        
        # Prevent dangerous characters
        dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}']
        if any(char in email for char in dangerous_chars):
            return False
        
        return True
    
    @classmethod
    def validate_phone(cls, phone: str) -> bool:
        """Validate phone number - accepts local and international formats"""
        if not isinstance(phone, str):
            return False

        # Strip whitespace
        phone = phone.strip()

        # Allow empty string (optional fields)
        if phone == '':
            return True

        # Remove common formatting characters: spaces, dashes, dots, parentheses
        cleaned = re.sub(r'[\s\-\.\(\)]', '', phone)

        # Accept:
        #   +<digits>  (international, e.g. +27712345678)
        #   0<digits>  (local with leading zero, e.g. 0712345678)
        #   <digits>   (plain digits, e.g. 712345678)
        # Total digit count (excluding leading +) must be 7–15
        pattern = r'^\+?\d{7,15}$'
        return bool(re.match(pattern, cleaned))
    
    @classmethod
    def validate_username(cls, username: str) -> bool:
        """Validate username"""
        if not isinstance(username, str):
            return False
        
        # Length validation
        if len(username) < 3 or len(username) > 30:
            return False
        
        # Allowed characters: alphanumeric, underscore, hyphen
        pattern = r'^[a-zA-Z0-9_-]+$'
        if not re.match(pattern, username):
            return False
        
        # Prevent consecutive special characters
        if '--' in username or '__' in username:
            return False
        
        return True
    
    @classmethod
    def detect_sql_injection(cls, input_string: str) -> bool:
        """Detect potential SQL injection attempts"""
        if not isinstance(input_string, str):
            return False
        
        input_upper = input_string.upper()
        
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, input_upper, re.IGNORECASE | re.MULTILINE | re.DOTALL):
                return True
        
        return False
    
    @classmethod
    def detect_xss(cls, input_string: str) -> bool:
        """Detect potential XSS attempts"""
        if not isinstance(input_string, str):
            return False
        
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, input_string, re.IGNORECASE | re.MULTILINE | re.DOTALL):
                return True
        
        return False
    
    @classmethod
    def sanitize_html(cls, html_content: str, allowed_tags: List[str] = None) -> str:
        """Sanitize HTML content using bleach"""
        if not isinstance(html_content, str):
            return ''
        
        if allowed_tags is None:
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a']
        
        allowed_attributes = {
            'a': ['href', 'title'],
            '*': []
        }
        
        return bleach.clean(
            html_content,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
    
    @classmethod
    def validate_url(cls, url: str) -> bool:
        """Validate URL format"""
        if not isinstance(url, str):
            return False
        
        try:
            parsed = urlparse(url)
            return all([parsed.scheme, parsed.netloc])
        except Exception:
            return False
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for secure storage"""
        if not isinstance(filename, str):
            return 'unknown'
        
        # Use werkzeug's secure_filename
        sanitized = secure_filename(filename)
        
        # Additional sanitization
        if not sanitized:
            sanitized = 'file'
        
        # Limit length
        if len(sanitized) > 255:
            name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
            sanitized = name[:250] + ('.' + ext if ext else '')
        
        return sanitized
    
    @classmethod
    def validate_file_upload(cls, file_obj, allowed_extensions: List[str] = None) -> Dict[str, Any]:
        """Validate uploaded file"""
        if not file_obj or not hasattr(file_obj, 'filename'):
            return {'valid': False, 'error': 'No file provided'}
        
        # Check file size
        file_obj.seek(0, 2)  # Seek to end
        file_size = file_obj.tell()
        file_obj.seek(0)  # Seek back to beginning
        
        if file_size > cls.MAX_FILE_SIZE:
            return {'valid': False, 'error': f'File size exceeds {cls.MAX_FILE_SIZE // (1024*1024)}MB limit'}
        
        # Check filename
        filename = file_obj.filename
        if not filename:
            return {'valid': False, 'error': 'No filename provided'}
        
        sanitized_name = cls.sanitize_filename(filename)
        
        # Check file extension
        if allowed_extensions:
            file_ext = sanitized_name.rsplit('.', 1)[-1].lower() if '.' in sanitized_name else ''
            if file_ext not in allowed_extensions:
                return {'valid': False, 'error': f'File extension .{file_ext} not allowed'}
        
        # Check MIME type
        try:
            file_content = file_obj.read(1024)  # Read first 1KB for MIME detection
            file_obj.seek(0)  # Seek back to beginning
            
            mime_type = magic.from_buffer(file_content, mime=True)
            
            if mime_type not in cls.ALLOWED_MIME_TYPES:
                return {'valid': False, 'error': f'MIME type {mime_type} not allowed'}
            
        except Exception as e:
            return {'valid': False, 'error': f'Could not determine file type: {str(e)}'}
        
        return {
            'valid': True,
            'sanitized_filename': sanitized_name,
            'mime_type': mime_type,
            'file_size': file_size
        }
    
    @classmethod
    def validate_numeric(cls, value: Any, min_val: float = None, max_val: float = None) -> bool:
        """Validate numeric input"""
        try:
            num_value = float(value)
            
            if min_val is not None and num_value < min_val:
                return False
            
            if max_val is not None and num_value > max_val:
                return False
            
            return True
        except (ValueError, TypeError):
            return False
    
    @classmethod
    def validate_integer(cls, value: Any, min_val: int = None, max_val: int = None) -> bool:
        """Validate integer input"""
        try:
            int_value = int(value)
            
            if min_val is not None and int_value < min_val:
                return False
            
            if max_val is not None and int_value > max_val:
                return False
            
            return True
        except (ValueError, TypeError):
            return False
    
    @classmethod
    def validate_date(cls, date_string: str, date_format: str = '%Y-%m-%d') -> bool:
        """Validate date string"""
        if not isinstance(date_string, str):
            return False
        
        try:
            from datetime import datetime
            datetime.strptime(date_string, date_format)
            return True
        except ValueError:
            return False
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any], schema: Dict[str, Dict[str, Any]] = None) -> Dict[str, Any]:
        """Sanitize dictionary input based on schema"""
        if not isinstance(data, dict):
            return {}
        
        sanitized = {}
        
        for key, value in data.items():
            if schema and key in schema:
                field_schema = schema[key]
                field_type = field_schema.get('type', 'string')
                max_length = field_schema.get('max_length', 1000)
                required = field_schema.get('required', False)
                
                # Skip if required and value is None
                if required and value is None:
                    raise ValidationError(f"Required field '{key}' is missing")
                
                # Sanitize based on type
                if value is not None:
                    if field_type == 'string':
                        sanitized[key] = cls.sanitize_string(str(value), max_length)
                    elif field_type == 'email':
                        if cls.validate_email(str(value)):
                            sanitized[key] = str(value).lower().strip()
                        else:
                            raise ValidationError(f"Invalid email format for field '{key}'")
                    elif field_type == 'phone':
                        if cls.validate_phone(str(value)):
                            sanitized[key] = str(value)
                        else:
                            raise ValidationError(f"Invalid phone format for field '{key}'")
                    elif field_type == 'username':
                        if cls.validate_username(str(value)):
                            sanitized[key] = str(value)
                        else:
                            raise ValidationError(f"Invalid username format for field '{key}'")
                    elif field_type == 'integer':
                        if cls.validate_integer(value):
                            sanitized[key] = int(value)
                        else:
                            raise ValidationError(f"Invalid integer value for field '{key}'")
                    elif field_type == 'numeric':
                        if cls.validate_numeric(value):
                            sanitized[key] = float(value)
                        else:
                            raise ValidationError(f"Invalid numeric value for field '{key}'")
                    else:
                        sanitized[key] = cls.sanitize_string(str(value), max_length)
            else:
                # Default sanitization for unknown fields
                sanitized[key] = cls.sanitize_string(str(value), 1000)
        
        return sanitized
    
    @classmethod
    def generate_csrf_token(cls) -> str:
        """Generate CSRF token"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def validate_csrf_token(cls, token: str, session_token: str) -> bool:
        """Validate CSRF token"""
        if not token or not session_token:
            return False
        
        # Use constant-time comparison to prevent timing attacks
        import secrets
        return secrets.compare_digest(token.encode(), session_token.encode())

# Common validation schemas
USER_SCHEMA = {
    'username': {'type': 'username', 'required': True},
    'email': {'type': 'email', 'required': True},
    'first_name': {'type': 'string', 'required': True, 'max_length': 50},
    'last_name': {'type': 'string', 'required': True, 'max_length': 50},
    'phone': {'type': 'phone', 'required': False, 'max_length': 20},
    'password': {'type': 'string', 'required': True, 'max_length': 128},
}

BUSINESS_SCHEMA = {
    'name': {'type': 'string', 'required': True, 'max_length': 100},
    'email': {'type': 'email', 'required': True},
    'phone': {'type': 'phone', 'required': False, 'max_length': 20},
    'address': {'type': 'string', 'required': False, 'max_length': 500},
    'industry': {'type': 'string', 'required': False, 'max_length': 50},
}

PRODUCT_SCHEMA = {
    'name': {'type': 'string', 'required': True, 'max_length': 200},
    'description': {'type': 'string', 'required': False, 'max_length': 2000},
    'price': {'type': 'numeric', 'required': True},
    'cost': {'type': 'numeric', 'required': False},
    'quantity': {'type': 'integer', 'required': True},
    'category': {'type': 'string', 'required': False, 'max_length': 50},
}

# Decorator for input validation
def validate_input(schema: Dict[str, Dict[str, Any]]):
    """Decorator to validate and sanitize input data"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            from flask import request
            
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form.to_dict()
            
            try:
                sanitized_data = SecurityValidator.sanitize_dict(data, schema)
                request.sanitized_data = sanitized_data
                return func(*args, **kwargs)
            except ValidationError as e:
                from flask import jsonify
                return jsonify({'error': str(e)}), 400
        
        return wrapper
    return decorator
