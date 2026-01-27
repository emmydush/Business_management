import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

export const SubscriptionProvider = ({ children }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState({
        has_subscription: true,
        can_write: true,
        subscription: null,
        is_superadmin: false,
        loading: true
    });

    const fetchSubscriptionStatus = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setSubscriptionStatus({
                    has_subscription: false,
                    can_write: false,
                    subscription: null,
                    is_superadmin: false,
                    loading: false
                });
                return;
            }

            const response = await authAPI.getSubscriptionStatus();
            setSubscriptionStatus({
                ...response.data,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
            // If there's an error, assume no subscription (safe default)
            setSubscriptionStatus({
                has_subscription: false,
                can_write: false,
                subscription: null,
                is_superadmin: false,
                loading: false
            });
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();

        // Refresh subscription status every 5 minutes
        const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const value = {
        ...subscriptionStatus,
        refreshSubscriptionStatus: fetchSubscriptionStatus
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
