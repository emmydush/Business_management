import React from 'react';
import { Spinner, Button } from 'react-bootstrap';
import {
    FiInbox,
    FiAlertCircle,
    FiWifiOff,
    FiRefreshCw,
    FiPlus,
    FiSearch,
    FiDatabase
} from 'react-icons/fi';

/**
 * Reusable Empty State Component
 * Always show something - never leave users with blank screens
 */

// Generic loading state
export const LoadingState = ({ message = 'Loading...', size = 'md' }) => {
    const sizeMap = {
        sm: 20,
        md: 40,
        lg: 60
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <Spinner
                animation="border"
                variant="primary"
                style={{ width: sizeMap[size], height: sizeMap[size] }}
            />
            <p className="text-muted mt-3 mb-0">{message}</p>
        </div>
    );
};

// Empty data state
export const EmptyState = ({
    icon: Icon = FiInbox,
    title = 'No data available',
    description = 'There\'s nothing here yet.',
    actionLabel = null,
    onAction = null,
    actionIcon: ActionIcon = FiPlus
}) => {
    return (
        <div className="text-center py-5">
            <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <Icon size={36} className="text-muted" />
            </div>

            <h5 className="fw-bold mb-2">{title}</h5>
            <p className="text-muted mb-4">{description}</p>

            {actionLabel && onAction && (
                <Button
                    variant="primary"
                    onClick={onAction}
                    className="d-inline-flex align-items-center gap-2"
                >
                    <ActionIcon size={18} />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

// Error state with retry
export const ErrorState = ({
    title = 'Something went wrong',
    description = 'We couldn\'t load this data. Please try again.',
    onRetry = null,
    showRetry = true
}) => {
    return (
        <div className="text-center py-5">
            <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <FiAlertCircle size={36} className="text-danger" />
            </div>

            <h5 className="fw-bold mb-2">{title}</h5>
            <p className="text-muted mb-4">{description}</p>

            {showRetry && onRetry && (
                <Button
                    variant="outline-primary"
                    onClick={onRetry}
                    className="d-inline-flex align-items-center gap-2"
                >
                    <FiRefreshCw size={18} />
                    Try Again
                </Button>
            )}
        </div>
    );
};

// Offline state
export const OfflineState = ({
    onRetry = null
}) => {
    return (
        <div className="text-center py-5">
            <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <FiWifiOff size={36} className="text-warning" />
            </div>

            <h5 className="fw-bold mb-2">You're Offline</h5>
            <p className="text-muted mb-4">
                Please check your internet connection and try again.
            </p>

            {onRetry && (
                <Button
                    variant="outline-warning"
                    onClick={onRetry}
                    className="d-inline-flex align-items-center gap-2"
                >
                    <FiRefreshCw size={18} />
                    Retry
                </Button>
            )}
        </div>
    );
};

// No search results state
export const NoResultsState = ({
    searchTerm = '',
    onClear = null
}) => {
    return (
        <div className="text-center py-5">
            <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <FiSearch size={36} className="text-primary" />
            </div>

            <h5 className="fw-bold mb-2">No Results Found</h5>
            <p className="text-muted mb-4">
                {searchTerm
                    ? `No results for "${searchTerm}". Try a different search term.`
                    : 'Try adjusting your search or filters.'}
            </p>

            {onClear && (
                <Button
                    variant="outline-secondary"
                    onClick={onClear}
                    size="sm"
                >
                    Clear Search
                </Button>
            )}
        </div>
    );
};

// Permission denied state
export const PermissionDeniedState = () => {
    return (
        <div className="text-center py-5">
            <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
            </div>

            <h5 className="fw-bold mb-2">Access Denied</h5>
            <p className="text-muted mb-4">
                You don't have permission to view this content.
            </p>
        </div>
    );
};

// Generic content placeholder (skeleton)
export const ContentPlaceholder = ({ rows = 3 }) => {
    return (
        <div className="placeholder-glow">
            {[...Array(rows)].map((_, index) => (
                <div key={index} className="mb-3">
                    <div className="placeholder col-12" style={{ height: '60px', borderRadius: '8px' }}></div>
                </div>
            ))}
        </div>
    );
};

/**
 * Smart wrapper that handles all states automatically
 */
export const DataContainer = ({
    loading,
    error,
    empty,
    offline,
    permissionDenied,
    children,
    emptyStateProps = {},
    errorStateProps = {},
    loadingMessage,
    onRetry
}) => {
    // Check states in priority order
    if (loading) {
        return <LoadingState message={loadingMessage} />;
    }

    if (offline) {
        return <OfflineState onRetry={onRetry} />;
    }

    if (permissionDenied) {
        return <PermissionDeniedState />;
    }

    if (error) {
        return <ErrorState {...errorStateProps} onRetry={onRetry} />;
    }

    if (empty) {
        return <EmptyState {...emptyStateProps} />;
    }

    // All good, show content
    return children;
};

// Export all components
export default {
    LoadingState,
    EmptyState,
    ErrorState,
    OfflineState,
    NoResultsState,
    PermissionDeniedState,
    ContentPlaceholder,
    DataContainer
};
