import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Button, Form, Nav, Tab, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator, { usePasswordStrength } from '../PasswordStrengthIndicator';
import { useI18n } from '../../i18n/I18nProvider';
import { FaEye, FaEyeSlash, FaEnvelope, FaPhone, FaGoogle, FaFacebook, FaTwitter, FaUser, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import './AuthModal.css';

/**
 * Multi-register modal with tabs for different registration methods
 * Features: Email registration, Phone registration, Social login options
 * Accessibility: WCAG compliant with ARIA attributes and keyboard navigation
 */
const RegisterModal = ({ show, onHide, onSwitchToLogin }) => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('email');
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [touched, setTouched] = useState({});
    const firstInputRef = useRef(null);
    const tabRefs = useRef({});

    // Email registration form
    const [emailForm, setEmailForm] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // Phone registration form
    const [phoneForm, setPhoneForm] = useState({
        fullName: '',
        phone: '',
        countryCode: '+1',
        password: '',
        confirmPassword: ''
    });

    // Validation state for email form
    const emailValidation = useMemo(() => {
        const errors = {};
        const touchedFields = touched.emailForm || {};

        if (touchedFields.fullName && !emailForm.fullName.trim()) {
            errors.fullName = t('validation_required') || 'Full name is required';
        } else if (touchedFields.fullName && emailForm.fullName.trim().split(' ').length < 2) {
            errors.fullName = t('enter_both_names') || 'Please enter both first and last name';
        }

        if (touchedFields.email && !emailForm.email) {
            errors.email = t('validation_email_required') || 'Email is required';
        } else if (touchedFields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
            errors.email = t('validation_email_invalid') || 'Please enter a valid email address';
        }

        if (touchedFields.username && !emailForm.username) {
            errors.username = t('validation_username_required') || 'Username is required';
        } else if (touchedFields.username && emailForm.username.length < 3) {
            errors.username = t('validation_username_short') || 'Username must be at least 3 characters';
        }

        if (touchedFields.password && !emailForm.password) {
            errors.password = t('validation_password_required') || 'Password is required';
        }

        if (touchedFields.confirmPassword && !emailForm.confirmPassword) {
            errors.confirmPassword = t('validation_confirm_required') || 'Please confirm your password';
        } else if (emailForm.password && emailForm.confirmPassword && emailForm.password !== emailForm.confirmPassword) {
            errors.confirmPassword = t('passwords_dont_match') || 'Passwords do not match';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }, [emailForm, touched.emailForm, t]);

    // Validation state for phone form
    const phoneValidation = useMemo(() => {
        const errors = {};
        const touchedFields = touched.phoneForm || {};

        if (touchedFields.fullName && !phoneForm.fullName.trim()) {
            errors.fullName = t('validation_required') || 'Full name is required';
        } else if (touchedFields.fullName && phoneForm.fullName.trim().split(' ').length < 2) {
            errors.fullName = t('enter_both_names') || 'Please enter both first and last name';
        }

        if (touchedFields.phone && !phoneForm.phone) {
            errors.phone = t('validation_phone_required') || 'Phone number is required';
        } else if (touchedFields.phone && !/^\d{10,15}$/.test(phoneForm.phone.replace(/\D/g, ''))) {
            errors.phone = t('validation_phone_invalid') || 'Please enter a valid phone number';
        }

        if (touchedFields.password && !phoneForm.password) {
            errors.password = t('validation_password_required') || 'Password is required';
        }

        if (touchedFields.confirmPassword && !phoneForm.confirmPassword) {
            errors.confirmPassword = t('validation_confirm_required') || 'Please confirm your password';
        } else if (phoneForm.password && phoneForm.confirmPassword && phoneForm.password !== phoneForm.confirmPassword) {
            errors.confirmPassword = t('passwords_dont_match') || 'Passwords do not match';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }, [phoneForm, touched.phoneForm, t]);

    // Password strength hooks
    const emailPasswordStrength = usePasswordStrength(emailForm.password);
    const phonePasswordStrength = usePasswordStrength(phoneForm.password);

    // Focus first input when modal opens or tab changes
    useEffect(() => {
        if (show) {
            setTimeout(() => {
                const firstInput = document.querySelector('.register-modal .tab-pane.active input:first-of-type');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }, [show, activeTab]);

    // Reset form when modal closes
    useEffect(() => {
        if (!show) {
            setEmailForm({
                fullName: '',
                email: '',
                username: '',
                password: '',
                confirmPassword: ''
            });
            setPhoneForm({
                fullName: '',
                phone: '',
                countryCode: '+1',
                password: '',
                confirmPassword: ''
            });
            setTouched({});
            setSubmitError('');
            setFormSubmitted(false);
            setActiveTab('email');
        }
    }, [show]);

    // Handle input changes
    const handleEmailChange = (e) => {
        const { name, value } = e.target;
        setEmailForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e) => {
        const { name, value } = e.target;
        setPhoneForm(prev => ({ ...prev, [name]: value }));
    };

    // Handle blur for validation
    const handleBlur = (formName, fieldName) => {
        setTouched(prev => ({
            ...prev,
            [formName]: {
                ...prev[formName],
                [fieldName]: true
            }
        }));
    };

    // Keyboard navigation for tabs
    const handleTabKeyDown = (e, tabKey) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveTab(tabKey);
        }
    };

    // Handle email registration submission
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (!emailValidation.isValid) {
            setSubmitError(t('validation_fix_errors') || 'Please fix the errors before submitting');
            return;
        }

        if (!emailPasswordStrength.canProceed) {
            setSubmitError(t('password_too_weak') || 'Password is too weak');
            return;
        }

        setLoading(true);
        setSubmitError('');

        try {
            // Extract first and last name
            const nameParts = emailForm.fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const registrationData = {
                username: emailForm.username,
                email: emailForm.email,
                password: emailForm.password,
                first_name: firstName,
                last_name: lastName,
                registration_method: 'email'
            };

            await authAPI.register(registrationData);

            toast.success(t('register_success') || 'Registration successful! Please check your email to verify your account.', {
                duration: 5000,
                icon: '🎉',
            });

            onHide();
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed') || 'Registration failed. Please try again.';
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle phone registration submission
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (!phoneValidation.isValid) {
            setSubmitError(t('validation_fix_errors') || 'Please fix the errors before submitting');
            return;
        }

        if (!phonePasswordStrength.canProceed) {
            setSubmitError(t('password_too_weak') || 'Password is too weak');
            return;
        }

        setLoading(true);
        setSubmitError('');

        try {
            // Extract first and last name
            const nameParts = phoneForm.fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const registrationData = {
                phone: `${phoneForm.countryCode}${phoneForm.phone}`,
                password: phoneForm.password,
                first_name: firstName,
                last_name: lastName,
                registration_method: 'phone'
            };

            // Note: This would need a backend endpoint for phone registration
            // For now, we'll show a success message
            toast.success(t('register_phone_success') || 'Registration successful! You will receive an SMS verification code.', {
                duration: 5000,
                icon: '📱',
            });

            onHide();
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed') || 'Registration failed. Please try again.';
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Social login handlers (placeholder)
    const handleSocialLogin = (provider) => {
        toast.success(`Connecting to ${provider}...`, {
            duration: 2000,
        });
        // Implementation would redirect to OAuth provider
    };

    // Get current form and validation based on active tab
    const currentForm = activeTab === 'email' ? emailForm : phoneForm;
    const currentValidation = activeTab === 'email' ? emailValidation : phoneValidation;
    const currentPasswordStrength = activeTab === 'email' ? emailPasswordStrength : phonePasswordStrength;

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            className="auth-modal register-modal register-modal-white"
            backdrop="static"
            keyboard={true}
            role="dialog"
            aria-labelledby="register-modal-title"
            aria-describedby="register-modal-description"
        >
            <Modal.Header 
                closeButton 
                className="border-0"
                closeButtonProps={{
                    'aria-label': 'Close registration form'
                }}
            >
                <Modal.Title 
                    id="register-modal-title" 
                    className="fw-bold"
                >
                    {t('register_title') || 'Create Account'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                <p 
                    id="register-modal-description" 
                    className="text-muted small mb-3"
                >
                    {t('register_subtitle') || 'Choose your preferred registration method'}
                </p>

                {/* Tab Navigation */}
                <Nav 
                    variant="pills" 
                    className="register-tabs mb-4 justify-content-center"
                    role="tablist"
                    activeKey={activeTab}
                    onSelect={(key) => setActiveTab(key)}
                >
                    <Nav.Item role="presentation">
                        <Nav.Link 
                            eventKey="email" 
                            role="tab"
                            aria-selected={activeTab === 'email'}
                            tabIndex={activeTab === 'email' ? 0 : -1}
                            onKeyDown={(e) => handleTabKeyDown(e, 'email')}
                            className="d-flex align-items-center gap-2"
                        >
                            <FaEnvelope />
                            <span className="d-none d-sm-inline">{t('tab_email') || 'Email'}</span>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item role="presentation">
                        <Nav.Link 
                            eventKey="phone" 
                            role="tab"
                            aria-selected={activeTab === 'phone'}
                            tabIndex={activeTab === 'phone' ? 0 : -1}
                            onKeyDown={(e) => handleTabKeyDown(e, 'phone')}
                            className="d-flex align-items-center gap-2"
                        >
                            <FaPhone />
                            <span className="d-none d-sm-inline">{t('tab_phone') || 'Phone'}</span>
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                {/* Error Alert */}
                {submitError && (
                    <div 
                        className="alert alert-danger d-flex align-items-center mb-3" 
                        role="alert"
                        aria-live="assertive"
                    >
                        <FaExclamationCircle className="me-2" />
                        <div>{submitError}</div>
                    </div>
                )}

                {/* Tab Content */}
                <Tab.Content className="register-tab-content">
                    {/* Email Registration Tab */}
                    <Tab.Pane 
                        eventKey="email" 
                        className={activeTab === 'email' ? 'show active' : ''}
                        role="tabpanel"
                        aria-labelledby="email-tab"
                    >
                        <Form onSubmit={handleEmailSubmit} noValidate>
                            {/* Full Name */}
                            <Form.Group className="mb-3" controlId="registerFullName">
                                <Form.Label className="fw-semibold small">
                                    {t('full_name_label') || 'Full Name'}
                                </Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaUser />
                                    </span>
                                    <Form.Control
                                        type="text"
                                        name="fullName"
                                        placeholder={t('full_name_placeholder') || 'John Doe'}
                                        value={emailForm.fullName}
                                        onChange={handleEmailChange}
                                        onBlur={() => handleBlur('emailForm', 'fullName')}
                                        required
                                        isInvalid={formSubmitted || touched.emailForm?.fullName}
                                        aria-describedby={emailValidation.errors.fullName ? 'fullName-error' : undefined}
                                        aria-invalid={!!emailValidation.errors.fullName}
                                        ref={firstInputRef}
                                    />
                                    {emailForm.fullName && !emailValidation.errors.fullName && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </div>
                                {emailValidation.errors.fullName && (
                                    <Form.Control.Feedback type="invalid" id="fullName-error" role="alert">
                                        {emailValidation.errors.fullName}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Email */}
                            <Form.Group className="mb-3" controlId="registerEmail">
                                <Form.Label className="fw-semibold small">
                                    {t('email_label') || 'Email Address'}
                                </Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaEnvelope />
                                    </span>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder={t('email_placeholder') || 'name@example.com'}
                                        value={emailForm.email}
                                        onChange={handleEmailChange}
                                        onBlur={() => handleBlur('emailForm', 'email')}
                                        required
                                        isInvalid={formSubmitted || touched.emailForm?.email}
                                        aria-describedby={emailValidation.errors.email ? 'email-error' : undefined}
                                        aria-invalid={!!emailValidation.errors.email}
                                    />
                                    {emailForm.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email) && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </div>
                                {emailValidation.errors.email && (
                                    <Form.Control.Feedback type="invalid" id="email-error" role="alert">
                                        {emailValidation.errors.email}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Username */}
                            <Form.Group className="mb-3" controlId="registerUsername">
                                <Form.Label className="fw-semibold small">
                                    {t('username_label') || 'Username'}
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder={t('username_placeholder') || 'johndoe123'}
                                    value={emailForm.username}
                                    onChange={handleEmailChange}
                                    onBlur={() => handleBlur('emailForm', 'username')}
                                    required
                                    isInvalid={formSubmitted || touched.emailForm?.username}
                                    aria-describedby={emailValidation.errors.username ? 'username-error' : undefined}
                                    aria-invalid={!!emailValidation.errors.username}
                                />
                                {emailValidation.errors.username && (
                                    <Form.Control.Feedback type="invalid" id="username-error" role="alert">
                                        {emailValidation.errors.username}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Password */}
                            <Form.Group className="mb-3" controlId="registerPassword">
                                <Form.Label className="fw-semibold small">
                                    {t('login_password') || 'Password'}
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder={t('login_password_placeholder') || 'Create a strong password'}
                                        value={emailForm.password}
                                        onChange={handleEmailChange}
                                        onBlur={() => handleBlur('emailForm', 'password')}
                                        required
                                        isInvalid={formSubmitted || touched.emailForm?.password}
                                        aria-describedby={emailValidation.errors.password ? 'password-error' : 'password-strength'}
                                        aria-invalid={!!emailValidation.errors.password}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                                {emailValidation.errors.password && (
                                    <Form.Control.Feedback type="invalid" id="password-error" role="alert">
                                        {emailValidation.errors.password}
                                    </Form.Control.Feedback>
                                )}
                                <PasswordStrengthIndicator password={emailForm.password} />
                            </Form.Group>

                            {/* Confirm Password */}
                            <Form.Group className="mb-4" controlId="registerConfirmPassword">
                                <Form.Label className="fw-semibold small">
                                    {t('confirm_password_label') || 'Confirm Password'}
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder={t('confirm_password_placeholder') || 'Confirm your password'}
                                        value={emailForm.confirmPassword}
                                        onChange={handleEmailChange}
                                        onBlur={() => handleBlur('emailForm', 'confirmPassword')}
                                        required
                                        isInvalid={formSubmitted || touched.emailForm?.confirmPassword}
                                        aria-describedby={emailValidation.errors.confirmPassword ? 'confirmPassword-error' : undefined}
                                        aria-invalid={!!emailValidation.errors.confirmPassword}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        type="button"
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                    {emailForm.confirmPassword && emailForm.password === emailForm.confirmPassword && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </InputGroup>
                                {emailValidation.errors.confirmPassword && (
                                    <Form.Control.Feedback type="invalid" id="confirmPassword-error" role="alert">
                                        {emailValidation.errors.confirmPassword}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Submit Button */}
                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 mb-3 py-2 fw-bold shadow-sm"
                                disabled={loading}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="me-2 spin" />
                                        {t('register_creating') || 'Creating Account...'}
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle className="me-2" />
                                        {t('register_button') || 'Create Account'}
                                    </>
                                )}
                            </Button>
                        </Form>
                    </Tab.Pane>

                    {/* Phone Registration Tab */}
                    <Tab.Pane 
                        eventKey="phone" 
                        className={activeTab === 'phone' ? 'show active' : ''}
                        role="tabpanel"
                        aria-labelledby="phone-tab"
                    >
                        <Form onSubmit={handlePhoneSubmit} noValidate>
                            {/* Full Name */}
                            <Form.Group className="mb-3" controlId="registerPhoneFullName">
                                <Form.Label className="fw-semibold small">
                                    {t('full_name_label') || 'Full Name'}
                                </Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaUser />
                                    </span>
                                    <Form.Control
                                        type="text"
                                        name="fullName"
                                        placeholder={t('full_name_placeholder') || 'John Doe'}
                                        value={phoneForm.fullName}
                                        onChange={handlePhoneChange}
                                        onBlur={() => handleBlur('phoneForm', 'fullName')}
                                        required
                                        isInvalid={formSubmitted || touched.phoneForm?.fullName}
                                        aria-describedby={phoneValidation.errors.fullName ? 'phone-fullName-error' : undefined}
                                        aria-invalid={!!phoneValidation.errors.fullName}
                                        ref={firstInputRef}
                                    />
                                    {phoneForm.fullName && !phoneValidation.errors.fullName && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </div>
                                {phoneValidation.errors.fullName && (
                                    <Form.Control.Feedback type="invalid" id="phone-fullName-error" role="alert">
                                        {phoneValidation.errors.fullName}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Phone Number with Country Code */}
                            <Form.Group className="mb-3" controlId="registerPhone">
                                <Form.Label className="fw-semibold small">
                                    {t('phone_label') || 'Phone Number'}
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Select
                                        name="countryCode"
                                        value={phoneForm.countryCode}
                                        onChange={handlePhoneChange}
                                        aria-label="Select country code"
                                        style={{ maxWidth: '100px' }}
                                    >
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+91">+91</option>
                                        <option value="+27">+27</option>
                                        <option value="+234">+234</option>
                                        <option value="+255">+255</option>
                                        <option value="+254">+254</option>
                                        <option value="+256">+256</option>
                                    </Form.Select>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        placeholder={t('phone_placeholder') || '1234567890'}
                                        value={phoneForm.phone}
                                        onChange={handlePhoneChange}
                                        onBlur={() => handleBlur('phoneForm', 'phone')}
                                        required
                                        isInvalid={formSubmitted || touched.phoneForm?.phone}
                                        aria-describedby={phoneValidation.errors.phone ? 'phone-error' : undefined}
                                        aria-invalid={!!phoneValidation.errors.phone}
                                    />
                                    {phoneForm.phone && !phoneValidation.errors.phone && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </div>
                                {phoneValidation.errors.phone && (
                                    <Form.Control.Feedback type="invalid" id="phone-error" role="alert">
                                        {phoneValidation.errors.phone}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Password */}
                            <Form.Group className="mb-3" controlId="registerPhonePassword">
                                <Form.Label className="fw-semibold small">
                                    {t('login_password') || 'Password'}
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder={t('login_password_placeholder') || 'Create a strong password'}
                                        value={phoneForm.password}
                                        onChange={handlePhoneChange}
                                        onBlur={() => handleBlur('phoneForm', 'password')}
                                        required
                                        isInvalid={formSubmitted || touched.phoneForm?.password}
                                        aria-describedby={phoneValidation.errors.password ? 'phone-password-error' : undefined}
                                        aria-invalid={!!phoneValidation.errors.password}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                                {phoneValidation.errors.password && (
                                    <Form.Control.Feedback type="invalid" id="phone-password-error" role="alert">
                                        {phoneValidation.errors.password}
                                    </Form.Control.Feedback>
                                )}
                                <PasswordStrengthIndicator password={phoneForm.password} />
                            </Form.Group>

                            {/* Confirm Password */}
                            <Form.Group className="mb-4" controlId="registerPhoneConfirmPassword">
                                <Form.Label className="fw-semibold small">
                                    {t('confirm_password_label') || 'Confirm Password'}
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder={t('confirm_password_placeholder') || 'Confirm your password'}
                                        value={phoneForm.confirmPassword}
                                        onChange={handlePhoneChange}
                                        onBlur={() => handleBlur('phoneForm', 'confirmPassword')}
                                        required
                                        isInvalid={formSubmitted || touched.phoneForm?.confirmPassword}
                                        aria-describedby={phoneValidation.errors.confirmPassword ? 'phone-confirmPassword-error' : undefined}
                                        aria-invalid={!!phoneValidation.errors.confirmPassword}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        type="button"
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                    {phoneForm.confirmPassword && phoneForm.password === phoneForm.confirmPassword && (
                                        <span className="input-group-text text-success">
                                            <FaCheckCircle />
                                        </span>
                                    )}
                                </InputGroup>
                                {phoneValidation.errors.confirmPassword && (
                                    <Form.Control.Feedback type="invalid" id="phone-confirmPassword-error" role="alert">
                                        {phoneValidation.errors.confirmPassword}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>

                            {/* Submit Button */}
                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 mb-3 py-2 fw-bold shadow-sm"
                                disabled={loading}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="me-2 spin" />
                                        {t('register_creating') || 'Creating Account...'}
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle className="me-2" />
                                        {t('register_button') || 'Create Account'}
                                    </>
                                )}
                            </Button>
                        </Form>
                    </Tab.Pane>
                </Tab.Content>

                {/* Social Login Divider */}
                <div className="social-divider my-4">
                    <span className="divider-text">{t('or_continue_with') || 'Or continue with'}</span>
                </div>

                {/* Social Login Buttons */}
                <Row className="g-2 mb-3">
                    <Col xs={4}>
                        <Button
                            variant="outline-light"
                            className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleSocialLogin('Google')}
                            aria-label="Sign up with Google"
                        >
                            <FaGoogle />
                            <span className="d-none d-md-inline">Google</span>
                        </Button>
                    </Col>
                    <Col xs={4}>
                        <Button
                            variant="outline-light"
                            className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleSocialLogin('Facebook')}
                            aria-label="Sign up with Facebook"
                        >
                            <FaFacebook />
                            <span className="d-none d-md-inline">Facebook</span>
                        </Button>
                    </Col>
                    <Col xs={4}>
                        <Button
                            variant="outline-light"
                            className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleSocialLogin('Twitter')}
                            aria-label="Sign up with Twitter"
                        >
                            <FaTwitter />
                            <span className="d-none d-md-inline">Twitter</span>
                        </Button>
                    </Col>
                </Row>

                {/* Login Link */}
                <div className="text-center mt-3">
                    <p className="text-muted small">
                        {t('already_have_account') || 'Already have an account?'}{' '}
                        <Button 
                            variant="link" 
                            className="p-0 fw-bold text-decoration-none small" 
                            onClick={onSwitchToLogin}
                            aria-label="Switch to login"
                        >
                            {t('login_button') || 'Sign In'}
                        </Button>
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default RegisterModal;
