import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nProvider';
import './AuthModal.css';

const ForgotPasswordModal = ({ show, onHide }) => {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverMessage, setServerMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword(email);
            const message =
                response?.data?.message ||
                t('forgot_password_success_msg') ||
                'If your email is registered, you will receive a reset link.';
            setSuccess(true);
            setServerMessage(message);
            toast.success(t('forgot_password_success') || 'Reset link sent to your email');
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('forgot_password_error') || 'Failed to send reset link';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered className="auth-modal">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">{t('forgot_password_title') || 'Forgot Password'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {success ? (
                    <div className="text-center py-4">
                        <div className="mb-4">
                            <i className="bi bi-envelope-check fs-1 text-success"></i>
                        </div>
                        <h5 className="text-dark mb-3">{t('check_email') || 'Check your email'}</h5>
                        <p className="text-muted">
                            {serverMessage || t('forgot_password_success_msg') || 'We have sent a password reset link to your email address.'}
                        </p>
                        <Button variant="primary" className="w-100 mt-3" onClick={onHide}>
                            {t('close') || 'Close'}
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-muted mb-4">
                            {t('forgot_password_prompt') || 'Enter your email address and we will send you a link to reset your password.'}
                        </p>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4" controlId="forgotEmail">
                                <Form.Label>{t('email_label') || 'Email Address'}</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder={t('email_placeholder') || 'name@company.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-2 fw-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('sending') || 'Sending...'}
                                    </>
                                ) : t('send_reset_link') || 'Send Reset Link'}
                            </Button>
                        </Form>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ForgotPasswordModal;
