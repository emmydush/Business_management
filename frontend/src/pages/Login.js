import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const map = {
      login_username: 'username',
      login_password: 'password',
      username: 'username',
      password: 'password'
    };
    const key = map[name] || name;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      // Store token in sessionStorage
      sessionStorage.setItem('token', response.data.access_token);

      // Use AuthContext to set user data
      login(response.data.user);

      toast.success("login_success", {
        duration: 3000,
        icon: '🚀',
      });

      if (response.data.user.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Invalid username or password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                <h2 className="fw-bold mb-1 text-white">{"app_name"}</h2>
                <p className="mb-0 text-muted">{"Sign in to your account"}</p>
              </Card.Header>
              <Card.Body className="p-4 pt-0">
                <Form onSubmit={handleSubmit} autoComplete="off">
                  {/* Dummy inputs to absorb browser autofill */}
                  <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />
                  <input type="password" name="password" autoComplete="current-password" style={{ display: 'none' }} />
                  <Form.Group className="mb-3" controlId="username">
                    <Form.Label className="fw-semibold small text-muted">{"Username"}</Form.Label>
                    <Form.Control
                      type="text"
                      name="login_username"
                      autoComplete="off"
                      placeholder={"Enter your username"}
                      value={formData.username}
                      onChange={handleChange}
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

                  <Form.Group className="mb-4" controlId="password">
                    <Form.Label className="fw-semibold small text-muted">{"Password"}</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="login_password"
                        autoComplete="current-password"
                        placeholder={"Enter your password"}
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px 0 0 12px',
                          color: '#fff',
                          padding: '0.75rem 1rem'
                        }}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderLeft: 'none',
                          borderRadius: '0 12px 12px 0',
                          color: '#94a3b8',
                          padding: '0.75rem 1rem'
                        }}
                        type="button"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
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
                        {"Signing in..."}
                      </>
                    ) : "Sign In"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
            <p className="text-center mt-4 text-muted small">
              {"Don't have an account?"} <Link to="/register" className="p-0 small fw-bold text-decoration-none">{"Register"}</Link>
            </p>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default Login;
