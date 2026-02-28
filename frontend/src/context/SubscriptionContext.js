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
                    has_subscription: false,
                    can_write: false,
                    subscription: null,
                    is_superadmin: false,
                    loading: false,
                    features: [],
                    plan_type: null,
                    plan_name: null
                });
                return;
            }

            console.log('Fetching subscription status...');
            const response = await authAPI.getSubscriptionStatus();
            console.log('Subscription API response:', response.data);
            
            // Ensure we have valid data before updating state
            const subscriptionData = {
                has_subscription: Boolean(response.data?.has_subscription),
                can_write: Boolean(response.data?.can_write),
                subscription: response.data?.subscription || null,
                is_superadmin: Boolean(response.data?.is_superadmin),
                loading: false,
                features: response.data?.features || [],
                plan_type: response.data?.plan_type || null,
                plan_name: response.data?.plan_name || null
            };
            
            setSubscriptionStatus(subscriptionData);
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
            // If there's an error, assume no subscription (safe default)
            setSubscriptionStatus({
                has_subscription: false,
                can_write: false,
                subscription: null,
                is_superadmin: false,
                loading: false,
                features: [],
                plan_type: null,
                plan_name: null
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
