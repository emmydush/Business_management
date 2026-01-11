import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import toast from 'react-hot-toast';

const Logout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const hasLoggedOut = React.useRef(false);

    useEffect(() => {
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;

        // Use the auth context to logout
        logout();

        // Show success message
        toast.success('Successfully logged out!', {
            icon: '👋',
            id: 'logout-success',
        });

        // Redirect to the landing page
        navigate('/');
    }, [navigate, logout]);

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Logging you out safely...</p>
            </div>
        </div>
    );
};

export default Logout;
