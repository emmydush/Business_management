import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LoginModal = ({ show, onHide, onSwitchToRegister }) => {
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

            toast.success('Welcome back! Login successful.', {
                duration: 3000,
                icon: '🚀',
            });

            // Close modal
            onHide();

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Invalid username or password. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Welcome Back</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="loginUsername">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="loginPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder="Enter your password"
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
                                Signing in...
                            </>
                        ) : 'Sign In'}
                    </Button>
                </Form>
                <div className="text-center mt-3">
                    <p className="text-muted">
                        Don't have an account?{' '}
                        <Button variant="link" className="p-0 fw-bold text-decoration-none" onClick={onSwitchToRegister}>
                            Register
                        </Button>
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default LoginModal;
