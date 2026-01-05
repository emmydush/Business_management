import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from './AuthContext';

const LoginModal = ({ show, onHide, onSwitchToRegister }) => {
    const { t } = useI18n();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);

            // Store token and user info
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Update AuthContext so rest of the app reflects the logged-in user immediately
            login(response.data.user);

            toast.success(t('login_success'), {
                duration: 3000,
                icon: '🚀',
            });

            // Close modal
            onHide();

            // Redirect based on user role
            if (response.data.user.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('login_invalid');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">{t('login_welcome')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="loginUsername">
                        <Form.Label>{t('login_username_label')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            placeholder={t('login_username_placeholder')}
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="loginPassword">
                        <Form.Label>{t('login_password')}</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder={t('login_password_placeholder')}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mb-3 py-2 fw-bold"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t('login_signing')}
                            </>
                        ) : t('login_button')}
                    </Button>
                </Form>
                <div className="text-center mt-3">
                    <p className="text-muted">
                        {t('register_prompt')}{' '}
                        <Button variant="link" className="p-0 fw-bold text-decoration-none" onClick={onSwitchToRegister}>
                            {t('register_button')}
                        </Button>
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default LoginModal;
