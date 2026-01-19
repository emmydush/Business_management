import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Badge, Form } from 'react-bootstrap';
import { FiZap, FiDatabase, FiCreditCard, FiMail, FiShoppingBag, FiDollarSign, FiRefreshCw, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Integrations = () => {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getIntegrations();
            setIntegrations(response.data.integrations || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch integrations.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        setSaving(prev => ({ ...prev, [id]: true }));
        try {
            const integration = integrations.find(int => int.id === id);
            await settingsAPI.updateIntegration(id, { enabled: !integration.enabled });
            setIntegrations(prev => 
                prev.map(int => 
                    int.id === id ? { ...int, enabled: !int.enabled } : int
                )
            );
            toast.success(`Integration ${integration.enabled ? 'disconnected' : 'connected'} successfully`);
        } catch (err) {
            toast.error('Failed to update integration');
        } finally {
            setSaving(prev => ({ ...prev, [id]: false }));
        }
    };

    const getIntegrationIcon = (name) => {
        switch (name.toLowerCase()) {
            case 'stripe payment gateway':
                return <FiCreditCard className="text-success me-2" />;
            case 'quickbooks':
                return <FiDollarSign className="text-info me-2" />;
            case 'mailchimp':
                return <FiMail className="text-warning me-2" />;
            case 'shopify':
                return <FiShoppingBag className="text-primary me-2" />;
            default:
                return <FiZap className="text-secondary me-2" />;
        }
    };

    const getIntegrationStatus = (status) => {
        switch (status.toLowerCase()) {
            case 'connected':
                return <Badge bg="success" className="fw-normal">Connected</Badge>;
            case 'not connected':
                return <Badge bg="secondary" className="fw-normal">Not Connected</Badge>;
            case 'error':
                return <Badge bg="danger" className="fw-normal">Error</Badge>;
            default:
                return <Badge bg="warning" className="fw-normal text-dark">Pending</Badge>;
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
                    <h2 className="fw-bold text-dark mb-1">Integrations</h2>
                    <p className="text-muted mb-0">Connect and manage third-party services</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchIntegrations}>
                        <FiRefreshCw className="me-2" /> Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Connected Services</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Service</th>
                                            <th>Description</th>
                                            <th>Last Sync</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {integrations.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiZap size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No integrations</h5>
                                                        <p className="text-muted mb-0">No third-party services are currently connected</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            integrations.map(integration => (
                                                <tr key={integration.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            {getIntegrationIcon(integration.name)}
                                                            <div>
                                                                <div className="fw-bold">{integration.name}</div>
                                                                <div className="small text-muted">ID: {integration.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-muted small">
                                                            {integration.name === 'Stripe Payment Gateway' && 'Process payments securely through Stripe'}
                                                            {integration.name === 'QuickBooks' && 'Sync financial data with QuickBooks'}
                                                            {integration.name === 'Mailchimp' && 'Manage email campaigns and marketing'}
                                                            {!['Stripe Payment Gateway', 'QuickBooks', 'Mailchimp'].includes(integration.name) && 'Third-party service integration'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {integration.last_sync ? (
                                                            <div className="small text-muted">
                                                                {new Date(integration.last_sync).toLocaleDateString()}
                                                            </div>
                                                        ) : (
                                                            <div className="small text-muted">Never</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {getIntegrationStatus(integration.status)}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Form.Check
                                                            type="switch"
                                                            id={`integration-${integration.id}`}
                                                            checked={integration.enabled}
                                                            disabled={saving[integration.id]}
                                                            onChange={() => handleToggle(integration.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Available Integrations</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-4">
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiCreditCard className="text-success" size={24} />
                                            </div>
                                            <h6 className="fw-bold">PayPal</h6>
                                            <p className="text-muted small mb-3">Accept payments through PayPal</p>
                                            <Button variant="outline-primary" size="sm">
                                                Connect
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiDollarSign className="text-info" size={24} />
                                            </div>
                                            <h6 className="fw-bold">Xero</h6>
                                            <p className="text-muted small mb-3">Sync financial data with Xero</p>
                                            <Button variant="outline-primary" size="sm">
                                                Connect
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiMail className="text-warning" size={24} />
                                            </div>
                                            <h6 className="fw-bold">SendGrid</h6>
                                            <p className="text-muted small mb-3">Email delivery service</p>
                                            <Button variant="outline-primary" size="sm">
                                                Connect
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiShoppingBag className="text-primary" size={24} />
                                            </div>
                                            <h6 className="fw-bold">WooCommerce</h6>
                                            <p className="text-muted small mb-3">Connect with WooCommerce store</p>
                                            <Button variant="outline-primary" size="sm">
                                                Connect
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiDatabase className="text-secondary" size={24} />
                                            </div>
                                            <h6 className="fw-bold">Salesforce</h6>
                                            <p className="text-muted small mb-3">CRM integration</p>
                                            <Button variant="outline-primary" size="sm">
                                                Connect
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} lg={4}>
                                    <Card className="border h-100">
                                        <Card.Body className="text-center">
                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                                <FiSettings className="text-dark" size={24} />
                                            </div>
                                            <h6 className="fw-bold">Custom API</h6>
                                            <p className="text-muted small mb-3">Connect custom services</p>
                                            <Button variant="outline-primary" size="sm">
                                                Configure
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Integrations;
