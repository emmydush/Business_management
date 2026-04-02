"""
Main API Hardening Integration
"""

from flask import Flask
from .api_security import APISecurityHardening, api_security
from .api_signing import RequestSigningMiddleware, api_signing, api_key_manager, request_signing_middleware
from .api_versioning import APIVersioningMiddleware, api_version_manager, api_versioning_middleware
from .api_monitoring import APIMonitoringMiddleware, api_monitor, api_monitoring_middleware
from .validation import SecurityValidator
from .security_middleware import SecurityMiddleware
import redis
import os
from dotenv import load_dotenv

load_dotenv()

class APIHardening:
    """Main API hardening orchestrator"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.redis_client = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize all API hardening components"""
        self.app = app
        
        # Initialize Redis client
        self._init_redis()
        
        # Initialize security components
        self._init_security_hardening()
        self._init_request_signing()
        self._init_api_versioning()
        self._init_monitoring()
        self._init_validation_middleware()
        
        # Store hardening instance in app
        app.extensions['api_hardening'] = self
    
    def _init_redis(self):
        """Initialize Redis client"""
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test connection
            self.redis_client.ping()
            print("✅ Redis connected for API hardening")
            
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}. Using fallback mechanisms.")
            self.redis_client = None
    
    def _init_security_hardening(self):
        """Initialize API security hardening"""
        api_security.init_app(self.app)
        self.app.extensions['api_security'] = api_security
        
        # Configure security settings
        self.app.config.update({
            'API_RATE_LIMIT': os.getenv('API_RATE_LIMIT', '1000/hour'),
            'API_MAX_REQUEST_SIZE': int(os.getenv('API_MAX_REQUEST_SIZE', '10485760')),  # 10MB
            'API_ENABLE_IP_WHITELIST': os.getenv('API_ENABLE_IP_WHITELIST', 'false').lower() == 'true',
            'API_ENABLE_API_KEY_AUTH': os.getenv('API_ENABLE_API_KEY_AUTH', 'true').lower() == 'true',
        })
        
        print("✅ API security hardening initialized")
    
    def _init_request_signing(self):
        """Initialize request signing middleware"""
        request_signing_middleware.init_app(self.app)
        self.app.extensions['api_signing'] = api_signing
        self.app.extensions['api_key_manager'] = api_key_manager
        
        # Configure signing settings
        self.app.config.update({
            'API_REQUIRE_SIGNATURE': os.getenv('API_REQUIRE_SIGNATURE', 'false').lower() == 'true',
            'API_SIGNATURE_EXCLUDE_PATHS': os.getenv('API_SIGNATURE_EXCLUDE_PATHS', '/health,/metrics').split(','),
        })
        
        print("✅ API request signing initialized")
    
    def _init_api_versioning(self):
        """Initialize API versioning"""
        api_versioning_middleware.init_app(self.app)
        self.app.extensions['api_version_manager'] = api_version_manager
        
        # Register API versions
        self._register_api_versions()
        
        print("✅ API versioning initialized")
    
    def _register_api_versions(self):
        """Register API versions"""
        from datetime import datetime, timedelta
        
        # Current version
        api_version_manager.register_version(
            version="1",
            status="current",
            is_default=True
        )
        
        # Development version (future)
        api_version_manager.register_version(
            version="2",
            status="development"
        )
        
        # Legacy version (deprecated)
        api_version_manager.register_version(
            version="0.9",
            status="deprecated",
            deprecation_date=datetime.utcnow() + timedelta(days=90),
            sunset_date=datetime.utcnow() + timedelta(days=180),
            migration_guide="https://docs.example.com/migration/v0.9-to-v1"
        )
    
    def _init_monitoring(self):
        """Initialize API monitoring"""
        api_monitoring_middleware.init_app(self.app)
        self.app.extensions['api_monitor'] = api_monitor
        
        print("✅ API monitoring initialized")
    
    def _init_validation_middleware(self):
        """Initialize validation middleware"""
        security_middleware = SecurityMiddleware(self.app)
        self.app.extensions['security_middleware'] = security_middleware
        
        print("✅ Security middleware initialized")
    
    def generate_api_key(self, business_id: str, name: str, **kwargs):
        """Generate new API key"""
        if self.redis_client:
            return api_key_manager.generate_key_pair(business_id, name, **kwargs)
        else:
            raise Exception("Redis client not available for API key generation")
    
    def revoke_api_key(self, api_key: str):
        """Revoke API key"""
        if self.redis_client:
            return api_key_manager.revoke_key(api_key)
        else:
            raise Exception("Redis client not available for API key revocation")
    
    def add_ip_to_blacklist(self, ip: str, reason: str = ""):
        """Add IP to blacklist"""
        if self.redis_client:
            return api_security.ip_manager.add_to_blacklist(ip, reason)
        else:
            raise Exception("Redis client not available for IP blacklist management")
    
    def remove_ip_from_blacklist(self, ip: str):
        """Remove IP from blacklist"""
        if self.redis_client:
            return api_security.ip_manager.remove_from_blacklist(ip)
        else:
            raise Exception("Redis client not available for IP blacklist management")
    
    def add_ip_to_whitelist(self, ip: str):
        """Add IP to whitelist"""
        if self.redis_client:
            return api_security.ip_manager.add_to_whitelist(ip)
        else:
            raise Exception("Redis client not available for IP whitelist management")
    
    def remove_ip_from_whitelist(self, ip: str):
        """Remove IP from whitelist"""
        if self.redis_client:
            return api_security.ip_manager.remove_from_whitelist(ip)
        else:
            raise Exception("Redis client not available for IP whitelist management")
    
    def get_security_status(self) -> dict:
        """Get overall security status"""
        status = {
            'redis_connected': self.redis_client is not None,
            'security_hardening': 'api_security' in self.app.extensions,
            'request_signing': 'api_signing' in self.app.extensions,
            'api_versioning': 'api_version_manager' in self.app.extensions,
            'monitoring': 'api_monitor' in self.app.extensions,
            'validation_middleware': 'security_middleware' in self.app.extensions,
            'configuration': {
                'rate_limiting': self.app.config.get('API_RATE_LIMIT'),
                'max_request_size': self.app.config.get('API_MAX_REQUEST_SIZE'),
                'ip_whitelist_enabled': self.app.config.get('API_ENABLE_IP_WHITELIST'),
                'api_key_auth_enabled': self.app.config.get('API_ENABLE_API_KEY_AUTH'),
                'signature_required': self.app.config.get('API_REQUIRE_SIGNATURE'),
            }
        }
        
        return status

