import React from 'react';
import { usePermissions } from '../utils/permissionUtils';

/**
 * PermissionGuard Component
 * Wraps content that should only be visible based on user permissions
 * 
 * @param {string} module - The module to check permissions for
 * @param {string} action - The action type: 'view', 'create', 'edit', 'delete', 'export', 'approve', 'all'
 * @param {React.ReactNode} children - Content to show if permission is granted
 * @param {React.ReactNode} fallback - Content to show if permission is denied (optional)
 */
const PermissionGuard = ({ module, action = 'view', children, fallback = null }) => {
    const { can } = usePermissions();
    
    if (can(module, action)) {
        return <>{children}</>;
    }
    
    return <>{fallback}</>;
};

export default PermissionGuard;
