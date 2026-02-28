/**
 * Validation Utilities
 * Never trust user input - validate everything before processing
 */

// Email validation with strict RFC 5322 compliance
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321
};

// Phone validation (Rwanda format primarily, but flexible)
export const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Rwanda: 10 digits (07X XXX XXXX) or with country code +250
    // International: 10-15 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
};

// String validation with length limits
export const isValidString = (str, minLength = 1, maxLength = 255) => {
    if (!str || typeof str !== 'string') return false;

    const trimmed = str.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// Number validation with range checks
export const isValidNumber = (num, min = null, max = null) => {
    const parsed = parseFloat(num);

    if (isNaN(parsed) || !isFinite(parsed)) return false;
    if (min !== null && parsed < min) return false;
    if (max !== null && parsed > max) return false;

    return true;
};

// Price/Money validation (must be positive, max 2 decimals)
export const isValidPrice = (price) => {
    if (!isValidNumber(price, 0)) return false;

    const str = price.toString();
    const decimals = str.split('.')[1];

    return !decimals || decimals.length <= 2;
};

// Date validation
export const isValidDate = (date) => {
    if (!date) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
};

// Future date validation
export const isFutureDate = (date) => {
    if (!isValidDate(date)) return false;
    return new Date(date) > new Date();
};

// Past date validation
export const isPastDate = (date) => {
    if (!isValidDate(date)) return false;
    return new Date(date) < new Date();
};

// Username validation (alphanumeric, underscore, hyphen only)
export const isValidUsername = (username) => {
    if (!username || typeof username !== 'string') return false;

    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
};

// Password strength validation
export const validatePassword = (password) => {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { isValid: false, errors: ['Password is required'] };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength: getPasswordStrength(password)
    };
};

// Password strength meter
const getPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    if (strength <= 4) return 'strong';
    return 'very-strong';
};

// URL validation
export const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

// Sanitize input (prevent XSS)
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate file upload
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
        allowedExtensions = ['.jpg', '.jpeg', '.png']
    } = options;

    const errors = [];

    if (!file) {
        return { isValid: false, errors: ['No file selected'] };
    }

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        errors.push(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate array (not empty)
export const isValidArray = (arr, minLength = 1) => {
    return Array.isArray(arr) && arr.length >= minLength;
};

// Validate object (not empty)
export const isValidObject = (obj) => {
    return obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
};

// Comprehensive form validation
export const validateForm = (formData, rules) => {
    const errors = {};

    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const fieldRules = rules[field];

        // Required check
        if (fieldRules.required && !value) {
            errors[field] = `${fieldRules.label || field} is required`;
            return;
        }

        // Skip other validations if field is empty and not required
        if (!value && !fieldRules.required) {
            return;
        }

        // Type-specific validations
        switch (fieldRules.type) {
            case 'email':
                if (!isValidEmail(value)) {
                    errors[field] = 'Invalid email address';
                }
                break;

            case 'phone':
                if (!isValidPhone(value)) {
                    errors[field] = 'Invalid phone number';
                }
                break;

            case 'number':
                if (!isValidNumber(value, fieldRules.min, fieldRules.max)) {
                    errors[field] = `Invalid number${fieldRules.min !== undefined ? ` (min: ${fieldRules.min})` : ''}${fieldRules.max !== undefined ? ` (max: ${fieldRules.max})` : ''}`;
                }
                break;

            case 'price':
                if (!isValidPrice(value)) {
                    errors[field] = 'Invalid price format';
                }
                break;

            case 'date':
                if (!isValidDate(value)) {
                    errors[field] = 'Invalid date';
                }
                break;

            case 'string':
                if (!isValidString(value, fieldRules.minLength, fieldRules.maxLength)) {
                    errors[field] = `Invalid ${fieldRules.label || field}${fieldRules.minLength ? ` (min: ${fieldRules.minLength} chars)` : ''}${fieldRules.maxLength ? ` (max: ${fieldRules.maxLength} chars)` : ''}`;
                }
                break;

            case 'username':
                if (!isValidUsername(value)) {
                    errors[field] = 'Username must be 3-30 characters (letters, numbers, _ and - only)';
                }
                break;

            case 'password': {
                const passwordValidation = validatePassword(value);
                if (!passwordValidation.isValid) {
                    errors[field] = passwordValidation.errors[0];
                }
                break;
            }

            case 'url':
                if (!isValidUrl(value)) {
                    errors[field] = 'Invalid URL';
                }
                break;
        }

        // Custom validation function
        if (fieldRules.custom) {
            const customError = fieldRules.custom(value, formData);
            if (customError) {
                errors[field] = customError;
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export default {
    isValidEmail,
    isValidPhone,
    isValidString,
    isValidNumber,
    isValidPrice,
    isValidDate,
    isFutureDate,
    isPastDate,
    isValidUsername,
    validatePassword,
    isValidUrl,
    sanitizeInput,
    validateFile,
    isValidArray,
    isValidObject,
    validateForm
};
