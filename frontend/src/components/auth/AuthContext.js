import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Error parsing user data from localStorage:', error);
                    localStorage.removeItem('user');
                }
            }

            // If token exists but no user (or parsing failed), try to fetch profile
            if (token && !localStorage.getItem('user')) {
                try {
                    const response = await authAPI.getProfile();
                    setUser(response.data.user);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    // If token is invalid, clear it
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem('token');
                    }
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const value = {
        user,
        login,
        logout
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};