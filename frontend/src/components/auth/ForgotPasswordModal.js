import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

import './AuthModal.css';

const ForgotPasswordModal = ({ show, onHide }) => {

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverMessage, setServerMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword(email);
            const message =
                response?.data?.message ||

                'If your email is registered, you will receive a reset link.';
            setSuccess(true);
            setServerMessage(message);
            toast.success('Reset link sent to your email');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to send reset link';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered className="auth-modal">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Forgot Password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {success ? (
                    <div className="text-center py-4">
                        <div className="mb-4">
                            <i className="bi bi-envelope-check fs-1"></i>
                        </div>
                        <h5 className="mb-3">Check your email</h5>
                        <p className="mb-4">
                            {serverMessage || "We have sent a password reset link to your email address."}
                        </p>
                        <Button variant="primary" className="w-100 mt-3" onClick={onHide}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="mb-4">
                            Enter your email address and we will send you a link to reset your password.
                        </p>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4" controlId="forgotEmail">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-2 fw-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Sending...
                                    </>
                                ) : 'Send Reset Link'}
                            </Button>
                        </Form>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ForgotPasswordModal;
