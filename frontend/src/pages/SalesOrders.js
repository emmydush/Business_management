import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiShoppingCart, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SalesOrders = () => {
    const [orders, setOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Mock data for sales orders
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setOrders([
                { id: 1, orderId: 'SO-2025-001', customer: 'John Doe', date: '2025-12-15', amount: 1250.00, status: 'delivered', items: 3, payment: 'paid' },
                { id: 2, orderId: 'SO-2025-002', customer: 'Jane Smith', date: '2025-12-18', amount: 890.50, status: 'shipped', items: 2, payment: 'partial' },
                { id: 3, orderId: 'SO-2025-003', customer: 'Robert Johnson', date: '2025-12-20', amount: 2100.00, status: 'processing', items: 5, payment: 'unpaid' },
                { id: 4, orderId: 'SO-2025-004', customer: 'Emily Davis', date: '2025-12-22', amount: 650.75, status: 'confirmed', items: 1, payment: 'paid' },
                { id: 5, orderId: 'SO-2025-005', customer: 'Michael Wilson', date: '2025-12-24', amount: 1800.25, status: 'pending', items: 4, payment: 'unpaid' }
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const handleView = (order) => {
        setCurrentOrder(order);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete order?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => {
                        setOrders(orders.filter(ord => ord.id !== id));
                        toast.dismiss(t.id);
                        toast.success('Order deleted');
                    }}>
                        Delete
                    </Button>
                    <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                </div>
            </span>
        ), { duration: 5000 });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(currentOrder ? 'Order updated!' : 'Order created!');
        setIsSaving(false);
        handleClose();
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentOrder(null);
    };

    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>;
            case 'confirmed': return <Badge bg="info" className="fw-normal">Confirmed</Badge>;
            case 'processing': return <Badge bg="primary" className="fw-normal">Processing</Badge>;
            case 'shipped': return <Badge bg="secondary" className="fw-normal">Shipped</Badge>;
            case 'delivered': return <Badge bg="success" className="fw-normal">Delivered</Badge>;
            case 'cancelled': return <Badge bg="danger" className="fw-normal">Cancelled</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPaymentBadge = (payment) => {
        switch (payment) {
            case 'paid': return <Badge pill bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">Paid</Badge>;
            case 'partial': return <Badge pill bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25">Partial</Badge>;
            case 'unpaid': return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">Unpaid</Badge>;
            default: return null;
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
        <div className="sales-orders-wrapper">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Sales Orders</h2>
                    <p className="text-muted mb-0">Track and manage customer purchase orders.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting orders...')}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentOrder(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> New Order
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiShoppingCart className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Orders</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.length}</h3>
                            <small className="text-success fw-medium">+8% from last month</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiClock className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Pending Orders</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</h3>
                            <small className="text-muted">Awaiting fulfillment</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiCheckCircle className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Completed</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.filter(o => o.status === 'delivered').length}</h3>
                            <small className="text-muted">Successfully delivered</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiShoppingCart className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Revenue</span>
                            </div>
                            <h3 className="fw-bold mb-0">${orders.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                            <small className="text-muted">Gross sales value</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Main Content Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {/* Toolbar */}
                    <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search by Order ID or Customer..."
                                    className="bg-light border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-light" className="text-dark border d-flex align-items-center">
                                <FiFilter className="me-2" /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Order ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3">Payment</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{order.orderId}</div>
                                            <div className="small text-muted">{order.items} items</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">{order.customer}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{order.date}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td>
                                            {getPaymentBadge(order.payment)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item onClick={() => handleView(order)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> Edit Order
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(order.id)}>
                                                        <FiTrash2 className="me-2" /> Delete Order
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Order Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentOrder ? `Order Details: ${currentOrder.orderId}` : 'Create New Order'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    <Form.Control type="text" defaultValue={currentOrder?.customer} placeholder="Select customer" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Order Date</Form.Label>
                                    <Form.Control type="date" defaultValue={currentOrder?.date} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select defaultValue={currentOrder?.status}>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Payment Status</Form.Label>
                                    <Form.Select defaultValue={currentOrder?.payment}>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Notes</Form.Label>
                                    <Form.Control as="textarea" rows={3} placeholder="Internal notes or customer instructions..." />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Order'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SalesOrders;
