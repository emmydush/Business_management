"""
Comprehensive API Security Hardening Framework
"""

import time
import hashlib
import hmac
import secrets
import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from functools import wraps
from flask import request, jsonify, g, current_app
from redis import Redis
import ipaddress
from collections import defaultdict
import threading

class APIRateLimiter:
    """Advanced rate limiting with multiple strategies"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or Redis(decode_responses=True)
        self.local_cache = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_rate_limited(self, 
                       key: str, 
                       limit: int, 
                       window: int, 
                       strategy: str = 'sliding_window') -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request is rate limited
        
        Args:
            key: Rate limit key (IP, user ID, API key, etc.)
            limit: Maximum requests allowed
            window: Time window in seconds
            strategy: 'fixed_window', 'sliding_window', 'token_bucket'
        
        Returns:
            (is_limited, metadata)
        """
        now = int(time.time())
        
        if strategy == 'fixed_window':
            return self._fixed_window_check(key, limit, window, now)
        elif strategy == 'sliding_window':
            return self._sliding_window_check(key, limit, window, now)
        elif strategy == 'token_bucket':
            return self._token_bucket_check(key, limit, window, now)
        else:
            return self._sliding_window_check(key, limit, window, now)
    
    def _fixed_window_check(self, key: str, limit: int, window: int, now: int) -> Tuple[bool, Dict[str, Any]]:
        """Fixed window rate limiting"""
        window_key = f"rate_limit:{key}:{now // window}"
        
        try:
            current = self.redis.incr(window_key)
            if current == 1:
                self.redis.expire(window_key, window)
            
            remaining = max(0, limit - current)
            reset_time = (now // window + 1) * window
            
            return current > limit, {
                'limit': limit,
                'remaining': remaining,
                'reset_time': reset_time,
                'retry_after': reset_time - now if current > limit else 0
            }
        except Exception:
            # Fallback to local cache if Redis fails
            return self._local_fallback(key, limit, window, now)
    
    def _sliding_window_check(self, key: str, limit: int, window: int, now: int) -> Tuple[bool, Dict[str, Any]]:
        """Sliding window rate limiting"""
        pipe = self.redis.pipeline()
        window_start = now - window
        
        # Remove old entries
        pipe.zremrangebyscore(f"sliding:{key}", 0, window_start)
        
        # Add current request
        pipe.zadd(f"sliding:{key}", {str(now): now})
        
        # Count current requests
        pipe.zcard(f"sliding:{key}")
        
        # Set expiry
        pipe.expire(f"sliding:{key}", window)
        
        try:
            results = pipe.execute()
            current = results[2]
            
            # Remove oldest if over limit
            if current > limit:
                remove_count = current - limit
                pipe.zremrangebyrank(f"sliding:{key}", 0, remove_count - 1)
                pipe.execute()
            
            remaining = max(0, limit - current)
            oldest_request = self.redis.zrange(f"sliding:{key}", 0, 0, withscores=True)
            reset_time = int(oldest_request[0][1]) + window if oldest_request else now + window
            
            return current > limit, {
                'limit': limit,
                'remaining': remaining,
                'reset_time': reset_time,
                'retry_after': reset_time - now if current > limit else 0
            }
        except Exception:
            return self._local_fallback(key, limit, window, now)
    
    def _token_bucket_check(self, key: str, limit: int, window: int, now: int) -> Tuple[bool, Dict[str, Any]]:
        """Token bucket rate limiting"""
        bucket_key = f"bucket:{key}"
        
        try:
            pipe = self.redis.pipeline()
            
            # Get current bucket state
            pipe.hgetall(bucket_key)
            
            # Check if bucket exists
            bucket_data = pipe.execute()[0]
            
            if not bucket_data:
                # Initialize bucket
                tokens = limit
                last_refill = now
            else:
                tokens = float(bucket_data.get('tokens', 0))
                last_refill = int(bucket_data.get('last_refill', now))
                
                # Refill tokens
                time_passed = now - last_refill
                tokens_to_add = (time_passed / window) * limit
                tokens = min(limit, tokens + tokens_to_add)
                last_refill = now
            
            # Check if request can be processed
            if tokens >= 1:
                tokens -= 1
                allowed = True
            else:
                allowed = False
            
            # Update bucket
            pipe.hset(bucket_key, {
                'tokens': tokens,
                'last_refill': last_refill
            })
            pipe.expire(bucket_key, window * 2)
            pipe.execute()
            
            return not allowed, {
                'limit': limit,
                'remaining': int(tokens),
                'reset_time': last_refill + window,
                'retry_after': window - (now - last_refill) if not allowed else 0
            }
        except Exception:
            return self._local_fallback(key, limit, window, now)
    
    def _local_fallback(self, key: str, limit: int, window: int, now: int) -> Tuple[bool, Dict[str, Any]]:
        """Local memory fallback when Redis fails"""
        with self.lock:
            timestamps = self.local_cache[key]
            
            # Remove old timestamps
            timestamps[:] = [t for t in timestamps if t > now - window]
            
            if len(timestamps) >= limit:
                return True, {
                    'limit': limit,
                    'remaining': 0,
                    'reset_time': timestamps[0] + window,
                    'retry_after': timestamps[0] + window - now
                }
            
            timestamps.append(now)
            return False, {
                'limit': limit,
                'remaining': limit - len(timestamps),
                'reset_time': now + window,
                'retry_after': 0
            }

class IPWhitelistBlacklist:
    """IP whitelist and blacklist management"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or Redis(decode_responses=True)
        self.whitelist_key = "security:ip_whitelist"
        self.blacklist_key = "security:ip_blacklist"
    
    def is_allowed(self, ip: str) -> Tuple[bool, str]:
        """
        Check if IP is allowed
        
        Returns:
            (allowed, reason)
        """
        try:
            ip_obj = ipaddress.ip_address(ip)
        except ValueError:
            return False, "Invalid IP address"
        
        # Check blacklist first
        if self._is_blacklisted(ip_obj):
            return False, "IP is blacklisted"
        
        # Check whitelist (if configured)
        if self._has_whitelist() and not self._is_whitelisted(ip_obj):
            return False, "IP is not whitelisted"
        
        return True, "IP is allowed"
    
    def _is_blacklisted(self, ip_obj: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
        """Check if IP is in blacklist"""
        try:
            blacklisted_ips = self.redis.smembers(self.blacklist_key)
            for blocked_ip in blacklisted_ips:
                try:
                    if ip_obj in ipaddress.ip_network(blocked_ip, strict=False):
                        return True
                except ValueError:
                    continue
            return False
        except Exception:
            return False
    
    def _is_whitelisted(self, ip_obj: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
        """Check if IP is in whitelist"""
        try:
            whitelisted_ips = self.redis.smembers(self.whitelist_key)
            for allowed_ip in whitelisted_ips:
                try:
                    if ip_obj in ipaddress.ip_network(allowed_ip, strict=False):
                        return True
                except ValueError:
                    continue
            return False
        except Exception:
            return True  # Allow if whitelist check fails
    
    def _has_whitelist(self) -> bool:
        """Check if whitelist is configured"""
        try:
            return self.redis.exists(self.whitelist_key) > 0
        except Exception:
            return False
    
    def add_to_blacklist(self, ip: str, reason: str = "") -> bool:
        """Add IP to blacklist"""
        try:
            self.redis.sadd(self.blacklist_key, ip)
            if reason:
                self.redis.hset(f"blacklist_reasons", ip, reason)
            return True
        except Exception:
            return False
    
    def remove_from_blacklist(self, ip: str) -> bool:
        """Remove IP from blacklist"""
        try:
            self.redis.srem(self.blacklist_key, ip)
            self.redis.hdel("blacklist_reasons", ip)
            return True
        except Exception:
            return False
    
    def add_to_whitelist(self, ip: str) -> bool:
        """Add IP to whitelist"""
        try:
            self.redis.sadd(self.whitelist_key, ip)
            return True
        except Exception:
            return False
    
    def remove_from_whitelist(self, ip: str) -> bool:
        """Remove IP from whitelist"""
        try:
            self.redis.srem(self.whitelist_key, ip)
            return True
        except Exception:
            return False

class APIKeyAuth:
    """API Key authentication and management"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or Redis(decode_responses=True)
        self.api_keys_key = "security:api_keys"
    
    def generate_api_key(self, 
                         business_id: str, 
                         name: str, 
                         permissions: List[str] = None,
                         rate_limit: Dict[str, int] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Generate new API key
        
        Returns:
            (api_key, key_info)
        """
        api_key = f"ak_{secrets.token_urlsafe(32)}"
        key_id = secrets.token_urlsafe(16)
        
        key_info = {
            'key_id': key_id,
            'business_id': business_id,
            'name': name,
            'permissions': permissions or [],
            'rate_limit': rate_limit or {'requests': 1000, 'window': 3600},
            'created_at': datetime.utcnow().isoformat(),
            'last_used': None,
            'usage_count': 0,
            'is_active': True
        }
        
        try:
            # Store API key info (hashed)
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            self.redis.hset(f"{self.api_keys_key}:{key_hash}", mapping=key_info)
            
            # Store mapping for business
            self.redis.sadd(f"business_keys:{business_id}", key_hash)
            
            return api_key, key_info
        except Exception as e:
            raise Exception(f"Failed to generate API key: {str(e)}")
    
    def validate_api_key(self, api_key: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate API key and return key info
        
        Returns:
            (is_valid, key_info)
        """
        if not api_key or not api_key.startswith('ak_'):
            return False, {}
        
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        try:
            key_info = self.redis.hgetall(f"{self.api_keys_key}:{key_hash}")
            
            if not key_info:
                return False, {}
            
            # Check if key is active
            if key_info.get('is_active') != 'True':
                return False, {}
            
            # Update usage
            self.redis.hincrby(f"{self.api_keys_key}:{key_hash}", 'usage_count', 1)
            self.redis.hset(f"{self.api_keys_key}:{key_hash}", 'last_used', datetime.utcnow().isoformat())
            
            # Convert string values back to appropriate types
            key_info['permissions'] = json.loads(key_info.get('permissions', '[]'))
            key_info['rate_limit'] = json.loads(key_info.get('rate_limit', '{}'))
            key_info['usage_count'] = int(key_info.get('usage_count', 0))
            key_info['is_active'] = key_info.get('is_active') == 'True'
            
            return True, key_info
        except Exception:
            return False, {}
    
    def revoke_api_key(self, api_key: str) -> bool:
        """Revoke API key"""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        try:
            key_info = self.redis.hgetall(f"{self.api_keys_key}:{key_hash}")
            if key_info:
                business_id = key_info.get('business_id')
                self.redis.srem(f"business_keys:{business_id}", key_hash)
            
            self.redis.delete(f"{self.api_keys_key}:{key_hash}")
            return True
        except Exception:
            return False

class RequestValidator:
    """Request validation and sanitization"""
    
    def __init__(self):
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.allowed_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        self.dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript\s*:',
            r'on\w+\s*=',
            r'expression\s*\(',
            r'@import',
            r'union\s+select',
            r'drop\s+table',
            r'insert\s+into',
            r'delete\s+from',
            r'update\s+.*set',
        ]
    
    def validate_request(self, request_obj) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate HTTP request
        
        Returns:
            (is_valid, error_message, metadata)
        """
        metadata = {}
        
        # Check request size
        if hasattr(request_obj, 'content_length') and request_obj.content_length:
            if request_obj.content_length > self.max_request_size:
                return False, f"Request too large. Maximum size: {self.max_request_size} bytes", metadata
        
        # Check HTTP method
        if request_obj.method not in self.allowed_methods:
            return False, f"Method {request_obj.method} not allowed", metadata
        
        # Check Content-Type for POST/PUT requests
        if request_obj.method in ['POST', 'PUT', 'PATCH']:
            content_type = request_obj.headers.get('Content-Type', '')
            if not content_type:
                return False, "Content-Type header required", metadata
            
            allowed_content_types = [
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data',
                'text/plain'
            ]
            
            if not any(allowed_type in content_type for allowed_type in allowed_content_types):
                return False, f"Content-Type {content_type} not allowed", metadata
        
        # Check for dangerous patterns in URL and headers
        url_check = self._check_dangerous_patterns(request_obj.url)
        if url_check:
            return False, f"Dangerous patterns detected in URL: {url_check}", metadata
        
        # Check headers for injection attempts
        for header_name, header_value in request_obj.headers.items():
            header_check = self._check_dangerous_patterns(str(header_value))
            if header_check:
                return False, f"Dangerous patterns detected in header {header_name}: {header_check}", metadata
        
        # Validate request body for POST/PUT requests
        if request_obj.method in ['POST', 'PUT', 'PATCH'] and request_obj.get_json():
            try:
                body = request_obj.get_json()
                body_check = self._validate_json_body(body)
                if body_check:
                    return False, f"Invalid request body: {body_check}", metadata
            except Exception:
                return False, "Invalid JSON in request body", metadata
        
        metadata['validated_at'] = datetime.utcnow().isoformat()
        return True, "Request is valid", metadata
    
    def _check_dangerous_patterns(self, text: str) -> Optional[str]:
        """Check for dangerous patterns in text"""
        for pattern in self.dangerous_patterns:
            if re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL):
                return pattern
        return None
    
    def _validate_json_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Validate JSON request body"""
        if not isinstance(body, dict):
            return "Request body must be a JSON object"
        
        # Check for dangerous patterns in string values
        def check_value(value):
            if isinstance(value, str):
                return self._check_dangerous_patterns(value)
            elif isinstance(value, dict):
                for v in value.values():
                    result = check_value(v)
                    if result:
                        return result
            elif isinstance(value, list):
                for item in value:
                    result = check_value(item)
                    if result:
                        return result
            return None
        
        return check_value(body)

class APISecurityHardening:
    """Main API security hardening class"""
    
    def __init__(self, app=None, redis_client=None):
        self.app = app
        self.rate_limiter = APIRateLimiter(redis_client)
        self.ip_manager = IPWhitelistBlacklist(redis_client)
        self.api_key_auth = APIKeyAuth(redis_client)
        self.request_validator = RequestValidator()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security hardening with Flask app"""
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        
        # Configuration
        app.config.setdefault('API_RATE_LIMIT', '1000/hour')
        app.config.setdefault('API_MAX_REQUEST_SIZE', 10 * 1024 * 1024)
        app.config.setdefault('API_ENABLE_IP_WHITELIST', False)
        app.config.setdefault('API_ENABLE_API_KEY_AUTH', False)
    
    def _before_request(self):
        """Before request security checks"""
        # Store request start time
        g.start_time = time.time()
        
        # Get client IP
        g.client_ip = self._get_client_ip()
        
        # IP whitelist/blacklist check
        if current_app.config.get('API_ENABLE_IP_WHITELIST', False):
            ip_allowed, ip_reason = self.ip_manager.is_allowed(g.client_ip)
            if not ip_allowed:
                self._log_security_event('ip_blocked', {'ip': g.client_ip, 'reason': ip_reason})
                return jsonify({'error': 'Access denied', 'reason': ip_reason}), 403
        
        # Request validation
        is_valid, error_message, metadata = self.request_validator.validate_request(request)
        if not is_valid:
            self._log_security_event('invalid_request', {
                'ip': g.client_ip,
                'error': error_message,
                'url': request.url,
                'method': request.method
            })
            return jsonify({'error': error_message}), 400
        
        # Rate limiting
        rate_limit_config = current_app.config.get('API_RATE_LIMIT', '1000/hour')
        limit, window = self._parse_rate_limit(rate_limit_config)
        
        # Use different rate limit keys based on authentication
        if hasattr(g, 'user_id'):
            rate_key = f"user:{g.user_id}"
        elif hasattr(g, 'api_key_info'):
            rate_key = f"api_key:{g.api_key_info['key_id']}"
        else:
            rate_key = f"ip:{g.client_ip}"
        
        is_limited, limit_info = self.rate_limiter.is_rate_limited(rate_key, limit, window)
        
        if is_limited:
            self._log_security_event('rate_limited', {
                'ip': g.client_ip,
                'rate_key': rate_key,
                'limit_info': limit_info
            })
            
            response = jsonify({'error': 'Rate limit exceeded'})
            response.headers.update({
                'X-RateLimit-Limit': str(limit_info['limit']),
                'X-RateLimit-Remaining': str(limit_info['remaining']),
                'X-RateLimit-Reset': str(limit_info['reset_time']),
                'Retry-After': str(limit_info['retry_after'])
            })
            return response, 429
        
        # Store rate limit info for response headers
        g.rate_limit_info = limit_info
    
    def _after_request(self, response):
        """After request security headers"""
        # Add rate limit headers
        if hasattr(g, 'rate_limit_info'):
            response.headers.update({
                'X-RateLimit-Limit': str(g.rate_limit_info['limit']),
                'X-RateLimit-Remaining': str(g.rate_limit_info['remaining']),
                'X-RateLimit-Reset': str(g.rate_limit_info['reset_time'])
            })
        
        # Add security headers
        response.headers.update({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'X-API-Version': '1.0'
        })
        
        # Remove server information
        response.headers.pop('Server', None)
        
        return response
    
    def _get_client_ip(self) -> str:
        """Get real client IP considering proxies"""
        # Check for forwarded IP headers
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        return request.remote_addr
    
    def _parse_rate_limit(self, rate_limit_str: str) -> Tuple[int, int]:
        """Parse rate limit string like '1000/hour'"""
        try:
            limit, period = rate_limit_str.split('/')
            limit = int(limit)
            
            period_map = {
                'second': 1,
                'minute': 60,
                'hour': 3600,
                'day': 86400
            }
            
            window = period_map.get(period.lower(), 3600)
            return limit, window
        except Exception:
            return 1000, 3600  # Default: 1000 requests per hour
    
    def _log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security events"""
        try:
            from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
            
            event_monitor.log_event(
                category=EventCategory.SECURITY,
                event_type=EventType.SUSPICIOUS_ACTIVITY,
                severity=EventSeverity.HIGH,
                description=f"API Security Event: {event_type}",
                details=details,
                ip_address=details.get('ip', ''),
                tags=['api_security', event_type]
            )
        except Exception:
            # Don't let logging errors break the application
            pass

# Decorators for API security
def rate_limit(limit: int, window: int, strategy: str = 'sliding_window'):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            security = current_app.extensions.get('api_security')
            if not security:
                return func(*args, **kwargs)
            
            # Get rate limit key
            if hasattr(g, 'user_id'):
                rate_key = f"user:{g.user_id}"
            elif hasattr(g, 'api_key_info'):
                rate_key = f"api_key:{g.api_key_info['key_id']}"
            else:
                rate_key = f"ip:{security._get_client_ip()}"
            
            is_limited, limit_info = security.rate_limiter.is_rate_limited(rate_key, limit, window, strategy)
            
            if is_limited:
                response = jsonify({'error': 'Rate limit exceeded'})
                response.headers.update({
                    'X-RateLimit-Limit': str(limit_info['limit']),
                    'X-RateLimit-Remaining': str(limit_info['remaining']),
                    'X-RateLimit-Reset': str(limit_info['reset_time']),
                    'Retry-After': str(limit_info['retry_after'])
                })
                return response, 429
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_api_key():
    """Require API key authentication decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            security = current_app.extensions.get('api_security')
            if not security:
                return jsonify({'error': 'API security not configured'}), 500
            
            api_key = request.headers.get('X-API-Key')
            if not api_key:
                return jsonify({'error': 'API key required'}), 401
            
            is_valid, key_info = security.api_key_auth.validate_api_key(api_key)
            if not is_valid:
                return jsonify({'error': 'Invalid API key'}), 401
            
            g.api_key_info = key_info
            return func(*args, **kwargs)
        return wrapper
    return decorator

def ip_whitelist_only():
    """Require IP whitelist decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            security = current_app.extensions.get('api_security')
            if not security:
                return func(*args, **kwargs)
            
            client_ip = security._get_client_ip()
            ip_allowed, ip_reason = security.ip_manager.is_allowed(client_ip)
            
            if not ip_allowed:
                return jsonify({'error': 'Access denied', 'reason': ip_reason}), 403
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Global instance
api_security = APISecurityHardening()
