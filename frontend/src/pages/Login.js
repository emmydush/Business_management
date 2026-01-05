import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import BusinessRegistrationModal from '../components/BusinessRegistrationModal';
import { useI18n } from '../i18n/I18nProvider';

const Login = () => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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
      const response = await authAPI.login(formData);

      // Store token in localStorage
      localStorage.setItem('token', response.data.access_token);

      // Use AuthContext to set user data
      login(response.data.user);

      toast.success(t('login_success'), {
        duration: 3000,
        icon: '🚀',
      });

      if (response.data.user.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || t('login_invalid');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="border-0 shadow-lg" style={{ borderRadius: '15px' }}>
            <Card.Header className="text-center bg-primary text-white py-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
              <h3 className="fw-bold mb-1">{t('app_name')}</h3>
              <p className="mb-0 opacity-75">{t('login_title')}</p>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="fw-semibold small">{t('login_username_label')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder={t('login_username_placeholder')}
                    value={formData.username}
                    onChange={handleChange}
                    className="py-2"
                    required
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
                    className="py-2"
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
                      {t('login_signing')}
                    </>
                  ) : t('login_button')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <p className="text-center mt-4 text-muted small">
            Don't have an account? <Button variant="link" className="p-0 small fw-bold text-decoration-none" onClick={() => setShowRegisterModal(true)}>Register Business</Button>
          </p>
        </Col>
      </Row>

      <BusinessRegistrationModal
        show={showRegisterModal}
        onHide={() => setShowRegisterModal(false)}
      />
    </Container>
  );
};

export default Login;