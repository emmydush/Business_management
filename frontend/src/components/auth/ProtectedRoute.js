import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { checkPermission } from '../../utils/permissionUtils';

const ProtectedRoute = ({ children, allowedRoles, module, action = 'view' }) => {
    const { user } = useAuth();

    if (!user) {
        // Not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirection should be role-aware to avoid sending superadmins to the regular dashboard
        const fallback = user.role === 'superadmin' ? '/superadmin' : '/dashboard';
        return <Navigate to={fallback} replace />;
    }

    if (module && !checkPermission(user, module, action)) {
        // If they don't have permission for this module, send them to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
