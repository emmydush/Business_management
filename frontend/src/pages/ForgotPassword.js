import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import { FiArrowLeft } from 'react-icons/fi';

const ForgotPassword = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
      toast.success(t('forgot_password_sent') || 'Password reset link sent to your email', {
        duration: 3000,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || t('forgot_password_error') || 'Failed to send reset link';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), #0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container>
          <Row className="w-100 justify-content-center">
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-2xl" style={{
                borderRadius: '24px',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Card.Body className="p-4 text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                  <h3 className="fw-bold text-white mb-3">{t('forgot_password_check_email') || 'Check your email'}</h3>
                  <p className="text-muted mb-4">
                    {t('forgot_password_instructions') || 'We\'ve sent a password reset link to your email address. Click the link in the email to reset your password.'}
                  </p>
                  <p className="text-muted small mb-4">
                    {t('forgot_password_link_expires') || 'The link will expire in 24 hours.'}
                  </p>
                  <Button
                    variant="primary"
                    className="w-100 py-2 fw-bold"
                    style={{ borderRadius: '12px' }}
                    onClick={() => navigate('/login')}
                  >
                    {t('back_to_login') || 'Back to Login'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), #0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container>
        <Row className="w-100 justify-content-center">
          <Col md={6} lg={4}>
            <Card className="border-0 shadow-2xl" style={{
              borderRadius: '24px',
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Card.Header className="text-center py-5 border-0 bg-transparent">
                <h2 className="fw-bold mb-1 text-white">{t('forgot_password_title') || 'Reset Password'}</h2>
                <p className="mb-0 text-muted">{t('forgot_password_subtitle') || 'Enter your email to receive a reset link'}</p>
              </Card.Header>
              <Card.Body className="p-4 pt-0">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="email">
                    <Form.Label className="fw-semibold small text-muted">{t('login_email') || 'Email Address'}</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder={t('login_email_placeholder') || 'Enter your email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        padding: '0.75rem 1rem'
                      }}
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
                        {t('sending') || 'Sending...'}
                      </>
                    ) : (t('send_reset_link') || 'Send Reset Link')}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
            <div className="text-center mt-4">
              <Button 
                variant="link" 
                className="p-0 small fw-normal text-decoration-none d-flex align-items-center justify-content-center"
                style={{ color: '#94a3b8' }}
                onClick={() => navigate('/login')}
              >
                <FiArrowLeft className="me-2" />
                {t('back_to_login') || 'Back to Login'}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword;
