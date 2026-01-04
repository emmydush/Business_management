import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear the token from local storage
        localStorage.removeItem('token');

        // Show success message
        toast.success('Successfully logged out!', {
            icon: '👋',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });

        // Redirect to the landing page
        navigate('/');
    }, [navigate]);

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
