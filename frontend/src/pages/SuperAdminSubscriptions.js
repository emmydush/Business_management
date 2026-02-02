import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal, Tabs, Tab } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiUsers, FiActivity, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const SuperAdminSubscriptions = () => {
    const { formatCurrency } = useCurrency();
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [editingSub, setEditingSub] = useState(null);

    const [planFormData, setPlanFormData] = useState({
        name: '',
        plan_type: 'basic',
        price: 0,
        billing_cycle: 'monthly',
        max_users: 5,
        max_products: 500,
        max_orders: 1000,
        max_branches: 1,
        features: [],
        is_active: true
    });

    const [subFormData, setSubFormData] = useState({
        plan_id: '',
        status: 'active',
        end_date: '',
        is_active: true
    });

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [subsRes, plansRes, statsRes] = await Promise.all([
                superadminAPI.getAllSubscriptions(),
                superadminAPI.getPlans(),
                superadminAPI.getSubscriptionStats()
            ]);
            setSubscriptions(subsRes.data.subscriptions || []);
            setPlans(plansRes.data.plans || []);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error fetching subscription data:', err);
            toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePlanEdit = (plan) => {
        setEditingPlan(plan);
        setPlanFormData({
            name: plan.name,
            plan_type: plan.plan_type,
            price: plan.price,
            billing_cycle: plan.billing_cycle,
            max_users: plan.max_users,
            max_products: plan.max_products,
            max_orders: plan.max_orders,
            max_branches: plan.max_branches,
            features: plan.features || [],
            is_active: plan.is_active
        });
        setShowPlanModal(true);
    };

    const handlePlanSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await superadminAPI.updatePlan(editingPlan.id, planFormData);
                toast.success('Plan updated successfully');
            } else {
                await superadminAPI.createPlan(planFormData);
                toast.success('Plan created successfully');
            }
            setShowPlanModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save plan');
        }
    };

    const handleSubEdit = (sub) => {
        setEditingSub(sub);
        setSubFormData({
            plan_id: sub.plan_id || '',
            status: sub.status,
            end_date: sub.end_date ? sub.end_date.split('T')[0] : '',
            is_active: sub.is_active
        });
        setShowSubModal(true);
    };

    const handleSubSubmit = async (e) => {
        e.preventDefault();
        try {
            await superadminAPI.updateSubscriptionStatus(editingSub.id, subFormData);
            toast.success('Subscription updated successfully');
            setShowSubModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update subscription');
        }
    };

    const handleApproveSub = async (sub) => {
        try {
            // Set status to active and ensure it's active
            const updateData = {
                status: 'active',
                is_active: true,
                // Keep existing end date or extend it if needed
                end_date: sub.end_date
            };
            await superadminAPI.updateSubscriptionStatus(sub.id, updateData);
            toast.success(`Subscription for ${sub.business_name} approved!`);
            fetchData();
        } catch (err) {
            toast.error('Failed to approve subscription');
        }
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this plan?')) {
            try {
                await superadminAPI.deletePlan(id);
                toast.success('Plan deactivated');
                fetchData();
            } catch (err) {
                toast.error('Failed to deactivate plan');
            }
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="superadmin-subscriptions py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">Subscription Management</h2>
                        <p className="text-muted mb-0">Manage plans and monitor business subscriptions.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2"
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>

                {/* Stats Cards */}
                <Row className="g-4 mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-dark text-white h-100">
                            <Card.Body className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                    <FiActivity className="text-primary" size={24} />
                                </div>
                                <div>
                                    <div className="text-muted small">Total Subscriptions</div>
                                    <h3 className="fw-bold mb-0">{stats?.total || 0}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-dark text-white h-100">
                            <Card.Body className="d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                                    <FiCheckCircle className="text-success" size={24} />
                                </div>
                                <div>
                                    <div className="text-muted small">Active Subscriptions</div>
                                    <h3 className="fw-bold mb-0">{stats?.active || 0}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-dark text-white h-100">
                            <Card.Body className="d-flex align-items-center">
                                <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                    <FiClock className="text-warning" size={24} />
                                </div>
                                <div>
                                    <div className="text-muted small">Trial Subscriptions</div>
                                    <h3 className="fw-bold mb-0">{stats?.trial || 0}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-dark text-white h-100">
                            <Card.Body className="d-flex align-items-center">
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                                    <FiDollarSign className="text-danger" size={24} />
                                </div>
                                <div>
                                    <div className="text-muted small">Monthly Revenue</div>
                                    <h3 className="fw-bold mb-0">{formatCurrency(stats?.monthly_revenue || 0)}</h3>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Tabs defaultActiveKey="subscriptions" className="mb-4 border-secondary border-opacity-25 custom-tabs">
                    <Tab eventKey="subscriptions" title="All Subscriptions">
                        <Card className="border-0 shadow-sm bg-dark text-white">
                            <Card.Header className="bg-transparent border-0 p-4">
                                <InputGroup className="w-50">
                                    <InputGroup.Text className="bg-dark border-secondary text-muted">
                                        <FiSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by business or plan..."
                                        className="bg-dark border-secondary text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="align-middle mb-0 border-secondary border-opacity-10">
                                    <thead className="bg-dark text-muted small text-uppercase">
                                        <tr>
                                            <th className="border-0 ps-4">Business</th>
                                            <th className="border-0">Plan</th>
                                            <th className="border-0">Start Date</th>
                                            <th className="border-0">End Date</th>
                                            <th className="border-0">Status</th>
                                            <th className="border-0 text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white">
                                        {filteredSubscriptions.map((sub) => (
                                            <tr key={sub.id} className="border-secondary border-opacity-10">
                                                <td className="border-0 ps-4 fw-bold">{sub.business_name}</td>
                                                <td className="border-0">
                                                    <Badge bg="info" className="text-capitalize">{sub.plan.name}</Badge>
                                                </td>
                                                <td className="border-0 text-muted small">
                                                    {new Date(sub.start_date).toLocaleDateString()}
                                                </td>
                                                <td className="border-0 text-muted small">
                                                    {new Date(sub.end_date).toLocaleDateString()}
                                                </td>
                                                <td className="border-0">
                                                    <Badge bg={
                                                        sub.status === 'active' ? 'success' :
                                                            sub.status === 'trial' ? 'warning' :
                                                                sub.status === 'pending' ? 'info' : 'danger'
                                                    } className="text-capitalize">
                                                        {sub.status}
                                                    </Badge>
                                                </td>
                                                <td className="border-0 text-end pe-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        {sub.status === 'pending' && (
                                                            <Button variant="success" size="sm" onClick={() => handleApproveSub(sub)}>
                                                                <FiCheckCircle className="me-1" /> Approve
                                                            </Button>
                                                        )}
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleSubEdit(sub)}>
                                                            <FiEdit2 /> Manage
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="plans" title="Subscription Plans">
                        <div className="d-flex justify-content-end mb-3">
                            <Button variant="danger" className="d-flex align-items-center gap-2" onClick={() => {
                                setEditingPlan(null);
                                setPlanFormData({
                                    name: '',
                                    plan_type: 'basic',
                                    price: 0,
                                    billing_cycle: 'monthly',
                                    max_users: 5,
                                    max_products: 500,
                                    max_orders: 1000,
                                    max_branches: 1,
                                    features: [],
                                    is_active: true
                                });
                                setShowPlanModal(true);
                            }}>
                                <FiPlus /> Create New Plan
                            </Button>
                        </div>
                        <Row className="g-4">
                            {plans.map((plan) => (
                                <Col md={4} key={plan.id}>
                                    <Card className={`border-0 shadow-sm bg-dark text-white h-100 ${!plan.is_active ? 'opacity-50' : ''}`}>
                                        <Card.Body className="p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h4 className="fw-bold mb-0">{plan.name}</h4>
                                                    <Badge bg="secondary" className="text-capitalize mt-1">{plan.plan_type}</Badge>
                                                </div>
                                                <h3 className="fw-bold text-danger mb-0">{formatCurrency(plan.price)}<small className="text-muted fs-6">/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</small></h3>
                                            </div>
                                            <hr className="border-secondary opacity-25" />
                                            <ul className="list-unstyled mb-4 small">
                                                <li className="mb-2 d-flex align-items-center gap-2">
                                                    <FiUsers className="text-muted" /> {plan.max_users} Users
                                                </li>
                                                <li className="mb-2 d-flex align-items-center gap-2">
                                                    <FiActivity className="text-muted" /> {plan.max_products} Products
                                                </li>
                                                <li className="mb-2 d-flex align-items-center gap-2">
                                                    <FiActivity className="text-muted" /> {plan.max_orders} Orders
                                                </li>
                                                <li className="mb-2 d-flex align-items-center gap-2">
                                                    <FiActivity className="text-muted" /> {plan.max_branches} Branches
                                                </li>
                                            </ul>
                                            <div className="d-flex gap-2 mt-auto">
                                                <Button variant="outline-primary" className="flex-grow-1" onClick={() => handlePlanEdit(plan)}>
                                                    <FiEdit2 className="me-2" /> Edit Plan
                                                </Button>
                                                <Button variant="outline-danger" onClick={() => handleDeletePlan(plan.id)}>
                                                    <FiTrash2 />
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Tab>
                </Tabs>
            </Container>

            {/* Plan Modal */}
            <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} size="lg" centered className="superadmin-modal">
                <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25">
                    <Modal.Title>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handlePlanSubmit}>
                    <Modal.Body className="bg-dark text-white">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plan Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.name}
                                        onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plan Type</Form.Label>
                                    <Form.Select
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.plan_type}
                                        onChange={(e) => setPlanFormData({ ...planFormData, plan_type: e.target.value })}
                                    >
                                        <option value="free">Free</option>
                                        <option value="basic">Basic</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price (FRW)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.price}
                                        onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Billing Cycle</Form.Label>
                                    <Form.Select
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.billing_cycle}
                                        onChange={(e) => setPlanFormData({ ...planFormData, billing_cycle: e.target.value })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Users</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.max_users}
                                        onChange={(e) => setPlanFormData({ ...planFormData, max_users: parseInt(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Products</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.max_products}
                                        onChange={(e) => setPlanFormData({ ...planFormData, max_products: parseInt(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Orders</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.max_orders}
                                        onChange={(e) => setPlanFormData({ ...planFormData, max_orders: parseInt(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Branches</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="bg-dark border-secondary text-white"
                                        value={planFormData.max_branches}
                                        onChange={(e) => setPlanFormData({ ...planFormData, max_branches: parseInt(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    label="Active"
                                    checked={planFormData.is_active}
                                    onChange={(e) => setPlanFormData({ ...planFormData, is_active: e.target.checked })}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="bg-dark border-secondary border-opacity-25">
                        <Button variant="outline-secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                        <Button variant="danger" type="submit">Save Plan</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Subscription Modal */}
            <Modal show={showSubModal} onHide={() => setShowSubModal(false)} centered className="superadmin-modal">
                <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25">
                    <Modal.Title>Manage Subscription: {editingSub?.business_name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubSubmit}>
                    <Modal.Body className="bg-dark text-white">
                        <Form.Group className="mb-3">
                            <Form.Label>Subscription Plan</Form.Label>
                            <Form.Select
                                className="bg-dark border-secondary text-white"
                                value={subFormData.plan_id}
                                onChange={(e) => setSubFormData({ ...subFormData, plan_id: e.target.value })}
                            >
                                <option value="">Select Plan</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} ({formatCurrency(plan.price)}/{plan.billing_cycle})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                className="bg-dark border-secondary text-white"
                                value={subFormData.status}
                                onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="expired">Expired</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending">Pending</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                className="bg-dark border-secondary text-white"
                                value={subFormData.end_date}
                                onChange={(e) => setSubFormData({ ...subFormData, end_date: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Check
                            type="switch"
                            label="Is Active"
                            checked={subFormData.is_active}
                            onChange={(e) => setSubFormData({ ...subFormData, is_active: e.target.checked })}
                        />
                    </Modal.Body>
                    <Modal.Footer className="bg-dark border-secondary border-opacity-25">
                        <Button variant="outline-secondary" onClick={() => setShowSubModal(false)}>Cancel</Button>
                        <Button variant="danger" type="submit">Update Subscription</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .superadmin-subscriptions {
                    background-color: #0f172a;
                    min-height: 100vh;
                }
                .card {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .table {
                    --bs-table-bg: transparent;
                    --bs-table-hover-bg: rgba(255, 255, 255, 0.02);
                }
                .custom-tabs .nav-link {
                    color: #64748b;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 1rem 1.5rem;
                }
                .custom-tabs .nav-link.active {
                    background: transparent !important;
                    color: #ef4444 !important;
                    border-bottom: 2px solid #ef4444;
                }
                .form-control:focus, .form-select:focus {
                    background-color: #0f172a;
                    color: white;
                    border-color: #ef4444;
                    box-shadow: 0 0 0 0.25rem rgba(239, 68, 68, 0.25);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div >
    );
};

export default SuperAdminSubscriptions;
