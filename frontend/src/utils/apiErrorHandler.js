import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Global API Error Handler with Retry Logic
 * Handles errors silently and provides friendly user feedback
 */

// Create axios instance with defaults
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        // Success response
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Don't show errors for certain endpoints (silent failures)
        const silentEndpoints = ['/api/logs', '/api/analytics'];
        const isSilent = silentEndpoints.some(endpoint =>
            originalRequest.url?.includes(endpoint)
        );

        // Handle different error types
        if (!error.response) {
            // Network error (no response from server)
            handleNetworkError(error, originalRequest, isSilent);
        } else {
            // HTTP error response
            handleHttpError(error, originalRequest, isSilent);
        }

        return Promise.reject(error);
    }
);

/**
 * Handle network errors (no internet, server down, etc.)
 */
const handleNetworkError = async (error, originalRequest, isSilent) => {
    if (!isSilent) {
        // Check if offline
        if (!navigator.onLine) {
            toast.error('You appear to be offline. Please check your connection.', {
                duration: 3000,
                style: {
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }
            });

            // Listen for when user comes back online
            const handleOnline = () => {
                toast.success('You\'re back online!', { icon: '✅' });
                window.removeEventListener('online', handleOnline);

                // Optionally retry the failed request
                window.location.reload();
            };
            window.addEventListener('online', handleOnline);

        } else if (error.code === 'ECONNABORTED') {
            // Timeout error
            toast.error('Request timed out. The server is taking too long to respond.', {
                duration: 4000,
                style: {
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }
            });
        } else {
            // Generic network error
            toast.error('Unable to connect to server. Please try again later.', {
                duration: 4000,
                style: {
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }
            });
        }
    }

    // Log error for debugging
    logError('Network Error', error, originalRequest);
};

/**
 * Handle HTTP errors (4xx, 5xx)
 */
const handleHttpError = (error, originalRequest, isSilent) => {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
        case 400:
            // Bad Request - show specific error message
            if (!isSilent) {
                const message = data?.error || data?.message || 'Invalid request. Please check your input.';
                toast.error(message, { 
                    duration: 4000,
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 401:
            // Unauthorized - token expired or invalid
            handleUnauthorized();
            break;

        case 403:
            // Forbidden - user doesn't have permission
            if (!isSilent) {
                toast.error('You don\'t have permission to perform this action.', {
                    duration: 4000,
                    icon: '🔒',
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 404:
            // Not Found
            if (!isSilent) {
                toast.error('Requested resource not found.', { 
                    duration: 3000,
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 409:
            // Conflict (e.g., duplicate entry)
            if (!isSilent) {
                const message = data?.error || 'This item already exists.';
                toast.error(message, { 
                    duration: 4000,
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 422:
            // Validation Error
            if (!isSilent) {
                const message = data?.error || 'Validation failed. Please check your input.';
                toast.error(message, { 
                    duration: 4000,
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 429:
            // Too Many Requests - rate limited
            if (!isSilent) {
                toast.error('Too many requests. Please slow down and try again later.', {
                    duration: 3000,
                    icon: '⏱️',
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
            break;

        case 500:
        case 502:
        case 503:
        case 504:
            // Server errors
            if (!isSilent) {
                toast.error('Server error. Our team has been notified.', {
                    duration: 4000,
                    icon: '🔧',
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }

            // Retry logic for server errors
            retryRequest(originalRequest);
            break;

        default:
            // Generic error
            if (!isSilent) {
                toast.error('Something went wrong. Please try again.', {
                    duration: 3000,
                    style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }
                });
            }
    }

    // Log all HTTP errors
    logError(`HTTP ${status} Error`, error, originalRequest);
};

/**
 * Handle unauthorized errors (redirect to login)
 */
const handleUnauthorized = () => {
    // Clear session
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Show message
    toast.error('Session expired. Please login again.', {
        duration: 4000,
        icon: '🔑',
        style: {
            background: '#dc2626',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
        }
    });

    // Redirect to login after short delay
    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
};

/**
 * Retry failed requests (with exponential backoff)
 */
const retryRequest = async (originalRequest) => {
    // Don't retry if already retried 3 times
    if (originalRequest._retryCount >= 3) {
        return Promise.reject(new Error('Max retries reached'));
    }

    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(apiClient(originalRequest));
        }, delay);
    });
};

/**
 * Log errors to local storage (for debugging) and external service
 */
const logError = (type, error, request) => {
    try {
        const errorLog = {
            type,
            timestamp: new Date().toISOString(),
            url: request?.url,
            method: request?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
            userAgent: navigator.userAgent
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${type}]`, errorLog);
        }

        // Save to localStorage (last 20 errors)
        const logs = JSON.parse(localStorage.getItem('apiErrorLogs') || '[]');
        logs.unshift(errorLog);
        localStorage.setItem('apiErrorLogs', JSON.stringify(logs.slice(0, 20)));

        // TODO: Send to external error tracking service
        // sendToErrorService(errorLog);

    } catch (e) {
        console.error('Failed to log error:', e);
    }
};

/**
 * Safe API call wrapper with automatic error handling
 */
export const safeApiCall = async (apiFunction, options = {}) => {
    const {
        onSuccess,
        onError,
        loadingToast = false,
        successMessage = null,
        errorMessage = null,
        silent = false
    } = options;

    let toastId;

    if (loadingToast) {
        toastId = toast.loading('Processing...');
    }

    try {
        const response = await apiFunction();

        if (toastId) {
            toast.dismiss(toastId);
        }

        if (successMessage && !silent) {
            toast.success(successMessage);
        }

        if (onSuccess) {
            onSuccess(response.data);
        }

        return { success: true, data: response.data };

    } catch (error) {
        if (toastId) {
            toast.dismiss(toastId);
        }

        if (errorMessage && !silent) {
            toast.error(errorMessage);
        }

        if (onError) {
            onError(error);
        }

        return { success: false, error };
    }
};

/**
 * Check if online before making requests
 */
export const checkOnlineStatus = () => {
    return navigator.onLine;
};

/**
 * Retry mechanism for critical operations
 */
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

export default apiClient;
