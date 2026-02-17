import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { Spinner } from 'react-bootstrap';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = sessionStorage.getItem('token');

            if (token) {
                try {
                    // If token exists, validate it by fetching user profile
                    const response = await authAPI.getProfile();
                    setUser(response.data.user);
                    sessionStorage.setItem('user', JSON.stringify(response.data.user));
                } catch (error) {
                    console.error('Token validation failed:', error);
                    // If token is invalid, clear all auth data
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    setUser(null);
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
    };

    const value = {
        user,
        login,
        logout
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
