import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
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

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      localStorage.setItem('token', 'mock-jwt-token');

      toast.success('Welcome back! Login successful.', {
        duration: 3000,
        icon: '🚀',
      });

      navigate('/dashboard');
    } catch (err) {
      toast.error('Invalid username or password. Please try again.');
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
              <h3 className="fw-bold mb-1">Trade Flow</h3>
              <p className="mb-0 opacity-75">Sign in to your account</p>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="fw-semibold small">Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    className="py-2"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label className="fw-semibold small">Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter your password"
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
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <p className="text-center mt-4 text-muted small">
            Don't have an account? <Button variant="link" className="p-0 small fw-bold text-decoration-none">Contact Admin</Button>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;