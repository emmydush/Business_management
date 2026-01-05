import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const BusinessRegistrationModal = ({ show, onHide, onSwitchToLogin }) => {
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
            await authAPI.register(formData);

            toast.success('Registration successful! Your account is pending approval by the administrator.', {
                duration: 5000,
                icon: '⏳',
            });

            onHide(); // Close modal

            if (onSwitchToLogin) {
                onSwitchToLogin();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white border-0">
                <Modal.Title className="fw-bold">Register Your Business</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="business_name">
                        <Form.Label className="fw-semibold small">Business Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="business_name"
                            placeholder="Enter your business name"
                            value={formData.business_name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="first_name">
                                <Form.Label className="fw-semibold small">First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="last_name">
                                <Form.Label className="fw-semibold small">Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="username">
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

                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label className="fw-semibold small">Email Address</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="phone">
                        <Form.Label className="fw-semibold small">Phone Number</Form.Label>
                        <Form.Control
                            type="text"
                            name="phone"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
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

                    <div className="d-grid gap-2">
                        <Button
                            variant="primary"
                            type="submit"
                            className="py-2 fw-bold shadow-sm"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating account...
                                </>
                            ) : 'Register Business'}
                        </Button>
                    </div>
                </Form>
                {onSwitchToLogin && (
                    <div className="text-center mt-3">
                        <p className="text-muted small">
                            Already have an account?{' '}
                            <Button variant="link" className="p-0 fw-bold text-decoration-none small" onClick={onSwitchToLogin}>
                                Sign In
                            </Button>
                        </p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default BusinessRegistrationModal;
