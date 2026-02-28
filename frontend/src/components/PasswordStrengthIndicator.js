import React, { useMemo } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { FiCheck, FiX } from 'react-icons/fi';
import { validatePassword } from '../utils/validation';

/**
 * Password Strength Indicator Component
 * Visual feedback for password requirements and strength
 */
const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
    const validation = useMemo(() => {
        if (!password) {
            return {
                isValid: false,
                strength: null,
                errors: [],
                requirements: {
                    minLength: false,
                    hasLower: false,
                    hasUpper: false,
                    hasNumber: false,
                    hasSpecial: false
                }
            };
        }

        const result = validatePassword(password);

        return {
            isValid: result.isValid,
            strength: result.strength,
            errors: result.errors,
            requirements: {
                minLength: password.length >= 8,
                hasLower: /[a-z]/.test(password),
                hasUpper: /[A-Z]/.test(password),
                hasNumber: /[0-9]/.test(password),
                hasSpecial: /[!@#$%^&*()_+\-=[{};':"\\|,.<>]/.test(password)
            }
        };
    }, [password]);

    // Don't show anything if password is empty
    if (!password) {
        return null;
    }

    // Strength configuration
    const strengthConfig = {
        'weak': {
            variant: 'danger',
            percentage: 25,
            label: 'Weak',
            color: '#dc3545'
        },
        'medium': {
            variant: 'warning',
            percentage: 50,
            label: 'Medium',
            color: '#ffc107'
        },
        'strong': {
            variant: 'info',
            percentage: 75,
            label: 'Strong',
            color: '#0dcaf0'
        },
        'very-strong': {
            variant: 'success',
            percentage: 100,
            label: 'Very Strong',
            color: '#198754'
        }
    };

    const currentStrength = validation.strength ? strengthConfig[validation.strength] : strengthConfig['weak'];

    return (
        <div className="password-strength-indicator mt-2">
            {/* Strength Bar */}
            <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Password Strength:</small>
                    <small className="fw-bold" style={{ color: currentStrength.color }}>
                        {currentStrength.label}
                    </small>
                </div>
                <ProgressBar
                    now={currentStrength.percentage}
                    variant={currentStrength.variant}
                    style={{ height: '6px' }}
                    className="password-strength-bar"
                />
            </div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="password-requirements mt-2">
                    <small className="text-muted d-block mb-2">Password must contain:</small>
                    <div className="requirements-list">
                        <RequirementItem
                            met={validation.requirements.minLength}
                            text="At least 8 characters"
                        />
                        <RequirementItem
                            met={validation.requirements.hasLower}
                            text="One lowercase letter (a-z)"
                        />
                        <RequirementItem
                            met={validation.requirements.hasUpper}
                            text="One uppercase letter (A-Z)"
                        />
                        <RequirementItem
                            met={validation.requirements.hasNumber}
                            text="One number (0-9)"
                        />
                        <RequirementItem
                            met={validation.requirements.hasSpecial}
                            text="One special character (!@#$%...)"
                        />
                    </div>
                </div>
            )}

            {/* Inline styles for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .password-strength-bar {
                    border-radius: 10px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .password-strength-bar .progress-bar {
                    transition: width 0.5s ease, background-color 0.3s ease;
                }

                .requirements-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 0.5rem;
                }

                .requirement-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    font-size: 0.75rem;
                    transition: all 0.3s ease;
                }

                .requirement-icon {
                    flex-shrink: 0;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .requirement-icon.met {
                    background: #198754;
                    color: white;
                    transform: scale(1.1);
                }

                .requirement-icon.unmet {
                    background: #e9ecef;
                    color: #6c757d;
                }

                .requirement-text {
                    transition: color 0.3s ease;
                }

                .requirement-text.met {
                    color: #198754;
                    font-weight: 500;
                }

                .requirement-text.unmet {
                    color: #6c757d;
                }
            `}} />
        </div>
    );
};

/**
 * Individual requirement item component
 */
const RequirementItem = ({ met, text }) => {
    return (
        <div className="requirement-item">
            <div className={`requirement-icon ${met ? 'met' : 'unmet'}`}>
                {met ? <FiCheck size={10} /> : <FiX size={10} />}
            </div>
            <span className={`requirement-text ${met ? 'met' : 'unmet'}`}>
                {text}
            </span>
        </div>
    );
};

/**
 * Compact version - just the strength bar
 */
export const PasswordStrengthBar = ({ password }) => {
    return <PasswordStrengthIndicator password={password} showRequirements={false} />;
};

/**
 * Hook version for easy integration
 */
export const usePasswordStrength = (password) => {
    return useMemo(() => {
        if (!password) {
            return { isValid: false, strength: null, canProceed: false };
        }

        const result = validatePassword(password);
        return {
            isValid: result.isValid,
            strength: result.strength,
            canProceed: result.isValid,
            errors: result.errors
        };
    }, [password]);
};

export default PasswordStrengthIndicator;
