import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

export const SubscriptionProvider = ({ children }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState({
        has_subscription: false,
        can_write: false,
        subscription: null,
        is_superadmin: false,
        loading: true,
        features: [],
        plan_type: null,
        plan_name: null
    });

    // State for upgrade required errors from API calls
    const [upgradeRequired, setUpgradeRequired] = useState(null);

    const fetchSubscriptionStatus = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setSubscriptionStatus({
                    has_subscription: true, // All users now have access
                    can_write: true,
                    subscription: null,
                    is_superadmin: false,
                    loading: false,
                    features: [], // No feature restrictions
                    plan_type: 'unlimited', // Unlimited plan
                    plan_name: 'Unlimited Access'
                });
                return;
            }

            console.log('Fetching subscription status...');
            const response = await authAPI.getSubscriptionStatus();
            console.log('Subscription API response:', response.data);
            
            // All users now have unlimited access - ignore subscription restrictions
            const subscriptionData = {
                has_subscription: true,
                can_write: true,
                subscription: response.data?.subscription || null,
                is_superadmin: Boolean(response.data?.is_superadmin),
                loading: false,
                features: [], // No feature restrictions
                plan_type: 'unlimited',
                plan_name: 'Unlimited Access'
            };
            
            setSubscriptionStatus(subscriptionData);
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
            // Even on error, grant unlimited access
            setSubscriptionStatus({
                has_subscription: true,
                can_write: true,
                subscription: null,
                is_superadmin: false,
                loading: false,
                features: [],
                plan_type: 'unlimited',
                plan_name: 'Unlimited Access'
            });
        }
    }, []);

    useEffect(() => {
        fetchSubscriptionStatus();

        // Refresh subscription status every 5 minutes
        const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
        
        // Listen for user login events to refresh subscription status
        const handleUserLogin = () => {
            console.log('User logged in, refreshing subscription status...');
            fetchSubscriptionStatus();
        };
        
        window.addEventListener('user-logged-in', handleUserLogin);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('user-logged-in', handleUserLogin);
        };
    }, [fetchSubscriptionStatus]);

    const value = useMemo(() => ({
        ...subscriptionStatus,
        refreshSubscriptionStatus: fetchSubscriptionStatus,
        upgradeRequired,
        setUpgradeRequired,
        clearUpgradeRequired: () => setUpgradeRequired(null)
    }), [subscriptionStatus, fetchSubscriptionStatus, upgradeRequired]);

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
