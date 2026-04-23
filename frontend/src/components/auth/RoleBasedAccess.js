import React from 'react';
import { Alert } from 'react-bootstrap';
import { usePermissions } from '../../utils/permissionUtils';

/**
 * RoleBasedAccess Component
 * Renders children only if user has the required role/permission
 */
export const RoleBasedAccess = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null,
  module = null,
  fallback = null 
}) => {
  const { can, isAdmin, isManager, isStaff, isSuperAdmin } = usePermissions();

  // Check role-based access
  const hasRoleAccess = () => {
    if (!requiredRole) return true;
    
    switch (requiredRole) {
      case 'superadmin':
        return isSuperAdmin;
      case 'admin':
        return isAdmin;
      case 'manager':
        return isManager || isAdmin;
      case 'staff':
        return isStaff || isManager || isAdmin;
      default:
        return true;
    }
  };

  // Check permission-based access
  const hasPermissionAccess = () => {
    if (!module || !requiredPermission) return true;
    return can(module, requiredPermission);
  };

  const hasAccess = hasRoleAccess() && hasPermissionAccess();

  if (!hasAccess) {
    return fallback || (
      <Alert variant="warning" className="text-center">
        <div className="mb-3">
          <h5 className="mb-2">
            <i className="bi bi-shield-exclamation-triangle me-2"></i>
            Access Denied
          </h5>
          <p className="mb-2">
            You don&apos;t have permission to access this feature.
          </p>
          {requiredRole && (
            <p className="mb-1">
              <strong>Required Role:</strong> {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} or higher
            </p>
          )}
          {module && requiredPermission && (
            <p className="mb-1">
              <strong>Required Permission:</strong> {requiredPermission} access for {module.charAt(0).toUpperCase() + module.slice(1)}
            </p>
          )}
          <p className="text-muted mb-0">
            <small>
              Please contact your administrator if you believe this is an error, or if you need additional permissions.
            </small>
          </p>
        </div>
      </Alert>
    );
  }

  return <>{children}</>;
};

/**
 * Higher-order component for role-based route protection
 */
export const withRoleBasedAccess = (WrappedComponent, options = {}) => {
  const WrappedWithRoleAccess = (props) => (
    <RoleBasedAccess {...options}>
      <WrappedComponent {...props} />
    </RoleBasedAccess>
  );
  WrappedWithRoleAccess.displayName = `withRoleBasedAccess(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WrappedWithRoleAccess;
};

export default RoleBasedAccess;