# Global instance
api_hardening = APIHardening()

# Convenience decorators for easy use
from .api_security import rate_limit, require_api_key, ip_whitelist_only
from .api_signing import require_signature
from .api_versioning import api_version, deprecated, versioned_response
from .api_monitoring import monitor_endpoint

# Combined security decorators
def secure_endpoint(rate_limit_config=None, require_key=False, require_sig=False, ip_whitelist=False):
    """Combined security decorator for endpoints"""
    def decorator(func):
        # Apply decorators in order
        if ip_whitelist:
            func = ip_whitelist_only()(func)
        if require_sig:
            func = require_signature()(func)
        if require_key:
            func = require_api_key()(func)
        if rate_limit_config:
            if isinstance(rate_limit_config, dict):
                func = rate_limit(
                    limit=rate_limit_config.get('limit', 100),
                    window=rate_limit_config.get('window', 3600),
                    strategy=rate_limit_config.get('strategy', 'sliding_window')
                )(func)
            else:
                func = rate_limit(rate_limit_config)(func)
        
        return func
    return decorator

def hardened_api_endpoint(**kwargs):
    """Fully hardened API endpoint with all security measures"""
    return secure_endpoint(
        rate_limit_config=kwargs.get('rate_limit', {'limit': 100, 'window': 3600}),
        require_key=kwargs.get('require_key', True),
        require_sig=kwargs.get('require_signature', False),
        ip_whitelist=kwargs.get('ip_whitelist', False)
    )
