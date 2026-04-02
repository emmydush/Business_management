import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, QRCodeSVG } from 'react-bootstrap';
import { FiShield, FiSmartphone, FiKey, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { authAPI } from '../../services/api';

const MFAModal = ({ show, onHide, onMFAEnabled }) => {
    const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Complete
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // MFA Setup Data
    const [mfaData, setMfaData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodesCopied, setBackupCodesCopied] = useState(false);

    useEffect(() => {
        if (show && step === 1) {
            setupMFA();
        }
    }, [show, step]);

    const setupMFA = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await authAPI.setupMFA();
            setMfaData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to setup MFA');
        } finally {
            setLoading(false);
        }
    };

    const verifySetup = async (e) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a 6-digit verification code');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await authAPI.verifyMFASetup({ token: verificationCode });
            
            setSuccess('MFA enabled successfully!');
            setStep(3);
            
            if (onMFAEnabled) {
                onMFAEnabled();
            }
            
            setTimeout(() => {
                onHide();
                resetForm();
            }, 2000);
            
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        if (mfaData?.backup_codes) {
            const codesText = mfaData.backup_codes.join('\n');
            navigator.clipboard.writeText(codesText);
            setBackupCodesCopied(true);
            setTimeout(() => setBackupCodesCopied(false), 3000);
        }
    };

    const resetForm = () => {
        setStep(1);
        setError('');
        setSuccess('');
        setMfaData(null);
        setVerificationCode('');
        setBackupCodesCopied(false);
    };

    const handleClose = () => {
        if (step !== 3) {
            resetForm();
        }
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FiShield size={24} />
                    Setup Multi-Factor Authentication
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {step === 1 && mfaData && (
                    <div className="mfa-setup">
                        <div className="text-center mb-4">
                            <FiSmartphone size={48} className="text-primary mb-3" />
                            <h5>Step 1: Scan QR Code</h5>
                            <p className="text-muted">
                                Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code
                            </p>
                        </div>

                        <div className="d-flex justify-content-center mb-4">
                            <div className="border rounded p-3 bg-white">
                                {mfaData.qr_code_uri ? (
                                    <QRCodeSVG value={mfaData.qr_code_uri} size={200} />
                                ) : (
                                    <Spinner animation="border" />
                                )}
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-muted small">
                                Can't scan? Enter this code manually in your app:
                            </p>
                            <code className="bg-light p-2 rounded d-block">
                                {mfaData.secret}
                            </code>
                        </div>

                        <div className="backup-codes-section">
                            <h6 className="d-flex align-items-center gap-2 mb-3">
                                <FiKey />
                                Backup Codes
                            </h6>
                            <Alert variant="warning" className="small">
                                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                            </Alert>
                            
                            <div className="backup-codes-grid mb-3">
                                {mfaData.backup_codes?.map((code, index) => (
                                    <div key={index} className="backup-code-item">
                                        <code>{code}</code>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={copyBackupCodes}
                                className="d-flex align-items-center gap-2"
                            >
                                {backupCodesCopied ? <FiCheck /> : <FiCopy />}
                                {backupCodesCopied ? 'Copied!' : 'Copy All Codes'}
                            </Button>
                        </div>

                        <div className="d-flex justify-content-between mt-4">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => setStep(2)}
                                disabled={loading}
                            >
                                Next - Verify Code
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="mfa-verification">
                        <div className="text-center mb-4">
                            <FiShield size={48} className="text-primary mb-3" />
                            <h5>Step 2: Verify Setup</h5>
                            <p className="text-muted">
                                Enter the 6-digit code from your authenticator app to complete setup
                            </p>
                        </div>

                        <Form onSubmit={verifySetup}>
                            <Form.Group className="mb-4">
                                <Form.Label>Verification Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

                            <div className="d-flex justify-content-between">
                                <Button variant="secondary" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="primary"
                                    disabled={loading || verificationCode.length !== 6}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Enable MFA'}
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-4">
                        <FiCheck size={64} className="text-success mb-3" />
                        <h5>MFA Enabled Successfully!</h5>
                        <p className="text-muted">
                            Your account is now protected with multi-factor authentication.
                        </p>
                    </div>
                )}

                <style jsx>{`
                    .backup-codes-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 0.5rem;
                    }
                    
                    .backup-code-item {
                        padding: 0.5rem;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 0.375rem;
                        text-align: center;
                    }
                    
                    .backup-code-item code {
                        font-family: 'Courier New', monospace;
                        font-size: 0.875rem;
                    }
                `}</style>
            </Modal.Body>
        </Modal>
    );
};

export default MFAModal;
