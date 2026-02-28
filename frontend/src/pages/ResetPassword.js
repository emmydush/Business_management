import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';


const ResetPassword = () => {
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Get token from URL query params
    const query = new URLSearchParams(location.search);
    const token = query.get('');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Use the same password validation as registration (8+ chars, uppercase, lowercase, number, special)
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!/[a-z]/.test(password)) {
            setError('Password must contain at least one lowercase letter.');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter.');
            return;
        }
        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number.');
            return;
        }
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>]/.test(password)) {
            setError('Password must contain at least one special character.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.resetPassword(token, password);
            setSuccess(true);
            toast.success('Password reset successfully!');
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password.');
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
                <Row className="justify-content-center">
                    <Col md={6} lg={4}>
                        <Card className="border-0 shadow-2xl" style={{
                            borderRadius: '24px',
                            background: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <Card.Header className="text-center py-5 border-0 bg-transparent">
                                <h2 className="fw-bold mb-1 text-white">Reset Password</h2>
                                <p className="mb-0 text-muted">Enter your new password</p>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">

                                    {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                                    {success ? (
                                        <div className="text-center py-4">
                                            <div className="mb-4">
                                                <i className="bi bi-check-circle-fill fs-1 text-success"></i>
                                            </div>
                                            <h5 className="text-white mb-3">Password Reset Complete</h5>
                                            <p className="text-muted">
                                                Your password has been successfully updated. Redirecting to login...
                                            </p>
                                            <Button variant="primary" className="w-100 mt-3" onClick={() => navigate('/')}>
                                                Go to Login
                                            </Button>
                                        </div>
                                    ) : (
                                        <Form onSubmit={handleSubmit}>
                                            <Form.Group className="mb-4" controlId="newPassword">
                                                <Form.Label className="fw-semibold small text-muted">New Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    disabled={!token}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '12px',
                                                        color: '#fff',
                                                        padding: '0.75rem 1rem'
                                                    }}
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-4" controlId="confirmPassword">
                                                <Form.Label className="fw-semibold small text-muted">Confirm New Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    disabled={!token}
                                                    style={
                                                        {
                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '12px',
                                                            color: '#fff',
                                                            padding: '0.75rem 1rem'
                                                        }
                                                    }
                                                />
                                            </Form.Group>

                                            <Button
                                                variant="primary"
                                                type="submit"
                                                className="w-100 py-3 fw-bold shadow-lg"
                                                disabled={loading || !token}
                                                style={{ borderRadius: '12px' }}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Resetting...
                                                    </>
                                                ) : 'Reset Password'}
                                            </Button>
                                        </Form>
                                    )}
                                </Card.Body>
                            </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ResetPassword;

