import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';

const Register = () => {
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
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.register(formData);

            // Registration successful, but we need to login to get the token
            // The backend register route now returns user and business, but not token
            // Let's login automatically
            const loginResponse = await authAPI.login({
                username: formData.username,
                password: formData.password
            });

            localStorage.setItem('token', loginResponse.data.access_token);
            login(loginResponse.data.user);

            toast.success(t('register_success'), {
                duration: 4000,
                icon: '✅',
            });

            if (loginResponse.data.user.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Row className="w-100">
                <Col md={8} lg={6} className="mx-auto">
                    <Card className="border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                        <Card.Header className="text-center bg-primary text-white py-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                            <h3 className="fw-bold mb-1">{t('app_name')}</h3>
                            <p className="mb-0 opacity-75">{t('register_business_title')}</p>
                        </Card.Header>
                        <Card.Body className="p-4">
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
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 py-2 fw-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('register_creating')}
                                        </>
                                    ) : t('register_button')}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <p className="text-center mt-4 text-muted small">
                        {t('already_have_account')} <Button variant="link" className="p-0 small fw-bold text-decoration-none" onClick={() => navigate('/login')}>{t('login_button')}</Button>
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
