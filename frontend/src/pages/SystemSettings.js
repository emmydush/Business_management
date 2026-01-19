import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Table } from 'react-bootstrap';
import { FiSettings, FiServer, FiDatabase, FiHardDrive, FiGlobe, FiMail, FiLock, FiSave, FiRefreshCw, FiShield } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const SystemSettings = () => {
    const [systemSettings, setSystemSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Default system settings
    const defaultSettings = {
        'app_name': 'TradeFlow ERP',
        'app_version': '1.0.0',
        'maintenance_mode': false,
        'backup_enabled': true,
        'backup_frequency': 'daily',
        'backup_retention': 30,
        'email_notifications': true,
        'sms_notifications': false,
        'data_encryption': true,
        'session_timeout': 30,
        'max_file_upload_size': 10,
        'api_rate_limit': 1000
    };

    useEffect(() => {
        fetchSystemSettings();
    }, []);

    const fetchSystemSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getSystemSettings();
            
            // Create a settings object from the API response
            const settingsObj = {};
            response.data.system_settings.forEach(setting => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });
            
            // Merge with defaults for any missing settings
            const finalSettings = { ...defaultSettings };
            Object.keys(settingsObj).forEach(key => {
                finalSettings[key] = settingsObj[key];
            });
            
            setSystemSettings(finalSettings);
            setError(null);
        } catch (err) {
            setError('Failed to fetch system settings.');
            setSystemSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSystemSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await settingsAPI.updateSystemSettings(systemSettings);
            toast.success('System settings updated successfully!');
        } catch (error) {
            toast.error('Failed to update system settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">System Settings</h2>
                    <p className="text-muted mb-0">Configure core system parameters and security settings</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchSystemSettings}>
                        <FiRefreshCw className="me-2" /> Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="fw-bold mb-0">General Settings</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Application Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={systemSettings.app_name || ''}
                                                onChange={(e) => handleChange('app_name', e.target.value)}
                                                placeholder="Enter application name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Application Version</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={systemSettings.app_version || ''}
                                                onChange={(e) => handleChange('app_version', e.target.value)}
                                                placeholder="Enter version number"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="maintenance-mode"
                                                label="Maintenance Mode"
                                                checked={systemSettings.maintenance_mode === 'true' || systemSettings.maintenance_mode === true}
                                                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                When enabled, the system will be in maintenance mode and only accessible to administrators.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="fw-bold mb-0">Security Settings</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="data-encryption"
                                                label="Enable Data Encryption"
                                                checked={systemSettings.data_encryption === 'true' || systemSettings.data_encryption === true}
                                                onChange={(e) => handleChange('data_encryption', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Session Timeout (minutes)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={systemSettings.session_timeout || 30}
                                                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                                                min="1"
                                                max="120"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">API Rate Limit (requests/hour)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={systemSettings.api_rate_limit || 1000}
                                                onChange={(e) => handleChange('api_rate_limit', parseInt(e.target.value))}
                                                min="100"
                                                max="10000"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Max File Upload Size (MB)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={systemSettings.max_file_upload_size || 10}
                                                onChange={(e) => handleChange('max_file_upload_size', parseInt(e.target.value))}
                                                min="1"
                                                max="100"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="fw-bold mb-0">Notification Settings</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="email-notifications"
                                                label="Email Notifications"
                                                checked={systemSettings.email_notifications === 'true' || systemSettings.email_notifications === true}
                                                onChange={(e) => handleChange('email_notifications', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="sms-notifications"
                                                label="SMS Notifications"
                                                checked={systemSettings.sms_notifications === 'true' || systemSettings.sms_notifications === true}
                                                onChange={(e) => handleChange('sms_notifications', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="fw-bold mb-0">Backup Settings</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="switch"
                                        id="backup-enabled"
                                        label="Enable Automatic Backups"
                                        checked={systemSettings.backup_enabled === 'true' || systemSettings.backup_enabled === true}
                                        onChange={(e) => handleChange('backup_enabled', e.target.checked)}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Backup Frequency</Form.Label>
                                    <Form.Select
                                        value={systemSettings.backup_frequency || 'daily'}
                                        onChange={(e) => handleChange('backup_frequency', e.target.value)}
                                    >
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </Form.Select>
                                </Form.Group>
                                
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Retention Period (Days)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={systemSettings.backup_retention || 30}
                                        onChange={(e) => handleChange('backup_retention', parseInt(e.target.value))}
                                        min="1"
                                        max="365"
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 py-3">
                                <h5 className="fw-bold mb-0">System Information</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Status:</span>
                                    <Badge bg="success">Operational</Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Version:</span>
                                    <span className="fw-bold">{systemSettings.app_version || '1.0.0'}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Database:</span>
                                    <span className="fw-bold">PostgreSQL</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Server:</span>
                                    <span className="fw-bold">Flask</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={saving}
                        className="d-flex align-items-center"
                    >
                        {saving ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Saving...</span>
                                </div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave className="me-2" /> Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default SystemSettings;
