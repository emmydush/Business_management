import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Table, Modal, Form, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { FiPlus, FiPackage, FiList, FiPlay, FiCheck, FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = '/api/manufacturing';

const Manufacturing = () => {
    const [activeTab, setActiveTab] = useState('bom');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [boms, setBoms] = useState([]);
    const [productionOrders, setProductionOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('bom');
    const [formData, setFormData] = useState({});

    const fetchBoms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/bom`);
            setBoms(res.data || []);
        } catch (err) {
            console.error('Failed to load BOMs:', err);
            setError('Failed to load bills of materials');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductionOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/production`);
            setProductionOrders(res.data || []);
        } catch (err) {
            console.error('Failed to load production orders:', err);
        }
    };

    useEffect(() => {
        fetchBoms();
        fetchProductionOrders();
    }, []);

    const handleSave = async () => {
        try {
            if (modalType === 'bom') {
                await axios.post(`${API_URL}/bom`, formData);
                toast.success('BOM created');
            } else if (modalType === 'production') {
                await axios.post(`${API_URL}/production`, formData);
                toast.success('Production order created');
            }
            setShowModal(false);
            setFormData({});
            fetchBoms();
            fetchProductionOrders();
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const startProduction = async (orderId) => {
        try {
            await axios.post(`${API_URL}/production/${orderId}/start`);
            toast.success('Production started');
            fetchProductionOrders();
        } catch (err) {
            toast.error('Failed to start production');
        }
    };

    const completeProduction = async (orderId) => {
        try {
            await axios.post(`${API_URL}/production/${orderId}/complete`);
            toast.success('Production completed');
            fetchProductionOrders();
        } catch (err) {
            toast.error('Failed to complete production');
        }
    };

    const activateBom = async (bomId) => {
        try {
            await axios.post(`${API_URL}/bom/${bomId}/activate`);
            toast.success('BOM activated');
            fetchBoms();
        } catch (err) {
            toast.error('Failed to activate BOM');
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            draft: 'secondary',
            active: 'success',
            obsolete: 'warning',
            scheduled: 'info',
            in_progress: 'primary',
            on_hold: 'warning',
            completed: 'success',
            cancelled: 'danger'
        };
        return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <div className="manufacturing-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Manufacturing</h2>
                    <p className="text-muted mb-0">Manage bills of materials and production orders.</p>
                </div>
                <Button variant="primary" className="mt-3 mt-md-0" onClick={() => { setModalType('bom'); setShowModal(true); }}>
                    <FiPlus className="me-2" /> New BOM
                </Button>
            </div>

            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab eventKey="bom" title={<><FiList className="me-1" /> Bills of Materials</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" /></div>
                            ) : error ? (
                                <Alert variant="danger">{error}</Alert>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>BOM ID</th>
                                            <th>Name</th>
                                            <th>Product</th>
                                            <th>Version</th>
                                            <th>Quantity</th>
                                            <th>Total Cost</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boms.map(bom => (
                                            <tr key={bom.id}>
                                                <td>{bom.bom_id}</td>
                                                <td>{bom.name}</td>
                                                <td>{bom.product?.name || '-'}</td>
                                                <td>{bom.version}</td>
                                                <td>{bom.quantity}</td>
                                                <td>${bom.total_cost || 0}</td>
                                                <td>{getStatusBadge(bom.status)}</td>
                                                <td>
                                                    {bom.status !== 'active' && (
                                                        <Button variant="outline-success" size="sm" onClick={() => activateBom(bom.id)}>
                                                            Activate
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="production" title={<><FiPackage className="me-1" /> Production Orders</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('production'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> New Production Order
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Produced</th>
                                        <th>Planned Start</th>
                                        <th>Planned End</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productionOrders.map(po => (
                                        <tr key={po.id}>
                                            <td>{po.order_id}</td>
                                            <td>{po.product?.name || '-'}</td>
                                            <td>{po.quantity_to_produce}</td>
                                            <td>{po.quantity_produced || 0}</td>
                                            <td>{po.planned_start_date || '-'}</td>
                                            <td>{po.planned_end_date || '-'}</td>
                                            <td>{getStatusBadge(po.status)}</td>
                                            <td>
                                                {po.status === 'draft' && (
                                                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => startProduction(po.id)}>
                                                        <FiPlay className="me-1" /> Start
                                                    </Button>
                                                )}
                                                {po.status === 'in_progress' && (
                                                    <Button variant="outline-success" size="sm" onClick={() => completeProduction(po.id)}>
                                                        <FiCheck className="me-1" /> Complete
                                                    </Button>
                                                )}
                                            </td>
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
                        {modalType === 'bom' && 'New Bill of Materials'}
                        {modalType === 'production' && 'New Production Order'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalType === 'bom' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>BOM Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Product ID</Form.Label>
                                        <Form.Control type="number" value={formData.product_id || ''} onChange={e => setFormData({...formData, product_id: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Version</Form.Label>
                                        <Form.Control type="text" value={formData.version || ''} onChange={e => setFormData({...formData, version: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Quantity</Form.Label>
                                        <Form.Control type="number" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Labor Cost</Form.Label>
                                        <Form.Control type="number" step="0.01" value={formData.labor_cost || ''} onChange={e => setFormData({...formData, labor_cost: parseFloat(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'production' && (
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>BOM ID</Form.Label>
                                        <Form.Control type="number" value={formData.bom_id || ''} onChange={e => setFormData({...formData, bom_id: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Quantity to Produce</Form.Label>
                                        <Form.Control type="number" value={formData.quantity_to_produce || ''} onChange={e => setFormData({...formData, quantity_to_produce: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Planned Start Date</Form.Label>
                                        <Form.Control type="date" value={formData.planned_start_date || ''} onChange={e => setFormData({...formData, planned_start_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Planned End Date</Form.Label>
                                        <Form.Control type="date" value={formData.planned_end_date || ''} onChange={e => setFormData({...formData, planned_end_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Notes</Form.Label>
                                <Form.Control as="textarea" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
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

export default Manufacturing;
