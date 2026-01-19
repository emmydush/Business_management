import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator, { usePasswordStrength } from '../PasswordStrengthIndicator';
import { useI18n } from '../../i18n/I18nProvider';

const RegisterModal = ({ show, onHide, onSwitchToLogin }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Password strength validation
    const passwordStrength = usePasswordStrength(formData.password);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('passwords_dont_match'));
            setLoading(false);
            return;
        }

        // Validate password strength
        if (!passwordStrength.canProceed) {
            toast.error(t('password_too_weak'), {
                duration: 4000
            });
            setLoading(false);
            return;
        }

        // Extract first and last name
        const nameParts = formData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const registrationData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: firstName,
            last_name: lastName
        };

        try {
            await authAPI.register(registrationData);

            // Show success message
            toast.success(t('register_success'), {
                duration: 4000,
                icon: '🎉',
            });

            // Close modal
            onHide();

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">{t('register_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="registerFullName">
                        <Form.Label className="fw-semibold small">{t('full_name_label')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            isInvalid={formData.fullName && formData.fullName.trim().split(' ').length < 2}
                        />
                        {formData.fullName && formData.fullName.trim().split(' ').length < 2 && (
                            <Form.Control.Feedback type="invalid">
                                {t('enter_both_names')}
                            </Form.Control.Feedback>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerEmail">
                        <Form.Label className="fw-semibold small">{t('email_label')}</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerUsername">
                        <Form.Label className="fw-semibold small">{t('username_label')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            placeholder={t('username_placeholder')}
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerPassword">
                        <Form.Label className="fw-semibold small">{t('login_password')}</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder={t('login_password_placeholder')}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {/* Password Strength Indicator */}
                        <PasswordStrengthIndicator password={formData.password} />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="registerConfirmPassword">
                        <Form.Label className="fw-semibold small">{t('confirm_password_label')}</Form.Label>
                        <Form.Control
                            type="password"
                            name="confirmPassword"
                            placeholder={t('confirm_password_label')}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mb-3 py-2 fw-bold shadow-sm"
                        disabled={loading || !passwordStrength.canProceed}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t('register_creating')}
                            </>
                        ) : t('register_button')}
                    </Button>
                    {formData.password && !passwordStrength.canProceed && (
                        <small className="text-danger d-block text-center mb-3">
                            {t('password_too_weak')}
                        </small>
                    )}
                </Form>
                <div className="text-center mt-3">
                    <p className="text-muted small">
                        {t('already_have_account')}{' '}
                        <Button variant="link" className="p-0 fw-bold text-decoration-none small" onClick={onSwitchToLogin}>
                            {t('login_button')}
                        </Button>
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default RegisterModal;
