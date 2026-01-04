import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'STAFF'
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
            await authAPI.register(formData);

            toast.success('Registration successful! You can now log in.', {
                duration: 4000,
                icon: '✅',
            });

            navigate('/login');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Row className="w-100">
                <Col md={8} lg={6} className="mx-auto">
                    <Card className="border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                        <Card.Header className="text-center bg-primary text-white py-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                            <h3 className="fw-bold mb-1">Trade Flow</h3>
                            <p className="mb-0 opacity-75">Create a new account</p>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
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

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 py-2 fw-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Creating account...
                                        </>
                                    ) : 'Register'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <p className="text-center mt-4 text-muted small">
                        Already have an account? <Button variant="link" className="p-0 small fw-bold text-decoration-none" onClick={() => navigate('/login')}>Sign In</Button>
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
