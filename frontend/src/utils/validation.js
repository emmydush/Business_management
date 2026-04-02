/**
 * Validation Utilities
 * Never trust user input - validate everything before processing
 */

// XSS patterns to detect
const XSS_PATTERNS = [
    /<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gi,
    /<\s*iframe[^>]*>.*?<\s*\/\s*iframe\s*>/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /on\w+\s*=/gi,
    /<\s*img[^>]*src\s*=\s*["']?\s*javascript:/gi,
    /<\s*link[^>]*href\s*=\s*["']?\s*javascript:/gi,
    /<\s*meta[^>]*http-equiv\s*=\s*["']?\s*refresh/gi,
    /<\s*object[^>]*>.*?<\s*\/\s*object\s*>/gi,
    /<\s*embed[^>]*>.*?<\s*\/\s*embed\s*>/gi,
    /<\s*applet[^>]*>.*?<\s*\/\s*applet\s*>/gi,
    /<\s*form[^>]*action\s*=\s*["']?\s*javascript:/gi,
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|#|\/\*|\*\/)/gi,
    /(\bOR\b.*\b1\s*=\s*1\b|\bAND\b.*\b1\s*=\s*1\b)/gi,
    /(\s*(DROP|DELETE|UPDATE|INSERT)\b)/gi,
    /(\b(INFORMATION_SCHEMA|SYS|MASTER|MSDB)\b)/gi,
    /(\b(LOAD_FILE|INTO\s+OUTFILE|DUMPFILE)\b)/gi,
    /(\b(BENCHMARK|SLEEP|WAITFOR|DELAY)\b)/gi,
    /(\b(USER|VERSION|DATABASE|@@)\b)/gi,
    /(\b(CONCAT|CHAR|ASCII|ORD|HEX)\b)/gi,
];

// Security validation utilities
export const SecurityValidator = {
    /**
     * Sanitize string input
     */
    sanitizeString: (input, maxLength = 1000) => {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Remove null bytes and control characters (except common whitespace)
        let sanitized = input.split('').filter(char => {
            const code = char.charCodeAt(0);
            // Allow printable ASCII (32-126), tab (9), newline (10), carriage return (13)
            // Exclude null bytes (0-8) and other control characters (11, 12, 14-31, 127)
            return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
        }).join('');
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        // HTML entity encoding
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        return sanitized;
    },

    /**
     * Detect XSS attempts
     */
    detectXSS: (input) => {
        if (!input || typeof input !== 'string') {
            return false;
        }

        return XSS_PATTERNS.some(pattern => pattern.test(input));
    },

    /**
     * Detect SQL injection attempts
     */
    detectSQLInjection: (input) => {
        if (!input || typeof input !== 'string') {
            return false;
        }

        const inputUpper = input.toUpperCase();
        return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(inputUpper));
    },

    /**
     * Validate email format
     */
    validateEmail: (email) => {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            return false;
        }

        // Length validation
        if (email.length > 254) {
            return false;
        }

        // Prevent dangerous characters
        const dangerousChars = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}'];
        if (dangerousChars.some(char => email.includes(char))) {
            return false;
        }

        return true;
    },

    /**
     * Validate phone number
     */
    validatePhone: (phone) => {
        if (!phone || typeof phone !== 'string') {
            return false;
        }

        // Remove common formatting
        const cleaned = phone.replace(/[^\d+]/g, '');
        
        // Basic validation (10-15 digits, optional +)
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        return phoneRegex.test(cleaned);
    },

    /**
     * Validate username
     */
    validateUsername: (username) => {
        if (!username || typeof username !== 'string') {
            return false;
        }

        // Length validation
        if (username.length < 3 || username.length > 30) {
            return false;
        }

        // Allowed characters: alphanumeric, underscore, hyphen
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return false;
        }

        // Prevent consecutive special characters
        if (username.includes('--') || username.includes('__')) {
            return false;
        }

        return true;
    },

    /**
     * Validate URL format
     */
    validateURL: (url) => {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Sanitize HTML content
     */
    sanitizeHTML: (html) => {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Simple HTML sanitization (in production, use a library like DOMPurify)
        const tempDiv = document.createElement('div');
        tempDiv.textContent = html;
        return tempDiv.innerHTML;
    },

    /**
     * Validate numeric input
     */
    validateNumeric: (value, min = null, max = null) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return false;
        }

        if (min !== null && numValue < min) {
            return false;
        }

        if (max !== null && numValue > max) {
            return false;
        }

        return true;
    },

    /**
     * Validate integer input
     */
    validateInteger: (value, min = null, max = null) => {
        const intValue = parseInt(value, 10);
        if (isNaN(intValue)) {
            return false;
        }

        if (min !== null && intValue < min) {
            return false;
        }

        if (max !== null && intValue > max) {
            return false;
        }

        return true;
    },

    /**
     * Validate date string
     */
    validateDate: (dateString) => {
        if (!dateString || typeof dateString !== 'string') {
            return false;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }

        const date = new Date(dateString);
        return !isNaN(date.getTime());
    },

    /**
     * Comprehensive input validation
     */
    validateInput: (input, rules) => {
        const errors = [];
        const sanitized = SecurityValidator.sanitizeString(input);

        if (rules.required && (!input || input.trim() === '')) {
            errors.push('This field is required');
            return { isValid: false, errors, sanitized: '' };
        }

        if (rules.minLength && input.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength} characters`);
        }

        if (rules.maxLength && input.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength} characters`);
        }

        if (rules.type === 'email' && !SecurityValidator.validateEmail(input)) {
            errors.push('Invalid email format');
        }

        if (rules.type === 'phone' && !SecurityValidator.validatePhone(input)) {
            errors.push('Invalid phone number format');
        }

        if (rules.type === 'username' && !SecurityValidator.validateUsername(input)) {
            errors.push('Invalid username format');
        }

        if (rules.type === 'url' && !SecurityValidator.validateURL(input)) {
            errors.push('Invalid URL format');
        }

        if (rules.type === 'numeric' && !SecurityValidator.validateNumeric(input, rules.min, rules.max)) {
            errors.push('Invalid numeric value');
        }

        if (rules.type === 'integer' && !SecurityValidator.validateInteger(input, rules.min, rules.max)) {
            errors.push('Invalid integer value');
        }

        if (rules.type === 'date' && !SecurityValidator.validateDate(input)) {
            errors.push('Invalid date format');
        }

        if (SecurityValidator.detectXSS(input)) {
            errors.push('Invalid characters detected');
        }

        if (SecurityValidator.detectSQLInjection(input)) {
            errors.push('Invalid characters detected');
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized
        };
    },

    /**
     * Validate form data
     */
    validateForm: (formData, schema) => {
        const errors = {};
        const sanitizedData = {};
        let isValid = true;

        Object.keys(schema).forEach(field => {
            const rules = schema[field];
            const value = formData[field];
            const validation = SecurityValidator.validateInput(value, rules);

            if (!validation.isValid) {
                errors[field] = validation.errors;
                isValid = false;
            }

            sanitizedData[field] = validation.sanitized;
        });

        return {
            isValid,
            errors,
            sanitizedData
        };
    }
};

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

