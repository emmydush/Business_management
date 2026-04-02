"""
API Versioning and Deprecation Management
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from functools import wraps
from flask import request, jsonify, g, current_app, Blueprint
from werkzeug.exceptions import NotAcceptable, Gone

class APIVersion:
    """API version information"""
    
    def __init__(self, version: str, status: str = 'current', 
                 deprecation_date: datetime = None, 
                 sunset_date: datetime = None,
                 migration_guide: str = None):
        self.version = version
        self.status = status  # 'development', 'current', 'deprecated', 'sunset'
        self.deprecation_date = deprecation_date
        self.sunset_date = sunset_date
        self.migration_guide = migration_guide
    
    def is_deprecated(self) -> bool:
        """Check if version is deprecated"""
        return self.status == 'deprecated' or (
            self.deprecation_date and self.deprecation_date <= datetime.utcnow()
        )
    
    def is_sunset(self) -> bool:
        """Check if version is sunset (no longer supported)"""
        return self.status == 'sunset' or (
            self.sunset_date and self.sunset_date <= datetime.utcnow()
        )
    
    def get_warning_headers(self) -> Dict[str, str]:
        """Get warning headers for deprecated/sunset versions"""
        headers = {}
        
        if self.is_deprecated():
            headers['Deprecation'] = 'true'
            if self.sunset_date:
                headers['Sunset'] = self.sunset_date.strftime('%a, %d %b %Y %H:%M:%S GMT')
            if self.migration_guide:
                headers['Link'] = f'<{self.migration_guide}>; rel="deprecation"'
        
        if self.is_sunset():
            headers['Sunset'] = self.sunset_date.strftime('%a, %d %b %Y %H:%M:%S GMT') if self.sunset_date else 'true'
        
        return headers

class APIVersionManager:
    """API version management system"""
    
    def __init__(self):
        self.versions: Dict[str, APIVersion] = {}
        self.blueprints: Dict[str, Dict[str, Blueprint]] = {}  # version -> prefix -> blueprint
        self.default_version = None
        self.supported_versions = []
    
    def register_version(self, 
                        version: str, 
                        status: str = 'current',
                        deprecation_date: datetime = None,
                        sunset_date: datetime = None,
                        migration_guide: str = None,
                        is_default: bool = False):
        """Register an API version"""
        api_version = APIVersion(
            version=version,
            status=status,
            deprecation_date=deprecation_date,
            sunset_date=sunset_date,
            migration_guide=migration_guide
        )
        
        self.versions[version] = api_version
        
        if is_default or not self.default_version:
            self.default_version = version
        
        # Update supported versions
        self._update_supported_versions()
    
    def register_blueprint(self, blueprint: Blueprint, version: str, prefix: str = None):
        """Register a blueprint for a specific version"""
        if version not in self.versions:
            raise ValueError(f"Version {version} is not registered")
        
        if version not in self.blueprints:
            self.blueprints[version] = {}
        
        self.blueprints[version][prefix or blueprint.name] = blueprint
    
    def get_version_from_request(self) -> Tuple[str, APIVersion]:
        """Extract API version from request"""
        # Method 1: URL path versioning (/api/v1/users)
        path_version = self._extract_version_from_path()
        if path_version and path_version in self.versions:
            return path_version, self.versions[path_version]
        
        # Method 2: Header versioning (Accept: application/vnd.api+json;version=1)
        header_version = self._extract_version_from_header()
        if header_version and header_version in self.versions:
            return header_version, self.versions[header_version]
        
        # Method 3: Query parameter versioning (?version=1)
        query_version = self._extract_version_from_query()
        if query_version and query_version in self.versions:
            return query_version, self.versions[query_version]
        
        # Method 4: Custom header (X-API-Version: 1)
        custom_header_version = self._extract_version_from_custom_header()
        if custom_header_version and custom_header_version in self.versions:
            return custom_header_version, self.versions[custom_header_version]
        
        # Fallback to default version
        if self.default_version:
            return self.default_version, self.versions[self.default_version]
        
        raise ValueError("No valid API version found and no default version set")
    
    def _extract_version_from_path(self) -> Optional[str]:
        """Extract version from URL path (/api/v1/users -> v1)"""
        path = request.path
        match = re.match(r'.*/api/v(\d+(?:\.\d+)?)', path)
        return match.group(1) if match else None
    
    def _extract_version_from_header(self) -> Optional[str]:
        """Extract version from Accept header"""
        accept_header = request.headers.get('Accept', '')
        
        # Look for version in Accept header
        # Accept: application/vnd.api+json;version=1
        match = re.search(r'version=(\d+(?:\.\d+)?)', accept_header)
        return match.group(1) if match else None
    
    def _extract_version_from_query(self) -> Optional[str]:
        """Extract version from query parameter"""
        return request.args.get('version')
    
    def _extract_version_from_custom_header(self) -> Optional[str]:
        """Extract version from X-API-Version header"""
        return request.headers.get('X-API-Version')
    
    def _update_supported_versions(self):
        """Update list of supported versions"""
        self.supported_versions = [
            version for version, api_version in self.versions.items()
            if not api_version.is_sunset()
        ]
    
    def get_version_info(self, version: str = None) -> Dict:
        """Get information about API versions"""
        if version and version in self.versions:
            api_version = self.versions[version]
            return {
                'version': version,
                'status': api_version.status,
                'is_deprecated': api_version.is_deprecated(),
                'is_sunset': api_version.is_sunset(),
                'deprecation_date': api_version.deprecation_date.isoformat() if api_version.deprecation_date else None,
                'sunset_date': api_version.sunset_date.isoformat() if api_version.sunset_date else None,
                'migration_guide': api_version.migration_guide
            }
        
        # Return all versions
        return {
            'default_version': self.default_version,
            'supported_versions': self.supported_versions,
            'versions': {
                version: {
                    'status': api_version.status,
                    'is_deprecated': api_version.is_deprecated(),
                    'is_sunset': api_version.is_sunset(),
                    'deprecation_date': api_version.deprecation_date.isoformat() if api_version.deprecation_date else None,
                    'sunset_date': api_version.sunset_date.isoformat() if api_version.sunset_date else None,
                    'migration_guide': api_version.migration_guide
                }
                for version, api_version in self.versions.items()
            }
        }

class APIVersioningMiddleware:
    """Middleware for API versioning"""
    
    def __init__(self, app=None, version_manager=None):
        self.version_manager = version_manager or APIVersionManager()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        app.before_request(self._handle_versioning)
        app.after_request(self._add_version_headers)
        
        # Store version manager in app
        app.extensions['api_version_manager'] = self.version_manager
        
        # Register version info endpoint
        @app.route('/api/versions')
        def get_versions():
            return jsonify(self.version_manager.get_version_info())
    
    def _handle_versioning(self):
        """Handle API versioning before request"""
        # Skip versioning for non-API routes
        if not request.path.startswith('/api/'):
            return
        
        try:
            version, api_version = self.version_manager.get_version_from_request()
            g.api_version = version
            g.api_version_info = api_version
            
            # Check if version is sunset
            if api_version.is_sunset():
                return jsonify({
                    'error': 'API version is no longer supported',
                    'version': version,
                    'message': 'This API version has been sunset. Please upgrade to a newer version.',
                    'supported_versions': self.version_manager.supported_versions
                }), 410
            
            # Log deprecated version usage
            if api_version.is_deprecated():
                self._log_deprecation_warning(version, api_version)
        
        except ValueError as e:
            return jsonify({
                'error': 'Invalid API version',
                'message': str(e),
                'supported_versions': self.version_manager.supported_versions,
                'default_version': self.version_manager.default_version
            }), 400
    
    def _add_version_headers(self, response):
        """Add version-related headers to response"""
        if hasattr(g, 'api_version_info'):
            api_version = g.api_version_info
            
            # Add warning headers for deprecated versions
            warning_headers = api_version.get_warning_headers()
            for header, value in warning_headers.items():
                response.headers[header] = value
            
            # Add API version header
            response.headers['API-Version'] = g.api_version
            
            # Add supported versions header
            response.headers['API-Supported-Versions'] = ', '.join(self.version_manager.supported_versions)
        
        return response
    
    def _log_deprecation_warning(self, version: str, api_version: APIVersion):
        """Log usage of deprecated API version"""
        try:
            from app.utils.event_monitor import event_monitor, EventCategory, EventType, EventSeverity
            
            event_monitor.log_event(
                category=EventCategory.SYSTEM,
                event_type=EventType.SYSTEM_ERROR,
                severity=EventSeverity.MEDIUM,
                description=f"Deprecated API version {version} is being used",
                details={
                    'version': version,
                    'deprecation_date': api_version.deprecation_date.isoformat() if api_version.deprecation_date else None,
                    'sunset_date': api_version.sunset_date.isoformat() if api_version.sunset_date else None,
                    'path': request.path,
                    'method': request.method,
                    'ip': request.remote_addr
                },
                tags=['api_versioning', 'deprecated', version]
            )
        except Exception:
            # Don't let logging errors break the application
            pass

# Decorators for API versioning
def api_version(*versions, deprecated: bool = False):
    """Decorator to specify API version(s) for an endpoint"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check if current version is supported
            if hasattr(g, 'api_version'):
                current_version = g.api_version
                
                if versions and current_version not in versions:
                    return jsonify({
                        'error': 'Endpoint not available in this API version',
                        'current_version': current_version,
                        'supported_versions': list(versions)
                    }), 404
                
                # Add deprecation warning if needed
                if deprecated and hasattr(g, 'api_version_info'):
                    api_version = g.api_version_info
                    if api_version.is_deprecated():
                        response = func(*args, **kwargs)
                        if isinstance(response, tuple):
                            response_data, status_code = response
                        else:
                            response_data, status_code = response, 200
                        
                        if isinstance(response_data, dict):
                            response_data['warnings'] = response_data.get('warnings', [])
                            response_data['warnings'].append({
                                'type': 'deprecated_endpoint',
                                'message': 'This endpoint is deprecated and will be removed in a future version',
                                'deprecation_date': api_version.deprecation_date.isoformat() if api_version.deprecation_date else None,
                                'migration_guide': api_version.migration_guide
                            })
                        
                        return response_data, status_code
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def deprecated(since_version: str, removal_version: str = None, message: str = None):
    """Decorator to mark endpoints as deprecated"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            response = func(*args, **kwargs)
            
            if isinstance(response, tuple):
                response_data, status_code = response
            else:
                response_data, status_code = response, 200
            
            if isinstance(response_data, dict):
                response_data['warnings'] = response_data.get('warnings', [])
                response_data['warnings'].append({
                    'type': 'deprecated',
                    'since_version': since_version,
                    'removal_version': removal_version,
                    'message': message or f"This endpoint is deprecated since version {since_version}"
                })
            
            return response_data, status_code
        return wrapper
    return decorator

def versioned_response(version_mapping: Dict[str, dict]):
    """Decorator to provide different responses based on API version"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Execute the function to get base response
            base_response = func(*args, **kwargs)
            
            if isinstance(base_response, tuple):
                response_data, status_code = base_response
            else:
                response_data, status_code = base_response, 200
            
            # Get current version
            current_version = getattr(g, 'api_version', None)
            
            if current_version and current_version in version_mapping:
                # Apply version-specific modifications
                version_mods = version_mapping[current_version]
                
                # Add/remove fields
                if 'add_fields' in version_mods:
                    response_data.update(version_mods['add_fields'])
                
                if 'remove_fields' in version_mods:
                    for field in version_mods['remove_fields']:
                        response_data.pop(field, None)
                
                # Transform fields
                if 'transform_fields' in version_mods:
                    for field, transform in version_mods['transform_fields'].items():
                        if field in response_data:
                            response_data[field] = transform(response_data[field])
            
            return response_data, status_code
        return wrapper
    return decorator

# Blueprint helper for versioned APIs
def versioned_blueprint(name: str, import_name: str, version: str, **kwargs):
    """Create a versioned blueprint"""
    blueprint = Blueprint(f"{name}_v{version}", import_name, **kwargs)
    
    # Add version information to blueprint
    blueprint.api_version = version
    
    return blueprint

# Global instance
api_version_manager = APIVersionManager()
api_versioning_middleware = APIVersioningMiddleware(version_manager=api_version_manager)
