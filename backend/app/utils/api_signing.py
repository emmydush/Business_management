"""
API Request Signing and HMAC Validation
"""

import time
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from flask import request, jsonify, g, current_app
from urllib.parse import urlparse, parse_qs

class APISigning:
    """API request signing and validation"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.nonce_cache_key = "api_nonces"
        self.timestamp_window = 300  # 5 minutes
    
    def generate_signature(self, 
                          method: str, 
                          url: str, 
                          headers: Dict[str, str], 
                          body: str = '',
                          api_secret: str = None) -> str:
        """
        Generate HMAC signature for API request
        
        Args:
            method: HTTP method
            url: Full URL
            headers: Request headers
            body: Request body
            api_secret: API secret key
        
        Returns:
            Base64 encoded signature
        """
        if not api_secret:
            raise ValueError("API secret is required")
        
        # Parse URL to get path and query
        parsed_url = urlparse(url)
        path = parsed_url.path
        query = parsed_url.query
        
        # Create canonical request
        canonical_headers = self._canonicalize_headers(headers)
        canonical_query = self._canonicalize_query(query)
        
        # Build string to sign
        string_to_sign = f"{method.upper()}\n{path}\n{canonical_query}\n{canonical_headers}\n{body}"
        
        # Generate signature
        signature = hmac.new(
            api_secret.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        return base64.b64encode(signature).decode('utf-8')
    
    def validate_signature(self, 
                          signature: str, 
                          method: str, 
                          url: str, 
                          headers: Dict[str, str], 
                          body: str = '',
                          api_secret: str = None) -> Tuple[bool, str]:
        """
        Validate HMAC signature
        
        Returns:
            (is_valid, error_message)
        """
        if not signature:
            return False, "Signature is required"
        
        if not api_secret:
            return False, "API secret is required"
        
        try:
            # Generate expected signature
            expected_signature = self.generate_signature(method, url, headers, body, api_secret)
            
            # Constant-time comparison to prevent timing attacks
            if not hmac.compare_digest(signature, expected_signature):
                return False, "Invalid signature"
            
            return True, "Signature is valid"
        except Exception as e:
            return False, f"Signature validation failed: {str(e)}"
    
    def _canonicalize_headers(self, headers: Dict[str, str]) -> str:
        """Canonicalize headers for signature"""
        # Filter out headers that shouldn't be signed
        excluded_headers = {'authorization', 'signature', 'x-signature'}
        
        canonical_headers = []
        for key, value in sorted(headers.items()):
            if key.lower() not in excluded_headers:
                canonical_headers.append(f"{key.lower()}:{value.strip()}")
        
        return '\n'.join(canonical_headers)
    
    def _canonicalize_query(self, query: str) -> str:
        """Canonicalize query string for signature"""
        if not query:
            return ""
        
        params = parse_qs(query, keep_blank_values=True)
        canonical_params = []
        
        for key in sorted(params.keys()):
            values = sorted(params[key])
            for value in values:
                canonical_params.append(f"{key}={value}")
        
        return '&'.join(canonical_params)
    
    def validate_nonce(self, nonce: str, timestamp: int) -> Tuple[bool, str]:
        """
        Validate nonce to prevent replay attacks
        
        Returns:
            (is_valid, error_message)
        """
        if not nonce:
            return False, "Nonce is required"
        
        current_time = int(time.time())
        
        # Check timestamp window
        if abs(current_time - timestamp) > self.timestamp_window:
            return False, f"Request timestamp is too old. Window: {self.timestamp_window} seconds"
        
        # Check if nonce has been used
        try:
            nonce_key = f"{self.nonce_cache_key}:{nonce}"
            if self.redis and self.redis.exists(nonce_key):
                return False, "Nonce has already been used"
            
            # Store nonce with expiration
            if self.redis:
                self.redis.setex(nonce_key, self.timestamp_window * 2, '1')
            else:
                # Fallback to memory (not recommended for production)
                if not hasattr(self, '_nonce_cache'):
                    self._nonce_cache = {}
                
                if nonce in self._nonce_cache:
                    return False, "Nonce has already been used"
                
                self._nonce_cache[nonce] = current_time
                
                # Clean old nonces
                cutoff = current_time - self.timestamp_window * 2
                self._nonce_cache = {
                    n: t for n, t in self._nonce_cache.items() 
                    if t > cutoff
                }
            
            return True, "Nonce is valid"
        except Exception as e:
            return False, f"Nonce validation failed: {str(e)}"

class APIKeyManager:
    """API key and secret management"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.keys_key = "api_keys_v2"
    
    def generate_key_pair(self, 
                          business_id: str, 
                          name: str, 
                          permissions: list = None,
                          rate_limit: dict = None) -> Tuple[str, str, Dict[str, Any]]:
        """
        Generate API key and secret pair
        
        Returns:
            (api_key, api_secret, key_info)
        """
        import secrets
        
        api_key = f"ak_{secrets.token_urlsafe(32)}"
        api_secret = secrets.token_urlsafe(64)
        
        key_info = {
            'key_id': secrets.token_urlsafe(16),
            'business_id': business_id,
            'name': name,
            'permissions': permissions or [],
            'rate_limit': rate_limit or {'requests': 1000, 'window': 3600},
            'created_at': datetime.utcnow().isoformat(),
            'last_used': None,
            'usage_count': 0,
            'is_active': True,
            'requires_signature': True
        }
        
        try:
            # Store API key info
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            secret_hash = hashlib.sha256(api_secret.encode()).hexdigest()
            
            if self.redis:
                self.redis.hset(f"{self.keys_key}:{key_hash}", mapping=key_info)
                self.redis.hset(f"{self.keys_key}:secrets:{key_hash}", 'secret', secret_hash)
                self.redis.sadd(f"business_keys:{business_id}", key_hash)
            else:
                # Fallback to memory (not recommended for production)
                if not hasattr(self, '_key_store'):
                    self._key_store = {}
                
                self._key_store[key_hash] = {
                    'info': key_info,
                    'secret': secret_hash
                }
            
            return api_key, api_secret, key_info
        except Exception as e:
            raise Exception(f"Failed to generate API key pair: {str(e)}")
    
    def validate_key_and_get_secret(self, api_key: str) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Validate API key and return info and secret
        
        Returns:
            (is_valid, key_info, api_secret)
        """
        if not api_key or not api_key.startswith('ak_'):
            return False, {}, None
        
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        try:
            if self.redis:
                key_info = self.redis.hgetall(f"{self.keys_key}:{key_hash}")
                secret_hash = self.redis.hget(f"{self.keys_key}:secrets:{key_hash}", 'secret')
            else:
                if hasattr(self, '_key_store') and key_hash in self._key_store:
                    key_data = self._key_store[key_hash]
                    key_info = key_data['info']
                    secret_hash = key_data['secret']
                else:
                    key_info = None
                    secret_hash = None
            
            if not key_info or not secret_hash:
                return False, {}, None
            
            # Check if key is active
            if key_info.get('is_active') != 'True':
                return False, {}, None
            
            # Update usage
            if self.redis:
                self.redis.hincrby(f"{self.keys_key}:{key_hash}", 'usage_count', 1)
                self.redis.hset(f"{self.keys_key}:{key_hash}", 'last_used', datetime.utcnow().isoformat())
            
            # Convert string values back to appropriate types
            key_info['permissions'] = json.loads(key_info.get('permissions', '[]'))
            key_info['rate_limit'] = json.loads(key_info.get('rate_limit', '{}'))
            key_info['usage_count'] = int(key_info.get('usage_count', 0))
            key_info['is_active'] = key_info.get('is_active') == 'True'
            key_info['requires_signature'] = key_info.get('requires_signature', 'True') == 'True'
            
            return True, key_info, secret_hash
        except Exception:
            return False, {}, None
    
    def revoke_key(self, api_key: str) -> bool:
        """Revoke API key"""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        try:
            if self.redis:
                key_info = self.redis.hgetall(f"{self.keys_key}:{key_hash}")
                if key_info:
                    business_id = key_info.get('business_id')
                    self.redis.srem(f"business_keys:{business_id}", key_hash)
                
                self.redis.delete(f"{self.keys_key}:{key_hash}")
                self.redis.delete(f"{self.keys_key}:secrets:{key_hash}")
            else:
                if hasattr(self, '_key_store'):
                    self._key_store.pop(key_hash, None)
            
            return True
        except Exception:
            return False

class RequestSigningMiddleware:
    """Middleware for automatic request signing validation"""
    
    def __init__(self, app=None, api_key_manager=None):
        self.app = app
        self.api_key_manager = api_key_manager or APIKeyManager()
        self.api_signing = APISigning()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        app.before_request(self._validate_signed_request)
        app.config.setdefault('API_REQUIRE_SIGNATURE', False)
        app.config.setdefault('API_SIGNATURE_EXCLUDE_PATHS', ['/health', '/metrics'])
    
    def _validate_signed_request(self):
        """Validate signed requests"""
        # Skip validation for excluded paths
        exclude_paths = current_app.config.get('API_SIGNATURE_EXCLUDE_PATHS', [])
        if request.path in exclude_paths:
            return
        
        # Skip if signature validation is not required
        if not current_app.config.get('API_REQUIRE_SIGNATURE', False):
            return
        
        # Get API key from header
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required for signed requests'}), 401
        
        # Validate API key and get secret
        is_valid, key_info, api_secret = self.api_key_manager.validate_key_and_get_secret(api_key)
        if not is_valid:
            return jsonify({'error': 'Invalid API key'}), 401
        
        # Check if signature is required for this key
        if not key_info.get('requires_signature', True):
            return
        
        # Get signature from header
        signature = request.headers.get('X-Signature')
        if not signature:
            return jsonify({'error': 'Signature required'}), 401
        
        # Get nonce and timestamp
        nonce = request.headers.get('X-Nonce')
        timestamp = request.headers.get('X-Timestamp')
        
        if not nonce or not timestamp:
            return jsonify({'error': 'Nonce and timestamp required'}), 400
        
        try:
            timestamp = int(timestamp)
        except ValueError:
            return jsonify({'error': 'Invalid timestamp format'}), 400
        
        # Validate nonce
        nonce_valid, nonce_error = self.api_signing.validate_nonce(nonce, timestamp)
        if not nonce_valid:
            return jsonify({'error': nonce_error}), 401
        
        # Get request body
        body = request.get_data(as_text=True)
        
        # Validate signature
        signature_valid, signature_error = self.api_signing.validate_signature(
            signature, request.method, request.url, dict(request.headers), body, api_secret
        )
        
        if not signature_valid:
            # Log signature validation failure
            self._log_security_event('invalid_signature', {
                'api_key': api_key[:8] + '...',
                'error': signature_error,
                'ip': request.remote_addr,
                'path': request.path
            })
            return jsonify({'error': signature_error}), 401
        
        # Store key info for use in endpoints
        g.api_key_info = key_info
        g.api_secret = api_secret
    
    def _log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security events"""
        try:
            from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
            
            event_monitor.log_event(
                category=EventCategory.SECURITY,
                event_type=EventType.SUSPICIOUS_ACTIVITY,
                severity=EventSeverity.HIGH,
                description=f"API Signing Security Event: {event_type}",
                details=details,
                ip_address=details.get('ip', ''),
                tags=['api_signing', event_type]
            )
        except Exception:
            # Don't let logging errors break the application
            pass

