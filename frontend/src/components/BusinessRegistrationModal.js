import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator, { usePasswordStrength } from './PasswordStrengthIndicator';
import { useI18n } from '../i18n/I18nProvider';
import './auth/AuthModal.css';

const BusinessRegistrationModal = ({ show, onHide, onSwitchToLogin }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        business_name: '',
        role: 'admin'
    });
    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Password strength validation
    const passwordStrength = usePasswordStrength(formData.password);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        } else {
            setProfileFile(null);
            setProfilePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password strength
        if (!passwordStrength.canProceed) {
            toast.error(t('password_too_weak'), {
                duration: 4000
            });
            return;
        }

        setLoading(true);

        try {
            const registrationData = { ...formData };

            // Upload profile picture if provided
            if (profileFile) {
                const uploadRes = await authAPI.uploadProfilePicture(profileFile);
                registrationData.profile_picture = uploadRes.data.url;
            }

            await authAPI.register(registrationData);

            toast.success(t('register_success_pending') || 'Registration successful! Your account is pending approval.', {
                duration: 3000,
                icon: '⏳',
            });

            onHide(); // Close modal

            if (onSwitchToLogin) {
                onSwitchToLogin();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="auth-modal">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">{t('register_business_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="business_name">
                        <Form.Label className="fw-semibold small">{t('business_name_label')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="business_name"
                            placeholder={t('business_name_placeholder')}
                            value={formData.business_name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="first_name">
                                <Form.Label className="fw-semibold small">{t('first_name')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="first_name"
                                    placeholder={t('first_name')}
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="last_name">
                                <Form.Label className="fw-semibold small">{t('last_name')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="last_name"
                                    placeholder={t('last_name')}
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="username">
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

                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label className="fw-semibold small">{t('email_label')}</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder={t('email_placeholder')}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="phone">
                        <Form.Label className="fw-semibold small">{t('phone_label')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="phone"
                            placeholder={t('phone_placeholder')}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="profile_picture">
                        <Form.Label className="fw-semibold small">{t('profile_picture_label')}</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {profilePreview && (
                            <div className="mt-2 text-center">
                                <img src={profilePreview} alt="Preview" className="rounded-circle border border-2 border-primary" width={80} height={80} />
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
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

                    <div className="d-grid gap-2">
                        <Button
                            variant="primary"
                            type="submit"
                            className="py-2 fw-bold shadow-sm"
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
                            <small className="text-danger text-center">
                                {t('password_too_weak')}
                            </small>
                        )}
                    </div>
                </Form>
                {onSwitchToLogin && (
                    <div className="text-center mt-3">
                        <p className="text-muted small">
                            {t('already_have_account')}{' '}
                            <Button variant="link" className="p-0 fw-bold text-decoration-none small" onClick={onSwitchToLogin}>
                                {t('login_button')}
                            </Button>
                        </p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default BusinessRegistrationModal;
