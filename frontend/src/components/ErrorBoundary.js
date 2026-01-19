import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents app crashes and shows friendly error messages
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }

        // Log to error reporting service (e.g., Sentry, LogRocket)
        this.logErrorToService(error, errorInfo);

        // Update state with error details
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Show toast notification for minor errors
        if (this.state.errorCount < 3) {
            // Don't spam the user with error messages
            this.showErrorToast();
        }
    }

    logErrorToService = (error, errorInfo) => {
        // TODO: Send to your error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });

        // For now, log to localStorage for debugging
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                error: error.toString(),
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            existingLogs.push(errorLog);

            // Keep only last 50 errors
            if (existingLogs.length > 50) {
                existingLogs.shift();
            }

            localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    };

    showErrorToast = () => {
        // Dynamically import toast to avoid circular dependencies
        import('react-hot-toast').then(({ default: toast }) => {
            toast.error('Something went wrong. We\'re working on it!', {
                duration: 4000,
                position: 'top-right'
            });
        });
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI can be passed as prop
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                    <div className="text-center" style={{ maxWidth: '500px' }}>
                        <div className="mb-4">
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                            }}>
                                <FiAlertTriangle size={40} color="white" />
                            </div>

                            <h3 className="fw-bold mb-2">Oops! Something went wrong</h3>
                            <p className="text-muted mb-4">
                                We encountered an unexpected error. Don't worry, your data is safe.
                                Please try refreshing the page or go back to the dashboard.
                            </p>
                        </div>

                        <div className="d-flex gap-3 justify-content-center flex-wrap">
                            <Button
                                variant="primary"
                                onClick={this.handleReset}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiRefreshCw size={18} />
                                Try Again
                            </Button>

                            <Button
                                variant="outline-secondary"
                                onClick={this.handleReload}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiRefreshCw size={18} />
                                Reload Page
                            </Button>

                            <Button
                                variant="outline-primary"
                                onClick={this.handleGoHome}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiHome size={18} />
                                Go to Dashboard
                            </Button>
                        </div>

                        {/* Show error details in development only */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-start" style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                            }}>
                                <summary className="cursor-pointer fw-semibold mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <pre style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: '0.75rem',
                                    color: '#dc2626'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </Container>
            );
        }

        // No error, render children normally
        return this.props.children;
    }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export const withErrorBoundary = (Component, fallback) => {
    return (props) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
};

export default ErrorBoundary;
