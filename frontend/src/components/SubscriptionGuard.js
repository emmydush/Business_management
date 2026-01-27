import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

/**
 * A wrapper component that disables its children if the user doesn't have an active subscription.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element to wrap (e.g., a Button)
 * @param {string} props.message - Custom message to show in the tooltip
 * @param {boolean} props.fallback - If true, renders nothing instead of disabled children
 */
const SubscriptionGuard = ({ children, message, fallback = false }) => {
    const { has_subscription, can_write, is_superadmin, loading } = useSubscription();

    // If loading, render children as is (or could render a loader)
    if (loading) return children;

    // Superadmins always have access
    if (is_superadmin) return children;

    // If user has subscription and can write, render children normally
    if (has_subscription && can_write) return children;

    // If fallback is true, don't render anything
    if (fallback) return null;

    // Default message
    const tooltipMessage = message || "Your subscription is inactive. Please renew to perform this action.";

    // Clone the child element and add disabled prop and style
    const disabledChild = React.cloneElement(children, {
        disabled: true,
        style: { ...children.props.style, pointerEvents: 'none', opacity: 0.6 },
        onClick: (e) => e.preventDefault(), // Prevent click events
    });

    return (
        <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="subscription-tooltip">{tooltipMessage}</Tooltip>}
        >
            <span className="d-inline-block" style={{ cursor: 'not-allowed' }}>
                {disabledChild}
            </span>
        </OverlayTrigger>
    );
};

export default SubscriptionGuard;
