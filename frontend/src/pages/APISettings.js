import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Table, Modal, Form, Spinner, Tab, Tabs } from 'react-bootstrap';
import { FiPlus, FiKey, FiLink, FiDollarSign, FiCopy, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = '/api/integrations';

const APISettings = () => {
    const [activeTab, setActiveTab] = useState('clients');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('client');
    const [formData, setFormData] = useState({});

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/clients`);
            setClients(res.data || []);
        } catch (err) {
            console.error('Failed to load API clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWebhooks = async () => {
        try {
            const res = await axios.get(`${API_URL}/webhooks`);
            setWebhooks(res.data || []);
        } catch (err) {
            console.error('Failed to load webhooks:', err);
        }
    };

    const fetchCurrencies = async () => {
        try {
            const res = await axios.get(`${API_URL}/currencies`);
            setCurrencies(res.data || []);
        } catch (err) {
            console.error('Failed to load currencies:', err);
        }
    };

    const fetchCustomFields = async () => {
        try {
            const res = await axios.get(`${API_URL}/custom-fields`);
            setCustomFields(res.data || []);
        } catch (err) {
            console.error('Failed to load custom fields:', err);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchWebhooks();
        fetchCurrencies();
        fetchCustomFields();
    }, []);

    const handleSave = async () => {
        try {
            if (modalType === 'client') {
                const res = await axios.post(`${API_URL}/clients`, formData);
                toast.success('API client created');
                if (res.data.client_secret) {
                    toast.success(`Client Secret: ${res.data.client_secret} (save this!)`, { duration: 10000 });
                }
            } else if (modalType === 'webhook') {
                await axios.post(`${API_URL}/webhooks`, formData);
                toast.success('Webhook created');
            } else if (modalType === 'currency') {
                await axios.post(`${API_URL}/currencies`, formData);
                toast.success('Currency added');
            } else if (modalType === 'customField') {
                await axios.post(`${API_URL}/custom-fields`, formData);
                toast.success('Custom field created');
            }
            setShowModal(false);
            setFormData({});
            fetchClients();
            fetchWebhooks();
            fetchCurrencies();
            fetchCustomFields();
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const regenerateSecret = async (clientId) => {
        try {
            const res = await axios.post(`${API_URL}/clients/${clientId}/regenerate-secret`);
            toast.success(`New secret: ${res.data.client_secret}`, { duration: 10000 });
            fetchClients();
        } catch (err) {
            toast.error('Failed to regenerate secret');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const deleteClient = async (clientId) => {
        if (!window.confirm('Are you sure you want to delete this API client?')) return;
        try {
            await axios.delete(`${API_URL}/clients/${clientId}`);
            toast.success('Client deleted');
            fetchClients();
        } catch (err) {
            toast.error('Failed to delete client');
        }
    };

    return (
        <div className="api-settings-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">API & Integrations</h2>
                    <p className="text-muted mb-0">Manage API clients, webhooks, currencies, and custom fields.</p>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab eventKey="clients" title={<><FiKey className="me-1" /> API Clients</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('client'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> New Client
                                </Button>
                            </div>
                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" /></div>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Client ID</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Scopes</th>
                                            <th>Status</th>
                                            <th>Last Used</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map(client => (
                                            <tr key={client.id}>
                                                <td>
                                                    <code className="text-primary">{client.client_id}</code>
                                                    <Button variant="link" size="sm" className="p-0 ms-1" onClick={() => copyToClipboard(client.client_id)}>
                                                        <FiCopy size={12} />
                                                    </Button>
                                                </td>
                                                <td>{client.client_name}</td>
                                                <td>{client.client_type}</td>
                                                <td>
                                                    {(client.scopes || []).map(s => (
                                                        <Badge key={s} bg="info" className="me-1">{s}</Badge>
                                                    ))}
                                                </td>
                                                <td>{client.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                                <td>{client.last_used_at ? new Date(client.last_used_at).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => regenerateSecret(client.id)}>
                                                        Regenerate
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => deleteClient(client.id)}>
                                                        <FiTrash2 />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="webhooks" title={<span><FiLink className="me-1" /> Webhooks</span>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('webhook'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> New Webhook
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>URL</th>
                                        <th>Events</th>
                                        <th>Status</th>
                                        <th>Retries</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {webhooks.map(wh => (
                                        <tr key={wh.id}>
                                            <td>{wh.name}</td>
                                            <td><code className="text-muted">{wh.webhook_url.substring(0, 50)}...</code></td>
                                            <td>{(wh.events || []).map(e => (
                                                <Badge key={e} bg="secondary" className="me-1">{e}</Badge>
                                            ))}</td>
                                            <td>{wh.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                            <td>{wh.retry_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="currencies" title={<><FiDollarSign className="me-1" /> Currencies</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('currency'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> Add Currency
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Symbol</th>
                                        <th>Exchange Rate</th>
                                        <th>Base</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currencies.map(curr => (
                                        <tr key={curr.id}>
                                            <td><strong>{curr.code}</strong></td>
                                            <td>{curr.name}</td>
                                            <td>{curr.symbol}</td>
                                            <td>{curr.exchange_rate}</td>
                                            <td>{curr.is_base ? <Badge bg="success">Yes</Badge> : '-'}</td>
                                            <td>{curr.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="customFields" title="Custom Fields">
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('customField'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> Add Field
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Field ID</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Entity</th>
                                        <th>Required</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customFields.map(cf => (
                                        <tr key={cf.id}>
                                            <td><code>{cf.field_id}</code></td>
                                            <td>{cf.name}</td>
                                            <td>{cf.field_type}</td>
                                            <td>{cf.entity_type}</td>
                                            <td>{cf.is_required ? <Badge bg="danger">Yes</Badge> : 'No'}</td>
                                            <td>{cf.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalType === 'client' && 'New API Client'}
                        {modalType === 'webhook' && 'New Webhook'}
                        {modalType === 'currency' && 'Add Currency'}
                        {modalType === 'customField' && 'Add Custom Field'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalType === 'client' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Client Name</Form.Label>
                                <Form.Control type="text" value={formData.client_name || ''} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select value={formData.client_type || ''} onChange={e => setFormData({...formData, client_type: e.target.value})}>
                                    <option value="PRIVATE">Private</option>
                                    <option value="PUBLIC">Public</option>
                                    <option value="PARTNER">Partner</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Rate Limit (per hour)</Form.Label>
                                <Form.Control type="number" value={formData.rate_limit_per_hour || ''} onChange={e => setFormData({...formData, rate_limit_per_hour: parseInt(e.target.value)})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Scopes (comma-separated)</Form.Label>
                                <Form.Control type="text" placeholder="read,write" value={formData.scopes || ''} onChange={e => setFormData({...formData, scopes: e.target.value.split(',').map(s => s.trim())})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'webhook' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Webhook Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Client ID</Form.Label>
                                <Form.Control type="number" value={formData.client_id || ''} onChange={e => setFormData({...formData, client_id: parseInt(e.target.value)})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Webhook URL</Form.Label>
                                <Form.Control type="url" value={formData.webhook_url || ''} onChange={e => setFormData({...formData, webhook_url: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Events (comma-separated)</Form.Label>
                                <Form.Control type="text" placeholder="order.created,customer.created" value={formData.events || ''} onChange={e => setFormData({...formData, events: e.target.value.split(',').map(s => s.trim())})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Retry Count</Form.Label>
                                <Form.Control type="number" value={formData.retry_count || ''} onChange={e => setFormData({...formData, retry_count: parseInt(e.target.value)})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'currency' && (
                        <Form>
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Code (ISO)</Form.Label>
                                        <Form.Control type="text" placeholder="EUR" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" placeholder="Euro" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Symbol</Form.Label>
                                        <Form.Control type="text" placeholder="€" value={formData.symbol || ''} onChange={e => setFormData({...formData, symbol: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Exchange Rate to USD</Form.Label>
                                <Form.Control type="number" step="0.000001" value={formData.exchange_rate || ''} onChange={e => setFormData({...formData, exchange_rate: parseFloat(e.target.value)})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" label="Is Base Currency" checked={formData.is_base || false} onChange={e => setFormData({...formData, is_base: e.target.checked})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'customField' && (
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Field ID</Form.Label>
                                        <Form.Control type="text" placeholder="custom_field_1" value={formData.field_id || ''} onChange={e => setFormData({...formData, field_id: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Field Name</Form.Label>
                                        <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select value={formData.field_type || ''} onChange={e => setFormData({...formData, field_type: e.target.value})}>
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                            <option value="datetime">DateTime</option>
                                            <option value="select">Select</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="currency">Currency</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Entity Type</Form.Label>
                                        <Form.Select value={formData.entity_type || ''} onChange={e => setFormData({...formData, entity_type: e.target.value})}>
                                            <option value="customer">Customer</option>
                                            <option value="order">Order</option>
                                            <option value="invoice">Invoice</option>
                                            <option value="product">Product</option>
                                            <option value="lead">Lead</option>
                                            <option value="employee">Employee</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" label="Required" checked={formData.is_required || false} onChange={e => setFormData({...formData, is_required: e.target.checked})} />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default APISettings;
