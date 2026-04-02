import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FiShield, FiKey, FiSmartphone } from 'react-icons/fi';
import { authAPI } from '../../services/api';

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
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FiShield size={24} />
                    Multi-Factor Authentication
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <div className="text-center mb-4">
                    <FiShield size={48} className="text-primary mb-3" />
                    <h5>Verify Your Identity</h5>
                    <p className="text-muted">
                        Enter your verification code to complete login
                    </p>
                </div>

                <div className="method-selector mb-4">
                    <div className="btn-group w-100" role="group">
                        <Button
                            variant={method === 'totp' ? 'primary' : 'outline-primary'}
                            onClick={() => setMethod('totp')}
                            className="d-flex align-items-center justify-content-center gap-2"
                        >
                            <FiSmartphone />
                            Authenticator App
                        </Button>
                        <Button
                            variant={method === 'backup' ? 'primary' : 'outline-primary'}
                            onClick={() => setMethod('backup')}
                            className="d-flex align-items-center justify-content-center gap-2"
                        >
                            <FiKey />
                            Backup Code
                        </Button>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    {method === 'totp' ? (
                        <Form.Group className="mb-4">
                            <Form.Label>Authentication Code</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="000000"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="text-center fs-3"
                                style={{ letterSpacing: '0.5em' }}
                                autoFocus
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter the 6-digit code from your authenticator app
                            </Form.Text>
                        </Form.Group>
                    ) : (
                        <Form.Group className="mb-4">
                            <Form.Label>Backup Code</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter 8-digit backup code"
                                value={backupCode}
                                onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                maxLength={8}
                                className="text-center fs-4"
                                style={{ letterSpacing: '0.3em' }}
                                autoFocus
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter one of your 8-digit backup codes
                            </Form.Text>
                        </Form.Group>
                    )}

                    <div className="d-flex justify-content-between">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={loading || (method === 'totp' ? totpCode.length !== 6 : backupCode.length !== 8)}
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify'
                            )}
                        </Button>
                    </div>
                </Form>

                {method === 'totp' && (
                    <Alert variant="info" className="mt-3 small">
                        <strong>Don't have your device?</strong> Use a backup code instead.
                    </Alert>
                )}

                {method === 'backup' && (
                    <Alert variant="warning" className="mt-3 small">
                        <strong>Note:</strong> Each backup code can only be used once. 
                        Consider regenerating codes if you've used most of them.
                    </Alert>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default MFALoginModal;
