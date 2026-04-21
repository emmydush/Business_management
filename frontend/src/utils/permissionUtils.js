/**
 * Permission Utility
 * Provides helpers to check user permissions across the application
 */

import { useAuth } from '../components/auth/AuthContext';

/**
 * Checks if a user has permission to access a module/action
 * @param {Object} user - The user object from useAuth
 * @param {string} module - The module name (matching AppModule constants in backend)
 * @param {string} action - The action type: 'view', 'create', 'edit', 'delete', 'export', 'approve', 'all'
 * @returns {boolean}
 */
export const checkPermission = (user, module, action = 'view') => {
    if (!user) return false;
    
    // Superadmin has access to everything
    if (user.role === 'superadmin') return true;
    
    // Global policy: only admin/superadmin can approve, reject (usually part of approve/edit), update (edit), or delete
    const adminOnlyActions = ['approve', 'reject', 'edit', 'delete'];
    if (adminOnlyActions.includes(action)) {
        if (user.role !== 'admin') return false;
    }
    
    // If user has no permissions object, default to false
    if (!user.permissions) return false;
    
    const modulePerms = user.permissions[module];
    
    // If module doesn't exist in permissions, no access
    if (!modulePerms || !Array.isArray(modulePerms)) return false;
    
    // Check for 'all' permission or the specific action
    return modulePerms.includes('all') || modulePerms.includes(action);
};

/**
 * React hook for using permissions in components
 * @returns {Object} Helper functions for permissions
 */
export const usePermissions = () => {
    const { user } = useAuth();
    
    return {
        can: (module, action) => checkPermission(user, module, action),
        hasModule: (module) => checkPermission(user, module, 'view'),
        isSuperAdmin: user?.role === 'superadmin',
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin'
    };
};
