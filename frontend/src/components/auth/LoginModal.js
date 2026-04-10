import React, { useState } from 'react';
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from './AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import logoImage from '../../assets/images/icon.png';
import { FaEye, FaEyeSlash, FaLock, FaUserAlt, FaArrowRight } from 'react-icons/fa';
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

            toast.success('Welcome back to afribuz!', {
                duration: 3000,
                icon: '✨',
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
            const errorMessage = err.response?.data?.error || (!err.response ? 'Cannot reach the backend API. Please start the backend server and try again.' : 'Login failed. Please try again.');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal 
                show={show} 
                onHide={onHide} 
                centered 
                className="auth-modal register-modal-white modern-login-modal"
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <div className="w-100 text-center mt-3">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, type: 'spring' }}
                        >
                            <img src={logoImage} alt="Company Logo" className="justify-content-center mb-3" style={{ 
    width: '80px', 
    height: 'auto'
}} />
                        </motion.div>
                        <motion.h2 
                            className="fw-bold h3 mb-2"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ letterSpacing: '-0.5px' }}
                        >
                            Welcome Back
                        </motion.h2>
                        <motion.p 
                            className="text-muted small"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Sign in to continue to your dashboard
                        </motion.p>
                    </div>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Form onSubmit={handleSubmit} autoComplete="off">
                                <Form.Group className="mb-4" controlId="loginUsername">
                                    <Form.Label className="small fw-bold">Username or Email</Form.Label>
                                    <InputGroup className="modern-input-group">
                                        <InputGroup.Text><FaUserAlt /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="login_username"
                                            autoComplete="off"
                                            placeholder="Enter your username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            className="modern-input"
                                            autoFocus
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="loginPassword">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Form.Label className="small fw-bold mb-0">Password</Form.Label>
                                        <Button
                                            variant="link"
                                            className="p-0 extra-small text-decoration-none text-primary fw-bold"
                                            onClick={() => setShowForgot(true)}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </div>
                                    <InputGroup className="modern-input-group">
                                        <InputGroup.Text><FaLock /></InputGroup.Text>
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            name="login_password"
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="modern-input"
                                        />
                                        <Button
                                            variant="light"
                                            onClick={() => setShowPassword(!showPassword)}
                                            type="button"
                                            className="password-toggle-btn"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>

                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        variant="dark"
                                        type="submit"
                                        className="w-100 mt-4 py-3 fw-bold rounded-16 shadow-premium modern-login-btn d-flex align-items-center justify-content-center"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign In <FaArrowRight className="ms-2" />
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </Form>
                            <div className="text-center mt-4">
                                <p className="text-muted small">
                                    Don&apos;t have an account?{' '}
                                    <Button 
                                        variant="link" 
                                        className="p-0 fw-bold text-decoration-none text-dark hover-underline" 
                                        onClick={onSwitchToRegister}
                                    >
                                        Create one for free
                                    </Button>
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Modal.Body>
                <ForgotPasswordModal
                    show={showForgot}
                    onHide={() => setShowForgot(false)}
                />

                <style dangerouslySetInnerHTML={{ __html: `
                    .modern-login-modal h2, 
                    .modern-login-modal .h3,
                    .modern-login-modal h3,
                    .modern-login-modal p,
                    .modern-login-modal .text-muted {
                        color: #0f172a !important;
                    }

                    .modern-login-modal .modal-content {
                        border-radius: 28px !important;
                        overflow: hidden;
                        border: none !important;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    }
                    
                    .modern-login-modal .modal-header {
                        padding-top: 2rem !important;
                    }

                    .modern-input-group {
                        background: #f8fafc !important;
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 16px !important;
                        padding: 4px;
                        transition: all 0.3s ease;
                    }

                    .modern-input-group:focus-within {
                        border-color: #0f172a !important;
                        background: #ffffff !important;
                        box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08) !important;
                    }

                    .modern-input-group .input-group-text {
                        background: transparent !important;
                        border: none !important;
                        color: #94a3b8 !important;
                        padding-left: 1rem !important;
                    }

                    .modern-input-group .form-control {
                        background: transparent !important;
                        border: none !important;
                        font-weight: 500 !important;
                        color: #1e293b !important;
                        padding: 0.75rem 1rem 0.75rem 0.5rem !important;
                    }

                    .modern-input-group .form-control:focus {
                        box-shadow: none !important;
                    }

                    .password-toggle-btn {
                        background: transparent !important;
                        border: none !important;
                        color: #94a3b8 !important;
                        padding: 0 1rem !important;
                    }

                    .password-toggle-btn:hover {
                        color: #1e293b !important;
                    }

                    .rounded-16 {
                        border-radius: 16px !important;
                    }

                    .shadow-premium {
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                    }

                    .modern-login-btn {
                        background: #0f172a !important;
                        border: none !important;
                        transition: all 0.3s ease !important;
                    }

                    .modern-login-btn:hover {
                        background: #1e293b !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15) !important;
                    }

                    .hover-underline:hover {
                        text-decoration: underline !important;
                    }

                    .extra-small {
                        font-size: 0.75rem !important;
                    }
                `}} />
            </Modal>
        </>
    );
};

export default LoginModal;