// Password strength validation with harsh requirements
export const validatePassword = (password) => {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { isValid: false, errors: ['Password is required'] };
    }

    if (password.length < 12) {
        errors.push('Password must be at least 12 characters');
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

    // Check for common weak patterns
    const passwordLower = password.toLowerCase();
    const commonPatterns = [
        '123456', 'password', 'qwerty', 'admin', 'letmein', 'welcome',
        'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football',
        'baseball', 'shadow', 'superman', 'iloveyou', '123123', 'abc123'
    ];
    
    for (const pattern of commonPatterns) {
        if (passwordLower.includes(pattern)) {
            errors.push(`Password cannot contain common patterns like '${pattern}'`);
            break;
        }
    }

    // Check for keyboard sequences
    const keyboardSequences = ['qwerty', 'asdf', 'zxcv', '1234', 'abcd'];
    for (const seq of keyboardSequences) {
        if (passwordLower.includes(seq)) {
            errors.push('Password cannot contain keyboard sequences');
            break;
        }
    }

    // Check for repeated characters (more than 2 in a row)
    for (let i = 0; i < password.length - 2; i++) {
        if (password[i] === password[i+1] && password[i+1] === password[i+2]) {
            errors.push('Password cannot contain 3 or more repeated characters in a row');
            break;
        }
    }

    // Check character variety
    const charTypes = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password)
    ].filter(Boolean).length;
    
    if (charTypes < 3) {
        errors.push('Password must contain at least 3 different character types');
    }

    // Check entropy (unique characters)
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.6) {
        errors.push('Password needs more character variety');
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength: getPasswordStrength(password)
    };
};

// Password strength meter with harsher requirements
const getPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (password.length >= 20) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password)) strength++;
    
    // Bonus points for entropy
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.8) strength++;

    if (strength <= 3) return 'weak';
    if (strength <= 5) return 'medium';
    if (strength <= 6) return 'strong';
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

// Form validation schemas
export const VALIDATION_SCHEMAS = {
    register: {
        username: { type: 'username', required: true, minLength: 3, maxLength: 30 },
        email: { type: 'email', required: true, maxLength: 254 },
        password: { type: 'string', required: true, minLength: 12, maxLength: 128 },
        first_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
        last_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
        business_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        business_phone: { type: 'phone', required: false, maxLength: 20 },
        business_address: { type: 'string', required: false, maxLength: 500 },
        phone: { type: 'phone', required: false, maxLength: 20 },
    },
    login: {
        username: { type: 'string', required: true, maxLength: 80 },
        password: { type: 'string', required: true, maxLength: 128 },
    },
    changePassword: {
        current_password: { type: 'string', required: true, maxLength: 128 },
        new_password: { type: 'string', required: true, minLength: 12, maxLength: 128 },
    },
    forgotPassword: {
        email: { type: 'email', required: true, maxLength: 254 },
    },
    resetPassword: {
        token: { type: 'string', required: true, maxLength: 100 },
        new_password: { type: 'string', required: true, minLength: 12, maxLength: 128 },
    },
    profile: {
        first_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
        last_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
        phone: { type: 'phone', required: false, maxLength: 20 },
        email: { type: 'email', required: true, maxLength: 254 },
    }
};

// File validation utility
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

    // File size validation
    if (file.size > maxSize) {
        errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    // File type validation
    if (!allowedTypes.includes(file.type)) {
        errors.push('Invalid file type');
    }

    // File extension validation
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        errors.push('Invalid file extension');
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
