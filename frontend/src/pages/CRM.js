import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Table, Modal, Form, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { FiPlus, FiUsers, FiTarget, FiGift, FiMail, FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = '/api/crm';

const CRM = () => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [segments, setSegments] = useState([]);
    const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);
    const [loyaltyMembers, setLoyaltyMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('campaign');
    const [formData, setFormData] = useState({});

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/campaigns`);
            setCampaigns(res.data || []);
        } catch (err) {
            console.error('Failed to load campaigns:', err);
            setError('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const fetchSegments = async () => {
        try {
            const res = await axios.get(`${API_URL}/segments`);
            setSegments(res.data || []);
        } catch (err) {
            console.error('Failed to load segments:', err);
        }
    };

    const fetchLoyaltyPrograms = async () => {
        try {
            const res = await axios.get(`${API_URL}/loyalty/programs`);
            setLoyaltyPrograms(res.data || []);
        } catch (err) {
            console.error('Failed to load loyalty programs:', err);
        }
    };

    const fetchLoyaltyMembers = async () => {
        try {
            const res = await axios.get(`${API_URL}/loyalty/members`);
            setLoyaltyMembers(res.data || []);
        } catch (err) {
            console.error('Failed to load loyalty members:', err);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchSegments();
        fetchLoyaltyPrograms();
        fetchLoyaltyMembers();
    }, []);

    const handleSave = async () => {
        try {
            if (modalType === 'campaign') {
                await axios.post(`${API_URL}/campaigns`, formData);
                toast.success('Campaign created');
            } else if (modalType === 'segment') {
                await axios.post(`${API_URL}/segments`, formData);
                toast.success('Segment created');
            } else if (modalType === 'program') {
                await axios.post(`${API_URL}/loyalty/programs`, formData);
                toast.success('Loyalty program created');
            } else if (modalType === 'member') {
                await axios.post(`${API_URL}/loyalty/members`, formData);
                toast.success('Loyalty member added');
            }
            setShowModal(false);
            setFormData({});
            fetchCampaigns();
            fetchSegments();
            fetchLoyaltyPrograms();
            fetchLoyaltyMembers();
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            draft: 'secondary',
            scheduled: 'info',
            active: 'success',
            paused: 'warning',
            completed: 'primary',
            cancelled: 'danger'
        };
        return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <div className="crm-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">CRM & Marketing</h2>
                    <p className="text-muted mb-0">Manage campaigns, segments, and loyalty programs.</p>
                </div>
                <Button variant="primary" className="mt-3 mt-md-0" onClick={() => { setModalType('campaign'); setShowModal(true); }}>
                    <FiPlus className="me-2" /> New Campaign
                </Button>
            </div>

            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab eventKey="campaigns" title={<><FiMail className="me-1" /> Campaigns</>}>
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
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Target</th>
                                            <th>Sent</th>
                                            <th>Budget</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map(cmp => (
                                            <tr key={cmp.id}>
                                                <td>{cmp.campaign_id}</td>
                                                <td>{cmp.name}</td>
                                                <td>{cmp.campaign_type}</td>
                                                <td>{getStatusBadge(cmp.status)}</td>
                                                <td>{cmp.target_count || 0}</td>
                                                <td>{cmp.sent_count || 0}</td>
                                                <td>${cmp.budget || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="segments" title={<><FiTarget className="me-1" /> Segments</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('segment'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> New Segment
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Customers</th>
                                        <th>Leads</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map(seg => (
                                        <tr key={seg.id}>
                                            <td>{seg.segment_id}</td>
                                            <td>{seg.name}</td>
                                            <td>{seg.is_static ? 'Static' : 'Dynamic'}</td>
                                            <td>{seg.customer_count || 0}</td>
                                            <td>{seg.lead_count || 0}</td>
                                            <td>{seg.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="loyalty" title={<><FiGift className="me-1" /> Loyalty</>}>
                    <Row className="g-4">
                        <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white py-3">
                                    <h5 className="mb-0 fw-bold">Programs</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-end mb-3">
                                        <Button size="sm" variant="primary" onClick={() => { setModalType('program'); setShowModal(true); }}>
                                            <FiPlus className="me-1" /> Add
                                        </Button>
                                    </div>
                                    {loyaltyPrograms.map(prog => (
                                        <div key={prog.id} className="border-bottom py-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-medium">{prog.name}</span>
                                                <Badge bg={prog.is_active ? 'success' : 'secondary'}>
                                                    {prog.member_count || 0} members
                                                </Badge>
                                            </div>
                                            <small className="text-muted">{prog.description}</small>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white py-3">
                                    <h5 className="mb-0 fw-bold">Members</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-end mb-3">
                                        <Button size="sm" variant="primary" onClick={() => { setModalType('member'); setShowModal(true); }}>
                                            <FiPlus className="me-1" /> Add Member
                                        </Button>
                                    </div>
                                    <Table responsive size="sm">
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Points</th>
                                                <th>Tier</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loyaltyMembers.map(mem => (
                                                <tr key={mem.id}>
                                                    <td>{mem.customer?.first_name} {mem.customer?.last_name}</td>
                                                    <td>{mem.points_balance}</td>
                                                    <td>{mem.current_tier || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalType === 'campaign' && 'New Campaign'}
                        {modalType === 'segment' && 'New Segment'}
                        {modalType === 'program' && 'New Loyalty Program'}
                        {modalType === 'member' && 'Add Loyalty Member'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalType === 'campaign' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Campaign Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select value={formData.campaign_type || ''} onChange={e => setFormData({...formData, campaign_type: e.target.value})}>
                                            <option value="">Select type</option>
                                            <option value="email">Email</option>
                                            <option value="sms">SMS</option>
                                            <option value="social">Social</option>
                                            <option value="ad">Advertisement</option>
                                            <option value="promotion">Promotion</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Budget</Form.Label>
                                        <Form.Control type="number" step="0.01" value={formData.budget || ''} onChange={e => setFormData({...formData, budget: parseFloat(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Subject</Form.Label>
                                <Form.Control type="text" value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Body</Form.Label>
                                <Form.Control as="textarea" rows={4} value={formData.body || ''} onChange={e => setFormData({...formData, body: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Date</Form.Label>
                                        <Form.Control type="date" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Date</Form.Label>
                                        <Form.Control type="date" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    )}
                    {modalType === 'segment' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Segment Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" label="Static Segment (manually add members)" checked={formData.is_static || false} onChange={e => setFormData({...formData, is_static: e.target.checked})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'program' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Program Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Points per Currency</Form.Label>
                                        <Form.Control type="number" step="0.01" value={formData.points_per_currency || ''} onChange={e => setFormData({...formData, points_per_currency: parseFloat(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Currency per Point</Form.Label>
                                        <Form.Control type="number" step="0.01" value={formData.currency_per_point || ''} onChange={e => setFormData({...formData, currency_per_point: parseFloat(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" label="Enable Membership Tiers" checked={formData.has_tiers || false} onChange={e => setFormData({...formData, has_tiers: e.target.checked})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'member' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Program ID</Form.Label>
                                <Form.Control type="number" value={formData.program_id || ''} onChange={e => setFormData({...formData, program_id: parseInt(e.target.value)})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Customer ID</Form.Label>
                                <Form.Control type="number" value={formData.customer_id || ''} onChange={e => setFormData({...formData, customer_id: parseInt(e.target.value)})} />
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

export default CRM;