# Decorators for request signing
def require_signature():
    """Require request signature decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get required headers
            api_key = request.headers.get('X-API-Key')
            signature = request.headers.get('X-Signature')
            nonce = request.headers.get('X-Nonce')
            timestamp = request.headers.get('X-Timestamp')
            
            if not all([api_key, signature, nonce, timestamp]):
                return jsonify({
                    'error': 'Missing required headers: X-API-Key, X-Signature, X-Nonce, X-Timestamp'
                }), 401
            
            # Get API key manager and signing instance
            api_key_manager = current_app.extensions.get('api_key_manager')
            api_signing = current_app.extensions.get('api_signing')
            
            if not api_key_manager or not api_signing:
                return jsonify({'error': 'API signing not configured'}), 500
            
            # Validate API key and get secret
            is_valid, key_info, api_secret = api_key_manager.validate_key_and_get_secret(api_key)
            if not is_valid:
                return jsonify({'error': 'Invalid API key'}), 401
            
            # Validate timestamp
            try:
                timestamp = int(timestamp)
            except ValueError:
                return jsonify({'error': 'Invalid timestamp format'}), 400
            
            # Validate nonce
            nonce_valid, nonce_error = api_signing.validate_nonce(nonce, timestamp)
            if not nonce_valid:
                return jsonify({'error': nonce_error}), 401
            
            # Get request body
            body = request.get_data(as_text=True)
            
            # Validate signature
            signature_valid, signature_error = api_signing.validate_signature(
                signature, request.method, request.url, dict(request.headers), body, api_secret
            )
            
            if not signature_valid:
                return jsonify({'error': signature_error}), 401
            
            # Store key info for use in endpoint
            g.api_key_info = key_info
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Global instances
api_signing = APISigning()
api_key_manager = APIKeyManager()
request_signing_middleware = RequestSigningMiddleware()
