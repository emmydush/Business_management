import React, { useState } from 'react';
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

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
            const message = response?.data?.message || 'If your email is registered, you will receive a reset link.';
            setSuccess(true);
            setServerMessage(message);
            toast.success('Reset link sent successfully!');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to send reset link';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            className="auth-modal register-modal-white modern-auth-modal"
        >
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold h4" style={{ color: '#0f172a' }}>Reset Password</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div 
                            key="success"
                            className="text-center py-4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="mb-4 text-success">
                                <FaCheckCircle size={60} />
                            </div>
                            <h4 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Check Your Email</h4>
                            <p className="text-muted mb-4">
                                {serverMessage || "We've sent a password reset link to your email address."}
                            </p>
                            <Button 
                                variant="dark" 
                                className="w-100 py-3 fw-bold rounded-16 modern-btn" 
                                onClick={onHide}
                            >
                                Back to Login
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="text-muted mb-4 small">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4" controlId="forgotEmail">
                                    <Form.Label className="small fw-bold">Email Address</Form.Label>
                                    <InputGroup className="modern-input-group">
                                        <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                                        <Form.Control
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="modern-input"
                                            autoFocus
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Button
                                    variant="dark"
                                    type="submit"
                                    className="w-100 py-3 fw-bold rounded-16 modern-btn d-flex align-items-center justify-content-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sending Link...
                                        </>
                                    ) : 'Send Reset Link'}
                                </Button>
                                
                                <Button 
                                    variant="link" 
                                    className="w-100 mt-3 text-decoration-none text-muted small fw-bold d-flex align-items-center justify-content-center"
                                    onClick={onHide}
                                >
                                    <FaArrowLeft className="me-2" /> Back to Login
                                </Button>
                            </Form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Modal.Body>
            <style dangerouslySetInnerHTML={{ __html: `
                .modern-auth-modal h4,
                .modern-auth-modal p,
                .modern-auth-modal .modal-title {
                    color: #0f172a !important;
                }
                .modern-auth-modal .modal-content {
                    border-radius: 28px !important;
                    border: none !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    font-family: 'Outfit', sans-serif !important;
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
                    padding: 0.75rem 1rem 0.75rem 0.5rem !important;
                }
                .modern-btn {
                    background: #0f172a !important;
                    border: none !important;
                    border-radius: 16px !important;
                }
                .rounded-16 {
                    border-radius: 16px !important;
                }
            `}} />
        </Modal>
    );
};

export default ForgotPasswordModal;
