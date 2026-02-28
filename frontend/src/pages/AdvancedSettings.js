import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup } from 'react-bootstrap';
import {
    FiShield,
    FiDatabase,
    FiGlobe,
    FiMail,
    FiCpu,
    FiActivity,
    FiLock,
    FiRefreshCw,
    FiSave,
    FiTrash2,
    FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdvancedSettings = () => {
    const [loading, setLoading] = useState(false);

    const handleSave = (section) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success(`${section} settings updated successfully!`, {
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }, 1000);
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Advanced System Settings</h2>
                    <p className="text-muted mb-0">Configure core system parameters, security protocols, and integrations.</p>
                </div>
                <Badge bg="danger" className="px-3 py-2 rounded-pill">
                    <FiAlertCircle className="me-1" /> Administrator Access Only
                </Badge>
            </div>

            <Row>
                <Col lg={3} className="mb-4">
                    <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
                        <Card.Body className="p-0">
                            <ListGroup variant="flush" className="rounded">
                                <ListGroup.Item action href="#system" className="py-3 border-0 d-flex align-items-center">
                                    <FiCpu className="me-3 text-primary" size={18} /> System Core
                                </ListGroup.Item>
                                <ListGroup.Item action href="#security" className="py-3 border-0 d-flex align-items-center">
                                    <FiShield className="me-3 text-success" size={18} /> Security & Auth
                                </ListGroup.Item>
                                <ListGroup.Item action href="#database" className="py-3 border-0 d-flex align-items-center">
                                    <FiDatabase className="me-3 text-info" size={18} /> Data & Backups
                                </ListGroup.Item>
                                <ListGroup.Item action href="#email" className="py-3 border-0 d-flex align-items-center">
                                    <FiMail className="me-3 text-warning" size={18} /> SMTP & Notifications
                                </ListGroup.Item>
                                <ListGroup.Item action href="#api" className="py-3 border-0 d-flex align-items-center">
                                    <FiGlobe className="me-3 text-purple" size={18} /> API & Webhooks
                                </ListGroup.Item>
                                <ListGroup.Item action href="#logs" className="py-3 border-0 d-flex align-items-center">
                                    <FiActivity className="me-3 text-secondary" size={18} /> System Logs
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={9}>
                    {/* System Core Section */}
                    <Card className="border-0 shadow-sm mb-4" id="system">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiCpu className="me-2 text-primary" /> System Core Configuration
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Environment Mode</Form.Label>
                                            <Form.Select defaultValue="production">
                                                <option value="development">Development</option>
                                                <option value="staging">Staging</option>
                                                <option value="production">Production</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted">Changes system behavior and error reporting.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Session Timeout (Minutes)</Form.Label>
                                            <Form.Control type="number" defaultValue="1440" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Check
                                            type="switch"
                                            id="maintenance-mode"
                                            label="Maintenance Mode"
                                            className="mb-2 fw-bold text-danger"
                                        />
                                        <p className="small text-muted ms-4">When enabled, only administrators can access the system. All other users will see a maintenance page.</p>
                                    </Col>
                                </Row>
                                <div className="text-end mt-3">
                                    <Button variant="primary" onClick={() => handleSave('System Core')} disabled={loading}>
                                        <FiSave className="me-2" /> Save Changes
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Security Section */}
                    <Card className="border-0 shadow-sm mb-4" id="security">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiShield className="me-2 text-success" /> Security & Authentication
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Check
                                            type="switch"
                                            id="2fa-required"
                                            label="Require 2FA for all users"
                                            className="mb-3 fw-bold"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Check
                                            type="switch"
                                            id="password-expiry"
                                            label="Enable Password Expiry (90 days)"
                                            className="mb-3 fw-bold"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Allowed IP Addresses (Whitelist)</Form.Label>
                                            <Form.Control as="textarea" rows={2} placeholder="Enter IP addresses separated by commas (leave blank for all)" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="text-end mt-3">
                                    <Button variant="success" onClick={() => handleSave('Security')} disabled={loading}>
                                        <FiLock className="me-2" /> Update Security Policy
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Database & Backups */}
                    <Card className="border-0 shadow-sm mb-4" id="database">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiDatabase className="me-2 text-info" /> Data Management & Backups
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="p-3 bg-light rounded mb-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1">Automatic Backups</h6>
                                        <p className="small text-muted mb-0">Last successful backup: Today at 03:00 AM</p>
                                    </div>
                                    <Badge bg="success">Active</Badge>
                                </div>
                            </div>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Backup Frequency</Form.Label>
                                        <Form.Select defaultValue="daily">
                                            <option value="hourly">Every Hour</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Retention Period (Days)</Form.Label>
                                        <Form.Control type="number" defaultValue="30" />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex justify-content-between mt-3">
                                <Button variant="outline-danger" className="d-flex align-items-center">
                                    <FiTrash2 className="me-2" /> Clear Temporary Data
                                </Button>
                                <Button variant="info" className="text-white" onClick={() => handleSave('Database')}>
                                    <FiRefreshCw className="me-2" /> Trigger Manual Backup
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Email Settings */}
                    <Card className="border-0 shadow-sm mb-4" id="email">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiMail className="me-2 text-warning" /> SMTP Configuration
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Row className="g-3">
                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">SMTP Host</Form.Label>
                                            <Form.Control type="text" placeholder="smtp.example.com" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Port</Form.Label>
                                            <Form.Control type="number" placeholder="587" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Username</Form.Label>
                                            <Form.Control type="text" placeholder="notifications@tradeflow.com" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Password</Form.Label>
                                            <Form.Control type="password" placeholder="••••••••••••" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="text-end mt-3">
                                    <Button variant="warning" className="text-dark fw-bold" onClick={() => handleSave('Email')}>
                                        <FiSave className="me-2" /> Save SMTP Settings
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* API & Webhooks */}
                    <Card className="border-0 shadow-sm mb-4" id="api">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiGlobe className="me-2 text-purple" /> API & External Integrations
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-4">
                                <h6 className="fw-bold small mb-3">System API Keys</h6>
                                <div className="p-3 border rounded d-flex justify-content-between align-items-center bg-light mb-2">
                                    <code>tf_live_51MzX...9kL2</code>
                                    <Button variant="link" size="sm" className="text-decoration-none">Regenerate</Button>
                                </div>
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Webhook URL</Form.Label>
                                <Form.Control type="url" placeholder="https://your-app.com/webhooks" />
                            </Form.Group>
                            <div className="text-end mt-3">
                                <Button variant="dark" onClick={() => handleSave('API')}>
                                    <FiSave className="me-2" /> Save API Config
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style dangerouslySetInnerHTML={{
                __html: `
        .text-purple { color: #8b5cf6; }
        .bg-purple { background-color: #8b5cf6; }
        .list-group-item-action.active {
          background-color: #f1f5f9;
          color: #2563eb;
          border-left: 4px solid #2563eb !important;
          font-weight: 600;
        }
        .sticky-top {
          z-index: 100;
        }
      `}} />
        </Container>
    );
};

export default AdvancedSettings;
