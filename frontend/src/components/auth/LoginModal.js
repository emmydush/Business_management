import React, { useState } from 'react';
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

import { useAuth } from './AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './AuthModal.css';

const LoginModal = ({ show, onHide, onSwitchToRegister }) => {

    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

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

            // Store token and user info
            sessionStorage.setItem('token', response.data.access_token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));

            // Update AuthContext so rest of the app reflects the logged-in user immediately
            login(response.data.user);

            toast.success('Login successful!', {
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
            const errorMessage = err.response?.data?.error || 'Invalid username or password. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered className="auth-modal">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Welcome Back</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit} autoComplete="off">
                    {/* Dummy inputs to absorb browser autofill */}
                    <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />
                    <input type="password" name="password" autoComplete="current-password" style={{ display: 'none' }} />
                    <Form.Group className="mb-3" controlId="loginUsername">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            name="login_username"
                            autoComplete="off"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="loginPassword">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="login_password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                                style={{
                                    borderLeft: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    <div className="text-end mb-3">
                        <Button
                            variant="link"
                            className="p-0 small text-decoration-none"
                            onClick={() => setShowForgot(true)}
                        >
                            Forgot Password?
                        </Button>
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mb-3 py-2 fw-bold"
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
                <div className="text-center mt-3">
                    <p className="text-muted">
                        Don&apos;t have an account?{' '}
                        <Button variant="link" className="p-0 fw-bold text-decoration-none" onClick={onSwitchToRegister}>
                            Register
                        </Button>
                    </p>
                </div>
            </Modal.Body>
            <ForgotPasswordModal
                show={showForgot}
                onHide={() => setShowForgot(false)}
            />
        </Modal>
    );
};

export default LoginModal;
