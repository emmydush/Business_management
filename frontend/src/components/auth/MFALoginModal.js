import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FiShield, FiKey, FiSmartphone } from 'react-icons/fi';
import { authAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const MFALoginModal = ({ show, onHide, tempToken, onLoginSuccess }) => {
    const [method, setMethod] = useState('totp'); // 'totp' or 'backup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [backupCode, setBackupCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = method === 'totp' 
                ? { token: totpCode }
                : { backup_code: backupCode };

            const response = await authAPI.completeMFALogin(data);
            
            if (onLoginSuccess) {
                onLoginSuccess(response.data);
            }
            
            onHide();
            resetForm();
            
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTotpCode('');
        setBackupCode('');
        setError('');
        setMethod('totp');
    };

    const handleClose = () => {
        resetForm();
        onHide();
    };

    return (
        <Modal 
            show={show} 
            onHide={handleClose} 
            centered 
            className="auth-modal register-modal-white modern-auth-modal"
        >
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold h4" style={{ color: '#0f172a' }}>Security Verification</Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="px-4 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={method}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error && <Alert variant="danger" className="rounded-12 small">{error}</Alert>}

                        <div className="text-center mb-4">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="text-primary mb-3"
                            >
                                <FiShield size={48} />
                            </motion.div>
                            <h5 className="fw-bold" style={{ color: '#0f172a' }}>Two-Factor Authentication</h5>
                            <p className="text-muted small">
                                {method === 'totp' 
                                    ? 'Enter the 6-digit code from your authenticator app' 
                                    : 'Enter an 8-digit backup code to log in'}
                            </p>
                        </div>

                        <div className="method-selector mb-4">
                            <div className="d-flex gap-2 p-1 bg-light rounded-16">
                                <Button
                                    variant={method === 'totp' ? 'dark' : 'light'}
                                    onClick={() => setMethod('totp')}
                                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 rounded-12 transition-all"
                                    style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                                >
                                    <FiSmartphone /> App
                                </Button>
                                <Button
                                    variant={method === 'backup' ? 'dark' : 'light'}
                                    onClick={() => setMethod('backup')}
                                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 rounded-12 transition-all"
                                    style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                                >
                                    <FiKey /> Backup
                                </Button>
                            </div>
                        </div>

                        <Form onSubmit={handleSubmit}>
                            {method === 'totp' ? (
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="text"
                                        placeholder="000 000"
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="text-center modern-otp-input"
                                        autoFocus
                                        required
                                    />
                                </Form.Group>
                            ) : (
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="text"
                                        placeholder="8-digit backup code"
                                        value={backupCode}
                                        onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        maxLength={8}
                                        className="text-center modern-otp-input"
                                        autoFocus
                                        required
                                    />
                                </Form.Group>
                            )}

                            <div className="d-flex flex-column gap-3">
                                <Button 
                                    type="submit" 
                                    variant="dark"
                                    className="py-3 fw-bold rounded-16 modern-btn"
                                    disabled={loading || (method === 'totp' ? totpCode.length !== 6 : backupCode.length !== 8)}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify Account'
                                    )}
                                </Button>
                                <Button variant="link" className="text-muted small text-decoration-none fw-bold" onClick={handleClose}>
                                    Cancel
                                </Button>
                            </div>
                        </Form>

                        {method === 'totp' ? (
                            <div className="mt-4 p-3 bg-light rounded-12 text-center small text-muted">
                                <strong>Don&apos;t have your device?</strong> Use a backup code instead.
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded-12 text-center small text-warning-emphasis">
                                <strong>Note:</strong> Backup codes can only be used once.
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Modal.Body>
            <style dangerouslySetInnerHTML={{ __html: `
                .modern-auth-modal h4,
                .modern-auth-modal h5,
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
                .modern-otp-input {
                    background: #f8fafc !important;
                    border: 2px solid #e2e8f0 !important;
                    border-radius: 16px !important;
                    padding: 1.25rem !important;
                    font-size: 1.75rem !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.25em !important;
                    color: #0f172a !important;
                    transition: all 0.3s ease !important;
                }
                .modern-otp-input:focus {
                    border-color: #0f172a !important;
                    background: #ffffff !important;
                    box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08) !important;
                }
                .rounded-16 { border-radius: 16px !important; }
                .rounded-12 { border-radius: 12px !important; }
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .modern-btn {
                    background: #0f172a !important;
                    border: none !important;
                }
            `}} />
        </Modal>
    );
};

export default MFALoginModal;
