/**
 * A wrapper component that always renders children - subscription restrictions removed
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element to wrap
 */
const SubscriptionGuard = ({ children }) => {
    // All users now have unlimited access - always render children
    return children;
};

export default SubscriptionGuard;
