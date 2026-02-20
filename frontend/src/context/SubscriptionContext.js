import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
    }, []);

    useEffect(() => {
        fetchSubscriptionStatus();

        // Refresh subscription status every 5 minutes
        const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
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
