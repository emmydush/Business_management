import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RegisterModal = ({ show, onHide, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
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

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        // Extract first and last name
        const nameParts = formData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const registrationData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: firstName,
            last_name: lastName
        };

        try {
            await authAPI.register(registrationData);

            // Show success message
            toast.success('Account created successfully! Welcome to Trade Flow.', {
                duration: 4000,
                icon: '🎉',
            });

            // Close modal
            onHide();

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Create Account</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="registerFullName">
                        <Form.Label className="fw-semibold small">Full Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            isInvalid={formData.fullName && formData.fullName.trim().split(' ').length < 2}
                        />
                        {formData.fullName && formData.fullName.trim().split(' ').length < 2 && (
                            <Form.Control.Feedback type="invalid">
                                Please enter both first and last name
                            </Form.Control.Feedback>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerEmail">
                        <Form.Label className="fw-semibold small">Email Address</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerUsername">
                        <Form.Label className="fw-semibold small">Username</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerPassword">
                        <Form.Label className="fw-semibold small">Password</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="registerConfirmPassword">
                        <Form.Label className="fw-semibold small">Confirm Password</Form.Label>
                        <Form.Control
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100 mb-3 py-2 fw-bold shadow-sm"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Creating Account...
                            </>
                        ) : 'Register'}
                    </Button>
                </Form>
                <div className="text-center mt-3">
                    <p className="text-muted small">
                        Already have an account?{' '}
                        <Button variant="link" className="p-0 fw-bold text-decoration-none small" onClick={onSwitchToLogin}>
                            Sign In
                        </Button>
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default RegisterModal;
