import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
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

    return children;
};

export default ProtectedRoute;
