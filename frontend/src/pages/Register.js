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
    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

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
        setLoading(true);

        try {
            // Upload profile picture first
            if (profileFile) {
                const uploadRes = await authAPI.uploadProfilePicture(profileFile);
                formData.profile_picture = uploadRes.data.url;
            }

            const response = await authAPI.register(formData);

            // Registration successful, but we need to login to get the token
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

    const inputStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        padding: '0.75rem 1rem'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent), #0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0'
        }}>
            <Container>
                <Row className="w-100 justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="border-0 shadow-2xl" style={{
                            borderRadius: '24px',
                            background: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <Card.Header className="text-center py-5 border-0 bg-transparent">
                                <h2 className="fw-bold mb-1 text-white">{t('app_name')}</h2>
                                <p className="mb-0 text-muted">{t('register_business_title')}</p>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3" controlId="business_name">
                                        <Form.Label className="fw-semibold small text-muted">{t('business_name_label')}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="business_name"
                                            placeholder={t('business_name_placeholder')}
                                            value={formData.business_name}
                                            onChange={handleChange}
                                            style={inputStyle}
                                            required
                                        />
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="first_name">
                                                <Form.Label className="fw-semibold small text-muted">{t('first_name')}</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="first_name"
                                                    placeholder={t('first_name')}
                                                    value={formData.first_name}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="last_name">
                                                <Form.Label className="fw-semibold small text-muted">{t('last_name')}</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="last_name"
                                                    placeholder={t('last_name')}
                                                    value={formData.last_name}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3" controlId="username">
                                        <Form.Label className="fw-semibold small text-muted">{t('username_label')}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            placeholder={t('username_placeholder')}
                                            value={formData.username}
                                            onChange={handleChange}
                                            style={inputStyle}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label className="fw-semibold small text-muted">{t('email_label')}</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            placeholder={t('email_placeholder')}
                                            value={formData.email}
                                            onChange={handleChange}
                                            style={inputStyle}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="phone">
                                        <Form.Label className="fw-semibold small text-muted">{t('phone_label')}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="phone"
                                            placeholder={t('phone_placeholder')}
                                            value={formData.phone}
                                            onChange={handleChange}
                                            style={inputStyle}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="profile_picture">
                                        <Form.Label className="fw-semibold small text-muted">Profile Picture *</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ ...inputStyle, padding: '0.5rem' }}
                                            required
                                        />
                                        {profilePreview && (
                                            <div className="mt-2 text-center">
                                                <img src={profilePreview} alt="Preview" className="rounded-circle border border-2 border-primary" width={80} height={80} />
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="password">
                                        <Form.Label className="fw-semibold small text-muted">{t('login_password')}</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            placeholder={t('login_password_placeholder')}
                                            value={formData.password}
                                            onChange={handleChange}
                                            style={inputStyle}
                                            required
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100 py-3 fw-bold shadow-lg"
                                        style={{ borderRadius: '12px' }}
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
        </div>
    );
};

export default Register;
